import * as sqlite3 from "sqlite3";
import * as util from "util";

import { THINGS_DB_PATH } from "./contants";

export interface SubTask {
  title: string;
}

export interface Task {
  uuid: string;
  title: string;
  notes: string;
  project: string;
  startDate: number;
  stopDate: number;
  subtasks: SubTask[];
}

export interface TaskMap {
  [key: string]: Task;
}

export interface DateToTaskMap {
  [key: string]: TaskMap;
}

async function getTasksFromThingsDb(): Promise<Task[]> {
  const thingsDb = new sqlite3.Database(THINGS_DB_PATH, sqlite3.OPEN_READONLY);
  const daysToTasks: DateToTaskMap = {};

  return util.promisify(thingsDb.each)(
    `
    SELECT
        TMTask.uuid as uuid,
        TMTask.title as title,
        TMTask.notes as notes,
        TMTask.project as project,
        TMTask.startDate startDate,
        TMTask.stopDate as stopDate,
        TMChecklistItem.title AS subtask
    FROM
        TMChecklistItem,
        TMTask
    WHERE
        TMTask.trashed = 0 
        AND TMTask.stopDate IS NOT NULL 
        AND TMTask.uuid = TMChecklistItem.task
    ORDER BY
        TMTask.stopDate
        `
  );

  // for each day in MAP_DAY_TO_TASKS, if YYYY-MM-dd.md exists, prepend it somehow. otherwise, create new note with list at top.
  // use this.app.metdataCache.metadataCache.<hash>.headings
}

export async function getTasksFromThingsLogbook(): Promise<Task[]> {
  try {
    const completedTasks = await getTasksFromThingsDb();
    return completedTasks;
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
  }
}
