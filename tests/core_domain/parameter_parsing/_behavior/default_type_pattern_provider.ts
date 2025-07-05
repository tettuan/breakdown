/**
 * @fileoverview Default type pattern provider for behavior testing
 *
 * This module provides default patterns for type validation
 * in parameter parsing behavior tests.
 *
 * @module core_domain/parameter_parsing/default_type_pattern_provider
 */

import { TwoParamsDirectivePattern, TwoParamsLayerTypePattern } from "../../../../lib/types/mod.ts";
import type { TypePatternProvider } from "../../../../lib/types/type_factory.ts";

/**
 * Default implementation of TypePatternProvider for testing
 */
export class DefaultTypePatternProvider implements TypePatternProvider {
  private directivePattern: TwoParamsDirectivePattern | null = null;
  private layerPattern: TwoParamsLayerTypePattern | null = null;

  constructor() {
    // Initialize with default patterns
    this.directivePattern = TwoParamsDirectivePattern.create("to|summary|defect|find");
    this.layerPattern = TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp");
  }

  /**
   * Get directive type pattern
   */
  getDirectiveTypePattern(): TwoParamsDirectivePattern | null {
    return this.directivePattern;
  }

  /**
   * Get layer type pattern
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerPattern;
  }

  /**
   * Update directive pattern
   */
  updateDirectivePattern(pattern: string): void {
    this.directivePattern = TwoParamsDirectivePattern.create(pattern);
  }

  /**
   * Update layer pattern
   */
  updateLayerPattern(pattern: string): void {
    this.layerPattern = TwoParamsLayerTypePattern.create(pattern);
  }

  /**
   * Reset to default patterns
   */
  resetToDefaults(): void {
    this.directivePattern = TwoParamsDirectivePattern.create("to|summary|defect|find");
    this.layerPattern = TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp");
  }
}