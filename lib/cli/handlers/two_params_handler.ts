/**
 * @fileoverview Two Params Handler with internal orchestration
 *
 * This module handles the main breakdown functionality when two parameters
 * are provided (directive type + layer type), using internal orchestration
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
import { TwoParamsPromptGenerator } from "../generators/two_params_prompt_generator_ddd.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
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
  | { kind: "InvalidDirectiveType"; value: string; validTypes: string[] }
  | { kind: "InvalidLayerType"; value: string; validTypes: string[] }
  | { kind: "StdinReadError"; error: string }
  | { kind: "FactoryCreationError"; error: string }
  | { kind: "FactoryValidationError"; errors: string[] }
  | { kind: "VariablesBuilderError"; errors: string[] }
  | { kind: "PromptGenerationError"; error: string }
  | {
    kind: "OutputWriteError";
    message: string;
    cause?: unknown;
    context?: Record<string, unknown>;
  };

/**
 * Internal orchestrator for two params processing
 * This class encapsulates the orchestration logic while keeping it internal
 */
class TwoParamsOrchestrator {
  private readonly stdinProcessor: TwoParamsStdinProcessor;
  private readonly variableProcessor: TwoParamsVariableProcessor;
  private readonly promptGenerator: TwoParamsPromptGenerator;
  private readonly outputProcessor: TwoParamsOutputProcessor;

  constructor(_config?: Record<string, unknown>, outputProcessor?: TwoParamsOutputProcessor) {
    // Initialize all components using composition pattern
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
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log("[TwoParamsOrchestrator] Starting execution with:", {
        params,
        config: Object.keys(config),
        options: Object.keys(options),
      });
    }
    // 1. Basic parameter count validation only
    // ParamsParser already validated the directive and layer types
    if (!params || params.length !== 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params?.length ?? 0,
        expected: 2,
      });
    }

    // Extract directive and layer from params
    const [directiveStr, layerStr] = params;
    const validatedParams = {
      directive: { value: directiveStr },
      layer: { value: layerStr },
      directiveType: { value: directiveStr },
      layerType: { value: layerStr },
      params: [directiveStr, layerStr],
    };

    // 2. Read STDIN
    if (isDebug) {
      console.log("[TwoParamsOrchestrator → TwoParamsStdinProcessor] Passing:", {
        config: Object.keys(config),
        options: Object.keys(options),
      });
    }
    const stdinResult = await this.stdinProcessor.process(
      config as BreakdownConfigCompatible,
      options,
    );
    if (isDebug) {
      console.log("[TwoParamsStdinProcessor] Returning:", JSON.stringify(stdinResult, null, 2));
    }

    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message,
      });
    }

    // Extract stdin content (TwoParamsStdinProcessor returns string directly)
    const stdinContent = stdinResult.data;

    // 3. Process variables
    if (isDebug) {
      console.log("[TwoParamsStdinProcessor → TwoParamsVariableProcessor] Passing:", {
        options: Object.keys(options),
        stdinState: stdinResult.data,
        stdinContent: stdinContent ? "(has content)" : "(empty/not provided)",
      });
    }
    const variablesResult = this.variableProcessor.processVariables(
      options,
      stdinContent,
    );
    if (isDebug) {
      console.log(
        "[TwoParamsVariableProcessor] Returning:",
        JSON.stringify(variablesResult, null, 2),
      );
    }
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

    // 4. Generate prompt with validated parameters
    if (isDebug) {
      console.log("[TwoParamsVariableProcessor → TwoParamsPromptGenerator] Passing:", {
        config: Object.keys(config),
        validatedParams: validatedParams,
        options: Object.keys(options),
        processedVariables: Object.keys(variablesResult.data),
      });
    }
    const promptResult = await this.promptGenerator.generatePrompt(
      config,
      validatedParams,
      options,
      variablesResult.data,
    );
    if (isDebug) {
      console.log("[TwoParamsPromptGenerator] Returning:", {
        ok: promptResult.ok,
        dataLength: promptResult.ok ? promptResult.data.length : 0,
        error: !promptResult.ok ? promptResult.error : undefined,
      });
    }
    if (!promptResult.ok) {
      return error(this.mapPromptError(promptResult.error));
    }

    // 5. Write output using processor
    if (isDebug) {
      console.log("[TwoParamsPromptGenerator → TwoParamsOutputProcessor] Passing:", {
        promptLength: promptResult.data.length,
      });
    }
    const writeResult = await this.outputProcessor.writeOutput(promptResult.data);
    if (isDebug) {
      console.log("[TwoParamsOutputProcessor] Returning:", JSON.stringify(writeResult, null, 2));
    }
    if (!writeResult.ok) {
      return error(this.mapOutputError(writeResult.error));
    }

    if (isDebug) {
      console.log("[TwoParamsOrchestrator] Execution completed successfully");
    }
    return ok(undefined);
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
   * Type guard for errors with error property
   */
  private hasErrorProperty(
    error: unknown,
  ): error is { error: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      typeof (error as { error: unknown }).error === "string"
    );
  }

  /**
   * Type guard for errors with details property
   */
  private hasDetailsProperty(
    error: unknown,
  ): error is { details: unknown } {
    return (
      typeof error === "object" &&
      error !== null &&
      "details" in error
    );
  }

  /**
   * Type guard for errors with kind and message properties
   */
  private hasKindAndMessage(
    error: unknown,
  ): error is { kind: string; message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      "message" in error &&
      typeof (error as { kind: unknown; message: unknown }).kind === "string" &&
      typeof (error as { kind: unknown; message: unknown }).message === "string"
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

    // Extract error message safely with better object handling
    let errorMessage: string;
    if (this.hasMessageProperty(error)) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      // Handle object errors more gracefully
      // Try to extract meaningful information from the object
      if (this.hasErrorProperty(error)) {
        errorMessage = error.error;
      } else if (this.hasDetailsProperty(error)) {
        errorMessage = `Error details: ${JSON.stringify(error.details)}`;
      } else if (this.hasKindAndMessage(error)) {
        errorMessage = `${error.kind}: ${error.message}`;
      } else {
        // Last resort: stringify the object for debugging
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = "Complex error object (failed to stringify)";
        }
      }
    } else {
      errorMessage = String(error);
    }

    return {
      kind: "PromptGenerationError",
      error: errorMessage,
    };
  }

  /**
   * Map output processor errors to handler errors
   */
  private mapOutputError(
    error: import("../processors/two_params_output_processor.ts").TwoParamsOutputError,
  ): TwoParamsHandlerError {
    return {
      kind: "OutputWriteError",
      message: error.message,
      cause: ("cause" in error) ? error.cause : undefined,
      context: error.context,
    };
  }
}

/**
 * Two Params Handler - Main entry point function
 *
 * This is the main handler function expected by architecture tests.
 * Uses orchestration pattern internally for better maintainability.
 * Provides strong type safety through Result types and exhaustive error handling.
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
  // Validate params array is not null/undefined
  if (!Array.isArray(params)) {
    return error({
      kind: "InvalidParameterCount",
      received: 0,
      expected: 2,
    });
  }

  // Create orchestrator instance for each call to ensure fresh config
  const orchestrator = new TwoParamsOrchestrator(config);

  // Delegate to orchestrator with type-safe parameters
  return await orchestrator.execute(params, config, options);
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
  const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
  if (isDebug) {
    console.log("[handleTwoParams] Received options:", JSON.stringify(options, null, 2));
    console.log(
      "[handleTwoParams] --edition parameter present:",
      "edition" in options ? `Yes, value: "${options.edition}"` : "No",
    );
    console.log("[handleTwoParams] All option keys:", Object.keys(options).join(", "));
  }
  return await twoParamsHandler(params, config, options);
}
