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

import { getTasksFromThingsLogbook, SubTask, Task } from "./things";
import { isMacOS, updateSection } from "./utils";

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

function renderTasks(tasks: Task[]): string {
  return `## Logbook
${tasks.map(renderTask).join("\n")} 
  `;
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
    const tasks: Task[] = await getTasksFromThingsLogbook();
    const daysToTasks: Record<string, Task[]> = {};

    tasks
      .filter((task) => task.stopDate)
      .forEach((task: Task) => {
        const stopDate = window.moment.unix(task.stopDate);
        const key = stopDate.startOf("day").format();

        if (daysToTasks[key]) {
          daysToTasks[key].push(task);
        } else {
          daysToTasks[key] = [task];
        }
      });

    const jobPromises: Promise<void>[] = [];
    Object.entries(daysToTasks).forEach(async ([dateStr, tasks]) => {
      const date = window.moment(dateStr);

      let dailyNote = getDailyNote(date, dailyNotes);
      if (!dailyNote) {
        dailyNote = await createDailyNote(date);
      }

      jobPromises.push(
        updateSection(dailyNote, "## Logbook", renderTasks(tasks))
      );
    });

    Promise.all(jobPromises).then(
      () => new Notice("Things Logbook sync complete")
    );
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
