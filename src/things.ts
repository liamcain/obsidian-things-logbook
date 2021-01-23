import * as os from "os";
import { spawn } from "child_process";
import Papa from "papaparse";

import { THINGS_DB_PATH } from "./constants";

export interface SubTask {
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
  subtask: string;
}

export interface TaskMap {
  [key: string]: Task;
}

export interface DateToTaskMap {
  [key: string]: TaskMap;
}

interface ISpawnResults {
  stdOut: Buffer[];
  stdErr: Buffer[];
  code: number;
}

// type ISchemaType = "number" | "string";
// interface ISchema {
//   name: string;
//   type: ISchemaType;
// }

function parseCSV(csv: Buffer[]): ITaskRecord[] {
  const lines = Buffer.concat(csv).toString("utf-8");
  return Papa.parse<ITaskRecord>(lines, {
    dynamicTyping: true,
    header: true,
    newline: "\n",
  }).data;
  // return lines.map((line, idx) => {
  //   const record: Record<string, unknown> = {};
  //   const components = line.split("|");

  //   for (let i = 0; i < headers.length; i++) {
  //     const { name, type } = headers[i];
  //     if (idx === 0) {
  //       console.log("components", components, components.length);
  //     }

  //     record[name] =
  //       type === "number" ? parseFloat(components[i]) : components[i];
  //   }
  //   return record as T;
  // });
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

async function getTasksFromThingsDb(): Promise<Task[]> {
  const offset = 0;
  const { stdOut, stdErr } = await queryThingsDb(
    `SELECT
        TMTask.uuid as uuid,
        TMTask.title as title,
        TMTask.notes as notes,
        TMTask.startDate as startDate,
        TMTask.stopDate as stopDate,
        TMChecklistItem.title as subtask
        TMArea.title as area,
    FROM
        TMChecklistItem,
        TMTask
    WHERE
        TMTask.trashed = 0
        AND TMTask.stopDate IS NOT NULL
        AND TMChecklistItem.title != ""
        AND TMTask.uuid = TMChecklistItem.task
        AND TMTask.area = TMArea.uuid
    ORDER BY
        TMTask.stopDate
    LIMIT 1000
    OFFSET ${offset}
        `
  );

  if (stdErr.length) {
    const error = Buffer.concat(stdErr).toString("utf-8");
    return Promise.reject(error);
  }

  // const asNumber = (name: string) => ({ name, type: "number" as ISchemaType });
  // const asString = (name: string) => ({ name, type: "string" as ISchemaType });
  // const headers: ISchema[] = [
  //   asString("uuid"),
  //   asString("title"),
  //   asString("notes"),
  //   asString("project"),
  //   asNumber("startDate"),
  //   asNumber("stopDate"),
  //   asString("subtask"),
  // ];

  const taskRecords = parseCSV(stdOut);

  console.log("raw records", taskRecords);

  const tasks: Record<string, Task> = {};
  taskRecords.forEach(({ subtask, ...task }) => {
    const id = task.uuid;
    if (tasks[id]) {
      tasks[id].subtasks.push({ title: subtask });
    } else {
      tasks[id] = {
        ...task,
        subtasks: [
          {
            title: subtask,
          },
        ],
      };
    }
  });

  return Object.values(tasks);
}

export async function getTasksFromThingsLogbook(): Promise<Task[]> {
  try {
    const completedTasks = await getTasksFromThingsDb();
    console.log("completedTasks", completedTasks);
    return completedTasks;
  } catch (err) {
    console.error("[Things Logbook] Failed to query the Things SQLite DB", err);
  }
}
