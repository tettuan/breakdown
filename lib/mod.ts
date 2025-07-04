/**
 * Core module for Breakdown functionality.
 *
 * This module serves as the main entry point for the Breakdown tool, providing
 * core processing functions and type exports. It exports essential functionality
 * for workspace initialization and type definitions used throughout the application.
 *
 * @example
 * ```ts
 * import { processWithPrompt, initWorkspace } from "@tettuan/breakdown/lib/mod.ts";
 *
 * // Initialize a new workspace
 * const _workspace = await initWorkspace();
 * ```
 *
 * @module
 */

/**
 * Initializes a new workspace for Breakdown projects.
 * Creates the necessary directory structure and configuration files.
 *
 * @returns {Promise<void>} A promise that resolves when the workspace is initialized
 * @throws {Error} If workspace initialization fails
 * @see {@link ./workspace/workspace.ts}
 */
export { initWorkspace } from "./workspace/workspace.ts";

/**
 * Types representing the available demonstrative and layer types for Breakdown.
 * These types define the core structure and functionality of the Breakdown tool.
 *
 * @see {@link ./types/mod.ts}
 */
export type { DemonstrativeType } from "./types/mod.ts";

// Export core types and utilities
export {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationError,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
} from "./types/mod.ts";

// Export Result types
export { error, ok, type Result } from "./types/result.ts";
