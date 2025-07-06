/**
 * @fileoverview Architecture tests for PromptVariablesFactoryError types
 *
 * Tests architectural constraints and design principles including:
 * - Discriminated union pattern enforcement
 * - Type safety and exhaustiveness
 * - Immutability of error objects
 * - Factory function correctness
 * - Interface hierarchy and inheritance
 *
 * @module types/0_architecture_prompt_variables_factory_error_test
 */

import {
  assert,
  assertEquals,
  assertNotStrictEquals,
} from "../deps.ts";
import {
  type PathOptionsCreationError,
  type PromptVariablesFactoryError,
  type PromptVariablesFactoryErrors,
  PromptVariablesFactoryErrorFactory,
  type SchemaFilePathNotResolvedError,
  type TemplateResolverCreationError,
} from "./prompt_variables_factory_error.ts";

Deno.test("PromptVariablesFactoryError Architecture - Base interface structure", () => {
  // All error types should extend base interface
  const errors: PromptVariablesFactoryError[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test error"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test error"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test error"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Base properties must exist
    assert("kind" in error, "Error should have 'kind' property");
    assert("message" in error, "Error should have 'message' property");
    assertEquals(typeof error.kind, "string", "kind should be string");
    assertEquals(typeof error.message, "string", "message should be string");
    
    // Optional context property
    if ("context" in error) {
      assertEquals(typeof error.context, "object", "context should be object when present");
    }
  }
});

Deno.test("PromptVariablesFactoryError Architecture - Discriminated union pattern", () => {
  const errors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  const kinds = new Set<string>();
  for (const error of errors) {
    // Each error should have a unique kind
    assert(!kinds.has(error.kind), `Duplicate kind found: ${error.kind}`);
    kinds.add(error.kind);
  }

  // Verify all expected kinds are present
  const expectedKinds = [
    "PathOptionsCreationFailed",
    "TemplateResolverCreationFailed",
    "SchemaResolverCreationFailed",
    "PromptFilePathNotResolved",
    "InputFilePathNotResolved",
    "OutputFilePathNotResolved",
    "SchemaFilePathNotResolved",
  ];

  assertEquals(kinds.size, expectedKinds.length, "Should have all expected error kinds");
  for (const expectedKind of expectedKinds) {
    assert(kinds.has(expectedKind), `Missing expected kind: ${expectedKind}`);
  }
});

Deno.test("PromptVariablesFactoryError Architecture - Type guards through kind property", () => {
  const errors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Type guard using kind
    switch (error.kind) {
      case "PathOptionsCreationFailed": {
        // TypeScript should narrow type here
        const pathError: PathOptionsCreationError = error;
        assert("pathOptionsError" in pathError);
        assertEquals(typeof pathError.pathOptionsError, "string");
        break;
      }
      case "TemplateResolverCreationFailed": {
        const templateError: TemplateResolverCreationError = error;
        assert("resolverError" in templateError);
        assertEquals(typeof templateError.resolverError, "string");
        break;
      }
      case "SchemaResolverCreationFailed": {
        assert("resolverError" in error);
        break;
      }
      case "PromptFilePathNotResolved": {
        // Should not have additional properties
        assert(!("pathOptionsError" in error));
        assert(!("resolverError" in error));
        break;
      }
      default:
        // Other cases handled similarly
        break;
    }
  }
});

Deno.test("PromptVariablesFactoryError Architecture - Factory function immutability", () => {
  // Test that factory functions create new objects each time
  const error1 = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test");
  const error2 = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test");
  
  assertNotStrictEquals(error1, error2, "Factory should create new objects");
  assertEquals(error1.kind, error2.kind, "Same inputs should produce same kind");
  assertEquals(error1.message, error2.message, "Same inputs should produce same message");
  assertEquals(error1.pathOptionsError, error2.pathOptionsError, "Same inputs should produce same error details");

  // Test readonly properties (compile-time check)
  const error = PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test");
  const originalKind = error.kind;
  const originalMessage = error.message;
  
  // TypeScript enforces readonly at compile time
  // Runtime immutability depends on implementation
  assertEquals(typeof error.kind, "string", "kind should be string");
  assertEquals(typeof error.message, "string", "message should be string");
  assertEquals(error.kind, originalKind, "kind should be consistent");
  assertEquals(error.message, originalMessage, "message should be consistent");
});

Deno.test("PromptVariablesFactoryError Architecture - Exhaustive type handling", () => {
  // Helper function to ensure exhaustive handling
  function handleError(error: PromptVariablesFactoryErrors): string {
    switch (error.kind) {
      case "PathOptionsCreationFailed":
        return `Path options: ${error.pathOptionsError}`;
      case "TemplateResolverCreationFailed":
        return `Template resolver: ${error.resolverError}`;
      case "SchemaResolverCreationFailed":
        return `Schema resolver: ${error.resolverError}`;
      case "PromptFilePathNotResolved":
        return "Prompt file path not resolved";
      case "InputFilePathNotResolved":
        return "Input file path not resolved";
      case "OutputFilePathNotResolved":
        return "Output file path not resolved";
      case "SchemaFilePathNotResolved":
        return "Schema file path not resolved";
      default: {
        // This ensures exhaustive handling at compile time
        const _exhaustive: never = error;
        return _exhaustive;
      }
    }
  }

  // Test all error types can be handled
  const testCases: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  for (const error of testCases) {
    const result = handleError(error);
    assert(result.length > 0, "Handler should return non-empty string");
  }
});

Deno.test("PromptVariablesFactoryError Architecture - Factory object is const", () => {
  // Verify factory object is truly const (immutable)
  const factoryKeys = Object.keys(PromptVariablesFactoryErrorFactory);
  const expectedKeys = [
    "pathOptionsCreationFailed",
    "templateResolverCreationFailed",
    "schemaResolverCreationFailed",
    "promptFilePathNotResolved",
    "inputFilePathNotResolved",
    "outputFilePathNotResolved",
    "schemaFilePathNotResolved",
  ];

  assertEquals(factoryKeys.length, expectedKeys.length, "Factory should have expected number of methods");
  for (const key of expectedKeys) {
    assert(factoryKeys.includes(key), `Factory should have method: ${key}`);
  }

  // All factory methods should be functions
  for (const key of factoryKeys) {
    const value = (PromptVariablesFactoryErrorFactory as any)[key];
    assertEquals(typeof value, "function", `${key} should be a function`);
  }

  // Factory object should be consistently accessible
  const originalMethod = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed;
  assertEquals(typeof originalMethod, "function", "Factory method should be function");
  assertEquals(
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed,
    originalMethod,
    "Factory methods should be consistent"
  );
});

Deno.test("PromptVariablesFactoryError Architecture - Error message consistency", () => {
  // Test that error messages follow consistent pattern
  const testCases = [
    {
      error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test detail"),
      expectedPattern: /Failed to create path options: test detail/,
    },
    {
      error: PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("resolver issue"),
      expectedPattern: /Failed to create template resolver: resolver issue/,
    },
    {
      error: PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("schema problem"),
      expectedPattern: /Failed to create schema resolver: schema problem/,
    },
    {
      error: PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
      expectedPattern: /Prompt file path not resolved/,
    },
  ];

  for (const { error, expectedPattern } of testCases) {
    assert(
      expectedPattern.test(error.message),
      `Message "${error.message}" should match pattern ${expectedPattern}`
    );
  }
});

Deno.test("PromptVariablesFactoryError Architecture - Type narrowing with custom type guards", () => {
  // Custom type guards for each error type
  function isPathOptionsCreationError(
    error: PromptVariablesFactoryErrors
  ): error is PathOptionsCreationError {
    return error.kind === "PathOptionsCreationFailed";
  }

  function isSchemaFilePathNotResolvedError(
    error: PromptVariablesFactoryErrors
  ): error is SchemaFilePathNotResolvedError {
    return error.kind === "SchemaFilePathNotResolved";
  }

  // Test type guards work correctly
  const pathError = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test");
  const schemaError = PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved();

  // Verify errors were created successfully
  assert(pathError && schemaError, "Errors should be created successfully");

  assert(isPathOptionsCreationError(pathError), "Should identify path options error");
  assert(!isPathOptionsCreationError(schemaError), "Should not misidentify schema error");
  
  assert(isSchemaFilePathNotResolvedError(schemaError), "Should identify schema error");
  assert(!isSchemaFilePathNotResolvedError(pathError), "Should not misidentify path error");

  // Type narrowing should work
  if (isPathOptionsCreationError(pathError)) {
    // TypeScript knows this is PathOptionsCreationError
    assertEquals(pathError.pathOptionsError, "test");
  }
});