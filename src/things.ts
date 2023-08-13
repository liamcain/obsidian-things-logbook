import * as os from "os";
import * as fs from "fs";

import { THINGS_DB_PATH_START, THINGS_DB_PATH_END } from "./constants";
import { querySqliteDB } from "./sqlite";

export const TASK_FETCH_LIMIT = 1000;

export interface ISubTask {
  completed: boolean;
  title: string;
}

export interface ITask {
  uuid: string;
  title: string;
  notes: string;
  area?: string;
  tags: string[];
  startDate: number;
  stopDate: number;
  cancelled: boolean;
  subtasks: ISubTask[];
}

export interface ITaskRecord {
  uuid: string;
  title?: string;
  notes: string;
  area?: string;
  startDate: number;
  stopDate: number;
  status: string;
  tag?: string;
}

export interface IChecklistItemRecord {
  uuid: string;
  taskId: string;
  title: string;
  startDate: number;
  stopDate: number;
}

const baseDir = THINGS_DB_PATH_START.replace("~", os.homedir());
const dataPath = fs.readdirSync(baseDir).filter((file) => file.startsWith("ThingsData"))[0];
const thingsSqlitePath = baseDir + "/" + dataPath + "/" + THINGS_DB_PATH_END;

export class ThingsSQLiteSyncError extends Error {}


const STATUS_CANCELLED = 2;

export function buildTasksFromSQLRecords(
  taskRecords: ITaskRecord[],
  checklistRecords: IChecklistItemRecord[]
): ITask[] {
  const tasks: Record<string, ITask> = {};
  taskRecords.forEach(({ tag, ...task }) => {
    const id = task.uuid;
    const { status, title, ...other } = task;

    if (tasks[id]) {
      tasks[id].tags.push(tag);
    } else {
      tasks[id] = {
        ...other,
        cancelled: STATUS_CANCELLED === Number.parseInt(status),
        title: (title || "").trimEnd(),
        subtasks: [],
        tags: [tag],
      };
    }
  });

  checklistRecords.forEach(({ taskId, title, stopDate }) => {
    const task = tasks[taskId];
    const subtask = {
      completed: !!stopDate,
      title: title.trimEnd(),
    };

    // checklist item might be completed before task
    if (task) {
      if (task.subtasks) {
        task.subtasks.push(subtask);
      } else {
        task.subtasks = [subtask];
      }
    }
  });

  return Object.values(tasks);
}

async function getTasksFromThingsDb(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  return querySqliteDB<ITaskRecord>(
    thingsSqlitePath,
    `SELECT
        TMTask.uuid as uuid,
        TMTask.title as title,
        TMTask.notes as notes,
        TMTask.startDate as startDate,
        TMTask.stopDate as stopDate,
        TMTask.status as status,
        TMArea.title as area,
        TMTag.title as tag
    FROM
        TMTask
    LEFT JOIN TMTaskTag
        ON TMTaskTag.tasks = TMTask.uuid
    LEFT JOIN TMTag
        ON TMTag.uuid = TMTaskTag.tags
    LEFT JOIN TMArea
        ON TMTask.area = TMArea.uuid
    WHERE
        TMTask.trashed = 0
        AND TMTask.stopDate IS NOT NULL
        AND TMTask.stopDate > ${latestSyncTime}
    ORDER BY
        TMTask.stopDate
    LIMIT ${TASK_FETCH_LIMIT}
        `
  );
}

async function getChecklistItemsThingsDb(
  latestSyncTime: number
): Promise<IChecklistItemRecord[]> {
  return querySqliteDB<IChecklistItemRecord>(
    thingsSqlitePath,
    `SELECT
        task as taskId,
        title as title,
        stopDate as stopDate
    FROM
        TMChecklistItem
    WHERE
        stopDate > ${latestSyncTime}
        AND title IS NOT ""
    ORDER BY
        stopDate
    LIMIT ${TASK_FETCH_LIMIT}
        `
  );
}

export async function getTasksFromThingsLogbook(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  const taskRecords: ITaskRecord[] = [];
  let isSyncCompleted = false;
  let stopTime = window.moment.unix(latestSyncTime).startOf("day").unix();

  try {
    while (!isSyncCompleted) {
      console.debug("[Things Logbook] fetching tasks from sqlite db...");

      const batch = await getTasksFromThingsDb(stopTime);

      isSyncCompleted = batch.length < TASK_FETCH_LIMIT;
      stopTime = batch.filter((t) => t.stopDate).last()?.stopDate;

      taskRecords.push(...batch);
      console.debug(
        `[Things Logbook] fetched ${batch.length} tasks from sqlite db`
      );
    }
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
    throw new ThingsSQLiteSyncError("fetch Tasks failed");
  }

  return taskRecords;
}

export async function getChecklistItemsFromThingsLogbook(
  latestSyncTime: number
): Promise<IChecklistItemRecord[]> {
  const checklistItems: IChecklistItemRecord[] = [];
  let isSyncCompleted = false;
  let stopTime = latestSyncTime;

  try {
    while (!isSyncCompleted) {
      console.debug(
        "[Things Logbook] fetching checklist items from sqlite db..."
      );

      const batch = await getChecklistItemsThingsDb(stopTime);

      isSyncCompleted = batch.length < TASK_FETCH_LIMIT;
      stopTime = batch.filter((t) => t.stopDate).last()?.stopDate;

      checklistItems.push(...batch);
      console.debug(
        `[Things Logbook] fetched ${batch.length} checklist items from sqlite db`
      );
    }
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
    throw new ThingsSQLiteSyncError("fetch Subtasks failed");
  }

  return checklistItems;
}
