/**
 * @fileoverview Standard input prompt variables implementation
 *
 * This module provides StdinPromptVariables class that implements PromptVariables
 * interface for handling standard input variables.
 *
 * @module prompt/variables/stdin_prompt_variables
 */

import type { PromptVariables } from "../../types/prompt_types.ts";
// NOTE: prompt_variables.ts orphaned - using inline implementations

/**
 * StdinVariableName value object
 */
class StdinVariableName {
  private constructor(private readonly value: string) {}

  static create(name: string): Result<StdinVariableName, Error> {
    if (!name || name.trim().length === 0) {
      return error(new Error("Variable name cannot be empty"));
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return error(new Error("Variable name must be a valid identifier"));
    }
    return ok(new StdinVariableName(name));
  }

  getValue(): string {
    return this.value;
  }
}

/**
 * StdinVariable value object
 */
class StdinVariable {
  readonly name: StdinVariableName;
  readonly value: string;

  private constructor(name: StdinVariableName, value: string) {
    this.name = name;
    this.value = value;
  }

  static create(name: string, value: string): Result<StdinVariable, { kind: string }> {
    const nameResult = StdinVariableName.create(name);
    if (!nameResult.ok) {
      return error({ kind: "InvalidVariableName" });
    }
    return ok(new StdinVariable(nameResult.data, value));
  }

  toRecord(): Record<string, string> {
    return { [this.name.getValue()]: this.value };
  }
}
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";

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
   * @returns Result containing StdinPromptVariables or Error
   */
  static create(inputText: string): Result<StdinPromptVariables, Error> {
    if (!inputText || inputText.trim().length === 0) {
      return error(new Error("Standard input cannot be empty"));
    }

    // Create stdin variable with the standard name
    const stdinVarResult = StdinVariable.create("input_text", inputText);
    if (!stdinVarResult.ok) {
      return error(new Error(`Failed to create stdin variable: ${stdinVarResult.error.kind}`));
    }

    return ok(new StdinPromptVariables([stdinVarResult.data]));
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
