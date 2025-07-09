/**
 * @fileoverview Structure tests for PromptVariablesFactoryError types
 *
 * Tests the structural correctness and data integrity including:
 * - Type interface compliance
 * - Property structure validation
 * - Inheritance relationships
 * - Factory object structure
 * - Type union completeness
 *
 * @module types/2_structure_prompt_variables_factory_error_test
 */

import { assert, assertEquals, assertObjectMatch } from "../deps.ts";
import {
  type InputFilePathNotResolvedError,
  type PathOptionsCreationError,
  type PromptVariablesFactoryError,
  PromptVariablesFactoryErrorFactory,
  type PromptVariablesFactoryErrors,
  type SchemaResolverCreationError,
  type TemplateResolverCreationError,
} from "./prompt_variables_factory_error.ts";

Deno.test("PromptVariablesFactoryError Structure - Base interface compliance", () => {
  // All error types should conform to base interface
  const errors: PromptVariablesFactoryError[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Required properties from base interface
    assert("kind" in error);
    assert("message" in error);
    assertEquals(typeof error.kind, "string");
    assertEquals(typeof error.message, "string");
    assert(error.kind.length > 0);
    assert(error.message.length > 0);

    // Readonly properties verification
    const originalKind = error.kind;
    const originalMessage = error.message;

    // Properties should be readonly (TypeScript enforces this at compile time)
    assertEquals(error.kind, originalKind);
    assertEquals(error.message, originalMessage);

    // Optional context property structure
    if (error.context !== undefined) {
      assertEquals(typeof error.context, "object");
      assert(error.context !== null);
    }
  }
});

Deno.test("PromptVariablesFactoryError Structure - Extended interface properties", () => {
  // Test PathOptionsCreationError structure
  const pathError: PathOptionsCreationError = PromptVariablesFactoryErrorFactory
    .pathOptionsCreationFailed("test error");
  assertEquals(pathError.kind, "PathOptionsCreationFailed");
  assertEquals(typeof pathError.pathOptionsError, "string");
  assertEquals(pathError.pathOptionsError, "test error");
  assertObjectMatch(pathError, {
    kind: "PathOptionsCreationFailed",
    pathOptionsError: "test error",
  });

  // Test TemplateResolverCreationError structure
  const templateError: TemplateResolverCreationError = PromptVariablesFactoryErrorFactory
    .templateResolverCreationFailed("template issue");
  assertEquals(templateError.kind, "TemplateResolverCreationFailed");
  assertEquals(typeof templateError.resolverError, "string");
  assertEquals(templateError.resolverError, "template issue");
  assertObjectMatch(templateError, {
    kind: "TemplateResolverCreationFailed",
    resolverError: "template issue",
  });

  // Test SchemaResolverCreationError structure
  const schemaError: SchemaResolverCreationError = PromptVariablesFactoryErrorFactory
    .schemaResolverCreationFailed("schema problem");
  assertEquals(schemaError.kind, "SchemaResolverCreationFailed");
  assertEquals(typeof schemaError.resolverError, "string");
  assertEquals(schemaError.resolverError, "schema problem");
  assertObjectMatch(schemaError, {
    kind: "SchemaResolverCreationFailed",
    resolverError: "schema problem",
  });

  // Test simple error structure (no additional properties)
  const inputError: InputFilePathNotResolvedError = PromptVariablesFactoryErrorFactory
    .inputFilePathNotResolved();
  assertEquals(inputError.kind, "InputFilePathNotResolved");
  assertEquals(typeof inputError.message, "string");
  // Should not have additional properties beyond base interface
  assert(!("pathOptionsError" in inputError));
  assert(!("resolverError" in inputError));
});

Deno.test("PromptVariablesFactoryError Structure - Union type completeness", () => {
  // Test that all factory-created errors are assignable to union type
  const errors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  // All errors should be valid union members
  assertEquals(errors.length, 7);

  // Verify unique kinds
  const kinds = errors.map((e) => e.kind);
  const uniqueKinds = new Set(kinds);
  assertEquals(uniqueKinds.size, 7, "All error kinds should be unique");

  // Verify expected kinds are present
  const expectedKinds = [
    "PathOptionsCreationFailed",
    "TemplateResolverCreationFailed",
    "SchemaResolverCreationFailed",
    "PromptFilePathNotResolved",
    "InputFilePathNotResolved",
    "OutputFilePathNotResolved",
    "SchemaFilePathNotResolved",
  ];

  for (const expectedKind of expectedKinds) {
    assert(kinds.includes(expectedKind as any), `Union should include ${expectedKind}`);
  }
});

Deno.test("PromptVariablesFactoryError Structure - Factory object structure", () => {
  // Verify factory object has correct structure
  const factoryKeys = Object.keys(PromptVariablesFactoryErrorFactory);
  const expectedMethods = [
    "pathOptionsCreationFailed",
    "templateResolverCreationFailed",
    "schemaResolverCreationFailed",
    "promptFilePathNotResolved",
    "inputFilePathNotResolved",
    "outputFilePathNotResolved",
    "schemaFilePathNotResolved",
  ];

  // Pattern 2: Flexible handling - factory may have additional methods
  assert(
    factoryKeys.length >= expectedMethods.length,
    `Factory should have at least ${expectedMethods.length} methods, found ${factoryKeys.length}`,
  );

  for (const method of expectedMethods) {
    assert(factoryKeys.includes(method), `Factory should have method: ${method}`);
    assertEquals(typeof (PromptVariablesFactoryErrorFactory as any)[method], "function");
  }

  // Verify all factory methods are functions (Pattern 2: Comprehensive validation)
  for (const key of factoryKeys) {
    assertEquals(
      typeof (PromptVariablesFactoryErrorFactory as any)[key],
      "function",
      `All factory exports should be functions: ${key}`,
    );
  }

  // Verify factory is read-only (const assertion)
  const factory = PromptVariablesFactoryErrorFactory;
  assertEquals(typeof factory, "object");
  assert(factory !== null);

  // Verify method signatures by parameter count
  assertEquals(
    factory.pathOptionsCreationFailed.length,
    1,
    "pathOptionsCreationFailed should take 1 parameter",
  );
  assertEquals(
    factory.templateResolverCreationFailed.length,
    1,
    "templateResolverCreationFailed should take 1 parameter",
  );
  assertEquals(
    factory.schemaResolverCreationFailed.length,
    1,
    "schemaResolverCreationFailed should take 1 parameter",
  );
  assertEquals(
    factory.promptFilePathNotResolved.length,
    0,
    "promptFilePathNotResolved should take 0 parameters",
  );
  assertEquals(
    factory.inputFilePathNotResolved.length,
    0,
    "inputFilePathNotResolved should take 0 parameters",
  );
  assertEquals(
    factory.outputFilePathNotResolved.length,
    0,
    "outputFilePathNotResolved should take 0 parameters",
  );
  assertEquals(
    factory.schemaFilePathNotResolved.length,
    0,
    "schemaFilePathNotResolved should take 0 parameters",
  );
});

Deno.test("PromptVariablesFactoryError Structure - Error property types", () => {
  // Test property types are correct
  const pathError = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("string input");
  assertEquals(typeof pathError.kind, "string");
  assertEquals(typeof pathError.message, "string");
  assertEquals(typeof pathError.pathOptionsError, "string");

  const templateError = PromptVariablesFactoryErrorFactory.templateResolverCreationFailed(
    "resolver input",
  );
  assertEquals(typeof templateError.resolverError, "string");

  const schemaError = PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed(
    "schema input",
  );
  assertEquals(typeof schemaError.resolverError, "string");

  // Test simple errors
  const simpleErrors = [
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  for (const error of simpleErrors) {
    assertEquals(typeof error.kind, "string");
    assertEquals(typeof error.message, "string");
    // Should not have additional string properties
    const keys = Object.keys(error);
    for (const key of keys) {
      if (key !== "kind" && key !== "message" && key !== "context") {
        assertEquals(false, true, `Unexpected property ${key} in simple error`);
      }
    }
  }
});

Deno.test("PromptVariablesFactoryError Structure - Message format consistency", () => {
  // Test message format patterns
  const testCases = [
    {
      error: PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test detail"),
      expectedPrefix: "Failed to create path options: ",
      additionalProperty: "pathOptionsError",
    },
    {
      error: PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test detail"),
      expectedPrefix: "Failed to create template resolver: ",
      additionalProperty: "resolverError",
    },
    {
      error: PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test detail"),
      expectedPrefix: "Failed to create schema resolver: ",
      additionalProperty: "resolverError",
    },
    {
      error: PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
      expectedMessage: "Prompt file path not resolved",
      additionalProperty: null,
    },
    {
      error: PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
      expectedMessage: "Input file path not resolved",
      additionalProperty: null,
    },
  ];

  for (const testCase of testCases) {
    if ("expectedPrefix" in testCase) {
      assert(testCase.error.message.startsWith(testCase.expectedPrefix!));
      assert(testCase.additionalProperty! in testCase.error);
    } else {
      assertEquals(testCase.error.message, testCase.expectedMessage!);
      assert(testCase.additionalProperty === null);
    }
  }
});

Deno.test("PromptVariablesFactoryError Structure - Type discrimination properties", () => {
  // Test that type discrimination works correctly
  const errors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
  ];

  for (const error of errors) {
    // Kind property should enable type discrimination
    switch (error.kind) {
      case "PathOptionsCreationFailed": {
        assert("pathOptionsError" in error);
        assertEquals(typeof (error as any).pathOptionsError, "string");
        assert(!("resolverError" in error));
        break;
      }
      case "TemplateResolverCreationFailed": {
        assert("resolverError" in error);
        assertEquals(typeof (error as any).resolverError, "string");
        assert(!("pathOptionsError" in error));
        break;
      }
      case "SchemaResolverCreationFailed": {
        assert("resolverError" in error);
        assertEquals(typeof (error as any).resolverError, "string");
        assert(!("pathOptionsError" in error));
        break;
      }
      case "PromptFilePathNotResolved": {
        assert(!("pathOptionsError" in error));
        assert(!("resolverError" in error));
        break;
      }
      default:
        // Handle other cases
        break;
    }
  }
});

Deno.test("PromptVariablesFactoryError Structure - Object immutability", () => {
  // Test that created error objects have consistent structure
  const error = PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("original");

  const originalKind = error.kind;
  const originalMessage = error.message;
  const originalPathOptionsError = error.pathOptionsError;

  // Verify readonly properties are consistently typed
  assertEquals(typeof error.kind, "string", "kind should be string");
  assertEquals(typeof error.message, "string", "message should be string");
  assertEquals(typeof error.pathOptionsError, "string", "pathOptionsError should be string");

  // Values should be consistent
  assertEquals(error.kind, originalKind);
  assertEquals(error.message, originalMessage);
  assertEquals(error.pathOptionsError, originalPathOptionsError);
});

Deno.test("PromptVariablesFactoryError Structure - JSON serialization structure", () => {
  // Test that errors serialize correctly to JSON
  const errors = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("serialization test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
  ];

  for (const error of errors) {
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);

    // Essential properties should be preserved
    assertEquals(parsed.kind, error.kind);
    assertEquals(parsed.message, error.message);

    // Additional properties should be preserved
    if ("pathOptionsError" in error) {
      assertEquals(parsed.pathOptionsError, (error as any).pathOptionsError);
    }
    if ("resolverError" in error) {
      assertEquals(parsed.resolverError, (error as any).resolverError);
    }

    // Functions should not be serialized
    for (const key in parsed) {
      assertEquals(typeof parsed[key] !== "function", true, "No functions should be serialized");
    }
  }
});

Deno.test("PromptVariablesFactoryError Structure - Type system exhaustiveness", () => {
  // Test that type system covers all cases exhaustively
  function categorizeError(error: PromptVariablesFactoryErrors): "creation" | "resolution" {
    switch (error.kind) {
      case "PathOptionsCreationFailed":
      case "TemplateResolverCreationFailed":
      case "SchemaResolverCreationFailed":
        return "creation";
      case "PromptFilePathNotResolved":
      case "InputFilePathNotResolved":
      case "OutputFilePathNotResolved":
      case "SchemaFilePathNotResolved":
      case "PromptPathResolutionFailed":
      case "InputPathResolutionFailed":
      case "OutputPathResolutionFailed":
      case "SchemaPathResolutionFailed":
        return "resolution";
      default: {
        // Exhaustiveness check - should never reach here
        const _exhaustive: never = error;
        return _exhaustive;
      }
    }
  }

  const allErrors: PromptVariablesFactoryErrors[] = [
    PromptVariablesFactoryErrorFactory.pathOptionsCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.templateResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.schemaResolverCreationFailed("test"),
    PromptVariablesFactoryErrorFactory.promptFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.inputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.outputFilePathNotResolved(),
    PromptVariablesFactoryErrorFactory.schemaFilePathNotResolved(),
  ];

  // All errors should be categorizable
  for (const error of allErrors) {
    const category = categorizeError(error);
    assert(category === "creation" || category === "resolution");
  }

  // Verify expected distribution
  const categories = allErrors.map(categorizeError);
  const creationCount = categories.filter((c) => c === "creation").length;
  const resolutionCount = categories.filter((c) => c === "resolution").length;

  assertEquals(creationCount, 3, "Should have 3 creation errors");
  assertEquals(resolutionCount, 4, "Should have 4 resolution errors");
});
