import path from "path";
import * as vscode from "vscode";

export const getTagName = (
  filePath: string,
  line: string,
  start: number,
  end: number
): string => {
  let l = start;
  let r = end;
  let invalidCharacter = [" "];
  if (path.extname(filePath) === ".wxml") {
    invalidCharacter = [" ", "<", ">", "/", '"', "'"];
  } else if (path.extname(filePath) === ".json") {
    invalidCharacter = [" ", '"', ":"];
  }
  while (r < line.length && !invalidCharacter.includes(line[r])) {
    r++;
  }
  while (l > -1 && !invalidCharacter.includes(line[l])) {
    l--;
  }
  const result = line.substring(l + 1, r).trim();
  return result;
};

export const getSrcDir = (fileDir: string): string => {
  const srcIndex = fileDir.indexOf("/src/");
  if (srcIndex !== -1) {
    return fileDir.substring(0, srcIndex + 4);
  }
  // Fallback for projects that might not have a src dir
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(fileDir)
  );
  return workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(fileDir);
};
