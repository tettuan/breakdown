/**
 * @fileoverview Variables builder
 *
 * This module provides variable building functionality
 *
 * @module interface_layer/builder/variables_builder
 */

/**
 * Builds variables for interface layer
 */
export class VariablesBuilder {
  /**
   * Build variables from input
   */
  static build(input: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = String(value);
    }
    return result;
  }
}