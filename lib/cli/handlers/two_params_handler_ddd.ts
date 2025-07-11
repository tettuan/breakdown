/**
 * @fileoverview Two Params Handler - DDD Refactored with Totality and Type Safety
 *
 * This module handles the main breakdown functionality when two parameters
 * are provided (directive type + layer type), following Domain-Driven Design principles.
 *
 * Key improvements:
 * - Complete type safety with branded types and Smart Constructors
 * - Totality principle with exhaustive error handling
 * - Clear separation between domain and infrastructure concerns
 * - Immutable value objects for parameters
 * - Explicit domain boundaries
 *
 * @module lib/cli/handlers/two_params_handler_ddd
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import type { BreakdownConfigCompatible } from "$lib/config/timeout_manager.ts";
import { TwoParamsVariableProcessor } from "../processors/two_params_variable_processor.ts";
import type { ProcessedVariables } from "../processors/two_params_variable_processor.ts";
import { TwoParamsPromptGenerator } from "../generators/two_params_prompt_generator.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
import { TwoParamsValidator } from "../validators/two_params_validator.ts";

// ============================================================================
// Domain Value Objects - Type-safe parameter representation
// ============================================================================

/**
 * DirectiveType - Branded type for directive parameter
 * Represents the processing direction (to, summary, defect, etc.)
 */
type DirectiveType = string & { readonly __brand: "DirectiveType" };

/**
 * LayerType - Branded type for layer parameter
 * Represents the processing layer (project, issue, task, etc.)
 */
type LayerType = string & { readonly __brand: "LayerType" };

/**
 * ValidatedParams - Immutable value object for validated parameters
 */
interface ValidatedParams {
  readonly directive: DirectiveType;
  readonly layer: LayerType;
}

/**
 * Configuration - Type-safe configuration object
 */
interface Configuration {
  readonly timeout?: BreakdownConfigCompatible;
  readonly promptDir?: string;
  readonly schemaDir?: string;
}

/**
 * Options - Type-safe options object
 */
interface Options {
  readonly from?: string;
  readonly fromFile?: string;
  readonly output?: string;
  readonly destination?: string;
  readonly adaptation?: string;
  readonly skipStdin?: boolean;
  readonly [key: string]: unknown; // For custom variables (uv- prefix)
}

// ============================================================================
// Error Types - Exhaustive error handling with Totality
// ============================================================================

/**
 * TwoParamsHandlerError - Comprehensive error types following Totality principle
 */
export type TwoParamsHandlerError =
  // Parameter validation errors
  | { readonly kind: "InvalidParameterCount"; readonly received: number; readonly expected: number }
  | {
    readonly kind: "InvalidDirectiveType";
    readonly value: string;
    readonly validTypes: readonly string[];
  }
  | {
    readonly kind: "InvalidLayerType";
    readonly value: string;
    readonly validTypes: readonly string[];
  }
  // Input processing errors
  | { readonly kind: "StdinReadError"; readonly error: string; readonly cause?: unknown }
  | { readonly kind: "FileReadError"; readonly path: string; readonly error: string }
  // Variable processing errors
  | {
    readonly kind: "VariableProcessingError";
    readonly errors: readonly string[];
    readonly details?: unknown;
  }
  // Prompt generation errors
  | {
    readonly kind: "FactoryValidationError";
    readonly errors: readonly string[];
    readonly context?: string;
  }
  | { readonly kind: "PromptGenerationError"; readonly error: string; readonly phase?: string }
  // Output errors
  | { readonly kind: "OutputWriteError"; readonly error: string; readonly cause?: unknown }
  // Configuration errors
  | {
    readonly kind: "ConfigurationError";
    readonly message: string;
    readonly missingFields?: readonly string[];
  };

// ============================================================================
// Smart Constructors - Type-safe value object creation
// ============================================================================

/**
 * DirectiveType Smart Constructor
 */
const DirectiveType = {
  create(value: string): Result<DirectiveType, TwoParamsHandlerError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "InvalidDirectiveType",
        value,
        validTypes: ["to", "summary", "defect", "init", "find"],
      });
    }
    return ok(value as DirectiveType);
  },

  value(directive: DirectiveType): string {
    return directive;
  },
};

/**
 * LayerType Smart Constructor
 */
const LayerType = {
  create(value: string): Result<LayerType, TwoParamsHandlerError> {
    if (!value || value.trim() === "") {
      return error({
        kind: "InvalidLayerType",
        value,
        validTypes: ["project", "issue", "task", "bugs", "temp"],
      });
    }
    return ok(value as LayerType);
  },

  value(layer: LayerType): string {
    return layer;
  },
};

// ============================================================================
// Domain Service - Orchestration with clear boundaries
// ============================================================================

/**
 * TwoParamsHandlerService - Domain service orchestrating the handler flow
 *
 * This service maintains clear separation between domain logic and infrastructure,
 * delegating technical concerns to appropriate processors while maintaining
 * domain integrity through type-safe value objects.
 */
class TwoParamsHandlerService {
  constructor(
    private readonly validator: TwoParamsValidator,
    private readonly stdinProcessor: TwoParamsStdinProcessor,
    private readonly variableProcessor: TwoParamsVariableProcessor,
    private readonly promptGenerator: TwoParamsPromptGenerator,
  ) {}

  /**
   * Execute the two params handler flow with complete type safety
   */
  async execute(
    params: readonly string[],
    config: unknown,
    options: unknown,
  ): Promise<Result<void, TwoParamsHandlerError>> {
    // 1. Validate and parse configuration with type guards
    const configResult = this.parseConfiguration(config);
    if (!configResult.ok) {
      return error(configResult.error);
    }

    // 2. Validate and parse options with type guards
    const optionsResult = this.parseOptions(options);
    if (!optionsResult.ok) {
      return error(optionsResult.error);
    }

    // 3. Validate parameters and create domain value objects
    const paramsResult = await this.validateAndCreateParams(params);
    if (!paramsResult.ok) {
      return error(paramsResult.error);
    }

    // 4. Process input (STDIN or file)
    const inputResult = await this.processInput(configResult.data, optionsResult.data);
    if (!inputResult.ok) {
      return error(inputResult.error);
    }

    // 5. Process variables with domain rules
    const variablesResult = this.processVariables(optionsResult.data, inputResult.data);
    if (!variablesResult.ok) {
      return error(variablesResult.error);
    }

    // 6. Generate prompt using domain services
    const promptResult = await this.generatePrompt(
      configResult.data,
      paramsResult.data,
      optionsResult.data,
      variablesResult.data,
    );
    if (!promptResult.ok) {
      return error(promptResult.error);
    }

    // 7. Write output (infrastructure concern)
    return await this.writeOutput(promptResult.data);
  }

  // ============================================================================
  // Private methods - Domain logic implementation
  // ============================================================================

  /**
   * Parse and validate configuration with type guards
   */
  private parseConfiguration(config: unknown): Result<Configuration, TwoParamsHandlerError> {
    if (!config || typeof config !== "object") {
      return error({
        kind: "ConfigurationError",
        message: "Configuration must be a valid object",
        missingFields: ["config"],
      });
    }

    // Type-safe configuration extraction
    const typedConfig = config as Record<string, unknown>;
    const configuration: Configuration = {
      timeout: typedConfig as BreakdownConfigCompatible,
      promptDir: typeof typedConfig.promptDir === "string" ? typedConfig.promptDir : undefined,
      schemaDir: typeof typedConfig.schemaDir === "string" ? typedConfig.schemaDir : undefined,
    };

    return ok(configuration);
  }

  /**
   * Parse and validate options with type guards
   */
  private parseOptions(options: unknown): Result<Options, TwoParamsHandlerError> {
    if (!options || typeof options !== "object") {
      return error({
        kind: "ConfigurationError",
        message: "Options must be a valid object",
        missingFields: ["options"],
      });
    }

    // Safe type assertion with validation
    const typedOptions = options as Record<string, unknown>;
    const parsedOptions: Options = {
      ...typedOptions,
      from: typeof typedOptions.from === "string" ? typedOptions.from : undefined,
      fromFile: typeof typedOptions.fromFile === "string" ? typedOptions.fromFile : undefined,
      output: typeof typedOptions.output === "string" ? typedOptions.output : undefined,
      destination: typeof typedOptions.destination === "string"
        ? typedOptions.destination
        : undefined,
      adaptation: typeof typedOptions.adaptation === "string" ? typedOptions.adaptation : undefined,
      skipStdin: typeof typedOptions.skipStdin === "boolean" ? typedOptions.skipStdin : undefined,
    };

    return ok(parsedOptions);
  }

  /**
   * Validate parameters and create domain value objects
   */
  private async validateAndCreateParams(
    params: readonly string[],
  ): Promise<Result<ValidatedParams, TwoParamsHandlerError>> {
    // Check parameter count
    if (!params || params.length < 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params?.length ?? 0,
        expected: 2,
      });
    }

    // Validate using existing validator (to be refactored with Smart Constructors)
    const validationResult = await this.validator.validate([...params]);
    if (!validationResult.ok) {
      return error(this.mapValidationError(validationResult.error));
    }

    // Create domain value objects
    const directiveResult = DirectiveType.create(validationResult.data.demonstrativeType);
    if (!directiveResult.ok) {
      return error(directiveResult.error);
    }

    const layerResult = LayerType.create(validationResult.data.layerType);
    if (!layerResult.ok) {
      return error(layerResult.error);
    }

    return ok({
      directive: directiveResult.data,
      layer: layerResult.data,
    });
  }

  /**
   * Process input with proper error handling
   */
  private async processInput(
    config: Configuration,
    options: Options,
  ): Promise<Result<string, TwoParamsHandlerError>> {
    const stdinResult = await this.stdinProcessor.process(
      config.timeout || {},
      options as Record<string, unknown>,
    );

    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message,
        cause: stdinResult.error.cause,
      });
    }

    return ok(stdinResult.data);
  }

  /**
   * Process variables with domain rules
   */
  private processVariables(
    options: Options,
    inputText: string,
  ): Result<ProcessedVariables, TwoParamsHandlerError> {
    const variablesResult = this.variableProcessor.processVariables(
      options as Record<string, unknown>,
      inputText,
    );

    if (!variablesResult.ok) {
      return error({
        kind: "VariableProcessingError",
        errors: variablesResult.error.map((e) => {
          switch (e.kind) {
            case "InvalidVariablePrefix":
            case "ReservedVariableName":
            case "EmptyVariableValue":
              return `${e.kind}: ${e.key}`;
            case "InvalidOptions":
              return `${e.kind}: ${e.message}`;
            default: {
              // Exhaustive check
              const _exhaustive: never = e;
              return String(_exhaustive);
            }
          }
        }),
        details: variablesResult.error,
      });
    }

    return ok(variablesResult.data);
  }

  /**
   * Generate prompt using domain services
   */
  private async generatePrompt(
    config: Configuration,
    params: ValidatedParams,
    options: Options,
    variables: ProcessedVariables,
  ): Promise<Result<string, TwoParamsHandlerError>> {
    const promptResult = await this.promptGenerator.generatePrompt(
      config as Record<string, unknown>,
      {
        demonstrativeType: DirectiveType.value(params.directive),
        layerType: LayerType.value(params.layer),
      },
      options as Record<string, unknown>,
      variables,
    );

    if (!promptResult.ok) {
      return error(this.mapPromptError(promptResult.error));
    }

    return ok(promptResult.data);
  }

  /**
   * Write output - Infrastructure concern
   */
  private async writeOutput(content: string): Promise<Result<void, TwoParamsHandlerError>> {
    try {
      // Ensure proper formatting
      const finalOutput = content.endsWith("\n") ? content : content + "\n";
      const encoder = new TextEncoder();
      const data = encoder.encode(finalOutput);
      await Deno.stdout.write(data);
      return ok(undefined);
    } catch (err) {
      return error({
        kind: "OutputWriteError",
        error: err instanceof Error ? err.message : String(err),
        cause: err,
      });
    }
  }

  /**
   * Map validation errors with exhaustive handling
   */
  private mapValidationError(error: unknown): TwoParamsHandlerError {
    const validationError = error as {
      kind?: string;
      received?: number;
      expected?: number;
      value?: string;
      validTypes?: string[];
    };

    switch (validationError.kind) {
      case "InvalidParameterCount":
        return {
          kind: "InvalidParameterCount",
          received: validationError.received ?? 0,
          expected: validationError.expected ?? 2,
        };
      case "InvalidDemonstrativeType":
        return {
          kind: "InvalidDirectiveType",
          value: validationError.value ?? "",
          validTypes: validationError.validTypes ?? [],
        };
      case "InvalidLayerType":
        return {
          kind: "InvalidLayerType",
          value: validationError.value ?? "",
          validTypes: validationError.validTypes ?? [],
        };
      default:
        return {
          kind: "FactoryValidationError",
          errors: [String(error)],
          context: "parameter validation",
        };
    }
  }

  /**
   * Map prompt errors with exhaustive handling
   */
  private mapPromptError(error: unknown): TwoParamsHandlerError {
    const promptError = error as {
      kind?: string;
      errors?: string[];
      message?: string;
      error?: string;
      missingProperties?: string[];
    };

    switch (promptError.kind) {
      case "FactoryCreationError":
      case "FactoryValidationError":
        return {
          kind: "FactoryValidationError",
          errors: promptError.errors || [promptError.message || String(error)],
          context: "prompt generation",
        };
      case "VariablesBuilderError":
        return {
          kind: "VariableProcessingError",
          errors: promptError.errors || [promptError.message || String(error)],
          details: promptError,
        };
      case "PromptGenerationError":
        return {
          kind: "PromptGenerationError",
          error: promptError.error || promptError.message || String(error),
          phase: "generation",
        };
      case "InvalidConfiguration":
      case "ConfigurationValidationError":
        return {
          kind: "ConfigurationError",
          message: promptError.message || String(error),
          missingFields: promptError.missingProperties,
        };
      default:
        return {
          kind: "PromptGenerationError",
          error: String(error),
          phase: "unknown",
        };
    }
  }
}

// ============================================================================
// Service Factory - Dependency injection with type safety
// ============================================================================

/**
 * Create service with dependencies
 */
function createTwoParamsHandlerService(): TwoParamsHandlerService {
  return new TwoParamsHandlerService(
    new TwoParamsValidator(),
    new TwoParamsStdinProcessor(),
    new TwoParamsVariableProcessor(),
    new TwoParamsPromptGenerator(),
  );
}

// Singleton instance for performance optimization
let serviceInstance: TwoParamsHandlerService | null = null;

// ============================================================================
// Public API - Maintains backward compatibility
// ============================================================================

/**
 * Handle two parameters case with DDD principles
 *
 * This function maintains the same external interface while implementing
 * Domain-Driven Design principles internally with complete type safety
 * and Totality principle.
 *
 * @param params - Command line parameters from BreakdownParams
 * @param config - Configuration object from BreakdownConfig
 * @param options - Parsed options from BreakdownParams
 * @returns Result with void on success or TwoParamsHandlerError on failure
 */
export async function handleTwoParams(
  params: string[],
  config: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<Result<void, TwoParamsHandlerError>> {
  // Create service instance if not exists (singleton pattern)
  if (!serviceInstance) {
    serviceInstance = createTwoParamsHandlerService();
  }

  // Delegate to domain service with type-safe parameters
  return await serviceInstance.execute(params, config, options);
}

// ============================================================================
// Type guards and utilities for domain integrity
// ============================================================================

/**
 * Type guard for DirectiveType
 */
export function isDirectiveType(value: unknown): value is DirectiveType {
  return typeof value === "string" && value.length > 0;
}

/**
 * Type guard for LayerType
 */
export function isLayerType(value: unknown): value is LayerType {
  return typeof value === "string" && value.length > 0;
}

/**
 * Type guard for ValidatedParams
 */
export function isValidatedParams(value: unknown): value is ValidatedParams {
  return (
    typeof value === "object" &&
    value !== null &&
    "directive" in value &&
    "layer" in value &&
    isDirectiveType((value as Record<string, unknown>).directive) &&
    isLayerType((value as Record<string, unknown>).layer)
  );
}
