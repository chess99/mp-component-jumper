import fs from "fs";
import path from "path";
import { DEFAULT_CONFIG } from "./defaults";
import { Alias, Config } from "./interface";

let configCache: Config | null = null;
let aliasCache: Alias[] | null = null;

const _getConfig = (dir: string, name: string): Partial<Config> => {
  if (!dir || dir === "/") {
    return {};
  }
  const filePath = path.resolve(dir, name);
  if (fs.existsSync(filePath)) {
    try {
      // Clear require cache before loading
      delete require.cache[require.resolve(filePath)];
      return require(filePath);
    } catch (e) {
      console.error(`Error loading config file: ${filePath}`, e);
      return {};
    }
  }
  return _getConfig(path.dirname(dir), name);
};

const _findAndReadTsconfig = (
  dir: string
): { path: string; json: any } | null => {
  if (!dir || dir === "/") {
    return null;
  }
  const filePath = path.resolve(dir, "tsconfig.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath).toString();
      // Strip comments before parsing
      const jsonContent = content.replace(
        /\/\*[\s\S]*?\*\/|([^\:]|^)\/\/.*$/gm,
        "$1"
      );
      return { path: filePath, json: JSON.parse(jsonContent) };
    } catch (e) {
      console.error(`Error parsing tsconfig.json: ${filePath}`, e);
      return null;
    }
  }
  return _findAndReadTsconfig(path.dirname(dir));
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
        const resolvedPath = path.resolve(
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
  const tsconfigResult = _findAndReadTsconfig(dir);
  if (tsconfigResult) {
    const tsconfigDir = path.dirname(tsconfigResult.path);
    return _convertTsconfigPathsToAlias(tsconfigResult.json, tsconfigDir);
  }
  return [];
};

export const getConfig = (dir: string): Config => {
  if (configCache) {
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

export const getAlias = (fileDir: string): Alias[] => {
  if (aliasCache) {
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
  const userAliasNames = new Set(userAlias.map((a) => a.name));

  for (const alias of tsconfigAlias) {
    if (!userAliasNames.has(alias.name)) {
      finalAlias.push(alias);
    }
  }

  aliasCache = finalAlias;
  return aliasCache;
};

export const clearCache = () => {
  configCache = null;
  aliasCache = null;
};
