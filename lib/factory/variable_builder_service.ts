/**
 * @fileoverview Service for building prompt variables
 *
 * This service encapsulates variable building logic, transforming raw inputs
 * into structured PromptParams for prompt generation.
 *
 * Extracted from PromptVariablesFactory to separate concerns:
 * - VariableBuilderService: Variable building responsibility
 * - PromptVariablesFactory: Orchestration responsibility
 *
 * @module factory/variable_builder_service
 */

import type { PromptParams } from "@tettuan/breakdownprompt";
import { ConfigProfile } from "../config/mod.ts";
import { DEFAULT_PROMPT_BASE_DIR, DEFAULT_SCHEMA_BASE_DIR } from "../config/constants.ts";
import {
  type PromptVariableSource,
  PromptVariableSourceFactory,
} from "../types/prompt_variable_source.ts";
import {
  PromptVariableTransformer,
  TransformerFactory,
} from "../domain/prompt_variable_transformer.ts";
import { PathResolutionOption } from "../types/path_resolution_option.ts";
import { error as resultError, ok, type Result } from "../types/result.ts";
import { FilePath } from "../types/file_path_value.ts";
import { OutputPath } from "../types/output_destination.ts";
import type { PromptCliParams, PromptCliOptions } from "./prompt_variables_factory.ts";
import type { ResolvedPaths } from "./path_resolution_facade.ts";

/**
 * Configuration for variable building
 */
export interface VariableBuilderConfig {
  app_prompt?: { base_dir?: string };
  app_schema?: { base_dir?: string };
  [key: string]: unknown;
}

/**
 * Error types for variable builder service
 */
export type VariableBuilderError =
  | { kind: "SourceCreationFailed"; message: string }
  | { kind: "TransformationFailed"; stage: string; message: string }
  | { kind: "ValidationFailed"; field: string; message: string };

/**
 * Service for building prompt variables from raw inputs
 *
 * Handles the 3-stage transformation process:
 * 1. Create PromptVariableSource from CLI params and config
 * 2. Transform source to intermediate variables
 * 3. Build final PromptParams
 */
export class VariableBuilderService {
  private readonly transformer: PromptVariableTransformer;

  private constructor(
    private readonly config: VariableBuilderConfig,
    private readonly cliParams: PromptCliParams,
    transformer?: PromptVariableTransformer,
  ) {
    const baseDir = this.config.app_prompt?.base_dir || DEFAULT_PROMPT_BASE_DIR;
    const pathResult = PathResolutionOption.create("relative", baseDir, [
      this.config.app_schema?.base_dir || DEFAULT_SCHEMA_BASE_DIR,
    ]);

    this.transformer = transformer ||
      (pathResult.ok
        ? TransformerFactory.createWithPathValidation(pathResult.data)
        : this.createDefaultTransformer());
  }

  /**
   * Create a new VariableBuilderService instance
   */
  static create(
    config: VariableBuilderConfig,
    cliParams: PromptCliParams,
    transformer?: PromptVariableTransformer,
  ): Result<VariableBuilderService, VariableBuilderError> {
    return ok(new VariableBuilderService(config, cliParams, transformer));
  }

  /**
   * Create default transformer based on configuration
   */
  private createDefaultTransformer(): PromptVariableTransformer {
    const fallbackPathResult = PathResolutionOption.create("relative", DEFAULT_PROMPT_BASE_DIR, [
      this.config.app_schema?.base_dir || DEFAULT_SCHEMA_BASE_DIR,
    ]);
    const fallbackPath = fallbackPathResult.ok ? fallbackPathResult.data : undefined;

    return fallbackPath
      ? TransformerFactory.createWithPathValidation(fallbackPath)
      : new PromptVariableTransformer({ validatePaths: false, allowEmpty: false });
  }

  /**
   * Create PromptVariableSource from CLI parameters and options
   */
  public createSource(
    resolvedPaths: ResolvedPaths,
  ): Result<PromptVariableSource, VariableBuilderError> {
    // Get output destination path
    const destinationFile = this.cliParams.options.destinationFile || undefined;

    const cliSource = PromptVariableSourceFactory.fromCLI({
      directive: this.cliParams.directiveType,
      layer: this.cliParams.layerType,
      fromFile: this.cliParams.options.fromFile,
      destinationFile: destinationFile,
      userVariables: this.cliParams.options.userVariables,
    });

    const stdinSource = this.cliParams.options.input_text
      ? PromptVariableSourceFactory.fromStdin(this.cliParams.options.input_text)
      : undefined;

    // Create ConfigProfile instance for proper configuration management
    const profileName = ConfigProfile.create(this.cliParams.options.config);

    const configSource = PromptVariableSourceFactory.fromConfig({
      directive: this.cliParams.directiveType,
      layer: this.cliParams.layerType,
      promptDir: this.config.app_prompt?.base_dir,
      profile: profileName.value,
    });

    // Merge sources with proper priority
    const sources = [configSource, cliSource];
    if (stdinSource) sources.push(stdinSource);

    const merged = PromptVariableSourceFactory.merge(...sources);

    // Add resolved schema file path
    merged.schemaFile = resolvedPaths.schemaFilePath;

    return ok(merged);
  }

  /**
   * Build PromptParams from resolved paths
   */
  public buildParams(
    resolvedPaths: ResolvedPaths,
  ): Result<PromptParams, VariableBuilderError> {
    // Build base variables (always present)
    const baseVariables: Record<string, string> = {
      directive_type: this.cliParams.directiveType,
      layer_type: this.cliParams.layerType,
      prompt_path: resolvedPaths.promptFilePath,
      schema_path: resolvedPaths.schemaFilePath,
    };

    // Add input file if specified
    const inputPath = FilePath.fromString(resolvedPaths.inputFilePath);
    if (inputPath.shouldCreateVariable()) {
      const pathValue = inputPath.getPath();
      if (pathValue) {
        baseVariables.input_file = pathValue;
      }
    }

    // Add output file if specified
    const outputPath = FilePath.fromString(resolvedPaths.outputFilePath);
    if (outputPath.shouldCreateVariable()) {
      const pathValue = outputPath.getPath();
      if (pathValue) {
        baseVariables.output_file = pathValue;
      }
    }

    // Merge with user variables
    const promptParams: PromptParams = {
      template_file: resolvedPaths.promptFilePath,
      variables: {
        ...baseVariables,
        ...this.cliParams.options.userVariables,
      },
    };

    return ok(promptParams);
  }

  /**
   * Transform source to PromptParams asynchronously
   */
  public async transform(
    source: PromptVariableSource,
    templatePath: string,
  ): Promise<Result<PromptParams, VariableBuilderError>> {
    const result = await this.transformer.transform(source, templatePath);

    if (!result.ok) {
      const errorMessage = result.error
        .map((e) => `${e.stage}: ${e.message}`)
        .join(", ");
      return resultError({
        kind: "TransformationFailed",
        stage: "transform",
        message: errorMessage,
      });
    }

    return ok(result.data);
  }

  /**
   * Get user variables from CLI options
   */
  public getUserVariables(): Record<string, string> {
    return this.cliParams.options.userVariables || {};
  }

  /**
   * Get CLI options
   */
  public getOptions(): PromptCliOptions {
    return this.cliParams.options;
  }

  /**
   * Get directive type
   */
  public getDirectiveType(): string {
    return this.cliParams.directiveType;
  }

  /**
   * Get layer type
   */
  public getLayerType(): string {
    return this.cliParams.layerType;
  }

  /**
   * Get output destination using type-safe OutputPath
   */
  public getOutputDestination(): Result<OutputPath, VariableBuilderError> {
    const destinationFile = this.cliParams.options.destinationFile;

    if (!destinationFile) {
      return ok(OutputPath.stdout());
    }

    const fileResult = OutputPath.file(destinationFile);
    if (!fileResult.ok) {
      return resultError({
        kind: "ValidationFailed",
        field: "destinationFile",
        message: fileResult.error.message,
      });
    }

    return ok(fileResult.data);
  }

  /**
   * Get input file path using type-safe FilePath
   */
  public getInputFilePath(): Result<FilePath, VariableBuilderError> {
    const fromFile = this.cliParams.options.fromFile;

    if (!fromFile) {
      return ok(FilePath.notSpecified());
    }

    return ok(FilePath.fromString(fromFile));
  }

  /**
   * Get output file path using type-safe FilePath
   */
  public getOutputFilePath(): Result<FilePath, VariableBuilderError> {
    const destinationFile = this.cliParams.options.destinationFile;

    if (!destinationFile) {
      return ok(FilePath.notSpecified());
    }

    return ok(FilePath.fromString(destinationFile));
  }
}
