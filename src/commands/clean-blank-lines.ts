import { App, Notice, TFile, TFolder } from "obsidian";
import { splitFrontmatter } from "../lib/md-utils";
import { stripAndCollapseBlankLines, stripAndRemoveEmptyLines } from "../lib/text-clean";
import { BlankLinesChoice, BlankLinesModal } from "src/ui/blank-lines-modal";

async function processFile(app: App, f: TFile, choice: BlankLinesChoice) {
  if (f.extension !== "md") return;

  const raw = await app.vault.read(f);
  const { yaml, body } = splitFrontmatter(raw);

  let newBody: string;
  if (choice.mode === "remove") {
    newBody = stripAndRemoveEmptyLines(body);
  } else {
    newBody = stripAndCollapseBlankLines(body, choice.maxConsecutive);
  }

  if (newBody !== body) {
    await app.vault.modify(f, (yaml ?? "") + newBody);
  }
}

function* iterateMarkdownFiles(folder: TFolder, recursive: boolean): Generator<TFile> {
  for (const child of folder.children) {
    if (child instanceof TFile && child.extension === "md") {
      yield child;
    } else if (recursive && child instanceof TFolder) {
      yield* iterateMarkdownFiles(child, true);
    }
  }
}

export function commandCleanBlankLines(app: App) {
  new BlankLinesModal(app, async (choice) => {
    if (choice.scope.kind === "current") {
      const file = app.workspace.getActiveFile();
      if (!file) { new Notice("Open a file first."); return; }
      await processFile(app, file, choice);
      new Notice("Cleaned blank lines in current file.");
      return;
    }

    const { folder, recursive } = choice.scope;
    const tasks: Promise<void>[] = [];
    let count = 0;

    for (const f of iterateMarkdownFiles(folder, recursive)) {
      count++;
      tasks.push(processFile(app, f, choice));
    }
    await Promise.all(tasks);
    new Notice(`Cleaned blank lines in ${count} file(s).`);
  }).open();
}