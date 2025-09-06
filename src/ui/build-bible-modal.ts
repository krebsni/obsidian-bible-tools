import { App, Setting, Notice } from "obsidian";
import type { BibleToolsSettings } from "../settings";
import { BaseBollsModal } from "./bolls-base-modal";
import { buildBibleFromBolls } from "../commands/generate-bible";

export class BuildBibleModal extends BaseBollsModal {
  private includeVersionInFileName: boolean;
  private versionAsSubfolder: boolean;
  private autoFrontmatter: boolean;
  private concurrency = 4;

  // progress
  private progressEl!: HTMLProgressElement;
  private statusEl!: HTMLDivElement;
  private startBtn!: HTMLButtonElement;
  private working = false;

  constructor(app: App, settings: BibleToolsSettings) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort:  settings.bibleDefaultVersion  ?? undefined,
    });

    this.includeVersionInFileName = settings.bibleIncludeVersionInFilename ?? true;
    // FIX: use the dedicated setting for subfolder (was pointing to the filename flag)
    this.versionAsSubfolder       = (settings as any).bibleVersionAsSubfolder ?? true;
    this.autoFrontmatter = settings.bibleAddFrontmatter ?? false;
    this.disallowDefault = true;
  }

  protected renderExtraOptions(contentEl: HTMLElement): void {
    new Setting(contentEl)
      .setName("Append version to file name")
      .setDesc(`"John (KJV)" vs "John"`)
      .addToggle(t =>
        t.setValue(this.includeVersionInFileName)
         .onChange(v => (this.includeVersionInFileName = v))
      );

    new Setting(contentEl)
      .setName("Place books under version subfolder")
      .setDesc(`"Bible/KJV/John (KJV)" vs "Bible/John"`)
      .addToggle(t =>
        t.setValue(this.versionAsSubfolder)
         .onChange(v => (this.versionAsSubfolder = v))
      );

    new Setting(contentEl)
      .setName("Auto-add frontmatter")
      .setDesc("Insert YAML with title/version/created into each book file")
      .addToggle(t =>
        t.setValue(this.autoFrontmatter)
         .onChange(v => (this.autoFrontmatter = v))
      );

    new Setting(contentEl)
      .setName("Concurrency")
      .setDesc("How many chapters to download in parallel")
      .addSlider(s =>
        s.setLimits(1, 8, 1)
         .setValue(this.concurrency)
         .onChange(v => (this.concurrency = v))
         .setDynamicTooltip()
      );
  }

  protected renderFooter(contentEl: HTMLElement): void {
    const progWrap = contentEl.createDiv({ cls: "bolls-progress" });
    this.progressEl = progWrap.createEl("progress");
    this.progressEl.max = 100;
    this.progressEl.value = 0;

    this.statusEl = progWrap.createDiv({ text: "Idle." });

    const btns = contentEl.createDiv({ cls: "bolls-actions" });
    this.startBtn = btns.createEl("button", { text: "Start" });
    this.startBtn.onclick = () => this.start();

    const cancelBtn = btns.createEl("button", { text: "Close" });
    cancelBtn.onclick = () => this.close();
  }

  private async start() {
    if (this.working) return;
    this.working = true;
    this.startBtn.disabled = true;

    const code = (this.translationCode ?? "").trim();
    if (!code) {
      new Notice("Choose a translation code.");
      this.working = false;
      this.startBtn.disabled = false;
      return;
    }

    try {
      await buildBibleFromBolls(
        this.app,
        {
          translationCode: code,
          translationFull: this.translationFull || code,
          includeVersionInFileName: this.includeVersionInFileName,
          versionAsSubfolder: this.versionAsSubfolder,
          autoFrontmatter: this.autoFrontmatter,
          concurrency: this.concurrency,
          baseFolder: this.settings.baseFolderBible || "Bible",
        },
        (done: number, total: number, msg: any) => {
          this.progressEl.max = total || 1;
          this.progressEl.value = Math.min(done, total || 1);
          this.statusEl.setText(`${done}/${total} · ${msg}`);
        }
      );
      this.statusEl.setText("Done.");
    } catch (e: any) {
      console.error(e);
      new Notice(`Bible build failed: ${e?.message ?? e}`);
      this.statusEl.setText("Failed.");
    } finally {
      this.working = false;
      this.startBtn.disabled = false;
    }
  }
}