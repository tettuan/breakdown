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
 * Following Totality principle and DDD:
 * - Smart Constructor pattern for safe instance creation
 * - Result type for explicit error handling
 * - Value objects for domain modeling
 * - 100% deterministic path resolution for reliability
 *
 * @module factory/prompt_template_path_resolver
 */

import { isAbsolute, join, resolve } from "@std/path";
import { existsSync } from "@std/fs";
import { DEFAULT_PROMPT_BASE_DIR } from "../config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "./prompt_variables_factory.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

// PathResolutionError now imported from central types definition

/**
 * Value object representing a resolved prompt template path
 */
export class PromptTemplatePath {
  private constructor(
    readonly value: string,
    readonly status: "Found" | "Fallback",
    readonly metadata: {
      baseDir: string;
      demonstrativeType: string;
      layerType: string;
      fromLayerType: string;
      adaptation?: string;
      attemptedPaths: string[];
    },
  ) {}

  /**
   * Create a PromptTemplatePath instance (Smart Constructor)
   */
  static create(
    path: string,
    status: "Found" | "Fallback",
    metadata: PromptTemplatePath["metadata"],
  ): Result<PromptTemplatePath, Error> {
    if (!path || path.trim() === "") {
      return resultError(new Error("Path cannot be empty"));
    }
    if (!isAbsolute(path)) {
      return resultError(new Error("Path must be absolute"));
    }
    return resultOk(new PromptTemplatePath(path, status, metadata));
  }

  /**
   * Check if the path was found through fallback
   */
  isFallback(): boolean {
    return this.status === "Fallback";
  }

  /**
   * Get a descriptive message about the path resolution
   */
  getResolutionMessage(): string {
    if (this.status === "Found") {
      return `Path resolved successfully: ${this.value}`;
    }
    return `Path resolved with fallback: ${this.value}\nAttempted: ${
      this.metadata.attemptedPaths.join(", ")
    }`;
  }
}

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
  private readonly config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  private readonly _cliParams: DoubleParams_Result | TwoParams_Result;

  /**
   * Private constructor following Smart Constructor pattern
   * Inputs are already validated by the smart constructor
   */
  private constructor(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    // Deep copy to ensure immutability - inputs are already validated
    this.config = this.deepCopyConfig(config);
    this._cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Creates a new PromptTemplatePathResolver instance (Smart Constructor)
   *
   * @param config - The configuration object containing prompt base directory settings
   * @param cliParams - The parsed CLI parameters containing template specification options
   * @returns Result containing resolver instance or error
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
   * const resolverResult = PromptTemplatePathResolver.create(config, cliParams);
   * if (resolverResult.ok) {
   *   const resolver = resolverResult.data;
   *   // Use resolver
   * }
   * ```
   */
  static create(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<PromptTemplatePathResolver, PathResolutionError> {
    // Validate configuration presence and type
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "Configuration must be a non-null object",
      });
    }

    // Validate cliParams presence and type
    if (!cliParams || typeof cliParams !== "object" || Array.isArray(cliParams)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "CLI parameters must be a non-null object",
      });
    }

    // Validate CLI parameters structure and content
    const demonstrativeType = PromptTemplatePathResolver.extractDemonstrativeType(cliParams);
    const layerType = PromptTemplatePathResolver.extractLayerType(cliParams);

    if (!demonstrativeType || !layerType) {
      return resultError({
        kind: "InvalidParameterCombination",
        demonstrativeType: demonstrativeType || "(missing)",
        layerType: layerType || "(missing)",
      });
    }

    // Validate that extracted values are non-empty strings
    if (demonstrativeType.trim() === "" || layerType.trim() === "") {
      return resultError({
        kind: "InvalidParameterCombination",
        demonstrativeType: demonstrativeType || "(empty)",
        layerType: layerType || "(empty)",
      });
    }

    return resultOk(new PromptTemplatePathResolver(config, cliParams));
  }

  /**
   * Deep copy configuration object manually to avoid JSON.parse
   * @param config - The configuration object to copy
   * @returns Deep copy of the configuration
   */
  private deepCopyConfig(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
  ):
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown> {
    const copy:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown> = {};

    // Copy app_prompt
    if (config.app_prompt) {
      copy.app_prompt = {};
      if (config.app_prompt.base_dir !== undefined) {
        copy.app_prompt.base_dir = config.app_prompt.base_dir;
      }
    }

    // Copy app_schema
    if (config.app_schema) {
      copy.app_schema = {};
      if (config.app_schema.base_dir !== undefined) {
        copy.app_schema.base_dir = config.app_schema.base_dir;
      }
    }

    // Copy other properties shallowly (should be primitive or immutable)
    for (const [key, value] of Object.entries(config)) {
      if (key !== "app_prompt" && key !== "app_schema") {
        copy[key] = value;
      }
    }

    return copy;
  }

  /**
   * Deep copy CLI parameters manually to avoid JSON.parse
   * @param cliParams - The CLI parameters to copy
   * @returns Deep copy of the CLI parameters
   */
  private deepCopyCliParams(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): DoubleParams_Result | TwoParams_Result {
    if ("type" in cliParams && ("directive" in cliParams && "layer" in cliParams)) {
      // TwoParams_Result
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: twoParams.type || "two",
        params: twoParams.params ? [...twoParams.params] : [],
        demonstrativeType: twoParams.demonstrativeType || "",
        layerType: twoParams.layerType || "",
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
      const copy: PromptCliParams = {
        demonstrativeType: doubleParams.demonstrativeType,
        layerType: doubleParams.layerType,
        options: doubleParams.options ? { ...doubleParams.options } : {},
      };

      return copy;
    }
  }

  /**
   * Resolves the complete prompt template file path with intelligent fallback logic.
   *
   * This method implements the full prompt template resolution strategy, including
   * adaptation-specific template discovery and fallback to standard templates when
   * adaptation-specific versions are not available. It guarantees 100% deterministic
   * path resolution and provides clear error messages for troubleshooting.
   *
   * @returns Result containing resolved PromptTemplatePath or error
   *
   * @example
   * ```typescript
   * const resolverResult = PromptTemplatePathResolver.create(config, cliParams);
   * if (!resolverResult.ok) {
   *   console.error(resolverResult.error);
   *   return;
   * }
   *
   * const pathResult = resolverResult.data.getPath();
   * if (pathResult.ok) {
   *   const promptPath = pathResult.data;
   *   console.log(promptPath.getResolutionMessage());
   *   console.log("Path:", promptPath.value);
   * } else {
   *   // Clear error message for user
   *   console.error(formatPathResolutionError(pathResult.error));
   * }
   * ```
   */
  public getPath(): Result<PromptTemplatePath, PathResolutionError> {
    // Resolve base directory
    const baseDirResult = this.resolveBaseDirSafe();
    if (!baseDirResult.ok) {
      return baseDirResult;
    }
    const baseDir = baseDirResult.data;

    // Build file names
    const fileName = this.buildFileName();
    const promptPath = this.buildPromptPath(baseDir, fileName);
    const attemptedPaths: string[] = [promptPath];

    // Collect metadata
    const demonstrativeType = this.getDemonstrativeType();
    const layerType = this.getLayerType();
    const fromLayerType = this.resolveFromLayerType();
    const adaptation = this.getAdaptation();

    // Check if primary path exists
    if (existsSync(promptPath)) {
      const pathResult = PromptTemplatePath.create(promptPath, "Found", {
        baseDir,
        demonstrativeType,
        layerType,
        fromLayerType,
        adaptation,
        attemptedPaths,
      });

      if (!pathResult.ok) {
        return resultError({
          kind: "InvalidConfiguration",
          details: pathResult.error.message,
        });
      }
      return pathResult;
    }

    // Try fallback if needed
    if (this.shouldFallback(promptPath)) {
      const fallbackFileName = this.buildFallbackFileName();
      const fallbackPath = this.buildPromptPath(baseDir, fallbackFileName);
      attemptedPaths.push(fallbackPath);

      if (existsSync(fallbackPath)) {
        const pathResult = PromptTemplatePath.create(fallbackPath, "Fallback", {
          baseDir,
          demonstrativeType,
          layerType,
          fromLayerType,
          adaptation,
          attemptedPaths,
        });

        if (!pathResult.ok) {
          return resultError({
            kind: "InvalidConfiguration",
            details: pathResult.error.message,
          });
        }
        return pathResult;
      }
    }

    // No template found
    return resultError({
      kind: "TemplateNotFound",
      attempted: attemptedPaths,
      fallback: adaptation ? "Attempted fallback to base template" : undefined,
    });
  }

  /**
   * Resolves the base directory for prompt templates from configuration.
   * Legacy method maintained for backward compatibility.
   * @deprecated Use resolveBaseDirSafe() for Result-based error handling
   */
  public resolveBaseDir(): string {
    const result = this.resolveBaseDirSafe();
    if (!result.ok) {
      // Maintain backward compatibility by returning default
      return resolve(Deno.cwd(), DEFAULT_PROMPT_BASE_DIR);
    }
    return result.data;
  }

  /**
   * Safely resolves the base directory with Result type
   *
   * @returns Result containing resolved base directory or error
   */
  private resolveBaseDirSafe(): Result<string, PathResolutionError> {
    // Check if schema path should be used based on options
    const useSchema = this.getUseSchemaFlag();
    let baseDir: string;

    if (useSchema && this.config.app_schema?.base_dir) {
      baseDir = this.config.app_schema.base_dir;
    } else {
      baseDir = this.config.app_prompt?.base_dir || DEFAULT_PROMPT_BASE_DIR;
    }

    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }

    // Verify base directory exists
    if (!existsSync(baseDir)) {
      return resultError({
        kind: "BaseDirectoryNotFound",
        path: baseDir,
      });
    }

    return resultOk(baseDir);
  }

  /**
   * Builds the filename for the prompt template or schema file.
   * @returns The constructed filename string with appropriate extension (.md for prompts, .json for schemas).
   */
  public buildFileName(): string {
    const useSchema = this.getUseSchemaFlag();
    const fromLayerType = this.resolveFromLayerType();

    if (useSchema) {
      // Schema files use .json extension and no adaptation suffix
      return `f_${fromLayerType}.json`;
    }

    // Prompt files use .md extension and may have adaptation suffix
    const adaptation = this.getAdaptation();
    const adaptationSuffix = adaptation ? `_${adaptation}` : "";
    return `f_${fromLayerType}${adaptationSuffix}.md`;
  }

  /**
   * Gets the useSchema flag option with compatibility handling
   * @returns boolean - The useSchema flag value
   */
  private getUseSchemaFlag(): boolean {
    // Handle both legacy and new parameter structures
    if ("options" in this._cliParams) {
      return Boolean((this._cliParams.options as Record<string, unknown>)?.useSchema);
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
    return Boolean(
      (twoParams as unknown as { options?: { useSchema?: boolean } }).options?.useSchema,
    );
  }

  /**
   * Gets the adaptation option with compatibility handling
   * @returns string | undefined - The adaptation value
   */
  private getAdaptation(): string | undefined {
    // Handle both legacy and new parameter structures
    if ("options" in this._cliParams) {
      return (this._cliParams.options as Record<string, unknown>)?.adaptation as string | undefined;
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
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
    return PromptTemplatePathResolver.extractDemonstrativeType(this._cliParams);
  }

  /**
   * Static helper to extract demonstrative type from parameters
   */
  private static extractDemonstrativeType(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): string {
    // Handle both legacy and new parameter structures
    if ("demonstrativeType" in cliParams) {
      return cliParams.demonstrativeType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.demonstrativeType) {
      return twoParams.demonstrativeType;
    }
    // Extract from params array if available
    if (twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0];
    }
    return "";
  }

  /**
   * Gets the layer type value using new type system
   * @returns string - The layer type value from LayerType
   */
  private getLayerType(): string {
    return PromptTemplatePathResolver.extractLayerType(this._cliParams);
  }

  /**
   * Static helper to extract layer type from parameters
   */
  private static extractLayerType(cliParams: DoubleParams_Result | TwoParams_Result): string {
    // Handle both legacy and new parameter structures
    if ("layerType" in cliParams) {
      return cliParams.layerType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.layerType) {
      return twoParams.layerType;
    }
    // Extract from params array if available
    if (twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1];
    }
    return "";
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
    if ("options" in this._cliParams) {
      return (this._cliParams.options as unknown as { fromLayerType?: string })?.fromLayerType;
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
    return (twoParams as unknown as { options?: { fromLayerType?: string } }).options
      ?.fromLayerType;
  }

  /**
   * Gets the fromFile option with compatibility handling
   * @returns string | undefined - The fromFile value
   */
  private getFromFile(): string | undefined {
    // Handle both legacy and new parameter structures
    if ("options" in this._cliParams) {
      return (this._cliParams.options as unknown as { fromFile?: string })?.fromFile;
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
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

/**
 * Format path resolution error for user-friendly display
 */
export function formatPathResolutionError(error: PathResolutionError): string {
  switch (error.kind) {
    case "InvalidConfiguration":
      return `Configuration Error: ${error.details}`;

    case "BaseDirectoryNotFound":
      return `Base Directory Not Found: ${error.path}\n` +
        `Please ensure the prompt base directory exists or update your configuration.`;

    case "InvalidParameterCombination":
      return `Invalid Parameter Combination:\n` +
        `  Demonstrative Type: ${error.demonstrativeType}\n` +
        `  Layer Type: ${error.layerType}\n` +
        `Both parameters are required for prompt resolution.`;

    case "TemplateNotFound": {
      const message = [
        `パスは正確に生成されました: ${error.attempted[0]}`,
        `しかし、このファイルは存在しません。`,
        ``,
        `試行したパス:`,
        ...error.attempted.map((p, i) => `  ${i + 1}. ${p}`),
        ``,
      ];

      if (error.fallback) {
        message.push(error.fallback);
        message.push(``);
      }

      message.push(`プロンプトテンプレートファイルの準備が必要です。`);
      return message.join("\n");
    }

    case "InvalidStrategy":
      return `Invalid Strategy: ${error.strategy}`;

    case "EmptyBaseDir":
      return `Base directory is empty`;

    case "InvalidPath":
      return `Invalid Path: ${error.path} - ${error.reason}`;

    case "NoValidFallback":
      return `No valid fallback found. Attempts: ${error.attempts.join(", ")}`;

    case "ValidationFailed":
      return `Validation failed for path: ${error.path}`;

    default:
      return `Unknown error occurred`;
  }
}
