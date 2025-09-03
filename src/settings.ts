import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import ObsidianBibleTools from "./main";
import { BollsLanguage } from "./ui/bolls-base-modal";

export interface BibleToolsSettings {
  baseFolder: string;
  redMarkCss: string;
  indexFileNameMode: "folder-name" | "article-style";
  stripMdLinksWhenVerseLike: boolean; // If true, strip Markdown links that look like scripture references (e.g., [Rom. 1:1](url) → Rom. 1:1)
  removeObsidianDisplayLinks: boolean; // If true, remove Obsidian display-text links that look like scripture references (e.g., [[Rom. 1:1|Rom. 1:1]] → Rom. 1:1)
  rewriteOldObsidianLinks: boolean; // If true, rewrite legacy Obsidian links (e.g., [[Rom 1#^3|…]] → [[Rom#^1-3|…]]) and remove previous Obsidian links that have verse-like display pattern

  autoLinkVerses: boolean; // If true, auto-link verses in the current file when formatting outlines

  // Bible generation defaults
  bibleDefaultVersion: string;              // e.g. "KJV"
  bibleDefaultLanguage: string;             // e.g. "English",
  bibleIncludeVersionInFilename: boolean;   // "John (KJV)" & _Bible/KJV/
  bibleAddFrontmatter: boolean;             // add YAML frontmatter at top

  // Caching of Bolls catalogue (to avoid re-fetching every time)
  bollsCatalogueCache?: BollsLanguage[];
  bollsCatalogueCachedAt?: number;
}

export const DEFAULT_SETTINGS: BibleToolsSettings = {
  baseFolder: "Books",
  redMarkCss: 'background: #FF5582A6;',
  indexFileNameMode: "article-style",
  stripMdLinksWhenVerseLike: true,
  removeObsidianDisplayLinks: false,
  rewriteOldObsidianLinks: true,
  autoLinkVerses: true,

  // Bible generation defaults
  bibleDefaultVersion: "KJV",
  bibleDefaultLanguage: "English",
  bibleIncludeVersionInFilename: true,
  bibleAddFrontmatter: false,

  bollsCatalogueCache: undefined,
  bollsCatalogueCachedAt: undefined,
};

export class BibleToolsSettingTab extends PluginSettingTab {
  plugin: ObsidianBibleTools;

  constructor(app: App, plugin: ObsidianBibleTools) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Bible Tools — Settings" });

    new Setting(containerEl)
      .setName("Default base folder")
      .setDesc("Root folder to scan when a command needs a folder (e.g., index creation).")
      .addText(t => t.setPlaceholder("Books").setValue(this.plugin.settings.baseFolder)
        .onChange(async (v) => { this.plugin.settings.baseFolder = v || "Books"; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Index filename mode")
      .setDesc('If a folder ends with ", The" or ", A", convert to "The …" / "A …".')
      .addDropdown(dd => dd
        .addOption("folder-name", "Keep folder name")
        .addOption("article-style", "Article style (‘, The’ → ‘The …’)")
        .setValue(this.plugin.settings.indexFileNameMode)
        .onChange(async (value) => {
          this.plugin.settings.indexFileNameMode = (value as "folder-name" | "article-style");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Red highlight CSS")
      .setDesc("Exact style a <mark> tag must have to be considered a red highlight.")
      .addText(t => t.setPlaceholder('background: #FF5582A6;')
        .setValue(this.plugin.settings.redMarkCss)
        .onChange(async (v) => { this.plugin.settings.redMarkCss = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Strip Markdown links that look like scripture")
      .setDesc("Replace [Rom. 1:1](url) with plain text before linking to anchors.")
      .addToggle(t => t.setValue(this.plugin.settings.stripMdLinksWhenVerseLike)
        .onChange(async (v) => { this.plugin.settings.stripMdLinksWhenVerseLike = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Remove Obsidian display-text links that look like references")
      .setDesc("If [[Target|Display]] looks like a scripture ref, replace it with plain text before linking (same as the Python script).")
      .addToggle(t => t
        .setValue(this.plugin.settings.removeObsidianDisplayLinks)
        .onChange(async (value) => {
          this.plugin.settings.removeObsidianDisplayLinks = value;
          await this.plugin.saveSettings();
          new Notice("Saved: remove Obsidian display-text links"); }));

    new Setting(containerEl)
      .setName("Rewrite legacy Obsidian links")
      .setDesc("Convert [[Rom 1#^3|…]] → [[Rom#^1-3|…]] before linking and remove previous Obsidian links that have verse-like display pattern.")
      .addToggle(t => t
        .setValue(this.plugin.settings.rewriteOldObsidianLinks)
        .onChange(async (value) => {
          this.plugin.settings.rewriteOldObsidianLinks = value;
          await this.plugin.saveSettings();
          new Notice("Saved: rewrite old-style links");
        }));

    // Toggle: Auto-link verses after outline formatting
    new Setting(containerEl)
      .setName("Auto-link verses after outline formatting")
      .setDesc("After the outline text is formatted, automatically link scripture references in the result.")
      .addToggle(t => t
        .setValue(this.plugin.settings.autoLinkVerses)
        .onChange(async (v) => {
          this.plugin.settings.autoLinkVerses = v;
          await this.plugin.saveSettings();
        })
      );

    // Defaults for Bible generator
    // new Setting(containerEl)
    // .setName("Default Bible version")
    // .setDesc("Used as the preselected version when generating the _Bible vault.")
    // .addDropdown(d => d
    //   .addOptions({
    //     KJV: "KJV – King James Version",
    //     WEB: "WEB – World English Bible",
    //     ASV: "ASV – American Standard Version",
    //     YLT: "YLT – Young's Literal Translation",
    //     DARBY: "DARBY – Darby Translation",
    //     BBE: "BBE – Bible in Basic English",
    //   })
    //   .setValue(this.plugin.settings.bibleDefaultVersion)
    //   .onChange(async (v) => {
    //     this.plugin.settings.bibleDefaultVersion = v;
    //     await this.plugin.saveSettings();
    //   })
    // );

    // new Setting(containerEl)
    // .setName("Include version in filenames")
    // .setDesc(`If ON: folder structure like "_Bible/KJV/John (KJV)". If OFF: folder structure like "_Bible/John".`)
    // .addToggle(t => t
    //   .setValue(this.plugin.settings.bibleIncludeVersionInFilename)
    //   .onChange(async (v) => {
    //     this.plugin.settings.bibleIncludeVersionInFilename = v;
    //     await this.plugin.saveSettings();
    //   })
    // );

    // new Setting(containerEl)
    //   .setName("Add YAML frontmatter to generated Bible files")
    //   .setDesc('If ON, each book file starts with YAML (title, version, book, chapters, etc.).')
    //   .addToggle(t => t
    //     .setValue(this.plugin.settings.bibleAddFrontmatter)
    //     .onChange(async (v) => {
    //       this.plugin.settings.bibleAddFrontmatter = v;
    //       await this.plugin.saveSettings();
    //     })
    //   );
  }
}
