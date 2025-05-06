/**
 * DoubleCommandValidator
 *
 * Strategy for validating CLI parameters for double commands (e.g. to, summary, defect).
 * Implements the validation rules described in docs/breakdown/options.ja.md.
 *
 * @param params: { demonstrativeType, layerType, options: {...}, stdinAvailable?: boolean }
 */

import type { CommandOptions } from "../args.ts";
import type { CommandValidatorStrategy } from "./base_validator.ts";
import { CliError, CliErrorCode } from "../errors.ts";

export class DoubleCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): CommandOptions {
    // params: { demonstrativeType, layerType, options: { from, destination, input, adaptation, promptDir }, stdinAvailable? }
    if (
      !params || typeof params !== "object" || !("demonstrativeType" in params) ||
      !("layerType" in params)
    ) {
      throw new CliError(
        CliErrorCode.INVALID_OPTION,
        "Invalid double command parameters.",
      );
    }
    const { demonstrativeType, layerType, options = {}, stdinAvailable } = params as Record<
      string,
      unknown
    >;
    const { from, destination, input, adaptation, promptDir } = options as Record<string, unknown>;
    const fromStr = from as string | undefined;
    const destinationStr = destination as string | undefined;
    const inputStr = input as string | undefined;
    const adaptationStr = adaptation as string | undefined;
    const promptDirStr = promptDir as string | undefined;

    // --fromと--inputは同時指定不可
    if (fromStr && inputStr) {
      throw new CliError(
        CliErrorCode.CONFLICTING_OPTIONS,
        "Cannot use --from and --input together",
      );
    }
    // --fromまたは--inputまたはSTDINのいずれかは必須
    if (!fromStr && !inputStr && !stdinAvailable) {
      throw new CliError(
        CliErrorCode.MISSING_REQUIRED,
        "Invalid input parameters: missing --from, --input, or STDIN",
      );
    }
    // --from指定時は--destination必須
    if (fromStr && !destinationStr) {
      throw new CliError(
        CliErrorCode.MISSING_REQUIRED,
        "Invalid input parameters: missing --destination for --from",
      );
    }
    // --input指定時は型チェック
    if (inputStr && !["project", "issue", "task"].includes(inputStr)) {
      throw new CliError(
        CliErrorCode.INVALID_INPUT_TYPE,
        `Invalid input layer type: ${inputStr}`,
      );
    }
    // 重複・その他のバリデーションは呼び出し元で行う前提
    return {
      demonstrative: demonstrativeType as string | undefined,
      layer: layerType as string | undefined,
      from: fromStr,
      destination: destinationStr,
      input: inputStr,
      adaptation: adaptationStr,
      promptDir: promptDirStr,
    };
  }
}
