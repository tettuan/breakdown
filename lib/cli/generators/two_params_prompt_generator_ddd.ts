/**
 * @fileoverview TwoParamsPromptGenerator - DDD Refactored with Complete Result Type Usage
 *
 * This module handles prompt generation following Domain-Driven Design principles
 * with complete Result type usage, exhaustive error handling, and clear domain boundaries.
 *
 * Key improvements:
 * - Complete Result type usage throughout all methods
 * - Exhaustive error handling with Totality principle
 * - Clear separation of domain logic and infrastructure concerns
 * - Type-safe configuration handling
 * - Smart Constructors for domain objects
 * - Immutable value objects
 *
 * @module cli/generators/two_params_prompt_generator_ddd
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import type { ValidatedParams } from "../validators/two_params_validator_ddd.ts";
import type { PromptCliParams } from "$lib/types/mod.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "$lib/builder/variables_builder.ts";
import type { ProcessedVariables } from "../../processor/variable_processor.ts";
import { PromptManagerAdapter } from "$lib/prompt/prompt_manager_adapter.ts";
import { PromptPath } from "$lib/types/prompt_types.ts";
import type { PromptError, PromptVariables } from "$lib/types/prompt_types.ts";

// ============================================================================
// Domain Value Objects - Type-safe prompt generation entities
// ============================================================================

/**
 * PromptConfiguration - Immutable configuration for prompt generation
 */
interface PromptConfiguration {
  readonly promptDir?: string;
  readonly schemaDir?: string;
  readonly workingDir?: string;
  readonly adaptation?: string;
  readonly extended?: boolean;
  readonly customValidation?: boolean;
  readonly errorFormat?: "simple" | "detailed" | "json";
}

/**
 * GenerationContext - Immutable context for prompt generation
 */
interface GenerationContext {
  readonly params: ValidatedParams;
  readonly configuration: PromptConfiguration;
  readonly variables: ProcessedVariables;
  readonly options: Record<string, unknown>;
}

/**
 * PromptResult - Result of prompt generation
 */
interface PromptResult {
  readonly content: string;
  readonly metadata?: {
    readonly path: string;
    readonly variables: Record<string, string>;
    readonly timestamp: string;
  };
}

// ============================================================================
// Error Types - Exhaustive error handling with Totality
// ============================================================================

/**
 * PromptGeneratorError - Comprehensive error types following Totality principle
 */
export type PromptGeneratorError =
  // Factory errors
  | { readonly kind: "FactoryCreationError"; readonly message: string; readonly cause?: unknown }
  | {
    readonly kind: "FactoryValidationError";
    readonly errors: readonly string[];
    readonly context?: string;
  }
  // Variable builder errors
  | {
    readonly kind: "VariablesBuilderError";
    readonly errors: readonly string[];
    readonly phase?: string;
  }
  // Prompt generation errors
  | { readonly kind: "PromptPathError"; readonly path: string; readonly error: string }
  | { readonly kind: "PromptGenerationError"; readonly error: string; readonly details?: unknown }
  | { readonly kind: "TemplateError"; readonly template: string; readonly error: string }
  // Configuration errors
  | { readonly kind: "InvalidConfiguration"; readonly message: string; readonly field?: string }
  | {
    readonly kind: "ConfigurationValidationError";
    readonly message: string;
    readonly missingProperties: readonly string[];
  }
  // Context errors
  | { readonly kind: "InvalidContext"; readonly message: string; readonly details?: unknown };

// ============================================================================
// Domain Service - Prompt generation with clear boundaries
// ============================================================================

/**
 * TwoParamsPromptGenerator - Domain service for prompt generation
 *
 * This service maintains clear separation between domain logic (prompt generation rules)
 * and infrastructure concerns (file system, adapters), following DDD principles.
 */
export class TwoParamsPromptGenerator {
  constructor(
    private readonly adapter: PromptManagerAdapter = new PromptManagerAdapter({
      useInternalReplacement: true,
    }),
  ) {}

  /**
   * Generate prompt with complete Result type usage
   *
   * @param config - Configuration object
   * @param params - Validated parameters
   * @param options - Command line options
   * @param variables - Processed variables
   * @returns Result with generated prompt content or errors
   */
  async generatePrompt(
    config: Record<string, unknown>,
    params: ValidatedParams,
    options: Record<string, unknown>,
    variables: ProcessedVariables,
  ): Promise<Result<string, PromptGeneratorError>> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] generatePrompt options:",
        JSON.stringify(options, null, 2),
      );
      console.log("[TwoParamsPromptGenerator] options.input:", options.input);
    }

    // 1. Validate and create configuration
    const configResult = this.createConfiguration(config, options);
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] createConfiguration result:",
        JSON.stringify(
          {
            ok: configResult.ok,
            data: configResult.ok ? configResult.data : undefined,
            error: !configResult.ok ? configResult.error : undefined,
          },
          null,
          2,
        ),
      );
    }
    if (!configResult.ok) {
      return error(configResult.error);
    }

    // 2. Create generation context
    const contextResult = this.createGenerationContext(
      params,
      configResult.data,
      variables,
      options,
    );
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] createGenerationContext result:",
        JSON.stringify(
          {
            ok: contextResult.ok,
            data: contextResult.ok ? contextResult.data : undefined,
            error: !contextResult.ok ? contextResult.error : undefined,
          },
          null,
          2,
        ),
      );
    }
    if (!contextResult.ok) {
      return error(contextResult.error);
    }

    // 3. Create and validate factory
    const factoryResult = await this.createAndValidateFactory(
      contextResult.data,
      config,
    );
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] createPromptFactory result:",
        JSON.stringify(
          {
            ok: factoryResult.ok,
            error: !factoryResult.ok ? factoryResult.error : undefined,
          },
          null,
          2,
        ),
      );
    }
    if (!factoryResult.ok) {
      return error(factoryResult.error);
    }

    // 4. Build variables
    const variablesResult = await this.buildVariables(
      factoryResult.data,
      contextResult.data,
    );
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] buildVariables result:",
        JSON.stringify(
          {
            ok: variablesResult.ok,
            data: variablesResult.ok ? variablesResult.data : undefined,
            error: !variablesResult.ok ? variablesResult.error : undefined,
          },
          null,
          2,
        ),
      );
    }
    if (!variablesResult.ok) {
      return error(variablesResult.error);
    }

    // 5. Generate prompt
    const promptResult = await this.generatePromptContent(
      factoryResult.data,
      variablesResult.data,
    );
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] generatePromptContent result:",
        JSON.stringify(
          {
            ok: promptResult.ok,
            content: promptResult.ok
              ? promptResult.data.content.substring(0, 200) + "..."
              : undefined,
            error: !promptResult.ok ? promptResult.error : undefined,
          },
          null,
          2,
        ),
      );
    }
    if (!promptResult.ok) {
      return error(promptResult.error);
    }

    return ok(promptResult.data.content);
  }

  // ============================================================================
  // Private methods - Domain logic implementation with Result types
  // ============================================================================

  /**
   * Create configuration from raw config and options
   */
  private createConfiguration(
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Result<PromptConfiguration, PromptGeneratorError> {
    // Validate configuration object
    if (!config || typeof config !== "object") {
      return error({
        kind: "InvalidConfiguration",
        message: "Configuration must be a valid object",
        field: "config",
      });
    }

    // Extract prompt directory
    const promptDir = this.extractPromptDir(config, options);
    if (!promptDir) {
      return error({
        kind: "ConfigurationValidationError",
        message:
          "Missing required configuration: promptDir or app_prompt.base_dir must be specified",
        missingProperties: ["promptDir", "app_prompt.base_dir"],
      });
    }

    // Create configuration value object
    const configuration: PromptConfiguration = {
      promptDir,
      schemaDir: this.extractSchemaDir(config, options),
      workingDir: this.extractWorkingDir(config),
      adaptation: options.adaptation as string | undefined,
      extended: options.extended as boolean | undefined,
      customValidation: options.customValidation as boolean | undefined,
      errorFormat: this.extractErrorFormat(options),
    };

    return ok(configuration);
  }

  /**
   * Extract prompt directory with fallbacks
   */
  private extractPromptDir(
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): string | undefined {
    // Priority: options > config.promptDir > config.app_prompt.base_dir
    if (options.promptDir && typeof options.promptDir === "string") {
      return options.promptDir;
    }

    if (config.promptDir && typeof config.promptDir === "string") {
      return config.promptDir;
    }

    const appPrompt = config.app_prompt as Record<string, unknown> | undefined;
    if (appPrompt?.base_dir && typeof appPrompt.base_dir === "string") {
      return appPrompt.base_dir;
    }

    // Fallback to default prompt directory when configuration loading fails
    // This allows the system to work even when BreakdownConfig can't load properly
    // Check if we're in examples directory and adjust path accordingly
    const cwd = Deno.cwd();
    if (cwd.endsWith("/examples") || cwd.includes("/examples/")) {
      return "./prompts";
    }
    // Use relative path to work from current working directory
    return "./.agent/breakdown/prompts";
  }

  /**
   * Extract schema directory
   */
  private extractSchemaDir(
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): string | undefined {
    if (options.schemaDir && typeof options.schemaDir === "string") {
      return options.schemaDir;
    }

    const appSchema = config.app_schema as Record<string, unknown> | undefined;
    if (appSchema?.base_dir && typeof appSchema.base_dir === "string") {
      return appSchema.base_dir;
    }

    return undefined;
  }

  /**
   * Extract working directory with unified configuration validation
   */
  private extractWorkingDir(config: Record<string, unknown>): string | undefined {
    // ✅ SINGLE SOURCE OF TRUTH: Only use working_dir at root level
    const workingDir = config.working_dir as string | undefined;

    return workingDir;
  }

  /**
   * Extract and validate error format
   */
  private extractErrorFormat(
    options: Record<string, unknown>,
  ): "simple" | "detailed" | "json" | undefined {
    const format = options.errorFormat;
    if (format === "simple" || format === "detailed" || format === "json") {
      return format;
    }
    return undefined;
  }

  /**
   * Create generation context
   */
  private createGenerationContext(
    params: ValidatedParams,
    configuration: PromptConfiguration,
    variables: ProcessedVariables,
    options: Record<string, unknown>,
  ): Result<GenerationContext, PromptGeneratorError> {
    // Validate parameters
    if (!params.directive || !params.layer) {
      return error({
        kind: "InvalidContext",
        message: "Invalid parameters: directive and layer are required",
        details: params,
      });
    }

    // Validate variables
    if (!variables || !variables.standardVariables || !variables.customVariables) {
      return error({
        kind: "InvalidContext",
        message:
          "Invalid variables: ProcessedVariables must contain standardVariables and customVariables",
        details: variables,
      });
    }

    const context: GenerationContext = {
      params,
      configuration,
      variables,
      options,
    };

    return ok(context);
  }

  /**
   * Create and validate factory
   */
  private async createAndValidateFactory(
    context: GenerationContext,
    config: Record<string, unknown>,
  ): Promise<Result<PromptVariablesFactory, PromptGeneratorError>> {
    try {
      // Create CLI parameters
      const cliParams = this.createCliParams(context);

      // Use config passed from test if available, otherwise load BreakdownConfig
      // This allows tests to override configuration without affecting production behavior
      const factoryResult = config && Object.keys(config).length > 0
        ? PromptVariablesFactory.createWithConfig(config, cliParams)
        : await PromptVariablesFactory.create(cliParams, "default");
      if (!factoryResult.ok) {
        return error({
          kind: "FactoryCreationError",
          message: factoryResult.error.message,
          cause: factoryResult.error,
        });
      }
      const factory = factoryResult.data;

      // Validate factory
      const validationResult = this.validateFactory(factory);
      if (!validationResult.ok) {
        return error(validationResult.error);
      }

      return ok(factory);
    } catch (err) {
      return error({
        kind: "FactoryCreationError",
        message: `Unexpected error creating factory: ${
          err instanceof Error ? err.message : String(err)
        }`,
        cause: err,
      });
    }
  }

  /**
   * Create CLI parameters from context
   */
  private createCliParams(context: GenerationContext): PromptCliParams {
    const { params, configuration, variables, options } = context;

    return {
      layerType: params.layer.value,
      directiveType: params.directive.value,
      options: {
        fromFile: (options.from as string) || (options.fromFile as string),
        destinationFile: (options.destination as string) || (options.output as string) ||
          "output.md",
        input: options.input as string, // Add input option for fromLayerType
        adaptation: configuration.adaptation,
        promptDir: configuration.promptDir,
        input_text: variables.standardVariables.input_text || "",
        customVariables: variables.customVariables,
        extended: configuration.extended,
        customValidation: configuration.customValidation,
        errorFormat: configuration.errorFormat,
        config: options.config as string,
      },
    };
  }

  /**
   * Validate factory with Result type
   */
  private validateFactory(
    factory: PromptVariablesFactory,
  ): Result<void, PromptGeneratorError> {
    try {
      factory.validateAll();
      return ok(undefined);
    } catch (err) {
      const errors = err instanceof Error
        ? [err.message]
        : Array.isArray(err)
        ? err.map(String)
        : [String(err)];

      return error({
        kind: "FactoryValidationError",
        errors,
        context: "factory validation",
      });
    }
  }

  /**
   * Build variables with complete error handling
   */
  private buildVariables(
    factory: PromptVariablesFactory,
    context: GenerationContext,
  ): Promise<Result<Record<string, string>, PromptGeneratorError>> {
    try {
      const allParams = factory.getAllParams();

      // Create factory values
      const factoryValues: FactoryResolvedValues = {
        promptFilePath: allParams.promptFilePath,
        inputFilePath: allParams.inputFilePath || "",
        outputFilePath: allParams.outputFilePath || "output.md",
        schemaFilePath: allParams.schemaFilePath || "",
        customVariables: context.variables.customVariables,
        // Fallback: Use inputText if available, otherwise use standardVariables.input_text
        inputText: (context.variables as { inputText?: string }).inputText ||
          context.variables.standardVariables.input_text,
      };

      // Create and validate builder
      const builder = new VariablesBuilder();
      const validationResult = builder.validateFactoryValues(factoryValues);

      if (!validationResult.ok) {
        const errors = validationResult.error.map((e) => {
          if (typeof e === "object" && e !== null && "kind" in e) {
            return `${e.kind}: ${JSON.stringify(e)}`;
          }
          return String(e);
        });

        return Promise.resolve(error({
          kind: "VariablesBuilderError",
          errors,
          phase: "validation",
        }));
      }

      // Add values to builder
      builder.addFromFactoryValues(factoryValues);

      // Build variables
      const buildResult = builder.build();
      if (!buildResult.ok) {
        const errors = buildResult.error.map((e) => {
          if (typeof e === "object" && e !== null && "kind" in e) {
            return `${e.kind}: ${JSON.stringify(e)}`;
          }
          return String(e);
        });

        return Promise.resolve(error({
          kind: "VariablesBuilderError",
          errors,
          phase: "build",
        }));
      }

      return Promise.resolve(ok(builder.toRecord()));
    } catch (err) {
      return Promise.resolve(error({
        kind: "VariablesBuilderError",
        errors: [err instanceof Error ? err.message : String(err)],
        phase: "unexpected",
      }));
    }
  }

  /**
   * Generate prompt content with complete error handling
   */
  private async generatePromptContent(
    factory: PromptVariablesFactory,
    variables: Record<string, string>,
  ): Promise<Result<PromptResult, PromptGeneratorError>> {
    try {
      const allParams = factory.getAllParams();
      const promptFilePath = allParams.promptFilePath;

      // Create PromptPath
      const pathResult = PromptPath.create(promptFilePath);
      if (!pathResult.ok) {
        return error({
          kind: "PromptPathError",
          path: promptFilePath,
          error: pathResult.error.message,
        });
      }

      // Create PromptVariables
      const promptVariables = this.createPromptVariables(variables);

      // Generate prompt using adapter
      const result = await this.adapter.generatePrompt(
        pathResult.data,
        promptVariables,
      );

      if (!result.ok) {
        return error({
          kind: "PromptGenerationError",
          error: this.formatPromptError(result.error),
          details: result.error,
        });
      }

      // Create result with metadata
      const promptResult: PromptResult = {
        content: result.data.content,
        metadata: {
          path: promptFilePath,
          variables,
          timestamp: new Date().toISOString(),
        },
      };

      return ok(promptResult);
    } catch (err) {
      return error({
        kind: "PromptGenerationError",
        error: err instanceof Error ? err.message : String(err),
        details: err,
      });
    }
  }

  /**
   * Create PromptVariables implementation
   */
  private createPromptVariables(variables: Record<string, string>): PromptVariables {
    return {
      toRecord(): Record<string, string> {
        return { ...variables };
      },
    };
  }

  /**
   * Format PromptError for display with exhaustive handling
   */
  private formatPromptError(error: PromptError): string {
    switch (error.kind) {
      case "TemplateNotFound":
        return `Template not found: ${error.path}`;
      case "InvalidVariables":
        return `Invalid variables: ${error.details.join(", ")}`;
      case "SchemaError":
        return `Schema error in ${error.schema}: ${error.error}`;
      case "InvalidPath":
        return `Invalid path: ${error.message}`;
      case "TemplateParseError":
        return `Failed to parse template ${error.template}: ${error.error}`;
      case "ConfigurationError":
        return `Configuration error: ${error.message}`;
      default: {
        // Exhaustive check
        const _exhaustive: never = error;
        return `Unknown error: ${JSON.stringify(_exhaustive)}`;
      }
    }
  }
}

// ============================================================================
// Factory Function - Convenient creation method
// ============================================================================

/**
 * Create prompt generator with optional custom adapter
 */
export function createPromptGenerator(
  adapter?: PromptManagerAdapter,
): TwoParamsPromptGenerator {
  return new TwoParamsPromptGenerator(adapter);
}
