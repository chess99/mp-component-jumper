import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { clearCache } from "./config";
import { resolveComponentPath } from "./path-resolver";
import { getTagName } from "./utils";

export const provideDefinition = (
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Location[] | null => {
  try {
    // Clear cache on each jump to get the latest config
    clearCache();

    const filePath = document.fileName;
    const fileDir = path.dirname(filePath);
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return null;
    }
    const line = document.lineAt(position).text;
    const tagName = getTagName(
      filePath,
      line,
      range.start.character,
      range.end.character
    );
    if (!tagName) {
      return null;
    }
    const jsonFilePath = filePath.replace(path.extname(filePath), ".json");
    if (!fs.existsSync(jsonFilePath)) {
      return null;
    }
    const deps =
      JSON.parse(fs.readFileSync(jsonFilePath).toString()).usingComponents ||
      {};
    const componentPath = deps[tagName];
    if (!componentPath) {
      return null;
    }
    const resolvedPaths = resolveComponentPath(fileDir, componentPath);
    return resolvedPaths.map(
      (targetPath) =>
        new vscode.Location(
          vscode.Uri.file(targetPath),
          new vscode.Position(0, 0)
        )
    );
  } catch (err) {
    console.error(err);
  }
  return null;
};
