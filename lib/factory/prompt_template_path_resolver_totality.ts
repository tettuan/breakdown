/**
 * @fileoverview Prompt template path resolution with full Totality principle applied.
 *
 * This is a refactored version of PromptTemplatePathResolver that implements:
 * - Complete Result type usage (no partial functions)
 * - Discriminated unions for optional properties
 * - Exhaustive error handling
 * - No null returns or exceptions
 *
 * @module factory/prompt_template_path_resolver_totality
 */

import { isAbsolute, join, resolve } from "jsr:@std/path@^1.0.9";
import { existsSync } from "jsr:@std/fs@0.224.0";
import { DEFAULT_FROM_LAYER_TYPE, DEFAULT_PROMPT_BASE_DIR } from "../config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import type { LayerTypeConfig } from "../domain/core/value_objects/layer_type.ts";

// Legacy type alias for backward compatibility during migration
// type DoubleParams_Result = PromptCliParams; // Deprecated: use TwoParams_Result

/**
 * Error type for layer type inference
 */
export type LayerTypeInferenceError = {
  kind: "InferenceFailure";
  fileName: string;
  reason: string;
  message: string;
};

/**
 * Configuration with explicit union types instead of optionals
 */
export type PromptResolverConfig =
  | {
    kind: "WithPromptConfig";
    app_prompt: { base_dir: string };
    app_schema?: { base_dir?: string };
    working_dir?: string;
  }
  | {
    kind: "WithSchemaConfig";
    app_schema: { base_dir: string };
    app_prompt?: { base_dir?: string };
    working_dir?: string;
  }
  | { kind: "NoConfig"; working_dir?: string };

/**
 * CLI options with explicit union types
 */
export type CliOptions = {
  useSchema: boolean | undefined;
  adaptation: string | undefined;
  fromLayerType: string | undefined;
  fromFile: string | undefined;
};

/**
 * Value object representing a resolved prompt template path
 */
export class PromptTemplatePath {
  private constructor(
    readonly value: string,
    readonly status: "Found" | "Fallback",
    readonly metadata: {
      baseDir: string;
      directiveType: string;
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
 * Prompt template path resolver with full Totality implementation
 */
export class PromptTemplatePathResolverTotality {
  private readonly config: PromptResolverConfig;
  private readonly _cliParams: PromptCliParams | TwoParams_Result;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: PromptResolverConfig,
    cliParams: PromptCliParams | TwoParams_Result,
  ) {
    this.config = config;
    this._cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Creates a new resolver instance with full validation
   */
  static create(
    config: Record<string, unknown>,
    cliParams: PromptCliParams | TwoParams_Result,
  ): Result<PromptTemplatePathResolverTotality, PathResolutionError> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] create called with:", {
        configKeys: Object.keys(config),
        cliParams: JSON.stringify(cliParams, null, 2),
      });
    }
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
    const directiveType = PromptTemplatePathResolverTotality.extractDirectiveType(
      cliParams,
    );
    const layerType = PromptTemplatePathResolverTotality.extractLayerType(cliParams);

    if (!directiveType || !layerType) {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(missing)",
        layerType: layerType || "(missing)",
      });
    }

    // Validate that extracted values are non-empty strings
    if (directiveType.trim() === "" || layerType.trim() === "") {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(empty)",
        layerType: layerType || "(empty)",
      });
    }

    // Convert config to discriminated union
    const resolverConfig = PromptTemplatePathResolverTotality.normalizeConfig(config);

    const resolver = new PromptTemplatePathResolverTotality(resolverConfig, cliParams);
    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] Returning:", {
        ok: true,
        resolverConfigKind: resolverConfig.kind,
      });
    }
    return resultOk(resolver);
  }

  /**
   * Convert raw config to discriminated union
   */
  private static normalizeConfig(config: Record<string, unknown>): PromptResolverConfig {
    const appPrompt = config.app_prompt as { base_dir?: string } | undefined;
    const appSchema = config.app_schema as { base_dir?: string } | undefined;

    // ✅ SINGLE SOURCE OF TRUTH: Only use working_dir at root level
    const workingDir = config.working_dir as string | undefined;

    if (appPrompt?.base_dir) {
      return {
        kind: "WithPromptConfig",
        app_prompt: { base_dir: appPrompt.base_dir },
        app_schema: appSchema,
        working_dir: workingDir,
      };
    } else if (appSchema?.base_dir) {
      return {
        kind: "WithSchemaConfig",
        app_schema: { base_dir: appSchema.base_dir },
        app_prompt: appPrompt,
        working_dir: workingDir,
      };
    } else {
      return { kind: "NoConfig", working_dir: workingDir };
    }
  }

  /**
   * Deep copy CLI parameters
   */
  private deepCopyCliParams(
    cliParams: PromptCliParams | TwoParams_Result,
  ): PromptCliParams | TwoParams_Result {
    if ("type" in cliParams && ("directive" in cliParams && "layer" in cliParams)) {
      // TwoParams_Result
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: twoParams.type || "two",
        params: twoParams.params ? [...twoParams.params] : [],
        layerType: twoParams.params?.[1] || "",
        directiveType: twoParams.directiveType || twoParams.params?.[0] || "",
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      // PromptCliParams (legacy format)
      const promptParams = cliParams as PromptCliParams;
      const copy: PromptCliParams = {
        layerType: promptParams.layerType,
        directiveType: promptParams.directiveType || "",
        options: promptParams.options ? { ...promptParams.options } : {},
      };
      return copy;
    }
  }

  /**
   * Resolves the complete prompt template file path
   */
  public getPath(): Result<PromptTemplatePath, PathResolutionError> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] getPath called");
    }

    // Resolve base directory
    const baseDirResult = this.resolveBaseDirSafe();
    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] resolveBaseDirSafe result:",
        JSON.stringify(baseDirResult, null, 2),
      );
    }
    if (!baseDirResult.ok) {
      return baseDirResult;
    }
    const baseDir = baseDirResult.data;

    // Build file names
    const fileName = this.buildFileName();
    const promptPath = this.buildPromptPath(baseDir, fileName);
    const attemptedPaths: string[] = [promptPath];

    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] getPath:",
        JSON.stringify(
          {
            baseDir,
            fileName,
            promptPath,
            directiveType: this.getDirectiveType(),
            layerType: this.getLayerType(),
          },
          null,
          2,
        ),
      );
    }

    // Collect metadata
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();
    const fromLayerTypeResult = this.resolveFromLayerTypeSafe();
    if (!fromLayerTypeResult.ok) {
      return resultError({
        kind: "InvalidConfiguration",
        details: fromLayerTypeResult.error.message,
      });
    }
    const fromLayerType = fromLayerTypeResult.data;
    const adaptation = this.getAdaptation();

    // Check if primary path exists
    if (existsSync(promptPath)) {
      const pathResult = PromptTemplatePath.create(promptPath, "Found", {
        baseDir,
        directiveType,
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
      if (isDebug) {
        console.log("[PromptTemplatePathResolverTotality] Returning:", {
          ok: true,
          path: promptPath,
          status: "Found",
          directiveType,
          layerType,
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
          directiveType,
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
    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] Returning:",
        JSON.stringify(
          {
            ok: false,
            error: {
              kind: "TemplateNotFound",
              attempted: attemptedPaths,
              fallback: adaptation ? "Attempted fallback to base template" : undefined,
            },
          },
          null,
          2,
        ),
      );
    }
    return resultError({
      kind: "TemplateNotFound",
      attempted: attemptedPaths,
      fallback: adaptation ? "Attempted fallback to base template" : undefined,
    });
  }

  /**
   * Safely resolves the base directory with Result type
   */
  private resolveBaseDirSafe(): Result<string, PathResolutionError> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";

    // Check if schema path should be used based on options
    const useSchema = this.getUseSchemaFlag();
    let baseDir: string;

    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] resolveBaseDirSafe:",
        JSON.stringify(
          {
            configKind: this.config.kind,
            useSchema,
            workingDir: this.config.working_dir,
            cwd: Deno.cwd(),
          },
          null,
          2,
        ),
      );
    }

    switch (this.config.kind) {
      case "WithPromptConfig":
        if (useSchema && this.config.app_schema?.base_dir) {
          baseDir = this.config.app_schema.base_dir;
        } else {
          baseDir = this.config.app_prompt.base_dir;
        }
        break;
      case "WithSchemaConfig":
        if (useSchema) {
          baseDir = this.config.app_schema.base_dir;
        } else {
          baseDir = this.config.app_prompt?.base_dir || DEFAULT_PROMPT_BASE_DIR;
        }
        break;
      case "NoConfig":
        baseDir = DEFAULT_PROMPT_BASE_DIR;
        break;
    }

    if (!isAbsolute(baseDir)) {
      // Use working_dir if available, otherwise use current working directory
      const workingDir = this.config.working_dir || Deno.cwd();
      baseDir = resolve(workingDir, baseDir);

      if (isDebug) {
        console.log(
          "[PromptTemplatePathResolverTotality] Resolved relative path:",
          JSON.stringify(
            {
              originalBaseDir: this.config.kind === "WithPromptConfig"
                ? this.config.app_prompt.base_dir
                : "DEFAULT",
              workingDir,
              resolvedBaseDir: baseDir,
            },
            null,
            2,
          ),
        );
      }
    }

    // Verify base directory exists
    if (!existsSync(baseDir)) {
      return resultError({
        kind: "BaseDirectoryNotFound",
        path: baseDir,
      });
    }

    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] Returning baseDir:", baseDir);
    }

    return resultOk(baseDir);
  }

  /**
   * Builds the filename for the prompt template
   */
  public buildFileName(): string {
    const useSchema = this.getUseSchemaFlag();
    const fromLayerTypeResult = this.resolveFromLayerTypeSafe();
    // Use default if resolution fails
    const fromLayerType = fromLayerTypeResult.ok ? fromLayerTypeResult.data : this.getLayerType();

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
   * Gets the useSchema flag option
   */
  private getUseSchemaFlag(): boolean {
    const options = this.getOptions();
    return options.useSchema === true;
  }

  /**
   * Gets the adaptation option
   */
  private getAdaptation(): string | undefined {
    const options = this.getOptions();
    return options.adaptation;
  }

  /**
   * Extract options with proper type handling
   */
  private getOptions(): CliOptions {
    if ("options" in this._cliParams) {
      const opts = this._cliParams.options as Record<string, unknown>;
      return {
        useSchema: opts?.useSchema as boolean | undefined,
        adaptation: opts?.adaptation as string | undefined,
        fromLayerType: opts?.fromLayerType as string | undefined,
        fromFile: opts?.fromFile as string | undefined,
      };
    }

    // For TwoParams_Result structure
    const twoParams = this._cliParams as TwoParams_Result;
    const opts = (twoParams as unknown as { options?: Record<string, unknown> }).options || {};
    return {
      useSchema: opts.useSchema as boolean | undefined,
      adaptation: opts.adaptation as string | undefined,
      fromLayerType: opts.fromLayerType as string | undefined,
      fromFile: opts.fromFile as string | undefined,
    };
  }

  /**
   * Builds the fallback filename
   */
  public buildFallbackFileName(): string {
    const fromLayerTypeResult = this.resolveFromLayerTypeSafe();
    const fromLayerType = fromLayerTypeResult.ok ? fromLayerTypeResult.data : this.getLayerType();
    return `f_${fromLayerType}.md`;
  }

  /**
   * Builds the full prompt template path
   */
  public buildPromptPath(baseDir: string, fileName: string): string {
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();
    return join(baseDir, directiveType, layerType, fileName);
  }

  /**
   * Gets the directive type value
   */
  private getDirectiveType(): string {
    return PromptTemplatePathResolverTotality.extractDirectiveType(this._cliParams);
  }

  /**
   * Static helper to extract directive type
   */
  private static extractDirectiveType(
    cliParams: PromptCliParams | TwoParams_Result,
  ): string {
    if ("directiveType" in cliParams) {
      return cliParams.directiveType || "";
    }
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.directiveType) {
      return twoParams.directiveType;
    }
    if (twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0];
    }
    return "";
  }

  /**
   * Gets the layer type value
   */
  private getLayerType(): string {
    return PromptTemplatePathResolverTotality.extractLayerType(this._cliParams);
  }

  /**
   * Static helper to extract layer type
   */
  private static extractLayerType(cliParams: PromptCliParams | TwoParams_Result): string {
    if ("layerType" in cliParams) {
      return cliParams.layerType || "";
    }
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.layerType) {
      return twoParams.layerType;
    }
    if (twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1];
    }
    return "";
  }

  /**
   * Determines if a fallback should be used
   */
  public shouldFallback(promptPath: string): boolean {
    const adaptation = this.getAdaptation();
    return Boolean(adaptation) && !existsSync(promptPath);
  }

  /**
   * Resolves the fromLayerType with Result type (no partial functions)
   * Implements FromLayerType決定ロジック per docs 190-205 lines
   */
  public resolveFromLayerTypeSafe(): Result<string, LayerTypeInferenceError> {
    const options = this.getOptions();

    // Use explicit fromLayerType if provided (--input option)
    if (options.fromLayerType) {
      return resultOk(options.fromLayerType);
    }

    // Try to infer from fromFile if available
    if (options.fromFile) {
      const inferredResult = this.inferLayerTypeFromFileNameSafe(options.fromFile);
      if (inferredResult.ok) {
        return inferredResult;
      }
      // If inference fails, fall back to default
    }

    // Fallback to default when no -i option is specified
    return resultOk(DEFAULT_FROM_LAYER_TYPE);
  }

  /**
   * Infers layer type from a file name - returns Result instead of nullable
   * Configuration-based implementation following Totality principles
   */
  private inferLayerTypeFromFileNameSafe(
    fileName: string,
  ): Result<string, LayerTypeInferenceError> {
    // Extract the base filename without extension
    const baseName = fileName.split("/").pop()?.replace(/\.[^.]*$/, "") || "";

    if (!baseName) {
      return resultError({
        kind: "InferenceFailure",
        fileName,
        reason: "Could not extract base filename",
        message: "Could not extract base filename",
      });
    }

    // Configuration-based layer type inference
    return this.inferLayerTypeFromConfiguration(baseName, fileName);
  }

  /**
   * Infers layer type from filename using configuration-based patterns
   * Following Totality principles with comprehensive error handling
   *
   * @param baseName - Base filename without extension
   * @param originalFileName - Original filename for error reporting
   * @returns Result with inferred layer type or inference error
   */
  private inferLayerTypeFromConfiguration(
    baseName: string,
    originalFileName: string,
  ): Result<string, LayerTypeInferenceError> {
    try {
      // Get configuration from BreakdownConfig if available
      const layerTypeConfig = this.createLayerTypeConfig();

      // Strategy 1: Extract from file naming patterns
      const patternResult = this.extractLayerTypeFromPattern(baseName, layerTypeConfig);
      if (patternResult.ok) {
        return patternResult;
      }

      // Strategy 2: Fuzzy matching against known layer types
      const fuzzyResult = this.fuzzyMatchLayerType(baseName, layerTypeConfig);
      if (fuzzyResult.ok) {
        return fuzzyResult;
      }

      // Strategy 3: Default fallback with configuration context
      return this.getDefaultLayerTypeFromConfig(baseName, originalFileName, layerTypeConfig);
    } catch (error) {
      return resultError({
        kind: "InferenceFailure",
        fileName: originalFileName,
        reason: `Configuration-based inference failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        message: `Configuration-based inference failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  }

  /**
   * Creates LayerTypeConfig from current configuration context
   */
  private createLayerTypeConfig(): LayerTypeConfig {
    return {
      getLayerTypes: () => {
        try {
          // Extract layer types from configuration
          const config = this.config;
          if (config.kind === "WithPromptConfig" || config.kind === "WithSchemaConfig") {
            // Try to get layer types from BreakdownConfig or default patterns
            const defaultPattern = "project|issue|task|component|module|bugs|feature|epic";
            return defaultPattern.split("|");
          }
          // Fallback to minimal layer types if no configuration
          return ["project", "issue", "task"];
        } catch {
          // Emergency fallback
          return ["project", "issue", "task"];
        }
      },
    };
  }

  /**
   * Extracts layer type from filename patterns (e.g., project_*, issue_*, task_*)
   */
  private extractLayerTypeFromPattern(
    baseName: string,
    config: LayerTypeConfig,
  ): Result<string, LayerTypeInferenceError> {
    const layerTypes = config.getLayerTypes();
    const availableTypes = Array.isArray(layerTypes) ? layerTypes : [];

    // Pattern matching: look for layer type as prefix or suffix
    for (const layerType of availableTypes) {
      // Check prefix pattern: "project_something", "issue_details", etc.
      if (baseName.startsWith(`${layerType}_`) || baseName.startsWith(`${layerType}-`)) {
        return resultOk(layerType);
      }

      // Check suffix pattern: "something_project", "details_issue", etc.
      if (baseName.endsWith(`_${layerType}`) || baseName.endsWith(`-${layerType}`)) {
        return resultOk(layerType);
      }

      // Check exact match
      if (baseName === layerType) {
        return resultOk(layerType);
      }
    }

    return resultError({
      kind: "InferenceFailure",
      fileName: baseName,
      reason: "No pattern match found in filename",
      message: "No pattern match found in filename",
    });
  }

  /**
   * Performs fuzzy matching against known layer types
   */
  private fuzzyMatchLayerType(
    baseName: string,
    config: LayerTypeConfig,
  ): Result<string, LayerTypeInferenceError> {
    const layerTypes = config.getLayerTypes();
    const availableTypes = Array.isArray(layerTypes) ? layerTypes : [];

    // Calculate similarity scores
    const matches = availableTypes.map((layerType) => ({
      layerType,
      similarity: this.calculateSimilarity(baseName.toLowerCase(), layerType.toLowerCase()),
    }))
      .filter((match) => match.similarity > 0.7) // Only high-confidence matches
      .sort((a, b) => b.similarity - a.similarity);

    if (matches.length > 0) {
      return resultOk(matches[0].layerType);
    }

    return resultError({
      kind: "InferenceFailure",
      fileName: baseName,
      reason: "No similar layer type found with sufficient confidence",
      message: "No similar layer type found with sufficient confidence",
    });
  }

  /**
   * Gets default layer type from configuration when inference fails
   */
  private getDefaultLayerTypeFromConfig(
    _baseName: string,
    originalFileName: string,
    config: LayerTypeConfig,
  ): Result<string, LayerTypeInferenceError> {
    const layerTypes = config.getLayerTypes();
    const availableTypes = Array.isArray(layerTypes) ? layerTypes : [];

    if (availableTypes.length > 0) {
      // Use the first available layer type as default
      return resultOk(availableTypes[0]);
    }

    return resultError({
      kind: "InferenceFailure",
      fileName: originalFileName,
      reason: "No layer types available in configuration for fallback",
      message: "No layer types available in configuration for fallback",
    });
  }

  /**
   * Calculates string similarity between two strings
   * Uses simple similarity algorithm for filename matching
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;
    if (str1.startsWith(str2) || str2.startsWith(str1)) return 0.7;

    // Simple Levenshtein-based similarity
    const maxLen = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Simple Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
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
        `  Demonstrative Type: ${error.directiveType}\n` +
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

    case "PathValidationFailed":
      return `Path validation failed: ${error.path} (rule: ${error.rule})`;

    default:
      return `Unknown error occurred`;
  }
}
