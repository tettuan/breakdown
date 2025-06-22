/**
 * @fileoverview Prompt template path resolution for Breakdown CLI operations.
 *
 * This module provides the PromptTemplatePathResolver class that handles the
 * complex logic of resolving prompt template file paths based on CLI parameters,
 * configuration, and fallback mechanisms. It supports the hierarchical prompt
 * organization used by Breakdown's 3-layer architecture with adaptation support.
 *
 * The resolver follows Breakdown's prompt conventions and provides intelligent
 * fallback logic for adaptation-specific templates and layer type inference.
 *
 * @module factory/prompt_template_path_resolver
 */

import { isAbsolute, join, resolve } from "@std/path";
import { existsSync } from "@std/fs";
import { DEFAULT_PROMPT_BASE_DIR } from "$lib/config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

type DoubleParamsResult = PromptCliParams;

/**
 * Prompt template path resolver for Breakdown CLI operations.
 *
 * The PromptTemplatePathResolver class handles the resolution of prompt template
 * file paths according to Breakdown's hierarchical organization structure. It resolves
 * templates based on demonstrative type, layer type, and adaptation options, with
 * intelligent fallback mechanisms for missing adaptation-specific templates.
 *
 * Template File Organization:
 * - Base directory: from configuration or default constant
 * - Demonstrative type: "to", "summary", etc.
 * - Layer type: "project", "issue", "task"
 * - Template naming: "f_{fromLayerType}[_{adaptation}].md"
 * - Fallback: "f_{fromLayerType}.md" when adaptation-specific template missing
 *
 * @example
 * ```typescript
 * const resolver = new PromptTemplatePathResolver(config, cliParams);
 *
 * // Prompt template for "to project" with adaptation
 * const adaptedTemplate = resolver.getPath();
 * // Returns: "/prompts/to/project/f_issue_analysis.md" or fallback
 *
 * // Standard prompt template
 * const standardTemplate = resolver.getPath();
 * // Returns: "/prompts/to/project/f_issue.md"
 * ```
 */
export class PromptTemplatePathResolver {
  private config: { app_prompt?: { base_dir?: string } } & Record<string, unknown>;
  private cliParams: DoubleParamsResult;

  /**
   * Creates a new PromptTemplatePathResolver instance with configuration and CLI parameters.
   *
   * @param config - The configuration object containing prompt base directory settings
   * @param cliParams - The parsed CLI parameters containing template specification options
   *
   * @example
   * ```typescript
   * const config = {
   *   app_prompt: { base_dir: "lib/breakdown/prompts" }
   * };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: { adaptation: "analysis", fromLayerType: "issue" }
   * };
   * const resolver = new PromptTemplatePathResolver(config, cliParams);
   * ```
   */
  constructor(
    config: { app_prompt?: { base_dir?: string } } & Record<string, unknown>,
    cliParams: DoubleParamsResult,
  ) {
    this.config = config;
    this.cliParams = cliParams;
  }

  /**
   * Resolves the complete prompt template file path with intelligent fallback logic.
   *
   * This method implements the full prompt template resolution strategy, including
   * adaptation-specific template discovery and fallback to standard templates when
   * adaptation-specific versions are not available. It handles the complete workflow
   * from base directory resolution to final path construction.
   *
   * @returns string - The resolved absolute prompt template file path
   *
   * @throws {Error} When template resolution fails or configuration is invalid
   *
   * @example
   * ```typescript
   * const resolver = new PromptTemplatePathResolver(config, cliParams);
   *
   * // With adaptation - tries adapted template first, fallback to standard
   * const adaptedPath = resolver.getPath();
   * // First try: "/prompts/to/project/f_issue_analysis.md"
   * // Fallback:  "/prompts/to/project/f_issue.md"
   *
   * // Without adaptation - direct standard template
   * const standardPath = resolver.getPath();
   * // Returns: "/prompts/to/project/f_issue.md"
   * ```
   *
   * @see {@link https://docs.breakdown.com/prompts} for template organization documentation
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
   * Resolves the base directory for prompt templates from configuration.
   *
   * This method determines the prompt base directory by checking the configuration
   * for an explicit base_dir setting, falling back to the default constant if not
   * specified. Relative paths are resolved against the current working directory.
   *
   * @returns string - The resolved absolute base directory path for prompt templates
   *
   * @example
   * ```typescript
   * // With explicit configuration
   * const baseDir1 = this.resolveBaseDir(); // "/custom/prompts/path"
   *
   * // With default configuration
   * const baseDir2 = this.resolveBaseDir(); // "/cwd/lib/breakdown/prompts"
   * ```
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
