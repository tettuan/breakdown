/**
 * @fileoverview Tests for Breakdown Error System
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import {
  BaseBreakdownError,
  BreakdownErrorFactory,
  CLIParsingError,
  ConfigError,
  formatErrorForTerminal,
  getRecoverySuggestions,
  isBreakdownError,
  PathResolutionError,
  PromptGenerationError,
  VariableGenerationError,
} from "./mod.ts";

// Test implementation of BaseBreakdownError
class TestError extends BaseBreakdownError {
  readonly domain = "test" as const;
  readonly kind = "test-error" as const;
}

Deno.test("BaseBreakdownError - Basic functionality", () => {
  const error = new TestError("Test error message", {
    context: { testValue: 42 },
    cause: new Error("Original error"),
  });

  assertEquals(error.domain, "test");
  assertEquals(error.kind, "test-error");
  assertEquals(error.message, "Test error message");
  assertEquals(error.context?.testValue, 42);
  assertExists(error.cause);
  assertExists(error.timestamp);
  assertExists(error.id);
});

Deno.test("BaseBreakdownError - JSON serialization", () => {
  const error = new TestError("Test message");
  const json = error.toJSON();

  assertEquals(json.domain, "test");
  assertEquals(json.kind, "test-error");
  assertEquals(json.message, "Test message");
  assertExists(json.timestamp);
  assertExists(json.id);
});

Deno.test("CLIParsingError - Factory methods", () => {
  const missingError = CLIParsingError.missingRequired("input", 1);
  assertEquals(missingError.kind, "missing-required-argument");
  assertEquals(missingError.context?.argument, "input");

  const invalidError = CLIParsingError.invalidFormat("output", "invalid", "file path");
  assertEquals(invalidError.kind, "invalid-argument-format");
  assertEquals(invalidError.context?.value, "invalid");

  const unknownError = CLIParsingError.unknownOption("--badopt", ["--help", "--version"]);
  assertEquals(unknownError.kind, "unknown-option");
  assertEquals(Array.isArray(unknownError.context?.availableOptions) ? unknownError.context.availableOptions.length : 0, 2);
});

Deno.test("ConfigError - Factory methods", () => {
  const notFoundError = ConfigError.notFound("/path/to/config", "production");
  assertEquals(notFoundError.kind, "config-not-found");
  assertEquals(notFoundError.context?.profileName, "production");

  const validationError = ConfigError.validationFailed("/path", [
    { field: "directiveTypes", error: "must be array" },
  ]);
  assertEquals(validationError.kind, "config-validation-failed");
  assertEquals(Array.isArray(validationError.context?.validationErrors) ? validationError.context.validationErrors.length : 0, 1);

  const missingError = ConfigError.missingRequired("/path", ["directiveTypes"]);
  assertEquals(missingError.kind, "config-missing-required");
  assertEquals(Array.isArray(missingError.context?.missingFields) ? missingError.context.missingFields.length : 0, 1);
});

Deno.test("PathResolutionError - Factory methods", () => {
  const notFoundError = PathResolutionError.notFound("/missing/file", "Template");
  assertEquals(notFoundError.kind, "path-not-found");
  assertEquals(notFoundError.context?.path, "/missing/file");

  const templateError = PathResolutionError.templateNotFound("to", "project", "issue", "analysis");
  assertEquals(templateError.kind, "template-not-found");
  assertEquals(templateError.context?.directiveType, "to");
  assertEquals(templateError.context?.adaptation, "analysis");

  const schemaError = PathResolutionError.schemaNotFound("summary", "task");
  assertEquals(schemaError.kind, "schema-not-found");
  assertEquals(schemaError.context?.directiveType, "summary");
});

Deno.test("VariableGenerationError - Factory methods", () => {
  const missingError = VariableGenerationError.missingRequired(["name", "description"]);
  assertEquals(missingError.kind, "variable-missing-required");
  assertEquals(Array.isArray(missingError.context?.missingVariables) ? missingError.context.missingVariables.length : 0, 2);

  const typeError = VariableGenerationError.invalidType("count", "number", "string", "abc");
  assertEquals(typeError.kind, "variable-invalid-type");
  assertEquals(typeError.context?.expected, "number");

  const validationError = VariableGenerationError.validationFailed("email", "invalid format");
  assertEquals(validationError.kind, "variable-validation-failed");
  assertEquals(validationError.context?.variableName, "email");
});

Deno.test("PromptGenerationError - Factory methods", () => {
  const processingError = PromptGenerationError.processingFailed("/template", "file not found");
  assertEquals(processingError.kind, "template-processing-failed");
  assertEquals(processingError.context?.templatePath, "/template");

  const substitutionError = PromptGenerationError.substitutionFailed("name", "/template", "undefined variable", 10);
  assertEquals(substitutionError.kind, "variable-substitution-failed");
  assertEquals(substitutionError.context?.lineNumber, 10);

  const syntaxError = PromptGenerationError.syntaxError("/template", "unclosed bracket", 5, 10, "{{unclosed");
  assertEquals(syntaxError.kind, "template-syntax-error");
  assertEquals(syntaxError.context?.columnNumber, 10);
});

Deno.test("Error type guards", () => {
  const cliError = CLIParsingError.missingRequired("input");
  const configError = ConfigError.notFound("/config");
  const normalError = new Error("Normal error");

  assertEquals(isBreakdownError(cliError), true);
  assertEquals(isBreakdownError(configError), true);
  assertEquals(isBreakdownError(normalError), false);
});

Deno.test("Error factory", () => {
  const cliError = BreakdownErrorFactory.cliParsing.missingRequired("arg");
  assertInstanceOf(cliError, CLIParsingError);

  const configError = BreakdownErrorFactory.config.notFound("/path");
  assertInstanceOf(configError, ConfigError);

  const pathError = BreakdownErrorFactory.pathResolution.notFound("/missing", "File");
  assertInstanceOf(pathError, PathResolutionError);
});

Deno.test("Recovery suggestions", () => {
  const cliError = CLIParsingError.missingRequired("input");
  const suggestions = getRecoverySuggestions(cliError);
  assertEquals(suggestions.length > 0, true);
  assertEquals(suggestions[0].action, "Check command syntax");
});

Deno.test("Terminal formatting", () => {
  const error = CLIParsingError.missingRequired("input");
  const formatted = formatErrorForTerminal(error);
  assertEquals(formatted.includes("❌"), true);
  assertEquals(formatted.includes("Error ID:"), true);
  assertEquals(formatted.includes("💡 Suggestions:"), true);
});

Deno.test("Error recovery methods", () => {
  const cliError = CLIParsingError.missingRequired("input");
  assertEquals(cliError.isRecoverable(), true);

  const suggestions = cliError.getRecoverySuggestions();
  assertEquals(suggestions.length > 0, true);
  assertEquals(suggestions[0].includes("Add the required argument"), true);
});

Deno.test("Error context preservation", () => {
  const originalError = new Error("Original cause");
  const wrappedError = PromptGenerationError.processingFailed(
    "/template",
    "Processing failed",
    originalError
  );

  assertEquals(wrappedError.cause, originalError);
  assertEquals(wrappedError.context?.templatePath, "/template");
});

Deno.test("Error ID generation", () => {
  const error1 = new TestError("Test 1");
  const error2 = new TestError("Test 2");

  // IDs should be different
  assertEquals(error1.id !== error2.id, true);
  // IDs should include domain and kind
  assertEquals(error1.id.includes("test"), true);
});

Deno.test("User vs Developer messages", () => {
  const error = CLIParsingError.missingRequired("input");
  
  const userMessage = error.getUserMessage();
  const devMessage = error.getDeveloperMessage();

  // User message should be more user-friendly
  assertEquals(userMessage.includes("Example:"), true);
  
  // Developer message should include technical details
  assertEquals(devMessage.includes("[cli-parsing:missing-required-argument]"), true);
});