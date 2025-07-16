/**
 * @fileoverview Variables Builder following Totality Principle
 *
 * This module provides a builder pattern implementation for constructing
 * PromptVariables collections with Result type error handling.
 * It supports all variable types (Standard, FilePath, Stdin, Custom)
 * and ensures type safety through Smart Constructors.
 *
 * @module builder/variables_builder
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { PromptVariable, PromptVariables } from "../types/prompt_variables_vo.ts";
import { PromptVariablesVO } from "../types/prompt_variables_vo.ts";
// Import ErrorInfo from @tettuan/breakdownparams for unified error handling
import type { ErrorInfo } from "@tettuan/breakdownparams";
import { basename } from "jsr:@std/path@1";

// Import concrete variable types
import {
  FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "../types/prompt_variables_vo.ts";

/**
 * Factory/PathResolver value types for VariablesBuilder integration
 */
export interface FactoryResolvedValues {
  promptFilePath: string;
  inputFilePath: string;
  outputFilePath: string;
  schemaFilePath: string;
  customVariables?: Record<string, string>;
  inputText?: string; // For stdin content
}

/**
 * Builder-specific error types for variable creation following Totality Principle
 * Unified error structure to ensure all errors have consistent 'kind' property
 */
export type BuilderVariableError =
  | { kind: "DuplicateVariable"; name: string }
  | { kind: "InvalidPrefix"; name: string; expectedPrefix: string }
  | { kind: "FactoryValueMissing"; field: string }
  | { kind: "InvalidName"; name: string; reason: string }
  | { kind: "ValidationError"; source: string; reason: string };

/**
 * Builder for constructing PromptVariables with Result type error handling
 *
 * @example
 * ```typescript
 * const _builder = new VariablesBuilder();
 * const result = builder
 *   .addStandardVariable("input_text_file", "/path/to/file.txt")
 *   .addFilePathVariable("schema_file", "/path/to/schema.json")
 *   .addStdinVariable("sample input text")
 *   .addUserVariable("uv-custom", "custom value")
 *   .build();
 *
 * if (result.ok) {
 *   const variables = result.data;
 *   const record = builder.toRecord();
 * }
 * ```
 */
export class VariablesBuilder {
  private _variables: PromptVariable[] = [];
  private _errors: BuilderVariableError[] = [];

  /**
   * Convert ValidationError to BuilderVariableError
   */
  private convertValidationError(validationError: any): BuilderVariableError {
    // Map ValidationError to BuilderVariableError format
    switch (validationError.kind) {
      case "InvalidInput":
        return {
          kind: "ValidationError",
          source: validationError.field || "unknown",
          reason: validationError.reason,
        };
      case "MissingRequiredField":
        return {
          kind: "ValidationError",
          source: validationError.source || "unknown",
          reason: `Missing required field: ${validationError.field}`,
        };
      case "InvalidFieldType":
        return {
          kind: "ValidationError",
          source: validationError.field || "unknown",
          reason: `Expected ${validationError.expected}, got ${validationError.received}`,
        };
      default:
        return {
          kind: "ValidationError",
          source: validationError.kind || "unknown",
          reason: validationError.message || validationError.reason || "Validation failed",
        };
    }
  }

  /**
   * Add a standard variable (input_text_file or destination_path)
   */
  addStandardVariable(name: string, value: string): this {
    // Check for duplicates first
    if (this.hasVariable(name)) {
      this._errors.push({ kind: "DuplicateVariable", name });
      return this;
    }

    const result = StandardVariable.create(name, value);
    if (result.ok) {
      this._variables.push(result.data);
    } else {
      this._errors.push(this.convertValidationError(result.error));
    }

    return this;
  }

  /**
   * Add a file path variable (schema_file)
   */
  addFilePathVariable(name: string, path: string): this {
    // Check for duplicates first
    if (this.hasVariable(name)) {
      this._errors.push({ kind: "DuplicateVariable", name });
      return this;
    }

    const result = FilePathVariable.create(name, path);
    if (result.ok) {
      this._variables.push(result.data);
    } else {
      this._errors.push(this.convertValidationError(result.error));
    }

    return this;
  }

  /**
   * Add stdin variable (input_text)
   */
  addStdinVariable(text: string): this {
    const name = "input_text"; // Fixed name for stdin

    // Check for duplicates first
    if (this.hasVariable(name)) {
      this._errors.push({ kind: "DuplicateVariable", name });
      return this;
    }

    const result = StdinVariable.create(name, text);
    if (result.ok) {
      this._variables.push(result.data);
    } else {
      this._errors.push(this.convertValidationError(result.error));
    }

    return this;
  }

  /**
   * Add user-defined variable (must have uv- prefix)
   */
  addUserVariable(name: string, value: string): this {
    // Check for uv- prefix
    if (!name.startsWith("uv-")) {
      this._errors.push({
        kind: "InvalidPrefix",
        name,
        expectedPrefix: "uv-",
      });
      return this;
    }

    // Check for duplicates
    if (this.hasVariable(name)) {
      this._errors.push({ kind: "DuplicateVariable", name });
      return this;
    }

    const result = UserVariable.create(name, value);
    if (result.ok) {
      this._variables.push(result.data);
    } else {
      this._errors.push(this.convertValidationError(result.error));
    }

    return this;
  }

  /**
   * Add multiple user-defined variables at once
   */
  addUserVariables(customVariables: Record<string, string>): this {
    for (const [name, value] of Object.entries(customVariables)) {
      this.addUserVariable(name, value);
    }
    return this;
  }

  /**
   * Add custom variables for prompt templates (without uv- prefix requirement)
   * Used for template variables that don't follow CLI uv- convention
   * Allows empty values for template flexibility
   */
  addCustomVariables(customVariables: Record<string, string>): this {
    for (const [name, value] of Object.entries(customVariables)) {
      // Skip empty values for custom variables - they are optional in templates
      if (!name || name.trim().length === 0) {
        this._errors.push({ kind: "DuplicateVariable", name: "EmptyName" });
        continue;
      }
      if (!value || value.trim().length === 0) {
        // Skip empty values rather than creating an error - templates may have optional variables
        continue;
      }

      // Create UserVariable for template usage
      const result = UserVariable.create(name, value);
      if (result.ok) {
        this._variables.push(result.data);
      } else {
        this._errors.push(this.convertValidationError(result.error));
      }
    }
    return this;
  }

  /**
   * Build the final PromptVariables collection
   * Returns Result with either the variables or accumulated errors
   */
  build(): Result<PromptVariables, BuilderVariableError[]> {
    if (this._errors.length > 0) {
      return error(this._errors);
    }

    return ok(PromptVariablesVO.create(this._variables));
  }

  /**
   * Convert all variables to Record<string, string> format
   * This method should only be called after successful build()
   *
   * For UserVariables, the format returned depends on context:
   * - VariablesBuilder context: keeps uv- prefix for test compatibility
   * - PromptParams context: UserVariable.toRecord() removes prefix
   */
  toRecord(): Record<string, string> {
    const record: Record<string, string> = {};

    for (const variable of this._variables) {
      const varRecord = variable.toRecord();
      // Special handling for UserVariables in VariablesBuilder context
      if (variable instanceof UserVariable) {
        // Re-add uv- prefix for VariablesBuilder.toRecord() compatibility
        for (const [key, value] of Object.entries(varRecord)) {
          record[`uv-${key}`] = String(value);
        }
      } else {
        Object.assign(record, varRecord);
      }
    }

    return record;
  }

  /**
   * Convert all variables to Record<string, string> format for template usage
   * This is used for prompt templates where UserVariables should not have uv- prefix
   */
  toTemplateRecord(): Record<string, string> {
    const record: Record<string, string> = {};

    for (const variable of this._variables) {
      Object.assign(record, variable.toRecord());
    }

    return record;
  }

  /**
   * Check if a variable with given name already exists
   */
  hasVariable(name: string): boolean {
    return this._variables.some((v) => {
      const record = v.toRecord();
      return Object.prototype.hasOwnProperty.call(record, name);
    });
  }

  /**
   * Get current error count
   */
  getErrorCount(): number {
    return this._errors.length;
  }

  /**
   * Get current variable count
   */
  getVariableCount(): number {
    return this._variables.length;
  }

  /**
   * Add variables from Factory/PathResolver resolved values
   * This is the primary integration method for Factory value types
   */
  addFromFactoryValues(factoryValues: FactoryResolvedValues): this {
    // Add input file path as standard variable (if not stdin)
    if (
      factoryValues.inputFilePath && factoryValues.inputFilePath !== "-" &&
      factoryValues.inputFilePath !== ""
    ) {
      this.addStandardVariable("input_text_file", basename(factoryValues.inputFilePath));
    }

    // Add output file path as standard variable
    if (factoryValues.outputFilePath) {
      this.addStandardVariable("destination_path", factoryValues.outputFilePath);
    }

    // Add schema file path as file path variable
    if (factoryValues.schemaFilePath) {
      this.addFilePathVariable("schema_file", factoryValues.schemaFilePath);
    }

    // Add stdin content if available
    if (factoryValues.inputText) {
      this.addStdinVariable(factoryValues.inputText);
    }

    // Add custom variables with uv- prefix validation
    // Note: customVariables should already have uv- prefix from TwoParamsProcessor
    if (factoryValues.customVariables) {
      this.addUserVariables(factoryValues.customVariables);
    }

    return this;
  }

  /**
   * Create VariablesBuilder from Factory values (convenience method)
   */
  static fromFactoryValues(factoryValues: FactoryResolvedValues): VariablesBuilder {
    return new VariablesBuilder().addFromFactoryValues(factoryValues);
  }

  /**
   * Add variables from partial Factory values (for incremental building)
   */
  addFromPartialFactoryValues(partialValues: Partial<FactoryResolvedValues>): this {
    if (partialValues.inputFilePath !== undefined) {
      if (
        partialValues.inputFilePath && partialValues.inputFilePath !== "-" &&
        partialValues.inputFilePath !== ""
      ) {
        this.addStandardVariable("input_text_file", basename(partialValues.inputFilePath));
      }
    }

    if (partialValues.outputFilePath) {
      this.addStandardVariable("destination_path", partialValues.outputFilePath);
    }

    if (partialValues.schemaFilePath) {
      this.addFilePathVariable("schema_file", partialValues.schemaFilePath);
    }

    if (partialValues.inputText) {
      this.addStdinVariable(partialValues.inputText);
    }

    if (partialValues.customVariables) {
      this.addUserVariables(partialValues.customVariables);
    }

    return this;
  }

  /**
   * Validate Factory values before processing
   */
  validateFactoryValues(
    factoryValues: FactoryResolvedValues,
  ): Result<void, BuilderVariableError[]> {
    const errors: BuilderVariableError[] = [];

    // Check required fields
    if (!factoryValues.promptFilePath) {
      errors.push({ kind: "FactoryValueMissing", field: "promptFilePath" });
    }

    // outputFilePath is typically required
    if (!factoryValues.outputFilePath) {
      errors.push({ kind: "FactoryValueMissing", field: "outputFilePath" });
    }

    // Validate custom variables have uv- prefix
    if (factoryValues.customVariables) {
      for (const [name] of Object.entries(factoryValues.customVariables)) {
        if (!name.startsWith("uv-")) {
          errors.push({
            kind: "InvalidPrefix",
            name,
            expectedPrefix: "uv-",
          });
        }
      }
    }

    if (errors.length > 0) {
      return error(errors);
    }

    return ok(undefined);
  }

  /**
   * Clear all variables and errors (reset builder)
   */
  clear(): this {
    this._variables = [];
    this._errors = [];
    return this;
  }
}
