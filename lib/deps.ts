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
 * Version: 1.1.4 (managed in versions.ts)
 */
export { BreakdownConfig, type MergedConfig } from "@tettuan/breakdownconfig";

/**
 * CLI parameter parsing utilities for Breakdown. Re-exported from @tettuan/breakdownparams.
 */
export {
  type CustomConfig,
  DEFAULT_CUSTOM_CONFIG,
  type ErrorInfo,
  type OneParamsResult,
  ParamsParser,
  type ParamsResult,
  type TwoParamsResult as BaseTwoParamsResult,
  type ZeroParamsResult,
} from "jsr:@tettuan/breakdownparams@^1.1.1";

export { ParamsParser as BreakdownParams } from "jsr:@tettuan/breakdownparams@^1.1.1";

// Re-export extended TwoParams_Result with params property
export type { TwoParams_Result } from "./types/two_params_result_extension.ts";

// Re-export Result type
export type { Result } from "./types/result.ts";

/**
 * Prompt management utilities for Breakdown. Re-exported from @tettuan/breakdownprompt.
 */
export * from "@tettuan/breakdownprompt";

/**
 * Logging utilities for Breakdown. Re-exported from @tettuan/breakdownlogger.
 */
export * from "jsr:@tettuan/breakdownlogger@^1.0.8";

/**
 * Testing assertion utilities. Re-exported from @std/assert.
 */
export {
  assert,
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertFalse,
  assertGreater,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertIsError,
  assertLess,
  assertLessOrEqual,
  assertMatch,
  assertNotEquals,
  assertNotStrictEquals,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  fail,
} from "@std/assert";

/**
 * Unified error types and factory functions. Re-exported from unified_error_types.
 */
export { ErrorFactory } from "./types/unified_error_types.ts";
export type { ProcessingError } from "./types/unified_error_types.ts";
