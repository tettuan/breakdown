/**
 * Prompt Variables Type Definitions following Totality Principle
 *
 * This module defines type-safe prompt variables that integrate with @tettuan/breakdownprompt
 * package while ensuring totality principle compliance for internal type safety.
 *
 * @example Usage
 * ```ts
 * import { PromptVariables, StandardVariable } from "./prompt_variables.ts";
 *
 * const standardVar = StandardVariable.create("input_text_file", "/path/to/file");
 * if (standardVar) {
 *   const variables: PromptVariables = [standardVar];
 * }
 * ```
 *
 * @module
 */

import type { PromptParams } from "@tettuan/breakdownprompt";
import type { VariableResult } from "./variable_result.ts";
import { createEmptyValueError, createInvalidNameError, createSuccess } from "./variable_result.ts";

// === Base Interface for Duck Typing ===

/**
 * Base interface for all prompt variables following Duck Typing principle
 */
export interface PromptVariableBase {
  toRecord(): Record<string, string>;
}

// === Core Variable Types (Following Totality Principle) ===

/**
 * Standard variable with predefined names for consistent usage
 */
export class StandardVariable implements PromptVariableBase {
  private constructor(
    readonly name: StandardVariableName,
    readonly value: string,
  ) {}

  static create(name: string, value: string): VariableResult<StandardVariable> {
    const nameResult = StandardVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    if (!value || value.trim().length === 0) {
      return createEmptyValueError(name, "Standard variable value cannot be empty");
    }

    return createSuccess(new StandardVariable(nameResult.data, value));
  }

  toRecord(): Record<string, string> {
    return { [this.name.getValue()]: this.value };
  }
}

/**
 * File path variable for schema and file references
 */
export class FilePathVariable implements PromptVariableBase {
  private constructor(
    readonly name: FilePathVariableName,
    readonly value: string,
  ) {}

  static create(name: string, value: string): VariableResult<FilePathVariable> {
    const nameResult = FilePathVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    // Basic file path validation
    if (!value || value.trim().length === 0) {
      return createEmptyValueError(name, "File path cannot be empty");
    }

    return createSuccess(new FilePathVariable(nameResult.data, value));
  }

  toRecord(): Record<string, string> {
    return { [this.name.getValue()]: this.value };
  }
}

/**
 * Standard input variable for input text content
 */
export class StdinVariable implements PromptVariableBase {
  private constructor(
    readonly name: StdinVariableName,
    readonly value: string,
  ) {}

  static create(name: string, value: string): VariableResult<StdinVariable> {
    const nameResult = StdinVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    if (!value || value.trim().length === 0) {
      return createEmptyValueError(name, "Stdin variable value cannot be empty");
    }

    return createSuccess(new StdinVariable(nameResult.data, value));
  }

  toRecord(): Record<string, string> {
    return { [this.name.getValue()]: this.value };
  }
}

/**
 * User variable for custom user-defined options (e.g., --uv-*)
 */
export class UserVariable implements PromptVariableBase {
  private constructor(
    readonly name: string,
    readonly value: string,
  ) {}

  static create(name: string, value: string): VariableResult<UserVariable> {
    if (!name || name.trim().length === 0) {
      return createEmptyValueError("UserVariable", "Variable name cannot be empty");
    }
    // Allow empty string values for custom variables (CLI requirement)
    if (value === null || value === undefined) {
      return createEmptyValueError(name, "Variable value cannot be null or undefined");
    }

    return createSuccess(new UserVariable(name.trim(), value));
  }

  toRecord(): Record<string, string> {
    // Remove uv- prefix for the actual variable name
    const variableName = this.name.startsWith("uv-") ? this.name.substring(3) : this.name;
    return { [variableName]: this.value };
  }
}

// === Variable Name Types (Smart Constructors) ===

/**
 * Valid standard variable names following totality principle
 */
export class StandardVariableName {
  private static readonly VALID_NAMES = ["input_text_file", "destination_path", "demonstrative_type", "layer_type"] as const;

  private constructor(readonly value: typeof StandardVariableName.VALID_NAMES[number]) {}

  static create(name: string): VariableResult<StandardVariableName> {
    const validName = StandardVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return createSuccess(new StandardVariableName(validName));
    }
    return createInvalidNameError(name, StandardVariableName.VALID_NAMES);
  }

  getValue(): string {
    return this.value;
  }
}

/**
 * Valid file path variable names following totality principle
 */
export class FilePathVariableName {
  private static readonly VALID_NAMES = ["schema_file"] as const;

  private constructor(readonly value: typeof FilePathVariableName.VALID_NAMES[number]) {}

  static create(name: string): VariableResult<FilePathVariableName> {
    const validName = FilePathVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return createSuccess(new FilePathVariableName(validName));
    }
    return createInvalidNameError(name, FilePathVariableName.VALID_NAMES);
  }

  getValue(): string {
    return this.value;
  }
}

/**
 * Valid stdin variable names following totality principle
 */
export class StdinVariableName {
  private static readonly VALID_NAMES = ["input_text"] as const;

  private constructor(readonly value: typeof StdinVariableName.VALID_NAMES[number]) {}

  static create(name: string): VariableResult<StdinVariableName> {
    const validName = StdinVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return createSuccess(new StdinVariableName(validName));
    }
    return createInvalidNameError(name, StdinVariableName.VALID_NAMES);
  }

  getValue(): string {
    return this.value;
  }
}

// === Union Types ===

/**
 * All possible prompt variable types following Duck Typing
 */
export type PromptVariable = StandardVariable | FilePathVariable | StdinVariable | UserVariable;

/**
 * Collection of prompt variables
 */
export type PromptVariables = PromptVariable[];

// === Integration with PromptParams ===

/**
 * Convert PromptVariables to PromptParams.variables format
 */
export function toPromptParamsVariables(variables: PromptVariables): Record<string, string> {
  const result: Record<string, string> = {};

  for (const variable of variables) {
    Object.assign(result, variable.toRecord());
  }

  return result;
}

/**
 * Create PromptParams from template path and variables
 */
export function createPromptParams(
  templateFile: string,
  variables: PromptVariables,
): PromptParams {
  return {
    template_file: templateFile,
    variables: toPromptParamsVariables(variables),
  };
}
