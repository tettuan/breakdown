/**
 * @fileoverview Default implementation of TypePatternProvider using defaultConfigTwoParams
 *
 * This module provides a default implementation of TypePatternProvider that uses
 * the patterns defined in defaultConfigTwoParams. This allows TypeFactory to work
 * with sensible defaults without requiring external configuration.
 *
 * **DDD Version Priority Policy**: This implementation follows Domain Driven Design
 * principles and integrates with parameter_validator_v2.ts, using the new createOrError
 * methods for Totality-compliant error handling instead of deprecated create methods.
 *
 * @module types/defaults/default_type_pattern_provider
 */

import { TwoParamsDirectivePattern } from "../../domain/core/value_objects/directive_type.ts";
// Note: TwoParamsLayerTypePattern has been removed (@deprecated)
import type { TypePatternProvider } from "../type_factory.ts";
import { _defaultConfigTwoParams } from "./config_two_params.ts";

/**
 * Default implementation of TypePatternProvider
 *
 * Uses patterns from defaultConfigTwoParams to provide sensible defaults
 * for DirectiveType and LayerType validation. This enables TypeFactory
 * to work out-of-the-box without requiring external configuration.
 *
 * **DDD Compliance**: This implementation uses createOrError methods for
 * Totality-compliant error handling, ensuring compatibility with
 * parameter_validator_v2.ts and the DDD version priority policy.
 *
 * @example Basic usage
 * ```typescript
 * const _provider = new DefaultTypePatternProvider();
 * const factory = new TypeFactory(provider);
 *
 * // These will work with default patterns:
 * // DirectiveType: "to", "summary", "defect"
 * // LayerType: "project", "issue", "task"
 * const directiveResult = factory.createDirectiveType("to");
 * const layerResult = factory.createLayerType("project");
 * ```
 *
 * @example Default patterns
 * ```typescript
 * // DirectiveType pattern: "^(to|summary|defect)$"
 * // Accepts: "to", "summary", "defect"
 * // Rejects: "invalid", "TO", "summary2", etc.
 *
 * // LayerType pattern: "^(project|issue|task)$"
 * // Accepts: "project", "issue", "task"
 * // Rejects: "invalid", "PROJECT", "task1", etc.
 * ```
 */
export class DefaultTypePatternProvider implements TypePatternProvider {
  /**
   * Get DirectiveType validation pattern from default configuration (TypePatternProvider interface)
   *
   * Uses the new createOrError implementation for Totality-compliant error handling.
   * This method follows DDD principles by delegating to the domain object's factory method.
   *
   * @returns Pattern object for validating DirectiveType values
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    const pattern = _defaultConfigTwoParams.params.two.directiveType.pattern;
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    if (!result.ok) {
      return null;
    }
    return result.data;
  }

  /**
   * Get DirectiveType validation pattern from default configuration (internal method)
   *
   * @returns TwoParamsDirectivePattern for validating DirectiveType values
   * @throws Error if pattern creation fails (should not happen with valid defaults)
   */
  getDirectivePatternObject(): TwoParamsDirectivePattern {
    const pattern = _defaultConfigTwoParams.params.two.directiveType.pattern;
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    if (!result.ok) {
      throw new Error(
        `Failed to create directive pattern: ${result.error.kind} - ${
          JSON.stringify(result.error)
        }`,
      );
    }
    return result.data;
  }

  /**
   * Get LayerType validation pattern from default configuration (TypePatternProvider interface)
   *
   * Note: TwoParamsLayerTypePattern has been removed (@deprecated).
   * LayerType validation is now handled directly by LayerType.create() method.
   *
   * @returns Pattern object for validating LayerType values (null since pattern validation is deprecated)
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    // Pattern validation is now handled directly by LayerType.create() method
    return null;
  }

  /**
   * Get the underlying default configuration object
   *
   * @returns The defaultConfigTwoParams object for inspection
   */
  getDefaultConfig(): typeof _defaultConfigTwoParams {
    return _defaultConfigTwoParams;
  }

  /**
   * Validate DirectiveType value against the pattern
   *
   * @param value The value to validate
   * @returns true if the value matches the pattern
   */
  validateDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePatternObject();
    return pattern.test(value);
  }

  /**
   * Validate LayerType value against the pattern
   *
   * Note: Pattern validation is now handled directly by LayerType.create() method.
   *
   * @param value The value to validate
   * @returns true if the value passes LayerType validation
   */
  validateLayerType(value: string): boolean {
    // Import at runtime to avoid circular dependencies
    try {
      // Basic validation logic extracted from LayerType.create()
      if (!value || typeof value !== "string" || value.trim() === "") {
        return false;
      }

      const trimmedValue = value.trim();

      // Length validation
      if (trimmedValue.length > 30) {
        return false;
      }

      // Basic format validation (lowercase letters, numbers, hyphens, underscores)
      const basicPattern = /^[a-z0-9_-]{1,30}$/;
      return basicPattern.test(trimmedValue);
    } catch {
      return false;
    }
  }

  /**
   * Get available DirectiveType values (interface compliance)
   *
   * @returns Readonly array of valid DirectiveType string values
   */
  getValidDirectiveTypes(): string[] {
    return this.getValidDirectiveValues();
  }

  /**
   * Get available LayerType values (interface compliance)
   *
   * @returns Readonly array of valid LayerType string values
   */
  getValidLayerTypes(): string[] {
    return this.getValidLayerValues();
  }

  /**
   * Get available DirectiveType values from the pattern
   *
   * @returns Array of valid DirectiveType string values
   */
  getValidDirectiveValues(): string[] {
    // Extract values from regex pattern: "^(to|summary|defect)$" -> ["to", "summary", "defect"]
    const pattern = _defaultConfigTwoParams.params.two.directiveType.pattern;
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    if (match) {
      return match[1].split("|");
    }
    return [];
  }

  /**
   * Get available LayerType values from the pattern
   *
   * @returns Array of valid LayerType string values
   */
  getValidLayerValues(): string[] {
    // Extract values from regex pattern: "^(project|issue|task)$" -> ["project", "issue", "task"]
    const pattern = _defaultConfigTwoParams.params.two.layerType.pattern;
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    if (match) {
      return match[1].split("|");
    }
    return [];
  }

  /**
   * Debug information about the provider
   *
   * @returns Debug information object
   */
  debug(): {
    providerType: string;
    directivePattern: string;
    layerPattern: string;
    validDirectives: string[];
    validLayers: string[];
  } {
    return {
      providerType: "DefaultTypePatternProvider",
      directivePattern: _defaultConfigTwoParams.params.two.directiveType.pattern,
      layerPattern: _defaultConfigTwoParams.params.two.layerType.pattern,
      validDirectives: this.getValidDirectiveValues(),
      validLayers: this.getValidLayerValues(),
    };
  }
}
