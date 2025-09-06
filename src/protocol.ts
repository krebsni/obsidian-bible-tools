import type ObsidianBibleTools from "./main";
import { commandVerseLinks } from "./commands/verse-links";
import { commandAddNextPrevious } from "./commands/add-next-previous";
import { commandAddFolderIndex } from "./commands/add-folder-index";

export function registerProtocol(plugin: ObsidianBibleTools) {
  plugin.registerObsidianProtocolHandler("obsidian-bible-tools", async (params) => {
    const action = params.action ?? "";
    switch (action) {
      case "link-verses":
        await commandVerseLinks(plugin.app, plugin.settings, params);
        break;
      case "add-next-previous":
        await commandAddNextPrevious(plugin.app, plugin.settings, params);
        break;
      case "add-folder-index":
        await commandAddFolderIndex(plugin.app, plugin.settings, params);
        break;
      default:
        break;
    }
  });
}
