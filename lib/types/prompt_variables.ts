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
    readonly value: string
  ) {}

  static create(name: string, value: string): StandardVariable | null {
    const validName = StandardVariableName.create(name);
    if (!validName) return null;
    
    return new StandardVariable(validName, value);
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
    readonly value: string
  ) {}

  static create(name: string, value: string): FilePathVariable | null {
    const validName = FilePathVariableName.create(name);
    if (!validName) return null;

    // Basic file path validation
    if (!value || value.trim().length === 0) return null;
    
    return new FilePathVariable(validName, value);
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
    readonly value: string
  ) {}

  static create(name: string, value: string): StdinVariable | null {
    const validName = StdinVariableName.create(name);
    if (!validName) return null;
    
    return new StdinVariable(validName, value);
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
    readonly value: string
  ) {}

  static create(name: string, value: string): UserVariable | null {
    if (!name || name.trim().length === 0) return null;
    if (!value || value.trim().length === 0) return null;
    
    return new UserVariable(name.trim(), value);
  }

  toRecord(): Record<string, string> {
    return { [this.name]: this.value };
  }
}

// === Variable Name Types (Smart Constructors) ===

/**
 * Valid standard variable names following totality principle
 */
export class StandardVariableName {
  private static readonly VALID_NAMES = ["input_text_file", "destination_path"] as const;
  
  private constructor(readonly value: typeof StandardVariableName.VALID_NAMES[number]) {}

  static create(name: string): StandardVariableName | null {
    const validName = StandardVariableName.VALID_NAMES.find(valid => valid === name);
    return validName ? new StandardVariableName(validName) : null;
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

  static create(name: string): FilePathVariableName | null {
    const validName = FilePathVariableName.VALID_NAMES.find(valid => valid === name);
    return validName ? new FilePathVariableName(validName) : null;
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

  static create(name: string): StdinVariableName | null {
    const validName = StdinVariableName.VALID_NAMES.find(valid => valid === name);
    return validName ? new StdinVariableName(validName) : null;
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
  variables: PromptVariables
): PromptParams {
  return {
    template_file: templateFile,
    variables: toPromptParamsVariables(variables)
  };
}
