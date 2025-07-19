/**
 * @fileoverview Architecture tests for Unified Error Types
 * Testing architectural constraints and design patterns compliance
 *
 * Architecture tests verify:
 * - Discriminated union pattern compliance
 * - Totality pattern enforcement
 * - Type safety constraints
 * - Error factory pattern implementation
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  BaseError,
  ConfigurationError,
  ErrorFactory,
  extractUnifiedErrorMessage,
  PathError,
  ProcessingError,
  SystemError,
  UnifiedError,
  ValidationError,
} from "./mod.ts";

Deno.test("0_architecture: BaseError interface - enforces minimal structure", () => {
  // ARCHITECTURE CONSTRAINT: BaseError must have minimal required properties
  const baseError: BaseError = {
    kind: "TestError",
  };

  assertExists(baseError.kind);
  assertEquals(typeof baseError.kind, "string");

  // Optional properties
  const baseErrorWithOptionals: BaseError = {
    kind: "TestError",
    message: "Test message",
    context: { key: "value" },
  };

  assertExists(baseErrorWithOptionals.message);
  assertExists(baseErrorWithOptionals.context);
});

Deno.test("0_architecture: SystemError type - enforces discriminated union pattern", () => {
  // ARCHITECTURE CONSTRAINT: SystemError must be a discriminated union with kind property
  const systemError: SystemError = {
    kind: "InvalidInput",
  };

  assertExists(systemError.kind);
  assertEquals(typeof systemError.kind, "string");

  // Type system should enforce valid kind values
  const validKinds = [
    "InvalidInput",
    "InvalidPath",
    "InvalidConfiguration",
    "ValidationFailed",
    "FileNotFound",
    "DirectoryNotFound",
    "PermissionDenied",
    "PathNotFound",
    "ProcessingFailed",
    "TransformationFailed",
    "GenerationFailed",
    "ExternalServiceError",
    "TimeoutError",
    "BusinessRuleViolation",
    "StateTransitionInvalid",
    "ConfigurationError",
    "ProfileNotFound",
  ];

  for (const kind of validKinds) {
    const error: SystemError = { kind: kind as SystemError["kind"] };
    assertEquals(error.kind, kind);
  }
});

Deno.test("0_architecture: PathError discriminated union - enforces correct structure", () => {
  // ARCHITECTURE CONSTRAINT: Each PathError variant must have specific structure
  const invalidPathError: PathError = {
    kind: "InvalidPath",
    path: "/test/path",
    reason: "Contains invalid characters",
  };

  assertExists(invalidPathError.kind);
  assertExists(invalidPathError.path);
  if (invalidPathError.kind === "InvalidPath") {
    assertExists(invalidPathError.reason);
  }

  const pathNotFoundError: PathError = {
    kind: "PathNotFound",
    path: "/missing/path",
  };

  assertEquals(pathNotFoundError.kind, "PathNotFound");
  assertExists(pathNotFoundError.path);

  const pathTooLongError: PathError = {
    kind: "PathTooLong",
    path: "/very/long/path",
    maxLength: 4096,
  };

  assertEquals(pathTooLongError.kind, "PathTooLong");
  if (pathTooLongError.kind === "PathTooLong") {
    assertExists(pathTooLongError.maxLength);
  }
});

Deno.test("0_architecture: ValidationError discriminated union - enforces correct structure", () => {
  // ARCHITECTURE CONSTRAINT: Each ValidationError variant must have specific structure
  const invalidInputError: ValidationError = {
    kind: "InvalidInput",
    field: "testField",
    value: "invalid",
    reason: "Must be a number",
  };

  assertEquals(invalidInputError.kind, "InvalidInput");
  if (invalidInputError.kind === "InvalidInput") {
    assertExists(invalidInputError.field);
    assertExists(invalidInputError.value);
    assertExists(invalidInputError.reason);
  }

  const missingFieldError: ValidationError = {
    kind: "MissingRequiredField",
    field: "requiredField",
    source: "config",
  };

  assertEquals(missingFieldError.kind, "MissingRequiredField");
  if (missingFieldError.kind === "MissingRequiredField") {
    assertExists(missingFieldError.field);
    assertExists(missingFieldError.source);
  }

  const invalidTypeError: ValidationError = {
    kind: "InvalidFieldType",
    field: "typeField",
    expected: "string",
    received: "number",
  };

  assertEquals(invalidTypeError.kind, "InvalidFieldType");
  if (invalidTypeError.kind === "InvalidFieldType") {
    assertExists(invalidTypeError.expected);
    assertExists(invalidTypeError.received);
  }

  const validationFailedError: ValidationError = {
    kind: "ValidationFailed",
    errors: ["Error 1", "Error 2"],
  };

  assertEquals(validationFailedError.kind, "ValidationFailed");
  if (validationFailedError.kind === "ValidationFailed") {
    assertExists(validationFailedError.errors);
    assertEquals(Array.isArray(validationFailedError.errors), true);
  }
});

Deno.test("0_architecture: ConfigurationError discriminated union - enforces correct structure", () => {
  // ARCHITECTURE CONSTRAINT: Each ConfigurationError variant must have specific structure
  const configError: ConfigurationError = {
    kind: "ConfigurationError",
    message: "Invalid configuration",
  };

  assertEquals(configError.kind, "ConfigurationError");
  assertExists(configError.message);

  const profileNotFoundError: ConfigurationError = {
    kind: "ProfileNotFound",
    profile: "production",
    availableProfiles: ["dev", "test"],
  };

  assertEquals(profileNotFoundError.kind, "ProfileNotFound");
  assertExists(profileNotFoundError.profile);
  assertExists(profileNotFoundError.availableProfiles);

  const invalidConfigError: ConfigurationError = {
    kind: "InvalidConfiguration",
    details: "Port field must be a valid port number",
    context: { field: "port", reason: "Must be a valid port number" },
  };

  assertEquals(invalidConfigError.kind, "InvalidConfiguration");
  assertExists(invalidConfigError.details);
  assertExists(invalidConfigError.context);
});

Deno.test("0_architecture: ProcessingError discriminated union - enforces correct structure", () => {
  // ARCHITECTURE CONSTRAINT: Each ProcessingError variant must have specific structure
  const processingError: ProcessingError = {
    kind: "ProcessingFailed",
    operation: "parseTemplate",
    reason: "Invalid template syntax",
  };

  assertEquals(processingError.kind, "ProcessingFailed");
  assertExists(processingError.operation);
  assertExists(processingError.reason);

  const transformError: ProcessingError = {
    kind: "TransformationFailed",
    input: { data: "test" },
    targetType: "Array",
    reason: "Cannot convert object to array",
  };

  assertEquals(transformError.kind, "TransformationFailed");
  assertExists(transformError.input);
  assertExists(transformError.targetType);
  assertExists(transformError.reason);

  const generationError: ProcessingError = {
    kind: "GenerationFailed",
    generator: "promptGenerator",
    reason: "Template not found",
  };

  assertEquals(generationError.kind, "GenerationFailed");
  assertExists(generationError.generator);
  assertExists(generationError.reason);
});

Deno.test("0_architecture: UnifiedError type - union of all error types", () => {
  // ARCHITECTURE CONSTRAINT: UnifiedError must be a union of all error categories
  const pathError: UnifiedError = {
    kind: "InvalidPath",
    path: "/test",
    reason: "Invalid",
  };

  const validationError: UnifiedError = {
    kind: "InvalidInput",
    field: "test",
    value: "value",
    reason: "Invalid",
  };

  const configError: UnifiedError = {
    kind: "ConfigurationError",
    message: "Invalid config",
  };

  const processingError: UnifiedError = {
    kind: "ProcessingFailed",
    operation: "test",
    reason: "Failed",
  };

  // All should be valid UnifiedError types
  assertExists(pathError.kind);
  assertExists(validationError.kind);
  assertExists(configError.kind);
  assertExists(processingError.kind);
});

Deno.test("0_architecture: ErrorFactory - provides consistent error creation", () => {
  // ARCHITECTURE CONSTRAINT: ErrorFactory must provide type-safe error creation

  // Path error factory
  const pathError = ErrorFactory.pathError("InvalidPath", "/test", {
    reason: "Invalid characters",
  });
  assertEquals(pathError.kind, "InvalidPath");
  assertEquals(pathError.path, "/test");
  if (pathError.kind === "InvalidPath") {
    assertEquals(pathError.reason, "Invalid characters");
  }

  // Validation error factory
  const validationError = ErrorFactory.validationError(
    "InvalidInput",
    {
      field: "email",
      value: "invalid",
      reason: "Not a valid email",
    },
  );
  assertEquals(validationError.kind, "InvalidInput");
  if (validationError.kind === "InvalidInput") {
    assertEquals(validationError.field, "email");
    assertEquals(validationError.reason, "Not a valid email");
  }

  // Configuration error factory
  const configError = ErrorFactory.configError(
    "ConfigurationError",
    {
      message: "Invalid settings",
      source: "app.yml",
    },
  );
  assertEquals(configError.kind, "ConfigurationError");
  if (configError.kind === "ConfigurationError") {
    assertEquals(configError.message, "Invalid settings");
    assertEquals(configError.source, "app.yml");
  }

  // Processing error factory
  const processingError = ErrorFactory.processingError(
    "ProcessingFailed",
    {
      operation: "transform",
      reason: "Unknown error",
    },
  );
  assertEquals(processingError.kind, "ProcessingFailed");
  if (processingError.kind === "ProcessingFailed") {
    assertEquals(processingError.operation, "transform");
    assertEquals(processingError.reason, "Unknown error");
  }
});

Deno.test("0_architecture: extractUnifiedErrorMessage - totality for all error types", () => {
  // ARCHITECTURE CONSTRAINT: Message extraction must handle all error types (totality)

  // Test all PathError variants
  const pathErrors: PathError[] = [
    { kind: "InvalidPath", path: "/test", reason: "Invalid" },
    { kind: "PathNotFound", path: "/missing" },
    { kind: "DirectoryNotFound", path: "/dir" },
    { kind: "PermissionDenied", path: "/restricted" },
    { kind: "PathTooLong", path: "/long", maxLength: 4096 },
  ];

  for (const error of pathErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(message.includes(error.kind), true);
    assertEquals(message.includes(error.path), true);
  }

  // Test all ValidationError variants
  const validationErrors: ValidationError[] = [
    { kind: "InvalidInput", field: "test", value: "val", reason: "Invalid" },
    { kind: "MissingRequiredField", field: "required", source: "config" },
    { kind: "InvalidFieldType", field: "type", expected: "string", received: "number" },
    { kind: "ValidationFailed", errors: ["Error 1", "Error 2"] },
  ];

  for (const error of validationErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(message.includes(error.kind), true);
  }

  // Test all ConfigurationError variants
  const configErrors: ConfigurationError[] = [
    { kind: "ConfigurationError", message: "Config error" },
    { kind: "ProfileNotFound", profile: "prod" },
    {
      kind: "InvalidConfiguration",
      details: "Invalid port",
      field: "port",
      reason: "Invalid port",
    },
  ];

  for (const error of configErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(message.includes(error.kind), true);
  }

  // Test all ProcessingError variants
  const processingErrors: ProcessingError[] = [
    { kind: "ProcessingFailed", operation: "parse", reason: "Failed" },
    { kind: "TransformationFailed", input: {}, targetType: "Array", reason: "Failed" },
    { kind: "GenerationFailed", generator: "prompt", reason: "Failed" },
  ];

  for (const error of processingErrors) {
    const message = extractUnifiedErrorMessage(error);
    assertExists(message);
    assertEquals(message.includes(error.kind), true);
  }
});

Deno.test("0_architecture: Type discriminators enable exhaustive pattern matching", () => {
  // ARCHITECTURE CONSTRAINT: kind property must enable exhaustive type checking

  function handleError(error: UnifiedError): string {
    switch (error.kind) {
      // PathError variants
      case "InvalidPath":
      case "PathNotFound":
      case "DirectoryNotFound":
      case "PermissionDenied":
      case "PathTooLong":
        return `Path error: ${error.path}`;

      // ValidationError variants
      case "InvalidInput":
        return `Validation error: ${error.field}`;
      case "EmptyValue":
        return `Empty value: ${error.field}`;
      case "MissingRequiredField":
        return `Missing field: ${error.field}`;
      case "InvalidFieldType":
        return `Type error: ${error.field}`;
      case "ValidationFailed":
        return `Validation failed: ${error.errors.length} errors`;
      case "InvalidParamsType":
        return `Invalid params type: expected ${error.expected}, received ${error.received}`;
      case "InvalidDirectiveType":
        return `Invalid directive type: ${error.value}`;
      case "InvalidLayerType":
        return `Invalid layer type: ${error.value}`;
      case "PathValidationFailed":
        return `Path validation failed: ${error.path}`;
      case "CustomVariableInvalid":
        return `Custom variable invalid: ${error.key}`;
      case "ConfigValidationFailed":
        return `Config validation failed: ${error.errors.length} errors`;
      case "UnsupportedParamsType":
        return `Unsupported params type: ${error.type}`;

      // ConfigurationError variants
      case "ConfigurationError":
        return `Config error: ${error.message}`;
      case "ProfileNotFound":
        return `Profile not found: ${error.profile}`;
      case "InvalidConfiguration":
        return `Invalid config: ${error.field}`;
      case "ConfigLoadError":
        return `Config load error: ${error.message}`;

      // ProcessingError variants
      case "ProcessingFailed":
        return `Processing failed: ${error.operation}`;
      case "TransformationFailed":
        return `Transformation failed: ${error.targetType}`;
      case "GenerationFailed":
        return `Generation failed: ${error.generator}`;
      case "PatternNotFound":
        return `Pattern not found: ${error.operation}`;
      case "PatternValidationFailed":
        return `Pattern validation failed: ${error.value}`;
      case "InvalidPattern":
        return `Invalid pattern: ${error.pattern}`;

      // WorkspaceError variants
      case "WorkspaceInitError":
        return `Workspace init error: ${error.message}`;
      case "WorkspaceConfigError":
        return `Workspace config error: ${error.message}`;
      case "WorkspacePathError":
        return `Workspace path error: ${error.message}`;
      case "WorkspaceDirectoryError":
        return `Workspace directory error: ${error.message}`;
      case "WorkspaceError":
        return `Workspace error: ${error.message}`;

      case "BaseDirectoryNotFound":
        return `Base directory not found: ${error.path}`;

      default: {
        // This should never happen if all cases are handled
        const _exhaustiveCheck: never = error;
        return `Unknown error: ${JSON.stringify(_exhaustiveCheck)}`;
      }
    }
  }

  // Test with various error types
  const errors: UnifiedError[] = [
    { kind: "InvalidPath", path: "/test", reason: "Invalid" },
    { kind: "InvalidInput", field: "test", value: "val", reason: "Invalid" },
    { kind: "ConfigurationError", message: "Config error" },
    { kind: "ProcessingFailed", operation: "parse", reason: "Failed" },
  ];

  for (const error of errors) {
    const result = handleError(error);
    assertExists(result);
    assertEquals(typeof result, "string");
  }
});

Deno.test("0_architecture: Optional context property allows extensibility", () => {
  // ARCHITECTURE CONSTRAINT: All error types should support optional context

  const pathErrorWithContext: PathError = {
    kind: "InvalidPath",
    path: "/test",
    reason: "Invalid",
    context: {
      timestamp: new Date().toISOString(),
      userId: "123",
      operation: "createFile",
    },
  };

  assertExists(pathErrorWithContext.context);
  assertExists(pathErrorWithContext.context.timestamp);
  assertExists(pathErrorWithContext.context.userId);
  assertExists(pathErrorWithContext.context.operation);

  const validationErrorWithContext: ValidationError = {
    kind: "InvalidInput",
    field: "email",
    value: "invalid",
    reason: "Not an email",
    context: {
      formId: "userRegistration",
      attemptNumber: 3,
    },
  };

  assertExists(validationErrorWithContext.context);
  assertExists(validationErrorWithContext.context.formId);
  assertExists(validationErrorWithContext.context.attemptNumber);
});
