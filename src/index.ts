import type moment from "moment";
import { App, Notice, Plugin } from "obsidian";
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";

import { createConfirmationDialog } from "./modal";
import {
  DEFAULT_SETTINGS,
  ISettings,
  ThingsLogbookSettingsTab,
} from "./settings";

import {
  buildTasksFromSQLRecords,
  getChecklistItemsFromThingsLogbook,
  getTasksFromThingsLogbook,
  ISubTask,
  ITask,
} from "./things";
import {
  getHeadingLevel,
  getTab,
  groupBy,
  isMacOS,
  toHeading,
  updateSection,
} from "./utils";

declare global {
  interface Window {
    app: App;
    moment: typeof moment;
  }
}

export default class ThingsLogbookPlugin extends Plugin {
  public options: ISettings;
  private syncTimeoutId: number;
  private settingsTab: ThingsLogbookSettingsTab;

  async onload(): Promise<void> {
    if (!isMacOS()) {
      console.info(
        "Failed to load Things Logbook plugin. Platform not supported"
      );
      return;
    }

    this.scheduleNextSync = this.scheduleNextSync.bind(this);
    this.syncLogbook = this.syncLogbook.bind(this);
    this.tryToScheduleSync = this.tryToScheduleSync.bind(this);
    this.renderTask = this.renderTask.bind(this);

    this.addCommand({
      id: "sync-things-logbook",
      name: "Sync",
      callback: () => setTimeout(this.tryToSyncLogbook, 20),
    });

    await this.loadOptions();

    this.settingsTab = new ThingsLogbookSettingsTab(this.app, this);
    this.addSettingTab(this.settingsTab);

    if (this.options.hasAcceptedDisclaimer && this.options.isSyncEnabled) {
      if (this.app.workspace.layoutReady) {
        this.scheduleNextSync();
      } else {
        this.registerEvent(
          this.app.workspace.on("layout-ready", this.scheduleNextSync)
        );
      }
    }
  }

  async tryToSyncLogbook(): Promise<void> {
    if (this.options.hasAcceptedDisclaimer) {
      this.syncLogbook();
    } else {
      createConfirmationDialog({
        cta: "Sync",
        onAccept: async () => {
          await this.writeOptions(() => ({
            hasAcceptedDisclaimer: true,
          }));
          this.syncLogbook();
        },
        text:
          "Enabling sync will backfill your entire Things Logbook into Obsidian. This means potentially creating or modifying hundreds of notes. Make sure to test the plugin in a test vault before continuing.",
        title: "Sync Now?",
      });
    }
  }

  async tryToScheduleSync(): Promise<void> {
    if (this.options.hasAcceptedDisclaimer) {
      this.scheduleNextSync();
    } else {
      createConfirmationDialog({
        cta: "Sync",
        onAccept: async () => {
          await this.writeOptions(() => ({
            hasAcceptedDisclaimer: true,
          }));
          this.scheduleNextSync();
        },
        onCancel: async () => {
          await this.writeOptions(() => ({
            isSyncEnabled: false,
          }));
          // update the settings tab display
          this.settingsTab.display();
        },
        text:
          "Enabling sync will backfill your entire Things Logbook into Obsidian. This means potentially creating or modifying hundreds of notes. Make sure to test the plugin in a test vault before continuing.",
        title: "Sync Now?",
      });
    }
  }

  async syncLogbook(): Promise<void> {
    const dailyNotes = getAllDailyNotes();
    const latestSyncTime = this.options.latestSyncTime || 0;

    let taskRecords = [];
    let checklistRecords = [];
    try {
      taskRecords = await getTasksFromThingsLogbook(latestSyncTime);
      checklistRecords = await getChecklistItemsFromThingsLogbook(
        latestSyncTime
      );
    } catch (err) {
      new Notice("Things Logbook sync failed");
      return;
    }

    const tasks: ITask[] = buildTasksFromSQLRecords(
      taskRecords,
      checklistRecords
    );

    const daysToTasks: Record<string, ITask[]> = groupBy(
      tasks.filter((task) => task.stopDate),
      (task) => window.moment.unix(task.stopDate).startOf("day").format()
    );

    Object.entries(daysToTasks).map(async ([dateStr, tasks]) => {
      const date = window.moment(dateStr);

      let dailyNote = getDailyNote(date, dailyNotes);
      if (!dailyNote) {
        dailyNote = await createDailyNote(date);
      }

      await updateSection(dailyNote, "## Logbook", this.renderTasks(tasks));
    });

    new Notice("Things Logbook sync complete");
    this.writeOptions(() => ({
      hasAcceptedDisclaimer: true,
      latestSyncTime: window.moment().unix(),
    }));
    this.scheduleNextSync();
  }

  renderTask(task: ITask): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = this.app.vault as any;
    const tab = getTab(vault.getConfig("useTab"), vault.getConfig("tabSize"));
    const prefix = this.options.tagPrefix;

    const tags = task.tags
      .filter((tag) => !!tag)
      .map((tag) => tag.replace(/\s+/g, "-").toLowerCase())
      .map((tag) => `#${prefix}${tag}`)
      .join(" ");

    return [
      `- [x] ${task.title} ${tags}`.trimEnd(),
      ...(task.notes || "")
        .trimEnd()
        .split("\n")
        .filter((line) => !!line)
        .map((noteLine) => `${tab}- ${noteLine}`),
      ...task.subtasks.map(
        (subtask: ISubTask) =>
          `${tab}- [${subtask.completed ? "x" : " "}] ${subtask.title}`
      ),
    ]
      .filter((line) => !!line)
      .join("\n");
  }

  renderTasks(tasks: ITask[]): string {
    const { sectionHeading } = this.options;
    const areas = groupBy<ITask>(tasks, (task) => task.area || "");
    const headingLevel = getHeadingLevel(sectionHeading);

    const output = [sectionHeading];
    Object.entries(areas).map(([area, tasks]) => {
      if (area !== "") {
        output.push(toHeading(area, headingLevel + 1));
      }
      output.push(...tasks.map(this.renderTask));
    });

    return output.join("\n");
  }

  cancelScheduledSync(): void {
    if (this.syncTimeoutId !== undefined) {
      window.clearTimeout(this.syncTimeoutId);
    }
  }

  scheduleNextSync(): void {
    const now = window.moment().unix();

    this.cancelScheduledSync();
    if (!this.options.isSyncEnabled || !this.options.syncInterval) {
      console.debug("[Things Logbook] scheduling skipped, no syncInterval set");
      return;
    }

    const { latestSyncTime, syncInterval } = this.options;
    const syncIntervalMs = syncInterval * 1000;
    const nextSync = Math.max(latestSyncTime + syncIntervalMs - now, 20);

    console.debug(`[Things Logbook] next sync scheduled in ${nextSync}ms`);
    this.syncTimeoutId = window.setTimeout(this.syncLogbook, nextSync);
  }

  async loadOptions(): Promise<void> {
    this.options = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.options.hasAcceptedDisclaimer) {
      // In case the user quits before accepting sync modal,
      // this keep the settings in sync
      this.options.isSyncEnabled = false;
    }
  }

  async writeOptions(
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ): Promise<void> {
    const diff = changeOpts(this.options);
    this.options = Object.assign(this.options, diff);

    // Sync toggled on/off
    if (diff.isSyncEnabled !== undefined) {
      if (diff.isSyncEnabled) {
        this.tryToScheduleSync();
      } else {
        this.cancelScheduledSync();
      }
    } else if (diff.syncInterval !== undefined && this.options.isSyncEnabled) {
      // reschedule if interval changed
      this.tryToScheduleSync();
    }

    await this.saveData(this.options);
  }
}
