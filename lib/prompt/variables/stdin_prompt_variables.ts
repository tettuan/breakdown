/**
 * @fileoverview Standard input prompt variables implementation
 *
 * This module provides StdinPromptVariables class that implements PromptVariables
 * interface for handling standard input variables.
 *
 * @module prompt/variables/stdin_prompt_variables
 */

import type { PromptVariables } from "../../types/prompt_types.ts";
import { StdinVariable, StdinVariableName } from "../../types/prompt_variables.ts";
import type { VariableResult } from "../../types/variable_result.ts";
import { createEmptyValueError, createSuccess } from "../../types/variable_result.ts";

/**
 * Standard input prompt variables implementation
 *
 * Handles variables from standard input following the Totality principle.
 * Uses Smart Constructor pattern to ensure validity.
 *
 * @example
 * ```typescript
 * const result = StdinPromptVariables.create("Hello, world!");
 * if (result.ok) {
 *   const record = result.data.toRecord();
 *   console.log(record); // { input_text: "Hello, world!" }
 * }
 * ```
 */
export class StdinPromptVariables implements PromptVariables {
  private readonly variables: StdinVariable[];

  private constructor(variables: StdinVariable[]) {
    this.variables = variables;
  }

  /**
   * Create StdinPromptVariables from input text
   *
   * @param inputText - The text from standard input
   * @returns Result containing StdinPromptVariables or VariableError
   */
  static create(inputText: string): VariableResult<StdinPromptVariables> {
    if (!inputText || inputText.trim().length === 0) {
      return createEmptyValueError("input_text", "Standard input cannot be empty");
    }

    // Create stdin variable with the standard name
    const stdinVarResult = StdinVariable.create("input_text", inputText);
    if (!stdinVarResult.ok) {
      return stdinVarResult;
    }

    return createSuccess(new StdinPromptVariables([stdinVarResult.data]));
  }

  /**
   * Create StdinPromptVariables from multiple stdin variables
   *
   * @param variables - Array of StdinVariable instances
   * @returns StdinPromptVariables instance
   */
  static fromVariables(variables: StdinVariable[]): StdinPromptVariables {
    return new StdinPromptVariables(variables);
  }

  /**
   * Convert variables to record format
   *
   * @returns Record containing all stdin variables
   */
  toRecord(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const variable of this.variables) {
      Object.assign(result, variable.toRecord());
    }

    return result;
  }

  /**
   * Get all stdin variables
   *
   * @returns Array of StdinVariable instances
   */
  getVariables(): ReadonlyArray<StdinVariable> {
    return this.variables;
  }

  /**
   * Check if a specific stdin variable exists
   *
   * @param name - The variable name to check
   * @returns true if the variable exists
   */
  has(name: string): boolean {
    const nameResult = StdinVariableName.create(name);
    if (!nameResult.ok) {
      return false;
    }

    return this.variables.some((v) => v.name.getValue() === name);
  }

  /**
   * Get a specific stdin variable value
   *
   * @param name - The variable name to get
   * @returns The variable value or undefined if not found
   */
  get(name: string): string | undefined {
    const nameResult = StdinVariableName.create(name);
    if (!nameResult.ok) {
      return undefined;
    }

    const variable = this.variables.find((v) => v.name.getValue() === name);
    return variable?.value;
  }
}
