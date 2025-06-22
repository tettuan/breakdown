/**
 * @fileoverview Centralized factory for prompt variable resolution and parameter construction.
 *
 * This module provides the core factory class for resolving file paths, constructing
 * parameters, and managing variables required for Breakdown prompt generation. It serves
 * as the central orchestrator for integrating configuration, CLI parameters, and
 * various path resolvers into a cohesive system.
 *
 * The factory handles the complex task of coordinating multiple JSR packages
 * (@tettuan/breakdownconfig, @tettuan/breakdownparams, @tettuan/breakdownprompt)
 * and internal path resolvers to provide a unified interface for prompt processing.
 *
 * @module factory/prompt_variables_factory
 * @see {@link https://tettuan.github.io/breakdown/docs/breakdown/app_factory.ja.md} Factory Documentation
 */

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

/**
 * Parameters for CLI prompt operations.
 *
 * Defines the complete parameter structure used throughout the Breakdown system
 * for configuring prompt generation, file resolution, and processing options.
 * This interface serves as the primary data contract between CLI argument parsing
 * and the prompt generation pipeline.
 *
 * @example Basic prompt parameters
 * ```typescript
 * const params: PromptCliParams = {
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {
 *     fromFile: "requirements.md",
 *     destinationFile: "output/"
 *   }
 * };
 * ```
 *
 * @example Advanced configuration with custom variables
 * ```typescript
 * const advancedParams: PromptCliParams = {
 *   demonstrativeType: "summary",
 *   layerType: "issue",
 *   options: {
 *     extended: true,
 *     customVariables: {
 *       "project-name": "my-app",
 *       "version": "1.0.0"
 *     },
 *     errorFormat: "json",
 *     config: "production"
 *   }
 * };
 * ```
 */
export interface PromptCliParams {
  /**
   * The demonstrative type for the prompt operation.
   * @property demonstrativeType - Specifies the type of operation (e.g., 'to', 'summary', 'defect')
   * that determines the prompt template and processing behavior
   */
  demonstrativeType: DemonstrativeType;

  /**
   * The layer type for the prompt target.
   * @property layerType - Specifies the target layer (e.g., 'project', 'issue', 'task')
   * in the 3-tier Breakdown architecture
   */
  layerType: LayerType;

  /**
   * Configuration options for prompt generation and file resolution.
   * @property options - Container for all optional parameters that control
   * various aspects of the prompt generation process
   */
  options: {
    /**
     * The input file path for processing.
     * @property fromFile - Path to the source file containing requirements or content
     * to be processed by the prompt system
     */
    fromFile?: string;

    /**
     * The destination file or directory path.
     * @property destinationFile - Output location for generated content,
     * can be a file path or directory path
     */
    destinationFile?: string;

    /**
     * The adaptation type for specialized prompt behavior.
     * @property adaptation - Modifier that adjusts prompt generation
     * for specific use cases or output formats
     */
    adaptation?: string;

    /**
     * Custom directory for prompt template files.
     * @property promptDir - Override the default prompt template directory
     * for custom or project-specific templates
     */
    promptDir?: string;

    /**
     * The layer type inferred from input analysis.
     * @property fromLayerType - Automatically detected source layer type
     * based on input content structure
     */
    fromLayerType?: string;

    /**
     * Input text content from stdin or direct input.
     * @property input_text - Raw text content to be processed,
     * typically from stdin or direct parameter input
     */
    input_text?: string;

    /**
     * Custom variables specified with --uv-* CLI options.
     * @property customVariables - User-defined variables that extend
     * the default variable set for template processing
     */
    customVariables?: Record<string, string>;

    /**
     * Extended mode flag for enhanced processing.
     * @property extended - Enables additional processing features
     * and more detailed output generation
     */
    extended?: boolean;

    /**
     * Custom validation flag for specialized validation rules.
     * @property customValidation - Enables custom validation logic
     * beyond standard validation procedures
     */
    customValidation?: boolean;

    /**
     * Error format specification for error reporting.
     * @property errorFormat - Controls the format of error messages
     * for different integration scenarios
     */
    errorFormat?: "simple" | "detailed" | "json";

    /**
     * Custom configuration file identifier.
     * @property config - Specifies which configuration set to use
     * from the available configuration profiles
     */
    config?: string;
  };
}

type DoubleParamsResult = PromptCliParams;

import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";

/**
 * Configuration options for creating a PromptVariablesFactory instance.
 *
 * Defines the required configuration structure and CLI parameters needed
 * to initialize the factory. This interface ensures type safety when
 * passing configuration data from BreakdownConfig and CLI parameter parsing.
 *
 * @example Factory initialization
 * ```typescript
 * const options: PromptVariablesFactoryOptions = {
 *   config: await breakdownConfig.getConfig(),
 *   cliParams: {
 *     demonstrativeType: "to",
 *     layerType: "project",
 *     options: {}
 *   }
 * };
 * ```
 */
export interface PromptVariablesFactoryOptions {
  /**
   * Application configuration from BreakdownConfig.
   * @property config - Complete configuration object containing prompt and schema
   * directory settings along with other application configuration
   */
  config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;

  /**
   * CLI parameters for prompt operation.
   * @property cliParams - Parsed command line parameters that define
   * the prompt operation to be performed
   */
  cliParams: PromptCliParams;
}

// --- サブクラス定義削除 ---

/**
 * Central factory for resolving paths and constructing parameters for Breakdown operations.
 *
 * The PromptVariablesFactory serves as the primary orchestrator for integrating
 * configuration management, path resolution, and parameter construction into a
 * unified system. It coordinates multiple specialized resolver classes and provides
 * a clean interface for accessing all required paths and parameters.
 *
 * This factory implements the factory pattern with async initialization to handle
 * configuration loading and validation. It integrates with the BreakdownConfig
 * system and multiple path resolver classes to provide comprehensive parameter
 * management for prompt generation.
 *
 * @example Basic factory creation and usage
 * ```typescript
 * import { PromptVariablesFactory } from "@tettuan/breakdown/lib/factory/prompt_variables_factory.ts";
 *
 * const cliParams = {
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {
 *     fromFile: "requirements.md",
 *     destinationFile: "output/"
 *   }
 * };
 *
 * const factory = await PromptVariablesFactory.create(cliParams);
 * const allParams = factory.getAllParams();
 * ```
 *
 * @example Factory with custom configuration
 * ```typescript
 * const breakdownConfig = new BreakdownConfig("production", "/workspace");
 * await breakdownConfig.loadConfig();
 * const config = await breakdownConfig.getConfig();
 *
 * const factory = PromptVariablesFactory.createWithConfig(config, cliParams);
 *
 * // Access individual components
 * console.log('Prompt file:', factory.promptFilePath);
 * console.log('Input file:', factory.inputFilePath);
 * console.log('Output file:', factory.outputFilePath);
 * console.log('Schema file:', factory.schemaFilePath);
 * ```
 *
 * @example Advanced usage with validation
 * ```typescript
 * const factory = await PromptVariablesFactory.create(cliParams);
 *
 * // Validate configuration
 * if (!factory.hasValidBaseDir()) {
 *   throw new Error(factory.getBaseDirError());
 * }
 *
 * // Validate all parameters
 * factory.validateAll();
 *
 * // Access advanced options
 * if (factory.extended) {
 *   console.log('Extended mode enabled');
 * }
 *
 * const customVars = factory.customVariables;
 * console.log('Custom variables:', customVars);
 * ```
 */
export class PromptVariablesFactory {
  private config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  /**
   * The CLI parameters used for prompt generation and file resolution.
   */
  public readonly cliParams: PromptCliParams;
  private baseDirOverride?: string;
  private _baseDirError?: string;

  private promptPathResolver: PromptTemplatePathResolver;
  private inputPathResolver: InputFilePathResolver;
  private outputPathResolver: OutputFilePathResolver;
  private schemaPathResolver: SchemaFilePathResolver;

  /**
   * Private constructor for PromptVariablesFactory.
   *
   * Initializes the factory with configuration and CLI parameters, setting up
   * all required path resolvers and performing initial validation. This constructor
   * is private to enforce the use of static factory methods for proper async
   * initialization.
   *
   * @param config - Application configuration with prompt and schema settings
   * @param cliParams - CLI parameters defining the operation to perform
   * @param baseDirOverride - Optional override for the base directory
   *
   * @throws {Error} When prompt base_dir is not configured or is empty
   */
  private constructor(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: PromptCliParams,
    baseDirOverride?: string,
  ) {
    this.config = config;
    this.cliParams = cliParams;
    this.baseDirOverride = baseDirOverride;

    // Validate base_dir configuration
    if (!config.app_prompt?.base_dir || config.app_prompt.base_dir.trim() === "") {
      this._baseDirError = "Prompt base_dir must be set in configuration";
    }

    this.promptPathResolver = new PromptTemplatePathResolver(config, cliParams);
    this.inputPathResolver = new InputFilePathResolver(config, cliParams);
    this.outputPathResolver = new OutputFilePathResolver(config, cliParams);
    this.schemaPathResolver = new SchemaFilePathResolver(config, cliParams);
  }

  /**
   * Factory method to create PromptVariablesFactory with automatic configuration loading.
   *
   * This is the primary method for creating factory instances. It automatically
   * loads the appropriate configuration based on the CLI parameters and initializes
   * all path resolvers. The method handles the async configuration loading process
   * and ensures proper factory initialization.
   *
   * @param cliParams - CLI parameters defining the operation and options
   * @returns Promise<PromptVariablesFactory> - Fully initialized factory instance
   *
   * @throws {Error} When configuration loading fails
   * @throws {Error} When required configuration values are missing
   *
   * @example Basic factory creation
   * ```typescript
   * const params = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: { fromFile: "input.md" }
   * };
   *
   * const factory = await PromptVariablesFactory.create(params);
   * ```
   *
   * @example Factory creation with custom config
   * ```typescript
   * const params = {
   *   demonstrativeType: "summary",
   *   layerType: "issue",
   *   options: { config: "production" }
   * };
   *
   * const factory = await PromptVariablesFactory.create(params);
   * ```
   */
  static async create(cliParams: PromptCliParams): Promise<PromptVariablesFactory> {
    const configSetName = cliParams.options.config || "default";
    const breakdownConfig = new BreakdownConfig(configSetName, Deno.cwd());
    await breakdownConfig.loadConfig();
    const config = await breakdownConfig.getConfig();
    return new PromptVariablesFactory(config, cliParams);
  }

  /**
   * Factory method to create PromptVariablesFactory with pre-loaded configuration.
   *
   * This method allows creation of factory instances when configuration has already
   * been loaded externally. It's useful for scenarios where configuration loading
   * is handled separately or when reusing configuration across multiple factory
   * instances.
   *
   * @param config - Pre-loaded configuration object with required prompt and schema settings
   * @param cliParams - CLI parameters defining the operation to perform
   * @returns PromptVariablesFactory - Initialized factory instance
   *
   * @example Using pre-loaded configuration
   * ```typescript
   * const breakdownConfig = new BreakdownConfig("development");
   * await breakdownConfig.loadConfig();
   * const config = await breakdownConfig.getConfig();
   *
   * const factory = PromptVariablesFactory.createWithConfig(config, cliParams);
   * ```
   *
   * @example Reusing configuration for multiple factories
   * ```typescript
   * const config = await loadSharedConfig();
   *
   * const factory1 = PromptVariablesFactory.createWithConfig(config, params1);
   * const factory2 = PromptVariablesFactory.createWithConfig(config, params2);
   * ```
   */
  static createWithConfig(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: PromptCliParams,
  ): PromptVariablesFactory {
    return new PromptVariablesFactory(config, cliParams);
  }

  /**
   * Retrieves all main parameters required for prompt processing.
   *
   * This method provides a convenient way to access all the essential
   * file paths and variables in a single call. It's particularly useful
   * when passing parameters to external systems or for comprehensive
   * parameter validation.
   *
   * @returns Object containing all resolved file paths and custom variables
   *
   * @example Getting all parameters for prompt processing
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const allParams = factory.getAllParams();
   *
   * console.log('Prompt template:', allParams.promptFilePath);
   * console.log('Input file:', allParams.inputFilePath);
   * console.log('Output destination:', allParams.outputFilePath);
   * console.log('Schema file:', allParams.schemaFilePath);
   * console.log('Custom variables:', allParams.customVariables);
   * ```
   *
   * @example Using parameters with external prompt engine
   * ```typescript
   * const params = factory.getAllParams();
   * const promptEngine = new PromptEngine();
   *
   * const result = await promptEngine.process({
   *   template: params.promptFilePath,
   *   input: params.inputFilePath,
   *   output: params.outputFilePath,
   *   schema: params.schemaFilePath,
   *   variables: params.customVariables
   * });
   * ```
   */
  public getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: Record<string, string>;
  } {
    return {
      promptFilePath: this.promptFilePath,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      schemaFilePath: this.schemaFilePath,
      customVariables: this.customVariables,
    };
  }

  /**
   * Retrieves the CLI options from the current parameters.
   *
   * Provides access to all CLI options that were specified during factory
   * creation. This includes file paths, flags, custom variables, and other
   * configuration options that control prompt generation behavior.
   *
   * @returns The options object containing all CLI-specified parameters
   *
   * @example Accessing CLI options
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const options = factory.getOptions();
   *
   * if (options.extended) {
   *   console.log('Extended mode is enabled');
   * }
   *
   * if (options.customVariables) {
   *   console.log('Custom variables:', options.customVariables);
   * }
   * ```
   */
  public getOptions(): PromptCliParams["options"] {
    return this.cliParams.options;
  }

  /**
   * Validates all parameters and paths for completeness and correctness.
   *
   * Performs comprehensive validation of all required parameters and file paths
   * to ensure the factory is properly configured for prompt processing. This
   * method should be called before using the factory for actual operations.
   *
   * @throws {Error} When required CLI parameters are missing
   * @throws {Error} When configuration is not loaded
   * @throws {Error} When prompt file path cannot be resolved
   * @throws {Error} When schema file path cannot be resolved
   *
   * @example Basic validation
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * try {
   *   factory.validateAll();
   *   console.log('All parameters are valid');
   * } catch (error) {
   *   console.error('Validation failed:', error.message);
   * }
   * ```
   *
   * @example Validation with error handling
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * if (!factory.hasValidBaseDir()) {
   *   throw new Error(`Base directory error: ${factory.getBaseDirError()}`);
   * }
   *
   * factory.validateAll(); // Will throw if other validation fails
   * ```
   */
  public validateAll(): void {
    if (!this.cliParams) throw new Error("cliParams is required");
    if (!this.config) throw new Error("config is required");
    if (!this.promptFilePath) throw new Error("Prompt file path is required");
    if (!this.schemaFilePath) throw new Error("Schema file path is required");
    // Input and output file paths may be empty - this is acceptable
  }

  /**
   * Gets the resolved path to the prompt template file.
   *
   * Returns the fully resolved path to the prompt template file based on
   * the demonstrative type, layer type, and configuration settings. This
   * path is used by the prompt processing engine to load the appropriate
   * template for the requested operation.
   *
   * @returns The absolute path to the prompt template file
   *
   * @example Accessing prompt file path
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const promptPath = factory.promptFilePath;
   *
   * console.log('Using prompt template:', promptPath);
   * // Example output: '/workspace/.breakdown/prompts/to/project.md'
   * ```
   */
  public get promptFilePath(): string {
    return this.promptPathResolver.getPath();
  }
  /**
   * Gets the resolved path to the input file.
   *
   * Returns the fully resolved path to the input file that contains the
   * source content to be processed. This may be a file specified via CLI
   * arguments or resolved based on configuration and naming conventions.
   *
   * @returns The absolute path to the input file, or empty string if no input file
   *
   * @example Accessing input file path
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const inputPath = factory.inputFilePath;
   *
   * if (inputPath) {
   *   console.log('Processing input file:', inputPath);
   * } else {
   *   console.log('No input file specified, using stdin');
   * }
   * ```
   */
  public get inputFilePath(): string {
    return this.inputPathResolver.getPath();
  }
  /**
   * Gets the resolved path for output destination.
   *
   * Returns the path where generated content should be written. This may be
   * a specific file path or a directory path, depending on the CLI options
   * and operation type. The path resolution handles both absolute and
   * relative path specifications.
   *
   * @returns The absolute path for output destination
   *
   * @example Accessing output file path
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const outputPath = factory.outputFilePath;
   *
   * console.log('Output will be written to:', outputPath);
   * // Example output: '/workspace/output/project_breakdown.md'
   * ```
   */
  public get outputFilePath(): string {
    return this.outputPathResolver.getPath();
  }
  /**
   * Gets the resolved path to the JSON schema file.
   *
   * Returns the fully resolved path to the JSON schema file that defines
   * the structure and validation rules for the generated content. This
   * schema is used to ensure output consistency and enable validation.
   *
   * @returns The absolute path to the JSON schema file
   *
   * @example Accessing schema file path
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const schemaPath = factory.schemaFilePath;
   *
   * console.log('Using schema file:', schemaPath);
   * // Example output: '/workspace/.breakdown/schemas/project.json'
   * ```
   */
  public get schemaFilePath(): string {
    return this.schemaPathResolver.getPath();
  }

  /**
   * Gets the custom variables specified via CLI options.
   *
   * Returns a record of custom variables that were specified using --uv-*
   * command line options. These variables extend the default template
   * variable set and can be used for customization and parameterization
   * of prompt templates.
   *
   * @returns Record of custom variable names and values
   *
   * @example Accessing custom variables
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const customVars = factory.customVariables;
   *
   * Object.entries(customVars).forEach(([key, value]) => {
   *   console.log(`Custom variable ${key}: ${value}`);
   * });
   * // Example output: Custom variable project-name: my-app
   * ```
   *
   * @example Using custom variables in templates
   * ```typescript
   * const vars = factory.customVariables;
   * if (vars['project-name']) {
   *   console.log(`Processing project: ${vars['project-name']}`);
   * }
   * ```
   */
  public get customVariables(): Record<string, string> {
    return this.cliParams.options.customVariables || {};
  }

  /**
   * Gets the extended mode flag status.
   *
   * Returns whether extended mode has been enabled via the --extended CLI option.
   * Extended mode typically enables additional processing features, more detailed
   * output generation, and enhanced validation procedures.
   *
   * @returns True if extended mode is enabled, false otherwise
   *
   * @example Checking extended mode
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * if (factory.extended) {
   *   console.log('Extended mode enabled - using detailed processing');
   *   // Enable additional features
   * } else {
   *   console.log('Standard mode - using basic processing');
   * }
   * ```
   */
  public get extended(): boolean {
    return this.cliParams.options.extended || false;
  }

  /**
   * Gets the custom validation flag status.
   *
   * Returns whether custom validation has been enabled via the --custom-validation
   * CLI option. Custom validation enables specialized validation rules beyond
   * the standard validation procedures.
   *
   * @returns True if custom validation is enabled, false otherwise
   *
   * @example Using custom validation
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * if (factory.customValidation) {
   *   console.log('Custom validation enabled');
   *   // Apply additional validation rules
   * }
   * ```
   */
  public get customValidation(): boolean {
    return this.cliParams.options.customValidation || false;
  }

  /**
   * Gets the error format specification.
   *
   * Returns the format that should be used for error reporting, as specified
   * by the --error-format CLI option. This allows different integration
   * scenarios to receive errors in their preferred format.
   *
   * @returns The error format type ("simple", "detailed", or "json")
   *
   * @example Handling different error formats
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   * const errorFormat = factory.errorFormat;
   *
   * switch (errorFormat) {
   *   case 'simple':
   *     console.log('Using simple error messages');
   *     break;
   *   case 'detailed':
   *     console.log('Using detailed error messages');
   *     break;
   *   case 'json':
   *     console.log('Using JSON-formatted error messages');
   *     break;
   * }
   * ```
   */
  public get errorFormat(): "simple" | "detailed" | "json" {
    return this.cliParams.options.errorFormat || "simple";
  }

  /**
   * Checks if the configured base directory is valid.
   *
   * Validates that the prompt base directory is properly configured and not
   * empty. This is a critical configuration requirement for proper factory
   * operation, as the base directory is used for resolving all template paths.
   *
   * @returns True if base directory is valid, false if missing or empty
   *
   * @example Validating base directory before processing
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * if (!factory.hasValidBaseDir()) {
   *   const error = factory.getBaseDirError();
   *   throw new Error(`Configuration error: ${error}`);
   * }
   *
   * // Safe to proceed with prompt processing
   * factory.validateAll();
   * ```
   */
  public hasValidBaseDir(): boolean {
    return !this._baseDirError;
  }

  /**
   * Gets the base directory validation error message.
   *
   * Returns a descriptive error message if the base directory configuration
   * is invalid. This method should be used in conjunction with hasValidBaseDir()
   * to provide meaningful error feedback to users.
   *
   * @returns Error message if base directory is invalid, undefined if valid
   *
   * @example Getting base directory error details
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * if (!factory.hasValidBaseDir()) {
   *   const errorMessage = factory.getBaseDirError();
   *   console.error('Base directory configuration error:', errorMessage);
   *   process.exit(1);
   * }
   * ```
   *
   * @example Comprehensive error handling
   * ```typescript
   * const factory = await PromptVariablesFactory.create(cliParams);
   *
   * const baseDirError = factory.getBaseDirError();
   * if (baseDirError) {
   *   throw new Error(`Cannot initialize factory: ${baseDirError}`);
   * }
   * ```
   */
  public getBaseDirError(): string | undefined {
    return this._baseDirError;
  }
}
