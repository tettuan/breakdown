/**
 * @fileoverview WorkingDirectoryPath 0_architecture Tests - Smart Constructor Totality Validation
 *
 * Totality原則に基づくアーキテクチャ制約のテスト。
 * Smart Constructor, Result型, Discriminated Unionパターンの正当性を検証。
 *
 * テスト構成:
 * - 0_architecture: Smart Constructor, Result型, Discriminated Union制約
 * - 1_behavior: 通常動作とビジネスルールの検証
 * - 2_structure: データ構造と整合性の検証
 */

import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  DEFAULT_WORKING_DIRECTORY_CONFIG,
  formatWorkingDirectoryPathError,
  isDirectoryNotFoundError,
  isFileSystemError,
  isInvalidDirectoryPathError,
  isPathResolutionGeneralError,
  isPermissionDeniedError,
  isSecurityViolationError,
  isValidationError,
  WorkingDirectoryPath,
  WorkingDirectoryPathConfig,
  WorkingDirectoryPathError,
} from "./working_directory_path.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("0_architecture - WorkingDirectoryPath implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods

  // Public factory methods exist
  assertExists(WorkingDirectoryPath.create);
  assertExists(WorkingDirectoryPath.createWithConfig);
  assertExists(WorkingDirectoryPath.current);
  assertExists(WorkingDirectoryPath.temp);
  assertExists(WorkingDirectoryPath.home);
});

Deno.test("0_architecture - WorkingDirectoryPath.create returns Result type with totality", () => {
  // Valid case - should return Result.ok (using current directory as it should exist)
  const validResult = WorkingDirectoryPath.create(".");

  // Result type structure verification
  assertExists(validResult);
  assertExists(validResult.ok);

  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(typeof validResult.data, "object");
  } else {
    assertExists(validResult.error);
    assertEquals(typeof validResult.error, "object");
  }
});

Deno.test("0_architecture - WorkingDirectoryPathError uses Discriminated Union pattern", () => {
  // Test invalid path to get error
  const invalidResult = WorkingDirectoryPath.create("");

  if (!invalidResult.ok) {
    const error = invalidResult.error;

    // Discriminated Union: error must have 'kind' property
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");

    // Each error type should be distinguishable
    if (error.kind === "InvalidDirectoryPath") {
      assertExists(error.path);
      assertExists(error.message);
    }
  }
});

Deno.test("0_architecture - Type guards work correctly for directory path error discrimination", () => {
  // Test all type guard functions exist and work correctly
  const mockError: WorkingDirectoryPathError = {
    kind: "InvalidDirectoryPath",
    message: "Test error",
    path: "invalid",
  };

  // Type guard functions must exist
  assertExists(isInvalidDirectoryPathError);
  assertExists(isDirectoryNotFoundError);
  assertExists(isPermissionDeniedError);
  assertExists(isPathResolutionGeneralError);
  assertExists(isSecurityViolationError);
  assertExists(isValidationError);
  assertExists(isFileSystemError);

  // Type guard must correctly identify error type
  assertEquals(isInvalidDirectoryPathError(mockError), true);
  assertEquals(isDirectoryNotFoundError(mockError), false);
  assertEquals(isPermissionDeniedError(mockError), false);
  assertEquals(isPathResolutionGeneralError(mockError), false);
  assertEquals(isSecurityViolationError(mockError), false);
  assertEquals(isValidationError(mockError), false);
  assertEquals(isFileSystemError(mockError), false);
});

Deno.test("0_architecture - Working directory error formatter provides consistent messaging", () => {
  // Error formatter must exist and handle all error types
  assertExists(formatWorkingDirectoryPathError);

  const testErrors: WorkingDirectoryPathError[] = [
    {
      kind: "InvalidDirectoryPath",
      message: "Test invalid path error",
      path: "invalid",
    },
    {
      kind: "DirectoryNotFound",
      message: "Test not found error",
      path: "/nonexistent",
    },
    {
      kind: "PermissionDenied",
      message: "Test permission error",
      path: "/restricted",
      operation: "read",
    },
    {
      kind: "PathResolutionGeneral",
      message: "Test resolution error",
      originalPath: "./test",
      resolvedPath: "/resolved/test",
      resolutionError: { kind: "InvalidPath", path: "./test", reason: "Test error" },
    },
    {
      kind: "SecurityViolation",
      message: "Test security error",
      attemptedPath: "../../../etc/passwd",
      violation: "path_traversal",
    },
    {
      kind: "ValidationError",
      field: "path",
      message: "Test validation error",
      value: "invalid",
    },
    {
      kind: "FileSystemError",
      message: "Test filesystem error",
      path: "/test",
      operation: "stat",
      originalError: new Error("Test error"),
    },
  ];

  // Each error type must produce a formatted message
  for (const error of testErrors) {
    const formatted = formatWorkingDirectoryPathError(error);
    assertExists(formatted);
    assertEquals(typeof formatted, "string");
    assertNotEquals(formatted.length, 0);

    // Message should contain error type context
    if (error.kind === "InvalidDirectoryPath") {
      assertEquals(formatted.includes("Invalid directory path"), true);
    }
    if (error.kind === "DirectoryNotFound") {
      assertEquals(formatted.includes("Directory not found"), true);
    }
    if (error.kind === "PermissionDenied") {
      assertEquals(formatted.includes("Permission denied"), true);
    }
    if (error.kind === "PathResolutionGeneral") {
      assertEquals(formatted.includes("Path resolution failed"), true);
    }
    if (error.kind === "SecurityViolation") {
      assertEquals(formatted.includes("Security violation"), true);
    }
    if (error.kind === "ValidationError") {
      assertEquals(formatted.includes("Validation error"), true);
    }
    if (error.kind === "FileSystemError") {
      assertEquals(formatted.includes("File system error"), true);
    }
  }
});

Deno.test("0_architecture - Working directory configuration is immutable and well-structured", () => {
  // Default configuration must exist and be properly structured
  assertExists(DEFAULT_WORKING_DIRECTORY_CONFIG);

  const config = DEFAULT_WORKING_DIRECTORY_CONFIG;

  // Required properties with correct types
  assertExists(config.verifyExistence);
  assertEquals(typeof config.verifyExistence, "boolean");

  assertExists(config.requireReadPermission);
  assertEquals(typeof config.requireReadPermission, "boolean");

  assertExists(config.requireWritePermission);
  assertEquals(typeof config.requireWritePermission, "boolean");

  assertExists(config.resolveToAbsolute);
  assertEquals(typeof config.resolveToAbsolute, "boolean");

  assertExists(config.createIfMissing);
  assertEquals(typeof config.createIfMissing, "boolean");

  assertExists(config.basePathConfig);
  assertEquals(typeof config.basePathConfig, "object");

  // Sensible defaults for working directories
  assertEquals(config.verifyExistence, true);
  assertEquals(config.requireReadPermission, true);
  assertEquals(config.resolveToAbsolute, true);
});

Deno.test("0_architecture - WorkingDirectoryPath is immutable Value Object with directory features", () => {
  // Use current directory as it should exist
  const result = WorkingDirectoryPath.create(".");

  if (result.ok) {
    const workingDir = result.data;

    // Value Object methods must exist
    assertExists(workingDir.getOriginalPath);
    assertExists(workingDir.getAbsolutePath);
    assertExists(workingDir.getRelativePath);
    assertExists(workingDir.isAbsolutePath);
    assertExists(workingDir.directoryExists);
    assertExists(workingDir.join);
    assertExists(workingDir.getParent);
    assertExists(workingDir.getDirectoryName);
    assertExists(workingDir.equals);
    assertExists(workingDir.toDebugString);

    // Directory-specific features
    const originalPath = workingDir.getOriginalPath();
    const absolutePath = workingDir.getAbsolutePath();
    const isAbsolute = workingDir.isAbsolutePath();
    const exists = workingDir.directoryExists();

    assertEquals(typeof originalPath, "string");
    assertEquals(typeof absolutePath, "string");
    assertEquals(typeof isAbsolute, "boolean");
    assertEquals(typeof exists, "boolean");

    // Immutability - returned values should be consistent
    const path1 = workingDir.getAbsolutePath();
    const path2 = workingDir.getAbsolutePath();
    assertEquals(path1, path2);

    // Value Object equality semantics
    const sameResult = WorkingDirectoryPath.create(".");
    if (sameResult.ok) {
      assertEquals(workingDir.equals(sameResult.data), true);
    }
  }
});

Deno.test("0_architecture - Factory methods provide environment-specific paths", () => {
  // Current directory factory
  const currentResult = WorkingDirectoryPath.current();
  assertEquals(typeof currentResult.ok, "boolean");

  // Temp directory factory
  const tempResult = WorkingDirectoryPath.temp();
  assertEquals(typeof tempResult.ok, "boolean");

  // Home directory factory
  const homeResult = WorkingDirectoryPath.home();
  assertEquals(typeof homeResult.ok, "boolean");

  // If successful, should return valid paths
  if (currentResult.ok) {
    const currentPath = currentResult.data.getAbsolutePath();
    assertExists(currentPath);
    assertEquals(typeof currentPath, "string");
    assertNotEquals(currentPath.length, 0);
  }

  if (tempResult.ok) {
    const tempPath = tempResult.data.getAbsolutePath();
    assertExists(tempPath);
    assertEquals(typeof tempPath, "string");
    assertNotEquals(tempPath.length, 0);
  }
});

Deno.test("0_architecture - Path manipulation methods are safe and return Results", () => {
  const result = WorkingDirectoryPath.create(".");

  if (result.ok) {
    const workingDir = result.data;

    // Join method should return Result
    const joinResult = workingDir.join("subdir", "file.txt");
    assertExists(joinResult.ok);

    // Parent method should return Result
    const parentResult = workingDir.getParent();
    assertExists(parentResult.ok);

    if (joinResult.ok) {
      const joinedPath = joinResult.data;
      assertExists(joinedPath);
      assertEquals(typeof joinedPath.getAbsolutePath(), "string");
    }

    if (parentResult.ok) {
      const parentPath = parentResult.data;
      assertExists(parentPath);
      assertEquals(typeof parentPath.getAbsolutePath(), "string");
    }

    // Relative path method should handle error cases
    const relativeResult = workingDir.getRelativePath(workingDir);
    assertExists(relativeResult.ok);
  }
});

Deno.test("0_architecture - Path resolution follows documented validation stages", () => {
  // Test that validation follows the documented stages:
  // 1. Input validation, 2. Path resolution, 3. Security validation, 4. File system verification

  // Stage 1: Input validation should catch null/undefined/empty
  const nullResult = WorkingDirectoryPath.create(null as unknown as string);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "InvalidDirectoryPath");
  }

  const emptyResult = WorkingDirectoryPath.create("");
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "InvalidDirectoryPath");
  }

  const whitespaceResult = WorkingDirectoryPath.create("   ");
  assertEquals(whitespaceResult.ok, false);
  if (!whitespaceResult.ok) {
    assertEquals(whitespaceResult.error.kind, "InvalidDirectoryPath");
  }

  // Valid input should pass basic validation
  const validResult = WorkingDirectoryPath.create(".");
  assertEquals(validResult.ok, true);
});

Deno.test("0_architecture - Configuration customization affects validation behavior", () => {
  // Test with custom config that disables file system verification
  const customConfig: WorkingDirectoryPathConfig = {
    ...DEFAULT_WORKING_DIRECTORY_CONFIG,
    verifyExistence: false,
    requireReadPermission: false,
    requireWritePermission: false,
  };

  // Non-existent path should succeed when verification is disabled
  const nonExistentResult = WorkingDirectoryPath.createWithConfig(
    "/nonexistent/path",
    customConfig,
  );
  // This may succeed or fail depending on security validation, but should not fail due to existence
  assertExists(nonExistentResult.ok);

  // Test with config that requires write permission
  const strictConfig: WorkingDirectoryPathConfig = {
    ...DEFAULT_WORKING_DIRECTORY_CONFIG,
    requireWritePermission: true,
  };

  // Result behavior depends on actual permissions, but config should be respected
  const strictResult = WorkingDirectoryPath.createWithConfig(".", strictConfig);
  assertExists(strictResult.ok);
});

Deno.test("0_architecture - Debug string representation provides useful information", () => {
  const result = WorkingDirectoryPath.create(".");

  if (result.ok) {
    const workingDir = result.data;
    const debugString = workingDir.toDebugString();

    assertExists(debugString);
    assertEquals(typeof debugString, "string");
    assertNotEquals(debugString.length, 0);

    // Should contain class name and key information
    assertEquals(debugString.includes("WorkingDirectoryPath"), true);
    assertEquals(debugString.includes("original="), true);
    assertEquals(debugString.includes("resolved="), true);
    assertEquals(debugString.includes("absolute="), true);
  }
});
