import { Config } from "./interface";

/**
 * Default configuration for the extension.
 */
export const DEFAULT_CONFIG: Config = {
  // By default, only look for logic files (.js, .ts).
  // Users can add more extensions like .wxml or .wxss in their config file.
  ext: [".js", ".ts"],
  alias: [],
};
