import { App, PluginSettingTab, Setting } from "obsidian";

import type ThingsLogbookPlugin from "./index";

const DEFAULT_SECTION_HEADING = "## Logbook";

export interface ISettings {
  sectionHeading: string;
}

export const defaultSettings = Object.freeze({
  sectionheading: DEFAULT_SECTION_HEADING,
});

export class ThingsLogbookSettingsTab extends PluginSettingTab {
  private plugin: ThingsLogbookPlugin;

  constructor(app: App, plugin: ThingsLogbookPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.addSectionHeadingSetting();
  }

  addSectionHeadingSetting(): void {
    new Setting(this.containerEl)
      .setName("Section heading")
      .setDesc(
        "Markdown heading to use when adding the logbook to a daily note"
      )
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_SECTION_HEADING));
        textfield.inputEl.type = "number";
        textfield.setValue(String(this.plugin.options.sectionHeading));
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            sectionHeading: value !== "" ? value : undefined,
          }));
        });
      });
  }
}
