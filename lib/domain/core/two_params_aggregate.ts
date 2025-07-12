/**
 * @fileoverview TwoParams Domain Aggregate - Integrated Value Objects Implementation
 *
 * This module provides the unified TwoParams aggregate root that integrates
 * the new DirectiveType and LayerType value objects following Domain-Driven
 * Design principles. It replaces the fragmented implementation with a cohesive
 * domain model that ensures type safety and business rule enforcement.
 *
 * ## Design Patterns Applied
 * - Aggregate Root: Encapsulates DirectiveType and LayerType coordination
 * - Smart Constructor: Type-safe creation with comprehensive validation
 * - Result Type: No exceptions, all errors as values (Totality principle)
 * - Value Object: Immutable aggregate with domain operations
 *
 * ## Domain Context
 * TwoParams represents the core command structure in Breakdown, combining
 * processing direction (DirectiveType) with target hierarchy (LayerType).
 * This aggregate ensures valid combinations and provides path resolution.
 *
 * @module domain/core/two_params_aggregate
 */

import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";
import { DirectiveType, type DirectiveTypeError } from "./value_objects/directive_type.ts";
import { LayerType, type LayerTypeError } from "./value_objects/layer_type.ts";
import type { ConfigProfileName } from "../../types/config_profile_name.ts";
import { ConfigProfileName as ConfigProfileNameClass } from "../../types/config_profile_name.ts";

/**
 * Discriminated Union for TwoParams-specific errors
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 */
export type TwoParamsError =
  | {
    kind: "DirectiveCreationFailed";
    directiveValue: string;
    underlyingError: DirectiveTypeError;
    message: string;
  }
  | {
    kind: "LayerCreationFailed";
    layerValue: string;
    underlyingError: LayerTypeError;
    message: string;
  }
  | {
    kind: "InvalidCombination";
    directive: string;
    layer: string;
    reason: string;
    message: string;
  }
  | {
    kind: "ProfileValidationFailed";
    directive: string;
    layer: string;
    profile: string;
    message: string;
  }
  | {
    kind: "PathResolutionFailed";
    operation: string;
    reason: string;
    message: string;
  };

/**
 * Type guards for TwoParamsError discrimination
 */
export function isDirectiveCreationFailedError(
  error: TwoParamsError,
): error is Extract<TwoParamsError, { kind: "DirectiveCreationFailed" }> {
  return error.kind === "DirectiveCreationFailed";
}

export function isLayerCreationFailedError(
  error: TwoParamsError,
): error is Extract<TwoParamsError, { kind: "LayerCreationFailed" }> {
  return error.kind === "LayerCreationFailed";
}

export function isInvalidCombinationError(
  error: TwoParamsError,
): error is Extract<TwoParamsError, { kind: "InvalidCombination" }> {
  return error.kind === "InvalidCombination";
}

export function isProfileValidationFailedError(
  error: TwoParamsError,
): error is Extract<TwoParamsError, { kind: "ProfileValidationFailed" }> {
  return error.kind === "ProfileValidationFailed";
}

export function isPathResolutionFailedError(
  error: TwoParamsError,
): error is Extract<TwoParamsError, { kind: "PathResolutionFailed" }> {
  return error.kind === "PathResolutionFailed";
}

/**
 * TwoParams Domain Aggregate
 *
 * The central aggregate root that coordinates DirectiveType and LayerType
 * value objects. This class ensures business rules are enforced and provides
 * domain operations for path resolution and command generation.
 *
 * ## Business Rules
 * - DirectiveType and LayerType must be individually valid
 * - The combination must be supported by domain rules
 * - Configuration profile compatibility must be verified
 * - Path resolution operations must be type-safe
 *
 * ## Domain Operations
 * - Prompt template path resolution
 * - Schema file path resolution
 * - Output directory path generation
 * - Command structure creation
 *
 * @example Basic creation
 * ```typescript
 * const result = TwoParams.create("to", "project");
 * if (result.ok) {
 *   console.log(result.data.directive.value); // "to"
 *   console.log(result.data.layer.value); // "project"
 * }
 * ```
 *
 * @example Path resolution
 * ```typescript
 * const twoParams = TwoParams.create("summary", "issue").data!;
 * const promptPath = twoParams.resolvePromptPath();
 * const schemaPath = twoParams.resolveSchemaPath();
 * ```
 */
export class TwoParams {
  /**
   * Private constructor - Smart Constructor pattern
   * Prevents direct instantiation and enforces validation
   */
  private constructor(
    private readonly _directive: DirectiveType,
    private readonly _layer: LayerType,
    private readonly _profile?: ConfigProfileName,
  ) {
    Object.freeze(this);
  }

  /**
   * Get the DirectiveType value object
   * @returns The validated DirectiveType instance
   */
  get directive(): DirectiveType {
    return this._directive;
  }

  /**
   * Get the LayerType value object
   * @returns The validated LayerType instance
   */
  get layer(): LayerType {
    return this._layer;
  }

  /**
   * Get the configuration profile if any
   * @returns The ConfigProfileName or undefined
   */
  get profile(): ConfigProfileName | undefined {
    return this._profile;
  }

  /**
   * Create TwoParams from string values
   *
   * Primary Smart Constructor that creates DirectiveType and LayerType
   * value objects and validates their combination according to domain rules.
   *
   * @param directiveValue Raw directive string
   * @param layerValue Raw layer string
   * @param profile Optional configuration profile
   * @returns Result with TwoParams or error
   */
  static create(
    directiveValue: string,
    layerValue: string,
    profile?: ConfigProfileName,
  ): Result<TwoParams, TwoParamsError> {
    // Create DirectiveType value object with default profile if none provided
    const defaultProfile = profile || ConfigProfileNameClass.createDefault();
    const directiveResult = DirectiveType.create(directiveValue, defaultProfile);
    if (!directiveResult.ok) {
      return error({
        kind: "DirectiveCreationFailed",
        directiveValue,
        underlyingError: directiveResult.error,
        message: `Failed to create DirectiveType from '${directiveValue}': ${directiveResult.error.message}`,
      });
    }

    // Create LayerType value object
    const layerResult = LayerType.create(layerValue);
    if (!layerResult.ok) {
      return error({
        kind: "LayerCreationFailed",
        layerValue,
        underlyingError: layerResult.error,
        message: `Failed to create LayerType from '${layerValue}': ${layerResult.error.message}`,
      });
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    // Validate business rule: combination compatibility
    const combinationValid = layer.isValidForDirective({ value: directive.value });
    if (!combinationValid) {
      return error({
        kind: "InvalidCombination",
        directive: directiveValue,
        layer: layerValue,
        reason: `LayerType '${layerValue}' is not compatible with DirectiveType '${directiveValue}'`,
        message: `Invalid combination: DirectiveType '${directiveValue}' cannot be used with LayerType '${layerValue}'`,
      });
    }

    // Validate profile compatibility if provided
    if (profile) {
      // Note: Profile validation would be implemented here when ConfigProfileName
      // provides validation methods. For now, we accept any profile.
      // This is a placeholder for future enhancement.
    }

    return ok(new TwoParams(directive, layer, profile));
  }

  /**
   * Create TwoParams from existing value objects
   *
   * Alternative constructor for when DirectiveType and LayerType instances
   * are already created and validated. Still validates combination rules.
   *
   * @param directive Validated DirectiveType instance
   * @param layer Validated LayerType instance
   * @param profile Optional configuration profile
   * @returns Result with TwoParams or error
   */
  static fromValueObjects(
    directive: DirectiveType,
    layer: LayerType,
    profile?: ConfigProfileName,
  ): Result<TwoParams, TwoParamsError> {
    // Validate business rule: combination compatibility
    const combinationValid = layer.isValidForDirective({ value: directive.value });
    if (!combinationValid) {
      return error({
        kind: "InvalidCombination",
        directive: directive.value,
        layer: layer.value,
        reason: `LayerType '${layer.value}' is not compatible with DirectiveType '${directive.value}'`,
        message: `Invalid combination: DirectiveType '${directive.value}' cannot be used with LayerType '${layer.value}'`,
      });
    }

    return ok(new TwoParams(directive, layer, profile));
  }

  /**
   * Resolve prompt template file path
   *
   * Domain operation that generates the appropriate prompt template path
   * based on the DirectiveType and LayerType combination.
   *
   * @param baseDir Base directory for prompts (default: "prompts")
   * @param fromLayerType Source layer type for context (optional)
   * @param adaptation Adaptation modifier (optional)
   * @returns Result with prompt file path or error
   */
  resolvePromptPath(
    baseDir = "prompts",
    fromLayerType?: string,
    adaptation?: string,
  ): Result<string, TwoParamsError> {
    try {
      // Use LayerType's domain operation for filename generation
      const filename = this._layer.getPromptFilename(
        fromLayerType || this._layer.value,
        adaptation,
      );

      // Construct full path using DirectiveType and LayerType
      const fullPath = `${baseDir}/${this._directive.value}/${this._layer.value}/${filename}`;

      return ok(fullPath);
    } catch (e) {
      return error({
        kind: "PathResolutionFailed",
        operation: "resolvePromptPath",
        reason: e instanceof Error ? e.message : "Unknown error",
        message: `Failed to resolve prompt path for ${this._directive.value}/${this._layer.value}`,
      });
    }
  }

  /**
   * Resolve schema file path
   *
   * Domain operation that generates the appropriate schema file path
   * based on the DirectiveType and LayerType combination.
   *
   * @param baseDir Base directory for schemas (default: "schema")
   * @returns Result with schema file path or error
   */
  resolveSchemaPath(baseDir = "schema"): Result<string, TwoParamsError> {
    try {
      // Use LayerType's domain operation for filename generation
      const filename = this._layer.getSchemaFilename();

      // Construct full path using DirectiveType and LayerType
      const fullPath = `${baseDir}/${this._directive.value}/${this._layer.value}/${filename}`;

      return ok(fullPath);
    } catch (e) {
      return error({
        kind: "PathResolutionFailed",
        operation: "resolveSchemaPath",
        reason: e instanceof Error ? e.message : "Unknown error",
        message: `Failed to resolve schema path for ${this._directive.value}/${this._layer.value}`,
      });
    }
  }

  /**
   * Generate output directory path
   *
   * Domain operation that creates an output directory path structure
   * based on the DirectiveType and LayerType combination.
   *
   * @param baseDir Base directory for output (default: "output")
   * @returns Result with output directory path or error
   */
  resolveOutputDirectory(baseDir = "output"): Result<string, TwoParamsError> {
    try {
      const directoryPath = `${baseDir}/${this._directive.value}/${this._layer.value}`;
      return ok(directoryPath);
    } catch (e) {
      return error({
        kind: "PathResolutionFailed",
        operation: "resolveOutputDirectory",
        reason: e instanceof Error ? e.message : "Unknown error",
        message: `Failed to resolve output directory for ${this._directive.value}/${this._layer.value}`,
      });
    }
  }

  /**
   * Check equality with another TwoParams
   *
   * Domain operation for comparing two TwoParams instances based on
   * their DirectiveType and LayerType values.
   *
   * @param other Another TwoParams instance
   * @returns true if both directive and layer values are equal
   */
  equals(other: TwoParams): boolean {
    return this._directive.equals(other._directive) &&
           this._layer.equals(other._layer);
  }

  /**
   * Get command structure for execution
   *
   * Domain operation that creates a command structure suitable
   * for external system integration or execution engines.
   *
   * @returns Command object with directive, layer, and metadata
   */
  toCommand(): {
    directive: string;
    layer: string;
    profile?: string;
    timestamp: Date;
  } {
    return {
      directive: this._directive.value,
      layer: this._layer.value,
      profile: this._profile?.value,
      timestamp: new Date(),
    };
  }

  /**
   * Validate compatibility with a configuration profile
   *
   * Domain operation that checks if this TwoParams instance is
   * compatible with a specific configuration profile.
   *
   * @param profile Configuration profile to validate against
   * @returns Result with true or validation error
   */
  validateProfile(profile: ConfigProfileName): Result<true, TwoParamsError> {
    // Note: This would use DirectiveType and LayerType profile validation
    // methods when they become available. For now, we assume compatibility.
    
    // Placeholder implementation
    const directiveValid = true; // directive.isValidForProfile(profile)
    const layerValid = true; // layer.isValidForProfile(profile)

    if (!directiveValid || !layerValid) {
      return error({
        kind: "ProfileValidationFailed",
        directive: this._directive.value,
        layer: this._layer.value,
        profile: profile.value,
        message: `TwoParams combination is not valid for profile '${profile.value}'`,
      });
    }

    return ok(true as const);
  }

  /**
   * String representation
   * @returns Formatted string representation
   */
  toString(): string {
    return `TwoParams(${this._directive.value}/${this._layer.value})`;
  }

  /**
   * Debug string with detailed information
   * @returns Detailed string representation for debugging
   */
  toDebugString(): string {
    return `TwoParams(directive=${this._directive.toDebugString()}, layer=${this._layer.toDebugString()}, profile=${this._profile?.value || 'none'})`;
  }
}

/**
 * TwoParamsCollection - Collection operations for multiple TwoParams
 *
 * Provides collection operations while maintaining immutability and type safety.
 */
export class TwoParamsCollection {
  constructor(private readonly items: readonly TwoParams[]) {}

  /**
   * Get all TwoParams as array
   * @returns Array of TwoParams instances
   */
  toArray(): readonly TwoParams[] {
    return this.items;
  }

  /**
   * Filter by DirectiveType
   * @param directiveValue Directive value to filter by
   * @returns New collection with filtered items
   */
  filterByDirective(directiveValue: string): TwoParamsCollection {
    const filtered = this.items.filter(
      item => item.directive.value === directiveValue
    );
    return new TwoParamsCollection(filtered);
  }

  /**
   * Filter by LayerType
   * @param layerValue Layer value to filter by
   * @returns New collection with filtered items
   */
  filterByLayer(layerValue: string): TwoParamsCollection {
    const filtered = this.items.filter(
      item => item.layer.value === layerValue
    );
    return new TwoParamsCollection(filtered);
  }

  /**
   * Get unique directive values
   * @returns Array of unique directive values
   */
  getUniqueDirectives(): readonly string[] {
    const directives = this.items.map(item => item.directive.value);
    return [...new Set(directives)];
  }

  /**
   * Get unique layer values
   * @returns Array of unique layer values
   */
  getUniqueLayers(): readonly string[] {
    const layers = this.items.map(item => item.layer.value);
    return [...new Set(layers)];
  }

  /**
   * Check if collection contains a specific combination
   * @param directiveValue Directive value to check
   * @param layerValue Layer value to check
   * @returns true if combination exists in collection
   */
  contains(directiveValue: string, layerValue: string): boolean {
    return this.items.some(
      item => item.directive.value === directiveValue && 
               item.layer.value === layerValue
    );
  }

  /**
   * Get collection size
   * @returns Number of items in collection
   */
  get size(): number {
    return this.items.length;
  }
}

/**
 * Format TwoParams error for display
 * @param error TwoParams error to format
 * @returns Formatted error message
 */
export function formatTwoParamsError(error: TwoParamsError): string {
  switch (error.kind) {
    case "DirectiveCreationFailed":
      return `Failed to create DirectiveType: ${error.message}`;
    case "LayerCreationFailed":
      return `Failed to create LayerType: ${error.message}`;
    case "InvalidCombination":
      return `Invalid combination: ${error.message}`;
    case "ProfileValidationFailed":
      return `Profile validation failed: ${error.message}`;
    case "PathResolutionFailed":
      return `Path resolution failed: ${error.message}`;
    default:
      return `Unknown TwoParams error: ${JSON.stringify(error)}`;
  }
}