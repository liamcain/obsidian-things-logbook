import { Editor } from "codemirror";
import { App, MarkdownView, TFile } from "obsidian";

export function getEditorForFile(app: App, file: TFile): Editor | null {
  let editor = null;
  app.workspace.iterateAllLeaves((leaf) => {
    if (leaf.view instanceof MarkdownView && leaf.view.file === file) {
      editor = leaf.view.sourceMode.cmEditor;
    }
  });
  return editor;
}
