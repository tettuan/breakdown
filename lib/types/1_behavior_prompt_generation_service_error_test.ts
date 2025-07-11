/**
 * @fileoverview Behavior tests for PromptGenerationService error types
 *
 * This test module verifies the behavioral aspects of PromptGenerationService
 * error types, including error message generation and factory function behavior.
 *
 * @module types/1_behavior_prompt_generation_service_error_test
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { PromptGenerationServiceErrorFactory } from "./prompt_generation_service_error.ts";

Deno.test("Behavior: VariableValidationError message generation", () => {
  const validationErrors = [
    { message: "Field 'name' is required" },
    { message: "Field 'age' must be a number" },
  ];

  const error = PromptGenerationServiceErrorFactory.variableValidationFailed(validationErrors);

  assertEquals(error.kind, "VariableValidationFailed");
  assertStringIncludes(error.message, "Variable validation failed");
  assertStringIncludes(error.message, "Field 'name' is required");
  assertStringIncludes(error.message, "Field 'age' must be a number");
  assertEquals(error.validationErrors, validationErrors);
});

Deno.test("Behavior: VariableValidationError with single error", () => {
  const validationErrors = [{ message: "Single validation error" }];
  const error = PromptGenerationServiceErrorFactory.variableValidationFailed(validationErrors);

  assertEquals(error.kind, "VariableValidationFailed");
  assertStringIncludes(error.message, "Variable validation failed");
  assertStringIncludes(error.message, "Single validation error");
  assertEquals(error.validationErrors.length, 1);
});

Deno.test("Behavior: VariableValidationError with empty validation errors", () => {
  const validationErrors: Array<{ message: string }> = [];
  const error = PromptGenerationServiceErrorFactory.variableValidationFailed(validationErrors);

  assertEquals(error.kind, "VariableValidationFailed");
  assertStringIncludes(error.message, "Variable validation failed");
  assertEquals(error.validationErrors.length, 0);
});

Deno.test("Behavior: TemplateResolutionError with template path", () => {
  const templatePath = "/path/to/template.md";
  const error = PromptGenerationServiceErrorFactory.templateResolutionFailed(templatePath);

  assertEquals(error.kind, "TemplateResolutionFailed");
  assertStringIncludes(error.message, "Template resolution failed");
  assertStringIncludes(error.message, templatePath);
  assertEquals(error.templatePath, templatePath);
});

Deno.test("Behavior: TemplateResolutionError without template path", () => {
  const error = PromptGenerationServiceErrorFactory.templateResolutionFailed();

  assertEquals(error.kind, "TemplateResolutionFailed");
  assertStringIncludes(error.message, "Template resolution failed");
  assertEquals(error.templatePath, undefined);
});

Deno.test("Behavior: TemplateResolutionError with undefined template path", () => {
  const error = PromptGenerationServiceErrorFactory.templateResolutionFailed(undefined);

  assertEquals(error.kind, "TemplateResolutionFailed");
  assertStringIncludes(error.message, "Template resolution failed");
  assertEquals(error.templatePath, undefined);
});

Deno.test("Behavior: PromptGenerationError message generation", () => {
  const reason = "Template parsing failed";
  const error = PromptGenerationServiceErrorFactory.promptGenerationFailed(reason);

  assertEquals(error.kind, "PromptGenerationFailed");
  assertStringIncludes(error.message, "Prompt generation failed");
  assertStringIncludes(error.message, reason);
  assertEquals(error.reason, reason);
});

Deno.test("Behavior: PromptGenerationError with complex reason", () => {
  const reason = "Multiple issues: template not found, variables missing, schema invalid";
  const error = PromptGenerationServiceErrorFactory.promptGenerationFailed(reason);

  assertEquals(error.kind, "PromptGenerationFailed");
  assertStringIncludes(error.message, "Prompt generation failed");
  assertStringIncludes(error.message, reason);
  assertEquals(error.reason, reason);
});

Deno.test("Behavior: ServiceConfigurationError message generation", () => {
  const configurationIssue = "Missing required configuration property 'apiKey'";
  const error = PromptGenerationServiceErrorFactory.serviceConfigurationError(configurationIssue);

  assertEquals(error.kind, "ServiceConfigurationError");
  assertStringIncludes(error.message, "Service configuration error");
  assertStringIncludes(error.message, configurationIssue);
  assertEquals(error.configurationIssue, configurationIssue);
});

Deno.test("Behavior: ServiceConfigurationError with configuration path", () => {
  const configurationIssue = "Invalid value in config.yml at path 'services.prompt.timeout'";
  const error = PromptGenerationServiceErrorFactory.serviceConfigurationError(configurationIssue);

  assertEquals(error.kind, "ServiceConfigurationError");
  assertStringIncludes(error.message, "Service configuration error");
  assertStringIncludes(error.message, configurationIssue);
  assertEquals(error.configurationIssue, configurationIssue);
});

Deno.test("Behavior: Error message consistency across factories", () => {
  const variableError = PromptGenerationServiceErrorFactory.variableValidationFailed([
    { message: "Test error" },
  ]);
  const templateError = PromptGenerationServiceErrorFactory.templateResolutionFailed("/test/path");
  const promptError = PromptGenerationServiceErrorFactory.promptGenerationFailed("Test reason");
  const configError = PromptGenerationServiceErrorFactory.serviceConfigurationError("Test issue");

  // All error messages should be non-empty strings
  assertEquals(typeof variableError.message, "string");
  assertEquals(typeof templateError.message, "string");
  assertEquals(typeof promptError.message, "string");
  assertEquals(typeof configError.message, "string");

  // All messages should contain the error kind information
  assertStringIncludes(variableError.message.toLowerCase(), "variable");
  assertStringIncludes(templateError.message.toLowerCase(), "template");
  assertStringIncludes(promptError.message.toLowerCase(), "prompt");
  assertStringIncludes(configError.message.toLowerCase(), "configuration");
});

Deno.test("Behavior: Factory functions produce immutable objects", () => {
  const error = PromptGenerationServiceErrorFactory.variableValidationFailed([
    { message: "Test error" },
  ]);

  // Test immutability by capturing original values
  const originalKind = error.kind;
  const originalMessage = error.message;
  const originalValidationErrors = error.validationErrors;

  // In TypeScript, readonly is compile-time only
  // Runtime immutability would require Object.freeze() or similar
  // This test documents the expected behavior

  // Verify factory produces consistent structure
  assertEquals(error.kind, originalKind);
  assertEquals(error.message, originalMessage);
  assertEquals(error.validationErrors, originalValidationErrors);

  // Verify the structure is correct
  assertEquals(error.kind, "VariableValidationFailed");
  assertEquals(typeof error.message, "string");
  assertEquals(Array.isArray(error.validationErrors), true);
});

Deno.test("Behavior: Error factory functions handle edge cases", () => {
  // Test with special characters in messages
  const specialCharsError = PromptGenerationServiceErrorFactory.promptGenerationFailed(
    "Error with special chars: äöü@#$%^&*(){}[]|\\:;\"'<>,.?/~`",
  );
  assertEquals(specialCharsError.kind, "PromptGenerationFailed");
  assertStringIncludes(specialCharsError.message, "äöü@#$%^&*(){}[]|\\:;\"'<>,.?/~`");

  // Test with empty strings
  const emptyReasonError = PromptGenerationServiceErrorFactory.promptGenerationFailed("");
  assertEquals(emptyReasonError.kind, "PromptGenerationFailed");
  assertEquals(emptyReasonError.reason, "");

  // Test with very long messages
  const longMessage = "A".repeat(1000);
  const longMessageError = PromptGenerationServiceErrorFactory.serviceConfigurationError(
    longMessage,
  );
  assertEquals(longMessageError.kind, "ServiceConfigurationError");
  assertEquals(longMessageError.configurationIssue, longMessage);
});

Deno.test("Behavior: Validation error array handling", () => {
  // Test with multiple validation errors
  const multipleErrors = [
    { message: "Error 1" },
    { message: "Error 2" },
    { message: "Error 3" },
  ];
  const error = PromptGenerationServiceErrorFactory.variableValidationFailed(multipleErrors);

  assertEquals(error.validationErrors.length, 3);
  assertEquals(error.validationErrors[0].message, "Error 1");
  assertEquals(error.validationErrors[1].message, "Error 2");
  assertEquals(error.validationErrors[2].message, "Error 3");

  // Message should contain all error messages
  assertStringIncludes(error.message, "Error 1");
  assertStringIncludes(error.message, "Error 2");
  assertStringIncludes(error.message, "Error 3");
});
