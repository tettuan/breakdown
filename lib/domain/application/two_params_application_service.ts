/**
 * @fileoverview TwoParamsApplicationService - Application Service for Domain Coordination
 * 
 * This application service orchestrates the coordination between multiple domain services
 * to implement the complete two-params processing flow from CLI input to generated prompt.
 * 
 * Responsibilities:
 * - Coordinate between ConfigurationService, PathResolutionService, 
 *   PromptVariablesFactory, and PromptGenerationService
 * - Manage the transformation flow from TwoParamsResult to GeneratedPrompt
 * - Handle dependency injection and error aggregation
 * - Provide type-safe interfaces using Smart Constructor and Result patterns
 * 
 * @module domain/application/two_params_application_service
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { TwoParams } from "$lib/types/two_params.ts";
import type { TwoParamsValidationError } from "$lib/types/two_params.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import type { PromptCliParams, PromptCliOptions } from "$lib/factory/prompt_variables_factory.ts";
import type { PromptVariablesFactoryErrors } from "$lib/types/prompt_variables_factory_error.ts";
import { PromptVariablesFactoryErrorFactory } from "$lib/types/prompt_variables_factory_error.ts";
import { PromptManagerAdapter } from "$lib/prompt/prompt_manager_adapter.ts";
import { PromptPath } from "$lib/types/prompt_types.ts";
import type { PromptError, PromptResult, PromptVariables } from "$lib/types/prompt_types.ts";
import type { ProcessedVariables } from "$lib/cli/processors/two_params_variable_processor.ts";
import { VariablesBuilder } from "$lib/builder/variables_builder.ts";
import type { FactoryResolvedValues } from "$lib/builder/variables_builder.ts";

/**
 * Error types for application service operations
 */
export type ApplicationServiceError =
  | { kind: "ValidationError"; error: TwoParamsValidationError }
  | { kind: "ConfigurationError"; message: string }
  | { kind: "PathResolutionError"; error: PromptVariablesFactoryErrors }
  | { kind: "PromptGenerationError"; error: PromptError }
  | { kind: "VariableProcessingError"; errors: string[] }
  | { kind: "UnexpectedError"; message: string };

/**
 * Configuration interface for the application service
 */
export interface ApplicationServiceConfig {
  app_prompt?: { base_dir?: string };
  app_schema?: { base_dir?: string };
  [key: string]: unknown;
}

/**
 * Options for the application service operations
 */
export interface ApplicationServiceOptions {
  fromFile?: string;
  destinationFile?: string;
  adaptation?: string;
  promptDir?: string;
  fromLayerType?: string;
  extended?: boolean;
  customValidation?: boolean;
  errorFormat?: "simple" | "detailed" | "json";
  config?: string;
  profile?: string;
}

/**
 * Result of the application service processing
 */
export interface ApplicationServiceResult {
  prompt: string;
  metadata: {
    directive: string;
    layer: string;
    profile: string;
    promptPath: string;
    schemaPath: string;
    timestamp: Date;
  };
}

/**
 * Dependencies for the application service
 */
export interface ApplicationServiceDependencies {
  promptAdapter?: PromptManagerAdapter;
  variablesBuilder?: VariablesBuilder;
}

/**
 * TwoParamsApplicationService - Coordinates domain services for two-params processing
 * 
 * This service implements the application layer pattern by coordinating
 * multiple domain services to fulfill the complete processing flow.
 */
export class TwoParamsApplicationService {
  private readonly promptAdapter: PromptManagerAdapter;
  private readonly variablesBuilder: VariablesBuilder;

  constructor(dependencies: ApplicationServiceDependencies = {}) {
    this.promptAdapter = dependencies.promptAdapter || new PromptManagerAdapter();
    this.variablesBuilder = dependencies.variablesBuilder || new VariablesBuilder();
  }

  /**
   * Process two params from raw input to generated prompt
   * 
   * @param directive - Directive type string
   * @param layer - Layer type string
   * @param config - Application configuration
   * @param options - Processing options
   * @param variables - Processed variables from stdin/cli
   * @returns Result with generated prompt or error
   */
  async process(
    directive: string,
    layer: string,
    config: ApplicationServiceConfig,
    options: ApplicationServiceOptions,
    variables: ProcessedVariables,
  ): Promise<Result<ApplicationServiceResult, ApplicationServiceError>> {
    // Step 1: Create and validate TwoParams domain object
    const profileName = options.profile || options.config || "default";
    const profileResult = ConfigProfileName.create(profileName);
    if (!profileResult.ok) {
      return error({
        kind: "ConfigurationError",
        message: `Invalid profile name: ${profileName}`,
      });
    }

    const twoParamsResult = TwoParams.create(directive, layer, profileResult.data);
    if (!twoParamsResult.ok) {
      return error({
        kind: "ValidationError",
        error: twoParamsResult.error,
      });
    }

    const twoParams = twoParamsResult.data;

    // Step 2: Create PromptVariablesFactory with configuration
    const cliParams = this.createCliParams(twoParams, options, variables);
    const factoryResult = PromptVariablesFactory.createWithConfig(
      config as { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } },
      cliParams,
    );

    if (!factoryResult.ok) {
      return error({
        kind: "PathResolutionError",
        error: factoryResult.error,
      });
    }

    const factory = factoryResult.data;

    // Step 3: Validate factory and resolve paths
    try {
      factory.validateAll();
    } catch (err) {
      return error({
        kind: "PathResolutionError",
        error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(
          err instanceof Error ? err.message : String(err)
        ),
      });
    }

    // Step 4: Build variables using VariablesBuilder
    const variablesResult = this.buildVariables(factory, variables);
    if (!variablesResult.ok) {
      return error(variablesResult.error);
    }

    // Step 5: Generate prompt using PromptManagerAdapter
    const promptResult = await this.generatePrompt(
      factory.promptFilePath,
      variablesResult.data,
    );

    if (!promptResult.ok) {
      return error(promptResult.error);
    }

    // Step 6: Create result with metadata
    const result: ApplicationServiceResult = {
      prompt: promptResult.data.content,
      metadata: {
        directive,
        layer,
        profile: profileName,
        promptPath: factory.promptFilePath,
        schemaPath: factory.schemaFilePath,
        timestamp: new Date(),
      },
    };

    return ok(result);
  }

  /**
   * Create CLI parameters from domain objects and options
   */
  private createCliParams(
    twoParams: TwoParams,
    options: ApplicationServiceOptions,
    variables: ProcessedVariables,
  ): PromptCliParams {
    const cliOptions: PromptCliOptions = {
      fromFile: options.fromFile,
      destinationFile: options.destinationFile || "output.md",
      adaptation: options.adaptation,
      promptDir: options.promptDir,
      fromLayerType: options.fromLayerType,
      input_text: variables.standardVariables.input_text || "",
      customVariables: variables.customVariables,
      extended: options.extended,
      customValidation: options.customValidation,
      errorFormat: options.errorFormat,
      config: options.config,
    };

    return {
      demonstrativeType: twoParams.directive.value,
      layerType: twoParams.layer.value,
      options: cliOptions,
    };
  }

  /**
   * Build variables using VariablesBuilder
   */
  private buildVariables(
    factory: PromptVariablesFactory,
    variables: ProcessedVariables,
  ): Result<Record<string, string>, ApplicationServiceError> {
    const allParams = factory.getAllParams();

    // Create factory values for VariablesBuilder
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: allParams.promptFilePath,
      inputFilePath: allParams.inputFilePath || "",
      outputFilePath: allParams.outputFilePath || "output.md",
      schemaFilePath: allParams.schemaFilePath || "",
      customVariables: variables.customVariables,
      inputText: variables.standardVariables.input_text,
    };

    // Validate factory values
    const validationResult = this.variablesBuilder.validateFactoryValues(factoryValues);
    if (!validationResult.ok) {
      return error({
        kind: "VariableProcessingError",
        errors: validationResult.error.map(e => {
          switch (e.kind) {
            case "InvalidName":
              return `${e.kind}: ${e.name} (valid: ${e.validNames.join(", ")})`;
            case "EmptyValue":
              return `${e.kind}: ${e.variableName} - ${e.reason}`;
            case "ValidationFailed":
              return `${e.kind}: ${e.value} (constraint: ${e.constraint})`;
            case "DuplicateVariable":
              return `${e.kind}: ${e.name}`;
            default:
              return `Unknown error: ${JSON.stringify(e)}`;
          }
        }),
      });
    }

    // Build variables
    this.variablesBuilder.addFromFactoryValues(factoryValues);
    const buildResult = this.variablesBuilder.build();

    if (!buildResult.ok) {
      return error({
        kind: "VariableProcessingError",
        errors: buildResult.error.map(e => {
          switch (e.kind) {
            case "InvalidName":
              return `${e.kind}: ${e.name} (valid: ${e.validNames.join(", ")})`;
            case "EmptyValue":
              return `${e.kind}: ${e.variableName} - ${e.reason}`;
            case "ValidationFailed":
              return `${e.kind}: ${e.value} (constraint: ${e.constraint})`;
            case "DuplicateVariable":
              return `${e.kind}: ${e.name}`;
            default:
              return `Unknown error: ${JSON.stringify(e)}`;
          }
        }),
      });
    }

    return ok(this.variablesBuilder.toRecord());
  }

  /**
   * Generate prompt using PromptManagerAdapter
   */
  private async generatePrompt(
    promptFilePath: string,
    variables: Record<string, string>,
  ): Promise<Result<PromptResult, ApplicationServiceError>> {
    // Create PromptPath
    const pathResult = PromptPath.create(promptFilePath);
    if (!pathResult.ok) {
      return error({
        kind: "PromptGenerationError",
        error: {
          kind: "InvalidPath",
          message: pathResult.error.message,
        },
      });
    }

    // Create PromptVariables
    const promptVariables = this.createPromptVariables(variables);

    // Generate prompt
    const result = await this.promptAdapter.generatePrompt(
      pathResult.data,
      promptVariables,
    );

    if (!result.ok) {
      return error({
        kind: "PromptGenerationError",
        error: result.error,
      });
    }

    return ok(result.data);
  }

  /**
   * Convert variables Record to PromptVariables
   */
  private createPromptVariables(variables: Record<string, string>): PromptVariables {
    return {
      toRecord(): Record<string, string> {
        return { ...variables };
      },
    };
  }

  /**
   * Convenience method for processing with minimal configuration
   */
  static async processWithDefaults(
    directive: string,
    layer: string,
    variables: ProcessedVariables,
  ): Promise<Result<ApplicationServiceResult, ApplicationServiceError>> {
    const service = new TwoParamsApplicationService();
    const config: ApplicationServiceConfig = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const options: ApplicationServiceOptions = {};

    return service.process(directive, layer, config, options, variables);
  }
}

/**
 * Factory function for creating application service with custom dependencies
 */
export function createApplicationService(
  dependencies?: ApplicationServiceDependencies,
): TwoParamsApplicationService {
  return new TwoParamsApplicationService(dependencies);
}

/**
 * Type guard for ApplicationServiceError
 */
export function isApplicationServiceError(
  error: unknown,
): error is ApplicationServiceError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    typeof (error as ApplicationServiceError).kind === "string"
  );
}