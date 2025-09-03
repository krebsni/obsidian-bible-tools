import { App, TFile, TFolder, normalizePath } from "obsidian";

export function splitFrontmatter(text: string): { yaml?: string; body: string } {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const yaml = text.slice(0, end + 4);
      const body = text.slice(end + 4);
      return { yaml, body };
    }
  }
  return { body: text };
}

export function insertAfterYamlOrH1(src: string, block: string): string {
  const { yaml, body } = splitFrontmatter(src);
  if (yaml) return yaml + "\n" + block + body;
  const firstH1 = body.indexOf("\n# ");
  if (firstH1 !== -1) {
    const pos = firstH1 + 1;
    return body.slice(0, pos) + block + body.slice(pos);
  }
  return body + (body.endsWith("\n") ? "" : "\n") + block;
}

export function isLeafFolder(folder: TFolder): boolean {
  return folder.children.find(c => c instanceof TFolder) === undefined;
}

export function getLeafFoldersUnder(app: App, baseFolderPath: string): TFolder[] {
  const base = app.vault.getFolderByPath(normalizePath(baseFolderPath));
  if (!base) return [];
  const res: TFolder[] = [];
  const walk = (f: TFolder) => {
    if (isLeafFolder(f)) res.push(f);
    else for (const c of f.children) if (c instanceof TFolder) walk(c);
  };
  walk(base);
  return res;
}

export function listMarkdownFiles(folder: TFolder): TFile[] {
  return folder.children.filter((c): c is TFile => c instanceof TFile && c.extension === "md");
}

export function firstNonEmptyLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) if (lines[i].trim().length) return i;
  return -1;
}

export function upsertTopLinksBlock(src: string, linksLine: string): string {
  const { yaml, body } = splitFrontmatter(src);

  function replaceWithin(content: string): string {
    const lines = content.split("\n");
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (/\|Previous\]\]|\|Next\]\]/.test(lines[i])) {
        lines[i] = linksLine;
        return lines.join("\n");
      }
    }
    lines.splice(0, 0, "", linksLine, "");
    return lines.join("\n");
  }

  if (yaml) return yaml + replaceWithin(body);
  return replaceWithin(src);
}

export function upsertBottomLinks(src: string, linksLine: string): string {
  const lines = src.split("\n");
  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    if (/\|Previous\]\]|\|Next\]\]/.test(lines[i])) {
      lines[i] = linksLine;
      return lines.join("\n");
    }
  }
  lines.push("", linksLine);
  return lines.join("\n");
}
