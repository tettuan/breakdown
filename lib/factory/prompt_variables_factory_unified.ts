/**
 * @fileoverview Unified factory for prompt variable resolution with Totality principle
 *
 * This module provides the unified factory implementation that replaces the legacy
 * dual-system approach. It uses only Totality-compliant types while maintaining
 * backward compatibility through adapter patterns.
 *
 * @module factory/prompt_variables_factory_unified
 */

import { DirectiveType, TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../types/layer_type.ts";
import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Configuration options for prompt generation and file resolution.
 * This interface is shared across all parameter types.
 */
export interface PromptCliOptions {
  fromFile?: string;
  destinationFile?: string;
  adaptation?: string;
  promptDir?: string;
  fromLayerType?: string;
  useSchema?: boolean;
  input_text?: string;
  customVariables?: Record<string, string>;
  extended?: boolean;
  customValidation?: boolean;
  errorFormat?: "simple" | "detailed" | "json";
  config?: string;
}

/**
 * Unified CLI parameters using Totality-compliant types.
 * This is the single parameter type that replaces both legacy types.
 */
export interface UnifiedPromptCliParams {
  /**
   * The validated directive type for the prompt operation.
   */
  directive: DirectiveType;

  /**
   * The validated layer type for the prompt target.
   */
  layer: LayerType;

  /**
   * Configuration options for prompt generation.
   */
  options: PromptCliOptions;
}

/**
 * Interface for providing validation patterns to type construction
 */
interface TypePatternProvider {
  getDirectivePattern(): TwoParamsDirectivePattern | null;
  getLayerTypePattern(): TwoParamsLayerTypePattern | null;
}

/**
 * Simple configuration-based TypePatternProvider implementation
 */
class SimplePatternProvider implements TypePatternProvider {
  constructor(private config: Record<string, unknown>) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    const pattern = "to|summary|defect|init|find";
    return TwoParamsDirectivePattern.create(pattern);
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    const pattern = "project|issue|task|bugs|temp";
    return TwoParamsLayerTypePattern.create(pattern);
  }
}

/**
 * Default configuration factory for when BreakdownConfig is not available
 */
function createDefaultConfig(): Record<string, unknown> {
  return {
    app_prompt: {
      base_dir: "prompts",
    },
    app_schema: {
      base_dir: "schema",
    },
    working_dir: Deno.cwd(),
    params: {
      two: {
        demonstrativeType: {
          pattern: "to|summary|defect|init|find",
        },
        layerType: {
          pattern: "project|issue|task|bugs|temp",
        },
      },
    },
  };
}

/**
 * Unified factory for resolving paths and constructing parameters.
 *
 * This factory uses only Totality-compliant types and provides a clean,
 * type-safe interface for prompt variable resolution.
 */
export class UnifiedPromptVariablesFactory {
  private config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;

  private readonly cliParams: UnifiedPromptCliParams;
  private _baseDirError?: string;

  private _promptPathResolver: PromptTemplatePathResolver;
  private _inputPathResolver: InputFilePathResolver;
  private _outputPathResolver: OutputFilePathResolver;
  private _schemaPathResolver: SchemaFilePathResolver;

  /**
   * Private constructor for UnifiedPromptVariablesFactory.
   */
  private constructor(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: UnifiedPromptCliParams,
  ) {
    this.config = { ...config };
    this.cliParams = {
      directive: cliParams.directive,
      layer: cliParams.layer,
      options: { ...cliParams.options },
    };

    // Validate base_dir configuration
    if (!config.app_prompt?.base_dir || !config.app_prompt.base_dir.trim()) {
      this._baseDirError = "Prompt base_dir must be set in configuration";
    }

    // Create resolvers with unified adapter
    const resolverAdapter = this.createResolverAdapter();
    this._promptPathResolver = new PromptTemplatePathResolver(config, resolverAdapter);
    this._inputPathResolver = new InputFilePathResolver(config, resolverAdapter);
    this._outputPathResolver = new OutputFilePathResolver(config, resolverAdapter);
    this._schemaPathResolver = new SchemaFilePathResolver(config, resolverAdapter);
  }

  /**
   * Creates an adapter for PathResolvers that need legacy interface
   */
  private createResolverAdapter(): TwoParams_Result {
    return {
      type: "two",
      params: [this.cliParams.directive.getValue(), this.cliParams.layer.getValue()],
      demonstrativeType: this.cliParams.directive.getValue(),
      layerType: this.cliParams.layer.getValue(),
      options: this.cliParams.options,
    };
  }

  /**
   * Factory method to create UnifiedPromptVariablesFactory with configuration loading.
   */
  static async create(cliParams: UnifiedPromptCliParams): Promise<UnifiedPromptVariablesFactory> {
    try {
      const { BreakdownConfig } = await import("@tettuan/breakdownconfig");
      const configSetName = cliParams.options.config || "default";
      const currentDir = Deno.cwd();

      const isTestEnvironment = currentDir.includes("/tmp/") ||
        currentDir.includes("/var/folders/") ||
        Deno.env.get("DENO_TESTING") === "true" ||
        currentDir.includes("/github/breakdown");

      const workingDir = isTestEnvironment ? "." : currentDir;
      const breakdownConfigResult = await BreakdownConfig.create(configSetName, workingDir);

      if (!breakdownConfigResult.success) {
        throw new Error(
          `BreakdownConfig creation failed: ${
            breakdownConfigResult.error?.message || "Unknown error"
          }`,
        );
      }

      const breakdownConfig = breakdownConfigResult.data;
      await breakdownConfig.loadConfig();
      const config = await breakdownConfig.getConfig();
      return new UnifiedPromptVariablesFactory(config, cliParams);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Configuration validation failed")) {
        throw new Error(`Invalid application configuration: ${error.message}`);
      }

      console.warn("BreakdownConfig not available, using default config:", error);
      const config = createDefaultConfig();
      return new UnifiedPromptVariablesFactory(config, cliParams);
    }
  }

  /**
   * Factory method with pre-loaded configuration.
   */
  static createWithConfig(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: UnifiedPromptCliParams,
  ): UnifiedPromptVariablesFactory {
    return new UnifiedPromptVariablesFactory(config, cliParams);
  }

  /**
   * Retrieves all main parameters required for prompt processing.
   */
  public getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: Record<string, string>;
    directive: DirectiveType;
    layer: LayerType;
  } {
    return {
      promptFilePath: this.promptFilePath,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      schemaFilePath: this.schemaFilePath,
      customVariables: this.customVariables,
      directive: this.cliParams.directive,
      layer: this.cliParams.layer,
    };
  }

  /**
   * Gets the CLI options.
   */
  public getOptions(): PromptCliOptions {
    return this.cliParams.options;
  }

  /**
   * Validates all parameters and paths.
   */
  public validateAll(): void {
    if (!this.cliParams) throw new Error("cliParams is required");
    if (!this.config) throw new Error("config is required");
    if (!this.hasValidBaseDir()) {
      throw new Error(`Invalid base directory: ${this.getBaseDirError()}`);
    }
    if (!this.promptFilePath) throw new Error("Prompt file path is required");
    if (!this.schemaFilePath) throw new Error("Schema file path is required");
  }

  // Path accessors
  public get promptFilePath(): string {
    const result = this._promptPathResolver.getPath();
    if (!result.ok) {
      throw new Error(`Failed to get prompt path: ${result.error.kind}`);
    }
    return result.data.value;
  }

  public get inputFilePath(): string {
    const result = this._inputPathResolver.getPath();
    if (!result.ok) {
      throw new Error(`Failed to get input path: ${result.error.kind}`);
    }
    return result.data.value;
  }

  public get outputFilePath(): string {
    const result = this._outputPathResolver.getPath();
    if (!result.ok) {
      throw new Error(`Failed to get output path: ${result.error.kind}`);
    }
    return result.data.value;
  }

  public get schemaFilePath(): string {
    const result = this._schemaPathResolver.getPath();
    if (!result.ok) {
      throw new Error(`Failed to get schema path: ${result.error.kind}`);
    }
    return result.data.value;
  }

  // Option accessors
  public get customVariables(): Record<string, string> {
    return this.cliParams.options.customVariables || {};
  }

  public get extended(): boolean {
    return this.cliParams.options.extended || false;
  }

  public get customValidation(): boolean {
    return this.cliParams.options.customValidation || false;
  }

  public get errorFormat(): "simple" | "detailed" | "json" {
    return this.cliParams.options.errorFormat || "simple";
  }

  // Validation methods
  public hasValidBaseDir(): boolean {
    return !this._baseDirError;
  }

  public getBaseDirError(): string | undefined {
    return this._baseDirError;
  }

  // Type accessors
  public get directive(): DirectiveType {
    return this.cliParams.directive;
  }

  public get layer(): LayerType {
    return this.cliParams.layer;
  }
}

/**
 * Legacy adapter for backward compatibility.
 * Converts legacy parameters to unified format.
 */
export class LegacyToUnifiedAdapter {
  /**
   * Converts legacy PromptCliParams to UnifiedPromptCliParams
   */
  static async adapt(
    legacyParams: {
      demonstrativeType: string;
      layerType: string;
      options: PromptCliOptions;
    },
    patternProvider?: TypePatternProvider,
  ): Promise<UnifiedPromptCliParams> {
    const provider = patternProvider || new SimplePatternProvider(createDefaultConfig());

    // Create DirectiveType
    const directivePattern = provider.getDirectivePattern();
    if (!directivePattern) {
      throw new Error("Failed to create directive pattern");
    }

    const directive = DirectiveType.create(legacyParams.demonstrativeType);
    if (!directive) {
      throw new Error(`Invalid directive type: ${legacyParams.demonstrativeType}`);
    }

    // Create LayerType
    const layerPattern = provider.getLayerTypePattern();
    if (!layerPattern) {
      throw new Error("Failed to create layer pattern");
    }

    const layer = LayerType.create(legacyParams.layerType);
    if (!layer) {
      throw new Error(`Invalid layer type: ${legacyParams.layerType}`);
    }

    return {
      directive,
      layer,
      options: legacyParams.options,
    };
  }
}

/**
 * Re-export for backward compatibility
 */
export const PromptVariablesFactory = UnifiedPromptVariablesFactory;
export type PromptCliParams = UnifiedPromptCliParams;
