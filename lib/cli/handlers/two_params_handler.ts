/**
 * @fileoverview Two Params Handler with internal orchestration
 *
 * This module handles the main breakdown functionality when two parameters
 * are provided (demonstrative type + layer type), using internal orchestration
 * pattern for better separation of concerns while maintaining backward compatibility.
 *
 * Key features:
 * - Uses Result type instead of exceptions
 * - Internal orchestration for better maintainability
 * - Follows Totality principle throughout
 * - Maintains exact same external interface
 *
 * @module lib/cli/handlers/two_params_handler
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import type { BreakdownConfigCompatible } from "$lib/config/timeout_manager.ts";
import { TwoParamsVariableProcessor } from "../processors/two_params_variable_processor.ts";
import { TwoParamsPromptGenerator } from "../generators/two_params_prompt_generator.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
import { TwoParamsValidator } from "../validators/two_params_validator.ts";
import { TwoParamsOutputProcessor } from "../processors/two_params_output_processor.ts";

/**
 * Complete Discriminated Union Error Types for TwoParamsHandler
 *
 * This uses the Complete Discriminated Union Pattern ensuring:
 * - All error cases are explicitly handled
 * - Type safety through exhaustive checking
 * - Backward compatibility maintained
 */
export type TwoParamsHandlerError =
  | { kind: "InvalidParameterCount"; received: number; expected: number }
  | { kind: "InvalidDemonstrativeType"; value: string; validTypes: string[] }
  | { kind: "InvalidLayerType"; value: string; validTypes: string[] }
  | { kind: "StdinReadError"; error: string }
  | { kind: "FactoryCreationError"; error: string }
  | { kind: "FactoryValidationError"; errors: string[] }
  | { kind: "VariablesBuilderError"; errors: string[] }
  | { kind: "PromptGenerationError"; error: string }
  | { kind: "OutputWriteError"; error: string; cause?: unknown };

/**
 * Internal orchestrator for two params processing
 * This class encapsulates the orchestration logic while keeping it internal
 */
class TwoParamsOrchestrator {
  private readonly validator: TwoParamsValidator;
  private readonly stdinProcessor: TwoParamsStdinProcessor;
  private readonly variableProcessor: TwoParamsVariableProcessor;
  private readonly promptGenerator: TwoParamsPromptGenerator;
  private readonly outputProcessor: TwoParamsOutputProcessor;

  constructor(outputProcessor?: TwoParamsOutputProcessor) {
    // Initialize all components using composition pattern
    this.validator = new TwoParamsValidator();
    this.stdinProcessor = new TwoParamsStdinProcessor();
    this.variableProcessor = new TwoParamsVariableProcessor();
    this.promptGenerator = new TwoParamsPromptGenerator();
    this.outputProcessor = outputProcessor || new TwoParamsOutputProcessor();
  }

  /**
   * Execute the orchestrated flow
   */
  async execute(
    params: string[],
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<Result<void, TwoParamsHandlerError>> {
    // 1. Validate parameters
    const validationResult = await this.validator.validate(params);
    if (!validationResult.ok) {
      return error(this.mapValidationError(validationResult.error));
    }

    // 2. Read STDIN
    const stdinResult = await this.stdinProcessor.process(
      config as BreakdownConfigCompatible,
      options,
    );
    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message,
      });
    }

    // 3. Process variables
    const variablesResult = this.variableProcessor.processVariables(
      options,
      stdinResult.data,
    );
    if (!variablesResult.ok) {
      return error({
        kind: "VariablesBuilderError",
        errors: variablesResult.error.map((e) => {
          switch (e.kind) {
            case "InvalidVariablePrefix":
            case "ReservedVariableName":
            case "EmptyVariableValue":
              return `${e.kind}: ${e.key}`;
            case "InvalidOptions":
              return `${e.kind}: ${e.message}`;
            default:
              return String(e);
          }
        }),
      });
    }

    // 4. Generate prompt
    const promptResult = await this.promptGenerator.generatePrompt(
      config,
      {
        demonstrativeType: validationResult.data.demonstrativeType,
        layerType: validationResult.data.layerType,
      },
      options,
      variablesResult.data,
    );
    if (!promptResult.ok) {
      return error(this.mapPromptError(promptResult.error));
    }

    // 5. Write output using processor
    const writeResult = await this.outputProcessor.writeOutput(promptResult.data);
    if (!writeResult.ok) {
      return error(writeResult.error);
    }

    return ok(undefined);
  }

  /**
   * Type guard for InvalidParameterCount error
   */
  private isInvalidParameterCountError(
    error: unknown,
  ): error is Extract<TwoParamsHandlerError, { kind: "InvalidParameterCount" }> {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "InvalidParameterCount" &&
      "received" in error &&
      "expected" in error &&
      typeof (error as { received: unknown }).received === "number" &&
      typeof (error as { expected: unknown }).expected === "number"
    );
  }

  /**
   * Type guard for InvalidDemonstrativeType error
   */
  private isInvalidDemonstrativeTypeError(
    error: unknown,
  ): error is Extract<TwoParamsHandlerError, { kind: "InvalidDemonstrativeType" }> {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "InvalidDemonstrativeType" &&
      "value" in error &&
      "validTypes" in error &&
      typeof (error as { value: unknown }).value === "string" &&
      Array.isArray((error as { validTypes: unknown }).validTypes)
    );
  }

  /**
   * Type guard for InvalidLayerType error
   */
  private isInvalidLayerTypeError(
    error: unknown,
  ): error is Extract<TwoParamsHandlerError, { kind: "InvalidLayerType" }> {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "InvalidLayerType" &&
      "value" in error &&
      "validTypes" in error &&
      typeof (error as { value: unknown }).value === "string" &&
      Array.isArray((error as { validTypes: unknown }).validTypes)
    );
  }

  /**
   * Map validation errors to handler errors using type guards
   */
  private mapValidationError(error: unknown): TwoParamsHandlerError {
    // Check for specific error types using type guards
    if (this.isInvalidParameterCountError(error)) {
      return {
        kind: "InvalidParameterCount",
        received: error.received,
        expected: error.expected,
      };
    }

    if (this.isInvalidDemonstrativeTypeError(error)) {
      return {
        kind: "InvalidDemonstrativeType",
        value: error.value,
        validTypes: error.validTypes,
      };
    }

    if (this.isInvalidLayerTypeError(error)) {
      return {
        kind: "InvalidLayerType",
        value: error.value,
        validTypes: error.validTypes,
      };
    }

    // Default case - unknown validation error
    return {
      kind: "FactoryValidationError",
      errors: [String(error)],
    };
  }

  /**
   * Type guard for FactoryValidationError
   */
  private isFactoryValidationError(
    error: unknown,
  ): error is { kind: "FactoryValidationError"; errors?: string[]; message?: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "FactoryValidationError"
    );
  }

  /**
   * Type guard for errors with message property
   */
  private hasMessageProperty(
    error: unknown,
  ): error is { message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    );
  }

  /**
   * Map prompt generation errors to handler errors using type guards
   */
  private mapPromptError(error: unknown): TwoParamsHandlerError {
    // Check if it's a FactoryValidationError
    if (this.isFactoryValidationError(error)) {
      const errors: string[] = [];

      // Safely extract errors array
      if ("errors" in error && Array.isArray(error.errors)) {
        errors.push(...error.errors);
      } else if ("message" in error && typeof error.message === "string") {
        errors.push(error.message);
      } else {
        errors.push(String(error));
      }

      return {
        kind: "FactoryValidationError",
        errors,
      };
    }

    // Extract error message safely
    let errorMessage: string;
    if (this.hasMessageProperty(error)) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    return {
      kind: "PromptGenerationError",
      error: errorMessage,
    };
  }
}

// Static instance for reuse (optimization for performance)
let orchestratorInstance: TwoParamsOrchestrator | null = null;

/**
 * Two Params Handler - Main entry point function
 *
 * This is the main handler function expected by architecture tests.
 * Uses orchestration pattern internally for better maintainability.
 *
 * @param params - Command line parameters from BreakdownParams
 * @param config - Configuration object from BreakdownConfig
 * @param options - Parsed options from BreakdownParams
 * @returns Result with void on success or TwoParamsHandlerError on failure
 */
export async function twoParamsHandler(
  params: string[],
  config: Record<string, unknown>,
  options: Record<string, unknown> = {},
): Promise<Result<void, TwoParamsHandlerError>> {
  // Create orchestrator instance if not exists (singleton pattern for efficiency)
  if (!orchestratorInstance) {
    orchestratorInstance = new TwoParamsOrchestrator();
  }

  // Delegate to orchestrator
  return await orchestratorInstance.execute(params, config, options);
}

/**
 * Handle two parameters case (alias for backward compatibility)
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
  return await twoParamsHandler(params, config, options);
}
