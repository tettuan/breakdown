/**
 * @fileoverview Two Params Handler following Totality Principle
 *
 * This module handles the main breakdown functionality when two parameters
 * are provided (demonstrative type + layer type), managing STDIN processing,
 * prompt generation, and output using Result type and VariablesBuilder.
 *
 * Key Totality improvements:
 * - Uses Result type instead of exceptions
 * - Eliminates type assertions through proper validation
 * - Integrates VariablesBuilder for variable management
 * - Follows Totality principle throughout
 *
 * @module lib/cli/handlers/two_params_handler
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { isStdinAvailable, readStdin } from "$lib/io/stdin.ts";
import {
  type BreakdownConfigCompatible,
  createTimeoutManagerFromConfig,
} from "$lib/config/timeout_manager.ts";
import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.2.3";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import type { PromptCliParams } from "$lib/types/mod.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "$lib/builder/variables_builder.ts";
import { type DemonstrativeType, DemonstrativeTypeFactory } from "$lib/types/mod.ts";

/**
 * Error types for TwoParamsHandler
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
 * Valid demonstrative types (should match actual enum values)
 */
const _VALID_DEMONSTRATIVE_TYPES = [
  "to",
  "summary",
  "defect",
  "init",
  "find",
] as const;

/**
 * Valid layer types (should match actual enum values)
 */
const VALID_LAYER_TYPES = [
  "project",
  "issue",
  "task",
  "bugs",
  "temp",
] as const;

/**
 * Validate demonstrative type without type assertion
 */
function validateDemonstrativeType(
  value: string,
): Result<DemonstrativeType, TwoParamsHandlerError> {
  if (_VALID_DEMONSTRATIVE_TYPES.includes(value as any)) {
    // Create the proper DemonstrativeType object
    const demonstrativeType = DemonstrativeTypeFactory.fromString(value);
    if (demonstrativeType) {
      return ok(demonstrativeType);
    }
  }

  return error({
    kind: "InvalidDemonstrativeType",
    value,
    validTypes: [..._VALID_DEMONSTRATIVE_TYPES],
  });
}

/**
 * Validate layer type without type assertion
 */
function validateLayerType(value: string): Result<string, TwoParamsHandlerError> {
  if (VALID_LAYER_TYPES.includes(value as typeof VALID_LAYER_TYPES[number])) {
    return ok(value);
  }

  return error({
    kind: "InvalidLayerType",
    value,
    validTypes: [...VALID_LAYER_TYPES],
  });
}

/**
 * Read STDIN with Result type error handling
 */
async function readStdinSafely(
  config: BreakdownConfigCompatible,
  options: Record<string, unknown>,
): Promise<Result<string, TwoParamsHandlerError>> {
  try {
    const timeoutManager = createTimeoutManagerFromConfig(config);

    // Check if fromFile option specifies stdin ("-")
    if (options.from === "-" || options.fromFile === "-") {
      const inputText = await readStdin({ timeoutManager });
      return ok(inputText);
    } else if (isStdinAvailable()) {
      const inputText = await readStdin({ timeoutManager });
      return ok(inputText);
    }

    return ok(""); // No stdin available, return empty string
  } catch (err) {
    return error({
      kind: "StdinReadError",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Extract custom variables from options
 */
function extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
  const customVariables: Record<string, string> = {};

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith("uv-")) {
      customVariables[key] = String(value);
    }
  }

  return customVariables;
}

/**
 * Create PromptCliParams from validated inputs
 */
function createCliParams(
  demonstrativeType: DemonstrativeType,
  layerType: string,
  options: Record<string, unknown>,
  inputText: string,
  customVariables: Record<string, string>,
): PromptCliParams {
  return {
    demonstrativeType: typeof demonstrativeType === "string"
      ? demonstrativeType
      : demonstrativeType.value,
    layerType,
    options: {
      fromFile: (options.from as string) || (options.fromFile as string),
      destinationFile: (options.destination as string) || (options.output as string) || "output.md",
      adaptation: options.adaptation as string,
      promptDir: options.promptDir as string,
      fromLayerType: options.input as string,
      input_text: inputText,
      customVariables,
      extended: options.extended as boolean,
      customValidation: options.customValidation as boolean,
      errorFormat: options.errorFormat as "simple" | "detailed" | "json" | undefined,
      config: options.config as string,
    },
  };
}

/**
 * Process prompt generation with VariablesBuilder
 */
async function processPromptGeneration(
  factory: PromptVariablesFactory,
  inputText: string,
  customVariables: Record<string, string>,
): Promise<Result<string, TwoParamsHandlerError>> {
  // Validate factory parameters
  try {
    factory.validateAll();
  } catch (err) {
    return error({
      kind: "FactoryValidationError",
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }

  // Get resolved parameters from factory
  const allParams = factory.getAllParams();

  // Create factory values for VariablesBuilder
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: allParams.promptFilePath,
    inputFilePath: allParams.inputFilePath || "",
    outputFilePath: allParams.outputFilePath || "output.md",
    schemaFilePath: allParams.schemaFilePath || "",
    customVariables,
    inputText: inputText || undefined,
  };

  // Use VariablesBuilder to construct variables
  const builder = new VariablesBuilder();
  const validationResult = builder.validateFactoryValues(factoryValues);

  if (!validationResult.ok) {
    return error({
      kind: "VariablesBuilderError",
      errors: validationResult.error.map((e) => JSON.stringify(e)),
    });
  }

  builder.addFromFactoryValues(factoryValues);
  const buildResult = builder.build();

  if (!buildResult.ok) {
    return error({
      kind: "VariablesBuilderError",
      errors: buildResult.error.map((e) => JSON.stringify(e)),
    });
  }

  // Convert to record for PromptManager
  const variablesRecord = builder.toRecord();

  // Generate prompt using PromptManager
  try {
    const promptManager = new PromptManager();
    const result = await promptManager.generatePrompt(
      allParams.promptFilePath,
      variablesRecord,
    );

    // Extract content from result
    let content: string;
    if (result && typeof result === "object" && "success" in result) {
      const res = result as { success: boolean; content?: string; error?: string };
      if (res.success) {
        content = res.content || "";
      } else {
        return error({
          kind: "PromptGenerationError",
          error: res.error || "Prompt generation failed",
        });
      }
    } else {
      content = String(result);
    }

    return ok(content);
  } catch (err) {
    return error({
      kind: "PromptGenerationError",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Write output with Result type error handling
 */
async function writeOutput(content: string): Promise<Result<void, TwoParamsHandlerError>> {
  try {
    await Deno.stdout.write(new TextEncoder().encode(content));
    return ok(undefined);
  } catch (err) {
    return error({
      kind: "OutputWriteError",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Handle two parameters case with Totality principle
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
  // 1. Validate parameter count
  if (params.length < 2) {
    return error({
      kind: "InvalidParameterCount",
      received: params.length,
      expected: 2,
    });
  }

  // 2. Validate demonstrative type and layer type
  const [demonstrativeTypeStr, layerTypeStr] = params;

  const demonstrativeTypeResult = validateDemonstrativeType(demonstrativeTypeStr);
  if (!demonstrativeTypeResult.ok) {
    return error(demonstrativeTypeResult.error);
  }

  const layerTypeResult = validateLayerType(layerTypeStr);
  if (!layerTypeResult.ok) {
    return error(layerTypeResult.error);
  }

  // 3. Read STDIN safely
  const stdinResult = await readStdinSafely(config as BreakdownConfigCompatible, options);
  if (!stdinResult.ok) {
    return error(stdinResult.error);
  }

  // 4. Extract custom variables
  const customVariables = extractCustomVariables(options);

  // Add standard variables to custom variables
  if (stdinResult.ok && stdinResult.data) {
    customVariables.input_text = stdinResult.data;
  }
  customVariables.input_text_file = (options.fromFile as string) || "stdin";
  customVariables.destination_path = (options.destinationFile as string) ||
    (options.output as string) || "stdout";

  // 5. Create CLI parameters
  const cliParams = createCliParams(
    demonstrativeTypeResult.data,
    layerTypeResult.data,
    options,
    stdinResult.data,
    customVariables,
  );

  // 6. Create factory and process prompt generation
  try {
    const factoryResult = await PromptVariablesFactory.create(cliParams);

    if (!factoryResult.ok) {
      return error({
        kind: "FactoryValidationError",
        errors: [`Failed to create factory: ${factoryResult.error}`],
      });
    }

    const factory = factoryResult.data;

    const contentResult = await processPromptGeneration(
      factory,
      stdinResult.data,
      customVariables,
    );

    if (!contentResult.ok) {
      return error(contentResult.error);
    }

    // 7. Write output
    const outputResult = await writeOutput(contentResult.data);
    if (!outputResult.ok) {
      return error(outputResult.error);
    }

    return ok(undefined);
  } catch (err) {
    return error({
      kind: "FactoryValidationError",
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }
}
