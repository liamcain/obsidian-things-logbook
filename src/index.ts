import type moment from "moment";
import { App, Notice, Plugin } from "obsidian";
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";
import {
  defaultSettings,
  DEFAULT_SECTION_HEADING,
  DEFAULT_TAG_PREFIX,
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

  async onload(): Promise<void> {
    if (!isMacOS()) {
      console.info(
        "Failed to load Things Logbook plugin. Platform not supported"
      );
      return;
    }

    this.scheduleNextSync = this.scheduleNextSync.bind(this);
    this.syncLogbook = this.syncLogbook.bind(this);
    this.renderTask = this.renderTask.bind(this);

    this.addCommand({
      id: "sync-things-logbook",
      name: "Sync",
      callback: () => setTimeout(this.syncLogbook, 20),
    });

    await this.loadOptions();

    this.addSettingTab(new ThingsLogbookSettingsTab(this.app, this));

    if (this.options.isSyncEnabled) {
      if (this.app.workspace.layoutReady) {
        this.scheduleNextSync();
      } else {
        this.registerEvent(
          this.app.workspace.on("layout-ready", this.scheduleNextSync)
        );
      }
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

    const jobPromises: Promise<void>[] = Object.entries(daysToTasks).map(
      async ([dateStr, tasks]) => {
        const date = window.moment(dateStr);

        let dailyNote = getDailyNote(date, dailyNotes);
        if (!dailyNote) {
          dailyNote = await createDailyNote(date);
        }
        return updateSection(dailyNote, "## Logbook", this.renderTasks(tasks));
      }
    );

    Promise.all(jobPromises).then(() => {
      new Notice("Things Logbook sync complete");
      this.writeOptions(() => ({ latestSyncTime: window.moment().unix() }));
      this.scheduleNextSync();
    });
  }

  renderTask(task: ITask): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = this.app.vault as any;
    const tab = getTab(vault.getConfig("useTab"), vault.getConfig("tabSize"));
    const prefix = this.options.tagPrefix ?? DEFAULT_TAG_PREFIX;

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
    const { sectionHeading = DEFAULT_SECTION_HEADING } = this.options;
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
    const options = { ...defaultSettings, ...this.options };
    const { isSyncEnabled, latestSyncTime, syncInterval } = options;

    if (!isSyncEnabled) {
      return;
    }

    const syncIntervalMs = syncInterval * 1000;
    const nextSync = Math.max(latestSyncTime + syncIntervalMs - now, 20);
    this.syncTimeoutId = window.setTimeout(this.syncLogbook, nextSync);
  }

  async loadOptions(): Promise<void> {
    this.options = (await this.loadData()) || {};
  }

  async writeOptions(
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ): Promise<void> {
    const diff = changeOpts(this.options);
    this.options = { ...this.options, ...diff };

    if (diff.syncInterval !== undefined && this.options.isSyncEnabled) {
      // reschedule if interval changed
      this.scheduleNextSync();
    }

    if (diff.isSyncEnabled !== undefined) {
      // Sync toggled on/off
      if (diff.isSyncEnabled) {
        this.scheduleNextSync();
      } else {
        this.cancelScheduledSync();
      }
    }

    await this.saveData(this.options);
  }
}
