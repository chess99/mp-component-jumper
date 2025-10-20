import fs from "fs";
import { getTsconfig } from "get-tsconfig";
import path from "path";
import { DEFAULT_CONFIG } from "./defaults";
import { Alias, Config } from "./interface";

/**
 * Cache for user config and aliases.
 * Cleared on each definition request to ensure fresh config.
 */
let configCache: Config | null = null;
let aliasCache: Alias[] | null = null;

/**
 * Recursively finds and loads a config file starting from the given directory.
 * Searches up the directory tree until the config is found or reaches root.
 */
const _findConfigFile = (dir: string, name: string): string | null => {
  if (!dir || dir === path.parse(dir).root) {
    return null;
  }

  const filePath = path.resolve(dir, name);
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  return _findConfigFile(path.dirname(dir), name);
};

/**
 * Loads a config file using dynamic require.
 * Clears the require cache to ensure fresh config on reload.
 */
const _loadConfigFile = (filePath: string): Partial<Config> => {
  try {
    // Clear require cache to get fresh config
    const resolvedPath = require.resolve(filePath);
    delete require.cache[resolvedPath];
    return require(filePath);
  } catch (e) {
    console.error(`[MP Component Jumper] Error loading config: ${filePath}`, e);
    return {};
  }
};

/**
 * Finds and loads user config file.
 * Prefers new name: mp-component-jumper.config.js
 * Falls back to old name: mp-component-navigator.config.js
 */
const _getUserConfig = (dir: string): Partial<Config> => {
  // Try new config file name first
  let configPath = _findConfigFile(dir, "mp-component-jumper.config.js");

  // Fallback to old config file name for backward compatibility
  if (!configPath) {
    configPath = _findConfigFile(dir, "mp-component-navigator.config.js");
  }

  if (configPath) {
    return _loadConfigFile(configPath);
  }

  return {};
};

/**
 * Converts tsconfig paths to alias array.
 * Handles both wildcard patterns (e.g., "@/*") and exact paths.
 * Resolves paths relative to baseUrl if specified.
 */
const _convertTsconfigPathsToAlias = (
  compilerOptions: any,
  tsconfigDir: string
): Alias[] => {
  const paths = compilerOptions?.paths;
  if (!paths || typeof paths !== "object") {
    return [];
  }

  const baseUrl = compilerOptions?.baseUrl || ".";
  const baseDir = path.resolve(tsconfigDir, baseUrl);
  const aliases: Alias[] = [];

  for (const [key, value] of Object.entries(paths)) {
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }

    const pathValue = value[0];
    if (typeof pathValue !== "string") {
      continue;
    }

    // Handle wildcard patterns: "@/*" -> "@/"
    if (key.endsWith("/*")) {
      const name = key.slice(0, -1); // Remove trailing * but keep /
      if (pathValue.endsWith("/*")) {
        const resolvedPath = path.resolve(baseDir, pathValue.slice(0, -1));
        aliases.push({ name, path: resolvedPath });
      }
    } else {
      // Handle exact paths: "@" -> "src"
      const name = key + "/"; // Add trailing / for consistency
      const resolvedPath = path.resolve(baseDir, pathValue) + "/";
      aliases.push({ name, path: resolvedPath });
    }
  }

  return aliases;
};

/**
 * Extracts alias configuration from tsconfig.json.
 * Uses get-tsconfig to properly handle extends inheritance.
 */
const _getTsconfigAlias = (dir: string): Alias[] => {
  try {
    const result = getTsconfig(dir);
    if (!result) {
      return [];
    }

    const tsconfigDir = path.dirname(result.path);
    return _convertTsconfigPathsToAlias(
      result.config.compilerOptions,
      tsconfigDir
    );
  } catch (e) {
    console.error("[MP Component Jumper] Error reading tsconfig:", e);
    return [];
  }
};

/**
 * Gets the merged configuration (defaults + user config).
 * Results are cached until clearCache() is called.
 */
export const getConfig = (dir: string): Config => {
  if (configCache) {
    return configCache;
  }

  const userConfig = _getUserConfig(dir);
  const config: Config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  configCache = config;
  return config;
};

/**
 * Gets the merged alias configuration.
 * Priority order: user config > tsconfig.json
 * Results are cached until clearCache() is called.
 */
export const getAlias = (fileDir: string): Alias[] => {
  if (aliasCache) {
    return aliasCache;
  }

  // Get user-defined aliases
  const config = getConfig(fileDir);
  let userAlias: Alias[] = [];

  if (config.alias) {
    if (typeof config.alias === "function") {
      try {
        userAlias = config.alias(fileDir) || [];
      } catch (e) {
        console.error(
          "[MP Component Jumper] Error executing alias function:",
          e
        );
        userAlias = [];
      }
    } else {
      userAlias = config.alias;
    }
  }

  // Get tsconfig aliases
  const tsconfigAlias = _getTsconfigAlias(fileDir);

  // Merge aliases: user-defined takes precedence
  const userAliasNames = new Set(userAlias.map((a) => a.name));
  const mergedAlias = [
    ...userAlias,
    ...tsconfigAlias.filter((alias) => !userAliasNames.has(alias.name)),
  ];

  aliasCache = mergedAlias;
  return aliasCache;
};

/**
 * Clears all cached configuration and alias data.
 * Should be called when configuration files might have changed.
 */
export const clearCache = (): void => {
  configCache = null;
  aliasCache = null;
};
