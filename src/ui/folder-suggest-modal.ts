// src/ui/FolderSuggestModal.ts
import { App, FuzzySuggestModal, TFolder, Vault } from "obsidian";

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  private appRef: App;
  private onChoose: (folder: TFolder) => void;
  private folders: TFolder[];

  constructor(app: App, onChoose: (folder: TFolder) => void) {
    super(app);
    this.appRef = app;
    this.onChoose = onChoose;
    this.folders = FolderSuggestModal.collectFolders(app);
    this.setPlaceholder("Type to filter folders…");
  }

  getItems(): TFolder[] {
    return this.folders;
  }
  getItemText(item: TFolder): string {
    return item.path;
  }
  onChooseItem(item: TFolder): void {
    this.onChoose(item);
  }

  static collectFolders(app: App): TFolder[] {
    const out: TFolder[] = [];
    Vault.recurseChildren(app.vault.getRoot(), (af) => {
      if (af instanceof TFolder) out.push(af);
    });
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }
}