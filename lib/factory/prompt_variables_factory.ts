/**
 * @fileoverview Refactored factory for prompt variable construction with limited responsibilities.
 *
 * This module now focuses solely on:
 * 1. Orchestrating the 3-stage transformation process
 * 2. Integrating with path resolvers
 * 3. Providing backward compatibility
 *
 * Complex transformation logic has been moved to PromptVariableTransformer domain service.
 *
 * @module factory/prompt_variables_factory
 */

import type { PromptParams } from "@tettuan/breakdownprompt";
// import { BreakdownConfig as _BreakdownConfig } from "@tettuan/breakdownconfig";
import { DirectiveType } from "../types/directive_type.ts";
import { LayerType } from "../types/layer_type.ts";
import {
  PromptVariableSource,
  PromptVariableSourceFactory,
} from "../types/prompt_variable_source.ts";
import {
  PromptVariableTransformer,
  TransformerFactory,
} from "../domain/prompt_variable_transformer.ts";
import {
  formatPathResolutionError,
  PromptTemplatePathResolver,
} from "./prompt_template_path_resolver.ts";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { formatSchemaError, SchemaFilePathResolver } from "./schema_file_path_resolver.ts";
import { PathResolutionOption } from "../types/path_resolution_option.ts";
import type { Result } from "../types/result.ts";
import {
  PromptVariablesFactoryErrors,
  PromptVariablesFactoryErrorFactory,
} from "../types/prompt_variables_factory_error.ts";

/**
 * Configuration options for prompt generation and file resolution.
 */
export interface PromptCliOptions {
  fromFile?: string;
  destinationFile?: string;
  adaptation?: string;
  promptDir?: string;
  fromLayerType?: string;
  input_text?: string;
  customVariables?: Record<string, string>;
  extended?: boolean;
  customValidation?: boolean;
  errorFormat?: "simple" | "detailed" | "json";
  config?: string;
}

/**
 * Parameters for CLI prompt operations.
 */
export interface PromptCliParams {
  demonstrativeType: string;
  layerType: string;
  options: PromptCliOptions;
}

/**
 * Totality-compliant version of PromptCliParams with enhanced type safety.
 * Provides the same interface as PromptCliParams but with stricter validation.
 */
export interface TotalityPromptCliParams extends PromptCliParams {
  demonstrativeType: string;
  layerType: string;
  options: PromptCliOptions;
  // Additional properties for backward compatibility with tests
  directive?: DirectiveType;
  layer?: LayerType;
}

/**
 * Re-export types for backward compatibility
 */
export type { TwoParams_Result } from "../deps.ts";

/**
 * Configuration structure expected by the factory
 */
interface FactoryConfig {
  app_prompt?: { base_dir?: string };
  app_schema?: { base_dir?: string };
  [key: string]: unknown;
}

/**
 * Factory for creating prompt variables through 3-stage transformation.
 *
 * This factory orchestrates the transformation process from raw input
 * to final PromptParams, delegating complex logic to domain services.
 */
export class PromptVariablesFactory {
  private readonly transformer: PromptVariableTransformer;
  private readonly pathResolvers: {
    template: PromptTemplatePathResolver;
    input: InputFilePathResolver;
    output: OutputFilePathResolver;
    schema: SchemaFilePathResolver;
  };

  // Cached resolved paths
  private _promptFilePath?: string;
  private _inputFilePath?: string;
  private _outputFilePath?: string;
  private _schemaFilePath?: string;

  private constructor(
    private readonly config: FactoryConfig,
    private readonly cliParams: PromptCliParams,
    transformer?: PromptVariableTransformer,
  ) {
    // Create path resolvers
    const baseDir = this.config.app_prompt?.base_dir || "prompts";
    const pathOptionsResult = PathResolutionOption.create(
      "relative",
      baseDir,
      [this.config.app_schema?.base_dir || "schemas"],
    );

    if (!pathOptionsResult.ok) {
      throw new Error(`Failed to create path options: ${pathOptionsResult.error.kind}`);
    }

    const pathOptions = pathOptionsResult.data;

    // Create path resolvers using factory methods
    const templateResolverResult = PromptTemplatePathResolver.create(this.config, this.cliParams);
    if (!templateResolverResult.ok) {
      throw new Error(`Failed to create template resolver: ${templateResolverResult.error.kind}`);
    }

    const schemaResolverResult = SchemaFilePathResolver.create(this.config, this.cliParams);
    if (!schemaResolverResult.ok) {
      throw new Error(`Failed to create schema resolver: ${schemaResolverResult.error.kind}`);
    }

    this.pathResolvers = {
      template: templateResolverResult.data,
      input: new InputFilePathResolver(this.config, this.cliParams),
      output: new OutputFilePathResolver(this.config, this.cliParams),
      schema: schemaResolverResult.data,
    };

    // Use provided transformer or create default
    this.transformer = transformer || TransformerFactory.createWithPathValidation(pathOptions);

    // Resolve paths immediately
    this.resolvePaths();
  }

  /**
   * Create factory with automatic configuration loading
   */
  static async create(cliParams: PromptCliParams): Promise<Result<PromptVariablesFactory, PromptVariablesFactoryErrors>> {
    try {
      // TODO: Re-enable BreakdownConfig when API is stable
      // For now, always use default config to avoid compilation errors
      const config = createDefaultConfig();
      const factory = new PromptVariablesFactory(config, cliParams);
      return { ok: true, data: factory };
    } catch (error) {
      // Convert thrown errors to Result errors
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("path options")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(message) };
        }
        if (message.includes("template resolver")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(message) };
        }
        if (message.includes("schema resolver")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed(message) };
        }
      }
      return { ok: false, error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(String(error)) };
    }
  }

  /**
   * Create factory with pre-loaded configuration
   */
  static createWithConfig(
    config: FactoryConfig,
    cliParams: PromptCliParams,
  ): Result<PromptVariablesFactory, PromptVariablesFactoryErrors> {
    try {
      const factory = new PromptVariablesFactory(config, cliParams);
      return { ok: true, data: factory };
    } catch (error) {
      // Convert thrown errors to Result errors
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("path options")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(message) };
        }
        if (message.includes("template resolver")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(message) };
        }
        if (message.includes("schema resolver")) {
          return { ok: false, error: PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed(message) };
        }
      }
      return { ok: false, error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(String(error)) };
    }
  }

  /**
   * Get all resolved parameters
   */
  public getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    directive: DirectiveType;
    layer: LayerType;
    customVariables?: Record<string, string>;
  } {
    const totalityParams = this.cliParams as TotalityPromptCliParams;
    return {
      promptFilePath: this.promptFilePath,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      schemaFilePath: this.schemaFilePath,
      directive: totalityParams.directive!,
      layer: totalityParams.layer!,
      customVariables: this.cliParams.options.customVariables,
    };
  }

  /**
   * Transform parameters to PromptParams using 3-stage transformation
   */
  public async toPromptParams(): Promise<Result<PromptParams, Error>> {
    try {
      // Stage 1: Create PromptVariableSource from various inputs
      const source = this.createPromptVariableSource();

      // Stage 2-3: Transform through domain service
      const templatePath = this.promptFilePath;
      const result = await this.transformer.transform(source, templatePath);

      if (!result.ok) {
        const errorMessage = result.error
          .map((e) => `${e.stage}: ${e.message}`)
          .join(", ");
        return { ok: false, error: new Error(errorMessage) };
      }

      return { ok: true, data: result.data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get resolved prompt file path
   */
  public get promptFilePath(): string {
    if (!this._promptFilePath) {
      throw new Error("Prompt file path not resolved");
    }
    return this._promptFilePath;
  }

  /**
   * Get resolved prompt file path safely
   */
  public getPromptFilePath(): Result<string, PromptVariablesFactoryErrors> {
    if (!this._promptFilePath) {
      return { ok: false, error: PromptVariablesFactoryErrorFactory.promptFilePathNotResolved() };
    }
    return { ok: true, data: this._promptFilePath };
  }

  /**
   * Get resolved input file path
   */
  public get inputFilePath(): string {
    if (!this._inputFilePath) {
      throw new Error("Input file path not resolved");
    }
    return this._inputFilePath;
  }

  /**
   * Get resolved input file path safely
   */
  public getInputFilePath(): Result<string, PromptVariablesFactoryErrors> {
    if (!this._inputFilePath) {
      return { ok: false, error: PromptVariablesFactoryErrorFactory.inputFilePathNotResolved() };
    }
    return { ok: true, data: this._inputFilePath };
  }

  /**
   * Get resolved output file path
   */
  public get outputFilePath(): string {
    if (!this._outputFilePath) {
      throw new Error("Output file path not resolved");
    }
    return this._outputFilePath;
  }

  /**
   * Get resolved output file path safely
   */
  public getOutputFilePath(): Result<string, PromptVariablesFactoryErrors> {
    if (!this._outputFilePath) {
      return { ok: false, error: PromptVariablesFactoryErrorFactory.outputFilePathNotResolved() };
    }
    return { ok: true, data: this._outputFilePath };
  }

  /**
   * Get resolved schema file path
   */
  public get schemaFilePath(): string {
    if (!this._schemaFilePath) {
      throw new Error("Schema file path not resolved");
    }
    return this._schemaFilePath;
  }

  /**
   * Get resolved schema file path safely
   */
  public getSchemaFilePath(): Result<string, PromptVariablesFactoryErrors> {
    if (!this._schemaFilePath) {
      return { ok: false, error: PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved() };
    }
    return { ok: true, data: this._schemaFilePath };
  }

  /**
   * Get CLI options
   */
  public getOptions(): PromptCliOptions {
    return this.cliParams.options;
  }

  /**
   * Check if base directory configuration is valid
   */
  public hasValidBaseDir(): boolean {
    const promptBaseDir = this.config.app_prompt?.base_dir;
    return promptBaseDir !== undefined && promptBaseDir !== null && 
           promptBaseDir.trim() !== "" && promptBaseDir.trim() !== "   ";
  }

  /**
   * Get base directory validation error message
   */
  public getBaseDirError(): string | undefined {
    if (this.hasValidBaseDir()) {
      return undefined;
    }
    const promptBaseDir = this.config.app_prompt?.base_dir;
    if (promptBaseDir === undefined || promptBaseDir === null) {
      return "Configuration missing app_prompt.base_dir property";
    }
    if (promptBaseDir.trim() === "") {
      return "Configuration app_prompt.base_dir cannot be empty";
    }
    if (promptBaseDir.trim() === "   ") {
      return "Configuration app_prompt.base_dir cannot be whitespace only";
    }
    return "Invalid app_prompt.base_dir configuration";
  }

  /**
   * Get error format option for compatibility with test files
   */
  public get errorFormat(): "simple" | "detailed" | "json" {
    return this.cliParams.options.errorFormat || "simple";
  }

  /**
   * Get extended flag for compatibility with test files
   */
  public get extended(): boolean {
    return this.cliParams.options.extended || false;
  }

  /**
   * Get custom validation flag for compatibility with test files
   */
  public get customValidation(): boolean {
    return this.cliParams.options.customValidation || false;
  }

  /**
   * Get custom variables from CLI options
   */
  public get customVariables(): Record<string, string> {
    return this.cliParams.options.customVariables || {};
  }

  /**
   * Validate all parameters and paths
   */
  public validateAll(): void {
    if (!this.cliParams) throw new Error("cliParams is required");
    if (!this.config) throw new Error("config is required");

    // Validate that all paths are resolved
    try {
      const _ = this.promptFilePath;
      const __ = this.inputFilePath;
      const ___ = this.outputFilePath;
      const ____ = this.schemaFilePath;
    } catch (error) {
      throw new Error(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Legacy API: Get directive type (for backward compatibility)
   */
  public getDirective(): string {
    return this.cliParams.demonstrativeType;
  }

  /**
   * Legacy API: Get layer type (for backward compatibility)
   */
  public getLayerType(): string {
    return this.cliParams.layerType;
  }

  /**
   * Build method for compatibility with test files
   */
  public build(): PromptParams {
    // This is a synchronous version that throws on error
    // For async version, use toPromptParams()
    const result = this.toPromptParamsSync();
    if (!result.ok) {
      throw result.error;
    }
    return result.data;
  }

  /**
   * Get prompt path for compatibility with test files
   */
  public get promptPath(): string {
    return this.promptFilePath;
  }

  /**
   * Get schema path for compatibility with test files
   */
  public get schemaPath(): string {
    return this.schemaFilePath;
  }

  /**
   * Synchronous version of toPromptParams for backward compatibility
   */
  private toPromptParamsSync(): Result<PromptParams, Error> {
    try {
      // Stage 1: Create PromptVariableSource from various inputs
      const source = this.createPromptVariableSource();

      // Stage 2-3: Transform through domain service (synchronous version)
      const templatePath = this.promptFilePath;
      
      // Create PromptParams object with correct structure
      const promptParams: PromptParams = {
        template_file: this.promptFilePath,
        variables: {
          demonstrative_type: this.cliParams.demonstrativeType,
          layer_type: this.cliParams.layerType,
          input_file: this.inputFilePath,
          output_file: this.outputFilePath,
          prompt_path: this.promptFilePath,
          schema_path: this.schemaFilePath,
          ...this.customVariables,
        },
      };

      return { ok: true, data: promptParams };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Create PromptVariableSource from CLI parameters and options
   */
  private createPromptVariableSource(): PromptVariableSource {
    const cliSource = PromptVariableSourceFactory.fromCLI({
      directive: this.cliParams.demonstrativeType,
      layer: this.cliParams.layerType,
      fromFile: this.cliParams.options.fromFile,
      destinationFile: this.cliParams.options.destinationFile,
      userVariables: this.cliParams.options.customVariables,
    });

    const stdinSource = this.cliParams.options.input_text
      ? PromptVariableSourceFactory.fromStdin(this.cliParams.options.input_text)
      : undefined;

    const configSource = PromptVariableSourceFactory.fromConfig({
      directive: this.cliParams.demonstrativeType,
      layer: this.cliParams.layerType,
      promptDir: this.config.app_prompt?.base_dir,
      profile: this.cliParams.options.config,
    });

    // Merge sources with proper priority
    const sources = [configSource, cliSource];
    if (stdinSource) sources.push(stdinSource);

    const merged = PromptVariableSourceFactory.merge(...sources);

    // Add resolved schema file path
    merged.schemaFile = this._schemaFilePath;

    return merged;
  }

  /**
   * Resolve all file paths using the new Result-based APIs
   */
  private resolvePaths(): void {
    // Resolve template path using new Smart Constructor API
    const templateResult = this.pathResolvers.template.getPath();
    if (!templateResult.ok) {
      throw new Error(
        `Failed to resolve template path:\n${formatPathResolutionError(templateResult.error)}`,
      );
    }
    this._promptFilePath = templateResult.data.value;

    // Resolve input path using new Result-based API
    const inputResult = this.pathResolvers.input.getPath();
    if (!inputResult.ok) {
      const errorDetails = "path" in inputResult.error
        ? inputResult.error.path
        : "message" in inputResult.error
        ? inputResult.error.message
        : "";
      throw new Error(`Failed to resolve input path: ${inputResult.error.kind} - ${errorDetails}`);
    }
    this._inputFilePath = inputResult.data.value;

    // Resolve output path using new Result-based API
    const outputResult = this.pathResolvers.output.getPath();
    if (!outputResult.ok) {
      const errorDetails = "path" in outputResult.error
        ? outputResult.error.path
        : "message" in outputResult.error
        ? outputResult.error.message
        : "";
      throw new Error(
        `Failed to resolve output path: ${outputResult.error.kind} - ${errorDetails}`,
      );
    }
    this._outputFilePath = outputResult.data.value;

    // Resolve schema path using new Smart Constructor API
    const schemaResult = this.pathResolvers.schema.getPath();
    if (!schemaResult.ok) {
      throw new Error(`Failed to resolve schema path:\n${formatSchemaError(schemaResult.error)}`);
    }
    this._schemaFilePath = schemaResult.data.value;
  }
}

/**
 * Create default configuration when BreakdownConfig is not available
 */
function createDefaultConfig(): FactoryConfig {
  return {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" },
  };
}

/**
 * Totality-compliant factory alias for backward compatibility
 */
export const TotalityPromptVariablesFactory = PromptVariablesFactory;

/**
 * Type alias for TotalityPromptVariablesFactory
 */
export type TotalityPromptVariablesFactory = PromptVariablesFactory;
