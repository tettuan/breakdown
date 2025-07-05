/**
 * @fileoverview Variables builder for testing
 * 
 * This module provides variables builder functionality
 * for test files.
 */

import type { PromptVariables } from "../types/prompt_variables.ts";

export interface VariablesBuilderOptions {
  includeDefaults?: boolean;
  strictMode?: boolean;
}

export class VariablesBuilder {
  private variables: Record<string, unknown> = {};

  constructor(private options: VariablesBuilderOptions = {}) {}

  /**
   * Add a variable to the builder
   */
  addVariable(name: string, value: unknown): this {
    this.variables[name] = value;
    return this;
  }

  /**
   * Add multiple variables
   */
  addVariables(variables: Record<string, unknown>): this {
    Object.assign(this.variables, variables);
    return this;
  }

  /**
   * Build the final variables object
   */
  build(): PromptVariables {
    const result: PromptVariables = {};
    for (const [key, value] of Object.entries(this.variables)) {
      result[key] = {
        name: key,
        value: value as string | number | boolean,
      };
    }
    return result;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.variables = {};
    return this;
  }

  /**
   * Check if a variable exists
   */
  hasVariable(name: string): boolean {
    return name in this.variables;
  }

  /**
   * Get variable count
   */
  getVariableCount(): number {
    return Object.keys(this.variables).length;
  }
}

export function createVariablesBuilder(options?: VariablesBuilderOptions): VariablesBuilder {
  return new VariablesBuilder(options);
}