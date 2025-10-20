import path from "path";
import * as vscode from "vscode";

/**
 * Invalid characters for different file types when extracting tag names.
 */
const INVALID_CHARS = {
  wxml: new Set([" ", "<", ">", "/", '"', "'"]),
  json: new Set([" ", '"', ":"]),
  default: new Set([" "]),
};

/**
 * Extracts a tag name from a line of text at the specified position.
 * Expands the selection to include the full tag name by finding boundaries.
 */
export const getTagName = (
  filePath: string,
  line: string,
  start: number,
  end: number
): string => {
  const ext = path.extname(filePath);
  let invalidChars: Set<string>;

  if (ext === ".wxml") {
    invalidChars = INVALID_CHARS.wxml;
  } else if (ext === ".json") {
    invalidChars = INVALID_CHARS.json;
  } else {
    invalidChars = INVALID_CHARS.default;
  }

  // Expand right boundary
  let r = end;
  while (r < line.length && !invalidChars.has(line[r])) {
    r++;
  }

  // Expand left boundary
  let l = start;
  while (l > 0 && !invalidChars.has(line[l - 1])) {
    l--;
  }

  return line.substring(l, r).trim();
};

/**
 * Finds the src directory for a given file path.
 * Searches for /src/ in the path, falls back to workspace root.
 */
export const getSrcDir = (fileDir: string): string => {
  // Try to find src directory in the path
  const srcPattern = path.sep + "src" + path.sep;
  const srcIndex = fileDir.indexOf(srcPattern);
  if (srcIndex !== -1) {
    // Return path up to and including "src"
    return fileDir.substring(0, srcIndex + srcPattern.length - 1);
  }

  // Fallback to workspace root
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(fileDir)
  );

  if (workspaceFolder) {
    return workspaceFolder.uri.fsPath;
  }

  // Last resort: use parent directory
  return path.dirname(fileDir);
};
