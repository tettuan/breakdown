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
 * const _standardVar = StandardVariable.create("input_text_file", "/path/to/file");
 * if (standardVar) {
 *   const variables: PromptVariables = [standardVar];
 * }
 * ```
 *
 * @module
 */

import type { PromptParams } from "@tettuan/breakdownprompt";
import type { Result } from "./result.ts";

// === Error Types ===

/**
 * Import ErrorInfo from @tettuan/breakdownparams for unified error handling
 */
import type { ErrorInfo } from "@tettuan/breakdownparams";

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

  static create(name: string, value: string): Result<StandardVariable, ErrorInfo> {
    const nameResult = StandardVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    if (!value || value.trim().length === 0) {
      return { ok: false, error: { message: `Standard variable value cannot be empty for ${name}`, code: "EMPTY_VALUE", category: "validation" } };
    }

    return { ok: true, data: new StandardVariable(nameResult.data, value) };
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

  static create(name: string, value: string): Result<FilePathVariable, ErrorInfo> {
    const nameResult = FilePathVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    // Basic file path validation
    if (!value || value.trim().length === 0) {
      return { ok: false, error: { message: `File path cannot be empty for ${name}`, code: "EMPTY_VALUE", category: "validation" } };
    }

    return { ok: true, data: new FilePathVariable(nameResult.data, value) };
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

  static create(name: string, value: string): Result<StdinVariable, ErrorInfo> {
    const nameResult = StdinVariableName.create(name);
    if (!nameResult.ok) {
      return nameResult;
    }

    if (!value || value.trim().length === 0) {
      return { ok: false, error: { message: `Stdin variable value cannot be empty for ${name}`, code: "EMPTY_VALUE", category: "validation" } };
    }

    return { ok: true, data: new StdinVariable(nameResult.data, value) };
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

  static create(name: string, value: string): Result<UserVariable, ErrorInfo> {
    if (!name || name.trim().length === 0) {
      return { ok: false, error: { message: "Variable name cannot be empty", code: "EMPTY_NAME", category: "validation" } };
    }
    // Allow empty string values for custom variables (CLI requirement)
    if (value === null || value === undefined) {
      return { ok: false, error: { message: `Variable value cannot be null or undefined for ${name}`, code: "NULL_VALUE", category: "validation" } };
    }

    return { ok: true, data: new UserVariable(name.trim(), value) };
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
  private static readonly VALID_NAMES = [
    "input_text_file",
    "destination_path",
    "demonstrative_type",
    "layer_type",
  ] as const;

  private constructor(readonly value: typeof StandardVariableName.VALID_NAMES[number]) {}

  static create(name: string): Result<StandardVariableName, ErrorInfo> {
    const validName = StandardVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return { ok: true, data: new StandardVariableName(validName) };
    }
    return { ok: false, error: { message: `Invalid name: ${name}. Valid names: ${StandardVariableName.VALID_NAMES.join(", ")}`, code: "INVALID_NAME", category: "validation" } };
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

  static create(name: string): Result<FilePathVariableName, ErrorInfo> {
    const validName = FilePathVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return { ok: true, data: new FilePathVariableName(validName) };
    }
    return { ok: false, error: { message: `Invalid name: ${name}. Valid names: ${FilePathVariableName.VALID_NAMES.join(", ")}`, code: "INVALID_NAME", category: "validation" } };
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

  static create(name: string): Result<StdinVariableName, ErrorInfo> {
    const validName = StdinVariableName.VALID_NAMES.find((valid) => valid === name);
    if (validName) {
      return { ok: true, data: new StdinVariableName(validName) };
    }
    return { ok: false, error: { message: `Invalid name: ${name}. Valid names: ${StdinVariableName.VALID_NAMES.join(", ")}`, code: "INVALID_NAME", category: "validation" } };
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

/**
 * CLI parameters for prompt generation
 * @deprecated Use PromptVariables with Duck Typing pattern instead.
 * This type will be removed in the next major version.
 *
 * Migration guide:
 * - Replace PromptCliParams with PromptVariables array
 * - Use StandardVariable, FilePathVariable, StdinVariable, UserVariable classes
 * - Leverage toRecord() method for Duck Typing compatibility
 *
 * @see PromptVariables for the new approach
 * @see PromptManagerAdapter for usage examples
 */
export type PromptCliParams = {
  demonstrativeType: string;
  layerType: string;
  options: {
    fromFile?: string;
    destinationFile?: string;
    adaptation?: string;
    promptDir?: string;
    fromLayerType?: string;
    input_text?: string;
    customVariables?: Record<string, string>;
    extended?: boolean;
    customValidation?: boolean;
    errorFormat?: "simple" | "detailed" | "json";
    config?: string;
  };
};

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
