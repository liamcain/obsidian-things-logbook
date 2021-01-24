import { App, PluginSettingTab, Setting } from "obsidian";

import type ThingsLogbookPlugin from "./index";

export const DEFAULT_SECTION_HEADING = "## Logbook";
export const DEFAULT_SYNC_FREQUENCY_SECONDS = 30 * 60; // Every 30 minutes
export const DEFAULT_TAG_PREFIX = "logbook/";

export interface ISettings {
  hasAcceptedDisclaimer: boolean;
  latestSyncTime: number;

  isSyncEnabled: boolean;
  sectionHeading: string;
  syncInterval: number;
  tagPrefix: string;
}

export const DEFAULT_SETTINGS = Object.freeze({
  hasAcceptedDisclaimer: false,
  latestSyncTime: 0,

  isSyncEnabled: false,
  syncInterval: DEFAULT_SYNC_FREQUENCY_SECONDS,
  sectionHeading: DEFAULT_SECTION_HEADING,
  tagPrefix: DEFAULT_TAG_PREFIX,
});

export class ThingsLogbookSettingsTab extends PluginSettingTab {
  private plugin: ThingsLogbookPlugin;

  constructor(app: App, plugin: ThingsLogbookPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.containerEl.createEl("h3", {
      text: "Format Settings",
    });
    this.addSectionHeadingSetting();
    this.addTagPrefixSetting();

    this.containerEl.createEl("h3", {
      text: "Sync",
    });
    this.addSyncEnabledSetting();
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
        textfield.setValue(this.plugin.options.sectionHeading);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            sectionHeading: value !== "" ? value : undefined,
          }));
        });
      });
  }

  addSyncEnabledSetting(): void {
    new Setting(this.containerEl)
      .setName("Enable periodic syncing")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.isSyncEnabled);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            isSyncEnabled: value,
          }));
          this.display();
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

  addTagPrefixSetting(): void {
    new Setting(this.containerEl)
      .setName("Tag Prefix")
      .setDesc(
        "Prefix added to Things tags when imported into Obsidian (e.g. #logbook/work)"
      )
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_TAG_PREFIX));
        textfield.setValue(this.plugin.options.tagPrefix);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            tagPrefix: value !== "" ? value : undefined,
          }));
        });
      });
  }
}
