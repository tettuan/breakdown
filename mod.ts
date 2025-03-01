/**
 * Breakdown - Markdown to JSON converter for AI prompts
 * 
 * This module provides the main entry point for the Breakdown library.
 * It exports the core functionality for use in other projects.
 */

// Config exports
export { Config } from "$lib/config/config.ts";
export type { BreakdownConfig, ConfigOptions } from "$lib/config/types.ts";

// Core exports
export { Workspace } from "$lib/core/workspace.ts";
export type { WorkspaceStructure } from "$lib/config/types.ts";

// Prompt exports
export { loadPrompt, replaceVariables } from "$lib/prompts/loader.ts";

// CLI functionality is not exported from the main module
// Use cli.ts for CLI functionality

export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export * from "$lib/types/mod.ts";
export * from "./lib/to.ts";
export * from "./lib/summary.ts"; 