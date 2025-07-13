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

import { isAbsolute, join, resolve } from "@std/path";
import { existsSync } from "@std/fs";
import { DEFAULT_PROMPT_BASE_DIR } from "../config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "./prompt_variables_factory.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

/**
 * Error type for layer type inference
 */
export type LayerTypeInferenceError = {
  kind: "InferenceFailure";
  fileName: string;
  reason: string;
};

/**
 * Configuration with explicit union types instead of optionals
 */
export type PromptResolverConfig =
  | {
    kind: "WithPromptConfig";
    app_prompt: { base_dir: string };
    app_schema?: { base_dir?: string };
  }
  | {
    kind: "WithSchemaConfig";
    app_schema: { base_dir: string };
    app_prompt?: { base_dir?: string };
  }
  | { kind: "NoConfig" };

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
  private readonly _cliParams: DoubleParams_Result | TwoParams_Result;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: PromptResolverConfig,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    this.config = config;
    this._cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Creates a new resolver instance with full validation
   */
  static create(
    config: Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<PromptTemplatePathResolverTotality, PathResolutionError> {
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
    const directiveType = PromptTemplatePathResolverTotality.extractDemonstrativeType(
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

    return resultOk(new PromptTemplatePathResolverTotality(resolverConfig, cliParams));
  }

  /**
   * Convert raw config to discriminated union
   */
  private static normalizeConfig(config: Record<string, unknown>): PromptResolverConfig {
    const appPrompt = config.app_prompt as { base_dir?: string } | undefined;
    const appSchema = config.app_schema as { base_dir?: string } | undefined;

    if (appPrompt?.base_dir) {
      return {
        kind: "WithPromptConfig",
        app_prompt: { base_dir: appPrompt.base_dir },
        app_schema: appSchema,
      };
    } else if (appSchema?.base_dir) {
      return {
        kind: "WithSchemaConfig",
        app_schema: { base_dir: appSchema.base_dir },
        app_prompt: appPrompt,
      };
    } else {
      return { kind: "NoConfig" };
    }
  }

  /**
   * Deep copy CLI parameters
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
        directiveType: twoParams.params?.[0] || "",
        layerType: twoParams.params?.[1] || "",
        demonstrativeType: twoParams.demonstrativeType || "",
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
      const copy: PromptCliParams = {
        directiveType: doubleParams.directiveType,
        layerType: doubleParams.layerType,
        options: doubleParams.options ? { ...doubleParams.options } : {},
      };

      return copy;
    }
  }

  /**
   * Resolves the complete prompt template file path
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
    const directiveType = this.getDemonstrativeType();
    const layerType = this.getLayerType();
    const fromLayerTypeResult = this.resolveFromLayerTypeSafe();
    if (!fromLayerTypeResult.ok) {
      return resultError({
        kind: "InvalidConfiguration",
        details: fromLayerTypeResult.error.reason,
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
    // Check if schema path should be used based on options
    const useSchema = this.getUseSchemaFlag();
    let baseDir: string;

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
    const directiveType = this.getDemonstrativeType();
    const layerType = this.getLayerType();
    return join(baseDir, directiveType, layerType, fileName);
  }

  /**
   * Gets the demonstrative type value
   */
  private getDemonstrativeType(): string {
    return PromptTemplatePathResolverTotality.extractDemonstrativeType(this._cliParams);
  }

  /**
   * Static helper to extract demonstrative type
   */
  private static extractDemonstrativeType(
    cliParams: DoubleParams_Result | TwoParams_Result,
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
  private static extractLayerType(cliParams: DoubleParams_Result | TwoParams_Result): string {
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
   */
  public resolveFromLayerTypeSafe(): Result<string, LayerTypeInferenceError> {
    const layerType = this.getLayerType();
    const options = this.getOptions();

    // Use explicit fromLayerType if provided
    if (options.fromLayerType) {
      return resultOk(options.fromLayerType);
    }

    // Try to infer from fromFile if available
    if (options.fromFile) {
      const inferredResult = this.inferLayerTypeFromFileNameSafe(options.fromFile);
      if (inferredResult.ok) {
        return inferredResult;
      }
      // If inference fails, fall back to layerType
    }

    // Fallback to layerType
    return resultOk(layerType);
  }

  /**
   * Infers layer type from a file name - returns Result instead of nullable
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
      });
    }

    // Common layer types to check for
    const layerTypes = ["project", "issue", "task", "implementation"];

    // Check if any layer type is contained in the filename
    for (const layerType of layerTypes) {
      if (baseName.toLowerCase().includes(layerType)) {
        return resultOk(layerType);
      }
    }

    return resultError({
      kind: "InferenceFailure",
      fileName,
      reason: "No known layer type found in filename",
    });
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
