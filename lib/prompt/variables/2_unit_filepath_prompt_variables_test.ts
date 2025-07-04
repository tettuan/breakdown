/**
 * @fileoverview Unit tests for FilePathPromptVariables
 *
 * This module tests the FilePathPromptVariables class focusing on:
 * - File existence checking
 * - Path validation and normalization
 * - Security checks (directory traversal, null bytes)
 * - Error handling with Result types
 * - Integration with PromptVariables interface
 *
 * @module prompt/variables/2_unit_filepath_prompt_variables_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type FilePathError,
  FilePathPromptVariables,
  isFileNotFoundError,
  isSecurityViolationError,
} from "./filepath_prompt_variables.ts";
import { join, resolve } from "@std/path";
import { ensureDirSync, ensureFileSync } from "@std/fs";

// Test constants
const TEST_DIR = "./test_temp_unit_filepath";
const VALID_SCHEMA = join(TEST_DIR, "valid_schema.json");
const ANOTHER_FILE = join(TEST_DIR, "another_file.yml");
const NESTED_DIR = join(TEST_DIR, "nested", "deep");
const NESTED_FILE = join(NESTED_DIR, "nested.json");

// Setup test environment
function setupTestFiles(): void {
  ensureDirSync(TEST_DIR);
  ensureDirSync(NESTED_DIR);
  ensureFileSync(VALID_SCHEMA);
  ensureFileSync(ANOTHER_FILE);
  ensureFileSync(NESTED_FILE);

  // Write sample content to schema file
  Deno.writeTextFileSync(VALID_SCHEMA, JSON.stringify({ type: "object" }));
}

// Cleanup test environment
function cleanupTestFiles(): void {
  try {
    Deno.removeSync(TEST_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

// Setup before tests
setupTestFiles();

Deno.test("FilePathPromptVariables - creates with valid absolute path", () => {
  const absolutePath = resolve(VALID_SCHEMA);
  const result = FilePathPromptVariables.create(absolutePath);

  assertEquals(result.ok, true);
  if (result.ok) {
    const vars = result.data;
    assertEquals(vars.getSchemaFile(), absolutePath);

    const record = vars.toRecord();
    assertEquals(record.schema_file, absolutePath);
    assertEquals(Object.keys(record).length, 1);
  }
});

Deno.test("FilePathPromptVariables - creates with valid relative path", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA);

  assertEquals(result.ok, true);
  if (result.ok) {
    const vars = result.data;
    const schemaPath = vars.getSchemaFile();

    // Should be normalized to absolute path
    assertEquals(schemaPath.startsWith("/") || schemaPath.match(/^[A-Z]:/), true);
    assertEquals(schemaPath.endsWith("valid_schema.json"), true);
  }
});

Deno.test("FilePathPromptVariables - validates empty path", () => {
  const result = FilePathPromptVariables.create("");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidPath");
    if (result.error.kind === "InvalidPath") {
      assertEquals(result.error.reason, "Path cannot be empty");
    }
  }
});

Deno.test("FilePathPromptVariables - validates whitespace-only path", () => {
  const result = FilePathPromptVariables.create("   \t\n   ");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidPath");
    if (result.error.kind === "InvalidPath") {
      assertEquals(result.error.reason, "Path cannot be empty");
    }
  }
});

Deno.test("FilePathPromptVariables - detects non-existent file", () => {
  const nonExistentPath = join(TEST_DIR, "non_existent.json");
  const result = FilePathPromptVariables.create(nonExistentPath);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isFileNotFoundError(result.error), true);
    if (result.error.kind === "FileNotFound") {
      assertEquals(result.error.path.endsWith("non_existent.json"), true);
    }
  }
});

Deno.test("FilePathPromptVariables - skips existence check when requested", () => {
  const nonExistentPath = join(TEST_DIR, "future_file.json");
  const result = FilePathPromptVariables.create(nonExistentPath, {
    checkExists: false,
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.schema_file.endsWith("future_file.json"), true);
  }
});

Deno.test("FilePathPromptVariables - prevents directory traversal with ..", () => {
  const maliciousPath = "../../../etc/passwd";
  const result = FilePathPromptVariables.create(maliciousPath);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isSecurityViolationError(result.error), true);
    if (result.error.kind === "SecurityViolation") {
      assertEquals(result.error.path, maliciousPath);
      assertEquals(result.error.reason, "Path cannot contain '..' for security reasons");
    }
  }
});

Deno.test("FilePathPromptVariables - prevents embedded directory traversal", () => {
  const maliciousPath = "some/path/../../../etc/passwd";
  const result = FilePathPromptVariables.create(maliciousPath);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isSecurityViolationError(result.error), true);
  }
});

Deno.test("FilePathPromptVariables - prevents null byte injection", () => {
  const maliciousPath = "file.json\0.txt";
  const result = FilePathPromptVariables.create(maliciousPath);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(isSecurityViolationError(result.error), true);
    if (result.error.kind === "SecurityViolation") {
      assertEquals(result.error.reason, "Path cannot contain null bytes");
    }
  }
});

Deno.test("FilePathPromptVariables - handles custom working directory", () => {
  const result = FilePathPromptVariables.create("valid_schema.json", {
    workingDirectory: resolve(TEST_DIR),
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const schemaPath = result.data.getSchemaFile();
    // Use resolve to get the absolute path for comparison
    const expectedDir = resolve(TEST_DIR);
    assertEquals(schemaPath.includes(expectedDir), true);
    assertEquals(schemaPath.endsWith("valid_schema.json"), true);
  }
});

Deno.test("FilePathPromptVariables - manages additional paths", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA, {
    additionalPaths: {
      config: ANOTHER_FILE,
      nested: NESTED_FILE,
    },
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const vars = result.data;

    // Check toRecord includes all paths
    const record = vars.toRecord();
    assertEquals(Object.keys(record).length, 3);
    assertExists(record.schema_file);
    assertExists(record.config);
    assertExists(record.nested);

    // Check hasPath
    assertEquals(vars.hasPath("schema_file"), true);
    assertEquals(vars.hasPath("config"), true);
    assertEquals(vars.hasPath("nested"), true);
    assertEquals(vars.hasPath("unknown"), false);

    // Check getPath
    assertEquals(vars.getPath("schema_file"), vars.getSchemaFile());
    assertEquals(vars.getPath("config")?.endsWith("another_file.yml"), true);
    assertEquals(vars.getPath("nested")?.endsWith("nested.json"), true);
    assertEquals(vars.getPath("unknown"), undefined);

    // Check getAdditionalPaths
    const additional = vars.getAdditionalPaths();
    assertEquals(Object.keys(additional).length, 2);
    assertEquals(additional.config.endsWith("another_file.yml"), true);
    assertEquals(additional.nested.endsWith("nested.json"), true);
  }
});

Deno.test("FilePathPromptVariables - validates additional paths for existence", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA, {
    additionalPaths: {
      missing: join(TEST_DIR, "missing_file.txt"),
    },
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "FileNotFound");
  }
});

Deno.test("FilePathPromptVariables - validates additional paths for security", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA, {
    additionalPaths: {
      malicious: "../../etc/passwd",
    },
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ValidationFailed");
    if (result.error.kind === "ValidationFailed") {
      assertEquals(
        result.error.message.includes("Additional path 'malicious' validation failed"),
        true,
      );
    }
  }
});

Deno.test("FilePathPromptVariables - skips additional paths existence check", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA, {
    checkExists: false,
    additionalPaths: {
      future: join(TEST_DIR, "future_config.yml"),
    },
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(Object.keys(record).length, 2);
    assertExists(record.future);
  }
});

Deno.test("FilePathPromptVariables - normalizes paths correctly", () => {
  const unnormalizedPath = join(TEST_DIR, ".", "nested", "..", "valid_schema.json");
  const result = FilePathPromptVariables.create(unnormalizedPath);

  assertEquals(result.ok, true);
  if (result.ok) {
    const schemaPath = result.data.getSchemaFile();
    // Path should be normalized (no . or ..)
    assertEquals(schemaPath.includes("/."), false);
    assertEquals(schemaPath.includes(".."), false);
    assertEquals(schemaPath.endsWith("valid_schema.json"), true);
  }
});

Deno.test("FilePathPromptVariables - fromFilePathVariable integration", async () => {
  const { FilePathVariable } = await import("../../types/prompt_variables.ts");

  const varResult = FilePathVariable.create("schema_file", VALID_SCHEMA);
  assertEquals(varResult.ok, true);

  if (varResult.ok) {
    const result = FilePathPromptVariables.fromFilePathVariable(varResult.data);

    assertEquals(result.ok, true);
    if (result.ok) {
      const record = result.data.toRecord();
      assertEquals(record.schema_file.endsWith("valid_schema.json"), true);
    }
  }
});

Deno.test("FilePathPromptVariables - implements PromptVariables interface", () => {
  const result = FilePathPromptVariables.create(VALID_SCHEMA);

  assertEquals(result.ok, true);
  if (result.ok) {
    const vars = result.data;

    // Check that toRecord returns proper type
    const record = vars.toRecord();
    assertEquals(typeof record, "object");

    // All values should be strings
    for (const value of Object.values(record)) {
      assertEquals(typeof value, "string");
    }
  }
});

Deno.test("FilePathPromptVariables - error type guards work correctly", () => {
  // Test FileNotFound guard
  const notFoundResult = FilePathPromptVariables.create("./not_found.json");
  if (!notFoundResult.ok) {
    if (isFileNotFoundError(notFoundResult.error)) {
      // TypeScript should narrow the type here
      assertEquals(notFoundResult.error.kind, "FileNotFound");
      assertExists(notFoundResult.error.path);
    }
  }

  // Test SecurityViolation guard
  const securityResult = FilePathPromptVariables.create("../../../etc/passwd");
  if (!securityResult.ok) {
    if (isSecurityViolationError(securityResult.error)) {
      // TypeScript should narrow the type here
      assertEquals(securityResult.error.kind, "SecurityViolation");
      assertExists(securityResult.error.path);
      assertExists(securityResult.error.reason);
    }
  }
});

// Cleanup after all tests
Deno.test("cleanup test files", () => {
  cleanupTestFiles();
  assertEquals(true, true); // Dummy assertion
});
