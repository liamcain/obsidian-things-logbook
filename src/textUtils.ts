import type { App, TFile } from "obsidian";
import { getEditorForFile } from "./fileUtils";

export function getHeadingLevel(line = ""): number | null {
  const heading = line.match(/^(#{1,6})\s+\S/);
  return heading ? heading[1].length : null;
}

export function toHeading(title: string, level: number, addEmptyLine: boolean): string {
  const emptyLine = addEmptyLine ? "\n" : "";
  const hash = "".padStart(level, "#");
  return `${emptyLine}${hash} ${title}`;
}

export function getTab(useTab: boolean, tabSize: number): string {
  if (useTab) {
    return "\t";
  }
  return "".padStart(tabSize, " ");
}

export function groupBy<T>(
  arr: T[],
  predicate: (item: T) => string | number
): Record<string | number, T[]> {
  return arr.reduce((acc, elem) => {
    const val = predicate(elem);
    acc[val] = acc[val] || [];
    acc[val].push(elem);
    return acc;
  }, {} as Record<string | number, T[]>);
}

export function isMacOS(): boolean {
  return navigator.appVersion.indexOf("Mac") !== -1;
}

export async function updateSection(
  app: App,
  file: TFile,
  heading: string,
  sectionContents: string
): Promise<void> {
  const headingLevel = getHeadingLevel(heading);

  const { vault } = app;
  const fileContents = await vault.read(file);
  const fileLines = fileContents.split("\n");

  let logbookSectionLineNum = -1;
  let nextSectionLineNum = -1;

  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].trim() === heading) {
      logbookSectionLineNum = i;
    } else if (logbookSectionLineNum !== -1) {
      const currLevel = getHeadingLevel(fileLines[i]);
      if (currLevel && currLevel <= headingLevel) {
        nextSectionLineNum = i;
        break;
      }
    }
  }

  const editor = getEditorForFile(app, file);
  if (editor) {
    // if the "## Logbook" header exists, we just replace the
    // section. If it doesn't, we need to append it to the end
    // if the file and add `\n` for separation.
    if (logbookSectionLineNum !== -1) {
      const from = { line: logbookSectionLineNum, ch: 0 };
      const to =
        nextSectionLineNum !== -1
          ? { line: nextSectionLineNum - 1, ch: 0 }
          : { line: fileLines.length, ch: 0 };
      editor.replaceRange(`${sectionContents}\n`, from, to);
      return;
    } else {
      const pos = { line: fileLines.length, ch: 0 };
      editor.replaceRange(`\n\n${sectionContents}`, pos, pos);
      return;
    }
  }

  // Editor is not open, modify the file on disk...
  if (logbookSectionLineNum !== -1) {
    // Section already exists, just replace
    const prefix = fileLines.slice(0, logbookSectionLineNum);
    const suffix =
      nextSectionLineNum !== -1 ? fileLines.slice(nextSectionLineNum) : [];

    return vault.modify(
      file,
      [...prefix, sectionContents, ...suffix].join("\n")
    );
  } else {
    // Section does not exist, append to end of file.
    return vault.modify(file, [...fileLines, "", sectionContents].join("\n"));
  }
}
