import fs from "fs";
import path from "path";
import { getAlias, getConfig } from "./config";
import { getSrcDir } from "./utils";

/**
 * Resolves the prefix part of a component path.
 * Handles alias resolution and absolute paths.
 */
const prefixResolver = (fileDir: string, componentPath: string): string => {
  // Handle alias paths (e.g., "@/components/...")
  const aliases = getAlias(fileDir);
  for (const alias of aliases) {
    if (componentPath.startsWith(alias.name)) {
      return componentPath.replace(alias.name, alias.path + "/");
    }
  }

  // Handle absolute paths (e.g., "/components/...")
  if (componentPath.startsWith("/")) {
    const srcDir = getSrcDir(fileDir);
    return path.join(srcDir, componentPath);
  }

  // Handle relative paths (e.g., "./components/...")
  return path.resolve(fileDir, componentPath);
};

/**
 * Gets the list of file extensions to try when resolving component paths.
 */
const getExtList = (fileDir: string): string[] => {
  const config = getConfig(fileDir);
  return config.ext || [];
};

type SuffixResolver = (componentPath: string) => string;

/**
 * Creates suffix resolvers for each extension.
 * Each resolver tries both direct file and index file patterns.
 */
const getSuffixResolvers = (fileDir: string): SuffixResolver[] => {
  const extensions = getExtList(fileDir);
  const resolvers: SuffixResolver[] = [];

  for (const ext of extensions) {
    // Direct file: "component" -> "component.js"
    resolvers.push((componentPath: string) => componentPath + ext);
    // Index file: "component" -> "component/index.js"
    resolvers.push((componentPath: string) =>
      path.join(componentPath, `index${ext}`)
    );
  }

  return resolvers;
};

/**
 * Resolves a component path to actual file system paths.
 * Returns all matching files found.
 */
export const resolveComponentPath = (
  fileDir: string,
  componentPath: string
): string[] => {
  const basePath = prefixResolver(fileDir, componentPath);
  const suffixResolvers = getSuffixResolvers(fileDir);
  const foundPaths = new Set<string>();

  for (const resolver of suffixResolvers) {
    const candidatePath = resolver(basePath);
    if (fs.existsSync(candidatePath)) {
      foundPaths.add(candidatePath);
    }
  }

  return Array.from(foundPaths);
};
