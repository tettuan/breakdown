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
} from "./types/mod.ts";
// TypePatternProvider export removed - JSR統合によりTypePatternProviderは非推奨
// JSR統合では TypeFactory.createFromJSR() を直接使用してください

// Export Result types (Result type already exported via types/mod.ts)
export { error, ok } from "./types/result.ts";

// Export unified error types following Totality principle
export type { ProcessingError, UnifiedError } from "./types/unified_error_types.ts";
