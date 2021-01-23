import * as os from "os";
import type { TFile } from "obsidian";

export function getHeadingLevel(line: string): number | null {
  const heading = line.match(/^(#{1,6})\s\b/);
  return heading ? heading[1].length : null;
}

export function toHeading(title: string, level: number): string {
  const hash = "".padStart(level, "#");
  return `${hash} ${title}`;
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
  return os.platform() === "darwin";
}

export async function updateSection(
  file: TFile,
  heading: string,
  sectionContents: string
): Promise<void> {
  const headingLevel = getHeadingLevel(heading);

  const { vault } = window.app;
  const fileContents = await vault.read(file);
  const fileLines = fileContents.split("\n");

  let logbookSectionLineNum = -1;
  let nextSectionLineNum = -1;

  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i] === heading) {
      logbookSectionLineNum = i;
    } else if (logbookSectionLineNum !== -1) {
      const currLevel = getHeadingLevel(fileLines[i]);
      if (currLevel && currLevel < headingLevel) {
        nextSectionLineNum = i;
        break;
      }
    }
  }

  // Section already exists, just replace
  if (logbookSectionLineNum !== -1) {
    const prefix = fileLines.slice(0, logbookSectionLineNum);
    const suffix =
      nextSectionLineNum !== -1 ? fileLines.slice(nextSectionLineNum) : [];

    return vault.modify(
      file,
      [...prefix, sectionContents, ...suffix].join("\n")
    );
  } else {
    return vault.modify(file, [...fileLines, "\n", sectionContents].join("\n"));
  }
}
