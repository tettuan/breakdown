/**
 * @fileoverview Prompt management types following Totality principle
 *
 * This module provides types for prompt management with explicit error handling
 * and type safety. All operations follow the Totality principle.
 *
 * @module types/prompt_types
 */

import { error as resultError, ok as resultOk, type Result } from "./result.ts";

/**
 * Error types for prompt path operations
 */
export type InvalidPathError = {
  kind: "InvalidPath";
  message: string;
};

/**
 * Prompt template path value object
 *
 * Represents a valid path to a prompt template file.
 * Uses Smart Constructor pattern to ensure validity.
 *
 * @example
 * ```typescript
 * const pathResult = PromptPath.create("/templates/summary.md");
 * if (pathResult.ok) {
 *   console.log(pathResult.data.toString());
 * }
 * ```
 */
export class PromptPath {
  private constructor(private readonly value: string) {}

  /**
   * Create a PromptPath instance
   *
   * @param path - The path string to validate and wrap
   * @returns Result containing PromptPath or InvalidPathError
   */
  static create(path: string): Result<PromptPath, InvalidPathError> {
    if (!path || path.trim() === "") {
      return resultError({
        kind: "InvalidPath",
        message: "Path cannot be empty",
      });
    }

    const trimmedPath = path.trim();
    if (trimmedPath.includes("..")) {
      return resultError({
        kind: "InvalidPath",
        message: "Path cannot contain '..' for security reasons",
      });
    }

    return resultOk(new PromptPath(trimmedPath));
  }

  /**
   * Get the string representation of the path
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another PromptPath
   */
  equals(other: PromptPath): boolean {
    return this.value === other.value;
  }
}

/**
 * Prompt variables interface
 *
 * Represents variables to be replaced in a prompt template.
 * Uses Duck Typing pattern for flexible conversion.
 *
 * @example
 * ```typescript
 * class MyVariables implements PromptVariables {
 *   constructor(private data: Record<string, string>) {}
 *   toRecord(): Record<string, string> {
 *     return { ...this.data };
 *   }
 * }
 * ```
 */
export interface PromptVariables {
  /**
   * Convert variables to a record format
   *
   * @returns Record of string key-value pairs
   */
  toRecord(): Record<string, string>;
}

/**
 * Prompt generation result
 *
 * Contains the generated prompt content and optional metadata.
 */
export type PromptResult = {
  /** The generated prompt content */
  content: string;
  /** Optional metadata about the generation */
  metadata?: {
    /** Template path used */
    template: string;
    /** Variables applied */
    variables: Record<string, string>;
    /** Generation timestamp */
    timestamp?: Date;
  };
};

/**
 * Prompt generation errors (Discriminated Union)
 *
 * Represents all possible errors that can occur during prompt generation.
 * Each error type has a unique 'kind' discriminator.
 */
export type PromptError =
  | {
    kind: "TemplateNotFound";
    path: string;
    workingDir?: string;
    attemptedPaths?: string[];
  }
  | {
    kind: "InvalidVariables";
    details: string[];
  }
  | {
    kind: "SchemaError";
    schema: string;
    error: string;
  }
  | {
    kind: "InvalidPath";
    message: string;
  }
  | {
    kind: "TemplateParseError";
    template: string;
    error: string;
  }
  | {
    kind: "ConfigurationError";
    message: string;
  };

/**
 * Check if error is TemplateNotFound
 */
export function isTemplateNotFoundError(
  error: PromptError,
): error is Extract<PromptError, { kind: "TemplateNotFound" }> {
  return error.kind === "TemplateNotFound";
}

/**
 * Check if error is InvalidVariables
 */
export function isInvalidVariablesError(
  error: PromptError,
): error is Extract<PromptError, { kind: "InvalidVariables" }> {
  return error.kind === "InvalidVariables";
}

/**
 * Format prompt error for display
 */
export function formatPromptError(error: PromptError): string {
  switch (error.kind) {
    case "TemplateNotFound": {
      let message = `${error.kind}: Template not found: ${error.path}`;
      if (error.workingDir) {
        message += ` (working_dir: ${error.workingDir})`;
      }
      if (error.attemptedPaths && error.attemptedPaths.length > 0) {
        message += `\nAttempted paths: ${error.attemptedPaths.join(", ")}`;
      }
      return message;
    }
    case "InvalidVariables":
      return `${error.kind}: Invalid variables: ${error.details.join(", ")}`;
    case "SchemaError":
      return `${error.kind}: Schema error in ${error.schema}: ${error.error}`;
    case "InvalidPath":
      return `${error.kind}: Invalid path: ${error.message}`;
    case "TemplateParseError":
      return `${error.kind}: Failed to parse template ${error.template}: ${error.error}`;
    case "ConfigurationError":
      return `${error.kind}: Configuration error: ${error.message}`;
  }
}
