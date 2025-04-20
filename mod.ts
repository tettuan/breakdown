/**
 * Breakdown - A tool for breaking down projects into manageable tasks
 *
 * This is the main entry point for the library.
 * All functionality is provided by the following JSR packages:
 * - @tettuan/breakdownconfig - Configuration management
 * - @tettuan/breakdownparams - Parameter processing
 * - @tettuan/breakdownprompt - Prompt processing
 * - @tettuan/breakdownlogger - Logging
 */

// Re-export JSR packages
export {
  type AppConfig,
  BreakdownConfig,
  type MergedConfig,
  type UserConfig,
} from "@tettuan/breakdownconfig";

export {
  type DoubleParamsResult,
  type NoParamsResult,
  ParamsParser,
  type ParamsResult,
  type SingleParamResult,
} from "@tettuan/breakdownparams";

export { PromptManager, type PromptParams, type PromptResult } from "@tettuan/breakdownprompt";

export { BreakdownLogger, type LogLevel } from "@tettuan/breakdownlogger";

// TODO: Export types from core modules as specified in module.ja.md
// TODO: Add proper error handling types as specified in deno.ja.md

// Export main functionality
export { runBreakdown } from "./cli/breakdown.ts";

// Export core functionality
export { Workspace } from "./lib/workspace/workspace.ts";

// TODO: Replace with proper types as specified in module.ja.md
export interface ConversionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// CLI functionality is not exported from the main module
// Use cli.ts for CLI functionality

// TODO: Add exports for:
// - Parser types and functions
// - Prompt handling
// - Path resolution
// - Error types
