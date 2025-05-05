import { isAbsolute, join, resolve } from "@std/path";
import { existsSync } from "@std/fs";
import { DEFAULT_PROMPT_BASE_DIR } from "$lib/config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

type DoubleParamsResult = PromptCliParams;

/**
 * PromptTemplatePathResolver
 *
 * Purpose:
 *   - Resolves the prompt template file path for Breakdown according to CLI parameters and config.
 *   - Handles all cases for baseDirOverride, config, adaptation, fromLayerType inference, and fallback.
 *   - Ensures prompt path is consistent with project conventions and user intent.
 *
 * Intent:
 *   - To centralize and standardize prompt template path resolution logic for maintainability and testability.
 *   - To avoid path confusion and ensure correct file placement for all CLI/script/test scenarios.
 *
 * Expected Results:
 *   - If baseDirOverride is specified, it takes precedence; otherwise, config.app_prompt.base_dir or default is used.
 *   - File name is determined by fromLayerType (explicit or inferred from fromFile) and adaptation option.
 *   - If adaptation file does not exist, fallback to non-adaptation file if present.
 *   - Returns absolute path to the resolved prompt template file.
 *   - Windows path separators are normalized.
 *
 * References:
 *   - docs/breakdown/path.ja.md
 *   - docs/breakdown/usage.ja.md
 *   - docs/breakdown/cli.ja.md
 *   - docs/index.ja.md
 */
export class PromptTemplatePathResolver {
  private config: { app_prompt?: { base_dir?: string } } & Record<string, unknown>;
  private cliParams: DoubleParamsResult;

  constructor(
    config: { app_prompt?: { base_dir?: string } } & Record<string, unknown>,
    cliParams: DoubleParamsResult,
  ) {
    this.config = config;
    this.cliParams = cliParams;
  }

  /**
   * Resolves the prompt template file path according to CLI parameters and config.
   *
   * See: docs/breakdown/path.ja.md, usage.ja.md, cli.ja.md
   *
   * @returns {string} The resolved absolute prompt template file path.
   */
  public getPath(): string {
    // No validation here; only resolve and return the path
    const baseDir = this.resolveBaseDir();
    const fileName = this.buildFileName();
    let promptPath = this.buildPromptPath(baseDir, fileName);

    if (this.shouldFallback(promptPath)) {
      const fallbackFileName = this.buildFallbackFileName();
      const fallbackPath = this.buildPromptPath(baseDir, fallbackFileName);
      if (existsSync(fallbackPath)) {
        promptPath = fallbackPath;
      }
    }
    return promptPath;
  }

  private resolveBaseDir(): string {
    let baseDir = this.config.app_prompt?.base_dir;
    if (!baseDir) {
      baseDir = DEFAULT_PROMPT_BASE_DIR;
    }
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }
    return baseDir;
  }

  private buildFileName(): string {
    const { layerType, options } = this.cliParams;
    const fromLayerType = options?.fromLayerType || layerType;
    const adaptation = options?.adaptation ? `_${options.adaptation}` : "";
    return `f_${fromLayerType}${adaptation}.md`;
  }

  private buildFallbackFileName(): string {
    const { layerType, options } = this.cliParams;
    const fromLayerType = options?.fromLayerType || layerType;
    return `f_${fromLayerType}.md`;
  }

  private buildPromptPath(baseDir: string, fileName: string): string {
    const { demonstrativeType, layerType } = this.cliParams;
    return join(baseDir, demonstrativeType, layerType, fileName);
  }

  private shouldFallback(promptPath: string): boolean {
    const { options } = this.cliParams;
    return Boolean(options?.adaptation) && !existsSync(promptPath);
  }
}
