import { App, Modal, Notice, Setting, TFolder } from "obsidian";
import { FolderSuggestModal } from "./folder-suggest-modal";

export type BlankLineMode = "remove" | "collapse";
export type BlankLinesScope =
  | { kind: "current" }
  | { kind: "folder"; folder: TFolder; recursive: boolean };

export interface BlankLinesChoice {
  scope: BlankLinesScope;
  mode: BlankLineMode;
  maxConsecutive: number; // used only if mode === "collapse"
}

export class BlankLinesModal extends Modal {
  private onRun: (choice: BlankLinesChoice) => void;

  // UI state
  private _scope: "current" | "folder" = "current";
  private recursive: boolean = true;
  private chosenFolder: TFolder | null = null;

  private mode: BlankLineMode = "remove";
  private maxConsecutive = 1;

  constructor(app: App, onRun: (choice: BlankLinesChoice) => void) {
    super(app);
    this.onRun = onRun;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Clean blank lines");

    // Scope
    new Setting(contentEl)
      .setName("Scope")
      .addDropdown((dd) => {
        dd.addOption("current", "Current file");
        dd.addOption("folder", "Pick folder…");
        dd.setValue(this._scope);
        dd.onChange((v) => {
          this._scope = v as "current" | "folder";
          folderRow.settingEl.toggle(this._scope === "folder");
          recurseRow.settingEl.toggle(this._scope === "folder");
        });
      });

    // Folder row
    const folderRow = new Setting(contentEl)
      .setName("Folder")
      .setDesc("Process all Markdown files in the folder")
      .addButton((b) =>
        b
          .setButtonText(this.chosenFolder ? this.chosenFolder.path : "Pick…")
          .onClick(() => {
            new FolderSuggestModal(this.app, (folder) => {
              this.chosenFolder = folder;
              b.setButtonText(folder.path);
            }).open();
          })
      );
    folderRow.settingEl.toggle(this._scope === "folder");

    // Recursive?
    const recurseRow = new Setting(contentEl)
      .setName("Include subfolders")
      .addToggle((t) => t.setValue(this.recursive).onChange((v) => (this.recursive = v)));
    recurseRow.settingEl.toggle(this._scope === "folder");

    // Mode
    new Setting(contentEl)
      .setName("Mode")
      .addDropdown((dd) => {
        dd.addOption("collapse", "Collapse consecutive blanks");
        dd.addOption("remove", "Remove all blank lines");
        dd.setValue(this.mode);
        dd.onChange((v) => {
          this.mode = v as BlankLineMode;
          maxRow.settingEl.toggle(this.mode === "collapse");
        });
      });

    // Max consecutive when collapsing
    const maxRow = new Setting(contentEl)
      .setName("Max consecutive blanks to keep")
      .setDesc("Used only when collapsing; 1 keeps single empty lines between paragraphs.")
      .addSlider((s) =>
        s.setLimits(0, 3, 1).setValue(this.maxConsecutive).onChange((v) => (this.maxConsecutive = v)).setDynamicTooltip()
      );
    maxRow.settingEl.toggle(this.mode === "collapse");

    // Actions
    new Setting(contentEl)
      .addButton((b) =>
        b.setCta().setButtonText("Run").onClick(() => {
          if (this._scope === "folder" && !this.chosenFolder) {
            new Notice("Pick a folder first.");
            return;
          }
          const scope: BlankLinesScope =
            this._scope === "current"
              ? { kind: "current" }
              : { kind: "folder", folder: this.chosenFolder!, recursive: this.recursive };
          this.close();
          this.onRun({ scope, mode: this.mode, maxConsecutive: this.maxConsecutive });
        })
      )
      .addExtraButton((b) => b.setIcon("x").setTooltip("Cancel").onClick(() => this.close()));
  }
}