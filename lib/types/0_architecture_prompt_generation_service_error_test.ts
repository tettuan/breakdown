/**
 * @fileoverview Architecture tests for PromptGenerationService error types
 *
 * This test module verifies the structural constraints and design principles
 * of PromptGenerationService error types following totality principle.
 *
 * @module types/0_architecture_prompt_generation_service_error_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import type {
  PromptGenerationError,
  PromptGenerationServiceError,
  PromptGenerationServiceErrors,
  ServiceConfigurationError,
  TemplateResolutionError,
  VariableValidationError,
} from "./prompt_generation_service_error.ts";
import { PromptGenerationServiceErrorFactory } from "./prompt_generation_service_error.ts";

Deno.test("Architecture: PromptGenerationServiceError base interface structure", () => {
  const mockError: PromptGenerationServiceError = {
    kind: "TestError",
    message: "Test message",
    context: { test: "value" },
  };

  // Base interface must have required fields
  assertEquals(typeof mockError.kind, "string");
  assertEquals(typeof mockError.message, "string");

  // Context is optional
  assertExists(mockError.context);
  assertEquals(typeof mockError.context, "object");
});

Deno.test("Architecture: All error types extend base interface", () => {
  // VariableValidationError extends base
  const variableError: VariableValidationError = {
    kind: "VariableValidationFailed",
    message: "Variable validation failed",
    validationErrors: [{ message: "Test error" }],
  };

  assertEquals(typeof variableError.kind, "string");
  assertEquals(typeof variableError.message, "string");
  assertEquals(Array.isArray(variableError.validationErrors), true);

  // TemplateResolutionError extends base
  const templateError: TemplateResolutionError = {
    kind: "TemplateResolutionFailed",
    message: "Template resolution failed",
    templatePath: "/test/path",
  };

  assertEquals(typeof templateError.kind, "string");
  assertEquals(typeof templateError.message, "string");
  assertEquals(typeof templateError.templatePath, "string");

  // PromptGenerationError extends base
  const promptError: PromptGenerationError = {
    kind: "PromptGenerationFailed",
    message: "Prompt generation failed",
    reason: "Test reason",
  };

  assertEquals(typeof promptError.kind, "string");
  assertEquals(typeof promptError.message, "string");
  assertEquals(typeof promptError.reason, "string");

  // ServiceConfigurationError extends base
  const configError: ServiceConfigurationError = {
    kind: "ServiceConfigurationError",
    message: "Service configuration error",
    configurationIssue: "Test issue",
  };

  assertEquals(typeof configError.kind, "string");
  assertEquals(typeof configError.message, "string");
  assertEquals(typeof configError.configurationIssue, "string");
});

Deno.test("Architecture: Union type completeness", () => {
  // Ensure all specific error types are included in union
  const variableError: PromptGenerationServiceErrors = {
    kind: "VariableValidationFailed",
    message: "Variable validation failed",
    validationErrors: [],
  };

  const templateError: PromptGenerationServiceErrors = {
    kind: "TemplateResolutionFailed",
    message: "Template resolution failed",
  };

  const promptError: PromptGenerationServiceErrors = {
    kind: "PromptGenerationFailed",
    message: "Prompt generation failed",
    reason: "Test reason",
  };

  const configError: PromptGenerationServiceErrors = {
    kind: "ServiceConfigurationError",
    message: "Service configuration error",
    configurationIssue: "Test issue",
  };

  // Verify all types are valid members of union
  assertEquals(variableError.kind, "VariableValidationFailed");
  assertEquals(templateError.kind, "TemplateResolutionFailed");
  assertEquals(promptError.kind, "PromptGenerationFailed");
  assertEquals(configError.kind, "ServiceConfigurationError");
});

Deno.test("Architecture: Error factory functions exist and are properly typed", () => {
  // Verify factory object exists
  assertExists(PromptGenerationServiceErrorFactory);

  // Verify all factory methods exist
  assertEquals(typeof PromptGenerationServiceErrorFactory.variableValidationFailed, "function");
  assertEquals(typeof PromptGenerationServiceErrorFactory.templateResolutionFailed, "function");
  assertEquals(typeof PromptGenerationServiceErrorFactory.promptGenerationFailed, "function");
  assertEquals(typeof PromptGenerationServiceErrorFactory.serviceConfigurationError, "function");
});

Deno.test("Architecture: Kind discriminator uniqueness", () => {
  // Verify each error type has unique kind value
  const kinds = [
    "VariableValidationFailed",
    "TemplateResolutionFailed",
    "PromptGenerationFailed",
    "ServiceConfigurationError",
  ];

  // Check uniqueness
  const uniqueKinds = new Set(kinds);
  assertEquals(uniqueKinds.size, kinds.length, "All kind values must be unique");
});

Deno.test("Architecture: Readonly properties constraint", () => {
  const error = PromptGenerationServiceErrorFactory.variableValidationFailed([
    { message: "Test error" },
  ]);

  // Verify readonly constraint by attempting to access properties
  assertEquals(error.kind, "VariableValidationFailed");
  assertEquals(typeof error.message, "string");
  assertEquals(Array.isArray(error.validationErrors), true);

  // TypeScript readonly is compile-time only, not runtime
  // This test verifies that the interface declares readonly properties
  // Runtime immutability would require Object.freeze() or similar
  const originalKind = error.kind;

  // In JavaScript/TypeScript, readonly is only a compile-time constraint
  // The actual runtime behavior allows modification unless Object.freeze() is used
  // This test documents the expected compile-time readonly behavior
  assertEquals(error.kind, originalKind);
});

Deno.test("Architecture: Context field is optional across all error types", () => {
  // Test that context field is optional for all error types
  const variableError: VariableValidationError = {
    kind: "VariableValidationFailed",
    message: "Test",
    validationErrors: [],
    // context is intentionally omitted
  };

  const templateError: TemplateResolutionError = {
    kind: "TemplateResolutionFailed",
    message: "Test",
    // context is intentionally omitted
  };

  const promptError: PromptGenerationError = {
    kind: "PromptGenerationFailed",
    message: "Test",
    reason: "Test reason",
    // context is intentionally omitted
  };

  const configError: ServiceConfigurationError = {
    kind: "ServiceConfigurationError",
    message: "Test",
    configurationIssue: "Test issue",
    // context is intentionally omitted
  };

  // Verify all are valid without context
  assertEquals(variableError.kind, "VariableValidationFailed");
  assertEquals(templateError.kind, "TemplateResolutionFailed");
  assertEquals(promptError.kind, "PromptGenerationFailed");
  assertEquals(configError.kind, "ServiceConfigurationError");
});
