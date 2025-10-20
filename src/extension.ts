"use strict";

import * as vscode from "vscode";
import { resolve, dirname, extname } from "path";
import { existsSync, readFileSync } from "fs";
import { Alias, Config } from "./interface";
import { DEFAULT_CONFIG } from "./defaults";

let configCache: Config | null = null;
let aliasCache: Alias[] | null = null;

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
    try {
      return require(filePath);
    } catch (e) {
      console.error(`Error loading config file: ${filePath}`, e);
      return {};
    }
  }
  return _getConfig(dirname(dir), name);
};

const _findAndReadTsconfig = (dir: string): any => {
  if (!dir || dir === "/") {
    return null;
  }
  const filePath = resolve(dir, "tsconfig.json");
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath).toString();
      // Strip comments before parsing
      const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      return JSON.parse(jsonContent);
    } catch (e) {
      console.error(`Error parsing tsconfig.json: ${filePath}`, e);
      return null;
    }
  }
  return _findAndReadTsconfig(dirname(dir));
};

const _convertTsconfigPathsToAlias = (
  tsconfig: any,
  tsconfigDir: string
): Alias[] => {
  if (!tsconfig?.compilerOptions?.paths) {
    return [];
  }

  const paths = tsconfig.compilerOptions.paths;
  const alias: Alias[] = [];

  for (const key in paths) {
    if (key.endsWith("/*")) {
      const name = key.replace("/*", "/");
      const pathValue = paths[key][0];
      if (pathValue && pathValue.endsWith("/*")) {
        const resolvedPath = resolve(
          tsconfigDir,
          pathValue.replace("/*", "/")
        );
        alias.push({ name, path: resolvedPath });
      }
    }
  }
  return alias;
};

const _getTsconfigAlias = (dir: string): Alias[] => {
	const tsconfig = _findAndReadTsconfig(dir);
	if (tsconfig) {
		const tsconfigDir = dirname(_findAndReadTsconfig.toString());
		return _convertTsconfigPathsToAlias(tsconfig, tsconfigDir);
	}
	return [];
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

  const tsconfigAlias = _getTsconfigAlias(fileDir);
  const config = getConfig(fileDir);

  let userAlias = config.alias;
  if (typeof userAlias === "function") {
    userAlias = userAlias(fileDir);
  }
  userAlias = userAlias || [];

  // User-defined aliases take precedence over tsconfig aliases
  const finalAlias = [...userAlias];
  const userAliasNames = new Set(userAlias.map(a => a.name));

  for (const alias of tsconfigAlias) {
    if (!userAliasNames.has(alias.name)) {
      finalAlias.push(alias);
    }
  }
  
  aliasCache = finalAlias;
  return aliasCache;
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
  while (r < line.length && !invalidCharacter.includes(line[r])) {
    r++;
  }
  while (l > -1 && !invalidCharacter.includes(line[l])) {
    l--;
  }
  let result = line.substring(l + 1, r).trim();
  return result;
};

const getSrcDir = (fileDir: string): string => {
  const srcIndex = fileDir.indexOf("/src/");
  if (srcIndex !== -1) {
    return fileDir.substring(0, srcIndex + 4);
  }
  // Fallback for projects that might not have a src dir
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fileDir));
  return workspaceFolder ? workspaceFolder.uri.fsPath : dirname(fileDir);
};

const prefixResolver = (fileDir: string, componentPath: string): string => {
  let resolvedPath = componentPath;
  const alias = getAlias(fileDir);

  for (const alia of alias) {
    if (resolvedPath.startsWith(alia.name)) {
      return resolve(alia.path, resolvedPath.substring(alia.name.length));
    }
  }

  if (resolvedPath.startsWith("/")) {
    const srcDir = getSrcDir(fileDir);
    return resolve(srcDir, "." + resolvedPath);
  }
  
  return resolve(fileDir, resolvedPath);
};

const getExtList = (fileDir: string): string[] => {
  const config = getConfig(fileDir);
  return config.ext || [];
};

type SuffixResolver = (componentPath: string) => string;

const getSuffixResolvers = (fileDir: string): SuffixResolver[] =>
  getExtList(fileDir)
    .map((ext) => [
      (componentPath: string) => componentPath + ext,
      (componentPath: string) => resolve(componentPath, `./index${ext}`),
    ])
    .flat();

const resolveComponentPath = (
  fileDir: string,
  componentPath: string
): string[] => {
  const resolvedPaths: string[] = [];
  const preparedComponentPath = prefixResolver(fileDir, componentPath);
  const suffixResolvers = getSuffixResolvers(fileDir);

  for (const suffixResolver of suffixResolvers) {
    const resolvedPath = suffixResolver(preparedComponentPath);
    if (existsSync(resolvedPath)) {
      resolvedPaths.push(resolvedPath);
    }
  }
  return [...new Set(resolvedPaths)]; // Return unique paths
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