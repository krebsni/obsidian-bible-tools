import { App, Modal } from "obsidian";
import type { BibleToolsSettings } from "../settings";
import {
  BaseBollsDefaults,
  BollsLanguage,
  BollsPickerComponent,
} from "./bolls-picker-component";

/**
 * Base modal that:
 *  - delegates all Bolls catalogue loading + pickers to BollsPickerComponent,
 *  - exposes chosen `languageKey`, `translationCode`, `translationFull`,
 *  - provides hooks for subclasses to add options/footer/actions.
 */
export abstract class BaseBollsModal extends Modal {
  protected settings: BibleToolsSettings;

  /** Current selection (kept in sync via the component's onChange) */
  protected languageKey: string = "ALL"; // "ALL" (=flatten) or exact BollsLanguage.language
  protected translationCode?: string = undefined;
  protected translationFull?: string = undefined;

  /** If a subclass wants to render additional UI near the versions area */
  protected versionsContainer!: HTMLDivElement;

  /** Optional defaults to preselect (from settings) */
  private defaults?: BaseBollsDefaults;

  /** If a subclass wants to inspect or reuse the component. */
  protected picker!: BollsPickerComponent;

  /** If a subclass wants to access the in-memory blocks after component loads. */
  protected langBlocks: BollsLanguage[] = [];

  protected disallowDefault: boolean = false;

  constructor(app: App, settings: BibleToolsSettings, defaults?: BaseBollsDefaults) {
    super(app);
    this.settings = settings;
    this.translationCode = settings.bibleDefaultVersion;
    this.translationFull = settings.bibleDefaultVersionFull;
    this.languageKey = settings.bibleDefaultLanguage ?? "ALL";
    this.defaults = defaults;
  }

  /** Override to add extra option controls under the pickers */
  protected renderExtraOptions(_contentEl: HTMLElement): void {}

  /** Override to render footer (buttons/progress/etc.) */
  protected abstract renderFooter(contentEl: HTMLElement): void;

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Bible version");

    // Instantiate the reusable picker component.
    // It handles:
    //  - loading/caching languages.json,
    //  - creating Language + Version dropdowns,
    //  - applying provided defaults,
    //  - calling onChange with language, version (short), and versionFull.
    this.picker = new BollsPickerComponent(
      {
        app: this.app, // so component can persist settings if it wants
        settings: this.settings,
        // You can pass a stale/empty array; the component will load/replace it.
        langBlocks: this.langBlocks,
        // Initial values; the component may override based on defaults or availability.
        languageKey: this.languageKey,
        translationCode: this.settings.bibleDefaultVersion,
        translationFull: this.settings.bibleDefaultVersionFull,
        defaults: this.defaults,
        container: contentEl,
        versionsContainer: contentEl.createDiv(), // will be replaced by component in its constructor
        onChange: (language, version, versionFull) => {
          this.languageKey = language;
          this.translationCode = version;
          this.translationFull = versionFull;
          // Keep a local copy of what the component currently knows about blocks
          this.langBlocks = this.picker?.["options"]?.langBlocks ?? this.langBlocks;
        },
      },
      this.settings,
      this.disallowDefault
    );

    // Expose the versions container for subclasses that want to render near it.
    this.versionsContainer = this.picker.versionsContainer!;

    // Allow subclasses to add extra controls
    this.renderExtraOptions(contentEl);

    // Footer/actions (abstract)
    this.renderFooter(contentEl);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}