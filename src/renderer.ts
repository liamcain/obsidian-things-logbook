import { App } from "obsidian";
import { ISettings } from "./settings";
import { ISubTask, ITask } from "./things";
import { getHeadingLevel, getTab, groupBy, toHeading } from "./textUtils";

export class LogbookRenderer {
  private app: App;
  private settings: ISettings;

  constructor(app: App, settings: ISettings) {
    this.app = app;
    this.settings = settings;
    this.renderTask = this.renderTask.bind(this);
  }

  renderTask(task: ITask): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = this.app.vault as any;
    const tab = getTab(vault.getConfig("useTab"), vault.getConfig("tabSize"));
    const prefix = this.settings.tagPrefix;

    const tags = task.tags
      .filter((tag) => !!tag)
      .map((tag) => tag.replace(/\s+/g, "-").toLowerCase())
      .map((tag) => `#${prefix}${tag}`)
      .join(" ");

    const taskTitle = `[${task.title}](things:///show?id=${task.uuid}) ${tags}`.trimEnd()

    return [
      `- [x] ${taskTitle}`,
      ...String(task.notes || "")
        .trimEnd()
        .split("\n")
        .filter((line) => !!line)
        .map((noteLine) => `${tab}${noteLine}`),
      ...task.subtasks.map(
        (subtask: ISubTask) =>
          `${tab}- [${subtask.completed ? "x" : " "}] ${subtask.title}`
      ),
    ]
      .filter((line) => !!line)
      .join("\n");
  }

  public render(tasks: ITask[]): string {
    const { sectionHeading } = this.settings;
    const areas = groupBy<ITask>(tasks, (task) => task.area || "");
    const headingLevel = getHeadingLevel(sectionHeading);

    const output = [sectionHeading];
    Object.entries(areas).map(([area, tasks]) => {
      if (area !== "") {
        output.push(toHeading(area, headingLevel + 1));
      }
      output.push(...tasks.map(this.renderTask));
    });

    return output.join("\n");
  }
}
