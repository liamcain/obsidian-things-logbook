import * as os from "os";
import { spawn } from "child_process";
import Papa from "papaparse";

import { THINGS_DB_PATH } from "./constants";

export const TASK_FETCH_LIMIT = 1000;

export interface SubTask {
  completed: boolean;
  title: string;
}

export interface Task {
  uuid: string;
  title: string;
  notes: string;
  area: string;
  startDate: number;
  stopDate: number;
  subtasks: SubTask[];
}

export interface ITaskRecord {
  uuid: string;
  title: string;
  notes: string;
  area: string;
  startDate: number;
  stopDate: number;
  subtaskTitle: string;
  subtaskStopDate: number;
}

interface ISpawnResults {
  stdOut: Buffer[];
  stdErr: Buffer[];
  code: number;
}

function parseCSV(csv: Buffer[]): ITaskRecord[] {
  const lines = Buffer.concat(csv).toString("utf-8");
  return Papa.parse<ITaskRecord>(lines, {
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

function reformatTaskRecords(taskRecords: ITaskRecord[]): Task[] {
  const tasks: Record<string, Task> = {};
  taskRecords.forEach(({ subtaskTitle, subtaskStopDate, ...task }) => {
    const id = task.uuid;
    const subtask = {
      completed: !!subtaskStopDate,
      title: subtaskTitle,
    };
    if (tasks[id]) {
      tasks[id].subtasks.push(subtask);
    } else {
      tasks[id] = {
        ...task,
        subtasks: [subtask],
      };
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
        TMChecklistItem.title as subtaskTitle,
        TMChecklistItem.stopDate as subtaskStopDate,
        TMArea.title as area
    FROM
        TMChecklistItem,
        TMTask
    LEFT JOIN TMArea ON TMTask.area = TMArea.uuid
    WHERE
        TMTask.trashed = 0
        AND TMTask.stopDate IS NOT NULL
        AND TMTask.stopDate > ${latestSyncTime}
        AND TMChecklistItem.title != ""
        AND TMTask.uuid = TMChecklistItem.task
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

export async function getTasksFromThingsLogbook(
  latestSyncTime: number
): Promise<Task[]> {
  const completedTasks: Task[] = [];
  let isSyncCompleted = false;
  let stopTime = latestSyncTime;

  try {
    while (!isSyncCompleted) {
      console.debug("[Things Logbook] fetching from sqlite db...");
      const taskRecords = await getTasksFromThingsDb(stopTime);
      const tasks = reformatTaskRecords(taskRecords);
      completedTasks.push(...tasks);

      if (taskRecords.length < TASK_FETCH_LIMIT) {
        isSyncCompleted = true;
      }
      // Use last task's stopTime to update the fetch window
      stopTime = tasks.filter((t) => t?.stopDate).last()?.stopDate;
    }
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
  }

  return completedTasks;
}
