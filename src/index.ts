import type moment from "moment";
import { Notice, Plugin } from "obsidian";
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";

import { ConfirmationModal } from "./modal";
import { LogbookRenderer } from "./renderer";
import {
  DEFAULT_SETTINGS,
  ISettings,
  ThingsLogbookSettingsTab,
} from "./settings";

import {
  buildTasksFromSQLRecords,
  getChecklistItemsFromThingsLogbook,
  getTasksFromThingsLogbook,
  ITask,
} from "./things";
import { groupBy, isMacOS, updateSection } from "./textUtils";

declare global {
  interface Window {
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
    this.tryToSyncLogbook = this.tryToSyncLogbook.bind(this);

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
      new ConfirmationModal(this.app, {
        cta: "Sync",
        onAccept: async () => {
          await this.writeOptions({ hasAcceptedDisclaimer: true });
          this.syncLogbook();
        },
        text:
          "Enabling sync will backfill your entire Things Logbook into Obsidian. This means potentially creating or modifying hundreds of notes. Make sure to test the plugin in a test vault before continuing.",
        title: "Sync Now?",
      }).open();
    }
  }

  async tryToScheduleSync(): Promise<void> {
    if (this.options.hasAcceptedDisclaimer) {
      this.scheduleNextSync();
    } else {
      new ConfirmationModal(this.app, {
        cta: "Sync",
        onAccept: async () => {
          await this.writeOptions({ hasAcceptedDisclaimer: true });
          this.scheduleNextSync();
        },
        onCancel: async () => {
          await this.writeOptions({ isSyncEnabled: false });
          // update the settings tab display
          this.settingsTab.display();
        },
        text:
          "Enabling sync will backfill your entire Things Logbook into Obsidian. This means potentially creating or modifying hundreds of notes. Make sure to test the plugin in a test vault before continuing.",
        title: "Sync Now?",
      }).open();
    }
  }

  async syncLogbook(): Promise<void> {
    const logbookRenderer = new LogbookRenderer(this.app, this.options);
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
      tasks.filter((task) => task.stopDate).map((task) => task),
      (task) => window.moment.unix(task.stopDate).startOf("day").format()
    );

    for (const [dateStr, tasks] of Object.entries(daysToTasks)) {
      const date = window.moment(dateStr);

      let dailyNote = getDailyNote(date, dailyNotes);
      if (!dailyNote) {
        dailyNote = await createDailyNote(date);
      }

      await updateSection(
        this.app,
        dailyNote,
        this.options.sectionHeading,
        logbookRenderer.render(tasks)
      );
    }

    new Notice("Things Logbook sync complete");
    this.writeOptions({ latestSyncTime: window.moment().unix() });
    this.scheduleNextSync();
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

  async writeOptions(diff: Partial<ISettings>): Promise<void> {
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
