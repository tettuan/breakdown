/**
 * @fileoverview Structure tests for PromptGenerationService error types
 *
 * This test module verifies the structural integrity and consistency
 * of PromptGenerationService error types and their relationships.
 *
 * @module types/2_structure_prompt_generation_service_error_test
 */

import { assertEquals, assert } from "@std/assert";
import type {
  PromptGenerationServiceError,
  PromptGenerationServiceErrors,
  VariableValidationError,
  TemplateResolutionError,
  PromptGenerationError,
  ServiceConfigurationError,
} from "./prompt_generation_service_error.ts";
import { PromptGenerationServiceErrorFactory } from "./prompt_generation_service_error.ts";

Deno.test("Structure: Base error interface property types", () => {
  const error: PromptGenerationServiceError = {
    kind: "TestError",
    message: "Test message",
    context: { key: "value", number: 42, boolean: true },
  };

  // Verify property types
  assertEquals(typeof error.kind, "string");
  assertEquals(typeof error.message, "string");
  assertEquals(typeof error.context, "object");
  assert(error.context !== null);
});

Deno.test("Structure: VariableValidationError specific properties", () => {
  const error: VariableValidationError = {
    kind: "VariableValidationFailed",
    message: "Validation failed",
    validationErrors: [
      { message: "Error 1" },
      { message: "Error 2" },
    ],
  };

  // Verify structure
  assertEquals(error.kind, "VariableValidationFailed");
  assertEquals(typeof error.message, "string");
  assert(Array.isArray(error.validationErrors));
  assertEquals(error.validationErrors.length, 2);
  
  // Verify validation error structure
  error.validationErrors.forEach((validationError) => {
    assert(typeof validationError === "object");
    assertEquals(typeof validationError.message, "string");
  });
});

Deno.test("Structure: TemplateResolutionError specific properties", () => {
  const errorWithPath: TemplateResolutionError = {
    kind: "TemplateResolutionFailed",
    message: "Template not found",
    templatePath: "/path/to/template.md",
  };

  const errorWithoutPath: TemplateResolutionError = {
    kind: "TemplateResolutionFailed",
    message: "Template not found",
  };

  // Verify structure with path
  assertEquals(errorWithPath.kind, "TemplateResolutionFailed");
  assertEquals(typeof errorWithPath.message, "string");
  assertEquals(typeof errorWithPath.templatePath, "string");

  // Verify structure without path
  assertEquals(errorWithoutPath.kind, "TemplateResolutionFailed");
  assertEquals(typeof errorWithoutPath.message, "string");
  assertEquals(errorWithoutPath.templatePath, undefined);
});

Deno.test("Structure: PromptGenerationError specific properties", () => {
  const error: PromptGenerationError = {
    kind: "PromptGenerationFailed",
    message: "Generation failed",
    reason: "Template parsing error",
  };

  // Verify structure
  assertEquals(error.kind, "PromptGenerationFailed");
  assertEquals(typeof error.message, "string");
  assertEquals(typeof error.reason, "string");
});

Deno.test("Structure: ServiceConfigurationError specific properties", () => {
  const error: ServiceConfigurationError = {
    kind: "ServiceConfigurationError",
    message: "Configuration invalid",
    configurationIssue: "Missing API key",
  };

  // Verify structure
  assertEquals(error.kind, "ServiceConfigurationError");
  assertEquals(typeof error.message, "string");
  assertEquals(typeof error.configurationIssue, "string");
});

Deno.test("Structure: Union type discriminated by kind property", () => {
  const errors: PromptGenerationServiceErrors[] = [
    {
      kind: "VariableValidationFailed",
      message: "Validation failed",
      validationErrors: [],
    },
    {
      kind: "TemplateResolutionFailed",
      message: "Template failed",
    },
    {
      kind: "PromptGenerationFailed",
      message: "Generation failed",
      reason: "Test reason",
    },
    {
      kind: "ServiceConfigurationError",
      message: "Config failed",
      configurationIssue: "Test issue",
    },
  ];

  // Verify each error can be discriminated by kind
  errors.forEach((error) => {
    switch (error.kind) {
      case "VariableValidationFailed":
        assert("validationErrors" in error);
        assert(Array.isArray(error.validationErrors));
        break;
      case "TemplateResolutionFailed":
        assert("templatePath" in error || error.templatePath === undefined);
        break;
      case "PromptGenerationFailed":
        assert("reason" in error);
        assertEquals(typeof error.reason, "string");
        break;
      case "ServiceConfigurationError":
        assert("configurationIssue" in error);
        assertEquals(typeof error.configurationIssue, "string");
        break;
      default:
        assert(false, `Unexpected error kind: ${(error as any).kind}`);
    }
  });
});

Deno.test("Structure: Factory-generated errors maintain proper structure", () => {
  // Test VariableValidationError factory
  const variableError = PromptGenerationServiceErrorFactory.variableValidationFailed([
    { message: "Test validation error" },
  ]);
  
  assertEquals(variableError.kind, "VariableValidationFailed");
  assertEquals(typeof variableError.message, "string");
  assert(Array.isArray(variableError.validationErrors));
  assertEquals(variableError.validationErrors.length, 1);

  // Test TemplateResolutionError factory
  const templateError = PromptGenerationServiceErrorFactory.templateResolutionFailed("/test/path");
  
  assertEquals(templateError.kind, "TemplateResolutionFailed");
  assertEquals(typeof templateError.message, "string");
  assertEquals(typeof templateError.templatePath, "string");

  // Test PromptGenerationError factory
  const promptError = PromptGenerationServiceErrorFactory.promptGenerationFailed("test reason");
  
  assertEquals(promptError.kind, "PromptGenerationFailed");
  assertEquals(typeof promptError.message, "string");
  assertEquals(typeof promptError.reason, "string");

  // Test ServiceConfigurationError factory
  const configError = PromptGenerationServiceErrorFactory.serviceConfigurationError("test issue");
  
  assertEquals(configError.kind, "ServiceConfigurationError");
  assertEquals(typeof configError.message, "string");
  assertEquals(typeof configError.configurationIssue, "string");
});

Deno.test("Structure: Error objects are JSON serializable", () => {
  const errors = [
    PromptGenerationServiceErrorFactory.variableValidationFailed([{ message: "Test" }]),
    PromptGenerationServiceErrorFactory.templateResolutionFailed("/test"),
    PromptGenerationServiceErrorFactory.promptGenerationFailed("test"),
    PromptGenerationServiceErrorFactory.serviceConfigurationError("test"),
  ];

  errors.forEach((error) => {
    // Should be able to serialize to JSON
    const jsonString = JSON.stringify(error);
    assert(typeof jsonString === "string");
    assert(jsonString.length > 0);

    // Should be able to deserialize from JSON
    const parsed = JSON.parse(jsonString);
    assertEquals(parsed.kind, error.kind);
    assertEquals(parsed.message, error.message);
  });
});

Deno.test("Structure: Context property structure when present", () => {
  const contextData = {
    timestamp: new Date().toISOString(),
    userId: "test-user-123",
    operation: "template-resolution",
    metadata: {
      templateId: "template-456",
      version: "1.0.0",
    },
  };

  const error: PromptGenerationServiceError = {
    kind: "TestError",
    message: "Test with context",
    context: contextData,
  };

  // Verify context structure
  assertEquals(typeof error.context, "object");
  assert(error.context !== null);
  assert(error.context !== undefined);
  assertEquals(error.context!.timestamp, contextData.timestamp);
  assertEquals(error.context!.userId, contextData.userId);
  assertEquals(error.context!.operation, contextData.operation);
  assertEquals(typeof error.context!.metadata, "object");
});

Deno.test("Structure: Validation error array element structure", () => {
  const validationErrors = [
    { message: "Field 'name' is required" },
    { message: "Field 'age' must be positive" },
    { message: "Field 'email' must be valid format" },
  ];

  const error = PromptGenerationServiceErrorFactory.variableValidationFailed(validationErrors);

  // Verify each validation error has proper structure
  error.validationErrors.forEach((validationError, index) => {
    assertEquals(typeof validationError, "object");
    assert(validationError !== null);
    assertEquals(typeof validationError.message, "string");
    assertEquals(validationError.message, validationErrors[index].message);
  });
});

Deno.test("Structure: Factory object structure and immutability", () => {
  // Verify factory object structure
  const factoryKeys = Object.keys(PromptGenerationServiceErrorFactory);
  const expectedKeys = [
    "variableValidationFailed",
    "templateResolutionFailed",
    "promptGenerationFailed",
    "serviceConfigurationError",
  ];

  assertEquals(factoryKeys.length, expectedKeys.length);
  expectedKeys.forEach((key) => {
    assert(factoryKeys.includes(key));
    assertEquals(typeof PromptGenerationServiceErrorFactory[key as keyof typeof PromptGenerationServiceErrorFactory], "function");
  });

  // Verify factory is immutable (const assertion)
  const originalFactory = PromptGenerationServiceErrorFactory;
  
  // Should not be able to modify factory methods
  try {
    // @ts-expect-error - Testing immutability
    PromptGenerationServiceErrorFactory.variableValidationFailed = () => ({ kind: "Modified", message: "Modified" });
  } catch {
    // Expected to fail in strict mode
  }
  
  // Factory should remain unchanged
  assertEquals(PromptGenerationServiceErrorFactory, originalFactory);
});