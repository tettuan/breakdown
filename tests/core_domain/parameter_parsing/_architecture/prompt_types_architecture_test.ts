/**
 * @fileoverview Architecture tests for prompt_types module
 *
 * Tests architectural constraints and dependencies:
 * - Dependency direction
 * - Circular dependency detection
 * - Layer boundaries
 * - Interface consistency
 *
 * @module
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import * as promptTypes from "../../../../lib/types/prompt_types.ts";

/**
 * Test: Module exports required types and classes
 */
Deno.test("prompt_types - exports required types and classes", () => {
  // Types
  assertExists(promptTypes.PromptPath, "PromptPath class should be exported");
  assertExists(
    promptTypes.formatPromptError,
    "formatPromptError function should be exported",
  );
  assertExists(
    promptTypes.isTemplateNotFoundError,
    "isTemplateNotFoundError function should be exported",
  );
  assertExists(
    promptTypes.isInvalidVariablesError,
    "isInvalidVariablesError function should be exported",
  );

  // Type guards verify that types are properly exported
  const sampleError: promptTypes.PromptError = {
    kind: "TemplateNotFound",
    path: "/test",
  };
  assertEquals(
    promptTypes.isTemplateNotFoundError(sampleError),
    true,
    "Type guard should work with exported types",
  );
});

/**
 * Test: Module dependencies follow architectural rules
 */
Deno.test("prompt_types - follows dependency rules", async () => {
  // Read the module file to check imports
  const moduleContent = await Deno.readTextFile(
    new URL("../../../../lib/types/prompt_types.ts", import.meta.url),
  );

  // Should only depend on result.ts from same layer
  const importLines = moduleContent
    .split("\n")
    .filter((line) => line.includes("import"));

  // Check that all imports are from allowed modules
  for (const line of importLines) {
    if (line.includes("from")) {
      // Should only import from result.ts in same layer
      const isResultImport = line.includes("./result.ts");
      const isTypeImport = line.includes("type");

      assertEquals(
        isResultImport || isTypeImport,
        true,
        `Invalid import detected: ${line}. Should only import from ./result.ts`,
      );
    }
  }

  // Should not depend on higher layers
  assertEquals(
    moduleContent.includes("../prompt/"),
    false,
    "Should not depend on prompt layer",
  );
  assertEquals(
    moduleContent.includes("../factory/"),
    false,
    "Should not depend on factory layer",
  );
  assertEquals(
    moduleContent.includes("../cli/"),
    false,
    "Should not depend on CLI layer",
  );
});

/**
 * Test: Types follow Totality principle
 */
Deno.test("prompt_types - follows Totality principle", () => {
  // Test that PromptPath uses Smart Constructor pattern
  const emptyPathResult = promptTypes.PromptPath.create("");
  assertEquals(emptyPathResult.ok, false, "Empty path should fail");

  const validPathResult = promptTypes.PromptPath.create("/valid/path");
  assertEquals(validPathResult.ok, true, "Valid path should succeed");

  // Test that PromptError is a discriminated union
  const errors: promptTypes.PromptError[] = [
    { kind: "TemplateNotFound", path: "/test" },
    { kind: "InvalidVariables", details: ["error"] },
    { kind: "SchemaError", schema: "test", error: "error" },
    { kind: "InvalidPath", message: "error" },
    { kind: "TemplateParseError", template: "test", error: "error" },
    { kind: "ConfigurationError", message: "error" },
  ];

  // Each error should have a unique kind
  const kinds = errors.map((e) => e.kind);
  const uniqueKinds = new Set(kinds);
  assertEquals(
    kinds.length,
    uniqueKinds.size,
    "All error kinds should be unique",
  );
});

/**
 * Test: PromptVariables interface follows Duck Typing pattern
 */
Deno.test("prompt_types - PromptVariables follows Duck Typing", () => {
  // Test that any object with toRecord method can be used as PromptVariables
  class TestVariables implements promptTypes.PromptVariables {
    toRecord(): Record<string, string> {
      return { test: "value" };
    }
  }

  const variables = new TestVariables();
  const record = variables.toRecord();
  assertEquals(record.test, "value", "Duck typing should work correctly");

  // Alternative implementation should also work
  const objectVariables: promptTypes.PromptVariables = {
    toRecord: () => ({ another: "implementation" }),
  };
  const objectRecord = objectVariables.toRecord();
  assertEquals(
    objectRecord.another,
    "implementation",
    "Object literal implementation should work",
  );
});

/**
 * Test: Error formatting is comprehensive
 */
Deno.test("prompt_types - error formatting covers all cases", () => {
  const testCases: promptTypes.PromptError[] = [
    { kind: "TemplateNotFound", path: "/missing" },
    { kind: "InvalidVariables", details: ["var1", "var2"] },
    { kind: "SchemaError", schema: "schema.json", error: "invalid" },
    { kind: "InvalidPath", message: "contains .." },
    { kind: "TemplateParseError", template: "tmpl", error: "syntax" },
    { kind: "ConfigurationError", message: "config error" },
  ];

  for (const error of testCases) {
    const formatted = promptTypes.formatPromptError(error);
    assertEquals(
      typeof formatted,
      "string",
      `Error kind '${error.kind}' should format to string`,
    );
    assertEquals(
      formatted.length > 0,
      true,
      `Error kind '${error.kind}' should have non-empty message`,
    );
  }
});

/**
 * Test: Type exports are consistent
 */
Deno.test("prompt_types - type exports are consistent", () => {
  // Verify that all discriminated union members have type guards where appropriate
  const error1: promptTypes.PromptError = {
    kind: "TemplateNotFound",
    path: "/test",
  };
  const error2: promptTypes.PromptError = {
    kind: "InvalidVariables",
    details: ["test"],
  };

  // Type guards should correctly identify types
  assertEquals(
    promptTypes.isTemplateNotFoundError(error1),
    true,
    "Should identify TemplateNotFound error",
  );
  assertEquals(
    promptTypes.isTemplateNotFoundError(error2),
    false,
    "Should not misidentify other errors",
  );

  assertEquals(
    promptTypes.isInvalidVariablesError(error2),
    true,
    "Should identify InvalidVariables error",
  );
  assertEquals(
    promptTypes.isInvalidVariablesError(error1),
    false,
    "Should not misidentify other errors",
  );
});
