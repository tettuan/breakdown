/**
 * @fileoverview Behavior tests for PromptVariablesFactoryError types
 *
 * Tests the behavioral correctness of error types including:
 * - Factory function behavior and consistency
 * - Error message generation
 * - Context preservation
 * - Integration with error handling patterns
 * - Error propagation scenarios
 *
 * @module types/1_behavior_prompt_variables_factory_error_test
 */

import { assert, assertEquals, assertStringIncludes } from "../deps.ts";
import {
  PromptVariablesFactoryErrorFactory,
  type PromptVariablesFactoryErrors,
} from "./prompt_variables_factory_error.ts";

Deno.test("PromptVariablesFactoryError Behavior - Factory function consistency", () => {
  // Test that multiple calls with same input produce equivalent errors
  const error1 = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test error");
  const error2 = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test error");

  // Should be structurally equivalent but different instances
  assertEquals(error1.kind, error2.kind);
  assertEquals(error1.message, error2.message);
  assertEquals(error1.pathOptionsError, error2.pathOptionsError);
  assert(error1 !== error2, "Should create new instances");
});

Deno.test("PromptVariablesFactoryError Behavior - Error message composition", () => {
  const testCases = [
    {
      factory: () => PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("invalid path"),
      expectedInMessage: ["Failed to create path options", "invalid path"],
    },
    {
      factory: () =>
        PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("missing config"),
      expectedInMessage: ["Failed to create template resolver", "missing config"],
    },
    {
      factory: () =>
        PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("schema not found"),
      expectedInMessage: ["Failed to create schema resolver", "schema not found"],
    },
    {
      factory: () => PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
      expectedInMessage: ["Prompt file path not resolved"],
    },
    {
      factory: () => PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
      expectedInMessage: ["Input file path not resolved"],
    },
    {
      factory: () => PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
      expectedInMessage: ["Output file path not resolved"],
    },
    {
      factory: () => PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
      expectedInMessage: ["Schema file path not resolved"],
    },
  ];

  for (const { factory, expectedInMessage } of testCases) {
    const error = factory();
    for (const expectedText of expectedInMessage) {
      assertStringIncludes(
        error.message,
        expectedText,
        `Message "${error.message}" should contain "${expectedText}"`,
      );
    }
  }
});

Deno.test("PromptVariablesFactoryError Behavior - Error categorization by content", () => {
  // Creation errors should include details
  const pathError = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("detail");
  assertEquals(pathError.pathOptionsError, "detail");
  assertStringIncludes(pathError.message, "detail");

  const templateError = PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(
    "template issue",
  );
  assertEquals(templateError.resolverError, "template issue");
  assertStringIncludes(templateError.message, "template issue");

  const schemaError = PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed(
    "schema problem",
  );
  assertEquals(schemaError.resolverError, "schema problem");
  assertStringIncludes(schemaError.message, "schema problem");

  // Path resolution errors should be simple
  const promptError = PromptVariablesFactoryErrorFactory.promptFilePathNotResolved();
  assert(!("pathOptionsError" in promptError));
  assert(!("resolverError" in promptError));
  assertEquals(promptError.message, "Prompt file path not resolved");

  const inputError = PromptVariablesFactoryErrorFactory.inputFilePathNotResolved();
  assert(!("pathOptionsError" in inputError));
  assert(!("resolverError" in inputError));
  assertEquals(inputError.message, "Input file path not resolved");
});

Deno.test("PromptVariablesFactoryError Behavior - Error filtering and categorization", () => {
  const errors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("path issue"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("template issue"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("schema issue"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  // Filter creation errors (have additional details)
  const creationErrors = errors.filter((error) => error.kind.includes("CreationFailed"));
  assertEquals(creationErrors.length, 3);
  for (const error of creationErrors) {
    assert("resolverError" in error || "pathOptionsError" in error);
  }

  // Filter path resolution errors (simple errors)
  const pathResolutionErrors = errors.filter((error) => error.kind.includes("NotResolved"));
  assertEquals(pathResolutionErrors.length, 4);
  for (const error of pathResolutionErrors) {
    assert(!("resolverError" in error));
    assert(!("pathOptionsError" in error));
  }
});

Deno.test("PromptVariablesFactoryError Behavior - Error handling patterns", () => {
  // Test common error handling pattern
  function handleFactoryError(error: PromptVariablesFactoryErrors): string {
    switch (error.kind) {
      case "PathOptionsCreationFailed":
        return `Path options failed: ${error.pathOptionsError}`;
      case "TemplateResolverCreationFailed":
        return `Template resolver failed: ${error.resolverError}`;
      case "SchemaResolverCreationFailed":
        return `Schema resolver failed: ${error.resolverError}`;
      case "PromptFilePathNotResolved":
        return "Cannot resolve prompt file path";
      case "InputFilePathNotResolved":
        return "Cannot resolve input file path";
      case "OutputFilePathNotResolved":
        return "Cannot resolve output file path";
      case "SchemaFilePathNotResolved":
        return "Cannot resolve schema file path";
      case "PromptPathResolutionFailed":
        return `Prompt path resolution failed: ${error.details}`;
      case "InputPathResolutionFailed":
        return `Input path resolution failed: ${error.details}`;
      case "OutputPathResolutionFailed":
        return `Output path resolution failed: ${error.details}`;
      case "SchemaPathResolutionFailed":
        return `Schema path resolution failed: ${error.details}`;
      default: {
        const _exhaustive: never = error;
        return _exhaustive;
      }
    }
  }

  // Test all error types can be handled
  const testErrors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  for (const error of testErrors) {
    const result = handleFactoryError(error);
    assert(result.length > 0, "Handler should return meaningful message");
    assert(!result.includes("undefined"), "Handler should not have undefined values");
  }
});

Deno.test("PromptVariablesFactoryError Behavior - Input validation and edge cases", () => {
  // Test empty string inputs
  const emptyError = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("");
  assertEquals(emptyError.pathOptionsError, "");
  assertStringIncludes(emptyError.message, "Failed to create path options: ");

  // Test with special characters
  const specialCharsError = PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(
    "Error with symbols: !@#$%^&*()_+{}|:<>?[];',./~`",
  );
  assertEquals(specialCharsError.resolverError, "Error with symbols: !@#$%^&*()_+{}|:<>?[];',./~`");
  assertStringIncludes(
    specialCharsError.message,
    "Error with symbols: !@#$%^&*()_+{}|:<>?[];',./~`",
  );

  // Test with unicode characters
  const unicodeError = PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed(
    "Erreur avec des caractères unicode: αβγδε 中文 🚀",
  );
  assertEquals(unicodeError.resolverError, "Erreur avec des caractères unicode: αβγδε 中文 🚀");
  assertStringIncludes(unicodeError.message, "Erreur avec des caractères unicode: αβγδε 中文 🚀");

  // Test with very long strings
  const longString = "A".repeat(1000);
  const longError = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed(longString);
  assertEquals(longError.pathOptionsError, longString);
  assertStringIncludes(longError.message, longString);
});

Deno.test("PromptVariablesFactoryError Behavior - Error context and debugging", () => {
  // Test context property (optional)
  const errors = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Context is optional but if present should be an object
    if (error.context !== undefined) {
      assertEquals(typeof error.context, "object");
      assert(error.context !== null);
    }
  }

  // Test error properties for debugging
  const debugError = PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(
    "debug info",
  );
  assert(debugError.kind.length > 0, "Kind should be non-empty for debugging");
  assert(debugError.message.length > 0, "Message should be non-empty for debugging");
  assert(debugError.resolverError.length > 0, "Resolver error should be non-empty for debugging");
});

Deno.test("PromptVariablesFactoryError Behavior - Error aggregation scenarios", () => {
  // Test collecting multiple errors
  const errors: PromptVariablesFactoryErrors[] = [];

  // Simulate multiple failures
  errors.push(PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("invalid config"));
  errors.push(
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("missing template"),
  );
  errors.push(PromptVariablesFactoryErrorFactory.promptFilePathNotResolved());

  assertEquals(errors.length, 3);

  // Group by error category
  const byCategory = new Map<string, PromptVariablesFactoryErrors[]>();
  for (const error of errors) {
    const category = error.kind.includes("CreationFailed") ? "creation" : "resolution";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(error);
  }

  assertEquals(byCategory.get("creation")?.length, 2);
  assertEquals(byCategory.get("resolution")?.length, 1);

  // Test error severity classification
  function getErrorSeverity(error: PromptVariablesFactoryErrors): "high" | "medium" | "low" {
    switch (error.kind) {
      case "PathOptionsCreationFailed":
      case "TemplateResolverCreationFailed":
      case "SchemaResolverCreationFailed":
        return "high"; // System setup failures
      case "PromptFilePathNotResolved":
      case "SchemaFilePathNotResolved":
        return "high"; // Required files missing
      case "InputFilePathNotResolved":
      case "OutputFilePathNotResolved":
        return "medium"; // File operations may have fallbacks
      default:
        return "low";
    }
  }

  const severities = errors.map(getErrorSeverity);
  assert(severities.includes("high"), "Should have high severity errors");
  // Note: In current test scenario, all errors are high severity
});

Deno.test("PromptVariablesFactoryError Behavior - Error serialization and logging", () => {
  const errors = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("serialization test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Test JSON serialization
    const serialized = JSON.stringify(error);
    assert(serialized.length > 0, "Error should be serializable");

    const parsed = JSON.parse(serialized);
    assertEquals(parsed.kind, error.kind);
    assertEquals(parsed.message, error.message);

    // Test string representation for logging
    const stringRep = `${error.kind}: ${error.message}`;
    assert(stringRep.length > 0, "Should have meaningful string representation");
    assert(stringRep.includes(error.kind), "String rep should include kind");
    assert(stringRep.includes(error.message), "String rep should include message");
  }
});

Deno.test("PromptVariablesFactoryError Behavior - Factory method robustness", () => {
  // Test all factory methods exist and are callable
  const factoryMethods = [
    "pathOptionsCreationFailed",
    "templateResolverCreationFailed",
    "schemaResolverCreationFailed",
    "promptFilePathNotResolved",
    "inputFilePathNotResolved",
    "outputFilePathNotResolved",
    "schemaFilePathNotResolved",
  ];

  for (const methodName of factoryMethods) {
    const method = (PromptVariablesFactoryErrorFactory as any)[methodName];
    assertEquals(typeof method, "function", `${methodName} should be a function`);

    // Test that method can be called (with appropriate arguments)
    let error: PromptVariablesFactoryErrors;
    if (methodName.includes("CreationFailed")) {
      error = method("test");
    } else {
      error = method();
    }

    assert(error.kind.length > 0, `${methodName} should produce valid error`);
    assert(error.message.length > 0, `${methodName} should produce valid message`);
  }
});
