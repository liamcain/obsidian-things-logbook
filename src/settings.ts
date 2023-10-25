import { App, PluginSettingTab, Setting } from "obsidian";

import type ThingsLogbookPlugin from "./index";

export const DEFAULT_SECTION_HEADING = "## Logbook";
export const DEFAULT_SYNC_FREQUENCY_SECONDS = 30 * 60; // Every 30 minutes
export const DEFAULT_TAG_PREFIX = "logbook/";
export const DEFAULT_CANCELLED_MARK = "c";

export interface ISettings {
  hasAcceptedDisclaimer: boolean;
  latestSyncTime: number;

  doesSyncNoteBody: boolean;
  doesSyncProject: boolean;
  doesAddNewlineBeforeHeadings: boolean;
  isSyncEnabled: boolean;
  sectionHeading: string;
  syncInterval: number;
  tagPrefix: string;
  canceledMark: string;
}

export const DEFAULT_SETTINGS = Object.freeze({
  hasAcceptedDisclaimer: false,
  latestSyncTime: 0,

  doesSyncNoteBody: true,
  doesSyncProject: false,
  doesAddNewlineBeforeHeadings: false,
  isSyncEnabled: false,
  syncInterval: DEFAULT_SYNC_FREQUENCY_SECONDS,
  sectionHeading: DEFAULT_SECTION_HEADING,
  tagPrefix: DEFAULT_TAG_PREFIX,
  canceledMark: DEFAULT_CANCELLED_MARK
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
    this.addCanceledMarkSetting();
    this.addDoesAddNewlineBeforeHeadingsSetting();

    this.containerEl.createEl("h3", {
      text: "Sync",
    });
    this.addSyncEnabledSetting();
    this.addSyncIntervalSetting();
    this.addDoesSyncNoteBodySetting();
    this.addDoesSyncProjectSetting();
  }

  addSectionHeadingSetting(): void {
    new Setting(this.containerEl)
      .setName("Section heading")
      .setDesc(
        "Markdown heading to use when adding the logbook to a daily note"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.sectionHeading);
        textfield.onChange(async (rawSectionHeading) => {
          const sectionHeading = rawSectionHeading.trim();
          this.plugin.writeOptions({ sectionHeading });
        });
      });
  }

  addSyncEnabledSetting(): void {
    new Setting(this.containerEl)
      .setName("Enable periodic syncing")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.isSyncEnabled);
        toggle.onChange(async (isSyncEnabled) => {
          this.plugin.writeOptions({ isSyncEnabled });
        });
      });
  }

  addDoesSyncNoteBodySetting(): void {
    new Setting(this.containerEl)
      .setName("Include notes")
      .setDesc('Includes MD notes of a task into the synced Obsidian document')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.doesSyncNoteBody);
        toggle.onChange(async (doesSyncNoteBody) => {
          this.plugin.writeOptions({ doesSyncNoteBody })
        });
      });
  }

  addDoesSyncProjectSetting(): void {
    new Setting(this.containerEl)
        .setName("Include project")
        .setDesc("If the Things task belongs to a project, use project name as header instead of area")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesSyncProject);
          toggle.onChange(async (doesSyncProject) => {
            this.plugin.writeOptions({ doesSyncProject })
          });
        });
  }

  addSyncIntervalSetting(): void {
    new Setting(this.containerEl)
      .setName("Sync Frequency")
      .setDesc("Number of seconds the plugin will wait before syncing again")
      .addText((textfield) => {
        textfield.setValue(String(this.plugin.options.syncInterval));
        textfield.inputEl.type = "number";
        textfield.inputEl.onblur = (e: FocusEvent) => {
          const syncInterval = Number((<HTMLInputElement>e.target).value);
          textfield.setValue(String(syncInterval));
          this.plugin.writeOptions({ syncInterval });
        };
      });
  }

  addTagPrefixSetting(): void {
    new Setting(this.containerEl)
      .setName("Tag Prefix")
      .setDesc(
        "Prefix added to Things tags when imported into Obsidian (e.g. #logbook/work)"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.tagPrefix);
        textfield.onChange(async (tagPrefix) => {
          this.plugin.writeOptions({ tagPrefix });
        });
      });
  }

  addCanceledMarkSetting(): void {
    new Setting(this.containerEl)
        .setName("Canceled Mark")
        .setDesc(
            "Mark character to use for canceled tasks"
        )
        .addText((textfield) => {
          textfield.setValue(this.plugin.options.canceledMark);
          textfield.onChange(async (canceledMark) => {
            this.plugin.writeOptions({ canceledMark });
          });
        });
  }

  addDoesAddNewlineBeforeHeadingsSetting(): void {
    new Setting(this.containerEl)
        .setName("Empty line before headings")
        .setDesc("When grouping tasks with headings by area or project, add an empty line before that heading")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesAddNewlineBeforeHeadings);
          toggle.onChange(async (doesAddNewlineBeforeHeadings) => {
            this.plugin.writeOptions({ doesAddNewlineBeforeHeadings });
          });
        });
  }
}
