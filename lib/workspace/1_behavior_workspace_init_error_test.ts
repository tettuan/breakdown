/**
 * @fileoverview Behavior tests for workspace init error
 *
 * Tests behavioral aspects, business logic, and runtime dynamics of the
 * workspace initialization error module, including error message formatting,
 * error details propagation, and factory function behavior.
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import {
  ConfigCreationError,
  createWorkspaceInitError,
  DirectoryCreationError,
  InvalidWorkspaceLocationError,
  WorkspaceExistsError,
  WorkspaceInitError,
} from "./workspace_init_error.ts";

Deno.test("Behavior: WorkspaceInitError - Message Construction", () => {
  // Test message construction behavior with various inputs

  const testCases = [
    {
      message: "Simple error message",
      code: "SIMPLE_ERROR",
      expected: "Simple error message",
    },
    {
      message: "Error with special characters: !@#$%^&*()",
      code: "SPECIAL_CHARS",
      expected: "Error with special characters: !@#$%^&*()",
    },
    {
      message: "",
      code: "EMPTY_MESSAGE",
      expected: "",
    },
    {
      message: "Multi-line\nerror\nmessage",
      code: "MULTILINE",
      expected: "Multi-line\nerror\nmessage",
    },
  ];

  testCases.forEach(({ message, code, expected }) => {
    const error = new WorkspaceInitError(message, code);
    assertEquals(error.message, expected);
    assertEquals(error.code, code);
    assertEquals(error.name, "WorkspaceInitError");
  });
});

Deno.test("Behavior: DirectoryCreationError - Path and Cause Handling", () => {
  // Test directory creation error behavior with various path inputs

  const pathTestCases = [
    "/absolute/path/to/directory",
    "relative/path/to/directory",
    "./current/directory",
    "../parent/directory",
    "C:\\Windows\\Path\\On\\Windows",
    "/path/with spaces/in name",
    "/path/with-special-chars_123",
    "",
  ];

  pathTestCases.forEach((path) => {
    const error = new DirectoryCreationError(path);

    assertStringIncludes(error.message, path);
    assertStringIncludes(error.message, "Failed to create workspace directory");
    assertEquals(error.code, "DIRECTORY_CREATION_FAILED");
    assertEquals(error.details?.path, path);
  });

  // Test with cause error
  const originalError = new Error("Permission denied: cannot create directory");
  const errorWithCause = new DirectoryCreationError("/test/path", originalError);

  assertEquals(errorWithCause.details?.cause, "Permission denied: cannot create directory");
  assertEquals(errorWithCause.details?.path, "/test/path");

  // Test without cause
  const errorWithoutCause = new DirectoryCreationError("/test/path");
  assertEquals(errorWithoutCause.details?.cause, undefined);
  assertEquals(errorWithoutCause.details?.path, "/test/path");
});

Deno.test("Behavior: ConfigCreationError - Configuration File Error Handling", () => {
  // Test configuration creation error behavior

  const configPaths = [
    "/workspace/.breakdown/config.yml",
    "./config/user.yml",
    "config.json",
    ".env",
    "/etc/breakdown/global.conf",
  ];

  configPaths.forEach((configPath) => {
    const error = new ConfigCreationError(configPath);

    assertStringIncludes(error.message, configPath);
    assertStringIncludes(error.message, "Failed to create configuration file");
    assertEquals(error.code, "CONFIG_CREATION_FAILED");
    assertEquals(error.details?.path, configPath);
  });

  // Test with various cause errors
  const causeErrors = [
    new Error("File already exists"),
    new Error("Insufficient permissions"),
    new Error("Disk full"),
    new Error("Invalid path format"),
  ];

  causeErrors.forEach((cause) => {
    const error = new ConfigCreationError("/test/config.yml", cause);
    assertEquals(error.details?.cause, cause.message);
  });
});

Deno.test("Behavior: InvalidWorkspaceLocationError - Location Validation Messages", () => {
  // Test invalid workspace location error with various reasons

  const locationTestCases = [
    { path: "/root", reason: "insufficient permissions" },
    { path: "/tmp", reason: "temporary directory not suitable" },
    { path: "/nonexistent", reason: "parent directory does not exist" },
    { path: ".", reason: "current directory contains existing workspace" },
    { path: "/usr/bin", reason: "system directory not allowed" },
    { path: "/path/with/symlink", reason: "symbolic links not supported" },
  ];

  locationTestCases.forEach(({ path, reason }) => {
    const error = new InvalidWorkspaceLocationError(path, reason);

    assertStringIncludes(error.message, path);
    assertStringIncludes(error.message, reason);
    assertStringIncludes(error.message, "Invalid workspace location");
    assertEquals(error.code, "INVALID_WORKSPACE_LOCATION");
    assertEquals(error.details?.path, path);
    assertEquals(error.details?.reason, reason);
  });
});

Deno.test("Behavior: WorkspaceExistsError - Existence Check Behavior", () => {
  // Test workspace exists error behavior

  const existingPaths = [
    "/existing/workspace",
    "./current/workspace",
    "/Users/user/projects/existing",
    "C:\\Projects\\ExistingWorkspace",
  ];

  existingPaths.forEach((path) => {
    const error = new WorkspaceExistsError(path);

    assertStringIncludes(error.message, path);
    assertStringIncludes(error.message, "already exists");
    assertStringIncludes(error.message, "--force");
    assertEquals(error.code, "WORKSPACE_EXISTS");
    assertEquals(error.details?.path, path);
  });
});

Deno.test("Behavior: createWorkspaceInitError - Factory Function Logic", () => {
  // Test factory function behavior with various inputs

  const factoryTestCases = [
    {
      type: "directory" as const,
      path: "/test/dir",
      details: { cause: new Error("IO Error") },
      expectedType: DirectoryCreationError,
      expectedCode: "DIRECTORY_CREATION_FAILED",
    },
    {
      type: "config" as const,
      path: "/test/config.yml",
      details: { cause: new Error("Write failed") },
      expectedType: ConfigCreationError,
      expectedCode: "CONFIG_CREATION_FAILED",
    },
    {
      type: "location" as const,
      path: "/invalid/location",
      details: { reason: "No access" },
      expectedType: InvalidWorkspaceLocationError,
      expectedCode: "INVALID_WORKSPACE_LOCATION",
    },
    {
      type: "exists" as const,
      path: "/existing/workspace",
      details: undefined,
      expectedType: WorkspaceExistsError,
      expectedCode: "WORKSPACE_EXISTS",
    },
  ];

  factoryTestCases.forEach(({ type, path, details, expectedType, expectedCode }) => {
    const error = createWorkspaceInitError(type, path, details);

    assert(error instanceof expectedType, `Should create ${expectedType.name}`);
    assertEquals(error.code, expectedCode);
    assertStringIncludes(error.message, path);

    if (details?.cause) {
      assertEquals(error.details?.cause, details.cause.message);
    }
    if (details?.reason) {
      assertEquals(error.details?.reason, details.reason);
    }
  });
});

Deno.test("Behavior: createWorkspaceInitError - Default Reason Handling", () => {
  // Test factory function default reason handling

  // Location error without reason should use default
  const locationErrorWithoutReason = createWorkspaceInitError("location", "/test");
  // The factory function sets "Unknown reason" as default, no need to check details.reason
  assertStringIncludes(locationErrorWithoutReason.message, "Unknown reason");

  // Location error with empty reason should use provided reason
  const locationErrorWithEmptyReason = createWorkspaceInitError(
    "location",
    "/test",
    { reason: "" },
  );
  assertStringIncludes(locationErrorWithEmptyReason.message, "Invalid workspace location: /test");

  // Location error with explicit reason
  const locationErrorWithReason = createWorkspaceInitError(
    "location",
    "/test",
    { reason: "Custom reason" },
  );
  assertEquals(locationErrorWithReason.details?.reason, "Custom reason");
});

Deno.test("Behavior: Error Details Propagation", () => {
  // Test that error details are properly propagated and preserved

  const originalError = new Error("Original filesystem error with stack trace");
  originalError.stack = "Original stack trace\n  at function1\n  at function2";

  const directoryError = new DirectoryCreationError("/test/path", originalError);

  // Cause message should be preserved
  assertEquals(directoryError.details?.cause, originalError.message);
  assertEquals(directoryError.details?.path, "/test/path");

  // Original error properties should be accessible through details
  assertExists(directoryError.details);
  assertEquals(typeof directoryError.details.cause, "string");

  // Complex details object
  const complexError = new WorkspaceInitError(
    "Complex error",
    "COMPLEX_ERROR",
    {
      path: "/complex/path",
      metadata: {
        timestamp: Date.now(),
        user: "testuser",
        operation: "init",
      },
      context: ["step1", "step2", "step3"],
    },
  );

  assertEquals(complexError.details?.path, "/complex/path");
  assertEquals((complexError.details?.metadata as any)?.user, "testuser");
  assertEquals(Array.isArray(complexError.details?.context), true);
});

Deno.test("Behavior: Error Message User Experience", () => {
  // Test that error messages provide good user experience

  // Messages should be actionable
  const existsError = new WorkspaceExistsError("/my/workspace");
  assertStringIncludes(existsError.message, "--force");
  assertStringIncludes(existsError.message, "overwrite");

  // Messages should include relevant context
  const locationError = new InvalidWorkspaceLocationError(
    "/usr/bin",
    "system directory not allowed for user workspaces",
  );
  assertStringIncludes(locationError.message, "/usr/bin");
  assertStringIncludes(locationError.message, "system directory");

  // Messages should be specific about the failure
  const configError = new ConfigCreationError("/workspace/config.yml");
  assertStringIncludes(configError.message, "configuration file");
  assertStringIncludes(configError.message, "config.yml");

  // Messages should indicate the operation that failed
  const dirError = new DirectoryCreationError("/new/workspace");
  assertStringIncludes(dirError.message, "create");
  assertStringIncludes(dirError.message, "directory");
});

Deno.test("Behavior: Error Code Consistency for Error Handling", () => {
  // Test that error codes are consistent for programmatic error handling

  const errors = [
    new DirectoryCreationError("/test1"),
    new DirectoryCreationError("/test2", new Error("cause")),
    new ConfigCreationError("/config1.yml"),
    new ConfigCreationError("/config2.yml", new Error("cause")),
    new InvalidWorkspaceLocationError("/loc1", "reason1"),
    new InvalidWorkspaceLocationError("/loc2", "reason2"),
    new WorkspaceExistsError("/ws1"),
    new WorkspaceExistsError("/ws2"),
  ];

  // Same error types should have same error codes regardless of parameters
  assertEquals(errors[0].code, errors[1].code); // DirectoryCreationError
  assertEquals(errors[2].code, errors[3].code); // ConfigCreationError
  assertEquals(errors[4].code, errors[5].code); // InvalidWorkspaceLocationError
  assertEquals(errors[6].code, errors[7].code); // WorkspaceExistsError

  // Error codes should be suitable for switch statements
  const codeSwitch = (error: WorkspaceInitError) => {
    switch (error.code) {
      case "DIRECTORY_CREATION_FAILED":
        return "directory";
      case "CONFIG_CREATION_FAILED":
        return "config";
      case "INVALID_WORKSPACE_LOCATION":
        return "location";
      case "WORKSPACE_EXISTS":
        return "exists";
      default:
        return "unknown";
    }
  };

  assertEquals(codeSwitch(errors[0]), "directory");
  assertEquals(codeSwitch(errors[2]), "config");
  assertEquals(codeSwitch(errors[4]), "location");
  assertEquals(codeSwitch(errors[6]), "exists");
});

Deno.test("Behavior: Factory Function Edge Cases", () => {
  // Test factory function behavior with edge cases

  // Empty path
  const emptyPathError = createWorkspaceInitError("directory", "");
  assertEquals(emptyPathError.details?.path, "");
  assertStringIncludes(emptyPathError.message, "Failed to create workspace directory");

  // Path with special characters
  const specialPathError = createWorkspaceInitError("config", "/path/with/!@#$%/config.yml");
  assertStringIncludes(specialPathError.message, "!@#$%");

  // Unknown error type fallback
  const unknownError = createWorkspaceInitError("unknown" as any, "/test/path");
  assert(unknownError instanceof WorkspaceInitError);
  assertEquals(unknownError.code, "UNKNOWN_ERROR");
  assertStringIncludes(unknownError.message, "Workspace initialization failed");
  assertEquals(unknownError.details?.path, "/test/path");

  // Null/undefined details handling
  const errorWithNullDetails = createWorkspaceInitError("directory", "/test", undefined);
  assert(errorWithNullDetails instanceof DirectoryCreationError);
  assertEquals(errorWithNullDetails.details?.cause, undefined);
});

Deno.test("Behavior: Error Stack Trace Preservation", () => {
  // Test that error stack traces are properly preserved

  const error = new WorkspaceInitError("Test error", "TEST_CODE");

  // Stack trace should exist and be meaningful
  assertExists(error.stack);
  assertStringIncludes(error.stack, "WorkspaceInitError");
  assertStringIncludes(error.stack, "Test error");

  // Specific error types should also have proper stack traces
  const specificErrors = [
    new DirectoryCreationError("/test"),
    new ConfigCreationError("/test"),
    new InvalidWorkspaceLocationError("/test", "reason"),
    new WorkspaceExistsError("/test"),
  ];

  specificErrors.forEach((error) => {
    assertExists(error.stack);
    // Stack traces include "WorkspaceInitError" as the base class name
    assertStringIncludes(error.stack, "WorkspaceInitError");
  });
});
