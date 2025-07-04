/**
 * @fileoverview Tests for FilePathPromptVariables
 *
 * Verifies file path validation, existence checking, and error handling.
 *
 * @module prompt/variables/filepath_prompt_variables_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  FilePathPromptVariables,
  isFileNotFoundError,
  isSecurityViolationError,
} from "./filepath_prompt_variables.ts";
import { join } from "@std/path";
import { ensureDirSync, ensureFileSync } from "@std/fs";

// Create test directory and files
const TEST_DIR = "./test_temp_filepath_vars";
const SCHEMA_FILE = join(TEST_DIR, "schema.json");
const ADDITIONAL_FILE = join(TEST_DIR, "additional.yml");

// Setup test files
ensureDirSync(TEST_DIR);
ensureFileSync(SCHEMA_FILE);
ensureFileSync(ADDITIONAL_FILE);

Deno.test("FilePathPromptVariables.create - valid absolute path", () => {
  const absolutePath = join(Deno.cwd(), SCHEMA_FILE);
  const result = FilePathPromptVariables.create(absolutePath);

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.schema_file, absolutePath);
  }
});

Deno.test("FilePathPromptVariables.create - valid relative path", () => {
  const result = FilePathPromptVariables.create(SCHEMA_FILE);

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertExists(record.schema_file);
    assertEquals(record.schema_file.endsWith("schema.json"), true);
  }
});

Deno.test("FilePathPromptVariables.create - with additional paths", () => {
  const result = FilePathPromptVariables.create(SCHEMA_FILE, {
    additionalPaths: {
      config_file: ADDITIONAL_FILE,
    },
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertExists(record.schema_file);
    assertExists(record.config_file);
    assertEquals(record.config_file.endsWith("additional.yml"), true);
  }
});

Deno.test("FilePathPromptVariables.create - file not found error", () => {
  const result = FilePathPromptVariables.create("./non_existent_file.json");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isFileNotFoundError(result.error), true);
    if (result.error.kind === "FileNotFound") {
      assertEquals(result.error.path.endsWith("non_existent_file.json"), true);
    }
  }
});

Deno.test("FilePathPromptVariables.create - skip existence check", () => {
  const result = FilePathPromptVariables.create("./non_existent_file.json", {
    checkExists: false,
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertExists(record.schema_file);
  }
});

Deno.test("FilePathPromptVariables.create - empty path error", () => {
  const result = FilePathPromptVariables.create("");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidPath");
    if (result.error.kind === "InvalidPath") {
      assertEquals(result.error.reason, "Path cannot be empty");
    }
  }
});

Deno.test("FilePathPromptVariables.create - directory traversal security error", () => {
  const result = FilePathPromptVariables.create("../../../etc/passwd");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isSecurityViolationError(result.error), true);
    if (result.error.kind === "SecurityViolation") {
      assertEquals(result.error.reason, "Path cannot contain '..' for security reasons");
    }
  }
});

Deno.test("FilePathPromptVariables.create - null byte security error", () => {
  const result = FilePathPromptVariables.create("file\0name.json");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isSecurityViolationError(result.error), true);
    if (result.error.kind === "SecurityViolation") {
      assertEquals(result.error.reason, "Path cannot contain null bytes");
    }
  }
});

Deno.test("FilePathPromptVariables.create - custom working directory", () => {
  const customDir = "./custom_dir";
  ensureDirSync(customDir);
  const testFile = join(customDir, "test.json");
  ensureFileSync(testFile);

  const result = FilePathPromptVariables.create("test.json", {
    workingDirectory: customDir,
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.schema_file.includes("custom_dir"), true);
    assertEquals(record.schema_file.endsWith("test.json"), true);
  }

  // Cleanup
  Deno.removeSync(customDir, { recursive: true });
});

Deno.test("FilePathPromptVariables - path getter methods", () => {
  const result = FilePathPromptVariables.create(SCHEMA_FILE, {
    additionalPaths: {
      config: ADDITIONAL_FILE,
    },
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const vars = result.data;

    // Test getSchemaFile
    assertEquals(vars.getSchemaFile().endsWith("schema.json"), true);

    // Test hasPath
    assertEquals(vars.hasPath("schema_file"), true);
    assertEquals(vars.hasPath("config"), true);
    assertEquals(vars.hasPath("nonexistent"), false);

    // Test getPath
    assertExists(vars.getPath("schema_file"));
    assertExists(vars.getPath("config"));
    assertEquals(vars.getPath("nonexistent"), undefined);

    // Test getAdditionalPaths
    const additionalPaths = vars.getAdditionalPaths();
    assertEquals(Object.keys(additionalPaths).length, 1);
    assertEquals(additionalPaths.config.endsWith("additional.yml"), true);
  }
});

Deno.test("FilePathPromptVariables.fromFilePathVariable", async () => {
  // Import FilePathVariable for testing
  const { FilePathVariable } = await import("../../types/prompt_variables.ts");

  const varResult = FilePathVariable.create("schema_file", SCHEMA_FILE);
  assertEquals(varResult.ok, true);

  if (varResult.ok) {
    const result = FilePathPromptVariables.fromFilePathVariable(varResult.data);

    assertEquals(result.ok, true);
    if (result.ok) {
      const record = result.data.toRecord();
      assertEquals(record.schema_file.endsWith("schema.json"), true);
    }
  }
});

// Cleanup test directory after all tests
Deno.test("cleanup", () => {
  try {
    Deno.removeSync(TEST_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
  assertEquals(true, true); // Dummy assertion
});
