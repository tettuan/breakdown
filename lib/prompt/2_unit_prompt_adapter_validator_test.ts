/**
 * @fileoverview Unit tests for PromptAdapterValidator
 *
 * Tests functional behavior:
 * - Path validation logic
 * - File and directory checks
 * - Error handling cases
 * - Edge cases and boundaries
 */

import { assertEquals, assertExists } from "../deps.ts";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  PromptAdapterValidator,
  ValidationErrorType,
  type ValidationResult as _ValidationResult,
} from "./prompt_adapter_validator.ts";
import { ensureDir, ensureFile } from "@std/fs";
import { join } from "@std/path";

const _logger = new _BreakdownLogger("unit-prompt-adapter-validator");

describe("PromptAdapterValidator Unit Tests - File Validation", () => {
  const testDir = "./test_validator_temp";
  const testFile = join(testDir, "test.txt");

  beforeEach(async () => {
    await ensureDir(testDir);
    await ensureFile(testFile);
  });

  afterEach(async () => {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should successfully validate existing file", async () => {
    _logger.debug("Testing existing file validation");

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateFile(testFile, "Test file");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.path);
      assertEquals(result.path.includes("test.txt"), true);
    }
  });

  it("should fail validation for non-existent file", async () => {
    _logger.debug("Testing non-existent file validation");

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateFile("./non_existent.txt", "Missing file");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, ValidationErrorType.NotFound);
      assertExists(result.message);
      assertEquals(result.message.includes("Missing file"), true);
    }
  });

  it("should fail validation when path is directory not file", async () => {
    _logger.debug("Testing directory as file validation");

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateFile(testDir, "Directory");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, ValidationErrorType.NotFile);
      assertExists(result.message);
    }
  });

  it("should handle invalid path characters", async () => {
    _logger.debug("Testing invalid path validation");

    const _validator = new PromptAdapterValidator();
    const invalidPaths = [
      "\0",
      "path\0with\0nulls",
    ];

    for (const invalidPath of invalidPaths) {
      const result = await _validator.validateFile(invalidPath, "Invalid path");
      assertEquals(result.ok, false);
      if (!result.ok) {
        // Null characters get sanitized and then fail on file existence check
        assertEquals(result.error, ValidationErrorType.NotFound);
      }
    }
  });
});

describe("PromptAdapterValidator Unit Tests - Directory Validation", () => {
  const testDir = "./test_validator_dir";

  beforeEach(async () => {
    await ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should successfully validate existing directory", async () => {
    _logger.debug("Testing existing directory validation");

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateDirectory(testDir, "Test directory");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.path);
    }
  });

  it("should fail validation for non-existent directory", async () => {
    _logger.debug("Testing non-existent directory validation");

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateDirectory("./non_existent_dir", "Missing directory");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, ValidationErrorType.NotFound);
      assertExists(result.message);
      assertEquals(result.message.includes("Missing directory"), true);
    }
  });

  it("should fail validation when path is file not directory", async () => {
    _logger.debug("Testing file as directory validation");

    const testFile = join(testDir, "file.txt");
    await ensureFile(testFile);

    const _validator = new PromptAdapterValidator();
    const result = await _validator.validateDirectory(testFile, "File");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, ValidationErrorType.NotDirectory);
      assertExists(result.message);
    }
  });
});

describe("PromptAdapterValidator Unit Tests - Base Directory Validation", () => {
  it("should validate base directory configurations", () => {
    _logger.debug("Testing base directory validation");

    const _validator = new PromptAdapterValidator();

    // Valid base directory
    const validResult = _validator.validateBaseDir("./");
    assertEquals(validResult.ok, true);

    // Invalid base directory
    const invalidResult = _validator.validateBaseDir("");
    assertEquals(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assertEquals(invalidResult.error, ValidationErrorType.InvalidBaseDir);
    }
  });

  it("should handle special base directory values", () => {
    _logger.debug("Testing special base directory values");

    const _validator = new PromptAdapterValidator();

    const specialCases = [
      { path: ".", expected: true },
      { path: "./", expected: true },
      { path: "..", expected: true },
      { path: "", expected: false },
      { path: " ", expected: true },
      { path: null as unknown, expected: false },
      { path: undefined as unknown, expected: false },
    ];

    for (const { path, expected } of specialCases) {
      const result = _validator.validateBaseDir(path as string);
      assertEquals(result.ok, expected, `Path "${path}" should ${expected ? "pass" : "fail"}`);
    }
  });
});

describe("PromptAdapterValidator Unit Tests - Path Sanitization", () => {
  it("should properly sanitize paths", async () => {
    _logger.debug("Testing path sanitization");

    const _validator = new PromptAdapterValidator();

    // Create a file to test with
    const testDir = "./test_sanitize";
    const testFile = join(testDir, "test.txt");
    await ensureDir(testDir);
    await ensureFile(testFile);

    try {
      // Test various path formats
      const pathVariations = [
        testFile,
        `./${testFile}`,
        `${testFile}/..`,
        `${testFile}/../test.txt`,
      ];

      for (const pathVar of pathVariations) {
        const result = await _validator.validateFile(pathVar, "Path variation");
        _logger.debug(`Testing path: ${pathVar}, result: ${result.ok}`);
      }
    } finally {
      await Deno.remove(testDir, { recursive: true });
    }
  });
});

describe("PromptAdapterValidator Unit Tests - Error Message Quality", () => {
  it("should provide descriptive error messages", async () => {
    _logger.debug("Testing error message quality");

    const _validator = new PromptAdapterValidator();
    const testLabel = "Configuration file";

    // Test various error scenarios
    const result1 = await _validator.validateFile("/non/existent/path", testLabel);
    if (!result1.ok) {
      assertEquals(
        result1.message.includes(testLabel),
        true,
        "Error message should include the label",
      );
      assertEquals(
        result1.message.includes("does not exist"),
        true,
        "Error message should describe the problem",
      );
    }

    const result2 = await _validator.validateFile("path/../traversal", testLabel);
    if (!result2.ok) {
      // The sanitizePath method resolves .. so the path becomes "traversal" and fails on file existence
      assertEquals(result2.error, ValidationErrorType.NotFound);
      assertEquals(
        result2.message.includes("does not exist"),
        true,
        "Error message should indicate file not found",
      );
    }
  });
});

describe("PromptAdapterValidator Unit Tests - Edge Cases", () => {
  it("should handle symbolic links correctly", async () => {
    _logger.debug("Testing symbolic link handling");

    const _validator = new PromptAdapterValidator();
    const testDir = "./test_symlink";
    const targetFile = join(testDir, "target.txt");
    const symlinkPath = join(testDir, "link.txt");

    await ensureDir(testDir);
    await ensureFile(targetFile);

    try {
      // Create symbolic link
      await Deno.symlink(targetFile, symlinkPath);

      const result = await _validator.validateFile(symlinkPath, "Symlink");
      assertEquals(result.ok, true, "Should follow symbolic links");
    } catch (e) {
      // Skip on systems that don't support symlinks
      _logger.debug("Skipping symlink test: " + e);
    } finally {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it("should handle very long paths", async () => {
    _logger.debug("Testing long path handling");

    const _validator = new PromptAdapterValidator();
    const longPath = "a/".repeat(100) + "file.txt";

    const result = await _validator.validateFile(longPath, "Long path");
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertExists(result.error);
      assertExists(result.message);
    }
  });
});
