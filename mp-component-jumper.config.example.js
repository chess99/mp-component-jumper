/**
 * Example configuration file for MP Component Jumper
 *
 * Place this file as "mp-component-jumper.config.js" in your project root.
 * The extension will automatically search up the directory tree to find it.
 */

module.exports = {
  /**
   * File extensions to try when resolving component paths
   * Default: [".js", ".ts"]
   */
  ext: [".js", ".ts", ".wxml", ".wxss"],

  /**
   * Custom path aliases for component resolution
   *
   * Note: The extension will automatically read aliases from tsconfig.json
   * if available. Custom aliases defined here will take precedence.
   *
   * Two ways to define aliases:
   */

  // 1. Static array
  alias: [
    { name: "@/", path: "/absolute/path/to/src/" },
    { name: "@components/", path: "/absolute/path/to/components/" },
  ],

  // 2. Dynamic function (useful for computing paths at runtime)
  // alias: (fileDir) => {
  //   return [
  //     { name: "@/", path: require("path").resolve(fileDir, "../src/") },
  //   ];
  // },
};

/**
 * tsconfig.json Support
 * =====================
 *
 * The extension now fully supports tsconfig.json path mapping, including:
 * - extends: Inherits configuration from parent tsconfig.json
 * - baseUrl: Resolves paths relative to the specified base directory
 * - paths: Maps path aliases to actual directories
 *
 * Example tsconfig.json:
 *
 * {
 *   "extends": "../../tsconfig.json",
 *   "compilerOptions": {
 *     "baseUrl": ".",
 *     "paths": {
 *       "@/*": ["src/*"],
 *       "@components/*": ["src/components/*"]
 *     }
 *   }
 * }
 *
 * With this configuration:
 * - "@/utils/helper" resolves to "src/utils/helper"
 * - "@components/Button" resolves to "src/components/Button"
 */
