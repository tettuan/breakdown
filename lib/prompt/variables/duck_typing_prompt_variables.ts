/**
 * @fileoverview Duck Typing Pattern implementation for PromptVariables
 *
 * This module provides a flexible and type-safe implementation of PromptVariables
 * using Duck Typing pattern. It allows dynamic variable management while maintaining
 * type safety and compatibility with existing code.
 *
 * @module prompt/variables/duck_typing_prompt_variables
 */

import { PromptVariables } from "../../types/prompt_types.ts";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";

/**
 * Type guard to check if an object implements PromptVariables interface
 * using Duck Typing pattern
 */
export function isPromptVariables(obj: unknown): obj is PromptVariables {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "toRecord" in obj &&
    typeof (obj as any).toRecord === "function"
  );
}

/**
 * Type guard to check if an object can be converted to PromptVariables
 * using Duck Typing pattern
 */
export function isPromptVariablesLike(obj: unknown): obj is Record<string, string> {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Check if all values are strings
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== "string") {
      return false;
    }
  }

  return true;
}

/**
 * DuckTypingPromptVariables - Flexible implementation using Duck Typing Pattern
 *
 * This class provides maximum flexibility by accepting any object that can be
 * converted to Record<string, string> format, while maintaining type safety
 * through runtime checks and validation.
 *
 * Features:
 * - Duck typing compatibility with any object having toRecord() method
 * - Smart constructor pattern for safe instantiation
 * - Runtime type validation
 * - Immutable operations with functional updates
 * - Full backward compatibility with existing PromptVariables implementations
 */
export class DuckTypingPromptVariables implements PromptVariables {
  private readonly variables: Record<string, string>;

  private constructor(variables: Record<string, string>) {
    this.variables = { ...variables }; // Defensive copy
  }

  /**
   * Creates instance from any PromptVariables-like object (Smart Constructor)
   *
   * @param source - Source object implementing PromptVariables or Record<string, string>
   * @returns Result containing DuckTypingPromptVariables or Error
   */
  static fromPromptVariables(source: unknown): Result<DuckTypingPromptVariables, Error> {
    try {
      // Duck typing check: if it has toRecord() method, use it
      if (isPromptVariables(source)) {
        const variables = source.toRecord();
        return DuckTypingPromptVariables.fromRecord(variables);
      }

      // Duck typing check: if it looks like a record, use it directly
      if (isPromptVariablesLike(source)) {
        return DuckTypingPromptVariables.fromRecord(source);
      }

      return error(
        new Error(
          "Source object must implement PromptVariables interface or be Record<string, string>",
        ),
      );
    } catch (err) {
      return error(
        new Error(
          `Failed to create from PromptVariables: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
    }
  }

  /**
   * Creates instance from Record<string, string> (Smart Constructor)
   *
   * @param variables - Variables record
   * @returns Result containing DuckTypingPromptVariables or Error
   */
  static fromRecord(variables: Record<string, string>): Result<DuckTypingPromptVariables, Error> {
    try {
      // Validate variables
      if (!variables || typeof variables !== "object") {
        return error(new Error("Variables must be a valid object"));
      }

      const validatedVariables: Record<string, string> = {};

      for (const [key, value] of Object.entries(variables)) {
        // Validate key
        if (!key || typeof key !== "string" || key.trim() === "") {
          return error(new Error("Variable keys must be non-empty strings"));
        }

        // Validate value
        if (value === null || value === undefined) {
          return error(new Error(`Variable value for '${key}' cannot be null or undefined`));
        }

        if (typeof value !== "string") {
          return error(
            new Error(`Variable value for '${key}' must be a string, got ${typeof value}`),
          );
        }

        validatedVariables[key.trim()] = value;
      }

      return ok(new DuckTypingPromptVariables(validatedVariables));
    } catch (err) {
      return error(
        new Error(
          `Failed to create from record: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  /**
   * Creates instance from array of key-value pairs (Smart Constructor)
   *
   * @param pairs - Array of [key, value] pairs
   * @returns Result containing DuckTypingPromptVariables or Error
   */
  static fromPairs(pairs: Array<[string, string]>): Result<DuckTypingPromptVariables, Error> {
    try {
      const variables: Record<string, string> = {};

      for (const [key, value] of pairs) {
        if (!key || typeof key !== "string" || key.trim() === "") {
          return error(new Error("Variable keys must be non-empty strings"));
        }

        if (typeof value !== "string") {
          return error(new Error(`Variable value for '${key}' must be a string`));
        }

        variables[key.trim()] = value;
      }

      return DuckTypingPromptVariables.fromRecord(variables);
    } catch (err) {
      return error(
        new Error(
          `Failed to create from pairs: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  /**
   * Creates empty instance (Smart Constructor)
   *
   * @returns Result containing empty DuckTypingPromptVariables
   */
  static empty(): Result<DuckTypingPromptVariables, Error> {
    return DuckTypingPromptVariables.fromRecord({});
  }

  /**
   * Converts to Record<string, string> format (PromptVariables interface)
   *
   * @returns Record containing all variables
   */
  toRecord(): Record<string, string> {
    return { ...this.variables }; // Defensive copy
  }

  /**
   * Gets a specific variable value
   *
   * @param key - Variable key
   * @returns Variable value or undefined if not found
   */
  get(key: string): string | undefined {
    return this.variables[key];
  }

  /**
   * Checks if a variable exists
   *
   * @param key - Variable key
   * @returns True if variable exists
   */
  has(key: string): boolean {
    return key in this.variables;
  }

  /**
   * Gets all variable keys
   *
   * @returns Array of variable keys
   */
  keys(): string[] {
    return Object.keys(this.variables);
  }

  /**
   * Gets all variable values
   *
   * @returns Array of variable values
   */
  values(): string[] {
    return Object.values(this.variables);
  }

  /**
   * Gets all variable entries as [key, value] pairs
   *
   * @returns Array of [key, value] pairs
   */
  entries(): Array<[string, string]> {
    return Object.entries(this.variables);
  }

  /**
   * Gets the number of variables
   *
   * @returns Number of variables
   */
  size(): number {
    return Object.keys(this.variables).length;
  }

  /**
   * Checks if the variables collection is empty
   *
   * @returns True if no variables exist
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Creates a new instance with added variables (Functional Update)
   *
   * @param newVariables - Variables to add (can be PromptVariables or Record)
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  withVariables(newVariables: unknown): Result<DuckTypingPromptVariables, Error> {
    const newVarsResult = createPromptVariables(newVariables);
    if (!newVarsResult.ok) {
      return newVarsResult;
    }

    const mergedVariables = {
      ...this.variables,
      ...newVarsResult.data.toRecord(),
    };

    return DuckTypingPromptVariables.fromRecord(mergedVariables);
  }

  /**
   * Creates a new instance with a single added variable (Functional Update)
   *
   * @param key - Variable key
   * @param value - Variable value
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  withVariable(key: string, value: string): Result<DuckTypingPromptVariables, Error> {
    if (!key || typeof key !== "string" || key.trim() === "") {
      return error(new Error("Variable key must be a non-empty string"));
    }

    if (typeof value !== "string") {
      return error(new Error("Variable value must be a string"));
    }

    const newVariables = {
      ...this.variables,
      [key.trim()]: value,
    };

    return DuckTypingPromptVariables.fromRecord(newVariables);
  }

  /**
   * Creates a new instance without specified variables (Functional Update)
   *
   * @param keys - Variable keys to remove
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  without(...keys: string[]): Result<DuckTypingPromptVariables, Error> {
    const newVariables = { ...this.variables };

    for (const key of keys) {
      delete newVariables[key];
    }

    return DuckTypingPromptVariables.fromRecord(newVariables);
  }

  /**
   * Creates a new instance with only specified variables (Functional Update)
   *
   * @param keys - Variable keys to keep
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  pick(...keys: string[]): Result<DuckTypingPromptVariables, Error> {
    const newVariables: Record<string, string> = {};

    for (const key of keys) {
      if (this.has(key)) {
        newVariables[key] = this.variables[key];
      }
    }

    return DuckTypingPromptVariables.fromRecord(newVariables);
  }

  /**
   * Filters variables based on a predicate function (Functional Update)
   *
   * @param predicate - Function to test each variable
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  filter(
    predicate: (key: string, value: string) => boolean,
  ): Result<DuckTypingPromptVariables, Error> {
    const newVariables: Record<string, string> = {};

    for (const [key, value] of this.entries()) {
      if (predicate(key, value)) {
        newVariables[key] = value;
      }
    }

    return DuckTypingPromptVariables.fromRecord(newVariables);
  }

  /**
   * Transforms variables using a mapper function (Functional Update)
   *
   * @param mapper - Function to transform each variable value
   * @returns Result containing new DuckTypingPromptVariables instance
   */
  map(mapper: (key: string, value: string) => string): Result<DuckTypingPromptVariables, Error> {
    try {
      const newVariables: Record<string, string> = {};

      for (const [key, value] of this.entries()) {
        const mappedValue = mapper(key, value);
        if (typeof mappedValue !== "string") {
          return error(new Error(`Mapper function must return a string for key '${key}'`));
        }
        newVariables[key] = mappedValue;
      }

      return DuckTypingPromptVariables.fromRecord(newVariables);
    } catch (err) {
      return error(
        new Error(`Failed to map variables: ${err instanceof Error ? err.message : String(err)}`),
      );
    }
  }

  /**
   * Validates all variables using a validator function
   *
   * @param validator - Function to validate each variable
   * @returns Result indicating validation success or failure
   */
  validate(validator: (key: string, value: string) => boolean): Result<true, Error> {
    try {
      for (const [key, value] of this.entries()) {
        if (!validator(key, value)) {
          return error(new Error(`Validation failed for variable '${key}' with value '${value}'`));
        }
      }
      return ok(true);
    } catch (err) {
      return error(
        new Error(`Validation error: ${err instanceof Error ? err.message : String(err)}`),
      );
    }
  }

  /**
   * Converts to JSON string representation
   *
   * @returns JSON string of variables
   */
  toJSON(): string {
    return JSON.stringify(this.variables);
  }

  /**
   * Creates instance from JSON string (Smart Constructor)
   *
   * @param json - JSON string representation
   * @returns Result containing DuckTypingPromptVariables or Error
   */
  static fromJSON(json: string): Result<DuckTypingPromptVariables, Error> {
    try {
      const parsed = JSON.parse(json);
      return DuckTypingPromptVariables.fromRecord(parsed);
    } catch (err) {
      return error(
        new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`),
      );
    }
  }

  /**
   * String representation for debugging
   *
   * @returns String representation
   */
  toString(): string {
    const size = this.size();
    const preview = size <= 3
      ? this.entries().map(([k, v]) => `${k}=${v}`).join(", ")
      : `${this.entries().slice(0, 3).map(([k, v]) => `${k}=${v}`).join(", ")}... (+${
        size - 3
      } more)`;

    return `DuckTypingPromptVariables(${size} variables: ${preview})`;
  }

  /**
   * Deep equality check with another PromptVariables instance
   *
   * @param other - Other PromptVariables instance
   * @returns True if all variables are equal
   */
  equals(other: unknown): boolean {
    if (!isPromptVariables(other)) {
      return false;
    }

    const otherRecord = other.toRecord();
    const thisRecord = this.toRecord();

    const thisKeys = Object.keys(thisRecord).sort();
    const otherKeys = Object.keys(otherRecord).sort();

    if (thisKeys.length !== otherKeys.length) {
      return false;
    }

    for (let i = 0; i < thisKeys.length; i++) {
      if (thisKeys[i] !== otherKeys[i]) {
        return false;
      }
      if (thisRecord[thisKeys[i]] !== otherRecord[thisKeys[i]]) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Utility function to create DuckTypingPromptVariables from any compatible source
 *
 * @param source - Source object (PromptVariables, Record, or array of pairs)
 * @returns Result containing DuckTypingPromptVariables instance
 */
export function createPromptVariables(source: unknown): Result<DuckTypingPromptVariables, Error> {
  // Handle array of pairs
  if (Array.isArray(source)) {
    // Validate that it's actually an array of pairs
    if (source.every((item) => Array.isArray(item) && item.length === 2)) {
      return DuckTypingPromptVariables.fromPairs(source as Array<[string, string]>);
    } else {
      return error(new Error("Array source must be an array of [key, value] pairs"));
    }
  }

  // Handle PromptVariables or Record
  return DuckTypingPromptVariables.fromPromptVariables(source);
}

/**
 * Utility function to merge multiple PromptVariables instances
 *
 * @param sources - Array of PromptVariables sources
 * @returns Result containing merged DuckTypingPromptVariables instance
 */
export function mergePromptVariables(
  ...sources: unknown[]
): Result<DuckTypingPromptVariables, Error> {
  let result: Result<DuckTypingPromptVariables, Error> = DuckTypingPromptVariables.empty();
  if (!result.ok) {
    return result;
  }

  for (const source of sources) {
    if (!result.ok) {
      return result;
    }
    const mergeResult = result.data.withVariables(source);
    if (!mergeResult.ok) {
      return mergeResult;
    }
    result = mergeResult;
  }

  return result;
}
