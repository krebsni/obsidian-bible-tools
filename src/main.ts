import { App, Notice, Plugin, addIcon } from "obsidian";
import { BibleToolsSettings, DEFAULT_SETTINGS, BibleToolsSettingTab } from "./settings";
import { registerProtocol } from "./protocol";
import { registerIcons } from "./icons";

// Commands
import { commandAddFolderIndex, commandAddIndexForCurrentFolder } from "./commands/add-folder-index";
import { commandAddNextPrevious } from "./commands/add-next-previous";
import { commandExtractHighlightsFolder } from "./commands/extract-highlights-folder";
import { commandExtractRedHighlights } from "./commands/extract-red-highlights";
import { commandOutlineExtractor } from "./commands/outline-extractor";
import { commandOutlineFormatter } from "./commands/outline-formatter";
import { commandVerseLinks, commandVerseLinksChooseVersion, commandVerseLinksSelectionOrLine, commandVerseLinksSelectionOrLineChooseVersion } from "./commands/verse-links";
import { commandBuildBibleFromBolls } from "./commands/generate-bible";
import { commandAddBibleHubLinks, commandRemoveBibleHubLinks } from "./commands/biblehub-links";
import { commandCleanBlankLines } from "./commands/clean-blank-lines";

export default class ObsidianBibleTools extends Plugin {
  settings!: BibleToolsSettings;

  async onload() {
    console.log("Loading Bible Tools…");
    registerIcons(addIcon);

    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Settings UI
    this.addSettingTab(new BibleToolsSettingTab(this.app, this));

    // Ribbon icon (desktop)
    this.addRibbonIcon("obtb-book", "Bible Tools: Folder Index", async () => {
      await commandAddFolderIndex(this.app, this.settings);
    });

    // Commands
    this.addCommand({
      id: "obtb-add-folder-index",
      name: "Create/Update Folder Index (Books)",
      icon: "obtb-book",
      callback: async () => commandAddFolderIndex(this.app, this.settings)
    });

    this.addCommand({
      id: "add-index-for-current-folder",
      name: "Create/Update Folder Index for Current Folder",
      icon: "list-ordered",
      callback: async () => {
        await commandAddIndexForCurrentFolder(this.app, this.settings);
      },
    });

    this.addCommand({
      id: "obtb-add-next-previous",
      name: "Insert Next/Previous Links (Current Folder)",
      icon: "obtb-links",
      callback: async () => commandAddNextPrevious(this.app, this.settings)
    });

    this.addCommand({
      id: "obtb-extract-red-highlights",
      name: "Extract Red Highlights to current file",
      icon: "obtb-highlighter",
      callback: async () => commandExtractRedHighlights(this.app, this.settings)
    });

    this.addCommand({
      id: "obtb-extract-highlights-folder",
      name: "Create Highlights.md from folder",
      icon: "obtb-summary",
      callback: async () => commandExtractHighlightsFolder(this.app, this.settings)
    });

    this.addCommand({
      id: "obtb-outline-extract",
      name: "Append Outline (from ##...###### headings)",
      icon: "obtb-outline",
      callback: async () => commandOutlineExtractor(this.app, this.settings)
    });

    this.addCommand({
      id: "obtb-outline-format",
      name: "Format Outline (Roman/A/1/a → Markdown headings) and Link Verses",
      icon: "obtb-formatter",
      callback: async () => commandOutlineFormatter(this.app, this.settings)
    });

    this.addCommand({
      id: "build-bible-from-bolls",
      name: "Import Bible version into vault (download from bolls.life)",
      icon: "book-open",
      callback: () => commandBuildBibleFromBolls(this.app, this.settings),
    });

    this.addCommand({
      id: "obtb-verse-links",
      name: "Link verses",
      icon: "obtb-bible",
      callback: async () => commandVerseLinks(this.app, this.settings)
    });

    this.addCommand({
      id: "link-verses-selection-or-line",
      name: "Link verses in selection/current line",
      icon: "link-2", // appears in mobile command bar
      editorCallback: async (_editor, _view) => {
        await commandVerseLinksSelectionOrLine(this.app, this.settings);
      },
    });

    this.addCommand({
      id: "link-verses-current-choose-version",
      name: "Link verses (with version)",
      callback: () => commandVerseLinksChooseVersion(this.app, this.settings),
    });

    this.addCommand({
      id: "link-verses-selection-or-line-choose-version",
      name: "Link verses in selection/current line (with version)",
      callback: () => commandVerseLinksSelectionOrLineChooseVersion(this.app, this.settings),
    });

    this.addCommand({
      id: "add-biblehub-interlinear-links",
      name: "BibleHub: Add interlinear links (file / folder)",
      callback: () => commandAddBibleHubLinks(this.app),
    });

    this.addCommand({
      id: "remove-biblehub-interlinear-links",
      name: "BibleHub: Remove interlinear links (file / folder)",
      callback: () => commandRemoveBibleHubLinks(this.app),
    });

    this.addCommand({
      id: "clean-blank-lines",
      name: "Clean blank lines (remove/collapse)",
      callback: () => commandCleanBlankLines(this.app),
    });

    registerProtocol(this);
  }

  async onunload() {
    console.log("Unloading Bible Tools…");
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
