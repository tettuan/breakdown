/**
 * @fileoverview Structure tests for PathValidator
 *
 * Tests focus on data structure integrity:
 * - Validation options structure
 * - Error structure consistency
 * - Path normalization structure
 *
 * @module lib/validator/2_structure_path_validator_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { type PathValidationOptions, PathValidator } from "./path_validator.ts";
import { isError, isOk } from "../types/result.ts";

Deno.test("2_structure: PathValidator - validation options structure", () => {
  const validator = new PathValidator();

  // Test with complete options
  const fullOptions: PathValidationOptions = {
    maxLength: 1000,
    allowStdio: false,
    checkExists: true,
    allowRelative: false,
  };

  const result = validator.validate("/test/path", "input", fullOptions);
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  // Test with partial options
  const partialOptions: PathValidationOptions = {
    maxLength: 500,
  };

  const result2 = validator.validate("test.txt", "output", partialOptions);
  assertExists(result2);

  // Test with empty options
  const result3 = validator.validate("file.txt", "input", {});
  assertExists(result3);
});

Deno.test("2_structure: PathValidator - error structure for invalid paths", () => {
  const validator = new PathValidator();

  // Test empty path error structure
  const emptyResult = validator.validate("", "input");
  assertEquals(isError(emptyResult), true);
  if (isError(emptyResult)) {
    assertExists(emptyResult.error);
    assertEquals(emptyResult.error.kind, "InvalidPath");
    assertExists(emptyResult.error.path);
    if (emptyResult.error.kind === "InvalidPath") {
      assertExists(emptyResult.error.reason);
    }
    if (emptyResult.error.context) {
      assertEquals(emptyResult.error.context.type, "input");
    }
  }

  // Test invalid characters error structure
  const invalidCharResult = validator.validate("path\0with\nnull", "output");
  assertEquals(isError(invalidCharResult), true);
  if (isError(invalidCharResult)) {
    assertExists(invalidCharResult.error);
    assertEquals(invalidCharResult.error.kind, "InvalidPath");
    if (invalidCharResult.error.context) {
      assertExists(invalidCharResult.error.context.invalidChars);
      assertEquals(Array.isArray(invalidCharResult.error.context.invalidChars), true);
    }
  }

  // Test path too long error structure
  const longPath = "a".repeat(5000);
  const lengthResult = validator.validate(longPath, "input");
  assertEquals(isError(lengthResult), true);
  if (isError(lengthResult)) {
    assertEquals(lengthResult.error.kind, "PathTooLong");
    if (lengthResult.error.context) {
      assertExists(lengthResult.error.context.actualLength);
      assertEquals(typeof lengthResult.error.context.actualLength, "number");
    }
  }
});

Deno.test("2_structure: PathValidator - stdio path detection structure", () => {
  const validator = new PathValidator();

  // Test stdio detection
  const stdioPaths = ["stdin", "stdout", "stderr", "-"];
  for (const path of stdioPaths) {
    assertEquals(validator.isStdioPath(path), true);

    // With allowStdio = true (default)
    const allowedResult = validator.validate(path, "input");
    assertEquals(isOk(allowedResult), true);

    // With allowStdio = false
    const disallowedResult = validator.validate(path, "input", { allowStdio: false });
    assertEquals(isError(disallowedResult), true);
    if (isError(disallowedResult)) {
      if (disallowedResult.error.context) {
        assertEquals(disallowedResult.error.context.allowStdio, false);
      }
    }
  }

  // Test non-stdio paths
  assertEquals(validator.isStdioPath("file.txt"), false);
  assertEquals(validator.isStdioPath("/path/to/stdin"), false);
});

Deno.test("2_structure: PathValidator - absolute path validation structure", () => {
  const validator = new PathValidator();

  // Test Unix absolute paths
  const unixResult = validator.validate("/usr/local/bin", "input", { allowRelative: false });
  assertEquals(isOk(unixResult), true);

  // Test Windows absolute paths
  const winResult = validator.validate("C:\\Windows\\System32", "input", { allowRelative: false });
  assertEquals(isOk(winResult), true);

  // Test UNC paths
  const uncResult = validator.validate("\\\\server\\share", "input", { allowRelative: false });
  assertEquals(isOk(uncResult), true);

  // Test relative path rejection
  const relativeResult = validator.validate("relative/path", "input", { allowRelative: false });
  assertEquals(isError(relativeResult), true);
  if (isError(relativeResult)) {
    if (relativeResult.error.context) {
      assertEquals(relativeResult.error.context.allowRelative, false);
    }
  }
});

Deno.test("2_structure: PathValidator - security checks structure", () => {
  const validator = new PathValidator();

  // Test path traversal detection
  const traversalPaths = ["../secret", "path/../../../etc", "..\\windows"];
  for (const path of traversalPaths) {
    const result = validator.validate(path, "input");
    assertEquals(isError(result), true);
    if (isError(result)) {
      if (result.error.context) {
        assertEquals(result.error.context.securityViolation, "path_traversal");
      }
    }
  }

  // Test tilde expansion detection
  const tildeResult = validator.validate("~/secret", "input");
  assertEquals(isError(tildeResult), true);
  if (isError(tildeResult)) {
    if (tildeResult.error.context) {
      assertEquals(tildeResult.error.context.securityViolation, "tilde_expansion");
    }
  }

  // Test safe paths with dots
  const safeDotsResult = validator.validate("file..name.txt", "input");
  assertEquals(isOk(safeDotsResult), true);
});

Deno.test("2_structure: PathValidator - path normalization structure", () => {
  const validator = new PathValidator();

  // Test backslash to forward slash conversion
  assertEquals(validator.normalize("path\\to\\file"), "path/to/file");

  // Test duplicate slash removal
  assertEquals(validator.normalize("path//to///file"), "path/to/file");

  // Test trailing slash removal
  assertEquals(validator.normalize("path/to/dir/"), "path/to/dir");

  // Test combined normalization
  assertEquals(validator.normalize("path\\\\to//file/"), "path/to/file");

  // Test empty string handling
  assertEquals(validator.normalize(""), "");

  // Test single slash preservation
  assertEquals(validator.normalize("/"), "/");
});

Deno.test("2_structure: PathValidator - validation result structure consistency", () => {
  const validator = new PathValidator();

  // Test all validation paths return consistent Result structure
  const testCases = [
    { path: "valid.txt", type: "input" as const, options: {} },
    { path: "", type: "output" as const, options: {} },
    { path: "path\0null", type: "input" as const, options: {} },
    { path: "a".repeat(5000), type: "output" as const, options: {} },
    { path: "../traverse", type: "input" as const, options: {} },
    { path: "stdin", type: "output" as const, options: { allowStdio: false } },
  ];

  for (const { path, type, options } of testCases) {
    const result = validator.validate(path, type, options);
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");

    if (isOk(result)) {
      assertEquals(result.data, undefined);
    } else {
      assertExists(result.error);
      assertExists(result.error);
      assertExists(result.error.kind);
      if (result.error.context) {
        assertEquals(result.error.context.type, type);
      }
    }
  }
});
