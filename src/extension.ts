"use strict";

import * as vscode from "vscode";
import { resolve, dirname, extname } from "path";
import { existsSync, readFileSync } from "fs";
import { Alias, Config } from "./interface";

let configCache: Config | null = null;
let aliasCache: Alias[] | null = null;

const DEFAULT_CONFIG: Config = {
  ext: [".wxml", ".js", ".ts", ".wxss", ".json"],
};

export const activate = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(["wxml", "json"], {
      provideDefinition,
    })
  );
};

export const deactivate = () => {
  // pass
};

const _getConfig = (dir: string, name: string): Partial<Config> => {
  if (!dir || dir === "/") {
    return {};
  }
  const filePath = resolve(dir, name);
  if (existsSync(filePath)) {
    return require(filePath);
  }
  return _getConfig(dirname(dir), name);
};

const getConfig = (dir: string): Config => {
  if (configCache && Object.keys(configCache).length !== 0) {
    return configCache;
  }

  // Prefer the new config file name: mp-component-jumper.config.js
  let userConfig = _getConfig(dir, "mp-component-jumper.config.js");

  // Fallback to the old config file name for backward compatibility
  if (Object.keys(userConfig).length === 0) {
    userConfig = _getConfig(dir, "mp-component-navigator.config.js");
  }

  const config: Config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
  configCache = config;
  return config;
};

const getAlias = (fileDir: string): Alias[] => {
  if (aliasCache && aliasCache.length !== 0) {
    return aliasCache;
  }
  const config = getConfig(fileDir);
  let alias = config.alias;
  if (typeof alias === "function") {
    alias = alias(fileDir);
  }
  alias = alias || [];
  aliasCache = alias;
  return alias;
};

const getTagName = (
  filePath: string,
  line: string,
  start: number,
  end: number
): string => {
  let l = start;
  let r = end;
  let invalidCharacter = [" "];
  if (extname(filePath) === ".wxml") {
    invalidCharacter = [" ", "<", ">", "/"];
  } else if (extname(filePath) === ".json") {
    invalidCharacter = [" ", '"', ":"];
  }
  while (!invalidCharacter.includes(line[r]) && r < line.length) {
    r++;
  }
  while (!invalidCharacter.includes(line[l]) && l > -1) {
    l--;
  }
  let result = line.substring(l, r).trim();
  for (let i = 0; i < invalidCharacter.length; i++) {
    const character = invalidCharacter[i];
    result = result.replace(new RegExp(character, "g"), "");
  }
  return result;
};

const getSrcDir = (fileDir: string): string =>
  fileDir.substring(0, fileDir.indexOf("src") + 3);

const prefixResolver = (fileDir: string, componentPath: string): string => {
  let resolvedPath = componentPath;
  if (resolvedPath.startsWith("@/")) {
    resolvedPath = resolvedPath.replace("@/", "/");
  }
  if (resolvedPath.startsWith("/")) {
    resolvedPath = resolve(getSrcDir(fileDir), "./" + resolvedPath);
  }
  if (resolvedPath.startsWith("@")) {
    const alias = getAlias(fileDir);
    for (let i = 0; i < alias.length; i++) {
      const alia = alias[i];
      if (resolvedPath.startsWith(alia.name)) {
        resolvedPath = resolvedPath.replace(alia.name, alia.path);
      }
    }
  }
  return resolve(fileDir, resolvedPath);
};

const getExtList = (fileDir: string): string[] => {
  const config = getConfig(fileDir);
  return config.ext || [];
};

type SuffixResolver = (fileDir: string, componentPath: string) => string;

const getSuffixResolvers = (fileDir: string): SuffixResolver[] =>
  getExtList(fileDir)
    .map((ext) => [
      (_: string, componentPath: string) => resolve(componentPath + ext),
      (_: string, componentPath: string) => resolve(componentPath, `./index${ext}`),
    ])
    .flat();

const resolveComponentPath = (
  fileDir: string,
  componentPath: string
): string[] => {
  const resolvedPaths: string[] = [];
  const preparedComponentPath = prefixResolver(fileDir, componentPath);
  const suffixResolvers = getSuffixResolvers(fileDir);
  for (let i = 0; i < suffixResolvers.length; i++) {
    const suffixResolver = suffixResolvers[i];
    const resolvedPath = suffixResolver(fileDir, preparedComponentPath);
    if (resolvedPath && existsSync(resolvedPath)) {
      resolvedPaths.push(resolvedPath);
    }
  }
  return resolvedPaths;
};

const provideDefinition = (
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Location[] | null => {
  try {
    const filePath = document.fileName;
    const fileDir = dirname(filePath);
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
    const jsonFilePath = filePath.replace(extname(filePath), ".json");
    if (!existsSync(jsonFilePath)) {
      return null;
    }
    const deps =
      JSON.parse(readFileSync(jsonFilePath).toString()).usingComponents || {};
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
