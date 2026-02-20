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
 * - No duplicated config extraction (factory handles config values)
 *
 * @module cli/generators/two_params_prompt_generator_ddd
 */

import { dirname } from "jsr:@std/path@^1.0.9";
import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import { PromptTemplatePathResolverTotality } from "$lib/factory/prompt_template_path_resolver.ts";
// ValidatedParams type is now defined inline since validator was removed
type ValidatedParams = {
  directive: { value: string };
  layer: { value: string };
  directiveType: { value: string };
  layerType: { value: string };
  params: string[];
};
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
 *
 * Config extraction is delegated to PromptVariablesFactory to avoid duplication.
 * This generator creates PromptCliParams directly and lets the factory handle
 * all config value resolution (promptDir, schemaDir, workingDir, etc.).
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
      console.log("[TwoParamsPromptGenerator] options.edition:", options.edition);
    }

    // 1. Validate inputs
    if (!config || typeof config !== "object") {
      return error({
        kind: "InvalidConfiguration",
        message: "Configuration must be a valid object",
        field: "config",
      });
    }

    if (!params.directive || !params.layer) {
      return error({
        kind: "InvalidContext",
        message: "Invalid parameters: directive and layer are required",
        details: params,
      });
    }

    if (!variables || !variables.standardVariables || !variables.userVariables) {
      return error({
        kind: "InvalidContext",
        message:
          "Invalid variables: ProcessedVariables must contain standardVariables and userVariables",
        details: variables,
      });
    }

    // 2. Create CLI params directly (no intermediate config extraction)
    const cliParams = this.createCliParams(params, options, variables);
    if (isDebug) {
      console.log(
        "[TwoParamsPromptGenerator] createCliParams result:",
        JSON.stringify(cliParams, null, 2),
      );
    }

    // 3. Create and validate factory (factory handles config extraction)
    const factoryResult = await this.createAndValidateFactory(config, cliParams);
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
      variables,
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

    // 5. Generate prompt content
    const promptResult = await this.generatePromptContent(
      factoryResult.data,
      variablesResult.data,
      params,
      config,
      options,
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
   * Extract and validate error format from options
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
   * Create and validate factory
   *
   * The factory handles all config value extraction (promptDir, schemaDir, workingDir)
   * through its own createWithConfig/create methods.
   */
  private async createAndValidateFactory(
    config: Record<string, unknown>,
    cliParams: PromptCliParams,
  ): Promise<Result<PromptVariablesFactory, PromptGeneratorError>> {
    try {
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
   * Create CLI parameters directly from validated params, options, and variables
   *
   * Config values like promptDir, schemaDir, workingDir are passed through from
   * options as-is. The PromptVariablesFactory handles the actual config extraction
   * and fallback logic, so we do not duplicate that here.
   */
  private createCliParams(
    params: ValidatedParams,
    options: Record<string, unknown>,
    variables: ProcessedVariables,
  ): PromptCliParams {
    return {
      layerType: params.layer.value,
      directiveType: params.directive.value,
      options: {
        fromFile: (options.f as string) || (options.from as string) || (options.fromFile as string),
        destinationFile: (options.o as string) || (options.destination as string) ||
          (options.output as string),
        input: (options.e as string) || (options.edition as string),
        adaptation: (options.a as string) || (options.adaptation as string),
        promptDir: options.promptDir as string | undefined,
        input_text: variables.standardVariables.input_text,
        userVariables: variables.userVariables,
        extended: options.extended as boolean | undefined,
        customValidation: options.customValidation as boolean | undefined,
        errorFormat: this.extractErrorFormat(options),
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
    variables: ProcessedVariables,
  ): Promise<Result<Record<string, string>, PromptGeneratorError>> {
    try {
      const allParams = factory.getAllParams();

      const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
      if (isDebug) {
        console.log(
          "[TwoParamsPromptGenerator] allParams from factory:",
          JSON.stringify(
            {
              promptFilePath: allParams.promptFilePath,
              inputFilePath: allParams.inputFilePath,
              outputFilePath: allParams.outputFilePath,
              schemaFilePath: allParams.schemaFilePath,
            },
            null,
            2,
          ),
        );
      }

      // Create factory values
      const factoryValues: FactoryResolvedValues = {
        promptFilePath: allParams.promptFilePath,
        inputFilePath: allParams.inputFilePath,
        // Only include outputFilePath if it's not empty
        ...(allParams.outputFilePath ? { outputFilePath: allParams.outputFilePath } : {}),
        schemaFilePath: allParams.schemaFilePath,
        userVariables: variables.userVariables,
        // Fallback: Use inputText if available, otherwise use standardVariables.input_text
        inputText: (variables as { inputText?: string }).inputText ||
          variables.standardVariables.input_text,
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

      // Add base_prompt_dir from promptFilePath
      // This is the directory containing the prompt template file
      if (factoryValues.promptFilePath) {
        const basePromptDir = dirname(factoryValues.promptFilePath);
        builder.addStandardVariable("base_prompt_dir", basePromptDir);
      }

      // Only add destination_path if it exists in variables
      // Do not add it when outputFilePath is not provided
      if (allParams.outputFilePath && !factoryValues.outputFilePath) {
        // outputFilePath exists but wasn't added to factoryValues
        if (variables.allVariables?.destination_path) {
          builder.addStandardVariable(
            "destination_path",
            variables.allVariables.destination_path,
          );
        } else if (variables.standardVariables?.destination_path) {
          builder.addStandardVariable(
            "destination_path",
            variables.standardVariables.destination_path,
          );
        }
      }

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
   * Uses PromptTemplatePathResolverTotality for consistent path resolution
   */
  private async generatePromptContent(
    _factory: PromptVariablesFactory,
    variables: Record<string, string>,
    params: ValidatedParams,
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<Result<PromptResult, PromptGeneratorError>> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    try {
      // Create CLI params for path resolver
      const cliParams = {
        layerType: params.layer.value,
        directiveType: params.directive.value,
        options: options || {},
      };

      // Use PromptTemplatePathResolverTotality for consistent path resolution
      const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
      if (!resolverResult.ok) {
        return error({
          kind: "PromptPathError",
          path: "Failed to create path resolver",
          error: `Path resolver creation failed: ${resolverResult.error.kind}`,
        });
      }

      const resolver = resolverResult.data;
      const pathResult = resolver.getPath();
      if (!pathResult.ok) {
        // Extract attempted paths from TemplateNotFound error for better error message
        let errorMessage = `Template path resolution failed: ${pathResult.error.kind}`;
        let attemptedPath = "Unknown path";

        if (pathResult.error.kind === "TemplateNotFound" && "attempted" in pathResult.error) {
          const templateNotFoundError = pathResult.error as {
            attempted: string[];
            fallback?: string;
          };
          if (templateNotFoundError.attempted && templateNotFoundError.attempted.length > 0) {
            attemptedPath = templateNotFoundError.attempted[0];
            errorMessage = `Template not found: ${attemptedPath}`;
            if (templateNotFoundError.attempted.length > 1) {
              errorMessage += `\nAttempted paths: ${templateNotFoundError.attempted.join(", ")}`;
            }
            if (templateNotFoundError.fallback) {
              errorMessage += `\nFallback: ${templateNotFoundError.fallback}`;
            }
          }
        }

        return error({
          kind: "PromptPathError",
          path: attemptedPath,
          error: errorMessage,
        });
      }

      const templatePath = pathResult.data;
      const promptFilePath = templatePath.value;

      // Create PromptPath
      const promptPathResult = PromptPath.create(promptFilePath);
      if (!promptPathResult.ok) {
        return error({
          kind: "PromptPathError",
          path: promptFilePath,
          error: promptPathResult.error.message,
        });
      }

      // Generate prompt using PromptTemplatePathResolverTotality result
      if (isDebug) {
        console.log(
          "[generatePrompt] Creating prompt variables with:",
          JSON.stringify(variables, null, 2),
        );
      }
      const promptVariables = this.createPromptVariables(variables);
      const result = await this.adapter.generatePrompt(
        promptPathResult.data,
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
  private createPromptVariables(
    variables: Record<string, string>,
  ): PromptVariables {
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
      case "TemplateNotFound": {
        let message = `Template not found: ${error.path}`;
        if (error.workingDir) {
          message += ` (working_dir: ${error.workingDir})`;
        }
        if (error.attemptedPaths && error.attemptedPaths.length > 0) {
          message += `\nAttempted paths: ${error.attemptedPaths.join(", ")}`;
        }
        return message;
      }
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
