import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import { env } from "process";

export default {
  input: "src/index.ts",
  output: {
    format: "cjs",
    file: "main.js",
    exports: "default",
  },
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    typescript({ sourceMap: env.env === "DEV" }),
    resolve({
      browser: true,
    }),
    webWorkerLoader({ targetPlatform: "browser", preserveSource: true }),
    commonjs(),
  ],
};
