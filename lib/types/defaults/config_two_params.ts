/**
 * Configuration-based patterns for two parameters
 * 
 * This file provides default configuration for BreakdownParams CustomConfig.
 * Patterns are now read from configuration files via BreakdownParams integration.
 */

import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";
import type { CustomConfig } from "@tettuan/breakdownparams";

/**
 * Default configuration for two parameters validation
 * 
 * This configuration is used when no user configuration is provided.
 * BreakdownParams will merge this with user-provided configuration.
 */
export const _defaultConfigTwoParams: CustomConfig = {
  ...DEFAULT_CUSTOM_CONFIG,
  params: {
    ...DEFAULT_CUSTOM_CONFIG.params,
    two: {
      directiveType: {
        pattern: "^(to|summary|defect|find|analyze|extract)$",
        errorMessage: "Invalid directive type. Must be one of: to, summary, defect, find, analyze, extract",
      },
      layerType: {
        pattern: "^(project|issue|task|component|module)$",
        errorMessage: "Invalid layer type. Must be one of: project, issue, task, component, module",
      },
    },
  },
};
