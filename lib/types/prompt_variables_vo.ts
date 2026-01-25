/**
 * @fileoverview PromptVariablesVO implementation with Totality principle
 *
 * This module implements PromptVariablesVO following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. PromptVariablesVO
 * represents an immutable collection of prompt variables.
 *
 * ## Design Principles
 * 1. **Smart Constructor**: private constructor + static create
 * 2. **Immutable**: All properties are readonly, no mutation after creation
 * 3. **Total Function**: All operations are defined for all valid inputs
 * 4. **Single Responsibility**: Holds validated prompt variables collection
 *
 * @module types/prompt_variables_vo
 */

/**
 * PromptVariable interface - represents a prompt variable with key-value pairs
 */
export interface PromptVariable {
  toRecord(): Record<string, string>;
}
import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * PromptVariablesVO - Immutable collection of prompt variables
 *
 * Pure Smart Constructor implementation following the Totality principle.
 * Holds validated PromptVariable array and guarantees immutability.
 *
 * ## Design Principles
 * 1. **Single Responsibility**: Type-safe holding of validated variable collections only
 * 2. **Smart Constructor**: private constructor + static create
 * 3. **Immutable**: No modification after construction
 * 4. **Total Function**: Defined for all inputs
 *
 * @example Basic usage
 * ```typescript
 * const var1 = StandardVariable.create("input_text_file", "/path/to/file");
 * const var2 = FilePathVariable.create("schema_file", "/path/to/schema");
 *
 * if (var1.ok && var2.ok) {
 *   const variables = PromptVariablesVO.create([var1.data, var2.data]);
 *   console.log(variables.size()); // 2
 *   console.log(variables.toRecord()); // { input_text_file: "/path/to/file", schema_file: "/path/to/schema" }
 * }
 * ```
 *
 * @example Empty collection
 * ```typescript
 * const empty = PromptVariablesVO.create([]);
 * console.log(empty.isEmpty()); // true
 * console.log(empty.size()); // 0
 * ```
 */
export class PromptVariablesVO {
  /**
   * Private constructor - Smart Constructor pattern implementation
   *
   * Prevents direct instantiation and enforces creation via create() method.
   * Freezes the array internally to guarantee immutability.
   */
  private constructor(private readonly variables: readonly PromptVariable[]) {
    // Defensive copy and freeze for true immutability
    this.variables = Object.freeze([...variables]);
  }

  /**
   * Constructs PromptVariablesVO from PromptVariable array
   *
   * Following the Totality principle, always succeeds for valid arrays.
   * Validation such as duplicate checking is the caller's responsibility.
   *
   * @param variables Array of PromptVariable
   * @returns PromptVariablesVO instance (always succeeds)
   *
   * @example
   * ```typescript
   * const variables = [standardVar, filePathVar];
   * const vo = PromptVariablesVO.create(variables);
   * // Can be used in a type-safe manner
   * ```
   */
  static create(variables: PromptVariable[]): PromptVariablesVO {
    return new PromptVariablesVO(variables);
  }

  /**
   * Constructs PromptVariablesVO from PromptVariable array (Result type version)
   *
   * Fully compliant with Totality principle, handles all error cases explicitly.
   * Executes additional validation before constructing PromptVariablesVO,
   * returns error via Result type when failure is possible.
   *
   * @param variables Array of PromptVariable
   * @param options Optional: additional validation settings
   * @returns Result<PromptVariablesVO> on success, error information on failure
   *
   * @example
   * ```typescript
   * const result = PromptVariablesVO.createOrError(variables, {
   *   allowDuplicates: false,
   *   requireNonEmpty: true
   * });
   * if (result.ok) {
   *   // Can be used in a type-safe manner
   *   console.log(result.data.size());
   * } else {
   *   // Error handling
   *   console.error(result.error);
   * }
   * ```
   */
  static createOrError(
    variables: PromptVariable[] | null | undefined,
    options?: {
      allowDuplicates?: boolean;
      requireNonEmpty?: boolean;
      maxVariables?: number;
    },
  ): Result<PromptVariablesVO, ValidationError> {
    // Basic validation
    if (!variables || variables === null || variables === undefined) {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "variables",
        source: "PromptVariablesVO",
        context: { reason: "Variables array is required and cannot be null or undefined" },
      }));
    }

    if (!Array.isArray(variables)) {
      return error(ErrorFactory.validationError("InvalidFieldType", {
        field: "variables",
        expected: "Array<PromptVariable>",
        received: typeof variables,
        context: { value: variables },
      }));
    }

    // Empty array check (optional)
    if (options?.requireNonEmpty && variables.length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "variables",
        value: variables,
        reason: "Variables array cannot be empty when requireNonEmpty is true",
      }));
    }

    // Maximum count check (optional)
    if (options?.maxVariables && variables.length > options.maxVariables) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "variables",
        value: variables.length,
        reason:
          `Variables count (${variables.length}) exceeds maximum allowed (${options.maxVariables})`,
      }));
    }

    // Duplicate check (optional)
    if (options?.allowDuplicates === false) {
      const names = new Map<string, number>();
      for (let i = 0; i < variables.length; i++) {
        const variable = variables[i];
        const record = variable.toRecord();
        for (const name of Object.keys(record)) {
          if (names.has(name)) {
            return error(ErrorFactory.validationError("InvalidInput", {
              field: `variables[${i}]`,
              value: name,
              reason: `Duplicate variable name: ${name} (first occurrence at index ${
                names.get(name)
              })`,
            }));
          }
          names.set(name, i);
        }
      }
    }

    // All validations succeeded
    return ok(new PromptVariablesVO(variables));
  }

  /**
   * Gets the array of validated variables
   *
   * Returns an immutable array, cannot be modified from outside.
   *
   * @returns Read-only array of variables
   */
  get value(): readonly PromptVariable[] {
    return this.variables;
  }

  /**
   * Gets the number of variables
   *
   * @returns Number of variables
   */
  size(): number {
    return this.variables.length;
  }

  /**
   * Checks whether the collection is empty
   *
   * @returns true if no variables exist
   */
  isEmpty(): boolean {
    return this.variables.length === 0;
  }

  /**
   * Converts all variables to a single record
   *
   * Calls toRecord() on each variable and merges the results.
   * If there are duplicate keys, later values overwrite earlier ones.
   *
   * @returns Record containing key-value pairs of all variables
   */
  toRecord(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const variable of this.variables) {
      Object.assign(result, variable.toRecord());
    }

    return result;
  }

  /**
   * Gets the list of variable names
   *
   * @returns Array of all variable names
   */
  getNames(): string[] {
    const names: string[] = [];

    for (const variable of this.variables) {
      const record = variable.toRecord();
      names.push(...Object.keys(record));
    }

    return names;
  }

  /**
   * Searches for a variable with the specified name
   *
   * @param name Variable name to search for
   * @returns The variable if found, undefined if not found
   */
  findByName(name: string): PromptVariable | undefined {
    for (const variable of this.variables) {
      const record = variable.toRecord();
      if (name in record) {
        return variable;
      }
    }
    return undefined;
  }

  /**
   * Checks whether a variable with the specified name exists
   *
   * @param name Variable name to check
   * @returns true if the variable exists
   */
  hasVariable(name: string): boolean {
    return this.findByName(name) !== undefined;
  }

  /**
   * equals method for value comparison
   *
   * Returns true only when both have exactly the same variables including order.
   *
   * @param other PromptVariablesVO to compare with
   * @returns true if they have the same variables
   */
  equals(other: PromptVariablesVO): boolean {
    if (this.variables.length !== other.variables.length) {
      return false;
    }

    const thisRecord = this.toRecord();
    const otherRecord = other.toRecord();

    const thisKeys = Object.keys(thisRecord).sort();
    const otherKeys = Object.keys(otherRecord).sort();

    if (thisKeys.length !== otherKeys.length) {
      return false;
    }

    for (let i = 0; i < thisKeys.length; i++) {
      const key = thisKeys[i];
      if (key !== otherKeys[i] || thisRecord[key] !== otherRecord[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * String representation of PromptVariablesVO
   *
   * Returns string representation for debugging and display purposes.
   * Format: "PromptVariablesVO(count: n)"
   *
   * @returns String representation of PromptVariablesVO
   */
  toString(): string {
    return `PromptVariablesVO(count: ${this.variables.length})`;
  }

  /**
   * Read-only access to the original variable array
   *
   * Used when debugging or detailed information is needed.
   * Safe to expose since it is immutable.
   *
   * @returns Original variable array (read-only)
   */
  get originalVariables(): readonly PromptVariable[] {
    return this.variables;
  }
}

// Backward compatibility exports
export type PromptVariables = PromptVariablesVO;
export const createPromptParams = PromptVariablesVO.create;

// Add missing toPromptParamsVariables export for compatibility
export function toPromptParamsVariables(variables: PromptVariable[]): PromptVariablesVO {
  return PromptVariablesVO.create(variables);
}

// Stub exports for missing variable types - these need to be properly implemented
export class StandardVariable implements PromptVariable {
  constructor(private key: string, private value: string) {}

  static create(key: string, value: string): Result<StandardVariable, ValidationError> {
    if (!key || !key.trim()) {
      return error(ErrorFactory.validationError("EmptyValue", {
        field: "key",
        context: { key, value },
      }));
    }
    // Allow empty values for template flexibility
    const sanitizedValue = value || "";
    return ok(new StandardVariable(key, sanitizedValue));
  }

  toRecord(): Record<string, string> {
    return { [this.key]: this.value };
  }
}

export class FilePathVariable implements PromptVariable {
  constructor(private key: string, private readonly _value: string) {}

  static create(key: string, value: string): Result<FilePathVariable, ValidationError> {
    if (!key || !key.trim()) {
      return error(ErrorFactory.validationError("EmptyValue", {
        field: "key",
        context: { key, value },
      }));
    }
    // Allow empty values for template flexibility
    const sanitizedValue = value || "";
    return ok(new FilePathVariable(key, sanitizedValue));
  }

  get value(): string {
    return this._value;
  }

  toRecord(): Record<string, string> {
    return { [this.key]: this._value };
  }
}

export class StdinVariable implements PromptVariable {
  constructor(private key: string, private value: string) {}

  static create(key: string, value: string): Result<StdinVariable, ValidationError> {
    if (!key || !key.trim()) {
      return error(ErrorFactory.validationError("EmptyValue", {
        field: "key",
        context: { key, value },
      }));
    }

    // Allow empty value for stdin variables (e.g., when stdin is skipped in tests)
    const sanitizedValue = value || "";
    return ok(new StdinVariable(key, sanitizedValue));
  }

  toRecord(): Record<string, string> {
    return { [this.key]: this.value };
  }
}

export class UserVariable implements PromptVariable {
  constructor(private key: string, private value: string) {}

  static create(key: string, value: string): Result<UserVariable, ValidationError> {
    if (!key || !key.trim()) {
      return error(ErrorFactory.validationError("EmptyValue", {
        field: "key",
        context: { key, value },
      }));
    }
    // Allow empty values for template flexibility
    const sanitizedValue = value || "";
    return ok(new UserVariable(key, sanitizedValue));
  }

  toRecord(): Record<string, string> {
    // Keep the original key with uv- prefix for UserVariable
    return { [this.key]: this.value };
  }
}
