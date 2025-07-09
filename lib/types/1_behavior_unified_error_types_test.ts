/**
 * @fileoverview Behavior tests for Unified Error Types
 * Testing runtime behavior and error handling patterns
 *
 * Behavior tests verify:
 * - Error factory function behavior
 * - Type guard functionality
 * - Message extraction correctness
 * - Error composition patterns
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  ConfigurationError,
  ErrorFactory,
  extractUnifiedErrorMessage,
  PathError,
  ProcessingError,
  UnifiedError,
  ValidationError,
} from "./mod.ts";

Deno.test("1_behavior: ErrorFactory.pathError creates correct error variants", () => {
  // Test InvalidPath with reason
  const invalidPath = ErrorFactory.pathError("InvalidPath", "/test\0path", {
    reason: "Contains null character",
  });
  assertEquals(invalidPath.kind, "InvalidPath");
  assertEquals(invalidPath.path, "/test\0path");
  if (invalidPath.kind === "InvalidPath") {
    assertEquals(invalidPath.reason, "Contains null character");
  }

  // Test InvalidPath without reason (default reason)
  const invalidPathDefault = ErrorFactory.pathError("InvalidPath", "/test");
  assertEquals(invalidPathDefault.kind, "InvalidPath");
  if (invalidPathDefault.kind === "InvalidPath") {
    assertEquals(invalidPathDefault.reason, "Invalid path format");
  }

  // Test PathNotFound
  const pathNotFound = ErrorFactory.pathError("PathNotFound", "/missing/file");
  assertEquals(pathNotFound.kind, "PathNotFound");
  assertEquals(pathNotFound.path, "/missing/file");

  // Test DirectoryNotFound
  const dirNotFound = ErrorFactory.pathError("DirectoryNotFound", "/missing/dir");
  assertEquals(dirNotFound.kind, "DirectoryNotFound");
  assertEquals(dirNotFound.path, "/missing/dir");

  // Test PermissionDenied
  const permDenied = ErrorFactory.pathError("PermissionDenied", "/restricted");
  assertEquals(permDenied.kind, "PermissionDenied");
  assertEquals(permDenied.path, "/restricted");

  // Test PathTooLong
  const pathTooLong = ErrorFactory.pathError("PathTooLong", "/very/long/path");
  assertEquals(pathTooLong.kind, "PathTooLong");
  assertEquals(pathTooLong.path, "/very/long/path");
  if (pathTooLong.kind === "PathTooLong") {
    assertEquals(pathTooLong.maxLength, 4096);
  }

  // Test with context
  const withContext = ErrorFactory.pathError(
    "InvalidPath",
    "/test",
    { reason: "Invalid", context: { operation: "write", user: "test" } },
  );
  assertExists(withContext.context);
  assertEquals(withContext.context.operation, "write");
  assertEquals(withContext.context.user, "test");
});

Deno.test("1_behavior: ErrorFactory.validationError creates correct error variants", () => {
  // Test InvalidInput
  const invalidInput = ErrorFactory.validationError(
    "InvalidInput",
    {
      field: "email",
      value: "not-an-email",
      reason: "Must be a valid email address",
    },
  );
  assertEquals(invalidInput.kind, "InvalidInput");
  if (invalidInput.kind === "InvalidInput") {
    assertEquals(invalidInput.field, "email");
    assertEquals(invalidInput.value, "not-an-email");
    assertEquals(invalidInput.reason, "Must be a valid email address");
  }

  // Test MissingRequiredField
  const missingField = ErrorFactory.validationError(
    "MissingRequiredField",
    {
      field: "username",
      source: "registrationForm",
    },
  );
  assertEquals(missingField.kind, "MissingRequiredField");
  if (missingField.kind === "MissingRequiredField") {
    assertEquals(missingField.field, "username");
    assertEquals(missingField.source, "registrationForm");
  }

  // Test InvalidFieldType
  const invalidType = ErrorFactory.validationError(
    "InvalidFieldType",
    {
      field: "age",
      expected: "number",
      received: "string",
    },
  );
  assertEquals(invalidType.kind, "InvalidFieldType");
  if (invalidType.kind === "InvalidFieldType") {
    assertEquals(invalidType.field, "age");
    assertEquals(invalidType.expected, "number");
    assertEquals(invalidType.received, "string");
  }

  // Test ValidationFailed
  const validationFailed = ErrorFactory.validationError(
    "ValidationFailed",
    {
      errors: ["Field 'email' is required", "Field 'age' must be a number"],
    },
  );
  assertEquals(validationFailed.kind, "ValidationFailed");
  if (validationFailed.kind === "ValidationFailed") {
    assertEquals(validationFailed.errors.length, 2);
    assertEquals(validationFailed.errors[0], "Field 'email' is required");
    assertEquals(validationFailed.errors[1], "Field 'age' must be a number");
  }

  // Test with context
  const withContext = ErrorFactory.validationError(
    "InvalidInput",
    {
      field: "test",
      value: "val",
      reason: "Invalid",
      context: { formId: "test-form", attempt: 1 },
    },
  );
  assertExists(withContext.context);
  assertEquals(withContext.context.formId, "test-form");
  assertEquals(withContext.context.attempt, 1);
});

Deno.test("1_behavior: ErrorFactory.configError creates correct error variants", () => {
  // Test ConfigurationError
  const configError = ErrorFactory.configError(
    "ConfigurationError",
    {
      message: "Invalid configuration file format",
      source: "app.yml",
    },
  );
  assertEquals(configError.kind, "ConfigurationError");
  if (configError.kind === "ConfigurationError") {
    assertEquals(configError.message, "Invalid configuration file format");
    assertEquals(configError.source, "app.yml");
  }

  // Test ProfileNotFound
  const profileNotFound = ErrorFactory.configError(
    "ProfileNotFound",
    {
      profile: "production",
      availableProfiles: ["development", "test", "staging"],
    },
  );
  assertEquals(profileNotFound.kind, "ProfileNotFound");
  if (profileNotFound.kind === "ProfileNotFound") {
    assertEquals(profileNotFound.profile, "production");
    assertEquals(profileNotFound.availableProfiles?.length, 3);
    assertEquals(profileNotFound.availableProfiles?.[0], "development");
  }

  // Test InvalidConfiguration
  const invalidConfig = ErrorFactory.configError(
    "InvalidConfiguration",
    {
      field: "database.port",
      reason: "Port must be between 1 and 65535",
    },
  );
  assertEquals(invalidConfig.kind, "InvalidConfiguration");
  if (invalidConfig.kind === "InvalidConfiguration") {
    assertEquals(invalidConfig.field, "database.port");
    assertEquals(invalidConfig.reason, "Port must be between 1 and 65535");
  }

  // Test with context
  const withContext = ErrorFactory.configError(
    "ConfigurationError",
    { message: "Test error", context: { environment: "production", version: "1.0.0" } },
  );
  assertExists(withContext.context);
  assertEquals(withContext.context.environment, "production");
  assertEquals(withContext.context.version, "1.0.0");
});

Deno.test("1_behavior: ErrorFactory.processingError creates correct error variants", () => {
  // Test ProcessingFailed
  const processingFailed = ErrorFactory.processingError(
    "ProcessingFailed",
    {
      operation: "parseTemplate",
      reason: "Unclosed template tag at line 42",
    },
  );
  assertEquals(processingFailed.kind, "ProcessingFailed");
  if (processingFailed.kind === "ProcessingFailed") {
    assertEquals(processingFailed.operation, "parseTemplate");
    assertEquals(processingFailed.reason, "Unclosed template tag at line 42");
  }

  // Test TransformationFailed
  const transformFailed = ErrorFactory.processingError(
    "TransformationFailed",
    {
      input: { name: "test", value: 123 },
      targetType: "string[]",
      reason: "Cannot transform object to string array",
    },
  );
  assertEquals(transformFailed.kind, "TransformationFailed");
  if (transformFailed.kind === "TransformationFailed") {
    assertExists(transformFailed.input);
    assertEquals(transformFailed.targetType, "string[]");
    assertEquals(transformFailed.reason, "Cannot transform object to string array");
  }

  // Test GenerationFailed
  const generationFailed = ErrorFactory.processingError(
    "GenerationFailed",
    {
      generator: "promptGenerator",
      reason: "Template file not found: prompt_template.md",
    },
  );
  assertEquals(generationFailed.kind, "GenerationFailed");
  if (generationFailed.kind === "GenerationFailed") {
    assertEquals(generationFailed.generator, "promptGenerator");
    assertEquals(generationFailed.reason, "Template file not found: prompt_template.md");
  }

  // Test with context
  const withContext = ErrorFactory.processingError(
    "ProcessingFailed",
    {
      operation: "test",
      reason: "Failed",
      context: { retries: 3, lastAttempt: new Date().toISOString() },
    },
  );
  assertExists(withContext.context);
  assertEquals(withContext.context.retries, 3);
  assertExists(withContext.context.lastAttempt);
});

Deno.test("1_behavior: extractUnifiedErrorMessage produces correct messages", () => {
  // Test PathError messages
  const pathErrors: Array<[PathError, string]> = [
    [
      { kind: "InvalidPath", path: "/test/path", reason: "Contains spaces" },
      "InvalidPath: /test/path - Contains spaces",
    ],
    [
      { kind: "PathNotFound", path: "/missing" },
      "PathNotFound: /missing",
    ],
    [
      { kind: "DirectoryNotFound", path: "/dir" },
      "DirectoryNotFound: /dir",
    ],
    [
      { kind: "PermissionDenied", path: "/restricted" },
      "PermissionDenied: /restricted",
    ],
    [
      { kind: "PathTooLong", path: "/long/path", maxLength: 255 },
      "PathTooLong: /long/path (max: 255)",
    ],
  ];

  for (const [error, expected] of pathErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertEquals(message, expected);
  }

  // Test ValidationError messages
  const validationErrors: Array<[ValidationError, string]> = [
    [
      { kind: "InvalidInput", field: "email", value: "test", reason: "Not an email" },
      "InvalidInput: email - Not an email",
    ],
    [
      { kind: "MissingRequiredField", field: "username", source: "form" },
      "MissingRequiredField: username in form",
    ],
    [
      { kind: "InvalidFieldType", field: "age", expected: "number", received: "string" },
      "InvalidFieldType: age expected number, got string",
    ],
    [
      { kind: "ValidationFailed", errors: ["Error 1", "Error 2", "Error 3"] },
      "ValidationFailed: Error 1, Error 2, Error 3",
    ],
  ];

  for (const [error, expected] of validationErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertEquals(message, expected);
  }

  // Test ConfigurationError messages
  const configErrors: Array<[ConfigurationError, string]> = [
    [
      { kind: "ConfigurationError", message: "Invalid settings file" },
      "ConfigurationError: Invalid settings file",
    ],
    [
      { kind: "ProfileNotFound", profile: "production" },
      "ProfileNotFound: production",
    ],
    [
      { kind: "InvalidConfiguration", field: "port", reason: "Must be a number" },
      "InvalidConfiguration: port - Must be a number",
    ],
  ];

  for (const [error, expected] of configErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertEquals(message, expected);
  }

  // Test ProcessingError messages
  const processingErrors: Array<[ProcessingError, string]> = [
    [
      { kind: "ProcessingFailed", operation: "parse", reason: "Syntax error" },
      "ProcessingFailed: parse - Syntax error",
    ],
    [
      { kind: "TransformationFailed", input: {}, targetType: "Array", reason: "Invalid input" },
      "TransformationFailed: to Array - Invalid input",
    ],
    [
      { kind: "GenerationFailed", generator: "template", reason: "Template not found" },
      "GenerationFailed: template - Template not found",
    ],
  ];

  for (const [error, expected] of processingErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertEquals(message, expected);
  }
});

Deno.test("1_behavior: Type guards work correctly with discriminated unions", () => {
  // Helper type guards
  function isPathError(error: UnifiedError): error is PathError {
    return ["InvalidPath", "PathNotFound", "DirectoryNotFound", "PermissionDenied", "PathTooLong"]
      .includes(error.kind);
  }

  function isValidationError(error: UnifiedError): error is ValidationError {
    return ["InvalidInput", "MissingRequiredField", "InvalidFieldType", "ValidationFailed"]
      .includes(error.kind);
  }

  function isConfigurationError(error: UnifiedError): error is ConfigurationError {
    return ["ConfigurationError", "ProfileNotFound", "InvalidConfiguration"]
      .includes(error.kind);
  }

  function isProcessingError(error: UnifiedError): error is ProcessingError {
    return ["ProcessingFailed", "TransformationFailed", "GenerationFailed"]
      .includes(error.kind);
  }

  // Test PathError type guard
  const pathError: UnifiedError = ErrorFactory.pathError("InvalidPath", "/test", {
    reason: "Invalid",
  });
  assertEquals(isPathError(pathError), true);
  assertEquals(isValidationError(pathError), false);
  assertEquals(isConfigurationError(pathError), false);
  assertEquals(isProcessingError(pathError), false);

  if (isPathError(pathError)) {
    // TypeScript should know this is a PathError
    assertExists(pathError.path);
  }

  // Test ValidationError type guard
  const validationError: UnifiedError = ErrorFactory.validationError(
    "InvalidInput",
    { field: "test", value: "val", reason: "Invalid" },
  );
  assertEquals(isPathError(validationError), false);
  assertEquals(isValidationError(validationError), true);
  assertEquals(isConfigurationError(validationError), false);
  assertEquals(isProcessingError(validationError), false);

  if (isValidationError(validationError) && validationError.kind === "InvalidInput") {
    // TypeScript should know this is an InvalidInput
    assertExists(validationError.field);
    assertExists(validationError.value);
    assertExists(validationError.reason);
  }

  // Test ConfigurationError type guard
  const configError: UnifiedError = ErrorFactory.configError(
    "ConfigurationError",
    { message: "Test" },
  );
  assertEquals(isPathError(configError), false);
  assertEquals(isValidationError(configError), false);
  assertEquals(isConfigurationError(configError), true);
  assertEquals(isProcessingError(configError), false);

  if (isConfigurationError(configError) && configError.kind === "ConfigurationError") {
    // TypeScript should know this is a ConfigurationError
    assertExists(configError.message);
  }

  // Test ProcessingError type guard
  const processingError: UnifiedError = ErrorFactory.processingError(
    "ProcessingFailed",
    { operation: "test", reason: "Failed" },
  );
  assertEquals(isPathError(processingError), false);
  assertEquals(isValidationError(processingError), false);
  assertEquals(isConfigurationError(processingError), false);
  assertEquals(isProcessingError(processingError), true);

  if (isProcessingError(processingError) && processingError.kind === "ProcessingFailed") {
    // TypeScript should know this is a ProcessingFailed
    assertExists(processingError.operation);
    assertExists(processingError.reason);
  }
});

Deno.test("1_behavior: Error composition with context merging", () => {
  // Test creating errors with progressive context enrichment
  const baseContext = { timestamp: new Date().toISOString() };
  const userContext = { userId: "123", sessionId: "abc" };
  const operationContext = { operation: "createFile", retries: 0 };

  // Create error with base context
  const error1 = ErrorFactory.pathError(
    "PermissionDenied",
    "/restricted/file",
    { context: baseContext },
  );

  // Create new error with merged context
  const error2 = ErrorFactory.pathError(
    "PermissionDenied",
    "/restricted/file",
    { context: { ...error1.context, ...userContext } },
  );

  // Create final error with all context
  const error3 = ErrorFactory.pathError(
    "PermissionDenied",
    "/restricted/file",
    { context: { ...error2.context, ...operationContext } },
  );

  // Verify context accumulation
  assertExists(error3.context);
  assertExists(error3.context.timestamp);
  assertExists(error3.context.userId);
  assertExists(error3.context.sessionId);
  assertExists(error3.context.operation);
  assertExists(error3.context.retries);

  // Original errors should not be mutated
  assertEquals(Object.keys(error1.context || {}).length, 1);
  assertEquals(Object.keys(error2.context || {}).length, 3);
  assertEquals(Object.keys(error3.context || {}).length, 5);
});

Deno.test("1_behavior: Error factory handles edge cases gracefully", () => {
  // Test with empty strings
  const emptyPath = ErrorFactory.pathError("InvalidPath", "", { reason: "Empty path" });
  assertEquals(emptyPath.path, "");
  if (emptyPath.kind === "InvalidPath") {
    assertEquals(emptyPath.reason, "Empty path");
  }

  // Test with very long strings
  const longPath = "a".repeat(5000);
  const longPathError = ErrorFactory.pathError("PathTooLong", longPath);
  assertEquals(longPathError.path.length, 5000);

  // Test with special characters
  const specialPath = "/path/with/特殊文字/and/emoji/🚀";
  const specialError = ErrorFactory.pathError("InvalidPath", specialPath, {
    reason: "Contains special characters",
  });
  assertEquals(specialError.path, specialPath);

  // Test with null/undefined in context (should handle gracefully)
  const contextWithNull = ErrorFactory.validationError(
    "InvalidInput",
    {
      field: "test",
      value: null,
      reason: "Value is null",
      context: { nullValue: null, undefinedValue: undefined },
    },
  );

  if (contextWithNull.kind === "InvalidInput") {
    assertEquals(contextWithNull.value, null);
  }
  assertExists(contextWithNull.context);
  assertEquals(contextWithNull.context.nullValue, null);
  assertEquals(contextWithNull.context.undefinedValue, undefined);

  // Test with circular reference in context (should not cause issues)
  const circularObj: any = { name: "test" };
  circularObj.self = circularObj;

  const errorWithCircular = ErrorFactory.processingError(
    "ProcessingFailed",
    { operation: "serialize", reason: "Circular reference", context: { data: circularObj } },
  );

  assertExists(errorWithCircular.context);
  assertEquals((errorWithCircular.context.data as any).name, "test");
});
