/**
 * @fileoverview Structure tests for Prompt Types
 * Testing data structure integrity and type relationships
 *
 * Structure tests verify:
 * - Type relationships and hierarchies
 * - Structural completeness
 * - Data integrity constraints
 * - Type compatibility
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type InvalidPathError,
  type PromptError,
  PromptPath,
  type PromptResult,
  type PromptVariables,
} from "./prompt_types.ts";
import {
  formatPromptError,
  isInvalidVariablesError,
  isTemplateNotFoundError,
} from "./prompt_types.ts";
import type { Result as _Result } from "./result.ts";

Deno.test("2_structure: InvalidPathError interface defines minimal structure", () => {
  // Test minimal required structure
  const minimal: InvalidPathError = {
    kind: "InvalidPath",
    message: "Test error",
  };

  assertExists(minimal.kind);
  assertExists(minimal.message);
  assertEquals(Object.keys(minimal).length, 2);
  assertEquals(minimal.kind, "InvalidPath");
  assertEquals(typeof minimal.message, "string");

  // Test with additional properties (should be allowed)
  const extended: InvalidPathError & { context?: Record<string, unknown> } = {
    kind: "InvalidPath",
    message: "Extended error with context",
    context: {
      path: "/invalid/path",
      timestamp: Date.now(),
      source: "user_input",
    },
  };

  assertExists(extended.kind);
  assertExists(extended.message);
  assertExists(extended.context);
  assertEquals(extended.kind, "InvalidPath");
});

Deno.test("2_structure: PromptPath type structure and methods", () => {
  // Test that PromptPath has correct method signatures
  type PromptPathType = typeof PromptPath;

  // Static create method should exist
  assertExists(PromptPath.create);
  assertEquals(typeof PromptPath.create, "function");

  // Test return type structure of create method
  const pathResult = PromptPath.create("/test/path.md");

  // Result should have either ok: true with data, or ok: false with error
  assertExists(pathResult.ok);
  assertEquals(typeof pathResult.ok, "boolean");

  if (pathResult.ok) {
    assertExists(pathResult.data);
    assertExists(pathResult.data.toString);
    assertExists(pathResult.data.equals);
    assertEquals(typeof pathResult.data.toString, "function");
    assertEquals(typeof pathResult.data.equals, "function");
    assertEquals("error" in pathResult, false);
  } else {
    assertExists(pathResult.error);
    assertEquals(pathResult.error.kind, "InvalidPath");
    assertExists(pathResult.error.message);
    assertEquals("data" in pathResult, false);
  }
});

Deno.test("2_structure: PromptVariables interface contract", () => {
  // Test interface requirements
  interface TestVariables extends PromptVariables {
    toRecord(): Record<string, string>;
  }

  // Implementation should satisfy interface
  class ConcreteVariables implements TestVariables {
    constructor(private data: Record<string, string>) {}

    toRecord(): Record<string, string> {
      return { ...this.data };
    }
  }

  const variables = new ConcreteVariables({
    key1: "value1",
    key2: "value2",
  });

  // Interface contract verification
  assertExists(variables.toRecord);
  assertEquals(typeof variables.toRecord, "function");

  const record = variables.toRecord();
  assertEquals(typeof record, "object");
  assertEquals(record.constructor, Object);
  assertEquals(Array.isArray(record), false);

  // All values should be strings
  for (const value of Object.values(record)) {
    assertEquals(typeof value, "string");
  }

  // All keys should be strings
  for (const key of Object.keys(record)) {
    assertEquals(typeof key, "string");
  }
});

Deno.test("2_structure: PromptResult type structure completeness", () => {
  // Test minimal structure
  const minimal: PromptResult = {
    content: "Generated prompt content",
  };

  assertExists(minimal.content);
  assertEquals(typeof minimal.content, "string");
  assertEquals(minimal.metadata, undefined);
  assertEquals(Object.keys(minimal).length, 1);

  // Test full structure
  const full: PromptResult = {
    content: "Generated prompt with metadata",
    metadata: {
      template: "/templates/test.md",
      variables: {
        var1: "value1",
        var2: "value2",
        var3: "value3",
      },
      timestamp: new Date(),
    },
  };

  assertExists(full.content);
  assertExists(full.metadata);
  assertEquals(typeof full.content, "string");
  assertEquals(typeof full.metadata, "object");
  assertEquals(Object.keys(full).length, 2);

  // Metadata structure verification
  assertExists(full.metadata.template);
  assertExists(full.metadata.variables);
  assertExists(full.metadata.timestamp);
  assertEquals(typeof full.metadata.template, "string");
  assertEquals(typeof full.metadata.variables, "object");
  assertEquals(full.metadata.timestamp instanceof Date, true);

  // Variables should be Record<string, string>
  for (const [key, value] of Object.entries(full.metadata.variables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
  }
});

Deno.test("2_structure: PromptError discriminated union completeness", () => {
  // Test all discriminated union variants
  const errorVariants: PromptError[] = [
    {
      kind: "TemplateNotFound",
      path: "/missing/template.md",
    },
    {
      kind: "InvalidVariables",
      details: ["Missing var1", "Invalid var2"],
    },
    {
      kind: "SchemaError",
      schema: "output.schema.json",
      error: "Invalid JSON syntax",
    },
    {
      kind: "InvalidPath",
      message: "Path contains invalid characters",
    },
    {
      kind: "TemplateParseError",
      template: "broken.md",
      error: "Unclosed template tag",
    },
    {
      kind: "ConfigurationError",
      message: "Missing configuration file",
    },
  ];

  // Verify each variant has correct structure
  for (const error of errorVariants) {
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");

    // Check variant-specific structure
    switch (error.kind) {
      case "TemplateNotFound":
        assertExists(error.path);
        assertEquals(typeof error.path, "string");
        assertEquals("details" in error, false);
        assertEquals("schema" in error, false);
        assertEquals("message" in error, false);
        assertEquals("template" in error, false);
        break;

      case "InvalidVariables":
        assertExists(error.details);
        assertEquals(Array.isArray(error.details), true);
        assertEquals(error.details.length > 0, true);
        for (const detail of error.details) {
          assertEquals(typeof detail, "string");
        }
        assertEquals("path" in error, false);
        assertEquals("schema" in error, false);
        assertEquals("message" in error, false);
        break;

      case "SchemaError":
        assertExists(error.schema);
        assertExists(error.error);
        assertEquals(typeof error.schema, "string");
        assertEquals(typeof error.error, "string");
        assertEquals("path" in error, false);
        assertEquals("details" in error, false);
        assertEquals("message" in error, false);
        break;

      case "InvalidPath":
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        assertEquals("path" in error, false);
        assertEquals("details" in error, false);
        assertEquals("schema" in error, false);
        assertEquals("template" in error, false);
        break;

      case "TemplateParseError":
        assertExists(error.template);
        assertExists(error.error);
        assertEquals(typeof error.template, "string");
        assertEquals(typeof error.error, "string");
        assertEquals("path" in error, false);
        assertEquals("details" in error, false);
        assertEquals("message" in error, false);
        break;

      case "ConfigurationError":
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        assertEquals("path" in error, false);
        assertEquals("details" in error, false);
        assertEquals("schema" in error, false);
        assertEquals("template" in error, false);
        break;
    }
  }

  // Verify all kinds are unique
  const kinds = errorVariants.map((e) => e.kind);
  const uniqueKinds = [...new Set(kinds)];
  assertEquals(kinds.length, uniqueKinds.length);
  assertEquals(uniqueKinds.length, 6);
});

Deno.test("2_structure: Type guard functions maintain type safety", () => {
  // Test type guard function signatures
  assertExists(isTemplateNotFoundError);
  assertExists(isInvalidVariablesError);
  assertEquals(typeof isTemplateNotFoundError, "function");
  assertEquals(typeof isInvalidVariablesError, "function");

  // Create test errors for type guard verification
  const templateNotFound: PromptError = {
    kind: "TemplateNotFound",
    path: "/missing/template.md",
  };

  const invalidVariables: PromptError = {
    kind: "InvalidVariables",
    details: ["Missing variable"],
  };

  const schemaError: PromptError = {
    kind: "SchemaError",
    schema: "test.json",
    error: "Invalid",
  };

  // Test type guard return types
  const isTemplate = isTemplateNotFoundError(templateNotFound);
  const isVariables = isInvalidVariablesError(invalidVariables);
  const isNotTemplate = isTemplateNotFoundError(schemaError);

  assertEquals(typeof isTemplate, "boolean");
  assertEquals(typeof isVariables, "boolean");
  assertEquals(typeof isNotTemplate, "boolean");

  assertEquals(isTemplate, true);
  assertEquals(isVariables, true);
  assertEquals(isNotTemplate, false);

  // Type narrowing verification
  if (isTemplateNotFoundError(templateNotFound)) {
    // TypeScript should narrow the type here
    assertExists(templateNotFound.path);
    assertEquals(templateNotFound.path, "/missing/template.md");
  }

  if (isInvalidVariablesError(invalidVariables)) {
    // TypeScript should narrow the type here
    assertExists(invalidVariables.details);
    assertEquals(Array.isArray(invalidVariables.details), true);
  }
});

Deno.test("2_structure: formatPromptError function type consistency", () => {
  // Test function signature
  assertExists(formatPromptError);
  assertEquals(typeof formatPromptError, "function");

  // Test with all error types to verify consistent return type
  const allErrorTypes: PromptError[] = [
    { kind: "TemplateNotFound", path: "/test" },
    { kind: "InvalidVariables", details: ["error"] },
    { kind: "SchemaError", schema: "test.json", error: "invalid" },
    { kind: "InvalidPath", message: "invalid path" },
    { kind: "TemplateParseError", template: "test.md", error: "parse error" },
    { kind: "ConfigurationError", message: "config error" },
  ];

  for (const error of allErrorTypes) {
    const formatted = formatPromptError(error);

    // Should always return string
    assertEquals(typeof formatted, "string");
    assertEquals(formatted.length > 0, true);

    // Should contain error kind information
    assertEquals(formatted.toLowerCase().includes(error.kind.toLowerCase()), true);
  }
});

Deno.test("2_structure: Type relationships maintain hierarchy", () => {
  // Test that InvalidPathError is compatible with error interfaces
  function processError(error: { kind: string; message: string }): string {
    return `${error.kind}: ${error.message}`;
  }

  const pathError: InvalidPathError = {
    kind: "InvalidPath",
    message: "Test error message",
  };

  // Should be assignable to more generic error interface
  const result = processError(pathError);
  assertEquals(result, "InvalidPath: Test error message");

  // Test PromptError assignability
  function processPromptError(error: PromptError): string {
    return error.kind;
  }

  const promptErrors: PromptError[] = [
    { kind: "TemplateNotFound", path: "/test" },
    { kind: "InvalidVariables", details: ["error"] },
    { kind: "SchemaError", schema: "test.json", error: "invalid" },
    { kind: "InvalidPath", message: "invalid" },
    { kind: "TemplateParseError", template: "test.md", error: "parse error" },
    { kind: "ConfigurationError", message: "config error" },
  ];

  for (const error of promptErrors) {
    const kind = processPromptError(error);
    assertEquals(typeof kind, "string");
    assertEquals(kind, error.kind);
  }
});

Deno.test("2_structure: Optional properties maintain structural consistency", () => {
  // Test that optional properties don't break structure

  // PromptResult with and without metadata
  const withoutMetadata: PromptResult = {
    content: "Test content",
  };

  const withMetadata: PromptResult = {
    content: "Test content",
    metadata: {
      template: "/test.md",
      variables: { key: "value" },
    },
  };

  const withFullMetadata: PromptResult = {
    content: "Test content",
    metadata: {
      template: "/test.md",
      variables: { key: "value" },
      timestamp: new Date(),
    },
  };

  // All should have consistent structure
  const results = [withoutMetadata, withMetadata, withFullMetadata];

  for (const result of results) {
    assertExists(result.content);
    assertEquals(typeof result.content, "string");

    if (result.metadata) {
      assertExists(result.metadata.template);
      assertExists(result.metadata.variables);
      assertEquals(typeof result.metadata.template, "string");
      assertEquals(typeof result.metadata.variables, "object");

      if (result.metadata.timestamp) {
        assertEquals(result.metadata.timestamp instanceof Date, true);
      }
    }
  }
});

Deno.test("2_structure: Error exhaustiveness through switch statements", () => {
  // Test that discriminated union enables exhaustive pattern matching
  function categorizeError(error: PromptError): string {
    switch (error.kind) {
      case "TemplateNotFound":
        return "file";
      case "InvalidVariables":
        return "data";
      case "SchemaError":
        return "schema";
      case "InvalidPath":
        return "path";
      case "TemplateParseError":
        return "parsing";
      case "ConfigurationError":
        return "config";
      default: {
        // This should never happen if all cases are handled
        const _exhaustiveCheck: never = error;
        return `Unknown: ${JSON.stringify(_exhaustiveCheck)}`;
      }
    }
  }

  // Test with all error types
  const testCases: Array<[PromptError, string]> = [
    [{ kind: "TemplateNotFound", path: "/test" }, "file"],
    [{ kind: "InvalidVariables", details: ["error"] }, "data"],
    [{ kind: "SchemaError", schema: "test.json", error: "invalid" }, "schema"],
    [{ kind: "InvalidPath", message: "invalid" }, "path"],
    [{ kind: "TemplateParseError", template: "test.md", error: "parse" }, "parsing"],
    [{ kind: "ConfigurationError", message: "config" }, "config"],
  ];

  for (const [error, expectedCategory] of testCases) {
    assertEquals(categorizeError(error), expectedCategory);
  }
});

Deno.test("2_structure: Result type integration with PromptPath", () => {
  // Test that PromptPath.create returns proper Result type
  type PromptPathResult = ReturnType<typeof PromptPath.create>;

  // Should be Result<PromptPath, InvalidPathError>
  const successResult = PromptPath.create("/valid/path.md");
  const errorResult = PromptPath.create("");

  // Type structure verification
  assertExists(successResult.ok);
  assertExists(errorResult.ok);
  assertEquals(typeof successResult.ok, "boolean");
  assertEquals(typeof errorResult.ok, "boolean");

  // Success case structure
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);

    // PromptPath instance verification
    assertExists(successResult.data.toString);
    assertExists(successResult.data.equals);
    assertEquals(typeof successResult.data.toString, "function");
    assertEquals(typeof successResult.data.equals, "function");
  }

  // Error case structure
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);

    // InvalidPathError structure verification
    assertEquals(errorResult.error.kind, "InvalidPath");
    assertExists(errorResult.error.message);
    assertEquals(typeof errorResult.error.message, "string");
  }
});

Deno.test("2_structure: Complex nested data structure integrity", () => {
  // Test complex nested structures maintain integrity
  const complexResult: PromptResult = {
    content: "Complex prompt with nested metadata",
    metadata: {
      template: "/templates/complex/nested/prompt.md",
      variables: {
        input_file: "/data/input/project.md",
        output_file: "/data/output/breakdown.json",
        schema_file: "/schemas/breakdown.schema.json",
        format: "json",
        include_timestamps: "true",
        author: "automated_system",
        version: "1.0.0",
      },
      timestamp: new Date("2024-01-01T00:00:00Z"),
    },
  };

  // Verify structure integrity
  assertExists(complexResult.content);
  assertExists(complexResult.metadata);
  assertEquals(typeof complexResult.content, "string");
  assertEquals(typeof complexResult.metadata, "object");

  // Verify metadata structure
  const metadata = complexResult.metadata;
  assertExists(metadata.template);
  assertExists(metadata.variables);
  assertExists(metadata.timestamp);

  // Verify variables structure
  const variables = metadata.variables;
  assertEquals(Object.keys(variables).length, 7);

  for (const [key, value] of Object.entries(variables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
  }

  // Verify timestamp
  assertEquals(metadata.timestamp instanceof Date, true);
  assertEquals(metadata.timestamp.getTime(), new Date("2024-01-01T00:00:00Z").getTime());

  // Test complex error structure
  const complexError: PromptError = {
    kind: "InvalidVariables",
    details: [
      "Variable 'input_file' path '/invalid/path' does not exist",
      "Variable 'output_format' must be one of: json, yaml, xml",
      "Variable 'include_metadata' must be boolean, got string 'maybe'",
      "Variable 'author' cannot be empty string",
      "Variable 'schema_version' is required when format is 'json'",
    ],
  };

  assertEquals(complexError.kind, "InvalidVariables");
  assertEquals(Array.isArray(complexError.details), true);
  assertEquals(complexError.details.length, 5);

  for (const detail of complexError.details) {
    assertEquals(typeof detail, "string");
    assertEquals(detail.length > 0, true);
  }
});
