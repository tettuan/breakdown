/**
 * @fileoverview TwoParams Integrated Module - mod.ts Compatible Export API
 *
 * This module integrates the optimized TwoParams implementation with the transitional
 * TwoParamsCollection and other legacy components to provide a unified mod.ts compatible
 * export API. This ensures seamless migration while maintaining type safety and domain
 * correctness.
 *
 * ## Integration Strategy
 * - Core Domain: Uses optimized TwoParams implementation as authoritative source
 * - Compatibility Layer: Provides adapter for existing API patterns  
 * - Collection Support: Maintains TwoParamsCollection for batch operations
 * - Export Unification: Creates single entry point for all TwoParams-related exports
 * - API Bridging: Bridges optimized API with legacy API patterns
 *
 * ## Design Principles
 * - Smart Constructor pattern with Result<T, E>
 * - Totality principle (no exceptions, all errors as values)
 * - Domain-Driven Design with clear value object boundaries
 * - Backward compatibility with existing mod.ts exports
 * - API compatibility adapter for seamless migration
 *
 * @module tmp/two_params_integrated
 */

// ============================================================================
// Core Domain Imports - Optimized + Legacy Implementations
// ============================================================================

// Optimized implementation (authoritative)
import {
  TwoParams as OptimizedTwoParams,
  type TwoParamsValidationError as OptimizedValidationError,
  type PathConfig,
} from "./refactor-ddd-totality-fusion-20250705-1754/two_params_optimized.ts";

// Legacy implementation for compatibility
import {
  TwoParams as LegacyTwoParams,
  TwoParamsCollection,
  type TwoParamsError as LegacyTwoParamsError,
  formatTwoParamsError,
  isDirectiveCreationFailedError,
  isLayerCreationFailedError,
  isInvalidCombinationError,
  isProfileValidationFailedError,
  isPathResolutionFailedError,
} from "../lib/domain/core/two_params_aggregate.ts";

import {
  DirectiveType,
  type DirectiveTypeError,
} from "../lib/domain/core/value_objects/directive_type.ts";

import {
  LayerType,
  TwoParamsLayerTypePattern,
  type LayerTypeError,
} from "../lib/domain/core/value_objects/layer_type.ts";

// ============================================================================
// Supporting Types and Utilities
// ============================================================================

import type { Result } from "../lib/types/result.ts";
import { error, ok } from "../lib/types/result.ts";
import { ConfigProfileName } from "../lib/types/config_profile_name.ts";
import { DefaultTypePatternProvider } from "../lib/types/defaults/default_type_pattern_provider.ts";
import { PromptPath } from "../lib/types/prompt_path.ts";
import { SchemaPath } from "../lib/types/schema_path.ts";
import type { TwoParams_Result } from "../lib/deps.ts";

// ============================================================================
// Unified Error Types - Comprehensive error handling
// ============================================================================

/**
 * Unified TwoParams error type that combines optimized and legacy error types
 * for comprehensive error handling across the application.
 */
export type TwoParamsValidationError = OptimizedValidationError | LegacyTwoParamsError | {
  readonly kind: "LegacyCompatibilityError";
  readonly operation: string;
  readonly reason: string;
  readonly details?: unknown;
};

/**
 * For mod.ts compatibility - alias to legacy error type
 */
export type TwoParamsError = LegacyTwoParamsError;

/**
 * Command generation errors (from legacy implementation)
 */
export type BreakdownCommandError =
  | { readonly kind: "InvalidCommandFormat"; readonly reason: string }
  | { readonly kind: "MissingRequiredParameters"; readonly missing: readonly string[] };

/**
 * Path resolution errors (from legacy implementation)
 */
export type PathResolutionError =
  | { readonly kind: "InvalidBaseDirectory"; readonly baseDir: string }
  | { readonly kind: "PathResolutionFailed"; readonly reason: string; readonly details?: unknown };

// ============================================================================
// Unified TwoParams Implementation
// ============================================================================

/**
 * TwoParams - Unified implementation bridging optimized and legacy approaches
 *
 * This class provides a unified interface that:
 * - Uses the optimized implementation as the authoritative source
 * - Maintains compatibility with existing mod.ts export patterns
 * - Provides adapter layer for legacy API compatibility
 * - Ensures type safety and domain correctness
 *
 * ## Smart Constructor Pattern
 * All creation methods follow the Smart Constructor pattern with Result<T, E>
 * to ensure total functions and explicit error handling.
 *
 * ## API Compatibility
 * - New optimized API: resolvePromptPath(), resolveSchemaPath()
 * - Legacy compatibility: getPromptPath(), getSchemaPath(), toCommand()
 * - Configuration externalization: PathConfig support
 *
 * @example Creating TwoParams
 * ```typescript
 * const result = TwoParams.create("to", "project");
 * if (result.ok) {
 *   const twoParams = result.data;
 *   console.log(twoParams.directive.value); // "to"
 *   console.log(twoParams.layer.value); // "project"
 * }
 * ```
 *
 * @example Path resolution (optimized API)
 * ```typescript
 * const twoParams = TwoParams.create("summary", "issue").data!;
 * const promptPath = twoParams.resolvePromptPath();
 * const schemaPath = twoParams.resolveSchemaPath();
 * ```
 *
 * @example Path resolution (legacy compatibility)
 * ```typescript
 * const twoParams = TwoParams.create("summary", "issue").data!;
 * const promptResult = twoParams.getPromptPath();
 * const schemaResult = twoParams.getSchemaPath();
 * ```
 */
export class TwoParams {
  /**
   * Default path configuration (exported from optimized implementation)
   */
  static readonly DEFAULT_CONFIG: PathConfig = OptimizedTwoParams.DEFAULT_CONFIG;

  /**
   * Private constructor - enforces Smart Constructor pattern
   */
  private constructor(
    private readonly optimizedImpl: OptimizedTwoParams,
    private readonly legacyAdapter?: LegacyTwoParams,
  ) {
    Object.freeze(this);
  }

  // ============================================================================
  // Property Accessors - Delegate to optimized implementation
  // ============================================================================

  /**
   * Get DirectiveType value object
   */
  get directive(): DirectiveType {
    return this.optimizedImpl.directive;
  }

  /**
   * Get LayerType value object
   */
  get layer(): LayerType {
    return this.optimizedImpl.layer;
  }

  /**
   * Get configuration profile
   */
  get profile(): ConfigProfileName {
    return this.optimizedImpl.profile;
  }

  // ============================================================================
  // Smart Constructors - Primary creation methods
  // ============================================================================

  /**
   * Create TwoParams with explicit validation
   *
   * Primary Smart Constructor that validates directive and layer values
   * and ensures their combination is valid according to business rules.
   *
   * @param directive - Directive string to validate
   * @param layer - Layer string to validate
   * @param profile - Configuration profile (optional, defaults to "default")
   * @returns Result with TwoParams or comprehensive validation error
   */
  static create(
    directive: string,
    layer: string,
    profile?: ConfigProfileName,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Use optimized implementation as primary
    const optimizedResult = OptimizedTwoParams.create(directive, layer, profile);
    
    if (!optimizedResult.ok) {
      return error(optimizedResult.error);
    }

    // Create legacy adapter for compatibility
    const legacyResult = LegacyTwoParams.create(directive, layer, profile);
    const legacyAdapter = legacyResult.ok ? legacyResult.data : undefined;

    return ok(new TwoParams(optimizedResult.data, legacyAdapter));
  }

  /**
   * Create TwoParams from CLI option with automatic default profile handling
   *
   * This Smart Constructor implements the pattern where null/undefined CLI
   * option automatically falls back to "default" profile.
   *
   * @param directive - Directive string to validate
   * @param layer - Layer string to validate
   * @param profileOption - CLI option (null/undefined → "default")
   * @returns Result with TwoParams
   */
  static createWithCliOption(
    directive: string,
    layer: string,
    profileOption: string | null | undefined,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Use optimized implementation's CLI option handling
    const optimizedResult = OptimizedTwoParams.createWithCliOption(directive, layer, profileOption);
    
    if (!optimizedResult.ok) {
      return error(optimizedResult.error);
    }

    // Create legacy adapter for compatibility
    const profile = ConfigProfileName.fromCliOption(profileOption);
    const legacyResult = LegacyTwoParams.create(directive, layer, profile);
    const legacyAdapter = legacyResult.ok ? legacyResult.data : undefined;

    return ok(new TwoParams(optimizedResult.data, legacyAdapter));
  }

  /**
   * Create TwoParams from existing value objects
   *
   * Alternative constructor for when DirectiveType and LayerType instances
   * are already created and validated.
   *
   * @param directive - Validated DirectiveType instance
   * @param layer - Validated LayerType instance
   * @param profile - Optional configuration profile
   * @returns Result with TwoParams or error
   */
  static fromValueObjects(
    directive: DirectiveType,
    layer: LayerType,
    profile?: ConfigProfileName,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Use optimized implementation
    const optimizedResult = OptimizedTwoParams.fromValueObjects(directive, layer, profile);
    
    if (!optimizedResult.ok) {
      return error(optimizedResult.error);
    }

    // Create legacy adapter for compatibility
    const legacyResult = LegacyTwoParams.fromValueObjects(directive, layer, profile);
    const legacyAdapter = legacyResult.ok ? legacyResult.data : undefined;

    return ok(new TwoParams(optimizedResult.data, legacyAdapter));
  }

  // ============================================================================
  // Legacy Compatibility Methods
  // ============================================================================

  /**
   * Create TwoParams from TwoParams_Result (legacy compatibility)
   *
   * Provides compatibility with the existing BreakdownParams package
   * by accepting TwoParams_Result structure.
   *
   * @param result - TwoParams_Result from BreakdownParams
   * @returns Result with TwoParams or error
   */
  static fromTwoParamsResult(
    result: TwoParams_Result,
  ): Result<TwoParams, TwoParamsValidationError> {
    try {
      if (result.type !== "two" || !Array.isArray(result.params) || result.params.length !== 2) {
        return error({
          kind: "LegacyCompatibilityError",
          operation: "fromTwoParamsResult",
          reason: "Invalid TwoParams_Result structure",
          details: result,
        });
      }

      const [directive, layer] = result.params;
      
      // Extract profile from options if available
      let profile: ConfigProfileName | undefined;
      if (result.options?.profile && typeof result.options.profile === "string") {
        profile = ConfigProfileName.fromString(result.options.profile);
      }

      return TwoParams.create(directive, layer, profile);
    } catch (e) {
      return error({
        kind: "LegacyCompatibilityError",
        operation: "fromTwoParamsResult",
        reason: "Error processing TwoParams_Result",
        details: e,
      });
    }
  }

  // ============================================================================
  // Domain Operations - Core business logic
  // ============================================================================

  /**
   * Convert to BreakdownCommand for execution (legacy compatibility)
   *
   * @returns BreakdownCommand representation
   */
  toCommand(): {
    directive: string;
    layer: string;
    profile?: string;
    timestamp: Date;
  } {
    if (this.legacyAdapter) {
      return this.legacyAdapter.toCommand();
    }
    
    // Fallback to optimized implementation data
    const commandInfo = this.optimizedImpl.getCommandInfo();
    return {
      ...commandInfo,
      timestamp: new Date(),
    };
  }

  /**
   * Get command info (optimized API)
   *
   * @returns Command information without timestamp
   */
  getCommandInfo(): {
    directive: string;
    layer: string;
    profile: string;
  } {
    return this.optimizedImpl.getCommandInfo();
  }

  /**
   * Validate current state against business rules
   *
   * @returns Result indicating validation success or specific errors
   */
  validate(): Result<void, TwoParamsValidationError> {
    // Use optimized implementation's validation
    const result = this.optimizedImpl.validate();
    if (!result.ok) {
      return error(result.error);
    }

    return ok(undefined);
  }

  // ============================================================================
  // Path Resolution - Optimized + Legacy Compatibility
  // ============================================================================

  /**
   * Resolve prompt path (optimized API)
   *
   * @param config - Path configuration (optional, uses default if not provided)
   * @param fromLayerType - Source layer for transformations
   * @param adaptation - Optional adaptation variant
   * @returns Resolved prompt path string
   */
  resolvePromptPath(
    config?: PathConfig,
    fromLayerType?: string,
    adaptation?: string,
  ): Result<string, TwoParamsValidationError> {
    const result = this.optimizedImpl.resolvePromptPath(config, fromLayerType, adaptation);
    if (!result.ok) {
      return error(result.error);
    }
    return ok(result.data);
  }

  /**
   * Get PromptPath value object for path resolution (legacy compatibility)
   *
   * @param fromLayerType - Source layer for transformations
   * @param adaptation - Optional adaptation variant
   * @returns PromptPath value object
   */
  getPromptPath(
    fromLayerType?: string,
    adaptation?: string,
  ): Result<PromptPath, PathResolutionError> {
    if (this.legacyAdapter) {
      return this.legacyAdapter.getPromptPath(fromLayerType, adaptation);
    }

    // Fallback: create PromptPath from optimized implementation
    const fromLayer = fromLayerType || this.layer.value;
    
    try {
      const result = PromptPath.create(
        TwoParams.DEFAULT_CONFIG.promptsDir,
        this.directive.value,
        this.layer.value,
        fromLayer,
        adaptation,
      );

      if (!result.ok) {
        return error({
          kind: "PathResolutionFailed",
          reason: `PromptPath creation failed: ${result.error.kind}`,
          details: result.error,
        });
      }

      return ok(result.data);
    } catch (err) {
      return error({
        kind: "PathResolutionFailed",
        reason: "Unexpected error during PromptPath creation",
        details: err,
      });
    }
  }

  /**
   * Resolve schema path (optimized API)
   *
   * @param config - Path configuration (optional, uses default if not provided)
   * @returns Resolved schema path string
   */
  resolveSchemaPath(
    config?: PathConfig,
  ): Result<string, TwoParamsValidationError> {
    const result = this.optimizedImpl.resolveSchemaPath(config);
    if (!result.ok) {
      return error(result.error);
    }
    return ok(result.data);
  }

  /**
   * Resolve output directory path (optimized API)
   *
   * @param config - Path configuration (optional, uses default if not provided)
   * @returns Resolved output directory path string
   */
  resolveOutputPath(
    config?: PathConfig,
  ): Result<string, TwoParamsValidationError> {
    const result = this.optimizedImpl.resolveOutputPath(config);
    if (!result.ok) {
      return error(result.error);
    }
    return ok(result.data);
  }

  /**
   * Get SchemaPath value object for schema resolution (legacy compatibility)
   *
   * @returns SchemaPath value object
   */
  getSchemaPath(): Result<SchemaPath, PathResolutionError> {
    if (this.legacyAdapter) {
      return this.legacyAdapter.getSchemaPath();
    }

    // Fallback: create SchemaPath from optimized implementation
    try {
      const result = SchemaPath.createDefault(
        TwoParams.DEFAULT_CONFIG.schemasDir,
        this.directive.value,
        this.layer.value,
      );

      if (!result.ok) {
        return error({
          kind: "PathResolutionFailed",
          reason: `SchemaPath creation failed: ${result.error.kind}`,
          details: result.error,
        });
      }

      return ok(result.data);
    } catch (err) {
      return error({
        kind: "PathResolutionFailed",
        reason: "Unexpected error during SchemaPath creation",
        details: err,
      });
    }
  }

  /**
   * Resolve prompt file path (legacy convenience method)
   *
   * @param baseDir - Base directory for prompts
   * @param fromLayerType - Source layer type
   * @param adaptation - Optional adaptation
   * @returns Resolved file path string
   */
  resolvePromptFilePath(
    baseDir: string,
    fromLayerType?: string,
    adaptation?: string,
  ): Result<string, PathResolutionError> {
    if (this.legacyAdapter) {
      return this.legacyAdapter.resolvePromptFilePath(baseDir, fromLayerType, adaptation);
    }

    // Fallback using optimized implementation
    const config: PathConfig = {
      ...TwoParams.DEFAULT_CONFIG,
      promptsDir: baseDir,
    };
    
    const result = this.optimizedImpl.resolvePromptPath(config, fromLayerType, adaptation);
    
    if (!result.ok) {
      return error({
        kind: "PathResolutionFailed",
        reason: result.error.message || "Unknown error",
        details: result.error,
      });
    }

    return ok(result.data);
  }

  /**
   * Resolve schema file path (legacy convenience method)
   *
   * @param baseDir - Base directory for schemas
   * @returns Resolved file path string
   */
  resolveSchemaFilePath(baseDir: string): Result<string, PathResolutionError> {
    if (this.legacyAdapter) {
      return this.legacyAdapter.resolveSchemaFilePath(baseDir);
    }

    // Fallback using optimized implementation
    const config: PathConfig = {
      ...TwoParams.DEFAULT_CONFIG,
      schemasDir: baseDir,
    };
    
    const result = this.optimizedImpl.resolveSchemaPath(config);
    
    if (!result.ok) {
      return error({
        kind: "PathResolutionFailed",
        reason: result.error.message || "Unknown error",
        details: result.error,
      });
    }

    return ok(result.data);
  }

  // ============================================================================
  // Value Object Methods - Standard comparison and string operations
  // ============================================================================

  /**
   * Type-safe equality comparison
   *
   * @param other - Another TwoParams instance to compare
   * @returns true if instances are equal
   */
  equals(other: TwoParams): boolean {
    return this.optimizedImpl.equals(other.optimizedImpl);
  }

  /**
   * String representation for debugging and logging
   *
   * @returns Human-readable string representation
   */
  toString(): string {
    return this.optimizedImpl.toString();
  }

  /**
   * Debug string with detailed information
   *
   * @returns Detailed string representation for debugging
   */
  toDebugString(): string {
    return this.optimizedImpl.toDebugString();
  }

  // ============================================================================
  // Type Guards and Utilities
  // ============================================================================

  /**
   * Type guard for TwoParams instances
   *
   * @param value - Value to check
   * @returns true if value is TwoParams
   */
  static is(value: unknown): value is TwoParams {
    return value instanceof TwoParams;
  }
}

// ============================================================================
// Factory Functions - Convenience constructors
// ============================================================================

/**
 * Create TwoParams with error throwing (for cases where error is unexpected)
 *
 * @param directive - Directive string
 * @param layer - Layer string
 * @param profile - Configuration profile
 * @returns TwoParams instance
 * @throws Error if validation fails
 */
export function createTwoParamsUnsafe(
  directive: string,
  layer: string,
  profile?: ConfigProfileName,
): TwoParams {
  const result = TwoParams.create(directive, layer, profile);
  if (!result.ok) {
    throw new Error(`Invalid TwoParams: ${result.error.kind} - ${JSON.stringify(result.error)}`);
  }
  return result.data;
}

/**
 * Create TwoParams from CLI arguments with default profile handling
 *
 * @param directive - Directive string from CLI
 * @param layer - Layer string from CLI
 * @param profileOption - Profile option from CLI (optional)
 * @returns TwoParams instance
 * @throws Error if validation fails
 */
export function createTwoParamsFromCliUnsafe(
  directive: string,
  layer: string,
  profileOption?: string,
): TwoParams {
  const result = TwoParams.createWithCliOption(directive, layer, profileOption);
  if (!result.ok) {
    throw new Error(
      `Invalid TwoParams from CLI: ${result.error.kind} - ${JSON.stringify(result.error)}`,
    );
  }
  return result.data;
}

// ============================================================================
// mod.ts Compatible Exports - Unified export interface
// ============================================================================

// Core TwoParams exports
export { TwoParams };
export type { TwoParamsValidationError, BreakdownCommandError, PathResolutionError };

// Collection operations
export { TwoParamsCollection };

// Value object exports
export { DirectiveType, LayerType };
export type { DirectiveTypeError, LayerTypeError };
export { TwoParamsLayerTypePattern };

// Domain error handling
export type { TwoParamsError as DomainTwoParamsError };
export {
  formatTwoParamsError,
  isDirectiveCreationFailedError,
  isLayerCreationFailedError,
  isInvalidCombinationError,
  isProfileValidationFailedError,
  isPathResolutionFailedError,
};

// Supporting types and utilities
export { ConfigProfileName };
export { DefaultTypePatternProvider };
export { PromptPath, SchemaPath };
export type { Result };
export { error, ok };

// Legacy compatibility
export type { TwoParams_Result };

// ============================================================================
// Unified Error Formatting
// ============================================================================

/**
 * Format any TwoParams-related error for display
 *
 * @param error - Any TwoParams error type
 * @returns Formatted error message
 */
export function formatTwoParamsIntegratedError(
  error: TwoParamsValidationError | BreakdownCommandError | PathResolutionError,
): string {
  // Handle domain errors
  if ("kind" in error && error.kind in [
    "DirectiveCreationFailed",
    "LayerCreationFailed", 
    "InvalidCombination",
    "ProfileValidationFailed",
    "PathResolutionFailed"
  ]) {
    return formatTwoParamsError(error as DomainTwoParamsError);
  }

  // Handle specific error types
  switch (error.kind) {
    case "LegacyCompatibilityError":
      return `Legacy compatibility error: ${error.reason}`;
    case "InvalidCommandFormat":
      return `Invalid command format: ${error.reason}`;
    case "MissingRequiredParameters":
      return `Missing required parameters: ${error.missing.join(", ")}`;
    case "InvalidBaseDirectory":
      return `Invalid base directory: ${error.baseDir}`;
    case "PathResolutionFailed":
      return `Path resolution failed: ${error.reason}`;
    default:
      return `Unknown error: ${JSON.stringify(error)}`;
  }
}

// ============================================================================
// Type Guards for Error Discrimination
// ============================================================================

/**
 * Type guard for domain TwoParams errors
 */
export function isDomainTwoParamsError(
  error: TwoParamsValidationError,
): error is DomainTwoParamsError {
  return error.kind !== "LegacyCompatibilityError";
}

/**
 * Type guard for legacy compatibility errors
 */
export function isLegacyCompatibilityError(
  error: TwoParamsValidationError,
): error is Extract<TwoParamsValidationError, { kind: "LegacyCompatibilityError" }> {
  return error.kind === "LegacyCompatibilityError";
}

/**
 * Type guard for path resolution errors
 */
export function isPathResolutionError(
  error: unknown,
): error is PathResolutionError {
  return typeof error === "object" && 
         error !== null && 
         "kind" in error && 
         (error.kind === "InvalidBaseDirectory" || error.kind === "PathResolutionFailed");
}

/**
 * Type guard for command errors
 */
export function isBreakdownCommandError(
  error: unknown,
): error is BreakdownCommandError {
  return typeof error === "object" && 
         error !== null && 
         "kind" in error && 
         (error.kind === "InvalidCommandFormat" || error.kind === "MissingRequiredParameters");
}