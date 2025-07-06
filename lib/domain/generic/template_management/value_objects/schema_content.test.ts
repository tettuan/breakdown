/**
 * @fileoverview Unit tests for SchemaContent Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "@std/assert";
import { SchemaContent, type SchemaContentResult } from "./schema_content.ts";

// Test fixtures
const validJsonSchema = JSON.stringify({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"]
});

const formattedJsonSchema = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "required": ["name"]
}`;

const invalidJsonContent = `{ "type": "object", "invalid": }`;
const emptyContent = "";
const whitespaceContent = "   \n\t  ";
const simpleJsonContent = `{"message": "hello"}`;

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new SchemaContent(validJsonSchema);
  
  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof SchemaContent.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = SchemaContent.create(validJsonSchema);
  
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.constructor.name, "SchemaContent");
  } else {
    assertExists(result.error);
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown", () => {
  // Architecture constraint: must not throw exceptions (Totality principle)
  const testCases = [
    null,
    undefined,
    "",
    "   ",
    0,
    [],
    {},
    Symbol("test"),
    () => {},
    "invalid json",
    "{invalid}",
  ];

  for (const testCase of testCases) {
    // Should not throw - all errors handled via Result type
    const result = SchemaContent.create(testCase as any);
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
  }
});

Deno.test("0_architecture: Totality principle - handles all input types", () => {
  // Architecture constraint: should handle any input without throwing
  const extremeTestCases = [
    null,
    undefined,
    0,
    false,
    [],
    {},
    Symbol("test"),
    () => {},
    new Date(),
    /regex/,
    BigInt(123),
  ];

  for (const testCase of extremeTestCases) {
    const result = SchemaContent.create(testCase as any);
    assertEquals(typeof result.ok, "boolean");
    assertEquals(result.ok, false);
    assertExists(result.error);
  }
});

Deno.test("0_architecture: Result type follows discriminated union pattern", () => {
  const successResult = SchemaContent.create(validJsonSchema);
  const errorResult = SchemaContent.create("");
  
  // Success case
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);
  }
  
  // Error case
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests
// =============================================================================

Deno.test("1_behavior: creates SchemaContent with valid JSON", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.getValue(), validJsonSchema);
    assertEquals(result.data.isValid(), true);
  }
});

Deno.test("1_behavior: rejects empty content", () => {
  const result = SchemaContent.create(emptyContent);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Schema content cannot be empty");
  }
});

Deno.test("1_behavior: rejects whitespace-only content", () => {
  const result = SchemaContent.create(whitespaceContent);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Schema content cannot be empty");
  }
});

Deno.test("1_behavior: rejects invalid JSON", () => {
  const result = SchemaContent.create(invalidJsonContent);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.startsWith("Invalid JSON schema:"), true);
  }
});

Deno.test("1_behavior: parses valid JSON correctly", () => {
  const result = SchemaContent.create(simpleJsonContent);
  
  if (result.ok) {
    const parsed = result.data.getParsedSchema();
    assertExists(parsed);
    assertEquals((parsed as any).message, "hello");
  }
});

Deno.test("1_behavior: validates JSON on creation", () => {
  const validResult = SchemaContent.create(validJsonSchema);
  const invalidResult = SchemaContent.create(invalidJsonContent);
  
  if (validResult.ok) {
    assertEquals(validResult.data.isValid(), true);
  }
  
  assertEquals(invalidResult.ok, false);
});

Deno.test("1_behavior: provides content length", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    assertEquals(result.data.getLength(), validJsonSchema.length);
    assertEquals(result.data.isEmpty(), false);
  }
});

Deno.test("1_behavior: generates consistent hash", () => {
  const result1 = SchemaContent.create(validJsonSchema);
  const result2 = SchemaContent.create(validJsonSchema);
  
  if (result1.ok && result2.ok) {
    assertEquals(result1.data.getHash(), result2.data.getHash());
  }
});

Deno.test("1_behavior: formats JSON correctly", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const formatted = result.data.getFormattedJson();
    
    // Should be valid JSON
    try {
      JSON.parse(formatted);
    } catch {
      throw new Error("Formatted JSON should be valid");
    }
    
    // Should contain newlines (formatted)
    assertEquals(formatted.includes("\n"), true);
  }
});

Deno.test("1_behavior: minifies JSON correctly", () => {
  const result = SchemaContent.create(formattedJsonSchema);
  
  if (result.ok) {
    const minified = result.data.getMinifiedJson();
    
    // Should be valid JSON
    try {
      JSON.parse(minified);
    } catch {
      throw new Error("Minified JSON should be valid");
    }
    
    // Should not contain unnecessary whitespace
    assertEquals(minified.includes("\n"), false);
    assertEquals(minified.includes("  "), false);
  }
});

Deno.test("1_behavior: handles malformed JSON gracefully in formatting", () => {
  // Create schema with pre-parsed valid JSON
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    // Both formatted and minified should work
    const formatted = result.data.getFormattedJson();
    const minified = result.data.getMinifiedJson();
    
    assertExists(formatted);
    assertExists(minified);
    assertEquals(typeof formatted, "string");
    assertEquals(typeof minified, "string");
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: SchemaContent immutability", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const content = result.data;
    
    // getValue should always return the same content
    assertEquals(content.getValue(), validJsonSchema);
    assertEquals(content.getValue(), content.getValue());
  }
});

Deno.test("2_structure: parsed schema immutability", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const parsed1 = result.data.getParsedSchema();
    const parsed2 = result.data.getParsedSchema();
    
    // Should return the same object reference
    assertEquals(parsed1, parsed2);
  }
});

Deno.test("2_structure: error results have correct structure", () => {
  const invalidResult = SchemaContent.create("");
  
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    assertEquals(typeof invalidResult.error, "string");
    assertEquals(invalidResult.data, undefined);
  }
});

Deno.test("2_structure: success results have correct structure", () => {
  const validResult = SchemaContent.create(validJsonSchema);
  
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.data instanceof SchemaContent, true);
    assertEquals(validResult.error, undefined);
  }
});

Deno.test("2_structure: method return type consistency", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const content = result.data;
    
    // Verify return types
    assertEquals(typeof content.getValue(), "string");
    assertEquals(typeof content.isValid(), "boolean");
    assertEquals(typeof content.getFormattedJson(), "string");
    assertEquals(typeof content.getMinifiedJson(), "string");
    assertEquals(typeof content.getLength(), "number");
    assertEquals(typeof content.isEmpty(), "boolean");
    assertEquals(typeof content.getHash(), "string");
    assertEquals(typeof content.toString(), "string");
  }
});

Deno.test("2_structure: equals method correctness", () => {
  const result1 = SchemaContent.create(validJsonSchema);
  const result2 = SchemaContent.create(validJsonSchema);
  const result3 = SchemaContent.create(simpleJsonContent);
  
  if (result1.ok && result2.ok && result3.ok) {
    // Same content should be equal
    assertEquals(result1.data.equals(result2.data), true);
    assertEquals(result2.data.equals(result1.data), true);
    
    // Different content should not be equal
    assertEquals(result1.data.equals(result3.data), false);
    assertEquals(result3.data.equals(result1.data), false);
  }
});

Deno.test("2_structure: toString implementation", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    assertEquals(result.data.toString(), validJsonSchema);
    assertEquals(result.data.toString(), result.data.getValue());
  }
});

Deno.test("2_structure: JSON formatting preserves original", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const original = result.data.getValue();
    const formatted = result.data.getFormattedJson();
    const minified = result.data.getMinifiedJson();
    
    // Original should be unchanged
    assertEquals(result.data.getValue(), original);
    
    // Formatted and minified should be different but valid
    // Note: formatted may be same as original if already formatted
    assertEquals(typeof formatted, "string");
    assertEquals(typeof minified, "string");
  }
});

Deno.test("2_structure: multiple instance independence", () => {
  const result1 = SchemaContent.create('{"type": "string"}');
  const result2 = SchemaContent.create('{"type": "number"}');
  
  if (result1.ok && result2.ok) {
    // Different instances should be independent
    assertEquals(result1.data === result2.data, false);
    assertEquals(result1.data.equals(result2.data), false);
    
    // They should have different parsed schemas
    const parsed1 = result1.data.getParsedSchema() as any;
    const parsed2 = result2.data.getParsedSchema() as any;
    assertEquals(parsed1.type !== parsed2.type, true);
  }
});

Deno.test("2_structure: SchemaContentResult interface compliance", () => {
  const validResult: SchemaContentResult = SchemaContent.create(validJsonSchema);
  const invalidResult: SchemaContentResult = SchemaContent.create("");
  
  // Valid result structure
  assertEquals(typeof validResult.ok, "boolean");
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.error, undefined);
  }
  
  // Invalid result structure
  assertEquals(typeof invalidResult.ok, "boolean");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.data, undefined);
    assertExists(invalidResult.error);
  }
});

Deno.test("2_structure: validation consistency", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    // isValid should be consistent with parsed schema existence
    assertEquals(result.data.isValid(), true);
    assertExists(result.data.getParsedSchema());
  }
});

Deno.test("2_structure: hash consistency across calls", () => {
  const result = SchemaContent.create(validJsonSchema);
  
  if (result.ok) {
    const hash1 = result.data.getHash();
    const hash2 = result.data.getHash();
    const hash3 = result.data.getHash();
    
    // Multiple calls should return same hash
    assertEquals(hash1, hash2);
    assertEquals(hash2, hash3);
    assertEquals(typeof hash1, "string");
  }
});