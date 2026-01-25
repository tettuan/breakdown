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
import {
  DEFAULT_FROM_LAYER_TYPE,
  DEFAULT_PROMPT_BASE_DIR,
  DEFAULT_SCHEMA_BASE_DIR,
} from "../config/constants.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

// Legacy type alias for backward compatibility during migration
// type DoubleParams_Result = PromptCliParams; // Deprecated: use TwoParams_Result

/**
 * Pure function to compute the prompt directory path.
 * This function is dependency-free and can be used independently
 * by both path resolution and variable construction.
 *
 * @param baseDir - The base directory for prompts (e.g., "/workspace/prompts")
 * @param directiveType - The directive type (e.g., "to", "summary", "defect")
 * @param layerType - The layer type (e.g., "project", "issue", "task")
 * @returns The computed directory path (e.g., "/workspace/prompts/to/task")
 */
export function computePromptDirectory(
  baseDir: string,
  directiveType: string,
  layerType: string,
): string {
  return join(baseDir, directiveType, layerType);
}

/**
 * Simplified configuration type with clear base directory resolution
 */
export type PromptResolverConfig = {
  readonly promptBaseDir: string;
  readonly schemaBaseDir: string;
  readonly workingDir: string;
};

/**
 * CLI options with unified string types for consistency
 */
export type CliOptions = {
  readonly useSchema: boolean;
  readonly adaptation: string;
  readonly fromLayerType: string;
  readonly fromFile: string;
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

    // Validate configuration presence and type before any debug output
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      if (isDebug) {
        console.log("[PromptTemplatePathResolverTotality] create called with invalid config:", {
          config: config,
          configType: typeof config,
          isArray: Array.isArray(config),
        });
      }
      return resultError({
        kind: "InvalidConfiguration",
        details: "Configuration must be a non-null object",
      });
    }

    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] create called with:", {
        configKeys: Object.keys(config),
        cliParams: JSON.stringify(cliParams, null, 2),
      });
    }

    // Validate base_dir paths are relative (Single Source of Truth validation)
    const baseDirValidationResult = PromptTemplatePathResolverTotality.validateBaseDirs(config);
    if (!baseDirValidationResult.ok) {
      return baseDirValidationResult;
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

    // Convert config to simplified structure
    const resolverConfig = PromptTemplatePathResolverTotality.normalizeConfig(config);

    const resolver = new PromptTemplatePathResolverTotality(resolverConfig, cliParams);
    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] Returning:", {
        ok: true,
        promptBaseDir: resolverConfig.promptBaseDir,
        schemaBaseDir: resolverConfig.schemaBaseDir,
      });
    }
    return resultOk(resolver);
  }

  /**
   * Validates that base_dir configurations are relative paths only
   * Implements Single Source of Truth validation
   */
  private static validateBaseDirs(
    config: Record<string, unknown>,
  ): Result<void, PathResolutionError> {
    const appPrompt = config.app_prompt as { base_dir?: string } | undefined;
    const appSchema = config.app_schema as { base_dir?: string } | undefined;

    if (appPrompt?.base_dir && isAbsolute(appPrompt.base_dir)) {
      return resultError({
        kind: "AbsolutePathNotAllowed",
        path: appPrompt.base_dir,
        configKey: "app_prompt.base_dir",
        message:
          `Absolute path not allowed in app_prompt.base_dir: ${appPrompt.base_dir}. Use relative paths only.`,
        context: { field: "app_prompt.base_dir", value: appPrompt.base_dir },
      });
    }

    if (appSchema?.base_dir && isAbsolute(appSchema.base_dir)) {
      return resultError({
        kind: "AbsolutePathNotAllowed",
        path: appSchema.base_dir,
        configKey: "app_schema.base_dir",
        message:
          `Absolute path not allowed in app_schema.base_dir: ${appSchema.base_dir}. Use relative paths only.`,
        context: { field: "app_schema.base_dir", value: appSchema.base_dir },
      });
    }

    return resultOk(undefined);
  }

  /**
   * Convert raw config to simplified structure with defaults
   */
  private static normalizeConfig(config: Record<string, unknown>): PromptResolverConfig {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    const appPrompt = config.app_prompt as { base_dir?: string } | undefined;
    const appSchema = config.app_schema as { base_dir?: string } | undefined;

    // CRITICAL FIX: Use working_dir from config as primary source
    const workingDir = (config.working_dir as string | undefined) || Deno.cwd();

    // Get default value for base_dir
    const promptBaseDir = appPrompt?.base_dir || DEFAULT_PROMPT_BASE_DIR;
    const schemaBaseDir = appSchema?.base_dir || DEFAULT_SCHEMA_BASE_DIR;

    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] normalizeConfig details:", {
        configKeys: Object.keys(config),
        configWorkingDir: config.working_dir,
        resolvedWorkingDir: workingDir,
        currentDir: Deno.cwd(),
        appPrompt,
        appSchema,
        promptBaseDir,
        schemaBaseDir,
        DEFAULT_PROMPT_BASE_DIR,
        DEFAULT_SCHEMA_BASE_DIR,
      });
    }

    // Combine with working_dir and normalize - ensure config's working_dir is used
    const result = {
      promptBaseDir: isAbsolute(promptBaseDir) ? promptBaseDir : resolve(workingDir, promptBaseDir),
      schemaBaseDir: isAbsolute(schemaBaseDir) ? schemaBaseDir : resolve(workingDir, schemaBaseDir),
      workingDir: workingDir,
    };

    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] normalizeConfig result:", result);
    }

    return result;
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

    // Check directory structure existence before building paths
    const directoryCheckResult = this.verifyDirectoryStructure(baseDir);
    if (!directoryCheckResult.ok) {
      if (isDebug) {
        console.log(
          "[PromptTemplatePathResolverTotality] Directory structure check failed:",
          directoryCheckResult.error,
        );
      }
      return directoryCheckResult;
    }

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
   * Safely resolves the base directory with simplified logic
   */
  private resolveBaseDirSafe(): Result<string, PathResolutionError> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    const useSchema = this.getUseSchemaFlag();

    // CRITICAL FIX: Base directories are already resolved in normalizeConfig()
    // No need to resolve again since they're already absolute paths
    const baseDir = useSchema ? this.config.schemaBaseDir : this.config.promptBaseDir;

    if (isDebug) {
      console.log("[PromptTemplatePathResolverTotality] Resolved base directory:", {
        useSchema,
        selectedBaseDir: baseDir,
        workingDir: this.config.workingDir,
        isAlreadyAbsolute: isAbsolute(baseDir),
      });
    }

    // Verify directory exists
    if (!existsSync(baseDir)) {
      return resultError({
        kind: "BaseDirectoryNotFound",
        path: baseDir,
      });
    }

    return resultOk(baseDir);
  }

  /**
   * Verifies directory structure exists before attempting file operations (CRITICAL fix)
   * Implements timeout prevention and graceful degradation
   */
  private verifyDirectoryStructure(baseDir: string): Result<void, PathResolutionError> {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();

    // Construct the expected directory path using pure function
    const directoryPath = computePromptDirectory(baseDir, directiveType, layerType);

    if (isDebug) {
      console.log("[verifyDirectoryStructure] Checking directory:", directoryPath);
    }

    // Check if directory exists with timeout protection
    try {
      if (!existsSync(directoryPath)) {
        if (isDebug) {
          console.log(
            "[verifyDirectoryStructure] Directory not found, attempting graceful fallback",
          );
        }

        // Graceful degradation: check parent directories exist
        const directiveDir = join(baseDir, directiveType);
        if (!existsSync(directiveDir)) {
          return resultError({
            kind: "TemplateNotFound",
            attempted: [`${directiveDir}/ (directive directory missing)`],
            fallback:
              `Directory structure incomplete: missing directive directory '${directiveType}/'`,
          });
        }

        return resultError({
          kind: "TemplateNotFound",
          attempted: [`${directoryPath}/ (layer directory missing)`],
          fallback:
            `Directory structure incomplete: missing layer directory '${directiveType}/${layerType}/'`,
        });
      }

      if (isDebug) {
        console.log("[verifyDirectoryStructure] Directory structure verified successfully");
      }
      return resultOk(undefined);
    } catch (error) {
      // Timeout protection: if filesystem operation fails
      if (isDebug) {
        console.log("[verifyDirectoryStructure] Filesystem error:", error);
      }
      return resultError({
        kind: "InvalidConfiguration",
        details: `Filesystem access error for directory: ${directoryPath}. ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  /**
   * Builds the filename for the prompt template
   */
  public buildFileName(): string {
    const useSchema = this.getUseSchemaFlag();

    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log("[buildFileName] START - useSchema:", useSchema);
      console.log("[buildFileName] this.getLayerType():", this.getLayerType());
    }

    const fromLayerTypeResult = this.resolveFromLayerTypeSafe();

    if (isDebug) {
      console.log(
        "[buildFileName] resolveFromLayerTypeSafe() result:",
        JSON.stringify(fromLayerTypeResult, null, 2),
      );
      if (!fromLayerTypeResult.ok) {
        console.log(
          "[buildFileName] resolveFromLayerTypeSafe() FAILED - error:",
          fromLayerTypeResult.error,
        );
      }
    }

    // Use default if resolution fails
    const fromLayerType = fromLayerTypeResult.ok ? fromLayerTypeResult.data : this.getLayerType();

    if (isDebug) {
      console.log("[buildFileName] final fromLayerType:", fromLayerType);
      console.log("[buildFileName] fallback used:", !fromLayerTypeResult.ok);
      console.log("[buildFileName] original layerType:", this.getLayerType());
    }

    if (useSchema) {
      // Schema files use .json extension and no adaptation suffix
      const fileName = `f_${fromLayerType}.json`;
      if (isDebug) {
        console.log("[buildFileName] SCHEMA file generated:", fileName);
      }
      return fileName;
    }

    // Prompt files use .md extension and may have adaptation suffix
    const adaptation = this.getAdaptation();
    const adaptationSuffix = adaptation.length > 0 ? `_${adaptation}` : "";
    const fileName = `f_${fromLayerType}${adaptationSuffix}.md`;

    if (isDebug) {
      console.log("[buildFileName] PROMPT file generated:", fileName);
      console.log("[buildFileName] adaptation:", adaptation);
      console.log("[buildFileName] adaptationSuffix:", adaptationSuffix);
    }

    return fileName;
  }

  /**
   * Gets the useSchema flag option
   */
  private getUseSchemaFlag(): boolean {
    const options = this.getOptions();
    return options.useSchema === true;
  }

  /**
   * Gets the adaptation option with default empty string
   */
  private getAdaptation(): string {
    const options = this.getOptions();
    return options.adaptation;
  }

  /**
   * Extract options with default values ensuring type safety
   */
  private getOptions(): CliOptions {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";

    if ("options" in this._cliParams) {
      const opts = this._cliParams.options as Record<string, unknown>;
      if (isDebug) {
        console.log(
          "[PromptTemplatePathResolverTotality] getOptions - opts:",
          JSON.stringify(opts, null, 2),
        );
      }
      return {
        useSchema: Boolean(opts?.useSchema),
        adaptation: String(opts?.adaptation || ""),
        fromLayerType: String(opts?.fromLayerType || opts?.input || DEFAULT_FROM_LAYER_TYPE),
        fromFile: String(opts?.fromFile || ""),
      };
    }

    // For TwoParams_Result structure
    const twoParams = this._cliParams as TwoParams_Result;
    const opts = (twoParams as unknown as { options?: Record<string, unknown> }).options || {};
    return {
      useSchema: Boolean(opts.useSchema),
      adaptation: String(opts.adaptation || ""),
      fromLayerType: String(opts.fromLayerType || opts.input || DEFAULT_FROM_LAYER_TYPE),
      fromFile: String(opts.fromFile || ""),
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
   * Builds the full prompt template path using the pure function computePromptDirectory.
   */
  public buildPromptPath(baseDir: string, fileName: string): string {
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();
    return join(computePromptDirectory(baseDir, directiveType, layerType), fileName);
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
    return adaptation.length > 0 && !existsSync(promptPath);
  }

  /**
   * Resolves the fromLayerType with Result type (no partial functions)
   * Implements FromLayerType decision logic per docs lines 190-205
   */
  public resolveFromLayerTypeSafe(): Result<
    string,
    { kind: "InferenceFailure"; fileName: string; reason: string; message: string }
  > {
    const options = this.getOptions();

    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] resolveFromLayerTypeSafe - options:",
        JSON.stringify(options, null, 2),
      );
    }

    // Use explicit fromLayerType if provided (--input option)
    if (options.fromLayerType.length > 0 && options.fromLayerType !== DEFAULT_FROM_LAYER_TYPE) {
      if (isDebug) {
        console.log(
          "[PromptTemplatePathResolverTotality] Using fromLayerType:",
          options.fromLayerType,
        );
      }
      return resultOk(options.fromLayerType);
    }

    // Infer layerType from fromFile option
    if (options.fromFile.length > 0) {
      const inferredResult = this.inferLayerTypeFromFileName(options.fromFile);
      if (inferredResult.ok) {
        if (isDebug) {
          console.log(
            "[PromptTemplatePathResolverTotality] Inferred layerType from fromFile:",
            inferredResult.data,
          );
        }
        return resultOk(inferredResult.data);
      }

      // If inference fails, log warning but continue with default
      if (isDebug) {
        console.log(
          "[PromptTemplatePathResolverTotality] Failed to infer layerType from fromFile:",
          inferredResult.error.message,
        );
      }
    }

    // Fallback to DEFAULT_FROM_LAYER_TYPE when no --input option is specified
    if (isDebug) {
      console.log(
        "[PromptTemplatePathResolverTotality] Using DEFAULT_FROM_LAYER_TYPE as fallback:",
        DEFAULT_FROM_LAYER_TYPE,
      );
    }
    return resultOk(DEFAULT_FROM_LAYER_TYPE);
  }

  /**
   * Infers layerType from file name following pattern: {layerType}_*.{ext}
   * Examples: task_data.md -> task, project_spec.txt -> project
   */
  private inferLayerTypeFromFileName(fileName: string): Result<
    string,
    { kind: "InferenceFailure"; fileName: string; reason: string; message: string }
  > {
    const baseName = fileName.split(".")[0]; // Remove extension
    const parts = baseName.split("_");

    if (parts.length < 2) {
      return resultError({
        kind: "InferenceFailure",
        fileName,
        reason: "File name does not match pattern {layerType}_*",
        message:
          `Cannot infer layerType from "${fileName}": expected pattern {layerType}_* (e.g., task_data.md)`,
      });
    }

    const layerType = parts[0];
    return resultOk(layerType);
  }
}

/**
 * Format path resolution error for user-friendly display
 */
export function formatPathResolutionError(error: PathResolutionError): string {
  if (error.kind === "AbsolutePathNotAllowed") {
    return `Configuration Error: ${error.message}\n` +
      `Field: ${error.configKey}\n` +
      `Path: ${error.path}\n` +
      `Please use relative paths only. Update your configuration to use relative paths from working_dir.`;
  }
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
        `Path was generated correctly: ${error.attempted[0]}`,
        `However, this file does not exist.`,
        ``,
        `Attempted paths:`,
        ...error.attempted.map((p, i) => `  ${i + 1}. ${p}`),
        ``,
      ];

      if (error.fallback) {
        message.push(error.fallback);
        message.push(``);
      }

      message.push(`Prompt template file needs to be prepared.`);
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
