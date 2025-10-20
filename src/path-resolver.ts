import fs from "fs";
import path from "path";
import { getAlias, getConfig } from "./config";
import { getSrcDir } from "./utils";

const prefixResolver = (fileDir: string, componentPath: string): string => {
  const alias = getAlias(fileDir);

  for (const alia of alias) {
    if (componentPath.startsWith(alia.name)) {
      const resolvedPath = componentPath.replace(alia.name, alia.path);
      return path.resolve(fileDir, resolvedPath);
    }
  }

  if (componentPath.startsWith("/")) {
    const srcDir = getSrcDir(fileDir);
    return path.resolve(srcDir, "." + componentPath);
  }

  return path.resolve(fileDir, componentPath);
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
      (componentPath: string) => path.resolve(componentPath, `./index${ext}`),
    ])
    .flat();

export const resolveComponentPath = (
  fileDir: string,
  componentPath: string
): string[] => {
  const preparedComponentPath = prefixResolver(fileDir, componentPath);
  const suffixResolvers = getSuffixResolvers(fileDir);
  const resolvedPaths: string[] = [];

  for (const suffixResolver of suffixResolvers) {
    const resolvedPath = suffixResolver(preparedComponentPath);
    if (fs.existsSync(resolvedPath)) {
      resolvedPaths.push(resolvedPath);
    }
  }
  return [...new Set(resolvedPaths)]; // Return unique paths
};
