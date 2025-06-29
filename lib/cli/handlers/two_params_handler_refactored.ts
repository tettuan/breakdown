/**
 * @fileoverview Refactored Two Params Handler with internal orchestration
 * 
 * This module maintains the same external interface as the original handler
 * but uses internal orchestration pattern for better separation of concerns.
 * 
 * @module lib/cli/handlers/two_params_handler_refactored
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import type { BreakdownConfigCompatible } from "../../config/timeout_manager.ts";
import { TwoParamsVariableProcessor } from "../processors/two_params_variable_processor.ts";
import { TwoParamsPromptGenerator } from "../generators/two_params_prompt_generator.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
import { TwoParamsValidator } from "../validators/two_params_validator.ts";
import { TwoParamsOutputWriter } from "../writers/two_params_output_writer.ts";

/**
 * Error types for TwoParamsHandler - maintains backward compatibility
 */
export type TwoParamsHandlerError = 
  | { kind: "InvalidParameterCount"; received: number; expected: number }
  | { kind: "InvalidDemonstrativeType"; value: string; validTypes: string[] }
  | { kind: "InvalidLayerType"; value: string; validTypes: string[] }
  | { kind: "StdinReadError"; error: string }
  | { kind: "FactoryValidationError"; errors: string[] }
  | { kind: "VariablesBuilderError"; errors: string[] }
  | { kind: "PromptGenerationError"; error: string }
  | { kind: "OutputWriteError"; error: string };

/**
 * Internal orchestrator for two params processing
 * This class encapsulates the orchestration logic while keeping it internal
 */
class TwoParamsOrchestrator {
  private readonly validator: TwoParamsValidator;
  private readonly stdinProcessor: TwoParamsStdinProcessor;
  private readonly variableProcessor: TwoParamsVariableProcessor;
  private readonly promptGenerator: TwoParamsPromptGenerator;
  private readonly outputWriter: TwoParamsOutputWriter;

  constructor() {
    // Initialize all components
    this.validator = new TwoParamsValidator();
    this.stdinProcessor = new TwoParamsStdinProcessor();
    this.variableProcessor = new TwoParamsVariableProcessor();
    this.promptGenerator = new TwoParamsPromptGenerator();
    this.outputWriter = new TwoParamsOutputWriter();
  }

  /**
   * Execute the orchestrated flow
   */
  async execute(
    params: string[],
    config: Record<string, unknown>,
    options: Record<string, unknown>
  ): Promise<Result<void, TwoParamsHandlerError>> {
    // 1. Validate parameters
    const validationResult = await this.validator.validate(params);
    if (!validationResult.ok) {
      return error(this.mapValidationError(validationResult.error));
    }

    // 2. Read STDIN
    const stdinResult = await this.stdinProcessor.process(
      config as BreakdownConfigCompatible,
      options
    );
    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message
      });
    }

    // 3. Process variables
    const variablesResult = this.variableProcessor.processVariables(
      options,
      stdinResult.data
    );
    if (!variablesResult.ok) {
      return error({
        kind: "VariablesBuilderError",
        errors: variablesResult.error.map(e => `${e.kind}: ${e.key || e.message || ''}`)
      });
    }

    // 4. Generate prompt
    const promptResult = await this.promptGenerator.generatePrompt(
      config,
      validationResult.data,
      options,
      variablesResult.data
    );
    if (!promptResult.ok) {
      return error(this.mapPromptError(promptResult.error));
    }

    // 5. Write output
    const outputResult = await this.outputWriter.write(promptResult.data);
    if (!outputResult.ok) {
      return error({
        kind: "OutputWriteError",
        error: outputResult.error.message
      });
    }

    return ok(undefined);
  }

  /**
   * Map validation errors to handler errors
   */
  private mapValidationError(error: any): TwoParamsHandlerError {
    if (error.kind === "InvalidParameterCount") {
      return error;
    }
    if (error.kind === "InvalidDemonstrativeType" || error.kind === "InvalidLayerType") {
      return error;
    }
    return {
      kind: "FactoryValidationError",
      errors: [String(error)]
    };
  }

  /**
   * Map prompt generation errors to handler errors
   */
  private mapPromptError(error: any): TwoParamsHandlerError {
    if (error.kind === "FactoryValidationError") {
      return {
        kind: "FactoryValidationError",
        errors: error.errors || [error.message]
      };
    }
    return {
      kind: "PromptGenerationError",
      error: error.message || String(error)
    };
  }
}

// Static instance for reuse (optional optimization)
let orchestratorInstance: TwoParamsOrchestrator | null = null;

/**
 * Handle two parameters case with internal orchestration
 * 
 * Maintains the same external interface as the original handleTwoParams
 * but uses orchestration pattern internally for better maintainability.
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
  // Create orchestrator instance if not exists (singleton pattern for efficiency)
  if (!orchestratorInstance) {
    orchestratorInstance = new TwoParamsOrchestrator();
  }

  // Delegate to orchestrator
  return await orchestratorInstance.execute(params, config, options);
}

/**
 * Alternative: Create new orchestrator for each call
 * This approach is cleaner but slightly less efficient
 */
export async function handleTwoParamsClean(
  params: string[],
  config: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<Result<void, TwoParamsHandlerError>> {
  const orchestrator = new TwoParamsOrchestrator();
  return await orchestrator.execute(params, config, options);
}