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

// ============================================================================
// Domain Value Objects - Type-safe parameter representation
// ============================================================================

/**
 * DirectiveType - Branded type for directive parameter
 * Represents the processing direction (to, summary, defect, etc.)
 */
export type DirectiveType = string & { readonly __brand: "DirectiveType" };

/**
 * LayerType - Branded type for layer parameter
 * Represents the processing layer (project, issue, task, etc.)
 */
export type LayerType = string & { readonly __brand: "LayerType" };

/**
 * ProfileName - Branded type for configuration profile
 * Represents the active configuration profile (breakdown, search, custom, etc.)
 */
export type ProfileName = string & { readonly __brand: "ProfileName" };

/**
 * ValidatedParams - Immutable value object for validated parameters
 */
export interface ValidatedParams {
  readonly directiveType: DirectiveType;
  readonly layerType: LayerType;
  readonly profile: ProfileName;
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
export const DirectiveType = {
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

    return ok(value as DirectiveType);
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

    return ok(value as DirectiveType);
  },

  /**
   * Extract string value from DirectiveType
   */
  value(directive: DirectiveType): string {
    return directive;
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
export const LayerType = {
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

    return ok(value as LayerType);
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

    return ok(value as LayerType);
  },

  /**
   * Extract string value from LayerType
   */
  value(layer: LayerType): string {
    return layer;
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
    private readonly defaultProfile: ProfileName = ProfileName.default(),
  ) {}

  /**
   * Validate two parameters with configuration-based patterns
   *
   * @param params - Array of string parameters
   * @param profile - Optional profile name (defaults to constructor profile)
   * @returns Result with validated parameters or error
   */
  async validate(
    params: readonly string[],
    profile?: string,
  ): Promise<Result<ValidatedParams, ValidationError>> {
    // 1. Validate parameter count
    if (!params || params.length < 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params?.length ?? 0,
        expected: 2,
      });
    }

    // 2. Determine profile
    const profileResult = profile ? ProfileName.create(profile) : ok(this.defaultProfile);

    if (!profileResult.ok) {
      return error(profileResult.error);
    }

    // 3. Get validation patterns
    const patternsResult = await this.getValidationPatterns(profileResult.data);
    if (!patternsResult.ok) {
      return error(patternsResult.error);
    }

    // 4. Extract parameters
    const [directiveStr, layerStr] = params;

    // 5. Validate directive type
    const directiveResult = DirectiveType.create(
      directiveStr,
      patternsResult.data.directivePatterns,
    );
    if (!directiveResult.ok) {
      return error(directiveResult.error);
    }

    // 6. Validate layer type
    const layerResult = LayerType.create(layerStr, patternsResult.data.layerPatterns);
    if (!layerResult.ok) {
      return error(layerResult.error);
    }

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
      directiveType: directiveResult.data,
      layerType: layerResult.data,
      profile: profileResult.data,
    });
  }

  /**
   * Get validation patterns with caching
   */
  private async getValidationPatterns(
    profile: ProfileName,
  ): Promise<Result<ValidationPatterns, ValidationError>> {
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
    directive: DirectiveType,
    layer: LayerType,
    profile: ProfileName,
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
  async getAvailablePatterns(
    profile?: string,
  ): Promise<Result<ValidationPatterns, ValidationError>> {
    const profileResult = profile ? ProfileName.create(profile) : ok(this.defaultProfile);

    if (!profileResult.ok) {
      return error(profileResult.error);
    }

    return await this.getValidationPatterns(profileResult.data);
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
  const profileResult = defaultProfile
    ? ProfileName.create(defaultProfile)
    : { ok: true, data: ProfileName.default() };

  const profile = profileResult.ok ? profileResult.data : ProfileName.default();

  return new TwoParamsValidator(config, profile);
}

/**
 * Create validator with default patterns
 */
export function createDefaultValidator(defaultProfile?: string): TwoParamsValidator {
  const profileResult = defaultProfile
    ? ProfileName.create(defaultProfile)
    : { ok: true, data: ProfileName.default() };

  const profile = profileResult.ok ? profileResult.data : ProfileName.default();

  return new TwoParamsValidator(undefined, profile);
}
