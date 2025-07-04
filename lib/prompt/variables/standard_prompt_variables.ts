import { PromptVariables } from "../../types/prompt_types.ts";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";

/**
 * StandardPromptVariables - Standard prompt variables implementation
 *
 * Implements the PromptVariables interface to provide standard variables
 * such as input_text_file, destination_path, etc.
 *
 * This class follows the Totality principle and uses Smart Constructor pattern
 * for safe instance creation.
 */
export class StandardPromptVariables implements PromptVariables {
  private constructor(
    private readonly inputTextFile: string,
    private readonly destinationPath: string,
    private readonly additionalVariables: Record<string, string> = {},
  ) {}

  /**
   * Creates a new StandardPromptVariables instance (Smart Constructor)
   *
   * @param inputTextFile - Path to the input text file
   * @param destinationPath - Path to the destination
   * @param additionalVariables - Additional variables to include
   * @returns Result containing StandardPromptVariables or Error
   */
  static create(
    inputTextFile: string,
    destinationPath: string,
    additionalVariables: Record<string, string> = {},
  ): Result<StandardPromptVariables, Error> {
    // Validate required parameters
    if (!inputTextFile || inputTextFile.trim() === "") {
      return error(new Error("inputTextFile cannot be empty"));
    }
    if (!destinationPath || destinationPath.trim() === "") {
      return error(new Error("destinationPath cannot be empty"));
    }

    // Validate additional variables
    for (const [key, value] of Object.entries(additionalVariables)) {
      if (!key || key.trim() === "") {
        return error(new Error("Variable key cannot be empty"));
      }
      if (value === null || value === undefined) {
        return error(new Error(`Variable value for '${key}' cannot be null or undefined`));
      }
    }

    return ok(
      new StandardPromptVariables(
        inputTextFile.trim(),
        destinationPath.trim(),
        additionalVariables,
      ),
    );
  }

  /**
   * Converts the prompt variables to a record format
   *
   * @returns Record containing all prompt variables
   */
  toRecord(): Record<string, string> {
    return {
      input_text_file: this.inputTextFile,
      destination_path: this.destinationPath,
      ...this.additionalVariables,
    };
  }

  /**
   * Gets the input text file path
   */
  getInputTextFile(): string {
    return this.inputTextFile;
  }

  /**
   * Gets the destination path
   */
  getDestinationPath(): string {
    return this.destinationPath;
  }

  /**
   * Gets a specific additional variable
   *
   * @param key - The variable key
   * @returns The variable value or undefined if not found
   */
  getAdditionalVariable(key: string): string | undefined {
    return this.additionalVariables[key];
  }

  /**
   * Creates a new instance with updated additional variables
   *
   * @param newVariables - New variables to merge with existing ones
   * @returns Result containing new StandardPromptVariables instance or Error
   */
  withAdditionalVariables(
    newVariables: Record<string, string>,
  ): Result<StandardPromptVariables, Error> {
    return StandardPromptVariables.create(
      this.inputTextFile,
      this.destinationPath,
      { ...this.additionalVariables, ...newVariables },
    );
  }

  /**
   * Creates a new instance with updated input text file
   *
   * @param newInputTextFile - New input text file path
   * @returns Result containing new StandardPromptVariables instance or Error
   */
  withInputTextFile(newInputTextFile: string): Result<StandardPromptVariables, Error> {
    return StandardPromptVariables.create(
      newInputTextFile,
      this.destinationPath,
      this.additionalVariables,
    );
  }

  /**
   * Creates a new instance with updated destination path
   *
   * @param newDestinationPath - New destination path
   * @returns Result containing new StandardPromptVariables instance or Error
   */
  withDestinationPath(newDestinationPath: string): Result<StandardPromptVariables, Error> {
    return StandardPromptVariables.create(
      this.inputTextFile,
      newDestinationPath,
      this.additionalVariables,
    );
  }
}
