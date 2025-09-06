import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianBibleTools from "./main";
import { BollsLanguage, BollsPickerComponent } from "./ui/bolls-picker-component";

export interface BibleToolsSettings {
  baseFolderBible: string;
  baseFolder: string;
  redMarkCss: string;
  indexFileNameMode: "folder-name" | "article-style";
  stripMdLinksWhenVerseLike: boolean; // strip Markdown links that look like scripture references (e.g., [Rom. 1:1](url) → Rom. 1:1)
  removeObsidianDisplayLinks: boolean; // remove Obsidian display-text links that look like scripture references (e.g., [[Rom. 1:1|Rom. 1:1]] → Rom. 1:1)
  rewriteOldObsidianLinks: boolean; // rewrite legacy Obsidian links (e.g., [[Rom 1#^3|…]] → [[Rom#^1-3|…]]) and remove previous Obsidian links that have verse-like display pattern

  autoLinkVerses: boolean; // auto-link verses in the current file when formatting outlines

  // Bible generation defaults
  bibleDefaultVersion: string | undefined;              // e.g. "KJV"
  bibleDefaultVersionFull: string | undefined;              // e.g. "King James Version"
  bibleDefaultLanguage: string;             // e.g. "English",
  bibleIncludeVersionInFilename: boolean;   // "John (KJV)" & Bible/KJV/
  bibleAddFrontmatter: boolean;             // add YAML frontmatter at top

  // Caching of Bolls catalogue (to avoid re-fetching every time)
  bollsCatalogueCache?: BollsLanguage[];
  bollsCatalogueCachedAt?: number;
}

export const DEFAULT_SETTINGS: BibleToolsSettings = {
  baseFolderBible: "Bible",
  baseFolder: "Books",
  redMarkCss: 'background: #FF5582A6;',
  indexFileNameMode: "article-style",
  stripMdLinksWhenVerseLike: true,
  removeObsidianDisplayLinks: false,
  rewriteOldObsidianLinks: true,
  autoLinkVerses: true,

  // Bible generation defaults
  bibleDefaultVersion: undefined,
  bibleDefaultVersionFull: undefined,
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
      .setName("Highlight CSS")
      .setDesc("Exact style a <mark> tag must have to be considered a highlight.")
      .addText(t => t.setPlaceholder('background: #FF5582A6;')
        .setValue(this.plugin.settings.redMarkCss)
        .onChange(async (v) => { this.plugin.settings.redMarkCss = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Strip Markdown links that look like scripture")
      .addToggle(t => t.setValue(this.plugin.settings.stripMdLinksWhenVerseLike)
        .onChange(async (v) => {
          this.plugin.settings.stripMdLinksWhenVerseLike = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Remove Obsidian display-text links that look like references")
      .addToggle(t => t
        .setValue(this.plugin.settings.removeObsidianDisplayLinks)
        .onChange(async (value) => {
          this.plugin.settings.removeObsidianDisplayLinks = value;
          await this.plugin.saveSettings();
        }));

    // new Setting(containerEl)
    //   .setName("Rewrite legacy Obsidian links")
    //   .setDesc("Convert [[Rom 1#^3|…]] → [[Rom#^1-3|…]] before linking and remove previous Obsidian links that have verse-like display pattern.")
    //   .addToggle(t => t
    //     .setValue(this.plugin.settings.rewriteOldObsidianLinks)
    //     .onChange(async (value) => {
    //       this.plugin.settings.rewriteOldObsidianLinks = value;
    //       await this.plugin.saveSettings();
    //     }));

    new Setting(containerEl)
      .setName("Auto-link verses after outline formatting")
      .addToggle(t => t
        .setValue(this.plugin.settings.autoLinkVerses)
        .onChange(async (v) => {
          this.plugin.settings.autoLinkVerses = v;
          await this.plugin.saveSettings();
        })
    );



    new Setting(containerEl)
      .setName("Default Bible folder to create versions in")
      .setDesc("Root folder to scan when a command needs a folder (e.g., index creation).")
      .addText(t => t.setPlaceholder("Bible").setValue(this.plugin.settings.baseFolderBible)
        .onChange(async (v) => { this.plugin.settings.baseFolderBible = v || "Bible"; await this.plugin.saveSettings(); }));

    // Host element for the picker component
    const pickerHost = containerEl.createDiv({ cls: "bolls-picker-host" });

    // Instantiate the reusable picker.
    // - It will load/cache Bolls languages.json on its own.
    // - It calls onChange(languageKey, translationCode, translationFull) when user changes selection.
    const picker = new BollsPickerComponent(
      {
        app: this.app,
        settings: this.plugin.settings as BibleToolsSettings,
        langBlocks: [], // component will fetch + fill
        languageKey: this.plugin.settings.bibleDefaultLanguage ?? "ALL",
        translationCode: this.plugin.settings.bibleDefaultVersion,
        translationFull: this.plugin.settings.bibleDefaultVersionFull,
        defaults: {
          languageLabel: this.plugin.settings.bibleDefaultLanguage ?? null,
          versionShort:  this.plugin.settings.bibleDefaultVersion,
        },
        container: pickerHost,
        versionsContainer: pickerHost.createDiv(),
        onChange: async (language, version, versionFull) => {
          // Persist selections as your plugin defaults
          this.plugin.settings.bibleDefaultLanguage     = language;
          this.plugin.settings.bibleDefaultVersion = version;
          this.plugin.settings.bibleDefaultVersionFull = versionFull;

          await this.plugin.saveSettings?.();
        },
      },
      this.plugin.settings as BibleToolsSettings
    );
  }
}
