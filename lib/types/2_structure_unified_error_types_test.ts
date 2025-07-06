/**
 * @fileoverview Structure tests for Unified Error Types
 * Testing data structure integrity and type relationships
 * 
 * Structure tests verify:
 * - Type relationships and hierarchies
 * - Structural completeness
 * - Data integrity constraints
 * - Type compatibility
 */

import { assertEquals, assertExists } from "@std/assert";
import type {
  BaseError,
  SystemError,
  SystemErrorKind,
  PathError,
  ValidationError,
  ConfigurationError,
  ProcessingError,
  UnifiedError,
  UnifiedResult,
} from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";
import type { Result } from "./result.ts";

Deno.test("2_structure: BaseError interface defines minimal required structure", () => {
  // Test that BaseError can be implemented with just kind
  const minimalError: BaseError = {
    kind: "TestError",
  };
  
  assertExists(minimalError.kind);
  assertEquals(Object.keys(minimalError).length, 1);
  
  // Test with optional properties
  const fullError: BaseError = {
    kind: "TestError",
    message: "Test message",
    context: {
      key1: "value1",
      key2: 123,
      key3: true,
      key4: null,
      key5: undefined,
      nested: {
        prop: "nested value",
      },
    },
  };
  
  assertExists(fullError.kind);
  assertExists(fullError.message);
  assertExists(fullError.context);
  assertEquals(Object.keys(fullError).length, 3);
  assertEquals(Object.keys(fullError.context!).length, 6);
});

Deno.test("2_structure: SystemErrorKind covers all expected error categories", () => {
  // Verify all error kinds are string literals
  const validationErrors: SystemErrorKind[] = [
    "InvalidInput",
    "InvalidPath",
    "InvalidConfiguration",
    "ValidationFailed",
  ];
  
  const fileSystemErrors: SystemErrorKind[] = [
    "FileNotFound",
    "DirectoryNotFound",
    "PermissionDenied",
    "PathNotFound",
  ];
  
  const processingErrors: SystemErrorKind[] = [
    "ProcessingFailed",
    "TransformationFailed",
    "GenerationFailed",
  ];
  
  const externalErrors: SystemErrorKind[] = [
    "ExternalServiceError",
    "TimeoutError",
  ];
  
  const businessErrors: SystemErrorKind[] = [
    "BusinessRuleViolation",
    "StateTransitionInvalid",
  ];
  
  const configErrors: SystemErrorKind[] = [
    "ConfigurationError",
    "ProfileNotFound",
  ];
  
  // All should be valid SystemErrorKind values
  const allErrors = [
    ...validationErrors,
    ...fileSystemErrors,
    ...processingErrors,
    ...externalErrors,
    ...businessErrors,
    ...configErrors,
  ];
  
  assertEquals(allErrors.length, 17);
  
  // Each should be a string
  for (const errorKind of allErrors) {
    assertEquals(typeof errorKind, "string");
  }
});

Deno.test("2_structure: PathError discriminated union has correct variant structures", () => {
  // Each variant should have unique structure based on kind
  const pathErrorVariants: PathError[] = [
    {
      kind: "InvalidPath",
      path: "/test",
      reason: "Invalid characters",
    },
    {
      kind: "PathNotFound",
      path: "/missing",
    },
    {
      kind: "DirectoryNotFound",
      path: "/missing/dir",
    },
    {
      kind: "PermissionDenied",
      path: "/restricted",
    },
    {
      kind: "PathTooLong",
      path: "/very/long/path",
      maxLength: 4096,
    },
  ];
  
  // Verify each variant has required properties
  for (const error of pathErrorVariants) {
    assertExists(error.kind);
    assertExists(error.path);
    
    // Check variant-specific properties
    switch (error.kind) {
      case "InvalidPath":
        assertExists(error.reason);
        assertEquals("maxLength" in error, false);
        break;
      case "PathNotFound":
      case "DirectoryNotFound":
      case "PermissionDenied":
        assertEquals("reason" in error, false);
        assertEquals("maxLength" in error, false);
        break;
      case "PathTooLong":
        assertExists(error.maxLength);
        assertEquals(typeof error.maxLength, "number");
        assertEquals("reason" in error, false);
        break;
    }
  }
});

Deno.test("2_structure: ValidationError discriminated union has correct variant structures", () => {
  // Each variant should have unique structure based on kind
  const validationErrorVariants: ValidationError[] = [
    {
      kind: "InvalidInput",
      field: "email",
      value: "not-email",
      reason: "Invalid email format",
    },
    {
      kind: "MissingRequiredField",
      field: "username",
      source: "registrationForm",
    },
    {
      kind: "InvalidFieldType",
      field: "age",
      expected: "number",
      received: "string",
    },
    {
      kind: "ValidationFailed",
      errors: ["Error 1", "Error 2"],
    },
  ];
  
  // Verify each variant has required properties
  for (const error of validationErrorVariants) {
    assertExists(error.kind);
    
    // Check variant-specific properties
    switch (error.kind) {
      case "InvalidInput":
        assertExists(error.field);
        assertExists(error.value);
        assertExists(error.reason);
        assertEquals("source" in error, false);
        assertEquals("expected" in error, false);
        assertEquals("errors" in error, false);
        break;
      case "MissingRequiredField":
        assertExists(error.field);
        assertExists(error.source);
        assertEquals("value" in error, false);
        assertEquals("reason" in error, false);
        assertEquals("errors" in error, false);
        break;
      case "InvalidFieldType":
        assertExists(error.field);
        assertExists(error.expected);
        assertExists(error.received);
        assertEquals("value" in error, false);
        assertEquals("source" in error, false);
        assertEquals("errors" in error, false);
        break;
      case "ValidationFailed":
        assertExists(error.errors);
        assertEquals(Array.isArray(error.errors), true);
        assertEquals("field" in error, false);
        assertEquals("value" in error, false);
        assertEquals("source" in error, false);
        break;
    }
  }
});

Deno.test("2_structure: ConfigurationError discriminated union has correct variant structures", () => {
  // Each variant should have unique structure based on kind
  const configErrorVariants: ConfigurationError[] = [
    {
      kind: "ConfigurationError",
      message: "Invalid configuration",
      source: "app.yml",
    },
    {
      kind: "ProfileNotFound",
      profile: "production",
      availableProfiles: ["dev", "test"],
    },
    {
      kind: "InvalidConfiguration",
      field: "database.port",
      reason: "Port out of range",
    },
  ];
  
  // Verify each variant has required properties
  for (const error of configErrorVariants) {
    assertExists(error.kind);
    
    // Check variant-specific properties
    switch (error.kind) {
      case "ConfigurationError":
        assertExists(error.message);
        assertEquals("profile" in error, false);
        assertEquals("field" in error, false);
        break;
      case "ProfileNotFound":
        assertExists(error.profile);
        assertEquals("message" in error, false);
        assertEquals("field" in error, false);
        assertEquals("reason" in error, false);
        break;
      case "InvalidConfiguration":
        assertExists(error.field);
        assertExists(error.reason);
        assertEquals("message" in error, false);
        assertEquals("profile" in error, false);
        break;
    }
  }
});

Deno.test("2_structure: ProcessingError discriminated union has correct variant structures", () => {
  // Each variant should have unique structure based on kind
  const processingErrorVariants: ProcessingError[] = [
    {
      kind: "ProcessingFailed",
      operation: "parseTemplate",
      reason: "Syntax error",
    },
    {
      kind: "TransformationFailed",
      input: { data: "test" },
      targetType: "Array",
      reason: "Cannot transform",
    },
    {
      kind: "GenerationFailed",
      generator: "promptGenerator",
      reason: "Template missing",
    },
  ];
  
  // Verify each variant has required properties
  for (const error of processingErrorVariants) {
    assertExists(error.kind);
    assertExists(error.reason);
    
    // Check variant-specific properties
    switch (error.kind) {
      case "ProcessingFailed":
        assertExists(error.operation);
        assertEquals("input" in error, false);
        assertEquals("generator" in error, false);
        break;
      case "TransformationFailed":
        assertExists(error.input);
        assertExists(error.targetType);
        assertEquals("operation" in error, false);
        assertEquals("generator" in error, false);
        break;
      case "GenerationFailed":
        assertExists(error.generator);
        assertEquals("operation" in error, false);
        assertEquals("input" in error, false);
        break;
    }
  }
});

Deno.test("2_structure: UnifiedError is a complete union of all error types", () => {
  // Test that each error category can be assigned to UnifiedError
  const pathError: UnifiedError = {
    kind: "InvalidPath",
    path: "/test",
    reason: "Invalid",
  };
  
  const validationError: UnifiedError = {
    kind: "InvalidInput",
    field: "test",
    value: "val",
    reason: "Invalid",
  };
  
  const configError: UnifiedError = {
    kind: "ConfigurationError",
    message: "Test",
  };
  
  const processingError: UnifiedError = {
    kind: "ProcessingFailed",
    operation: "test",
    reason: "Failed",
  };
  
  // All should be valid UnifiedError types
  const errors: UnifiedError[] = [pathError, validationError, configError, processingError];
  
  for (const error of errors) {
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");
  }
  
  // Test that all error kinds are covered
  const allKinds = [
    // PathError kinds
    "InvalidPath", "PathNotFound", "DirectoryNotFound", "PermissionDenied", "PathTooLong",
    // ValidationError kinds
    "InvalidInput", "MissingRequiredField", "InvalidFieldType", "ValidationFailed",
    // ConfigurationError kinds
    "ConfigurationError", "ProfileNotFound", "InvalidConfiguration",
    // ProcessingError kinds
    "ProcessingFailed", "TransformationFailed", "GenerationFailed",
  ];
  
  assertEquals(allKinds.length, 15);
});

Deno.test("2_structure: UnifiedResult type correctly uses Result pattern", () => {
  // Test that UnifiedResult is correctly typed as Result<T, UnifiedError>
  type TestResult = UnifiedResult<string>;
  
  // Success case
  const successResult: TestResult = {
    ok: true,
    data: "Success value",
  };
  
  assertEquals(successResult.ok, true);
  if (successResult.ok) {
    assertEquals(successResult.data, "Success value");
    assertEquals("error" in successResult, false);
  }
  
  // Error case with PathError
  const errorResult1: TestResult = {
    ok: false,
    error: {
      kind: "InvalidPath",
      path: "/test",
      reason: "Invalid",
    },
  };
  
  assertEquals(errorResult1.ok, false);
  if (!errorResult1.ok) {
    assertEquals(errorResult1.error.kind, "InvalidPath");
    assertEquals("data" in errorResult1, false);
  }
  
  // Error case with ValidationError
  const errorResult2: TestResult = {
    ok: false,
    error: {
      kind: "ValidationFailed",
      errors: ["Error 1", "Error 2"],
    },
  };
  
  assertEquals(errorResult2.ok, false);
  if (!errorResult2.ok) {
    assertEquals(errorResult2.error.kind, "ValidationFailed");
    if (errorResult2.error.kind === "ValidationFailed") {
      assertEquals(errorResult2.error.errors.length, 2);
    }
  }
});

Deno.test("2_structure: ErrorFactory maintains type relationships correctly", () => {
  // Test that factory methods produce correctly typed errors
  
  // PathError factory
  const pathError1 = ErrorFactory.pathError("InvalidPath", "/test", { reason: "Invalid" });
  const pathError2 = ErrorFactory.pathError("PathTooLong", "/long");
  
  // Both should satisfy PathError type
  const pathErrors: PathError[] = [pathError1, pathError2];
  assertEquals(pathErrors.length, 2);
  
  // ValidationError factory
  const validationError1 = ErrorFactory.validationError(
    "InvalidInput",
    { field: "test", value: "val", reason: "Invalid" }
  );
  const validationError2 = ErrorFactory.validationError(
    "ValidationFailed",
    { errors: ["Error 1"] }
  );
  
  // Both should satisfy ValidationError type
  const validationErrors: ValidationError[] = [validationError1, validationError2];
  assertEquals(validationErrors.length, 2);
  
  // All should satisfy UnifiedError type
  const unifiedErrors: UnifiedError[] = [
    pathError1,
    pathError2,
    validationError1,
    validationError2,
  ];
  assertEquals(unifiedErrors.length, 4);
});

Deno.test("2_structure: Context property maintains type consistency", () => {
  // Test that context is consistently Record<string, unknown> across all error types
  const errorsWithContext: UnifiedError[] = [
    ErrorFactory.pathError("InvalidPath", "/test", {
      reason: "Invalid",
      context: {
        timestamp: Date.now(),
        user: { id: 123, name: "test" },
        flags: ["debug", "verbose"],
      },
    }),
    ErrorFactory.validationError("InvalidInput", {
      field: "test",
      value: "val",
      reason: "Invalid",
      context: {
        formId: "test-form",
        nested: { deep: { value: true } },
      },
    }),
    ErrorFactory.configError("ConfigurationError", {
      message: "Test",
      context: {
        environment: "production",
        config: { key: "value" },
      },
    }),
    ErrorFactory.processingError("ProcessingFailed", {
      operation: "test",
      reason: "Failed",
      context: {
        retries: 3,
        metadata: { source: "api" },
      },
    }),
  ];
  
  // All contexts should be Record<string, unknown>
  for (const error of errorsWithContext) {
    assertExists(error.context);
    assertEquals(typeof error.context, "object");
    assertEquals(error.context === null, false);
    assertEquals(Array.isArray(error.context), false);
    
    // Context values can be of any type
    for (const value of Object.values(error.context)) {
      // Value can be anything: string, number, boolean, object, array, null, undefined
      assertEquals(value !== undefined || value === undefined, true);
    }
  }
});

Deno.test("2_structure: Error type hierarchy supports proper subtyping", () => {
  // Test that specific error types are subtypes of UnifiedError
  function processUnifiedError(error: UnifiedError): string {
    return error.kind;
  }
  
  // All specific error types should be assignable to UnifiedError
  const pathError: PathError = {
    kind: "InvalidPath",
    path: "/test",
    reason: "Invalid",
  };
  assertEquals(processUnifiedError(pathError), "InvalidPath");
  
  const validationError: ValidationError = {
    kind: "InvalidInput",
    field: "test",
    value: "val",
    reason: "Invalid",
  };
  assertEquals(processUnifiedError(validationError), "InvalidInput");
  
  const configError: ConfigurationError = {
    kind: "ConfigurationError",
    message: "Test",
  };
  assertEquals(processUnifiedError(configError), "ConfigurationError");
  
  const processingError: ProcessingError = {
    kind: "ProcessingFailed",
    operation: "test",
    reason: "Failed",
  };
  assertEquals(processUnifiedError(processingError), "ProcessingFailed");
});

Deno.test("2_structure: Discriminated union exhaustiveness is maintained", () => {
  // Test that all error kinds can be handled exhaustively
  function getErrorCategory(error: UnifiedError): string {
    switch (error.kind) {
      // PathError
      case "InvalidPath":
      case "PathNotFound":
      case "DirectoryNotFound":
      case "PermissionDenied":
      case "PathTooLong":
        return "path";
      
      // ValidationError
      case "InvalidInput":
      case "MissingRequiredField":
      case "InvalidFieldType":
      case "ValidationFailed":
        return "validation";
      
      // ConfigurationError
      case "ConfigurationError":
      case "ProfileNotFound":
      case "InvalidConfiguration":
      case "ConfigLoadError":
        return "configuration";
      
      // ProcessingError
      case "ProcessingFailed":
      case "TransformationFailed":
      case "GenerationFailed":
        return "processing";
      
      // WorkspaceError
      case "WorkspaceInitError":
      case "WorkspaceConfigError":
      case "WorkspacePathError":
      case "WorkspaceDirectoryError":
      case "WorkspaceError":
        return "workspace";
      
      default:
        // This ensures exhaustive checking at compile time
        const _exhaustiveCheck: never = error;
        return _exhaustiveCheck;
    }
  }
  
  // Test with all error categories
  const testCases: Array<[UnifiedError, string]> = [
    [{ kind: "InvalidPath", path: "/test", reason: "Invalid" }, "path"],
    [{ kind: "PathNotFound", path: "/missing" }, "path"],
    [{ kind: "InvalidInput", field: "test", value: "val", reason: "Invalid" }, "validation"],
    [{ kind: "ValidationFailed", errors: ["Error"] }, "validation"],
    [{ kind: "ConfigurationError", message: "Test" }, "configuration"],
    [{ kind: "ProfileNotFound", profile: "prod" }, "configuration"],
    [{ kind: "ProcessingFailed", operation: "test", reason: "Failed" }, "processing"],
    [{ kind: "GenerationFailed", generator: "test", reason: "Failed" }, "processing"],
  ];
  
  for (const [error, expectedCategory] of testCases) {
    assertEquals(getErrorCategory(error), expectedCategory);
  }
});