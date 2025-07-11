/**
 * @fileoverview PromptVariableTransformer - 3-stage transformation domain service
 *
 * This domain service implements the core transformation logic for converting
 * raw input data through three distinct stages to produce the final PromptParams.
 *
 * The 3-stage transformation process:
 * Stage 1: PromptVariableSource (raw materials) -> Unvalidated input
 * Stage 2: PromptVariables (validated components) -> Type-safe variables
 * Stage 3: PromptParams (final form) -> Ready for @tettuan/breakdownprompt
 *
 * @module domain/prompt_variable_transformer
 */

import type { PromptParams } from "@tettuan/breakdownprompt";
import type { Result } from "../types/result.ts";
import type { PromptVariableSource } from "../types/prompt_variable_source.ts";
import type { PromptVariables } from "../types/prompt_variables.ts";
import type { VariableError } from "../types/variable_result.ts";
import {
  createPromptParams,
  FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "../types/prompt_variables.ts";
import type { PathResolutionOption } from "../types/path_resolution_option.ts";

/**
 * Error types for transformation stages
 */
export interface TransformationError {
  stage: "source" | "variables" | "params";
  field?: string;
  message: string;
  details?: unknown;
}

/**
 * Result type for transformation operations
 */
export type TransformationResult<T> = Result<T, TransformationError[]>;

/**
 * Configuration for the transformer
 */
export interface TransformerConfig {
  /** Path resolution options */
  pathOptions?: PathResolutionOption;

  /** Whether to validate file paths */
  validatePaths?: boolean;

  /** Whether to allow empty values */
  allowEmpty?: boolean;
}

/**
 * Domain service for 3-stage prompt variable transformation
 *
 * This service encapsulates the complex transformation logic,
 * ensuring data flows correctly through each stage while
 * maintaining type safety and validation.
 */
export class PromptVariableTransformer {
  constructor(private readonly config: TransformerConfig = {}) {}

  /**
   * Complete 3-stage transformation from source to params
   */
  async transform(
    source: PromptVariableSource,
    templatePath: string,
  ): Promise<TransformationResult<PromptParams>> {
    // Stage 1 -> Stage 2
    const variablesResult = await this.sourceToVariables(source);
    if (!variablesResult.ok) {
      return variablesResult;
    }

    // Stage 2 -> Stage 3
    return this.variablesToParams(variablesResult.data, templatePath);
  }

  /**
   * Stage 1 -> Stage 2: Transform raw source to validated variables
   */
  async sourceToVariables(
    source: PromptVariableSource,
  ): Promise<TransformationResult<PromptVariables>> {
    const variables: PromptVariables = [];
    const errors: TransformationError[] = [];

    // Transform directive type
    if (source.directive) {
      const varResult = StandardVariable.create("demonstrative_type", source.directive);
      if (varResult.ok) {
        variables.push(varResult.data);
      } else {
        errors.push({
          stage: "variables",
          field: "directive",
          message: this.formatVariableError(varResult.error),
        });
      }
    }

    // Transform layer type
    if (source.layer) {
      const varResult = StandardVariable.create("layer_type", source.layer);
      if (varResult.ok) {
        variables.push(varResult.data);
      } else {
        errors.push({
          stage: "variables",
          field: "layer",
          message: this.formatVariableError(varResult.error),
        });
      }
    }

    // Transform input file
    if (source.inputFile) {
      const pathResult = await this.transformPath(source.inputFile, "input");
      if (pathResult.ok) {
        const varResult = StandardVariable.create("input_text_file", pathResult.data);
        if (varResult.ok) {
          variables.push(varResult.data);
        } else {
          errors.push({
            stage: "variables",
            field: "inputFile",
            message: this.formatVariableError(varResult.error),
          });
        }
      } else {
        errors.push({
          stage: "variables",
          field: "inputFile",
          message: pathResult.error.message,
        });
      }
    }

    // Transform destination path
    if (source.destinationPath) {
      const pathResult = await this.transformPath(source.destinationPath, "output");
      if (pathResult.ok) {
        const varResult = StandardVariable.create("destination_path", pathResult.data);
        if (varResult.ok) {
          variables.push(varResult.data);
        } else {
          errors.push({
            stage: "variables",
            field: "destinationPath",
            message: this.formatVariableError(varResult.error),
          });
        }
      } else {
        errors.push({
          stage: "variables",
          field: "destinationPath",
          message: pathResult.error.message,
        });
      }
    }

    // Transform schema file
    if (source.schemaFile) {
      const pathResult = await this.transformPath(source.schemaFile, "schema");
      if (pathResult.ok) {
        const varResult = FilePathVariable.create("schema_file", pathResult.data);
        if (varResult.ok) {
          variables.push(varResult.data);
        } else {
          errors.push({
            stage: "variables",
            field: "schemaFile",
            message: this.formatVariableError(varResult.error),
          });
        }
      } else {
        errors.push({
          stage: "variables",
          field: "schemaFile",
          message: pathResult.error.message,
        });
      }
    }

    // Transform stdin content
    if (source.stdinContent) {
      const varResult = StdinVariable.create("input_text", source.stdinContent);
      if (varResult.ok) {
        variables.push(varResult.data);
      } else {
        errors.push({
          stage: "variables",
          field: "stdinContent",
          message: this.formatVariableError(varResult.error),
        });
      }
    }

    // Transform user variables
    if (source.userVariables) {
      for (const [name, value] of Object.entries(source.userVariables)) {
        const varResult = UserVariable.create(name, value);
        if (varResult.ok) {
          variables.push(varResult.data);
        } else {
          errors.push({
            stage: "variables",
            field: "userVariables",
            message: `${name}: ${this.formatVariableError(varResult.error)}`,
          });
        }
      }
    }

    // Check for minimum required variables
    if (variables.length === 0 && !this.config.allowEmpty) {
      errors.push({
        stage: "variables",
        message: "No valid variables could be created from source",
      });
    }

    if (errors.length > 0) {
      return { ok: false, error: errors };
    }

    return { ok: true, data: variables };
  }

  /**
   * Stage 2 -> Stage 3: Transform variables to final params
   */
  variablesToParams(
    variables: PromptVariables,
    templatePath: string,
  ): TransformationResult<PromptParams> {
    try {
      const params = createPromptParams(templatePath, variables);
      return { ok: true, data: params };
    } catch (error) {
      return {
        ok: false,
        error: [{
          stage: "params",
          message: "Failed to create prompt params",
          details: error,
        }],
      };
    }
  }

  /**
   * Format VariableError to string message
   */
  private formatVariableError(error: VariableError): string {
    if (error.kind === "InvalidName") {
      return `Invalid name '${error.name}'. Valid names: ${error.validNames.join(", ")}`;
    } else if (error.kind === "EmptyValue") {
      return `${error.reason}`;
    } else if (error.kind === "ValidationFailed") {
      return `Validation failed: ${error.constraint}`;
    }
    return "Unknown variable error";
  }

  /**
   * Transform and validate file paths
   */
  private transformPath(
    raw: string,
    type: "input" | "output" | "schema",
  ): Promise<Result<string, TransformationError>> {
    // Basic validation
    if (!raw || raw.trim().length === 0) {
      return Promise.resolve({
        ok: false,
        error: {
          stage: "variables",
          field: type,
          message: `${type} path cannot be empty`,
        },
      });
    }

    // Path validation if enabled
    if (this.config.validatePaths && this.config.pathOptions) {
      // TODO: Integrate with path resolution service
      // For now, just return the cleaned path
      return Promise.resolve({ ok: true, data: raw.trim() });
    }

    return Promise.resolve({ ok: true, data: raw.trim() });
  }
}

/**
 * Factory for creating transformer instances
 */
export class TransformerFactory {
  /**
   * Create a default transformer
   */
  static createDefault(): PromptVariableTransformer {
    return new PromptVariableTransformer({
      validatePaths: false,
      allowEmpty: false,
    });
  }

  /**
   * Create a transformer with path validation
   */
  static createWithPathValidation(
    pathOptions: PathResolutionOption,
  ): PromptVariableTransformer {
    return new PromptVariableTransformer({
      pathOptions,
      validatePaths: true,
      allowEmpty: false,
    });
  }

  /**
   * Create a lenient transformer (for testing)
   */
  static createLenient(): PromptVariableTransformer {
    return new PromptVariableTransformer({
      validatePaths: false,
      allowEmpty: true,
    });
  }
}
