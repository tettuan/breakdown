/**
 * @fileoverview Architecture tests for workspace init error
 * 
 * Tests architectural constraints, design patterns, and system boundaries
 * for the workspace initialization error module.
 */

import { assertEquals, assertExists, assertInstanceOf, assert } from "@std/assert";
import {
  WorkspaceInitError,
  DirectoryCreationError,
  ConfigCreationError,
  InvalidWorkspaceLocationError,
  WorkspaceExistsError,
  createWorkspaceInitError,
} from "./workspace_init_error.ts";

Deno.test("Architecture: WorkspaceInitError - Error Hierarchy Design", () => {
  // Test proper error class hierarchy
  
  const baseError = new WorkspaceInitError("Test message", "TEST_CODE");
  const directoryError = new DirectoryCreationError("/test/path");
  const configError = new ConfigCreationError("/test/config.yml");
  const locationError = new InvalidWorkspaceLocationError("/test", "not accessible");
  const existsError = new WorkspaceExistsError("/test/workspace");
  
  // All specific errors should extend WorkspaceInitError
  assertInstanceOf(directoryError, WorkspaceInitError);
  assertInstanceOf(configError, WorkspaceInitError);
  assertInstanceOf(locationError, WorkspaceInitError);
  assertInstanceOf(existsError, WorkspaceInitError);
  
  // All should also be Error instances
  assertInstanceOf(baseError, Error);
  assertInstanceOf(directoryError, Error);
  assertInstanceOf(configError, Error);
  assertInstanceOf(locationError, Error);
  assertInstanceOf(existsError, Error);
});

Deno.test("Architecture: WorkspaceInitError - Error Code System", () => {
  // Test that error codes follow consistent naming convention
  
  const errorCodes = [
    new DirectoryCreationError("/test").code,
    new ConfigCreationError("/test").code,
    new InvalidWorkspaceLocationError("/test", "reason").code,
    new WorkspaceExistsError("/test").code,
  ];
  
  // All error codes should be defined and follow naming convention
  errorCodes.forEach(code => {
    assertEquals(typeof code, "string");
    assert(code.length > 0);
    assert(code.includes("_"), "Error codes should use SNAKE_CASE");
    assert(code === code.toUpperCase(), "Error codes should be uppercase");
  });
  
  // Specific error codes should match expected patterns
  assertEquals(new DirectoryCreationError("/test").code, "DIRECTORY_CREATION_FAILED");
  assertEquals(new ConfigCreationError("/test").code, "CONFIG_CREATION_FAILED");
  assertEquals(new InvalidWorkspaceLocationError("/test", "reason").code, "INVALID_WORKSPACE_LOCATION");
  assertEquals(new WorkspaceExistsError("/test").code, "WORKSPACE_EXISTS");
});

Deno.test("Architecture: WorkspaceInitError - Immutable Error Properties", () => {
  // Test that error properties are properly readonly/immutable
  
  const error = new WorkspaceInitError("Test", "TEST_CODE", { test: "data" });
  
  // Properties should be readonly
  assertEquals(typeof error.code, "string");
  assertEquals(typeof error.details, "object");
  assertEquals(error.name, "WorkspaceInitError");
  
  // Attempting to modify readonly properties should fail (TypeScript check)
  // This is a compile-time check, but we can verify the properties exist
  assertExists(error.code);
  assertExists(error.details);
  
  // Details object should be preserved as provided
  assertEquals(error.details?.test, "data");
});

Deno.test("Architecture: WorkspaceInitError - Factory Pattern Implementation", () => {
  // Test factory function follows proper factory pattern
  
  assertEquals(typeof createWorkspaceInitError, "function");
  assertEquals(createWorkspaceInitError.length, 3); // type, path, details parameters
  
  // Factory should create appropriate error types
  const directoryError = createWorkspaceInitError("directory", "/test");
  const configError = createWorkspaceInitError("config", "/test/config.yml");
  const locationError = createWorkspaceInitError("location", "/test", { reason: "no access" });
  const existsError = createWorkspaceInitError("exists", "/test/workspace");
  
  assertInstanceOf(directoryError, DirectoryCreationError);
  assertInstanceOf(configError, ConfigCreationError);
  assertInstanceOf(locationError, InvalidWorkspaceLocationError);
  assertInstanceOf(existsError, WorkspaceExistsError);
  
  // All should be WorkspaceInitError instances
  assertInstanceOf(directoryError, WorkspaceInitError);
  assertInstanceOf(configError, WorkspaceInitError);
  assertInstanceOf(locationError, WorkspaceInitError);
  assertInstanceOf(existsError, WorkspaceInitError);
});

Deno.test("Architecture: WorkspaceInitError - Error Details Structure", () => {
  // Test that error details follow consistent structure
  
  const errorWithDetails = new WorkspaceInitError(
    "Test message",
    "TEST_CODE",
    { path: "/test", metadata: { type: "test" } },
  );
  
  // Details should be properly typed and structured
  assertEquals(typeof errorWithDetails.details, "object");
  assertExists(errorWithDetails.details);
  assertEquals(errorWithDetails.details.path, "/test");
  assertEquals((errorWithDetails.details.metadata as any)?.type, "test");
  
  // Specific error classes should include relevant details
  const directoryError = new DirectoryCreationError("/test/dir", new Error("Permission denied"));
  assertExists(directoryError.details);
  assertEquals(directoryError.details.path, "/test/dir");
  assertEquals(directoryError.details.cause, "Permission denied");
  
  const locationError = new InvalidWorkspaceLocationError("/invalid", "not accessible");
  assertExists(locationError.details);
  assertEquals(locationError.details.path, "/invalid");
  assertEquals(locationError.details.reason, "not accessible");
});

Deno.test("Architecture: WorkspaceInitError - Error Message Consistency", () => {
  // Test that error messages follow consistent format
  
  const testPath = "/test/workspace/path";
  const errors = [
    new DirectoryCreationError(testPath),
    new ConfigCreationError(testPath),
    new InvalidWorkspaceLocationError(testPath, "permission denied"),
    new WorkspaceExistsError(testPath),
  ];
  
  errors.forEach(error => {
    assertEquals(typeof error.message, "string");
    assert(error.message.length > 0, "Error message should not be empty");
    assert(error.message.includes(testPath), "Error message should include the path");
    
    // Messages should be descriptive and actionable
    assert(
      error.message.includes("Failed") || 
      error.message.includes("Invalid") || 
      error.message.includes("exists"),
      "Error message should be descriptive"
    );
  });
});

Deno.test("Architecture: WorkspaceInitError - Separation of Concerns", () => {
  // Test that each error class has a specific, well-defined concern
  
  // DirectoryCreationError: File system directory operations
  const dirError = new DirectoryCreationError("/test");
  assertEquals(dirError.code, "DIRECTORY_CREATION_FAILED");
  assert(dirError.message.includes("directory"));
  
  // ConfigCreationError: Configuration file operations
  const configError = new ConfigCreationError("/test/config.yml");
  assertEquals(configError.code, "CONFIG_CREATION_FAILED");
  assert(configError.message.includes("configuration"));
  
  // InvalidWorkspaceLocationError: Location validation
  const locationError = new InvalidWorkspaceLocationError("/test", "invalid");
  assertEquals(locationError.code, "INVALID_WORKSPACE_LOCATION");
  assert(locationError.message.includes("location"));
  
  // WorkspaceExistsError: Existence validation
  const existsError = new WorkspaceExistsError("/test");
  assertEquals(existsError.code, "WORKSPACE_EXISTS");
  assert(existsError.message.includes("exists"));
});

Deno.test("Architecture: WorkspaceInitError - Error Code Uniqueness", () => {
  // Test that error codes are unique across all error types
  
  const codes = [
    new WorkspaceInitError("test", "CUSTOM_CODE").code,
    new DirectoryCreationError("/test").code,
    new ConfigCreationError("/test").code,
    new InvalidWorkspaceLocationError("/test", "reason").code,
    new WorkspaceExistsError("/test").code,
  ];
  
  const uniqueCodes = new Set(codes);
  assertEquals(codes.length, uniqueCodes.size, "All error codes should be unique");
});

Deno.test("Architecture: WorkspaceInitError - Factory Default Behavior", () => {
  // Test factory function default/fallback behavior
  
  // Invalid type should return base WorkspaceInitError
  const invalidTypeError = createWorkspaceInitError(
    "invalid" as any,
    "/test",
  );
  
  assertInstanceOf(invalidTypeError, WorkspaceInitError);
  assertEquals(invalidTypeError.code, "UNKNOWN_ERROR");
  assert(invalidTypeError.message.includes("Workspace initialization failed"));
});

Deno.test("Architecture: WorkspaceInitError - Error Serialization Compatibility", () => {
  // Test that errors can be properly serialized for logging/debugging
  
  const error = new WorkspaceInitError(
    "Test error",
    "TEST_CODE",
    { path: "/test", nested: { data: "value" } },
  );
  
  // Error should have standard Error properties
  assertEquals(error.name, "WorkspaceInitError");
  assertEquals(typeof error.message, "string");
  assertEquals(typeof error.stack, "string");
  
  // Custom properties should be accessible
  assertEquals(error.code, "TEST_CODE");
  assertEquals(typeof error.details, "object");
  
  // Should be JSON serializable for the custom parts
  const serialized = JSON.stringify({
    name: error.name,
    message: error.message,
    code: error.code,
    details: error.details,
  });
  
  const parsed = JSON.parse(serialized);
  assertEquals(parsed.name, "WorkspaceInitError");
  assertEquals(parsed.code, "TEST_CODE");
  assertEquals(parsed.details.path, "/test");
});

Deno.test("Architecture: WorkspaceInitError - Constructor Parameter Validation", () => {
  // Test that constructors handle parameters appropriately
  
  // Base constructor with all parameters
  const fullError = new WorkspaceInitError("message", "CODE", { data: "test" });
  assertEquals(fullError.message, "message");
  assertEquals(fullError.code, "CODE");
  assertEquals(fullError.details?.data, "test");
  
  // Base constructor with minimal parameters
  const minimalError = new WorkspaceInitError("message", "CODE");
  assertEquals(minimalError.message, "message");
  assertEquals(minimalError.code, "CODE");
  assertEquals(minimalError.details, undefined);
  
  // Specific error constructors handle optional cause parameter
  const directoryErrorWithCause = new DirectoryCreationError("/test", new Error("IO Error"));
  assertEquals(directoryErrorWithCause.details?.cause, "IO Error");
  
  const directoryErrorWithoutCause = new DirectoryCreationError("/test");
  assertEquals(directoryErrorWithoutCause.details?.cause, undefined);
});