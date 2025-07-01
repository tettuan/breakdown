/**
 * @fileoverview TwoParamsOrchestrator - Orchestrates two params processing with Totality principle
 * 
 * This module serves as the orchestrator for handleTwoParams functionality,
 * coordinating all specialized components while maintaining single responsibility.
 * It replaces the monolithic handleTwoParams function with a clean separation of concerns.
 * 
 * @module cli/handlers/two_params_orchestrator
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import { TwoParamsVariableProcessor } from "../processors/two_params_variable_processor.ts";
import { TwoParamsPromptGenerator } from "../generators/two_params_prompt_generator.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
import type { BreakdownConfigCompatible } from "../../config/timeout_manager.ts";
import type { DemonstrativeType, LayerType } from "../../types/mod.ts";
import type { ValidatedParams } from "../generators/two_params_prompt_generator.ts";

/**
 * Orchestrator error types - combines all component errors
 */
export type OrchestratorError =
  | { kind: "InvalidParameterCount"; received: number; expected: number }
  | { kind: "InvalidDemonstrativeType"; value: string }
  | { kind: "InvalidLayerType"; value: string }
  | { kind: "StdinReadError"; error: string }
  | { kind: "VariableProcessingError"; errors: string[] }
  | { kind: "PromptGenerationError"; error: string }
  | { kind: "OutputWriteError"; error: string };

/**
 * Validated parameters after type checking
 */
interface ValidatedTwoParams {
  demonstrativeType: string;
  layerType: string;
}

/**
 * TwoParamsOrchestrator - Coordinates all components for two params processing
 * 
 * Responsibilities:
 * - Coordinate component execution order
 * - Handle error propagation
 * - Ensure proper data flow between components
 * - Maintain backward compatibility
 */
export class TwoParamsOrchestrator {
  private readonly variableProcessor: TwoParamsVariableProcessor;
  private readonly promptGenerator: TwoParamsPromptGenerator;

  constructor() {
    this.variableProcessor = new TwoParamsVariableProcessor();
    this.promptGenerator = new TwoParamsPromptGenerator();
  }

  /**
   * Validate parameter count
   */
  #validateParameterCount(params: string[] | null): Result<void, OrchestratorError> {
    if (!params || params.length < 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params?.length ?? 0,
        expected: 2
      });
    }
    return ok(undefined);
  }

  /**
   * Extract and validate parameters
   * TODO: Replace with ParameterValidator when implemented
   */
  #extractParameters(params: string[]): ValidatedTwoParams {
    const [demonstrativeType, layerType] = params;
    return { demonstrativeType, layerType };
  }

  /**
   * Convert ValidatedTwoParams to ValidatedParams for the generator
   */
  #convertToValidatedParams(params: ValidatedTwoParams): ValidatedParams {
    return {
      demonstrativeType: params.demonstrativeType as DemonstrativeType,
      layerType: params.layerType
    };
  }

  /**
   * Write output to stdout
   */
  async #writeOutput(content: string): Promise<Result<void, OrchestratorError>> {
    try {
      await Deno.stdout.write(new TextEncoder().encode(content));
      return ok(undefined);
    } catch (err) {
      return error({
        kind: "OutputWriteError",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  /**
   * Orchestrate the entire two params processing flow
   * 
   * @param params - Command line parameters
   * @param config - Configuration object
   * @param options - Command line options
   * @returns Result with void on success or error
   */
  async orchestrate(
    params: string[] | null,
    config: Record<string, unknown>,
    options: Record<string, unknown>
  ): Promise<Result<void, OrchestratorError>> {
    // 1. Validate parameter count
    const countResult = this.#validateParameterCount(params);
    if (!countResult.ok) {
      return error(countResult.error);
    }

    // 2. Extract parameters (TODO: Add validation with ParameterValidator)
    const validatedParams = this.#extractParameters(params!);

    // 3. Read STDIN
    const stdinProcessor = new TwoParamsStdinProcessor();
    const stdinResult = await stdinProcessor.process(
      config as BreakdownConfigCompatible,
      options
    );
    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message
      });
    }

    // 4. Process variables
    const variablesResult = this.variableProcessor.processVariables(
      options,
      stdinResult.data
    );
    if (!variablesResult.ok) {
      return error({
        kind: "VariableProcessingError",
        errors: variablesResult.error.map((e: any) => {
          if (e.kind === "InvalidOptions") {
            return `${e.kind}: ${e.message}`;
          } else if ("key" in e) {
            return `${e.kind}: ${e.key}`;
          }
          return String(e.kind);
        }),
      });
    }

    // 5. Generate prompt
    const convertedParams = this.#convertToValidatedParams(validatedParams);
    const promptResult = await this.promptGenerator.generatePrompt(
      config,
      convertedParams,
      options,
      variablesResult.data
    );
    if (!promptResult.ok) {
      return error({
        kind: "PromptGenerationError",
        error: (() => {
          const err = promptResult.error;
          if (err.kind === "InvalidConfiguration" || err.kind === "FactoryCreationError") {
            return `${err.kind}: ${err.message}`;
          } else if (err.kind === "FactoryValidationError" || err.kind === "VariablesBuilderError") {
            return `${err.kind}: ${err.errors.join(", ")}`;
          } else if (err.kind === "PromptGenerationError") {
            return `${err.kind}: ${err.error}`;
          }
          return String((err as any).kind);
        })()
      });
    }

    // 6. Write output
    return await this.#writeOutput(promptResult.data);
  }
}

/**
 * Backward compatible function that uses the orchestrator
 * This will replace the existing handleTwoParams function
 */
export async function handleTwoParamsWithOrchestrator(
  params: string[] | null,
  config: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<Result<void, OrchestratorError>> {
  const orchestrator = new TwoParamsOrchestrator();
  return await orchestrator.orchestrate(params, config, options);
}