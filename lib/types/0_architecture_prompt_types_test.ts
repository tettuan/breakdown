/**
 * @fileoverview Architecture tests for Prompt Types
 * Testing architectural constraints and design patterns compliance
 * 
 * Architecture tests verify:
 * - Smart Constructor pattern implementation
 * - Discriminated union pattern compliance
 * - Interface design for duck typing
 * - Totality pattern enforcement
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  PromptPath,
  PromptVariables,
  PromptResult,
  PromptError,
  InvalidPathError,
  isTemplateNotFoundError,
  isInvalidVariablesError,
  formatPromptError,
} from "./prompt_types.ts";

Deno.test("0_architecture: PromptPath - Smart Constructor pattern implementation", () => {
  // ARCHITECTURE CONSTRAINT: PromptPath must use Smart Constructor pattern
  // Cannot directly instantiate - must use create() method
  
  // Valid path creation
  const validPathResult = PromptPath.create("/templates/summary.md");
  assertEquals(validPathResult.ok, true);
  
  if (validPathResult.ok) {
    assertExists(validPathResult.data);
    assertEquals(typeof validPathResult.data.toString, "function");
    assertEquals(typeof validPathResult.data.equals, "function");
  }
  
  // Invalid path creation should return error
  const invalidPathResult = PromptPath.create("");
  assertEquals(invalidPathResult.ok, false);
  
  if (!invalidPathResult.ok) {
    assertEquals(invalidPathResult.error.kind, "InvalidPath");
    assertExists(invalidPathResult.error.message);
  }
});

Deno.test("0_architecture: PromptPath - enforces path validation rules", () => {
  // ARCHITECTURE CONSTRAINT: Path validation must enforce security rules
  
  // Empty path rejection
  const emptyResult = PromptPath.create("");
  assertEquals(emptyResult.ok, false);
  
  // Whitespace-only path rejection
  const whitespaceResult = PromptPath.create("   ");
  assertEquals(whitespaceResult.ok, false);
  
  // Path traversal protection
  const traversalResult = PromptPath.create("/path/../other");
  assertEquals(traversalResult.ok, false);
  
  if (!traversalResult.ok) {
    assertEquals(traversalResult.error.kind, "InvalidPath");
    assertEquals(traversalResult.error.message.includes(".."), true);
  }
  
  // Valid paths should pass
  const validPaths = [
    "/templates/prompt.md",
    "relative/path.txt",
    "/absolute/path/file.json",
    "simple.md",
  ];
  
  for (const path of validPaths) {
    const result = PromptPath.create(path);
    assertEquals(result.ok, true, `Path should be valid: ${path}`);
  }
});

Deno.test("0_architecture: PromptPath - value object equality", () => {
  // ARCHITECTURE CONSTRAINT: Value objects must implement proper equality
  
  const path1Result = PromptPath.create("/test/path.md");
  const path2Result = PromptPath.create("/test/path.md");
  const path3Result = PromptPath.create("/different/path.md");
  
  assertEquals(path1Result.ok, true);
  assertEquals(path2Result.ok, true);
  assertEquals(path3Result.ok, true);
  
  if (path1Result.ok && path2Result.ok && path3Result.ok) {
    // Same paths should be equal
    assertEquals(path1Result.data.equals(path2Result.data), true);
    
    // Different paths should not be equal
    assertEquals(path1Result.data.equals(path3Result.data), false);
    
    // String representation should match
    assertEquals(path1Result.data.toString(), "/test/path.md");
    assertEquals(path2Result.data.toString(), "/test/path.md");
  }
});

Deno.test("0_architecture: PromptVariables - duck typing interface design", () => {
  // ARCHITECTURE CONSTRAINT: PromptVariables must support duck typing pattern
  
  // Implementation example - any object with toRecord() is valid
  class TestVariables implements PromptVariables {
    constructor(private data: Record<string, string>) {}
    
    toRecord(): Record<string, string> {
      return { ...this.data };
    }
  }
  
  const variables = new TestVariables({
    name: "test",
    value: "example",
  });
  
  // Interface compliance check
  assertExists(variables.toRecord);
  assertEquals(typeof variables.toRecord, "function");
  
  const record = variables.toRecord();
  assertExists(record);
  assertEquals(typeof record, "object");
  assertEquals(record.name, "test");
  assertEquals(record.value, "example");
  
  // Different implementation should also work
  const simpleVariables: PromptVariables = {
    toRecord(): Record<string, string> {
      return { simple: "value" };
    },
  };
  
  assertExists(simpleVariables.toRecord);
  const simpleRecord = simpleVariables.toRecord();
  assertEquals(simpleRecord.simple, "value");
});

Deno.test("0_architecture: PromptResult - structured result type", () => {
  // ARCHITECTURE CONSTRAINT: PromptResult must have predictable structure
  
  // Minimal result
  const minimalResult: PromptResult = {
    content: "Generated prompt content",
  };
  
  assertExists(minimalResult.content);
  assertEquals(typeof minimalResult.content, "string");
  assertEquals(minimalResult.metadata, undefined);
  
  // Full result with metadata
  const fullResult: PromptResult = {
    content: "Generated prompt with metadata",
    metadata: {
      template: "/templates/summary.md",
      variables: { key: "value" },
      timestamp: new Date(),
    },
  };
  
  assertExists(fullResult.content);
  assertExists(fullResult.metadata);
  assertExists(fullResult.metadata.template);
  assertExists(fullResult.metadata.variables);
  assertExists(fullResult.metadata.timestamp);
  
  assertEquals(typeof fullResult.metadata.template, "string");
  assertEquals(typeof fullResult.metadata.variables, "object");
  assertEquals(fullResult.metadata.timestamp instanceof Date, true);
});

Deno.test("0_architecture: PromptError - discriminated union pattern", () => {
  // ARCHITECTURE CONSTRAINT: PromptError must be a discriminated union with exhaustive cases
  
  const errorTypes: PromptError["kind"][] = [
    "TemplateNotFound",
    "InvalidVariables",
    "SchemaError",
    "InvalidPath",
    "TemplateParseError",
    "ConfigurationError",
  ];
  
  // Each error type must have unique structure
  const errors: PromptError[] = [
    {
      kind: "TemplateNotFound",
      path: "/missing/template.md",
    },
    {
      kind: "InvalidVariables",
      details: ["Missing required variable", "Invalid format"],
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
      error: "Malformed template syntax",
    },
    {
      kind: "ConfigurationError",
      message: "Missing configuration file",
    },
  ];
  
  for (const error of errors) {
    assertExists(error.kind);
    assertEquals(errorTypes.includes(error.kind), true);
    
    // Verify specific error structure
    switch (error.kind) {
      case "TemplateNotFound":
        assertExists(error.path);
        break;
      case "InvalidVariables":
        assertExists(error.details);
        assertEquals(Array.isArray(error.details), true);
        break;
      case "SchemaError":
        assertExists(error.schema);
        assertExists(error.error);
        break;
      case "InvalidPath":
        assertExists(error.message);
        break;
      case "TemplateParseError":
        assertExists(error.template);
        assertExists(error.error);
        break;
      case "ConfigurationError":
        assertExists(error.message);
        break;
    }
  }
});

Deno.test("0_architecture: Error type guards - enforce type safety", () => {
  // ARCHITECTURE CONSTRAINT: Type guards must provide compile-time type safety
  
  const templateNotFoundError: PromptError = {
    kind: "TemplateNotFound",
    path: "/missing/template.md",
  };
  
  const invalidVariablesError: PromptError = {
    kind: "InvalidVariables",
    details: ["Missing variable"],
  };
  
  const schemaError: PromptError = {
    kind: "SchemaError",
    schema: "test.json",
    error: "Invalid",
  };
  
  // Type guard functionality
  assertEquals(isTemplateNotFoundError(templateNotFoundError), true);
  assertEquals(isTemplateNotFoundError(invalidVariablesError), false);
  assertEquals(isTemplateNotFoundError(schemaError), false);
  
  assertEquals(isInvalidVariablesError(invalidVariablesError), true);
  assertEquals(isInvalidVariablesError(templateNotFoundError), false);
  assertEquals(isInvalidVariablesError(schemaError), false);
  
  // Type narrowing verification
  if (isTemplateNotFoundError(templateNotFoundError)) {
    // TypeScript should narrow the type here
    assertExists(templateNotFoundError.path);
    assertEquals(templateNotFoundError.path, "/missing/template.md");
  }
  
  if (isInvalidVariablesError(invalidVariablesError)) {
    // TypeScript should narrow the type here
    assertExists(invalidVariablesError.details);
    assertEquals(Array.isArray(invalidVariablesError.details), true);
  }
});

Deno.test("0_architecture: formatPromptError - totality pattern enforcement", () => {
  // ARCHITECTURE CONSTRAINT: Error formatting must handle all error types (totality)
  
  const allErrorTypes: PromptError[] = [
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
      error: "Invalid JSON",
    },
    {
      kind: "InvalidPath",
      message: "Path contains ..",
    },
    {
      kind: "TemplateParseError",
      template: "broken.md",
      error: "Syntax error",
    },
    {
      kind: "ConfigurationError",
      message: "Missing config",
    },
  ];
  
  for (const error of allErrorTypes) {
    const formatted = formatPromptError(error);
    
    assertExists(formatted);
    assertEquals(typeof formatted, "string");
    assertEquals(formatted.length > 0, true);
    
    // Error type should be included in message
    assertEquals(formatted.toLowerCase().includes(error.kind.toLowerCase()), true);
    
    // Verify specific content based on error type
    switch (error.kind) {
      case "TemplateNotFound":
        assertEquals(formatted.includes(error.path), true);
        break;
      case "InvalidVariables":
        assertEquals(formatted.includes(error.details.join(", ")), true);
        break;
      case "SchemaError":
        assertEquals(formatted.includes(error.schema), true);
        assertEquals(formatted.includes(error.error), true);
        break;
      case "InvalidPath":
        assertEquals(formatted.includes(error.message), true);
        break;
      case "TemplateParseError":
        assertEquals(formatted.includes(error.template), true);
        assertEquals(formatted.includes(error.error), true);
        break;
      case "ConfigurationError":
        assertEquals(formatted.includes(error.message), true);
        break;
    }
  }
});

Deno.test("0_architecture: Type system constraints - compile-time validation", () => {
  // ARCHITECTURE CONSTRAINT: Types must enforce constraints at compile time
  
  // This test verifies that the type system prevents invalid constructions
  // Most validation happens at compile time, so we test runtime aspects
  
  // InvalidPathError must have specific structure
  const invalidPathError: InvalidPathError = {
    kind: "InvalidPath",
    message: "Test error message",
  };
  
  assertExists(invalidPathError.kind);
  assertExists(invalidPathError.message);
  assertEquals(invalidPathError.kind, "InvalidPath");
  
  // PromptResult content is required
  const result: PromptResult = {
    content: "Required content",
  };
  
  assertExists(result.content);
  assertEquals(typeof result.content, "string");
  
  // Optional metadata can be omitted
  assertEquals(result.metadata, undefined);
});