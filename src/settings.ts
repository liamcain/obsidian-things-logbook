import { App, PluginSettingTab, Setting } from "obsidian";

import type ThingsLogbookPlugin from "./index";

export const DEFAULT_SECTION_HEADING = "## Logbook";
export const DEFAULT_SYNC_FREQUENCY_SECONDS = 30 * 60; // Every 30 minutes

export interface ISettings {
  latestSyncTime: number;
  sectionHeading: string;
  syncInterval: number;
}

export const defaultSettings = Object.freeze({
  latestSyncTime: 0,
  syncInterval: DEFAULT_SYNC_FREQUENCY_SECONDS,
  sectionHeading: DEFAULT_SECTION_HEADING,
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
    this.addSyncIntervalSetting();
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

  addSyncIntervalSetting(): void {
    new Setting(this.containerEl)
      .setName("Sync Frequency")
      .setDesc("Number of seconds the plugin will wait before syncing again")
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_SYNC_FREQUENCY_SECONDS));
        textfield.inputEl.type = "number";
        textfield.setValue(String(this.plugin.options.syncInterval));
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            syncInterval: value !== "" ? Number(value) : undefined,
          }));
        });
      });
  }
}
