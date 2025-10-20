import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { clearCache } from "./config";
import { resolveComponentPath } from "./path-resolver";
import { getTagName } from "./utils";

/**
 * Reads and parses the component dependencies from a JSON file.
 */
const getComponentDeps = (jsonFilePath: string): Record<string, string> => {
  try {
    const content = fs.readFileSync(jsonFilePath, "utf-8");
    const json = JSON.parse(content);
    return json.usingComponents || {};
  } catch (e) {
    console.error(
      `[MP Component Jumper] Error reading JSON file: ${jsonFilePath}`,
      e
    );
    return {};
  }
};

/**
 * Provides definition locations for component tags.
 * Supports jumping from WXML/JSON files to component implementation files.
 */
export const provideDefinition = (
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Location[] | null => {
  try {
    // Clear cache on each jump to get the latest config
    clearCache();

    const filePath = document.fileName;
    const fileDir = path.dirname(filePath);

    // Get the word at current position
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return null;
    }

    // Extract tag name from current line
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

    // Find corresponding JSON config file
    const jsonFilePath = filePath.replace(path.extname(filePath), ".json");
    if (!fs.existsSync(jsonFilePath)) {
      return null;
    }

    // Get component dependencies
    const deps = getComponentDeps(jsonFilePath);
    const componentPath = deps[tagName];
    if (!componentPath) {
      return null;
    }

    // Resolve component path to actual files
    const resolvedPaths = resolveComponentPath(fileDir, componentPath);
    if (resolvedPaths.length === 0) {
      console.warn(
        `[MP Component Jumper] Component "${tagName}" not found. Path: ${componentPath}`
      );
      return null;
    }

    // Create location objects for each resolved file
    return resolvedPaths.map(
      (targetPath) =>
        new vscode.Location(
          vscode.Uri.file(targetPath),
          new vscode.Position(0, 0)
        )
    );
  } catch (err) {
    console.error("[MP Component Jumper] Error in provideDefinition:", err);
    return null;
  }
};
