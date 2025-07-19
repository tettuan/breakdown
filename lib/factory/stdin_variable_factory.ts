/**
 * @fileoverview StdinVariableFactory for creating stdin variables following Totality Principle
 *
 * This module provides a factory for creating StdinVariable instances with Result type
 * error handling. It integrates with Factory/PathResolver value types to provide
 * type-safe stdin variable creation.
 *
 * @module factory/stdin_variable_factory
 */

import { error, ok, Result } from "../types/result.ts";
import { StdinVariable } from "../types/prompt_variables_vo.ts";
// Import ErrorInfo from @tettuan/breakdownparams for unified error handling
import type { ErrorInfo } from "@tettuan/breakdownparams";

/**
 * Factory-specific error types for stdin variable creation
 */
export type StdinVariableFactoryError =
  | ErrorInfo
  | { kind: "NoStdinData"; context: string }
  | { kind: "InvalidStdinSource"; source: string }
  | { kind: "EmptyValue"; field: string; context?: Record<string, unknown> };

/**
 * Input data structure from Factory/PathResolver
 */
export interface StdinFactoryInput {
  /** Raw stdin text content */
  inputText?: string;
  /** Source of the stdin data (for debugging) */
  source?: "cli" | "pipe" | "file";
  /** Additional context information */
  context?: string;
}

/**
 * Factory for creating StdinVariable instances with Totality principle compliance
 *
 * @example Basic usage
 * ```typescript
 * const factory = new StdinVariableFactory();
 * const result = factory.create({
 *   inputText: "Hello, world!",
 *   source: "cli"
 * });
 *
 * if (result.ok) {
 *   const stdinVar = result.data;
 *   console.log(stdinVar.toRecord()); // { input_text: "Hello, world!" }
 * } else {
 *   console.error("Failed to create stdin variable:", result.error);
 * }
 * ```
 *
 * @example Error handling
 * ```typescript
 * const result = factory.create({ inputText: "" });
 * if (!result.ok) {
 *   switch (result.error.kind) {
 *     case "EmptyValue":
 *       console.error("Stdin cannot be empty");
 *       break;
 *     case "NoStdinData":
 *       console.error("No stdin data provided");
 *       break;
 *   }
 * }
 * ```
 */
export class StdinVariableFactory {
  /**
   * Creates a StdinVariable from factory input data
   *
   * @param input - Input data from Factory/PathResolver
   * @returns Result containing StdinVariable or error
   */
  create(input: StdinFactoryInput): Result<StdinVariable, StdinVariableFactoryError> {
    // Handle null/undefined input without throwing
    if (!input || typeof input !== "object") {
      return error({
        kind: "NoStdinData",
        context: "Invalid or missing factory input",
      });
    }

    // Validate input structure
    if (input.inputText === undefined) {
      return error({
        kind: "NoStdinData",
        context: input.context || "No stdin data provided in factory input",
      });
    }

    // Validate source if provided
    if (input.source && !["cli", "pipe", "file"].includes(input.source)) {
      return error({
        kind: "InvalidStdinSource",
        source: input.source,
      });
    }

    // Use StdinVariable's Smart Constructor
    const result = StdinVariable.create("input_text", input.inputText);

    if (!result.ok) {
      // Convert StdinVariable error to appropriate factory error
      if (result.error.kind === "EmptyValue") {
        return error({
          kind: "EmptyValue",
          field: result.error.field,
          context: result.error.context,
        });
      }
      return error({
        kind: "NoStdinData",
        context: `StdinVariable creation failed: ${result.error.kind}`,
      });
    }

    return ok(result.data);
  }

  /**
   * Creates a StdinVariable directly from text (convenience method)
   *
   * @param text - Raw stdin text
   * @param source - Optional source information
   * @returns Result containing StdinVariable or error
   */
  createFromText(
    text: string,
    source: "cli" | "pipe" | "file" = "cli",
  ): Result<StdinVariable, StdinVariableFactoryError> {
    return this.create({
      inputText: text,
      source,
      context: `Direct text input from ${source}`,
    });
  }

  /**
   * Creates multiple StdinVariable instances from an array of inputs
   *
   * @param inputs - Array of stdin factory inputs
   * @returns Result containing array of StdinVariables or array of errors
   */
  createBatch(
    inputs: StdinFactoryInput[],
  ): Result<StdinVariable[], StdinVariableFactoryError[]> {
    const variables: StdinVariable[] = [];
    const errors: StdinVariableFactoryError[] = [];

    for (const input of inputs) {
      const result = this.create(input);
      if (result.ok) {
        variables.push(result.data);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      return error(errors);
    }

    return ok(variables);
  }

  /**
   * Validates stdin factory input without creating variable
   *
   * @param input - Input to validate
   * @returns Result indicating validation success or failure
   */
  validate(input: StdinFactoryInput): Result<void, StdinVariableFactoryError> {
    const result = this.create(input);
    if (result.ok) {
      return ok(undefined);
    }
    return error(result.error);
  }
}

/**
 * Default instance for convenience
 */
export const defaultStdinVariableFactory = new StdinVariableFactory();
