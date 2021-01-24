import * as os from "os";
import { spawn } from "child_process";
import Papa from "papaparse";

import { THINGS_DB_PATH } from "./constants";

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
  subtasks: ISubTask[];
}

export interface ITaskRecord {
  uuid: string;
  title: string;
  notes: string;
  area?: string;
  startDate: number;
  stopDate: number;
  tag?: string;
}

export interface IChecklistItemRecord {
  uuid: string;
  taskId: string;
  title: string;
  startDate: number;
  stopDate: number;
}

interface ISpawnResults {
  stdOut: Buffer[];
  stdErr: Buffer[];
  code: number;
}

function parseCSV<T>(csv: Buffer[]): T[] {
  const lines = Buffer.concat(csv).toString("utf-8");
  return Papa.parse<T>(lines, {
    dynamicTyping: true,
    header: true,
    newline: "\n",
  }).data;
}

async function queryThingsDb(query: string): Promise<ISpawnResults> {
  const dbPath = THINGS_DB_PATH.replace("~", os.homedir());

  return new Promise((done) => {
    const stdOut: Buffer[] = [];
    const stdErr: Buffer[] = [];

    const spawned = spawn("sqlite3", [
      dbPath,
      "-header",
      "-csv",
      "-readonly",
      query,
    ]);

    spawned.stdout.on("data", (buffer: Buffer) => {
      stdOut.push(buffer);
    });
    spawned.stderr.on("data", (buffer: Buffer) => {
      stdErr.push(buffer);
    });

    spawned.on("error", (err: Error) => {
      stdErr.push(Buffer.from(String(err.stack), "ascii"));
    });
    spawned.on("close", (code: number) => done({ stdErr, stdOut, code }));
    spawned.on("exit", (code: number) => done({ stdErr, stdOut, code }));
  });
}

export function buildTasksFromSQLRecords(
  taskRecords: ITaskRecord[],
  checklistRecords: IChecklistItemRecord[]
): ITask[] {
  const tasks: Record<string, ITask> = {};
  taskRecords.forEach(({ tag, ...task }) => {
    const id = task.uuid;
    if (tasks[id]) {
      tasks[id].tags.push(tag);
    } else {
      tasks[id] = {
        ...task,
        subtasks: [],
        tags: [tag],
      };
    }
  });

  checklistRecords.forEach(({ taskId, title, stopDate }) => {
    const task = tasks[taskId];
    const subtask = {
      completed: !!stopDate,
      title,
    };
    if (task.subtasks) {
      task.subtasks.push(subtask);
    } else {
      task.subtasks = [subtask];
    }
  });

  return Object.values(tasks);
}

async function getTasksFromThingsDb(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  const { stdOut, stdErr } = await queryThingsDb(
    `SELECT
        TMTask.uuid as uuid,
        TMTask.title as title,
        TMTask.notes as notes,
        TMTask.startDate as startDate,
        TMTask.stopDate as stopDate,
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

  if (stdErr.length) {
    const error = Buffer.concat(stdErr).toString("utf-8");
    return Promise.reject(error);
  }

  return parseCSV(stdOut);
}

async function getChecklistItemsThingsDb(
  latestSyncTime: number
): Promise<IChecklistItemRecord[]> {
  const { stdOut, stdErr } = await queryThingsDb(
    `SELECT
        task as taskId,
        title as title,
        stopDate as stopDate
    FROM
        TMChecklistItem
    WHERE
        stopDate > ${latestSyncTime}
    ORDER BY
        stopDate
    LIMIT ${TASK_FETCH_LIMIT}
        `
  );

  if (stdErr.length) {
    const error = Buffer.concat(stdErr).toString("utf-8");
    return Promise.reject(error);
  }

  return parseCSV(stdOut);
}

export async function getTasksFromThingsLogbook(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  const taskRecords: ITaskRecord[] = [];
  let isSyncCompleted = false;
  let stopTime = latestSyncTime;

  try {
    while (!isSyncCompleted) {
      console.debug("[Things Logbook] fetching tasks from sqlite db...");

      const batch = await getTasksFromThingsDb(stopTime);

      isSyncCompleted = batch.length < TASK_FETCH_LIMIT;
      stopTime = batch.filter((t) => t.stopDate).last()?.stopDate;

      taskRecords.push(...batch);
    }
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
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
    }
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
  }

  return checklistItems;
}
