/**
 * Centralized version management for JSR packages used in Breakdown
 *
 * This file provides a single source of truth for all JSR package versions
 * to ensure consistency across the project.
 */

export const JSR_VERSIONS = {
  BREAKDOWN_CONFIG: "^1.1.4",
  BREAKDOWN_PARAMS: "^1.0.3",
  BREAKDOWN_PROMPT: "1.2.3",
  BREAKDOWN_LOGGER: "^1.0.0",
  STD_ASSERT: "^0.224.0",
  STD_FS: "^0.224.0",
  STD_FLAGS: "^0.224.0",
  STD_PATH: "^1.0.9",
  STD_YAML: "^1.0.6",
} as const;

/**
 * Complete import paths for JSR packages
 */
export const JSR_IMPORT_PATHS = {
  BREAKDOWN_CONFIG: "jsr:@tettuan/breakdownconfig@^1.1.4",
  BREAKDOWN_PARAMS: "jsr:@tettuan/breakdownparams@^1.0.3",
  BREAKDOWN_PROMPT: "jsr:@tettuan/breakdownprompt@1.2.3",
  BREAKDOWN_LOGGER: "jsr:@tettuan/breakdownlogger@^1.0.0",
} as const;
