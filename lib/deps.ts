/**
 * External dependencies for the Breakdown tool.
 *
 * Centralizes and re-exports all required dependencies for the project.
 *
 * @module
 */

/**
 * Ensures that a directory exists. If the directory structure does not exist, it is created.
 * Re-exported from @std/fs.
 */
export { ensureDir } from "jsr:@std/fs@0.224.0";

/**
 * Checks if a file or directory exists at the given path.
 * Re-exported from @std/fs.
 */
export { exists } from "jsr:@std/fs@0.224.0";

/**
 * Returns the directory name of a path. Re-exported from @std/path.
 */
export { dirname } from "@std/path";

/**
 * Converts a file URL to a path string. Re-exported from @std/path.
 */
export { fromFileUrl } from "@std/path";

/**
 * Joins all given path segments together. Re-exported from @std/path.
 */
export { join } from "@std/path";

/**
 * Parses command-line flags. Re-exported from @std/flags.
 */
export { parse as parseFlags } from "@std/flags";

/**
 * Types and configuration utilities for Breakdown. Re-exported from @tettuan/breakdownconfig.
 */
export { BreakdownConfig, type MergedConfig } from "jsr:@tettuan/breakdownconfig@^1.1.0";

/**
 * CLI parameter parsing utilities for Breakdown. Re-exported from @tettuan/breakdownparams.
 */
export {
  type ErrorInfo,
  type OneParamsResult,
  type ParamsParser,
  ParamsParser as BreakdownParams,
  type ParamsResult,
  type TwoParamsResult,
  type ZeroParamsResult,
} from "jsr:@tettuan/breakdownparams@1.0.1";

/**
 * Prompt management utilities for Breakdown. Re-exported from @tettuan/breakdownprompt.
 */
export * from "jsr:@tettuan/breakdownprompt@1.1.2";

/**
 * Logging utilities for Breakdown. Re-exported from @tettuan/breakdownlogger.
 */
export * from "jsr:@tettuan/breakdownlogger@1.0.1";
