/**
 * @fileoverview Prompt File Generator DDD Adapter - Bridges legacy and DDD implementations
 *
 * This adapter maintains backward compatibility while using the new DDD-based
 * prompt generation architecture internally.
 *
 * @module commands/prompt_file_generator_ddd
 */

import type { CommandResult } from "./mod.ts";
import { PromptFileErrorType } from "./prompt_file_generator.ts";
import { PromptGenerationService } from "../application/templates/prompt_generation_service.ts";
import { FileTemplateRepository } from "../infrastructure/templates/file_template_repository.ts";
import { GenerationPolicy } from "../domain/templates/generation_policy.ts";
import {
  createDefaultSelectionStrategy,
  createDefaultVariableStrategies,
} from "../infrastructure/templates/default_generation_strategies.ts";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { dirname } from "@std/path";
import { existsSync } from "@std/fs";

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
  } catch (_error) {
    // Fallback on any error
    return "to";
  }
}

/**
 * DDD-based implementation of PromptFileGenerator
 * Maintains the same public interface for backward compatibility
 */
export class PromptFileGeneratorDDD {
  private readonly service: PromptGenerationService;

  constructor() {
    // Initialize infrastructure
    const repository = new FileTemplateRepository({
      baseDirectory: Deno.cwd(),
      cacheEnabled: true,
      cacheTTLMs: 300000, // 5 minutes
    });

    // Initialize domain policy
    const policyResult = GenerationPolicy.create(
      {
        requiredVariables: ["input_text_file", "destination_path"],
        optionalVariables: ["input_text", "schema_file", "adaptation"],
        variableValidation: {
          destination_path: {
            required: true,
            minLength: 1,
          },
        },
        maxRetries: 3,
        timeoutMs: 30000,
        fallbackStrategies: ["abort", "retry"],
      },
      createDefaultVariableStrategies(),
      createDefaultSelectionStrategy(),
    );

    if (!policyResult.ok) {
      throw new Error(`Policy creation failed: ${policyResult.error.message}`);
    }

    // Initialize application service using Smart Constructor
    const serviceResult = PromptGenerationService.create({
      repository,
      policy: policyResult.data,
    });

    if (!serviceResult.ok) {
      throw new Error(`Service creation failed: ${serviceResult.error}`);
    }

    this.service = serviceResult.data;
  }

  /**
   * Validates that the input file exists at the given path.
   * Maintains compatibility with original implementation.
   */
  validateInputFile(path: string): Promise<void> {
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
   * Maintains backward compatibility with original interface.
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
    try {
      // Get default directive type from configuration
      const defaultDirectiveType = await getDefaultDirectiveType();

      // Create CLI params for compatibility layer
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

      // Use legacy factory to get validated types
      let factory;
      let promptFilePath;
      let inputFilePath;

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        if (!factoryResult.ok) {
          throw new Error(`Factory creation failed: ${factoryResult.error}`);
        }
        factory = factoryResult.data;
        factory.validateAll();
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

      // Validate input file (maintaining original behavior)
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
      } else {
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

      // Check prompt directory exists (maintaining original behavior)
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

      // Get directive and layer from CLI params instead of factory
      const directive = cliParams.directiveType;
      const layer = cliParams.layerType;

      // Prepare variables
      const variables: Record<string, string> = {
        input_text: options?.input_text || "",
        input_text_file: inputFilePath,
        destination_path: toFile,
      };

      // Create DirectiveType and LayerType from strings
      const { DirectiveType } = await import("../domain/core/value_objects/directive_type.ts");
      const { LayerType } = await import("../domain/core/value_objects/layer_type.ts");

      // Create DirectiveType and LayerType from strings directly
      const directiveResult = DirectiveType.create(directive);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error}`);
      }
      const directiveType = directiveResult.data;

      const layerResult = LayerType.create(layer);
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error}`);
      }
      const layerType = layerResult.data;

      // Use DDD service for generation
      const response = await this.service.generatePrompt({
        directive: directiveType,
        layer: layerType,
        variables,
        options: {
          fromFile: inputFilePath,
          toFile,
          adaptation: options?.adaptation,
          inputText: options?.input_text,
          force: _force,
        },
      });

      // Convert to CommandResult
      return this.service.toCommandResult(response);
    } catch (_error) {
      // Error logging removed - using standard error handling
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: `Unexpected error: ${_error instanceof Error ? _error.message : String(_error)}`,
        },
      };
    }
  }

  /**
   * Refresh template cache
   */
  async refreshTemplates(): Promise<void> {
    await this.service.refreshTemplates();
  }

  /**
   * List available templates
   */
  listTemplates() {
    return this.service.listAvailableTemplates();
  }
}

/**
 * Factory function to create the appropriate implementation
 * based on feature flag or configuration
 */
export async function createPromptFileGenerator(useDDD = true) {
  if (useDDD) {
    return new PromptFileGeneratorDDD();
  } else {
    // Fall back to original implementation if needed
    const { PromptFileGenerator } = await import("./prompt_file_generator.ts");
    return new PromptFileGenerator();
  }
}
