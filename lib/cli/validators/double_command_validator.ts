/**
 * DoubleCommandValidator
 *
 * Strategy for validating CLI parameters for double commands (e.g. to, summary, defect).
 * Implements the validation rules described in docs/breakdown/options.ja.md.
 *
 * @param params: { demonstrativeType, layerType, options: {...}, stdinAvailable?: boolean }
 */

import type { CommandValidatorStrategy } from "./base_validator.ts";
import { resolve } from "@std/path";

/**
 * Enum representing each stage of the double param validation flow.
 * Used to indicate how far validation progressed and where errors occurred.
 */
export enum DoubleParamValidationStep {
  START = "START",
  CHECK_FROM = "CHECK_FROM",
  CHECK_STDIN = "CHECK_STDIN",
  CHECK_INPUT = "CHECK_INPUT",
  CHECK_DESTINATION = "CHECK_DESTINATION",
  COMPLETE = "COMPLETE",
}

/**
 * Enum for error codes corresponding to specific error points in the double param validation flowchart.
 * Enables mapping errors to validation steps for precise diagnostics.
 */
export enum DoubleParamValidationErrorCode {
  MISSING_INPUT = "MISSING_INPUT", // No --from and no stdin
  FILE_NOT_FOUND = "FILE_NOT_FOUND", // --from file does not exist
  INVALID_INPUT_TYPE = "INVALID_INPUT_TYPE", // --input value invalid
  CONFLICTING_OPTIONS = "CONFLICTING_OPTIONS", // --from and --input both specified
  MISSING_DESTINATION = "MISSING_DESTINATION", // --from specified but no --destination
  UNKNOWN = "UNKNOWN", // fallback for unexpected errors
}

/**
 * Result object for double param validation.
 * Indicates success/failure, validation step, error details, and all relevant parameter values.
 * Used for both error reporting and downstream processing.
 */
export interface DoubleParamValidationResult {
  /** Whether validation succeeded (true) or failed (false) */
  success: boolean;
  /** The last validation step reached (see DoubleParamValidationStep) */
  step: DoubleParamValidationStep;
  /** Error code if validation failed (see DoubleParamValidationErrorCode) */
  errorCode?: DoubleParamValidationErrorCode;
  /** Human-readable error message if validation failed */
  errorMessage?: string;
  /** All relevant parameter values (from, input, destination, etc.) */
  values: {
    from?: string;
    stdinAvailable?: boolean;
    input?: string;
    destination?: string;
    adaptation?: string;
    promptDir?: string;
    command?: string;
    // Add other relevant fields as needed
  };
}

export class DoubleCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): DoubleParamValidationResult {
    let step = DoubleParamValidationStep.START;
    const values: DoubleParamValidationResult["values"] = {};

    // params: { demonstrativeType, layerType, options: { from, destination, input, adaptation, promptDir }, stdinAvailable? }
    if (
      !params || typeof params !== "object" || !("demonstrativeType" in params) ||
      !("layerType" in params)
    ) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.UNKNOWN,
        errorMessage: "Invalid double command parameters.",
        values,
      };
    }
    const {
      demonstrativeType: _demonstrativeType,
      layerType: _layerType,
      options = {},
      stdinAvailable,
    } = params as Record<
      string,
      unknown
    >;
    const { from, destination, input, adaptation, promptDir } = options as Record<string, unknown>;
    const fromStr = from as string | undefined;
    const destinationStr = destination as string | undefined;
    const inputStr = input as string | undefined;
    const adaptationStr = adaptation as string | undefined;
    const promptDirStr = promptDir as string | undefined;

    values.from = fromStr;
    values.stdinAvailable = !!stdinAvailable;
    values.input = inputStr;
    values.destination = destinationStr;
    values.adaptation = adaptationStr;
    values.promptDir = promptDirStr;

    // --fromと--inputは同時指定不可
    step = DoubleParamValidationStep.CHECK_FROM;
    if (fromStr && inputStr) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.CONFLICTING_OPTIONS,
        errorMessage: "Cannot use --from and --input together",
        values,
      };
    }
    // --from指定時はファイル存在チェック（destination必須チェックより先）
    if (fromStr) {
      // 絶対パス化（CLI本体と同じ挙動に合わせる）
      const absFromPath = fromStr.startsWith("/") ? fromStr : resolve(Deno.cwd(), fromStr);
      values.from = absFromPath;
      try {
        Deno.statSync(absFromPath);
      } catch (_e) {
        return {
          success: false,
          step,
          errorCode: DoubleParamValidationErrorCode.FILE_NOT_FOUND,
          errorMessage: `No such file: ${absFromPath}`,
          values,
        };
      }
    }
    // --from指定時は--destination必須
    step = DoubleParamValidationStep.CHECK_DESTINATION;
    if (fromStr && !destinationStr) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.MISSING_DESTINATION,
        errorMessage: "Invalid input parameters: missing --destination for --from",
        values,
      };
    }
    // --fromまたは--inputまたはSTDINのいずれかは必須
    step = DoubleParamValidationStep.CHECK_STDIN;
    if (!fromStr && !inputStr && !stdinAvailable) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.MISSING_INPUT,
        errorMessage: "Invalid input parameters: missing --from, --input, or STDIN",
        values,
      };
    }
    // --input指定時は型チェック
    step = DoubleParamValidationStep.CHECK_INPUT;
    if (inputStr && !["project", "issue", "task"].includes(inputStr)) {
      return {
        success: false,
        step,
        errorCode: DoubleParamValidationErrorCode.INVALID_INPUT_TYPE,
        errorMessage: `Invalid input layer type: ${inputStr}`,
        values,
      };
    }
    // 進行完了
    step = DoubleParamValidationStep.COMPLETE;
    return {
      success: true,
      step,
      values,
    };
  }
}
