/**
 * @fileoverview Default implementation of TypePatternProvider using defaultConfigTwoParams
 * 
 * This module provides a default implementation of TypePatternProvider that uses
 * the patterns defined in defaultConfigTwoParams. This allows TypeFactory to work
 * with sensible defaults without requiring external configuration.
 * 
 * @module types/defaults/default_type_pattern_provider
 */

import { TwoParamsDirectivePattern } from "../directive_type.ts";
import { TwoParamsLayerTypePattern } from "../layer_type.ts";
import type { TypePatternProvider } from "../type_factory.ts";
import { defaultConfigTwoParams } from "./config_two_params.ts";

/**
 * Default implementation of TypePatternProvider
 * 
 * Uses patterns from defaultConfigTwoParams to provide sensible defaults
 * for DirectiveType and LayerType validation. This enables TypeFactory
 * to work out-of-the-box without requiring external configuration.
 * 
 * @example Basic usage
 * ```typescript
 * const provider = new DefaultTypePatternProvider();
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
   * Get DirectiveType validation pattern from default configuration
   * 
   * @returns TwoParamsDirectivePattern for validating DirectiveType values
   * @returns null if pattern creation fails (should not happen with valid defaults)
   */
  getDirectivePattern(): TwoParamsDirectivePattern | null {
    const pattern = defaultConfigTwoParams.params.two.demonstrativeType.pattern;
    return TwoParamsDirectivePattern.create(pattern);
  }

  /**
   * Get LayerType validation pattern from default configuration
   * 
   * @returns TwoParamsLayerTypePattern for validating LayerType values
   * @returns null if pattern creation fails (should not happen with valid defaults)
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    const pattern = defaultConfigTwoParams.params.two.layerType.pattern;
    return TwoParamsLayerTypePattern.create(pattern);
  }

  /**
   * Get the underlying default configuration object
   * 
   * @returns The defaultConfigTwoParams object for inspection
   */
  getDefaultConfig(): typeof defaultConfigTwoParams {
    return defaultConfigTwoParams;
  }

  /**
   * Get available DirectiveType values from the pattern
   * 
   * @returns Array of valid DirectiveType string values
   */
  getValidDirectiveValues(): string[] {
    // Extract values from regex pattern: "^(to|summary|defect)$" -> ["to", "summary", "defect"]
    const pattern = defaultConfigTwoParams.params.two.demonstrativeType.pattern;
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    if (match) {
      return match[1].split('|');
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
    const pattern = defaultConfigTwoParams.params.two.layerType.pattern;
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    if (match) {
      return match[1].split('|');
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
      directivePattern: defaultConfigTwoParams.params.two.demonstrativeType.pattern,
      layerPattern: defaultConfigTwoParams.params.two.layerType.pattern,
      validDirectives: this.getValidDirectiveValues(),
      validLayers: this.getValidLayerValues()
    };
  }
}