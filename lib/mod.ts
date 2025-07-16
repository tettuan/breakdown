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
 * Types representing the available directive and layer types for Breakdown.
 * These types define the core structure and functionality of the Breakdown tool.
 *
 * @see {@link ./types/mod.ts}
 */
// NOTE: DirectiveType replaced with DirectiveType during refactor
// export type { DirectiveType } from "./types/mod.ts";

// Export core types and utilities from DDD structure
export { TwoParams, type TwoParamsValidationError } from "./domain/mod.ts";

export {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
} from "./types/mod.ts";

// Export Result types (Result type already exported via types/mod.ts)
export { error, ok } from "./types/result.ts";

// Export unified error types following Totality principle
export type { ProcessingError, UnifiedError } from "./types/unified_error_types.ts";
