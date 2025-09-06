// src/ui/BibleHubLinksModal.ts
import { App, Modal, Notice, Setting, TFile, TFolder } from "obsidian";
import { FolderSuggestModal } from "./folder-suggest-modal";

export type ScopeChoice = { kind: "current" } | { kind: "folder"; folder: TFolder };

export class BibleHubLinksModal extends Modal {
  private appRef: App;
  private onRun: (scope: ScopeChoice) => void;

  private _scope: "current" | "folder" = "current";
  private chosenFolder: TFolder | null = null;

  constructor(app: App, onRun: (scope: ScopeChoice) => void) {
    super(app);
    this.appRef = app;
    this.onRun = onRun;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("BibleHub interlinear links");

    // Scope radio
    new Setting(contentEl)
      .setName("Scope")
      .addDropdown((dd) => {
        dd.addOption("current", "Current file");
        dd.addOption("folder", "Pick folder…");
        dd.setValue(this._scope);
        dd.onChange((v) => {
          this._scope = v as "current" | "folder";
          folderRow.settingEl.toggle(this._scope === "folder");
        });
      });

    // Folder picker row
    const folderRow = new Setting(contentEl)
      .setName("Folder")
      .setDesc("Choose a folder to process all .md files inside (non-recursive).")
      .addButton((b) =>
        b
          .setButtonText(this.chosenFolder ? this.chosenFolder.path : "Pick…")
          .onClick(() => {
            new FolderSuggestModal(this.appRef, (f) => {
              this.chosenFolder = f;
              b.setButtonText(f.path);
            }).open();
          })
      );
    folderRow.settingEl.toggle(this._scope === "folder");

    // Run/Cancel
    new Setting(contentEl)
      .addButton((b) =>
        b.setCta().setButtonText("Run").onClick(() => {
          if (this._scope === "folder") {
            if (!this.chosenFolder) {
              new Notice("Pick a folder first.");
              return;
            }
            this.close();
            this.onRun({ kind: "folder", folder: this.chosenFolder });
          } else {
            this.close();
            this.onRun({ kind: "current" });
          }
        })
      )
      .addExtraButton((b) => b.setIcon("x").setTooltip("Cancel").onClick(() => this.close()));
  }
}