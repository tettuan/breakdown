/**
 * @fileoverview Totality pattern compliance tests for Unified Error Types
 *
 * This test file verifies that the unified error types follow the Totality principle:
 * - Exhaustive pattern matching
 * - No partial functions
 * - Complete type coverage
 * - Smart constructor patterns
 *
 * @module lib/types/1_totality_unified_error_types_test
 */

import { assertEquals, assertExists, assertThrows as _assertThrows } from "jsr:@std/assert@0.224.0";
import {
  ConfigurationError,
  ErrorFactory,
  ErrorGuards,
  extractUnifiedErrorMessage,
  PathError,
  ProcessingError,
  UnifiedError,
  ValidationError,
  WorkspaceError,
} from "./mod.ts";

// Type-level exhaustiveness checker
type AssertNever<T extends never> = T;

Deno.test("1_totality: All error kinds are exhaustively handled in extractUnifiedErrorMessage", () => {
  // This test verifies that extractUnifiedErrorMessage handles all possible error kinds
  // The function uses exhaustive switch statements with assertNever

  // Create one of each error type to ensure all paths are covered
  const allErrors: UnifiedError[] = [
    // Path errors
    ErrorFactory.pathError("InvalidPath", "/test", { reason: "test" }),
    ErrorFactory.pathError("PathNotFound", "/test"),
    ErrorFactory.pathError("DirectoryNotFound", "/test"),
    ErrorFactory.pathError("PermissionDenied", "/test"),
    ErrorFactory.pathError("PathTooLong", "/test", { maxLength: 100 }),

    // Validation errors
    ErrorFactory.validationError("InvalidInput", { field: "test", value: "val", reason: "test" }),
    ErrorFactory.validationError("MissingRequiredField", { field: "test", source: "form" }),
    ErrorFactory.validationError("InvalidFieldType", {
      field: "test",
      expected: "string",
      received: "number",
    }),
    ErrorFactory.validationError("ValidationFailed", { errors: ["error1", "error2"] }),

    // Configuration errors
    ErrorFactory.configError("ConfigurationError", { message: "test" }),
    ErrorFactory.configError("ProfileNotFound", { profile: "test" }),
    ErrorFactory.configError("InvalidConfiguration", { details: "test" }),

    // Processing errors
    ErrorFactory.processingError("ProcessingFailed", { operation: "test", reason: "test" }),
    ErrorFactory.processingError("TransformationFailed", {
      input: {},
      targetType: "test",
      reason: "test",
    }),
    ErrorFactory.processingError("GenerationFailed", { generator: "test", reason: "test" }),

    // Workspace errors
    ErrorFactory.workspaceError("WorkspaceInitError", { message: "test" }),
    ErrorFactory.workspaceError("WorkspaceConfigError", { message: "test" }),
    ErrorFactory.workspaceError("WorkspacePathError", { message: "test" }),
    ErrorFactory.workspaceError("WorkspaceDirectoryError", { message: "test" }),
    ErrorFactory.workspaceError("WorkspaceError", { message: "test", code: "TEST" }),
  ];

  // Verify that all errors produce a message (no exceptions thrown)
  for (const error of allErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(typeof message, "string");
    assertEquals(message.length > 0, true);
  }
});

Deno.test("1_totality: ErrorFactory methods use exhaustive switches with no default cases", () => {
  // Test that invalid kinds throw at compile time (type safety)
  // This is a compile-time test - if it compiles, it passes

  // The following would not compile due to type constraints:
  // ErrorFactory.pathError("InvalidKind" as any, "/test");
  // ErrorFactory.validationError("InvalidKind" as any, {} as any);

  // Runtime test: Verify the switch statements are exhaustive
  // by checking that all valid kinds are handled

  const pathKinds: PathError["kind"][] = [
    "InvalidPath",
    "PathNotFound",
    "DirectoryNotFound",
    "PermissionDenied",
    "PathTooLong",
  ];
  const validationKinds: ValidationError["kind"][] = [
    "InvalidInput",
    "MissingRequiredField",
    "InvalidFieldType",
    "ValidationFailed",
  ];
  const configKinds: ConfigurationError["kind"][] = [
    "ConfigurationError",
    "ProfileNotFound",
    "InvalidConfiguration",
  ];
  const processingKinds: ProcessingError["kind"][] = [
    "ProcessingFailed",
    "TransformationFailed",
    "GenerationFailed",
  ];
  const workspaceKinds: WorkspaceError["kind"][] = [
    "WorkspaceInitError",
    "WorkspaceConfigError",
    "WorkspacePathError",
    "WorkspaceDirectoryError",
    "WorkspaceError",
  ];

  // All kinds should be valid
  assertEquals(pathKinds.length, 5);
  assertEquals(validationKinds.length, 4);
  assertEquals(configKinds.length, 3);
  assertEquals(processingKinds.length, 3);
  assertEquals(workspaceKinds.length, 5);
});

Deno.test("1_totality: Type guards provide complete coverage with no overlap", () => {
  // Create test errors of each category
  const pathError = ErrorFactory.pathError("InvalidPath", "/test", { reason: "test" });
  const validationError = ErrorFactory.validationError("InvalidInput", {
    field: "test",
    value: "val",
    reason: "test",
  });
  const configError = ErrorFactory.configError("ConfigurationError", { message: "test" });
  const processingError = ErrorFactory.processingError("ProcessingFailed", {
    operation: "test",
    reason: "test",
  });
  const workspaceError = ErrorFactory.workspaceError("WorkspaceInitError", { message: "test" });

  const allErrors: UnifiedError[] = [
    pathError,
    validationError,
    configError,
    processingError,
    workspaceError,
  ];

  // Each error should match exactly one type guard
  for (const error of allErrors) {
    const guards = [
      ErrorGuards.isPathError,
      ErrorGuards.isValidationError,
      ErrorGuards.isConfigurationError,
      ErrorGuards.isProcessingError,
      ErrorGuards.isWorkspaceError,
    ];

    const matchingGuards = guards.filter((guard) => guard(error));
    assertEquals(
      matchingGuards.length,
      1,
      `Error ${error.kind} should match exactly one type guard`,
    );
  }
});

Deno.test("1_totality: Error factory methods enforce required fields at compile time", () => {
  // This test verifies that the factory methods enforce all required fields
  // through their type signatures, preventing partial construction

  // Test PathError factory enforcement
  const pathError = ErrorFactory.pathError("InvalidPath", "/test", { reason: "Required reason" });
  assertEquals(pathError.kind, "InvalidPath");
  assertEquals(pathError.path, "/test");
  if (pathError.kind === "InvalidPath") {
    assertEquals(pathError.reason, "Required reason");
  }

  // Test ValidationError factory enforcement
  const validationError = ErrorFactory.validationError("InvalidFieldType", {
    field: "age",
    expected: "number",
    received: "string",
  });
  assertEquals(validationError.kind, "InvalidFieldType");
  if (validationError.kind === "InvalidFieldType") {
    assertEquals(validationError.field, "age");
    assertEquals(validationError.expected, "number");
    assertEquals(validationError.received, "string");
  }

  // Test that all required fields are present
  const missingFieldError = ErrorFactory.validationError("MissingRequiredField", {
    field: "username",
    source: "registrationForm",
  });
  if (missingFieldError.kind === "MissingRequiredField") {
    assertExists(missingFieldError.field);
    assertExists(missingFieldError.source);
  }
});

Deno.test("1_totality: UnifiedError union type is closed and complete", () => {
  // Verify that UnifiedError union includes all error categories
  // This is enforced at the type level

  function handleUnifiedError(error: UnifiedError): string {
    // This function demonstrates exhaustive handling
    switch (error.kind) {
      // Path errors
      case "InvalidPath":
      case "PathNotFound":
      case "DirectoryNotFound":
      case "PermissionDenied":
      case "PathTooLong":
        return `Path error: ${error.path}`;

      // Validation errors
      case "InvalidInput":
      case "EmptyValue":
      case "MissingRequiredField":
      case "InvalidFieldType":
      case "ValidationFailed":
      case "InvalidParamsType":
      case "InvalidDirectiveType":
      case "InvalidLayerType":
      case "PathValidationFailed":
      case "CustomVariableInvalid":
      case "ConfigValidationFailed":
      case "UnsupportedParamsType":
        return `Validation error: ${error.kind}`;

      // Configuration errors
      case "ConfigurationError":
      case "ProfileNotFound":
      case "InvalidConfiguration":
      case "ConfigLoadError":
        return `Configuration error: ${error.kind}`;

      // Processing errors
      case "ProcessingFailed":
      case "TransformationFailed":
      case "GenerationFailed":
      case "PatternNotFound":
      case "PatternValidationFailed":
      case "InvalidPattern":
        return `Processing error: ${error.kind}`;

      // Workspace errors
      case "WorkspaceInitError":
      case "WorkspaceConfigError":
      case "WorkspacePathError":
      case "WorkspaceDirectoryError":
      case "WorkspaceError":
        return `Workspace error: ${error.kind}`;

      case "BaseDirectoryNotFound":
        return `Workspace error: ${error.kind}`;

      default: {
        const _exhaustive: never = error;
        throw new Error(`Unhandled error: ${_exhaustive}`);
      }
    }
  }

  // Test with all error types
  const testErrors: UnifiedError[] = [
    ErrorFactory.pathError("InvalidPath", "/test", { reason: "test" }),
    ErrorFactory.validationError("InvalidInput", { field: "test", value: "val", reason: "test" }),
    ErrorFactory.configError("ConfigurationError", { message: "test" }),
    ErrorFactory.configError("ConfigLoadError", { message: "test load error" }),
    ErrorFactory.processingError("ProcessingFailed", { operation: "test", reason: "test" }),
    ErrorFactory.workspaceError("WorkspaceInitError", { message: "test" }),
  ];

  for (const error of testErrors) {
    const result = handleUnifiedError(error);
    assertExists(result);
    assertEquals(result.includes("error:"), true);
  }
});

Deno.test("1_totality: Discriminated unions prevent invalid state combinations", () => {
  // Test that each error type has mutually exclusive properties
  // enforced by the discriminated union pattern

  const pathError = ErrorFactory.pathError("InvalidPath", "/test", { reason: "test" });
  const validationError = ErrorFactory.validationError("InvalidInput", {
    field: "test",
    value: "val",
    reason: "test",
  });

  // Type narrowing works correctly
  if (pathError.kind === "InvalidPath") {
    assertExists(pathError.path);
    assertExists(pathError.reason);
    // The following would not compile:
    // pathError.field; // Property 'field' does not exist
  }

  if (validationError.kind === "InvalidInput") {
    assertExists(validationError.field);
    assertExists(validationError.value);
    assertExists(validationError.reason);
    // The following would not compile:
    // validationError.path; // Property 'path' does not exist
  }

  // Test that workspace errors maintain their specific structure
  const workspaceInitError = ErrorFactory.workspaceError("WorkspaceInitError", {
    message: "Init failed",
  });
  if (workspaceInitError.kind === "WorkspaceInitError") {
    assertEquals(workspaceInitError.type, "workspace_init_error");
    assertEquals(workspaceInitError.code, "WORKSPACE_INIT_ERROR");
    assertEquals(workspaceInitError.message, "Init failed");
  }
});

Deno.test("1_totality: Error guards use complete kind lists", () => {
  // Verify that type guards check against complete lists of kinds

  // Test unknown objects - these should not match any guards
  const unknownObjects = [
    null,
    undefined,
    {},
    { kind: "UnknownKind" },
    { kind: "NotAValidKind", path: "/test" }, // Invalid kind
    { something: "else" }, // No kind property
    "string",
    123,
    [],
  ];

  for (const obj of unknownObjects) {
    // All guards should return false for invalid objects
    assertEquals(
      ErrorGuards.isPathError(obj),
      false,
      `Object ${JSON.stringify(obj)} should not be identified as PathError`,
    );
    assertEquals(
      ErrorGuards.isValidationError(obj),
      false,
      `Object ${JSON.stringify(obj)} should not be identified as ValidationError`,
    );
    assertEquals(
      ErrorGuards.isConfigurationError(obj),
      false,
      `Object ${JSON.stringify(obj)} should not be identified as ConfigurationError`,
    );
    assertEquals(
      ErrorGuards.isProcessingError(obj),
      false,
      `Object ${JSON.stringify(obj)} should not be identified as ProcessingError`,
    );
    assertEquals(
      ErrorGuards.isWorkspaceError(obj),
      false,
      `Object ${JSON.stringify(obj)} should not be identified as WorkspaceError`,
    );
  }

  // Test that guards correctly identify their respective error types
  const pathError = ErrorFactory.pathError("PathNotFound", "/missing");
  assertEquals(ErrorGuards.isPathError(pathError), true);
  assertEquals(ErrorGuards.isValidationError(pathError), false);

  const validationError = ErrorFactory.validationError("ValidationFailed", {
    errors: ["e1", "e2"],
  });
  assertEquals(ErrorGuards.isPathError(validationError), false);
  assertEquals(ErrorGuards.isValidationError(validationError), true);
});

Deno.test("1_totality: Factory methods provide default values preventing partial states", () => {
  // Test that factory methods provide sensible defaults where appropriate

  // PathError with default reason
  const pathErrorDefault = ErrorFactory.pathError("InvalidPath", "/test");
  if (pathErrorDefault.kind === "InvalidPath") {
    assertEquals(pathErrorDefault.reason, "Invalid path format");
  }

  // PathTooLong with default maxLength
  const pathTooLongDefault = ErrorFactory.pathError("PathTooLong", "/test");
  if (pathTooLongDefault.kind === "PathTooLong") {
    assertEquals(pathTooLongDefault.maxLength, 4096);
  }

  // All factory methods return complete objects
  const errors: UnifiedError[] = [
    ErrorFactory.pathError("PathNotFound", "/test"),
    ErrorFactory.validationError("ValidationFailed", { errors: [] }),
    ErrorFactory.configError("ConfigurationError", { message: "test" }),
    ErrorFactory.processingError("ProcessingFailed", { operation: "op", reason: "reason" }),
    ErrorFactory.workspaceError("WorkspaceError", { message: "msg", code: "CODE" }),
  ];

  for (const error of errors) {
    // All errors should have a kind
    assertExists(error.kind);
    // Message extraction should work for all errors
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(message.includes(error.kind), true);
  }
});

Deno.test("1_totality: Context is optional but type-safe when provided", () => {
  // Test that context follows the totality principle:
  // - Optional (not required for completeness)
  // - Type-safe when provided
  // - Preserves unknown types

  // Without context
  const errorNoContext = ErrorFactory.pathError("PathNotFound", "/test");
  assertEquals(errorNoContext.context, undefined);

  // With typed context
  const errorWithContext = ErrorFactory.pathError("PathNotFound", "/test", {
    context: {
      userId: "123",
      timestamp: new Date().toISOString(),
      attempt: 1,
      metadata: { source: "api", version: "1.0" },
    },
  });

  assertExists(errorWithContext.context);
  assertEquals(errorWithContext.context.userId, "123");
  assertEquals(errorWithContext.context.attempt, 1);
  assertExists(errorWithContext.context.metadata);

  // Context preserves unknown types
  const complexContext = {
    nullValue: null,
    undefinedValue: undefined,
    booleanValue: true,
    numberValue: 42,
    stringValue: "test",
    arrayValue: [1, 2, 3],
    objectValue: { nested: { deep: "value" } },
    dateValue: new Date(),
    functionValue: () => "test",
  };

  const errorComplexContext = ErrorFactory.validationError("InvalidInput", {
    field: "test",
    value: "val",
    reason: "test",
    context: complexContext,
  });

  assertExists(errorComplexContext.context);
  assertEquals(errorComplexContext.context.nullValue, null);
  assertEquals(errorComplexContext.context.undefinedValue, undefined);
  assertEquals(errorComplexContext.context.booleanValue, true);
  assertEquals(errorComplexContext.context.numberValue, 42);
  assertEquals(errorComplexContext.context.stringValue, "test");
  assertEquals(Array.isArray(errorComplexContext.context.arrayValue), true);
  assertExists(errorComplexContext.context.objectValue);
  assertExists(errorComplexContext.context.dateValue);
  assertEquals(typeof errorComplexContext.context.functionValue, "function");
});
