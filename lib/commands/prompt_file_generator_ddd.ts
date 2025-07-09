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
import { dirname } from "@std/path";
import { existsSync } from "@std/fs";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * DDD-based implementation of PromptFileGenerator
 * Maintains the same public interface for backward compatibility
 */
export class PromptFileGeneratorDDD {
  private readonly service: PromptGenerationService;
  private readonly logger: BreakdownLogger;

  constructor() {
    this.logger = new BreakdownLogger("prompt-file-generator-ddd");

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
        fallbackStrategies: [
          {
            condition: (error) => error.message.includes("Template not found"),
            action: { type: "fail" },
          },
        ],
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
      logger: this.logger,
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
      demonstrativeType?: string;
      input_text?: string;
    },
  ): Promise<CommandResult> {
    try {
      // Create CLI params for compatibility layer
      const cliParams = {
        demonstrativeType: options?.demonstrativeType || "to",
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
      const directive = cliParams.demonstrativeType;
      const layer = cliParams.layerType;

      // Prepare variables
      const variables: Record<string, string> = {
        input_text: options?.input_text || "",
        input_text_file: inputFilePath,
        destination_path: toFile,
      };

      // Create DirectiveType and LayerType from strings
      const { DirectiveType } = await import("../types/directive_type.ts");
      const { LayerType } = await import("../types/layer_type.ts");

      // Create TwoParams_Result for constructing types
      const twoParamsResult = {
        type: "two" as const,
        demonstrativeType: directive,
        layerType: layer,
        params: [directive, layer],
        options: {},
      };

      const directiveType = DirectiveType.create(twoParamsResult);
      const layerType = LayerType.create(twoParamsResult);

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
    } catch (error) {
      this.logger.error("Unexpected error in generateWithPrompt", { error });
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
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
  async listTemplates() {
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
