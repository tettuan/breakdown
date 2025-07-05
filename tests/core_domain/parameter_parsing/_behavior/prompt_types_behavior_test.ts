/**
 * @fileoverview Unit tests for prompt_types module
 *
 * Tests PromptPath value object creation, validation, and operations,
 * as well as error type guards and formatting functions.
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import {
  formatPromptError,
  isInvalidVariablesError,
  isTemplateNotFoundError,
  type PromptError,
  PromptPath,
} from "./prompt_types.ts";

Deno.test("PromptPath.create() - rejects empty strings", () => {
  // Test empty string
  const emptyResult = PromptPath.create("");
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "InvalidPath");
    assertEquals(emptyResult.error.message, "Path cannot be empty");
  }

  // Test string with only spaces
  const spacesResult = PromptPath.create("   ");
  assertEquals(spacesResult.ok, false);
  if (!spacesResult.ok) {
    assertEquals(spacesResult.error.kind, "InvalidPath");
    assertEquals(spacesResult.error.message, "Path cannot be empty");
  }

  // Test string with only tabs and newlines
  const whitespaceResult = PromptPath.create("\t\n  ");
  assertEquals(whitespaceResult.ok, false);
  if (!whitespaceResult.ok) {
    assertEquals(whitespaceResult.error.kind, "InvalidPath");
    assertEquals(whitespaceResult.error.message, "Path cannot be empty");
  }
});

Deno.test("PromptPath.create() - detects path traversal", () => {
  // Test direct path traversal
  const directResult = PromptPath.create("../templates/prompt.md");
  assertEquals(directResult.ok, false);
  if (!directResult.ok) {
    assertEquals(directResult.error.kind, "InvalidPath");
    assertEquals(
      directResult.error.message,
      "Path cannot contain '..' for security reasons",
    );
  }

  // Test path traversal in the middle
  const middleResult = PromptPath.create("/templates/../../../etc/passwd");
  assertEquals(middleResult.ok, false);
  if (!middleResult.ok) {
    assertEquals(middleResult.error.kind, "InvalidPath");
    assertEquals(
      middleResult.error.message,
      "Path cannot contain '..' for security reasons",
    );
  }

  // Test path traversal at the end
  const endResult = PromptPath.create("/templates/..");
  assertEquals(endResult.ok, false);
  if (!endResult.ok) {
    assertEquals(endResult.error.kind, "InvalidPath");
    assertEquals(
      endResult.error.message,
      "Path cannot contain '..' for security reasons",
    );
  }

  // Test multiple path traversals
  const multipleResult = PromptPath.create("../../templates/../../prompt.md");
  assertEquals(multipleResult.ok, false);
  if (!multipleResult.ok) {
    assertEquals(multipleResult.error.kind, "InvalidPath");
    assertEquals(
      multipleResult.error.message,
      "Path cannot contain '..' for security reasons",
    );
  }
});

Deno.test("PromptPath.create() - accepts valid paths", () => {
  // Test absolute path
  const absoluteResult = PromptPath.create("/templates/prompts/summary.md");
  assertEquals(absoluteResult.ok, true);

  // Test relative path without traversal
  const relativeResult = PromptPath.create("templates/prompts/detail.md");
  assertEquals(relativeResult.ok, true);

  // Test single dot path (current directory)
  const singleDotResult = PromptPath.create("./templates/prompt.md");
  assertEquals(singleDotResult.ok, true);

  // Test path with special characters
  const specialResult = PromptPath.create("/templates/to-project_v1.2.md");
  assertEquals(specialResult.ok, true);

  // Test path with spaces in filename
  const spacesInNameResult = PromptPath.create("/templates/my prompt.md");
  assertEquals(spacesInNameResult.ok, true);

  // Test simple filename
  const simpleResult = PromptPath.create("prompt.md");
  assertEquals(simpleResult.ok, true);
});

Deno.test("PromptPath.create() - trims whitespace", () => {
  // Test leading whitespace
  const leadingResult = PromptPath.create("  /templates/prompt.md");
  assertEquals(leadingResult.ok, true);
  if (leadingResult.ok) {
    assertEquals(leadingResult.data.toString(), "/templates/prompt.md");
  }

  // Test trailing whitespace
  const trailingResult = PromptPath.create("/templates/prompt.md  \t");
  assertEquals(trailingResult.ok, true);
  if (trailingResult.ok) {
    assertEquals(trailingResult.data.toString(), "/templates/prompt.md");
  }

  // Test both leading and trailing whitespace
  const bothResult = PromptPath.create("\n  /templates/prompt.md  \r\n");
  assertEquals(bothResult.ok, true);
  if (bothResult.ok) {
    assertEquals(bothResult.data.toString(), "/templates/prompt.md");
  }
});

Deno.test("PromptPath.toString() - returns the internal value", () => {
  const result = PromptPath.create("/templates/summary.md");
  assertExists(result.ok);
  if (result.ok) {
    assertEquals(result.data.toString(), "/templates/summary.md");
  }

  // Test with trimmed path
  const trimmedResult = PromptPath.create("  /templates/detail.md  ");
  assertExists(trimmedResult.ok);
  if (trimmedResult.ok) {
    assertEquals(trimmedResult.data.toString(), "/templates/detail.md");
  }
});

Deno.test("PromptPath.equals() - compares path values", () => {
  // Create two paths with the same value
  const path1Result = PromptPath.create("/templates/prompt.md");
  const path2Result = PromptPath.create("/templates/prompt.md");

  assertExists(path1Result.ok);
  assertExists(path2Result.ok);
  if (path1Result.ok && path2Result.ok) {
    assertEquals(path1Result.data.equals(path2Result.data), true);
  }

  // Create two paths with different values
  const path3Result = PromptPath.create("/templates/summary.md");
  const path4Result = PromptPath.create("/templates/detail.md");

  assertExists(path3Result.ok);
  assertExists(path4Result.ok);
  if (path3Result.ok && path4Result.ok) {
    assertEquals(path3Result.data.equals(path4Result.data), false);
  }

  // Test paths that become equal after trimming
  const path5Result = PromptPath.create("  /templates/test.md  ");
  const path6Result = PromptPath.create("/templates/test.md");

  assertExists(path5Result.ok);
  assertExists(path6Result.ok);
  if (path5Result.ok && path6Result.ok) {
    assertEquals(path5Result.data.equals(path6Result.data), true);
  }
});

Deno.test("isTemplateNotFoundError() - correctly identifies error type", () => {
  const templateNotFoundError: PromptError = {
    kind: "TemplateNotFound",
    path: "/templates/missing.md",
  };
  assertEquals(isTemplateNotFoundError(templateNotFoundError), true);

  const invalidVariablesError: PromptError = {
    kind: "InvalidVariables",
    details: ["missing variable: name"],
  };
  assertEquals(isTemplateNotFoundError(invalidVariablesError), false);

  const schemaError: PromptError = {
    kind: "SchemaError",
    schema: "task-schema.json",
    error: "Invalid JSON",
  };
  assertEquals(isTemplateNotFoundError(schemaError), false);

  const invalidPathError: PromptError = {
    kind: "InvalidPath",
    message: "Path cannot be empty",
  };
  assertEquals(isTemplateNotFoundError(invalidPathError), false);

  const parseError: PromptError = {
    kind: "TemplateParseError",
    template: "prompt.md",
    error: "Unclosed variable",
  };
  assertEquals(isTemplateNotFoundError(parseError), false);

  const configError: PromptError = {
    kind: "ConfigurationError",
    message: "Missing configuration file",
  };
  assertEquals(isTemplateNotFoundError(configError), false);
});

Deno.test("isInvalidVariablesError() - correctly identifies error type", () => {
  const invalidVariablesError: PromptError = {
    kind: "InvalidVariables",
    details: ["missing variable: name", "missing variable: task"],
  };
  assertEquals(isInvalidVariablesError(invalidVariablesError), true);

  const templateNotFoundError: PromptError = {
    kind: "TemplateNotFound",
    path: "/templates/missing.md",
  };
  assertEquals(isInvalidVariablesError(templateNotFoundError), false);

  const schemaError: PromptError = {
    kind: "SchemaError",
    schema: "project-schema.json",
    error: "Schema validation failed",
  };
  assertEquals(isInvalidVariablesError(schemaError), false);

  const invalidPathError: PromptError = {
    kind: "InvalidPath",
    message: "Invalid path format",
  };
  assertEquals(isInvalidVariablesError(invalidPathError), false);

  const parseError: PromptError = {
    kind: "TemplateParseError",
    template: "template.md",
    error: "Syntax error",
  };
  assertEquals(isInvalidVariablesError(parseError), false);

  const configError: PromptError = {
    kind: "ConfigurationError",
    message: "Invalid configuration",
  };
  assertEquals(isInvalidVariablesError(configError), false);
});

Deno.test("formatPromptError() - formats TemplateNotFound error", () => {
  const error: PromptError = {
    kind: "TemplateNotFound",
    path: "/templates/missing-prompt.md",
  };
  const formatted = formatPromptError(error);
  assertEquals(formatted, "Template not found: /templates/missing-prompt.md");
});

Deno.test("formatPromptError() - formats InvalidVariables error", () => {
  const error: PromptError = {
    kind: "InvalidVariables",
    details: ["missing variable: projectName", "invalid format: date"],
  };
  const formatted = formatPromptError(error);
  assertEquals(
    formatted,
    "Invalid variables: missing variable: projectName, invalid format: date",
  );

  // Test with empty details array
  const emptyError: PromptError = {
    kind: "InvalidVariables",
    details: [],
  };
  const emptyFormatted = formatPromptError(emptyError);
  assertEquals(emptyFormatted, "Invalid variables: ");

  // Test with single detail
  const singleError: PromptError = {
    kind: "InvalidVariables",
    details: ["undefined variable"],
  };
  const singleFormatted = formatPromptError(singleError);
  assertEquals(singleFormatted, "Invalid variables: undefined variable");
});

Deno.test("formatPromptError() - formats SchemaError", () => {
  const error: PromptError = {
    kind: "SchemaError",
    schema: "task-breakdown-schema.json",
    error: "Property 'required' is missing",
  };
  const formatted = formatPromptError(error);
  assertEquals(
    formatted,
    "Schema error in task-breakdown-schema.json: Property 'required' is missing",
  );
});

Deno.test("formatPromptError() - formats InvalidPath error", () => {
  const error: PromptError = {
    kind: "InvalidPath",
    message: "Path contains invalid characters: <>|",
  };
  const formatted = formatPromptError(error);
  assertEquals(formatted, "Invalid path: Path contains invalid characters: <>|");
});

Deno.test("formatPromptError() - formats TemplateParseError", () => {
  const error: PromptError = {
    kind: "TemplateParseError",
    template: "summary-template.md",
    error: "Unclosed variable expression at line 42",
  };
  const formatted = formatPromptError(error);
  assertEquals(
    formatted,
    "Failed to parse template summary-template.md: Unclosed variable expression at line 42",
  );
});

Deno.test("formatPromptError() - formats ConfigurationError", () => {
  const error: PromptError = {
    kind: "ConfigurationError",
    message: "Working directory not set in configuration",
  };
  const formatted = formatPromptError(error);
  assertEquals(
    formatted,
    "Configuration error: Working directory not set in configuration",
  );
});

Deno.test("formatPromptError() - handles all error types exhaustively", () => {
  // This test ensures all error types are handled by the formatter
  const allErrorTypes: PromptError[] = [
    { kind: "TemplateNotFound", path: "/test.md" },
    { kind: "InvalidVariables", details: ["test"] },
    { kind: "SchemaError", schema: "test.json", error: "test error" },
    { kind: "InvalidPath", message: "test message" },
    { kind: "TemplateParseError", template: "test.md", error: "test error" },
    { kind: "ConfigurationError", message: "test message" },
  ];

  // Ensure each error type produces a non-empty formatted string
  for (const error of allErrorTypes) {
    const formatted = formatPromptError(error);
    assertExists(formatted);
    assertEquals(typeof formatted, "string");
    assertEquals(formatted.length > 0, true);
  }
});
