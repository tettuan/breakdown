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
import type { TwoParamsResult } from "../deps.ts";
import { DirectiveType } from "../types/directive_type.ts";
import { LayerType as NewLayerType } from "../types/layer_type.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParamsResult = PromptCliParams;

/**
 * TypeCreationResult - Unified error handling for type creation operations
 * Follows Totality principle by explicitly representing success/failure states
 */
export type TypeCreationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; errorType: "validation" | "missing" | "config" };

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
  private cliParams: DoubleParamsResult | TwoParamsResult;

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
    cliParams: DoubleParamsResult | TwoParamsResult,
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
    const fromLayerType = this.resolveFromLayerType();
    const adaptation = this.getAdaptation();
    const adaptationSuffix = adaptation ? `_${adaptation}` : "";
    return `f_${fromLayerType}${adaptationSuffix}.md`;
  }

  /**
   * Gets the adaptation option with compatibility handling
   * @returns string | undefined - The adaptation value
   */
  private getAdaptation(): string | undefined {
    // Handle both legacy and new parameter structures
    if ('options' in this.cliParams) {
      return this.cliParams.options?.adaptation as string | undefined;
    }
    // For TwoParamsResult structure, adapt to legacy interface
    const twoParams = this.cliParams as TwoParamsResult;
    return (twoParams as unknown as { options?: { adaptation?: string } }).options?.adaptation;
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
    const demonstrativeType = this.getDemonstrativeType();
    const layerType = this.getLayerType();
    return join(baseDir, demonstrativeType, layerType, fileName);
  }

  /**
   * Gets the demonstrative type value using new type system
   * @returns string - The demonstrative type value from DirectiveType
   */
  private getDemonstrativeType(): string {
    // Handle both legacy and new parameter structures
    if ('demonstrativeType' in this.cliParams) {
      return this.cliParams.demonstrativeType;
    }
    // For TwoParamsResult structure, create DirectiveType and get value
    const twoParams = this.cliParams as TwoParamsResult;
    const directiveType = DirectiveType.create(twoParams);
    return directiveType.value;
  }

  /**
   * Gets the layer type value using new type system
   * @returns string - The layer type value from LayerType
   */
  private getLayerType(): string {
    // Handle both legacy and new parameter structures
    if ('layerType' in this.cliParams) {
      return this.cliParams.layerType;
    }
    // For TwoParamsResult structure, create LayerType and get value
    const twoParams = this.cliParams as TwoParamsResult;
    const layerType = NewLayerType.create(twoParams);
    return layerType.value;
  }

  /**
   * Determines if a fallback should be used for the prompt template path.
   * @param promptPath The prompt template path to check.
   * @returns True if fallback should be used, false otherwise.
   */
  public shouldFallback(promptPath: string): boolean {
    const adaptation = this.getAdaptation();
    return Boolean(adaptation) && !existsSync(promptPath);
  }

  /**
   * Resolves the fromLayerType from CLI parameters or infers it from the fromFile.
   * @returns The resolved fromLayerType string.
   */
  public resolveFromLayerType(): string {
    const layerType = this.getLayerType();
    const fromLayerType = this.getFromLayerType();
    const fromFile = this.getFromFile();

    // Use explicit fromLayerType if provided
    if (fromLayerType) {
      return fromLayerType;
    }

    // Infer fromLayerType from fromFile if available
    if (fromFile) {
      const inferredType = this.inferLayerTypeFromFileName(fromFile);
      if (inferredType) {
        return inferredType;
      }
    }

    // Fallback to layerType
    return layerType;
  }

  /**
   * Gets the fromLayerType option with compatibility handling
   * @returns string | undefined - The fromLayerType value
   */
  private getFromLayerType(): string | undefined {
    // Handle both legacy and new parameter structures
    if ('options' in this.cliParams) {
      return this.cliParams.options?.fromLayerType as string | undefined;
    }
    // For TwoParamsResult structure, adapt to legacy interface
    const twoParams = this.cliParams as TwoParamsResult;
    return (twoParams as unknown as { options?: { fromLayerType?: string } }).options?.fromLayerType;
  }

  /**
   * Gets the fromFile option with compatibility handling
   * @returns string | undefined - The fromFile value
   */
  private getFromFile(): string | undefined {
    // Handle both legacy and new parameter structures
    if ('options' in this.cliParams) {
      return this.cliParams.options?.fromFile as string | undefined;
    }
    // For TwoParamsResult structure, adapt to legacy interface
    const twoParams = this.cliParams as TwoParamsResult;
    return (twoParams as unknown as { options?: { fromFile?: string } }).options?.fromFile;
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
