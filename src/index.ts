import type moment from "moment";
import { Plugin } from "obsidian";
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";

import { getTasksFromThingsLogbook, Task } from "src/things";

declare global {
  interface Window {
    moment: typeof moment;
  }
}

export default class ThingsLogbookPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      callback: this.syncLogbook.bind(this),
    });
  }

  async syncLogbook() {
    const dailyNotes = getAllDailyNotes();
    const tasks = await getTasksFromThingsLogbook();
    const daysToTasks: Record<string, Task[]> = {};

    tasks.forEach((task: Task) => {
      const stopDate = window.moment(task.stopDate * 1000);

      const key = stopDate.format();

      if (daysToTasks[key]) {
        daysToTasks[key].push(task);
      } else {
        daysToTasks[key] = [task];
      }
    });

    Object.entries(daysToTasks).forEach(async ([dateStr, tasks]) => {
      const date = window.moment(dateStr);

      let dailyNote = getDailyNote(date, dailyNotes);
      if (!dailyNote) {
        dailyNote = await createDailyNote(date);
      }

      const renderedTasks = "RENDERED_TASKS"; // TODO

      const metadata = this.app.metadataCache.getFileCache(dailyNote);

      const sectionIdx = metadata.headings.findIndex(
        (meta) => meta.heading === "Logbook"
      );
      // TODO this should take into account level

      const fileLines = (await this.app.vault.read(dailyNote)).split("\n");

      // Section already exists, just replace
      if (sectionIdx !== -1) {
        const start = metadata.headings[sectionIdx].position.start;
        const end = metadata.headings[sectionIdx].position.start;

        const prefix = fileLines.slice(0, start.line);
        const suffix = fileLines.slice(end.line);

        this.app.vault.modify(
          dailyNote,
          [prefix, renderedTasks, suffix].join("\n")
        );
      } else {
        this.app.vault.modify(
          dailyNote,
          [...fileLines, "\n", renderedTasks].join("\n")
        );
      }
    });
  }
}
