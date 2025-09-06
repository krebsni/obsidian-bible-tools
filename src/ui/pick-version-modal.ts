import { App, Setting } from "obsidian";
import type { BibleToolsSettings } from "../settings";
import { BaseBollsModal } from "./bolls-base-modal";

export class PickVersionModal extends BaseBollsModal {
  private readonly onPick: (verShort: string | null) => void;

  constructor(app: App, settings: BibleToolsSettings, onPick: (verShort: string | null) => void) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort:  settings.bibleDefaultVersion, // can be undefined
    });
    this.onPick = onPick;
  }

  protected renderFooter(contentEl: HTMLElement): void {
    new Setting(contentEl)
      .setName("How to link")
      .setDesc("If you cancel, links will use default (no version).")
      .addButton(b =>
        b.setButtonText("Use selected version").setCta().onClick(() => {
          this.close();
          this.onPick(this.translationCode || null);
        })
      )
      .addExtraButton(b =>
        b.setIcon("x").setTooltip("Cancel (no version)").onClick(() => {
          this.close();
          this.onPick(null);
        })
      );
  }
}