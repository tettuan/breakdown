import { PromptVariables } from "../../types/prompt_types.ts";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";
import { formatUserVariableError, UserVariableError } from "./user_variable_error.ts";

/**
 * UserPromptVariables - User-defined prompt variables implementation
 *
 * Manages custom variables specified through CLI --uv-* options.
 * All variables are validated to ensure they are not empty strings.
 *
 * This class follows the Totality principle and uses Smart Constructor pattern
 * for safe instance creation.
 *
 * @example
 * ```typescript
 * // Create with valid variables
 * const result = UserPromptVariables.create({
 *   userName: "太郎",
 *   projectName: "マイプロジェクト"
 * });
 *
 * if (result.ok) {
 *   console.log(result.data.toRecord());
 *   // { userName: "太郎", projectName: "マイプロジェクト" }
 * }
 * ```
 */
export class UserPromptVariables implements PromptVariables {
  private constructor(
    private readonly variables: Record<string, string>,
  ) {}

  /**
   * Creates a new UserPromptVariables instance (Smart Constructor)
   *
   * Validates that all variable values are non-empty strings.
   *
   * @param variables - Record of user-defined variables
   * @returns Result containing UserPromptVariables or validation error
   */
  static create(
    variables: Record<string, string>,
  ): Result<UserPromptVariables, UserVariableError> {
    // Validate all variables
    for (const [key, value] of Object.entries(variables)) {
      if (!key || key.trim() === "") {
        return error({ kind: "EmptyKey", key });
      }
      if (value === null || value === undefined) {
        return error({ kind: "NullOrUndefined", key });
      }
      if (value.trim() === "") {
        return error({ kind: "EmptyValue", key });
      }
    }

    // Create a copy of the variables to ensure immutability
    const variablesCopy = { ...variables };

    // Trim all values
    for (const key of Object.keys(variablesCopy)) {
      variablesCopy[key] = variablesCopy[key].trim();
    }

    return ok(new UserPromptVariables(variablesCopy));
  }

  /**
   * Gets a specific variable value (unsafe version for backward compatibility)
   *
   * @deprecated Use get() instead for Result-based error handling
   * @param key - The variable key
   * @returns The variable value or undefined if not found
   */
  getUnsafe(key: string): string | undefined {
    const result = this.get(key);
    return result.ok ? result.data : undefined;
  }

  /**
   * Creates an empty UserPromptVariables instance
   *
   * @returns A new empty UserPromptVariables instance
   */
  static empty(): UserPromptVariables {
    return new UserPromptVariables({});
  }

  /**
   * Converts the user variables to a record format
   *
   * @returns Record containing all user-defined variables
   */
  toRecord(): Record<string, string> {
    return { ...this.variables };
  }

  /**
   * Gets a specific variable value
   *
   * @param key - The variable key
   * @returns Result containing the variable value or error if not found
   */
  get(key: string): Result<string, UserVariableError> {
    if (!key || key.trim() === "") {
      return error({ kind: "EmptyKey", key });
    }
    const value = this.variables[key];
    if (value === undefined) {
      return error({ kind: "NotFound", key });
    }
    return ok(value);
  }

  /**
   * Checks if a variable exists
   *
   * @param key - The variable key
   * @returns true if the variable exists, false otherwise
   */
  has(key: string): boolean {
    return key in this.variables;
  }

  /**
   * Gets all variable keys
   *
   * @returns Array of all variable keys
   */
  keys(): string[] {
    return Object.keys(this.variables);
  }

  /**
   * Gets the number of variables
   *
   * @returns Number of user-defined variables
   */
  size(): number {
    return Object.keys(this.variables).length;
  }

  /**
   * Checks if there are no variables
   *
   * @returns true if no variables, false otherwise
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Creates a new instance with an additional variable
   *
   * @param key - The variable key
   * @param value - The variable value
   * @returns Result containing new UserPromptVariables instance or error
   */
  with(key: string, value: string): Result<UserPromptVariables, UserVariableError> {
    if (!key || key.trim() === "") {
      return error({ kind: "EmptyKey", key });
    }
    if (value === null || value === undefined) {
      return error({ kind: "NullOrUndefined", key });
    }
    if (value.trim() === "") {
      return error({ kind: "EmptyValue", key });
    }

    return UserPromptVariables.create({
      ...this.variables,
      [key]: value,
    });
  }

  /**
   * Creates a new instance without a specific variable
   *
   * @param key - The variable key to remove
   * @returns A new UserPromptVariables instance
   */
  without(key: string): UserPromptVariables {
    const newVariables = { ...this.variables };
    delete newVariables[key];
    return new UserPromptVariables(newVariables);
  }

  /**
   * Creates a new instance by merging with other variables
   *
   * @param other - Other variables to merge
   * @returns Result containing new UserPromptVariables instance or error
   */
  merge(other: Record<string, string>): Result<UserPromptVariables, UserVariableError> {
    return UserPromptVariables.create({
      ...this.variables,
      ...other,
    });
  }

  /**
   * Creates UserPromptVariables from CLI arguments
   *
   * Extracts --uv-* options from an options object.
   *
   * @param options - Options object containing uv-prefixed properties
   * @returns Result containing UserPromptVariables instance or error
   *
   * @example
   * ```typescript
   * const options = {
   *   "uv-userName": "太郎",
   *   "uv-projectName": "マイプロジェクト",
   *   "from": "input.md" // non-uv option is ignored
   * };
   * const result = UserPromptVariables.fromOptions(options);
   * if (result.ok) {
   *   console.log(result.data.toRecord());
   * }
   * ```
   */
  static fromOptions(
    options: Record<string, unknown>,
  ): Result<UserPromptVariables, UserVariableError> {
    const userVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      // Check if key starts with "uv-"
      if (key.startsWith("uv-") && key.length > 3) {
        // Extract variable name (remove "uv-" prefix)
        const varName = key.substring(3);

        // Convert value to string
        const strValue = String(value);

        userVariables[varName] = strValue;
      }
    }

    return UserPromptVariables.create(userVariables);
  }

  /**
   * Creates a new UserPromptVariables instance (unsafe version for backward compatibility)
   *
   * @deprecated Use create() instead for Result-based error handling
   * @param variables - Record of user-defined variables
   * @returns A new UserPromptVariables instance
   * @throws Error if any variable key or value is empty
   */
  static createUnsafe(variables: Record<string, string>): UserPromptVariables {
    const result = UserPromptVariables.create(variables);
    if (!result.ok) {
      throw new Error(formatUserVariableError(result.error));
    }
    return result.data;
  }

  /**
   * Creates a new instance with an additional variable (unsafe version)
   *
   * @deprecated Use with() instead for Result-based error handling
   * @param key - The variable key
   * @param value - The variable value
   * @returns A new UserPromptVariables instance
   * @throws Error if key or value is empty
   */
  withUnsafe(key: string, value: string): UserPromptVariables {
    const result = this.with(key, value);
    if (!result.ok) {
      throw new Error(formatUserVariableError(result.error));
    }
    return result.data;
  }

  /**
   * Creates a new instance by merging with other variables (unsafe version)
   *
   * @deprecated Use merge() instead for Result-based error handling
   * @param other - Other variables to merge
   * @returns A new UserPromptVariables instance
   * @throws Error if any merged variable is invalid
   */
  mergeUnsafe(other: Record<string, string>): UserPromptVariables {
    const result = this.merge(other);
    if (!result.ok) {
      throw new Error(formatUserVariableError(result.error));
    }
    return result.data;
  }

  /**
   * Creates UserPromptVariables from CLI arguments (unsafe version)
   *
   * @deprecated Use fromOptions() instead for Result-based error handling
   * @param options - Options object containing uv-prefixed properties
   * @returns A new UserPromptVariables instance
   * @throws Error if any variable is invalid
   */
  static fromOptionsUnsafe(options: Record<string, unknown>): UserPromptVariables {
    const result = UserPromptVariables.fromOptions(options);
    if (!result.ok) {
      throw new Error(formatUserVariableError(result.error));
    }
    return result.data;
  }
}
