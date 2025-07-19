/**
 * @fileoverview TwoParamsValidator - DDD Refactored with Smart Constructors and Configuration-based Validation
 *
 * This module provides parameter validation following Domain-Driven Design principles,
 * replacing hardcoded validation with configuration-based patterns and Smart Constructors.
 *
 * Key improvements:
 * - Configuration-based validation patterns
 * - Smart Constructors for type-safe value objects
 * - Integration with BreakdownConfig for dynamic patterns
 * - Branded types for domain integrity
 * - Exhaustive error handling with Totality
 *
 * @module cli/validators/two_params_validator_ddd
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import type { BreakdownConfig } from "@tettuan/breakdownconfig";
import { TypeFactory as _TypeFactory } from "$lib/types/type_factory.ts";
import {
  DirectiveType as ImportedDirectiveType,
  TwoParamsDirectivePattern,
} from "$lib/domain/core/value_objects/directive_type.ts";
import {
  LayerType as ImportedLayerType,
  TwoParamsLayerTypePattern,
} from "$lib/domain/core/value_objects/layer_type.ts";

// Type aliases for domain usage
export type DirectiveType = ImportedDirectiveType;
export type LayerType = ImportedLayerType;

// ============================================================================
// Domain Value Objects - Type-safe parameter representation
// ============================================================================

/**
 * ProfileName - Branded type for configuration profile
 * Represents the active configuration profile (breakdown, search, custom, etc.)
 */
export type ProfileName = string & { readonly __brand: "ProfileName" };

/**
 * ValidatedParams - Immutable value object for validated parameters
 */
export interface ValidatedParams {
  readonly directive: DirectiveType;
  readonly layer: LayerType;
  // Legacy compatibility properties
  readonly directiveType: DirectiveType; // For backward compatibility
  readonly layerType: LayerType; // For backward compatibility
  readonly params: string[]; // For legacy array access
}

// ============================================================================
// Configuration Types - Pattern-based validation
// ============================================================================

/**
 * ValidationPatterns - Configuration-based validation patterns
 */
interface ValidationPatterns {
  readonly directivePatterns: readonly string[];
  readonly layerPatterns: readonly string[];
}

/**
 * ValidationConfig - Complete validation configuration
 */
interface ValidationConfig {
  readonly profile: ProfileName;
  readonly patterns: ValidationPatterns;
  readonly customConfig?: Record<string, unknown>;
}

// ============================================================================
// Error Types - Exhaustive error handling with Totality
// ============================================================================

/**
 * ValidationError - Comprehensive validation error types
 */
export type ValidationError =
  // Parameter count errors
  | { readonly kind: "InvalidParameterCount"; readonly received: number; readonly expected: number }
  // Directive validation errors
  | {
    readonly kind: "InvalidDirectiveType";
    readonly value: string;
    readonly validTypes: readonly string[];
  }
  | { readonly kind: "DirectivePatternMismatch"; readonly value: string; readonly pattern: string }
  // Layer validation errors
  | {
    readonly kind: "InvalidLayerType";
    readonly value: string;
    readonly validTypes: readonly string[];
  }
  | { readonly kind: "LayerPatternMismatch"; readonly value: string; readonly pattern: string }
  // Configuration errors
  | { readonly kind: "ConfigurationNotFound"; readonly profile: string }
  | { readonly kind: "InvalidConfiguration"; readonly message: string; readonly details?: unknown }
  | {
    readonly kind: "PatternNotDefined";
    readonly patternType: "directive" | "layer";
    readonly profile: string;
  }
  // Combination errors
  | {
    readonly kind: "UnsupportedCombination";
    readonly directive: string;
    readonly layer: string;
    readonly profile: string;
  };

// ============================================================================
// Smart Constructors - Type-safe value object creation
// ============================================================================

/**
 * DirectiveType Smart Constructor
 */
export const ValidatorDirectiveType = {
  /**
   * Create DirectiveType with pattern validation
   */
  create(value: string, patterns: readonly string[]): Result<DirectiveType, ValidationError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "InvalidDirectiveType",
        value,
        validTypes: patterns,
      });
    }

    // Check against configuration patterns
    if (!patterns.includes(value)) {
      return error({
        kind: "InvalidDirectiveType",
        value,
        validTypes: patterns,
      });
    }

    return ok(value as unknown as DirectiveType);
  },

  /**
   * Create DirectiveType with regex pattern validation
   */
  createWithPattern(value: string, pattern: string): Result<DirectiveType, ValidationError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "DirectivePatternMismatch",
        value,
        pattern,
      });
    }

    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return error({
        kind: "DirectivePatternMismatch",
        value,
        pattern,
      });
    }

    return ok(value as unknown as DirectiveType);
  },

  /**
   * Extract string value from DirectiveType
   */
  value(directive: DirectiveType): string {
    return directive as unknown as string;
  },

  /**
   * Type guard for DirectiveType
   */
  is(value: unknown): value is DirectiveType {
    return typeof value === "string" && value.length > 0;
  },
};

/**
 * LayerType Smart Constructor
 */
export const ValidatorLayerType = {
  /**
   * Create LayerType with pattern validation
   */
  create(value: string, patterns: readonly string[]): Result<LayerType, ValidationError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "InvalidLayerType",
        value,
        validTypes: patterns,
      });
    }

    // Check against configuration patterns
    if (!patterns.includes(value)) {
      return error({
        kind: "InvalidLayerType",
        value,
        validTypes: patterns,
      });
    }

    return ok(value as unknown as LayerType);
  },

  /**
   * Create LayerType with regex pattern validation
   */
  createWithPattern(value: string, pattern: string): Result<LayerType, ValidationError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "LayerPatternMismatch",
        value,
        pattern,
      });
    }

    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return error({
        kind: "LayerPatternMismatch",
        value,
        pattern,
      });
    }

    return ok(value as unknown as LayerType);
  },

  /**
   * Extract string value from LayerType
   */
  value(layer: LayerType): string {
    return layer as unknown as string;
  },

  /**
   * Type guard for LayerType
   */
  is(value: unknown): value is LayerType {
    return typeof value === "string" && value.length > 0;
  },
};

/**
 * ProfileName Smart Constructor
 */
export const ProfileName = {
  /**
   * Create ProfileName with validation
   */
  create(value: string): Result<ProfileName, ValidationError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "ConfigurationNotFound",
        profile: value,
      });
    }

    return ok(value as ProfileName);
  },

  /**
   * Extract string value from ProfileName
   */
  value(profile: ProfileName): string {
    return profile;
  },

  /**
   * Default profile name
   */
  default(): ProfileName {
    return "breakdown" as ProfileName;
  },
};

// ============================================================================
// Configuration Extractor - Extract patterns from BreakdownConfig
// ============================================================================

/**
 * Extract validation patterns from configuration
 */
function extractValidationPatterns(
  config: Record<string, unknown>,
  profile: ProfileName,
): Result<ValidationPatterns, ValidationError> {
  try {
    // Navigate to profile-specific configuration
    const profileConfig = config[ProfileName.value(profile)] as Record<string, unknown> | undefined;
    if (!profileConfig) {
      return error({
        kind: "ConfigurationNotFound",
        profile: ProfileName.value(profile),
      });
    }

    // Extract two params configuration
    const twoConfig = profileConfig.two as Record<string, unknown> | undefined;
    if (!twoConfig) {
      return error({
        kind: "InvalidConfiguration",
        message: `Missing 'two' configuration for profile '${ProfileName.value(profile)}'`,
        details: profileConfig,
      });
    }

    // Extract directive patterns
    const directiveConfig = twoConfig.directive as Record<string, unknown> | undefined;
    const directivePatterns = directiveConfig?.patterns as string[] | undefined;
    if (!directivePatterns || !Array.isArray(directivePatterns)) {
      return error({
        kind: "PatternNotDefined",
        patternType: "directive",
        profile: ProfileName.value(profile),
      });
    }

    // Extract layer patterns
    const layerConfig = twoConfig.layer as Record<string, unknown> | undefined;
    const layerPatterns = layerConfig?.patterns as string[] | undefined;
    if (!layerPatterns || !Array.isArray(layerPatterns)) {
      return error({
        kind: "PatternNotDefined",
        patternType: "layer",
        profile: ProfileName.value(profile),
      });
    }

    return ok({
      directivePatterns: Object.freeze([...directivePatterns]),
      layerPatterns: Object.freeze([...layerPatterns]),
    });
  } catch (err) {
    return error({
      kind: "InvalidConfiguration",
      message: err instanceof Error ? err.message : String(err),
      details: err,
    });
  }
}

// ============================================================================
// Domain Service - Configuration-based validator
// ============================================================================

/**
 * TwoParamsValidator - Configuration-based parameter validator
 *
 * This validator uses BreakdownConfig patterns instead of hardcoded values,
 * implementing Domain-Driven Design principles with Smart Constructors.
 */
export class TwoParamsValidator {
  private cachedPatterns: Map<string, ValidationPatterns> = new Map();

  constructor(
    private readonly config?: BreakdownConfig | Record<string, unknown>,
    private readonly defaultProfile: ProfileName = "breakdown" as ProfileName,
  ) {}

  /**
   * Validate two parameters with configuration-based patterns
   *
   * @param params - Array of string parameters
   * @param profile - Optional profile name (defaults to constructor profile)
   * @returns Result with validated parameters or error
   */
  validate(
    params: readonly string[],
    profile?: string,
  ): Result<ValidatedParams, ValidationError> {
    // 1. Validate parameter count
    if (!params || params.length < 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params?.length ?? 0,
        expected: 2,
      });
    }

    // 2. Determine profile
    const profileResult: Result<ProfileName, ValidationError> = profile
      ? ProfileName.create(profile)
      : ok<ProfileName, ValidationError>(this.defaultProfile);

    if (!profileResult.ok) {
      return error(profileResult.error);
    }

    // 3. Get validation patterns
    const patternsResult = this.getValidationPatterns(profileResult.data);
    if (!patternsResult.ok) {
      return error(patternsResult.error);
    }

    // 4. Extract parameters
    const [directiveStr, layerStr] = params;

    // 5. Validate directive type using TypeFactory
    // Create ValidationPatterns adapter for TypeFactory
    const directivePatternString = `^(${patternsResult.data.directivePatterns.join("|")})$`;
    const directivePattern = TwoParamsDirectivePattern.create(directivePatternString);
    if (!directivePattern) {
      return error({
        kind: "InvalidConfiguration",
        message: "Failed to create directive pattern",
        details: `Invalid pattern: ${directivePatternString}`,
      });
    }

    const layerPattern = TwoParamsLayerTypePattern.create(
      `^(${patternsResult.data.layerPatterns.join("|")})$`,
    );
    if (!layerPattern) {
      return error({
        kind: "InvalidConfiguration",
        message: "Failed to create layer pattern",
        details: `Invalid pattern: ^(${patternsResult.data.layerPatterns.join("|")})$`,
      });
    }

    const _patternAdapter = {
      getDirectivePattern: () => directivePattern,
      getLayerTypePattern: () => layerPattern,
      validateDirectiveType: (value: string) => directivePattern.test(value),
      validateLayerType: (value: string) => layerPattern.test(value),
      getValidDirectiveTypes: () => patternsResult.data.directivePatterns,
      getValidLayerTypes: () => patternsResult.data.layerPatterns,
    };

    // Simple validation using patterns directly
    if (!patternsResult.data.directivePatterns.includes(directiveStr)) {
      return error({
        kind: "InvalidDirectiveType",
        value: directiveStr,
        validTypes: patternsResult.data.directivePatterns,
      });
    }

    if (!patternsResult.data.layerPatterns.includes(layerStr)) {
      return error({
        kind: "InvalidLayerType",
        value: layerStr,
        validTypes: patternsResult.data.layerPatterns,
      });
    }

    // Create DirectiveType and LayerType objects directly
    const directiveResult = { ok: true, data: { value: directiveStr } as DirectiveType };
    const layerResult = { ok: true, data: { value: layerStr } as LayerType };

    // 7. Validate combination (optional, can be extended)
    const combinationResult = this.validateCombination(
      directiveResult.data,
      layerResult.data,
      profileResult.data,
    );
    if (!combinationResult.ok) {
      return error(combinationResult.error);
    }

    // 8. Return validated params
    return ok({
      directive: directiveResult.data,
      layer: layerResult.data,
      directiveType: directiveResult.data,
      layerType: layerResult.data,
      params: [directiveResult.data.value, layerResult.data.value],
    });
  }

  /**
   * Get validation patterns with caching
   */
  private getValidationPatterns(
    profile: ProfileName,
  ): Result<ValidationPatterns, ValidationError> {
    // Check cache first
    const cached = this.cachedPatterns.get(ProfileName.value(profile));
    if (cached) {
      return ok(cached);
    }

    // Use provided config or load default
    let configData: Record<string, unknown>;
    if (this.config) {
      configData = this.config as Record<string, unknown>;
    } else {
      // Fallback to default patterns if no config provided
      return this.getDefaultPatterns(profile);
    }

    // Extract patterns from config
    const patternsResult = extractValidationPatterns(configData, profile);
    if (!patternsResult.ok) {
      return error(patternsResult.error);
    }

    // Cache the result
    this.cachedPatterns.set(ProfileName.value(profile), patternsResult.data);
    return ok(patternsResult.data);
  }

  /**
   * Get default patterns (fallback for testing or when config is not available)
   */
  private getDefaultPatterns(profile: ProfileName): Result<ValidationPatterns, ValidationError> {
    const profileName = ProfileName.value(profile);

    switch (profileName) {
      case "breakdown":
        return ok({
          directivePatterns: ["to", "summary", "defect", "init", "find"],
          layerPatterns: ["project", "issue", "task", "bugs", "temp"],
        });
      case "search":
        return ok({
          directivePatterns: ["web", "rag", "db"],
          layerPatterns: ["query", "index", "data"],
        });
      default:
        return error({
          kind: "ConfigurationNotFound",
          profile: profileName,
        });
    }
  }

  /**
   * Validate directive-layer combination
   * Can be extended to support complex business rules
   */
  private validateCombination(
    _directive: DirectiveType,
    _layer: LayerType,
    _profile: ProfileName,
  ): Result<void, ValidationError> {
    // Example: Certain combinations might not be allowed
    // This is where domain-specific business rules can be enforced

    // For now, all valid individual values make a valid combination
    return ok(undefined);
  }

  /**
   * Clear cached patterns
   */
  clearCache(): void {
    this.cachedPatterns.clear();
  }

  /**
   * Get available patterns for a profile
   */
  getAvailablePatterns(
    profile?: string,
  ): Result<ValidationPatterns, ValidationError> {
    const profileResult: Result<ProfileName, ValidationError> = profile
      ? ProfileName.create(profile)
      : ok<ProfileName, ValidationError>(this.defaultProfile);

    if (!profileResult.ok) {
      return error(profileResult.error);
    }

    return this.getValidationPatterns(profileResult.data);
  }

  /**
   * Map TypeFactory errors to ValidationError with proper type safety
   */
  private mapTypeFactoryError(
    error: unknown,
    type: "directive" | "layer",
    value: string,
  ): ValidationError {
    // Handle TypeFactory errors with proper type safety
    if (typeof error === "object" && error !== null) {
      const errorObj = error as { kind?: string; message?: string };
      if (errorObj.kind === "PatternMismatch") {
        return type === "directive"
          ? {
            kind: "InvalidDirectiveType",
            value,
            validTypes: [],
          }
          : {
            kind: "InvalidLayerType",
            value,
            validTypes: [],
          };
      }
    }

    // Default error mapping
    return {
      kind: "InvalidConfiguration",
      message: `Invalid ${type} type: ${String(error)}`,
      details: error,
    };
  }
}

// ============================================================================
// Factory Functions - Convenient creation methods
// ============================================================================

/**
 * Create validator with BreakdownConfig
 */
export function createValidatorWithConfig(
  config: BreakdownConfig | Record<string, unknown>,
  defaultProfile?: string,
): TwoParamsValidator {
  const profileResult: Result<ProfileName, ValidationError> = defaultProfile
    ? ProfileName.create(defaultProfile)
    : ok(ProfileName.default());

  const profile = profileResult.ok ? profileResult.data : ProfileName.default();

  return new TwoParamsValidator(config, profile);
}

/**
 * Create validator with default patterns
 */
export function createDefaultValidator(defaultProfile?: string): TwoParamsValidator {
  const profileResult: Result<ProfileName, ValidationError> = defaultProfile
    ? ProfileName.create(defaultProfile)
    : ok("breakdown" as ProfileName);

  const profile = profileResult.ok ? profileResult.data : "breakdown" as ProfileName;

  return new TwoParamsValidator(undefined, profile);
}
