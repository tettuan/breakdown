/**
 * Breakdown - A tool for breaking down projects into manageable tasks
 * 
 * This is the main entry point for the library.
 */

// Export main functionality
export { runBreakdown } from "./lib/cli/breakdown.ts";

// Export types
export type { Config } from "./lib/config/config.ts";
export { Workspace } from "./lib/core/workspace.ts";
export { loadPrompt } from "./lib/prompts/loader.ts";

// Export CLI-related functionality
export { parseArgs } from "./lib/cli/args.ts";

// Config exports
export type { BreakdownConfig, ConfigOptions } from "$lib/config/types.ts";

// Prompt exports
export { replaceVariables } from "$lib/prompts/loader.ts";

// CLI functionality is not exported from the main module
// Use cli.ts for CLI functionality

export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export * from "$lib/types/mod.ts";
export * from "$lib/to.ts";
export * from "$lib/summary.ts"; 