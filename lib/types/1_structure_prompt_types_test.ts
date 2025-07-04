/**
 * @fileoverview Structure tests for prompt_types module
 *
 * Tests class structure and responsibility separation:
 * - Single Responsibility Principle
 * - Proper abstraction levels
 * - Class relationships
 * - Responsibility distribution
 *
 * @module
 */

import { assertEquals, assertExists } from "../deps.ts";
import {
  formatPromptError,
  isInvalidVariablesError,
  isTemplateNotFoundError,
  PromptError,
  PromptPath,
  PromptResult,
  PromptVariables,
} from "./prompt_types.ts";
import { Result } from "./result.ts";

/**
 * Test: PromptPath has single responsibility
 */
Deno.test("PromptPath - follows single responsibility principle", () => {
  // PromptPath should only be responsible for path validation and representation
  const pathResult = PromptPath.create("/valid/path");
  assertEquals(pathResult.ok, true);

  if (pathResult.ok) {
    const path = pathResult.data;

    // Should provide string representation
    assertEquals(typeof path.toString(), "string");

    // Should provide equality check
    const samePath = PromptPath.create("/valid/path");
    if (samePath.ok) {
      assertEquals(path.equals(samePath.data), true);
    }

    // Should not have methods unrelated to path representation
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(path));
    const publicMethods = methods.filter((m) =>
      !m.startsWith("_") &&
      m !== "constructor" &&
      typeof (path as Record<string, unknown>)[m] === "function"
    );

    // Only toString and equals should be public methods
    assertEquals(publicMethods.sort(), ["equals", "toString"]);
  }
});

/**
 * Test: PromptPath validation is comprehensive
 */
Deno.test("PromptPath - validation covers all cases", () => {
  // Test various invalid paths
  const invalidCases = [
    { input: "", reason: "empty path" },
    { input: "   ", reason: "whitespace only" },
    { input: "../etc/passwd", reason: "path traversal" },
    { input: "path/../secret", reason: "contains .." },
  ];

  for (const { input, reason } of invalidCases) {
    const result = PromptPath.create(input);
    assertEquals(
      result.ok,
      false,
      `Should reject ${reason}: "${input}"`,
    );
  }

  // Test valid paths
  const validCases = [
    "/absolute/path",
    "relative/path",
    "file.txt",
    "/path/with/many/segments",
  ];

  for (const input of validCases) {
    const result = PromptPath.create(input);
    assertEquals(
      result.ok,
      true,
      `Should accept valid path: "${input}"`,
    );
  }
});

/**
 * Test: PromptVariables interface is minimal
 */
Deno.test("PromptVariables - interface has single method", () => {
  // Create test implementation
  const testImpl: PromptVariables = {
    toRecord: () => ({ key: "value" }),
  };

  // Interface should only require toRecord method
  const record = testImpl.toRecord();
  assertEquals(typeof record, "object");
  assertEquals(record.key, "value");

  // Multiple implementations should be possible (Duck Typing)
  class ClassImpl implements PromptVariables {
    constructor(private data: Record<string, string>) {}
    toRecord(): Record<string, string> {
      return { ...this.data };
    }
  }

  const classInstance = new ClassImpl({ foo: "bar" });
  assertEquals(classInstance.toRecord().foo, "bar");
});

/**
 * Test: PromptError discriminated union is well-structured
 */
Deno.test("PromptError - each variant has distinct structure", () => {
  // Each error type should have unique fields
  const errorVariants: PromptError[] = [
    { kind: "TemplateNotFound", path: "/missing" },
    { kind: "InvalidVariables", details: ["error1", "error2"] },
    { kind: "SchemaError", schema: "schema.json", error: "parse error" },
    { kind: "InvalidPath", message: "invalid path format" },
    { kind: "TemplateParseError", template: "template.md", error: "syntax" },
    { kind: "ConfigurationError", message: "config not found" },
  ];

  // Verify each variant has required fields
  for (const error of errorVariants) {
    assertExists(error.kind, "Every error should have kind field");

    switch (error.kind) {
      case "TemplateNotFound":
        assertExists(error.path, "TemplateNotFound should have path");
        break;
      case "InvalidVariables":
        assertExists(error.details, "InvalidVariables should have details");
        assertEquals(Array.isArray(error.details), true);
        break;
      case "SchemaError":
        assertExists(error.schema, "SchemaError should have schema");
        assertExists(error.error, "SchemaError should have error");
        break;
      case "InvalidPath":
        assertExists(error.message, "InvalidPath should have message");
        break;
      case "TemplateParseError":
        assertExists(error.template, "TemplateParseError should have template");
        assertExists(error.error, "TemplateParseError should have error");
        break;
      case "ConfigurationError":
        assertExists(error.message, "ConfigurationError should have message");
        break;
    }
  }
});

/**
 * Test: Helper functions have single responsibilities
 */
Deno.test("Helper functions - each has single responsibility", () => {
  const error1: PromptError = { kind: "TemplateNotFound", path: "/test" };
  const error2: PromptError = { kind: "InvalidVariables", details: ["var"] };

  // Type guards should only check type
  assertEquals(
    isTemplateNotFoundError(error1),
    true,
    "Type guard should identify correct type",
  );
  assertEquals(
    isTemplateNotFoundError(error2),
    false,
    "Type guard should reject incorrect type",
  );

  assertEquals(
    isInvalidVariablesError(error2),
    true,
    "Type guard should identify correct type",
  );
  assertEquals(
    isInvalidVariablesError(error1),
    false,
    "Type guard should reject incorrect type",
  );

  // Formatter should only format errors
  const formatted1 = formatPromptError(error1);
  const formatted2 = formatPromptError(error2);

  assertEquals(typeof formatted1, "string");
  assertEquals(typeof formatted2, "string");
  assertEquals(formatted1.includes("Template not found"), true);
  assertEquals(formatted2.includes("Invalid variables"), true);
});

/**
 * Test: PromptResult structure is appropriate
 */
Deno.test("PromptResult - structure supports necessary data", () => {
  // Test minimal result
  const minimalResult: PromptResult = {
    content: "Generated prompt content",
  };
  assertExists(minimalResult.content);
  assertEquals(minimalResult.metadata, undefined);

  // Test full result
  const fullResult: PromptResult = {
    content: "Generated prompt content",
    metadata: {
      template: "/templates/test.md",
      variables: { name: "test", value: "123" },
      timestamp: new Date(),
    },
  };

  assertExists(fullResult.content);
  assertExists(fullResult.metadata);
  assertExists(fullResult.metadata.template);
  assertExists(fullResult.metadata.variables);
  assertExists(fullResult.metadata.timestamp);

  // Metadata should be optional
  const { metadata: _metadata, ...required } = fullResult;
  assertEquals(Object.keys(required), ["content"]);
});

/**
 * Test: Types work together cohesively
 */
Deno.test("Types - work together as a cohesive system", async () => {
  // Simulate a complete workflow using all types

  // 1. Create a path
  const pathResult = PromptPath.create("/templates/summary.md");
  assertEquals(pathResult.ok, true);

  if (!pathResult.ok) return;

  // 2. Create variables
  const variables: PromptVariables = {
    toRecord: () => ({
      title: "Test Document",
      author: "Test Author",
    }),
  };

  // 3. Simulate success result
  const successResult: Result<PromptResult, PromptError> = {
    ok: true,
    data: {
      content: "Generated content with Test Document by Test Author",
      metadata: {
        template: pathResult.data.toString(),
        variables: variables.toRecord(),
      },
    },
  };

  assertEquals(successResult.ok, true);

  // 4. Simulate error result
  const errorResult: Result<PromptResult, PromptError> = {
    ok: false,
    error: {
      kind: "TemplateNotFound",
      path: pathResult.data.toString(),
    },
  };

  assertEquals(errorResult.ok, false);
  if (!errorResult.ok) {
    const errorMessage = formatPromptError(errorResult.error);
    assertEquals(errorMessage.includes("Template not found"), true);
  }
});
