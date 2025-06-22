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

  /**
   * Creates a new PromptTemplatePathResolver instance.
   * @param config The configuration object for the resolver.
   * @param cliParams The CLI parameters used for path resolution.
   */
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

  /**
   * Resolves the base directory for prompt templates.
   * @returns The resolved base directory path.
   */
  public resolveBaseDir(): string {
    let baseDir = this.config.app_prompt?.base_dir;
    if (!baseDir) {
      baseDir = DEFAULT_PROMPT_BASE_DIR;
    }
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }
    return baseDir;
  }

  /**
   * Builds the filename for the prompt template.
   * @returns The constructed filename string.
   */
  public buildFileName(): string {
    const { layerType: _layerType, options } = this.cliParams;
    const fromLayerType = this.resolveFromLayerType();
    const adaptation = options?.adaptation ? `_${options.adaptation}` : "";
    return `f_${fromLayerType}${adaptation}.md`;
  }

  /**
   * Builds the fallback filename for the prompt template.
   * @returns The constructed fallback filename string.
   */
  public buildFallbackFileName(): string {
    const fromLayerType = this.resolveFromLayerType();
    return `f_${fromLayerType}.md`;
  }

  /**
   * Builds the full prompt template path from base directory and filename.
   * @param baseDir The base directory for prompt templates.
   * @param fileName The filename to use.
   * @returns The constructed prompt template path.
   */
  public buildPromptPath(baseDir: string, fileName: string): string {
    const { demonstrativeType, layerType } = this.cliParams;
    return join(baseDir, demonstrativeType, layerType, fileName);
  }

  /**
   * Determines if a fallback should be used for the prompt template path.
   * @param promptPath The prompt template path to check.
   * @returns True if fallback should be used, false otherwise.
   */
  public shouldFallback(promptPath: string): boolean {
    const { options } = this.cliParams;
    return Boolean(options?.adaptation) && !existsSync(promptPath);
  }

  /**
   * Resolves the fromLayerType from CLI parameters or infers it from the fromFile.
   * @returns The resolved fromLayerType string.
   */
  public resolveFromLayerType(): string {
    const { layerType, options } = this.cliParams;

    // Use explicit fromLayerType if provided
    if (options?.fromLayerType) {
      return options.fromLayerType;
    }

    // Infer fromLayerType from fromFile if available
    if (options?.fromFile) {
      const inferredType = this.inferLayerTypeFromFileName(options.fromFile);
      if (inferredType) {
        return inferredType;
      }
    }

    // Fallback to layerType
    return layerType;
  }

  /**
   * Infers layer type from a file name or path.
   * @param fileName The file name or path to analyze.
   * @returns The inferred layer type or null if none found.
   */
  private inferLayerTypeFromFileName(fileName: string): string | null {
    // Extract the base filename without extension
    const baseName = fileName.split("/").pop()?.replace(/\.[^.]*$/, "") || "";

    // Common layer types to check for
    const layerTypes = ["project", "issue", "task", "implementation"];

    // Check if any layer type is contained in the filename
    for (const layerType of layerTypes) {
      if (baseName.toLowerCase().includes(layerType)) {
        return layerType;
      }
    }

    return null;
  }
}
