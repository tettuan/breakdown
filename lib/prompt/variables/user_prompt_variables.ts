import { PromptVariables } from "../../types/prompt_types.ts";

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
   * @returns A new UserPromptVariables instance
   * @throws Error if any variable key or value is empty
   */
  static create(
    variables: Record<string, string>,
  ): UserPromptVariables {
    // Validate all variables
    for (const [key, value] of Object.entries(variables)) {
      if (!key || key.trim() === "") {
        throw new Error("Variable key cannot be empty");
      }
      if (value === null || value === undefined) {
        throw new Error(`Variable value for '${key}' cannot be null or undefined`);
      }
      if (value.trim() === "") {
        throw new Error(`Variable value for '${key}' cannot be empty`);
      }
    }

    // Create a copy of the variables to ensure immutability
    const variablesCopy = { ...variables };

    // Trim all values
    for (const key of Object.keys(variablesCopy)) {
      variablesCopy[key] = variablesCopy[key].trim();
    }

    return new UserPromptVariables(variablesCopy);
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
   * @returns The variable value or undefined if not found
   */
  get(key: string): string | undefined {
    return this.variables[key];
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
   * @returns A new UserPromptVariables instance
   * @throws Error if key or value is empty
   */
  with(key: string, value: string): UserPromptVariables {
    if (!key || key.trim() === "") {
      throw new Error("Variable key cannot be empty");
    }
    if (value === null || value === undefined) {
      throw new Error(`Variable value for '${key}' cannot be null or undefined`);
    }
    if (value.trim() === "") {
      throw new Error(`Variable value for '${key}' cannot be empty`);
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
   * @returns A new UserPromptVariables instance
   * @throws Error if any merged variable is invalid
   */
  merge(other: Record<string, string>): UserPromptVariables {
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
   * @returns A new UserPromptVariables instance
   * @throws Error if any variable is invalid
   *
   * @example
   * ```typescript
   * const options = {
   *   "uv-userName": "太郎",
   *   "uv-projectName": "マイプロジェクト",
   *   "from": "input.md" // non-uv option is ignored
   * };
   * const variables = UserPromptVariables.fromOptions(options);
   * ```
   */
  static fromOptions(options: Record<string, unknown>): UserPromptVariables {
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
}
