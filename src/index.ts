import type moment from "moment";
import { App, Notice, Plugin } from "obsidian";
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";
import {
  defaultSettings,
  ISettings,
  ThingsLogbookSettingsTab,
} from "./settings";

import {
  getTasksFromThingsLogbook,
  SubTask,
  Task,
  TASK_FETCH_LIMIT,
} from "./things";
import {
  getHeadingLevel,
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

function renderTask(task: Task): string {
  return [
    `- [x] ${task.title}`,
    task.subtasks
      .map((subtask: SubTask) => `  - [x] ${subtask.title}`)
      .join("\n"),
  ].join("\n");
}

export default class ThingsLogbookPlugin extends Plugin {
  public options: ISettings;

  async onload(): Promise<void> {
    if (!isMacOS()) {
      console.info(
        "Failed to load Things Logbook plugin. Platform not supported"
      );
      return;
    }

    this.syncLogbook = this.syncLogbook.bind(this);

    this.addCommand({
      id: "sync-things-logbook",
      name: "Sync",
      callback: () => setTimeout(this.syncLogbook, 0),
    });

    await this.loadOptions();

    this.addSettingTab(new ThingsLogbookSettingsTab(this.app, this));
  }

  async syncLogbook(): Promise<void> {
    const dailyNotes = getAllDailyNotes();
    const jobPromises: Promise<void>[] = [];

    let latestSyncTime = this.options.latestSyncTime || 0;
    let isSyncCompleted = false;

    while (!isSyncCompleted) {
      const tasks: Task[] = await getTasksFromThingsLogbook(latestSyncTime);

      latestSyncTime = tasks[tasks.length - 1].stopDate;
      if (tasks.length < TASK_FETCH_LIMIT) {
        isSyncCompleted = true;
      }

      const daysToTasks: Record<string, Task[]> = groupBy(
        tasks.filter((task) => task.stopDate),
        (task) => window.moment.unix(task.stopDate).startOf("day").format()
      );

      Object.entries(daysToTasks).map(async ([dateStr, tasks]) => {
        const date = window.moment(dateStr);

        let dailyNote = getDailyNote(date, dailyNotes);
        if (!dailyNote) {
          dailyNote = await createDailyNote(date);
        }

        jobPromises.push(
          updateSection(dailyNote, "## Logbook", this.renderTasks(tasks))
        );
      });
    }

    Promise.all(jobPromises).then(() => {
      new Notice("Things Logbook sync complete");
      this.writeOptions(() => ({ latestSyncTime }));
    });
  }

  renderTasks(tasks: Task[]): string {
    const { sectionHeading } = this.options;
    const areas = groupBy<Task>(tasks, (task) => task.area || "");
    const headingLevel = getHeadingLevel(sectionHeading);

    const output = [sectionHeading];
    Object.entries(areas).map(([area, tasks]) => {
      if (area !== "") {
        output.push(toHeading(area, headingLevel + 1));
      }
      output.push(...tasks.map(renderTask));
    });

    return output.join("\n");
  }

  async loadOptions(): Promise<void> {
    const options = await this.loadData();
    this.options = Object.assign({}, defaultSettings, options);
  }

  async writeOptions(
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ): Promise<void> {
    const options = {
      ...this.options,
      ...changeOpts(this.options),
    };

    this.options = options;
    await this.saveData(options);
  }
}
