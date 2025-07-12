/**
 * @fileoverview TwoParams - Core Domain Aggregate for Breakdown Command Processing
 *
 * Represents the central domain concept combining DirectiveType and LayerType
 * with complete Smart Constructor pattern and path resolution capabilities.
 * This is the missing core domain object identified in the DDD analysis.
 *
 * Design Principles:
 * - Smart Constructor for type-safe creation
 * - Result type for error handling (no partial functions)
 * - Immutable value object (domain aggregate)
 * - Encapsulated path resolution logic
 * - Configuration profile integration
 *
 * @module types/two_params
 */

import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import { ConfigProfileName } from "./config_profile_name.ts";
import { DefaultTypePatternProvider } from "./defaults/default_type_pattern_provider.ts";
import { PromptPath } from "./prompt_path.ts";
import { SchemaPath } from "./schema_path.ts";
import type { TwoParams_Result } from "../deps.ts";

// ============================================================================
// Error Types - Comprehensive validation errors
// ============================================================================

/**
 * TwoParams validation errors - following domain specification
 */
export type TwoParamsValidationError =
  | {
    readonly kind: "InvalidDirective";
    readonly directive: string;
    readonly profile: ConfigProfileName;
    readonly pattern: string;
  }
  | { readonly kind: "InvalidLayer"; readonly layer: string; readonly pattern: string }
  | {
    readonly kind: "UnsupportedCombination";
    readonly directive: string;
    readonly layer: string;
    readonly profile: ConfigProfileName;
  }
  | {
    readonly kind: "PatternNotFound";
    readonly profile: ConfigProfileName;
    readonly configPath: string;
  }
  | { readonly kind: "ConfigurationError"; readonly message: string; readonly details?: unknown };

/**
 * Command generation errors
 */
export type BreakdownCommandError =
  | { readonly kind: "InvalidCommandFormat"; readonly reason: string }
  | { readonly kind: "MissingRequiredParameters"; readonly missing: readonly string[] };

/**
 * Path resolution errors
 */
export type PathResolutionError =
  | { readonly kind: "InvalidBaseDirectory"; readonly baseDir: string }
  | { readonly kind: "PathResolutionFailed"; readonly reason: string; readonly details?: unknown };

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * BreakdownCommand - Command representation for execution
 */
export interface BreakdownCommand {
  readonly directive: string;
  readonly layer: string;
  readonly profile: string;
  readonly fromLayer?: string;
  readonly adaptation?: string;
  readonly timestamp: Date;
}

// ============================================================================
// TwoParams Domain Aggregate
// ============================================================================

/**
 * TwoParams - Core domain aggregate for Breakdown command processing
 *
 * This class represents the central domain concept that combines DirectiveType
 * and LayerType with configuration profile context. It encapsulates all logic
 * related to two-parameter command processing, path resolution, and validation.
 *
 * Key responsibilities:
 * - Type-safe parameter validation
 * - Configuration profile management
 * - Path resolution for prompts and schemas
 * - Command generation for execution
 * - Domain-specific business rules enforcement
 */
export class TwoParams {
  private constructor(
    public readonly directive: DirectiveType,
    public readonly layer: LayerType,
    public readonly profile: ConfigProfileName,
  ) {
    Object.freeze(this);
  }

  // ============================================================================
  // Smart Constructors - Following domain specification exactly
  // ============================================================================

  /**
   * Create TwoParams with explicit validation
   *
   * This is the primary Smart Constructor that validates each component
   * and ensures the combination is valid according to business rules.
   *
   * @param directive - Directive string to validate
   * @param layer - Layer string to validate
   * @param profile - Configuration profile (already validated)
   * @returns Result with TwoParams or comprehensive validation error
   */
  static create(
    directive: string,
    layer: string,
    profile: ConfigProfileName,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Create TwoParams_Result for domain object construction
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      params: [directive, layer],
      demonstrativeType: directive,
      layerType: layer,
      options: {},
    };

    // Get validation patterns
    const patternProvider = new DefaultTypePatternProvider();
    const directivePattern = patternProvider.getDirectivePattern();
    const layerPattern = patternProvider.getLayerTypePattern();

    // Create DirectiveType value object with profile validation
    const directiveTypeResult = DirectiveType.create(directive, profile);
    if (!directiveTypeResult.ok) {
      return error({
        kind: "InvalidDirective",
        directive,
        profile,
        pattern: "DirectiveType validation failed",
      });
    }

    // Create LayerType value object
    const layerTypeResult = LayerType.create(layer);
    if (!layerTypeResult.ok) {
      return error({
        kind: "InvalidLayer",
        layer,
        pattern: "LayerType validation failed",
      });
    }

    const directiveType = directiveTypeResult.data;
    const layerType = layerTypeResult.data;

    // Validate combination using domain logic
    const isValidCombination = layerType.isValidForDirective(directiveType);
    if (!isValidCombination) {
      return error({
        kind: "UnsupportedCombination",
        directive,
        layer,
        profile,
      });
    }

    return ok(new TwoParams(directiveType, layerType, profile));
  }

  /**
   * Create TwoParams from CLI option with automatic default profile handling
   *
   * This Smart Constructor implements the pattern where null/undefined CLI
   * option automatically falls back to "default" profile, ensuring total function behavior.
   *
   * @param directive - Directive string to validate
   * @param layer - Layer string to validate
   * @param profileOption - CLI option (null/undefined → "default")
   * @returns Result with TwoParams (never fails due to profile fallback)
   */
  static createWithCliOption(
    directive: string,
    layer: string,
    profileOption: string | null | undefined,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Handle profile with automatic default fallback
    const profile = ConfigProfileName.fromCliOption(profileOption);

    // Delegate to main create method
    return TwoParams.create(directive, layer, profile);
  }

  // ============================================================================
  // Domain Operations - Core business logic
  // ============================================================================

  /**
   * Convert to BreakdownCommand for execution
   *
   * @returns BreakdownCommand representation
   */
  toCommand(): BreakdownCommand {
    return {
      directive: this.getDirectiveValue(),
      layer: this.getLayerValue(),
      profile: this.profile.toString(),
      timestamp: new Date(),
    };
  }

  /**
   * Validate current state against business rules
   *
   * @returns Result indicating validation success or specific errors
   */
  validate(): Result<void, TwoParamsValidationError> {
    // Re-validate the current combination
    return TwoParams.validateCombination(
      this.getDirectiveValue(),
      this.getLayerValue(),
      this.profile,
    );
  }

  // ============================================================================
  // Path Resolution - Core domain functionality
  // ============================================================================

  /**
   * Get PromptPath value object for path resolution
   *
   * @param fromLayerType - Source layer for transformations
   * @param adaptation - Optional adaptation variant
   * @returns PromptPath value object
   */
  getPromptPath(
    fromLayerType?: string,
    adaptation?: string,
  ): Result<PromptPath, PathResolutionError> {
    const fromLayer = fromLayerType || this.getLayerValue();

    try {
      const result = PromptPath.create(
        "prompts", // TODO: Get from configuration
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
   * Get SchemaPath value object for schema resolution
   *
   * @returns SchemaPath value object
   */
  getSchemaPath(): Result<SchemaPath, PathResolutionError> {
    try {
      const result = SchemaPath.createDefault(
        "schemas", // TODO: Get from configuration
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
   * Resolve prompt file path (convenience method)
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
    const fromLayer = fromLayerType || this.getLayerValue();

    const promptPathResult = PromptPath.create(
      baseDir,
      this.directive.value,
      this.layer.value,
      fromLayer,
      adaptation,
    );

    if (!promptPathResult.ok) {
      return error({
        kind: "PathResolutionFailed",
        reason: `Failed to create prompt path: ${promptPathResult.error.kind}`,
        details: promptPathResult.error,
      });
    }

    return ok(promptPathResult.data.resolve());
  }

  /**
   * Resolve schema file path (convenience method)
   *
   * @param baseDir - Base directory for schemas
   * @returns Resolved file path string
   */
  resolveSchemaFilePath(baseDir: string): Result<string, PathResolutionError> {
    const schemaPathResult = SchemaPath.createDefault(
      baseDir,
      this.directive.value,
      this.layer.value,
    );

    if (!schemaPathResult.ok) {
      return error({
        kind: "PathResolutionFailed",
        reason: `Failed to create schema path: ${schemaPathResult.error.kind}`,
        details: schemaPathResult.error,
      });
    }

    return ok(schemaPathResult.data.resolve());
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
    return (
      this.directive.equals(other.directive) &&
      this.layer.equals(other.layer) &&
      this.profile.equals(other.profile)
    );
  }

  /**
   * String representation for debugging and logging
   *
   * @returns Human-readable string representation
   */
  toString(): string {
    const directive = this.getDirectiveValue();
    const layer = this.getLayerValue();
    const profile = this.profile.toString();

    return `TwoParams(${directive}, ${layer}, ${profile})`;
  }

  // ============================================================================
  // Helper Methods - Internal utilities
  // ============================================================================

  /**
   * Extract DirectiveType string value
   */
  private getDirectiveValue(): string {
    return this.directive.value;
  }

  /**
   * Extract LayerType string value
   */
  private getLayerValue(): string {
    return this.layer.value;
  }

  /**
   * Validate directive-layer combination according to business rules
   *
   * This is where domain-specific business rules would be enforced.
   * For example, certain directive-layer combinations might not be valid
   * for specific profiles or contexts.
   *
   * @param directive - Directive string to validate
   * @param layer - Layer string to validate
   * @param profile - Configuration profile context
   * @returns Result indicating validation success or failure
   */
  private static validateCombination(
    directive: string,
    layer: string,
    profile: ConfigProfileName,
  ): Result<void, TwoParamsValidationError> {
    // Example business rules (these would be loaded from configuration):

    // Rule 1: Some combinations might not be allowed
    const forbiddenCombinations = [
      // Example: defect detection at project level might not be supported
      { directive: "defect", layer: "project" },
    ];

    for (const forbidden of forbiddenCombinations) {
      if (directive === forbidden.directive && layer === forbidden.layer) {
        return error({
          kind: "UnsupportedCombination",
          directive,
          layer,
          profile,
        });
      }
    }

    // Rule 2: Profile-specific validation
    // This would typically load validation rules from the configuration file
    // associated with the profile

    // For now, all valid individual parameters make a valid combination
    return ok(undefined);
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
  profile: ConfigProfileName,
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
