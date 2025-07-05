/**
 * @fileoverview Prompt types for behavior testing
 * 
 * This module provides prompt type definitions
 * for behavior tests.
 */

export interface PromptParams {
  directive: string;
  layer: string;
  inputFile?: string;
  outputFile?: string;
}

export interface PromptVariables {
  [key: string]: string | number | boolean;
}

export type PromptError =
  | {
    kind: "TemplateNotFound";
    path: string;
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

export class PromptPath {
  private constructor(private readonly value: string) {}

  static create(path: string): { ok: true; data: PromptPath } | { ok: false; error: { kind: "InvalidPath"; message: string } } {
    if (!path || path.trim() === "") {
      return {
        ok: false,
        error: {
          kind: "InvalidPath",
          message: "Path cannot be empty",
        },
      };
    }

    // Check for path traversal patterns
    if (path.includes("../")) {
      return {
        ok: false,
        error: {
          kind: "InvalidPath",
          message: "Path traversal not allowed",
        },
      };
    }

    return {
      ok: true,
      data: new PromptPath(path),
    };
  }

  toString(): string {
    return this.value;
  }

  getValue(): string {
    return this.value;
  }
}

export class PromptTypeHelper {
  static validateParams(params: PromptParams): boolean {
    return !!(params.directive && params.layer);
  }
}

export function formatPromptError(error: PromptError): string {
  switch (error.kind) {
    case "TemplateNotFound":
      return `Template not found: ${error.path}`;
    case "InvalidVariables":
      return `Invalid variables: ${error.details.join(", ")}`;
    case "SchemaError":
      return `Schema error in ${error.schema}: ${error.error}`;
    case "InvalidPath":
      return `Invalid path: ${error.message}`;
    case "TemplateParseError":
      return `Failed to parse template ${error.template}: ${error.error}`;
    case "ConfigurationError":
      return `Configuration error: ${error.message}`;
  }
}

export function isInvalidVariablesError(
  error: PromptError,
): error is Extract<PromptError, { kind: "InvalidVariables" }> {
  return error.kind === "InvalidVariables";
}

export function isTemplateNotFoundError(
  error: PromptError,
): error is Extract<PromptError, { kind: "TemplateNotFound" }> {
  return error.kind === "TemplateNotFound";
}