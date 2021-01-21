import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { env } from "process";

export default {
  input: "src/index.ts",
  output: {
    format: "cjs",
    dir: "dist",
  },
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    json(),
    typescript({ sourceMap: env.env === "DEV" }),
    resolve({
      browser: true,
    }),
    replace({
      delimiters: ["", ""],
      values: {
        "require('readable-stream/transform')": "require('stream').Transform",
        'require("readable-stream/transform")': 'require("stream").Transform',
        "readable-stream": "stream",
      },
    }),
    commonjs(),
  ],
};
