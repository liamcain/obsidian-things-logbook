import { spawn } from "child_process";

declare const self: DedicatedWorkerGlobalScope;
export {};

self.addEventListener("message", (e: MessageEvent) => {
  // console.debug("Worker: received dbPath and query from main thread");
  const [dbPath, query] = e.data;

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

  spawned.on("close", (code) => self.postMessage({ stdErr, stdOut, code }));
  spawned.on("exit", (code) => self.postMessage({ stdErr, stdOut, code }));
});

// export async function handleSqliteQuery(
//   dbPath: string,
//   query: string
// ) {
//   return new Promise((done) => {
//     const stdOut: Buffer[] = [];
//     const stdErr: Buffer[] = [];

//     const spawned = spawn("sqlite3", [
//       dbPath,
//       "-header",
//       "-csv",
//       "-readonly",
//       query,
//     ]);

//     spawned.stdout.on("data", (buffer: Buffer) => {
//       stdOut.push(buffer);
//     });
//     spawned.stderr.on("data", (buffer: Buffer) => {
//       stdErr.push(buffer);
//     });

//     spawned.on("error", (err: Error) => {
//       stdErr.push(Buffer.from(String(err.stack), "ascii"));
//     });
//     spawned.on("close", (code: number) => done({ stdErr, stdOut, code }));
//     spawned.on("exit", (code: number) => done({ stdErr, stdOut, code }));
//   });
// }
