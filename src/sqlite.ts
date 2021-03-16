import Papa from "papaparse";

import SqliteWorker from "web-worker:./SqliteWorker.ts";

export const TASK_FETCH_LIMIT = 1000;

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

async function handleSqliteQuery(
  dbPath: string,
  query: string
): Promise<ISpawnResults> {
  return new Promise((done) => {
    const worker = new SqliteWorker();
    worker.postMessage([dbPath, query]);
    worker.onmessage = (e: MessageEvent) => {
      done(e.data);
    };
  });
}

export async function querySqliteDB<T>(
  dbPath: string,
  query: string
): Promise<T[]> {
  const { stdOut, stdErr } = await handleSqliteQuery(dbPath, query);
  if (stdErr.length) {
    const error = Buffer.concat(stdErr).toString("utf-8");
    return Promise.reject(error);
  }
  return parseCSV<T>(stdOut);
}
