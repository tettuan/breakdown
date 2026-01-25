import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { dirname } from "@std/path";
import { existsSync } from "@std/fs";
import type { CommandResult } from "./mod.ts";

/**
 * Get default directive type from configuration
 * @param profilePrefix - Configuration profile prefix (default: "default")
 * @returns Default directive type from config or fallback "to"
 */
async function getDefaultDirectiveType(profilePrefix = "default"): Promise<string> {
  try {
    const breakdownConfigResult = await BreakdownConfig.create(profilePrefix);

    // Check if result is successful
    if (
      !breakdownConfigResult || typeof breakdownConfigResult !== "object" ||
      !("success" in breakdownConfigResult)
    ) {
      return "to";
    }

    if (!breakdownConfigResult.success || !breakdownConfigResult.data) {
      return "to";
    }

    const configInstance = breakdownConfigResult.data as unknown;

    // Type guard for configInstance
    if (!configInstance || typeof configInstance !== "object") {
      return "to";
    }

    const config = configInstance as Record<string, unknown>;

    // Load configuration if needed
    if (typeof config.load === "function") {
      await config.load();
    }

    // Get configuration data
    const configData = typeof config.getConfig === "function" ? await config.getConfig() : config;

    // Try to get from testData.validDirectives first
    const userConfig = config.userConfig || (configData as Record<string, unknown>)?.userConfig;
    const testData = (userConfig as Record<string, unknown>)?.testData as Record<string, unknown>;
    const validDirectives = testData?.validDirectives;
    if (Array.isArray(validDirectives) && validDirectives.length > 0) {
      return validDirectives[0];
    }

    // Fallback to pattern extraction
    const configDataObj = configData as Record<string, unknown>;
    const paramsObj = configDataObj?.params as Record<string, unknown>;
    const twoObj = paramsObj?.two as Record<string, unknown>;
    const directiveTypeObj = twoObj?.directiveType as Record<string, unknown>;
    const directivePattern = directiveTypeObj?.pattern;
    if (typeof directivePattern === "string") {
      const firstDirective = directivePattern.split("|")[0].replace(/[^a-zA-Z]/g, "");
      if (firstDirective) {
        return firstDirective;
      }
    }

    // Final fallback
    return "to";
  } catch {
    // Fallback on any error
    return "to";
  }
}

/**
 * Error types for prompt file generation.
 * Used to categorize errors encountered during prompt file generation.
 */
export enum PromptFileErrorType {
  InputFileNotFound = "InputFileNotFound",
  PromptDirNotFound = "PromptDirNotFound",
  PromptFileNotFound = "PromptFileNotFound",
  Unknown = "Unknown",
}

/**
 * Generates prompt files using templates and validates input/output paths.
 */
export class PromptFileGenerator {
  /**
   * Validates that the input file exists at the given path.
   * @param path The file path to validate.
   * @returns A promise that resolves if the file exists, or throws an error if not.
   */
  validateInputFile(path: string): Promise<void> {
    // Only validate if path is provided (actual file input)
    if (!path) {
      return Promise.resolve();
    }
    return Deno.stat(path).then((stat) => {
      if (!stat.isFile) {
        throw new Error(`No such file: ${path}`);
      }
    }, () => {
      throw new Error(`No such file: ${path}`);
    });
  }

  /**
   * Main API: Generates a file using a prompt template.
   *
   * @param fromFile The source file path.
   * @param toFile The destination file path.
   * @param format The format to use for the prompt.
   * @param _force Whether to overwrite the destination file if it exists.
   * @param options Additional options for prompt generation.
   * @returns An object indicating success, output, and error details.
   */
  async generateWithPrompt(
    fromFile: string,
    toFile: string,
    format: string,
    _force = false,
    options?: {
      adaptation?: string;
      promptDir?: string;
      directiveType?: string;
      input_text?: string;
    },
  ): Promise<CommandResult> {
    // Handle stdin input check first, before factory creation
    if (fromFile === "-") {
      if (!options?.input_text) {
        return {
          success: false,
          output: "",
          error: {
            type: PromptFileErrorType.InputFileNotFound,
            message: "No input provided via stdin",
          },
        };
      }
    }

    // Get default directive type from configuration
    const defaultDirectiveType = await getDefaultDirectiveType();

    const cliParams = {
      directiveType: options?.directiveType || defaultDirectiveType,
      layerType: format,
      options: {
        fromFile,
        destinationFile: toFile,
        adaptation: options?.adaptation,
        input_text: options?.input_text,
      },
    };
    let factory;
    let promptFilePath;
    let inputFilePath;

    try {
      const factoryResult = await PromptVariablesFactory.create(cliParams);
      if (!factoryResult.ok) {
        return {
          success: false,
          output: "",
          error: {
            type: PromptFileErrorType.Unknown,
            message: `Factory creation failed: ${factoryResult.error.message}`,
          },
        };
      }

      factory = factoryResult.data;
      const params = factory.getAllParams();
      promptFilePath = params.promptFilePath;
      inputFilePath = params.inputFilePath;
    } catch (e) {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: `Configuration error: ${e instanceof Error ? e.message : String(e)}`,
        },
      };
    }

    // Handle stdin input validation (skip file validation for stdin)
    if (fromFile === "-") {
      // Skip input file validation for stdin
    } else {
      // 3. Check input file existence (executed after argument validation)
      try {
        await this.validateInputFile(inputFilePath);
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("No such file")) {
          return {
            success: false,
            output: "",
            error: {
              type: PromptFileErrorType.InputFileNotFound,
              message: `Input file not found: ${inputFilePath}`,
            },
          };
        }
        return {
          success: false,
          output: "",
          error: {
            type: PromptFileErrorType.Unknown,
            message: `Unknown error while checking input file: ${inputFilePath} - ${e}`,
          },
        };
      }
    }

    // 4. Check template file existence
    const promptDir = dirname(promptFilePath);
    if (!existsSync(promptDir)) {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.PromptDirNotFound,
          message: `Prompt directory not found: ${promptDir}`,
        },
      };
    }
    if (!existsSync(promptFilePath)) {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.PromptFileNotFound,
          message: `Prompt template file not found: ${promptFilePath}`,
        },
      };
    }

    // 6. Template processing
    const { PromptAdapterImpl } = await import("../prompt/prompt_adapter.ts");
    // PromptVariablesFactory implements PromptVariablesProvider interface
    const _adapter = new PromptAdapterImpl(
      factory as import("../prompt/prompt_adapter.ts").PromptVariablesProvider,
    );
    const result = await _adapter.validateAndGenerate();
    if (result.success) {
      return {
        success: true,
        output: result.content,
        error: null,
      };
    } else {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: String(result.content),
        },
      };
    }
  }
}
