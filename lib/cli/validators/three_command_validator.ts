/**
 * ThreeCommandValidator
 *
 * Strategy for validating CLI parameters for three-word commands (e.g. find bugs).
 * Implements the validation rules for the new "breakdown find bugs" command pattern.
 *
 * @param params: { demonstrativeType: "find", subCommand: "bugs", layerType?, options: {...}, stdinAvailable?: boolean }
 */

import type { CommandValidatorStrategy } from "./base_validator.ts";
import type { DoubleParamValidationResult } from "./double_command_validator.ts";
import {
  DoubleParamValidationErrorCode,
  DoubleParamValidationStep,
} from "./double_command_validator.ts";
import { resolve } from "@std/path";

/**
 * Interface for three-word command parameters.
 * Represents the result structure for three-word commands like "breakdown find bugs".
 */
export interface ThreeParamsResult {
  /** Command type indicator */
  type: "three";
  /** First command word (e.g., "find") */
  demonstrativeType: "find";
  /** Second command word (e.g., "bugs") */
  subCommand: "bugs";
  /** Optional layer type for target specification */
  layerType?: string;
  /** Command line options and custom variables */
  options: Record<string, unknown>;
  /** Whether stdin is available for input */
  stdinAvailable?: boolean;
}

/**
 * Strategy for validating CLI parameters for three-word commands.
 * Currently supports the "find bugs" command pattern.
 */
export class ThreeCommandValidator implements CommandValidatorStrategy {
  /**
   * Validates CLI parameters for three-word commands.
   *
   * @param params The parameters to validate (ThreeParamsResult structure)
   * @returns DoubleParamValidationResult with success/failure and error details
   */
  validate(params: unknown): DoubleParamValidationResult {
    let step = DoubleParamValidationStep.START;
    const values: DoubleParamValidationResult["values"] = {};

    // Validate basic structure
    if (
      !params || typeof params !== "object" ||
      !("demonstrativeType" in params) || !("subCommand" in params)
    ) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.UNKNOWN,
        errorMessage: "Invalid three-word command parameters.",
        values,
      };
    }

    const {
      demonstrativeType,
      subCommand,
      layerType,
      options = {},
      stdinAvailable,
    } = params as ThreeParamsResult;

    // Validate command pattern: only "find bugs" is supported
    if (demonstrativeType !== "find" || subCommand !== "bugs") {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.UNKNOWN,
        errorMessage: `Unsupported three-word command: ${demonstrativeType} ${subCommand}`,
        values,
      };
    }

    values.command = `${demonstrativeType} ${subCommand}`;

    // Extract options
    const {
      from,
      destination,
      input,
      adaptation,
      promptDir,
      config,
    } = options as Record<string, unknown>;

    // Check FROM option
    step = DoubleParamValidationStep.CHECK_FROM;
    if (from && typeof from === "string") {
      if (from !== "-") {
        try {
          const resolvedPath = from.startsWith("/") ? from : resolve(Deno.cwd(), from);
          const fileInfo = Deno.statSync(resolvedPath);
          if (!fileInfo.isFile) {
            return {
              success: false,
              step,
              errorCode: DoubleParamValidationErrorCode.FILE_NOT_FOUND,
              errorMessage: `Input path is not a file: ${resolvedPath}`,
              values,
            };
          }
          values.from = from;
        } catch (_e) {
          return {
            success: false,
            step,
            errorCode: DoubleParamValidationErrorCode.FILE_NOT_FOUND,
            errorMessage: `Input file not found: ${from}`,
            values,
          };
        }
      } else {
        // from === "-" means stdin
        values.from = from;
      }
    }

    // Check STDIN availability
    step = DoubleParamValidationStep.CHECK_STDIN;
    values.stdinAvailable = stdinAvailable || false;

    // Check INPUT option conflicts
    step = DoubleParamValidationStep.CHECK_INPUT;
    if (input && typeof input === "string") {
      if (from) {
        return {
          success: false,
          step,
          errorCode: DoubleParamValidationErrorCode.CONFLICTING_OPTIONS,
          errorMessage: "Cannot use --from and --input together for find bugs command",
          values,
        };
      }
      values.input = input;
    }

    // Input validation: require either --from or --input or stdin
    const hasFromOption = from && typeof from === "string";
    const hasInputOption = input && typeof input === "string";
    const hasStdinInput = stdinAvailable && !hasFromOption && !hasInputOption;

    if (!hasFromOption && !hasInputOption && !hasStdinInput) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.MISSING_INPUT,
        errorMessage:
          "find bugs command requires input via --from option, --input option, or stdin",
        values,
      };
    }

    // Check DESTINATION option
    step = DoubleParamValidationStep.CHECK_DESTINATION;
    if (hasFromOption && from !== "-" && !destination) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.MISSING_DESTINATION,
        errorMessage: "find bugs command with --from requires --destination option",
        values,
      };
    }

    if (destination && typeof destination === "string") {
      values.destination = destination;
    }

    // Store additional options
    if (adaptation && typeof adaptation === "string") {
      values.adaptation = adaptation;
    }
    if (promptDir && typeof promptDir === "string") {
      values.promptDir = promptDir;
    }
    if (config && typeof config === "string") {
      values.config = config;
    }

    // Store layer type if provided
    if (layerType && typeof layerType === "string") {
      // For find bugs, layerType is optional and can be used for targeting specific code layers
      values.input = layerType;
    }

    step = DoubleParamValidationStep.COMPLETE;
    return {
      success: true,
      step,
      values,
    };
  }
}
