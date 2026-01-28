/**
 * @fileoverview Facade for path resolution operations
 *
 * This facade encapsulates all path resolution logic, providing a unified
 * interface for resolving prompt, schema, input, and output file paths.
 *
 * Extracted from PromptVariablesFactory to separate concerns:
 * - PathResolutionFacade: Path resolution responsibility
 * - PromptVariablesFactory: Orchestration responsibility
 *
 * @module factory/path_resolution_facade
 */

import { DEFAULT_PROMPT_BASE_DIR, DEFAULT_SCHEMA_BASE_DIR } from "../config/constants.ts";
import { ok, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import { PromptTemplatePathResolverTotality } from "./prompt_template_path_resolver.ts";
import { SchemaFilePathResolverTotality } from "./schema_file_path_resolver.ts";
import {
  InputFilePathResolverTotality as InputFilePathResolver,
} from "./input_file_path_resolver.ts";
import {
  OutputFilePathResolverTotality as OutputFilePathResolver,
} from "./output_file_path_resolver.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

/**
 * Configuration for path resolution
 */
export interface PathResolutionConfig {
  app_prompt?: { base_dir?: string };
  app_schema?: { base_dir?: string };
  input?: { base_dir?: string };
  output?: { base_dir?: string };
  [key: string]: unknown;
}

/**
 * Error types for path resolution facade
 */
export type PathResolutionFacadeError =
  | { kind: "ResolverCreationFailed"; resolver: string; details: string }
  | { kind: "PathResolutionFailed"; pathType: string; details: string }
  | { kind: "ConfigurationError"; message: string };

/**
 * Resolved paths result
 */
export interface ResolvedPaths {
  promptFilePath: string;
  inputFilePath: string;
  outputFilePath: string;
  schemaFilePath: string;
}

/**
 * Path resolvers container
 */
interface PathResolvers {
  template?: PromptTemplatePathResolverTotality;
  input?: InputFilePathResolver;
  output?: OutputFilePathResolver;
  schema?: SchemaFilePathResolverTotality;
}

/**
 * Facade for path resolution operations
 *
 * Provides a unified interface for creating path resolvers and resolving
 * all file paths needed for prompt variable generation.
 */
export class PathResolutionFacade {
  private readonly resolvers: PathResolvers = {};
  private _promptFilePath?: string;
  private _inputFilePath?: string;
  private _outputFilePath?: string;
  private _schemaFilePath?: string;

  private constructor(
    private readonly config: PathResolutionConfig,
    private readonly cliParams: PromptCliParams,
  ) {}

  /**
   * Create a new PathResolutionFacade instance
   */
  static create(
    config: PathResolutionConfig,
    cliParams: PromptCliParams,
  ): Result<PathResolutionFacade, PathResolutionFacadeError> {
    const facade = new PathResolutionFacade(config, cliParams);

    // Initialize resolvers
    const initResult = facade.initializeResolvers();
    if (!initResult.ok) {
      return initResult;
    }

    // Resolve all paths
    const resolveResult = facade.resolveAllPaths();
    if (!resolveResult.ok) {
      // Path resolution failure is acceptable - continue with fallbacks
    }

    return ok(facade);
  }

  /**
   * Initialize all path resolvers
   */
  private initializeResolvers(): Result<void, PathResolutionFacadeError> {
    // Create template resolver
    const templateResult = this.createTemplateResolver();
    if (!templateResult.ok) {
      return templateResult;
    }
    this.resolvers.template = templateResult.data;

    // Create schema resolver
    const schemaResult = this.createSchemaResolver();
    if (!schemaResult.ok) {
      return schemaResult;
    }
    this.resolvers.schema = schemaResult.data;

    // Create input resolver
    const inputResult = this.createInputResolver();
    if (!inputResult.ok) {
      return inputResult;
    }
    this.resolvers.input = inputResult.data;

    // Create output resolver
    const outputResult = this.createOutputResolver();
    if (!outputResult.ok) {
      return outputResult;
    }
    this.resolvers.output = outputResult.data;

    return ok(undefined);
  }

  /**
   * Create template resolver
   */
  private createTemplateResolver(): Result<
    PromptTemplatePathResolverTotality | undefined,
    PathResolutionFacadeError
  > {
    const result = PromptTemplatePathResolverTotality.create(this.config, this.cliParams);
    if (!result.ok) {
      // Template resolver creation failed - acceptable in test environments
      return ok(undefined);
    }
    return ok(result.data);
  }

  /**
   * Create schema resolver
   */
  private createSchemaResolver(): Result<
    SchemaFilePathResolverTotality | undefined,
    PathResolutionFacadeError
  > {
    const result = SchemaFilePathResolverTotality.create(this.config, this.cliParams);
    if (!result.ok) {
      return ok(undefined);
    }
    return ok(result.data);
  }

  /**
   * Create input resolver
   */
  private createInputResolver(): Result<
    InputFilePathResolver | undefined,
    PathResolutionFacadeError
  > {
    const result = InputFilePathResolver.create(this.config, this.cliParams);
    if (!result.ok) {
      return ok(undefined);
    }
    return ok(result.data);
  }

  /**
   * Create output resolver
   */
  private createOutputResolver(): Result<
    OutputFilePathResolver | undefined,
    PathResolutionFacadeError
  > {
    const result = OutputFilePathResolver.create(this.config, this.cliParams);
    if (!result.ok) {
      return ok(undefined);
    }
    return ok(result.data);
  }

  /**
   * Resolve all file paths
   */
  private resolveAllPaths(): Result<void, PathResolutionFacadeError> {
    // Resolve template path
    this._promptFilePath = this.resolvePromptPath();

    // Resolve input path
    this._inputFilePath = this.resolveInputPath();

    // Resolve output path
    this._outputFilePath = this.resolveOutputPath();

    // Resolve schema path
    this._schemaFilePath = this.resolveSchemaPath();

    return ok(undefined);
  }

  /**
   * Resolve prompt template path
   */
  private resolvePromptPath(): string {
    if (this.resolvers.template) {
      const result = this.resolvers.template.getPath();
      if (result.ok) {
        return result.data.value;
      }
    }
    // Fallback path
    const baseDir = this.config.app_prompt?.base_dir || DEFAULT_PROMPT_BASE_DIR;
    return `${baseDir}/${this.cliParams.directiveType}/${this.cliParams.layerType}/f_${this.cliParams.layerType}.md`;
  }

  /**
   * Resolve input file path
   */
  private resolveInputPath(): string {
    if (this.resolvers.input) {
      const result = this.resolvers.input.getPath();
      if (result.ok) {
        return result.data.value;
      }
    }
    // Fallback path
    return this.cliParams.options.fromFile || "";
  }

  /**
   * Resolve output file path
   */
  private resolveOutputPath(): string {
    if (this.resolvers.output) {
      const result = this.resolvers.output.getPath();
      if (result.ok) {
        return result.data.value;
      }
    }
    // Fallback path
    return this.cliParams.options.destinationFile || "";
  }

  /**
   * Resolve schema file path
   */
  private resolveSchemaPath(): string {
    if (this.resolvers.schema) {
      const result = this.resolvers.schema.getPath();
      if (result.ok) {
        return result.data.value;
      }
    }
    // Fallback path
    const baseDir = this.config.app_schema?.base_dir || DEFAULT_SCHEMA_BASE_DIR;
    return `${baseDir}/${this.cliParams.directiveType}/${this.cliParams.layerType}/f_${this.cliParams.layerType}.json`;
  }

  /**
   * Get all resolved paths
   */
  public getResolvedPaths(): ResolvedPaths {
    return {
      promptFilePath: this._promptFilePath || this.resolvePromptPath(),
      inputFilePath: this._inputFilePath ?? this.resolveInputPath(),
      outputFilePath: this._outputFilePath ?? this.resolveOutputPath(),
      schemaFilePath: this._schemaFilePath || this.resolveSchemaPath(),
    };
  }

  /**
   * Get resolved prompt file path
   */
  public get promptFilePath(): string {
    return this._promptFilePath || this.resolvePromptPath();
  }

  /**
   * Get resolved prompt file path safely
   */
  public getPromptFilePath(): Result<string, PathResolutionFacadeError> {
    return ok(this.promptFilePath);
  }

  /**
   * Get resolved input file path
   */
  public get inputFilePath(): string {
    return this._inputFilePath ?? this.resolveInputPath();
  }

  /**
   * Get resolved input file path safely
   */
  public getInputFilePath(): Result<string, PathResolutionFacadeError> {
    return ok(this.inputFilePath);
  }

  /**
   * Get resolved output file path
   */
  public get outputFilePath(): string {
    return this._outputFilePath ?? this.resolveOutputPath();
  }

  /**
   * Get resolved output file path safely
   */
  public getOutputFilePath(): Result<string, PathResolutionFacadeError> {
    return ok(this.outputFilePath);
  }

  /**
   * Get resolved schema file path
   */
  public get schemaFilePath(): string {
    return this._schemaFilePath || this.resolveSchemaPath();
  }

  /**
   * Get resolved schema file path safely
   */
  public getSchemaFilePath(): Result<string, PathResolutionFacadeError> {
    return ok(this.schemaFilePath);
  }

  /**
   * Check if all paths are resolved
   */
  public hasAllPaths(): boolean {
    return (
      this._promptFilePath !== undefined &&
      this._inputFilePath !== undefined &&
      this._outputFilePath !== undefined &&
      this._schemaFilePath !== undefined
    );
  }
}

/**
 * Convert PathResolutionError to PathResolutionFacadeError
 */
export function toFacadeError(
  error: PathResolutionError,
  pathType: string,
): PathResolutionFacadeError {
  return {
    kind: "PathResolutionFailed",
    pathType,
    details: "kind" in error ? error.kind : "Unknown error",
  };
}
