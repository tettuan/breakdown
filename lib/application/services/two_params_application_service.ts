/**
 * @fileoverview TwoParams Application Service
 *
 * This service orchestrates the complete two-parameter workflow in the Breakdown application.
 * It follows DDD principles by coordinating between domain objects, infrastructure services,
 * and external systems while maintaining clear separation of concerns.
 *
 * @module application/services/two_params_application_service
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import type { ConfigProfile as _ConfigProfile } from "../../config/config_profile_name.ts";
import { BreakdownConfig } from "../../deps.ts";
import {
  TwoParams,
  type TwoParamsValidationError,
} from "$lib/domain/core/aggregates/two_params.ts";
import {
  type PromptCliParams,
  PromptVariablesFactory,
} from "$lib/factory/prompt_variables_factory.ts";
import type {
  PromptGenerationContext,
  PromptGenerationService,
} from "$lib/prompt/prompt_generation_service.ts";
import { DefaultPromptGenerationServiceFactory } from "$lib/prompt/prompt_generation_service_factory.ts";
import type { PromptError } from "$lib/types/prompt_types.ts";

/**
 * Application service errors following Discriminated Union pattern
 */
export type TwoParamsApplicationServiceError =
  | { kind: "DomainValidationError"; message: string; details?: unknown }
  | { kind: "ConfigurationError"; profile: string; message: string; cause?: unknown }
  | { kind: "InputProcessingError"; message: string; cause?: unknown }
  | { kind: "VariableProcessingError"; errors: string[]; message: string }
  | { kind: "PromptGenerationError"; message: string; cause?: unknown }
  | { kind: "OutputError"; message: string; cause?: unknown };

/**
 * Input data for two params processing
 */
export interface TwoParamsInput {
  readonly directive: string;
  readonly layer: string;
  readonly profileOption?: string | null;
  readonly stdin?: string;
  readonly options?: Record<string, unknown>;
}

/**
 * Processed variables for prompt generation
 */
export interface ProcessedVariables {
  readonly standardVariables: Record<string, string>;
  readonly userVariables: Record<string, string>;
  readonly inputText?: string;
  readonly inputFile?: string;
  readonly outputFile?: string;
}

/**
 * Output result from two params processing
 */
export interface TwoParamsOutput {
  readonly content: string;
  readonly metadata: {
    readonly directive: string;
    readonly layer: string;
    readonly profile: string;
    readonly promptPath: string;
    readonly schemaPath: string;
    readonly timestamp: Date;
  };
}

/**
 * TwoParamsApplicationService - アプリケーションサービス
 *
 * 責務:
 * - TwoParamsドメインの使用ケースのオーケストレーション
 * - 外部システム（JSRパッケージ）との協調
 * - ドメインロジックと技術的詳細の分離
 * - エラーハンドリングと結果の統一
 *
 * Design Principles:
 * - Single Responsibility: Two-parameter workflow orchestration only
 * - Dependency Inversion: Depends on abstractions, not implementations
 * - Result-based error handling following Totality principle
 * - Clear separation between domain logic and application concerns
 *
 * @example Basic usage
 * ```typescript
 * const service = new TwoParamsApplicationService();
 * const input: TwoParamsInput = {
 *   directive: "to",
 *   layer: "issue",
 *   stdin: "Some input content"
 * };
 *
 * const result = await service.process(input);
 * if (result.ok) {
 *   console.log(result.data.content); // Generated prompt
 * }
 * ```
 */
export class TwoParamsApplicationService {
  private readonly promptGenerationService: PromptGenerationService;

  /**
   * Constructor with dependency injection
   */
  constructor(promptGenerationService?: PromptGenerationService) {
    // Simplified constructor - dependencies resolved at runtime
    this.promptGenerationService = promptGenerationService ??
      new DefaultPromptGenerationServiceFactory().create();
  }

  /**
   * Process two parameters through the complete workflow
   *
   * This method orchestrates the entire two-parameter processing pipeline:
   * 1. Domain validation and TwoParams creation
   * 2. Configuration resolution
   * 3. Input processing (STDIN, options)
   * 4. Variable processing and preparation
   * 5. Prompt generation
   * 6. Output formatting
   *
   * @param input - Two parameters input data
   * @returns Result with processed output or application error
   */
  async process(
    input: TwoParamsInput,
  ): Promise<Result<TwoParamsOutput, TwoParamsApplicationServiceError>> {
    // Step 1: Create and validate TwoParams domain object
    const twoParamsResult = TwoParams.createWithCliOption(
      input.directive,
      input.layer,
      input.profileOption,
    );

    if (!twoParamsResult.ok) {
      return error({
        kind: "DomainValidationError",
        cause: twoParamsResult.error,
        message: `Failed to create TwoParams: ${this.formatValidationError(twoParamsResult.error)}`,
      });
    }

    const twoParams = twoParamsResult.data;

    // Step 2: Validate domain state
    const validationResult = twoParams.validate();
    if (!validationResult.ok) {
      return error({
        kind: "DomainValidationError",
        cause: validationResult.error,
        message: `TwoParams validation failed: ${
          this.formatValidationError(validationResult.error)
        }`,
      });
    }

    // Step 3: Process input data (STDIN, options)
    const inputProcessingResult = this.processInput(input);
    if (!inputProcessingResult.ok) {
      return inputProcessingResult;
    }

    // Step 4: Process variables from STDIN and options
    const processedVariables: ProcessedVariables = {
      standardVariables: {
        input_text: input.stdin || "",
        timestamp: new Date().toISOString(),
      },
      userVariables: this.extractUserVariables(input.options || {}),
      inputText: input.stdin,
    };

    // Step 5: Create PromptVariablesFactory configuration with proper working_dir integration
    const configProfile = input.profileOption || "default";

    try {
      const config = await BreakdownConfig.create(configProfile);

      // Use the proper BreakdownConfig for factory creation
      // This ensures working_dir + base_dir integration
      const cliParams = this.createCliParams(twoParams, input, processedVariables);
      const factoryResult = PromptVariablesFactory.createWithConfig(config, cliParams);

      if (!factoryResult.ok) {
        return error({
          kind: "VariableProcessingError",
          errors: [factoryResult.error.message],
          message: "Failed to create PromptVariablesFactory",
        });
      }

      const factory = factoryResult.data;

      // Step 6: Generate prompt using domain service
      const promptResult = await this.generatePrompt(
        twoParams,
        processedVariables,
        factory,
      );

      if (!promptResult.ok) {
        return promptResult;
      }

      // Step 7: Create output
      const output: TwoParamsOutput = {
        content: promptResult.data,
        metadata: {
          directive: twoParams.directive.value,
          layer: twoParams.layer.value,
          profile: twoParams.profile.value,
          promptPath: factory.promptFilePath,
          schemaPath: factory.schemaFilePath,
          timestamp: new Date(),
        },
      };

      return ok(output);
    } catch (configError) {
      return error({
        kind: "ConfigurationError",
        profile: configProfile,
        message: `Failed to load configuration: ${
          configError instanceof Error ? configError.message : String(configError)
        }`,
        cause: configError,
      });
    }

    // Moved to Step 5 - this code was duplicated
  }

  /**
   * Process input data (STDIN, options validation)
   *
   * @param input - Input data to process
   * @returns Result indicating success or input processing error
   */
  private processInput(
    input: TwoParamsInput,
  ): Result<void, TwoParamsApplicationServiceError> {
    try {
      // Placeholder for actual input processing
      // This would typically involve:
      // - STDIN reading and validation
      // - Options validation and normalization
      // - File input processing if applicable

      // For now, just validate that the input is reasonable
      if (input.directive.length === 0 || input.layer.length === 0) {
        return error({
          kind: "InputProcessingError",
          message: "Directive and layer cannot be empty",
        });
      }

      return ok(undefined);
    } catch (cause) {
      return error({
        kind: "InputProcessingError",
        message: `Failed to process input: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        cause,
      });
    }
  }

  /**
   * Process variables for prompt generation
   *
   * @param options - CLI options
   * @param stdinContent - STDIN content
   * @returns Result with processed variables or variable processing error
   */
  private processVariables(
    options: Record<string, unknown>,
    stdinContent: string,
  ): Result<ProcessedVariables, TwoParamsApplicationServiceError> {
    try {
      // Placeholder for actual variable processing
      // This would typically involve:
      // - StandardVariable processing (timestamp, etc.)
      // - FilePathVariable processing (input/output paths)
      // - StdinVariable processing (content processing)
      // - UserVariable processing (--uv-* options)

      const processedVariables: ProcessedVariables = {
        standardVariables: {
          timestamp: new Date().toISOString(),
          input_text: stdinContent,
        },
        userVariables: this.extractUserVariables(options),
        inputText: stdinContent,
      };

      return ok(processedVariables);
    } catch (cause) {
      return error({
        kind: "VariableProcessingError",
        errors: [cause instanceof Error ? cause.message : String(cause)],
        message: "Failed to process variables for prompt generation",
      });
    }
  }

  /**
   * Generate prompt using TwoParams and processed variables
   *
   * @param twoParams - Validated TwoParams domain object
   * @param variables - Processed variables
   * @returns Result with generated prompt content or generation error
   */
  private async generatePrompt(
    _twoParams: TwoParams,
    variables: ProcessedVariables,
    factory: PromptVariablesFactory,
  ): Promise<Result<string, TwoParamsApplicationServiceError>> {
    try {
      // Use paths from factory which has proper config with working_dir + base_dir
      const promptPath = factory.promptFilePath;
      const schemaPath = factory.schemaFilePath;

      // Create context for prompt generation
      const context: PromptGenerationContext = {
        promptFilePath: promptPath,
        inputFilePath: variables.inputFile || "-",
        outputFilePath: variables.outputFile || "output.json",
        schemaFilePath: schemaPath,
        userVariables: variables.userVariables,
        inputText: variables.inputText,
      };

      // Validate context
      const validationResult = this.promptGenerationService.validateContext(
        context,
        { hasValidBaseDir: true },
      );

      if (!validationResult.ok) {
        return error({
          kind: "PromptGenerationError",
          message: this.formatPromptError(validationResult.error),
          cause: validationResult.error,
        });
      }

      // Generate prompt
      const promptResult = await this.promptGenerationService.generatePrompt(context);

      if (!promptResult.ok) {
        return error({
          kind: "PromptGenerationError",
          message: this.formatPromptError(promptResult.error),
          cause: promptResult.error,
        });
      }

      return ok(promptResult.data.content);
    } catch (cause) {
      return error({
        kind: "PromptGenerationError",
        message: `Failed to generate prompt: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        cause,
      });
    }
  }

  /**
   * Format prompt error for user-friendly display
   *
   * @param promptError - Prompt generation error
   * @returns Formatted error message
   */
  private formatPromptError(promptError: PromptError): string {
    switch (promptError.kind) {
      case "TemplateNotFound": {
        let message = `Template not found: ${promptError.path}`;
        if (promptError.workingDir) {
          message += ` (working_dir: ${promptError.workingDir})`;
        }
        if (promptError.attemptedPaths && promptError.attemptedPaths.length > 0) {
          message += `\nAttempted paths: ${promptError.attemptedPaths.join(", ")}`;
        }
        return message;
      }
      case "InvalidVariables":
        return `Invalid variables: ${promptError.details.join(", ")}`;
      case "SchemaError":
        return `Schema error in ${promptError.schema}: ${promptError.error}`;
      case "InvalidPath":
        return "Invalid path";
      case "ConfigurationError":
        return `Configuration error: ${promptError.message}`;
      default:
        return "Unknown prompt error";
    }
  }

  /**
   * Format validation error for user-friendly display
   *
   * @param validationError - TwoParams validation error
   * @returns Formatted error message
   */
  private formatValidationError(validationError: TwoParamsValidationError): string {
    switch (validationError.kind) {
      case "InvalidDirective":
        return `Invalid directive "${validationError.directive}"`;
      case "InvalidLayer":
        return `Invalid layer "${validationError.layer}"`;
      case "UnsupportedCombination":
        return `Unsupported combination: "${validationError.directive}" + "${validationError.layer}"`;
      case "PatternNotFound":
        return `Pattern not found at "${validationError.configPath}"`;
      default:
        return "Unknown validation error";
    }
  }

  /**
   * Create CLI parameters for PromptVariablesFactory
   *
   * @param twoParams - TwoParams domain object
   * @param input - Input data
   * @param variables - Processed variables
   * @returns PromptCliParams for factory
   */
  private createCliParams(
    twoParams: TwoParams,
    input: TwoParamsInput,
    variables: ProcessedVariables,
  ): PromptCliParams {
    return {
      directiveType: twoParams.directive.value,
      layerType: twoParams.layer.value,
      options: {
        fromFile: input.options?.fromFile as string | undefined,
        destinationFile: input.options?.destinationFile as string | undefined,
        adaptation: input.options?.adaptation as string | undefined,
        promptDir: input.options?.promptDir as string | undefined,
        input_text: variables.inputText || "",
        userVariables: variables.userVariables,
        extended: input.options?.extended as boolean | undefined,
        customValidation: input.options?.customValidation as boolean | undefined,
        errorFormat: input.options?.errorFormat as "simple" | "detailed" | "json" | undefined,
        config: input.options?.config as string | undefined,
      },
    };
  }

  /**
   * Extract user variables from options
   *
   * @param options - CLI options
   * @returns User variables
   */
  private extractUserVariables(options: Record<string, unknown>): Record<string, string> {
    const userVariables: Record<string, string> = {};

    // Extract options that start with "uv-" prefix
    // Keep the "uv-" prefix for VariablesBuilder to process correctly
    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-") && typeof value === "string") {
        // Keep the full key with "uv-" prefix
        userVariables[key] = value;
      }
    }

    return userVariables;
  }

  /**
   * Get service health status for monitoring
   *
   * @returns Service health information
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: Date;
    dependencies: Record<string, "available" | "unavailable">;
  } {
    return {
      status: "healthy",
      timestamp: new Date(),
      dependencies: {
        "PromptGenerationService": "available",
        "PromptVariablesFactory": "available",
        "TwoParams": "available",
      },
    };
  }

  /**
   * @deprecated createDefault() は廃止予定
   * BreakdownParams統合により設定ファイルベース実装に移行。
   * 通常のコンストラクタを使用してください。
   *
   * @returns New TwoParamsApplicationService instance
   */
  static createDefault(): TwoParamsApplicationService {
    return new TwoParamsApplicationService();
  }
}

/**
 * Factory function for creating application service with dependencies
 *
 * @param dependencies - Optional dependencies
 * @returns New TwoParamsApplicationService instance
 */
export function createTwoParamsApplicationService(
  _dependencies?: { promptAdapter?: unknown },
): TwoParamsApplicationService {
  return new TwoParamsApplicationService();
}
