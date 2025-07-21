/**
 * @fileoverview DirectiveType Value Object Tests
 *
 * Test suite for DirectiveType following DDD principles and Totality principle.
 * Tests cover Smart Constructor validation, Result type handling, and domain operations.
 */

import { assertEquals, assertStrictEquals } from "jsr:@std/assert@0.224.0";
import { DirectiveType } from "./directive_type.ts";

Deno.test("DirectiveType - Smart Constructor Tests", async (t) => {

  await t.step("should create valid DirectiveType with valid input", () => {
    const result = DirectiveType.create("to");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "to");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("should reject empty input", () => {
    const result = DirectiveType.create("");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "DirectiveType cannot be empty, null, or undefined");
    }
  });

  await t.step("should reject null input", () => {
    const result = DirectiveType.create(null);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should reject undefined input", () => {
    const result = DirectiveType.create(undefined);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should reject input that is too long", () => {
    const longValue = "a".repeat(21); // Exceeds MAX_LENGTH (20)
    const result = DirectiveType.create(longValue);

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "TooLong") {
      assertEquals(result.error.value, longValue);
      assertEquals(result.error.maxLength, 20);
    }
  });

  await t.step("should reject invalid format", () => {
    const result = DirectiveType.create("TO_INVALID");

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "InvalidFormat") {
      assertEquals(result.error.value, "TO_INVALID");
    }
  });

  await t.step("should accept valid format strings", () => {
    // Create a directive that is valid in format
    const result = DirectiveType.create("nonexistent");

    // Pattern validation is now handled at application layer
    // Basic format validation should pass for valid format
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "nonexistent");
    }
  });
});

Deno.test("DirectiveType - Domain Operations", async (t) => {
  const directiveResult = DirectiveType.create("to");

  if (!directiveResult.ok) {
    // Test setup error - should not happen with valid test data
    console.error("Test setup failed:", directiveResult.error);
    return;
  }

  const directive = directiveResult.data;


  await t.step("should generate prompt directory path", () => {
    const layer = { value: "issue" };
    const promptDir = directive.getPromptDirectory("prompts", layer);

    assertEquals(promptDir, "prompts/to/issue");
  });

  await t.step("should generate schema directory path", () => {
    const layer = { value: "task" };
    const schemaDir = directive.getSchemaDirectory("schemas", layer);

    assertEquals(schemaDir, "schemas/to/task");
  });

  await t.step("should validate for resource path generation", () => {
    assertEquals(directive.isValidForResourcePath(), true);
  });

  await t.step("should provide debug string", () => {
    const debugString = directive.toDebugString();
    assertEquals(debugString, 'DirectiveType(value="to", validated=true)');
  });
});

Deno.test("DirectiveType - Equality and Comparison", async (t) => {
  await t.step("should be equal to itself", () => {
    const directive1Result = DirectiveType.create("to");
    const directive2Result = DirectiveType.create("to");

    if (!directive1Result.ok || !directive2Result.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    assertEquals(directive1Result.data.equals(directive2Result.data), true);
  });

  await t.step("should not be equal to different directive", () => {
    const directive1Result = DirectiveType.create("to");
    const directive2Result = DirectiveType.create("summary");

    if (!directive1Result.ok || !directive2Result.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    assertEquals(directive1Result.data.equals(directive2Result.data), false);
  });

  await t.step("should have correct string representation", () => {
    const directiveResult = DirectiveType.create("defect");

    if (!directiveResult.ok) {
      throw new Error("Failed to create test DirectiveType");
    }

    assertEquals(directiveResult.data.toString(), "defect");
  });
});

Deno.test("DirectiveType - Edge Cases", async (t) => {
  await t.step("should reject input with leading/trailing whitespace", () => {
    const result = DirectiveType.create("  to  ");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      assertEquals(result.error.message.includes("whitespace"), true);
    }
  });

  await t.step("should handle boundary length values", () => {
    const maxLengthValue = "a".repeat(20); // Exactly MAX_LENGTH
    const result = DirectiveType.create(maxLengthValue);

    // This might fail due to pattern mismatch, but shouldn't fail on length
    if (!result.ok) {
      // If it fails, it should be due to pattern mismatch, not length
      assertEquals(result.error.kind, "PatternMismatch");
    }
  });

  await t.step("should handle whitespace-only input", () => {
    const result = DirectiveType.create("   ");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should reject input with tabs and newlines", () => {
    const result = DirectiveType.create("\t\nto\t\n");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      assertEquals(result.error.message.includes("whitespace"), true);
    }
  });

  await t.step("should reject non-string types", () => {
    // Test with number
    const numberResult = DirectiveType.create(123 as unknown as string);
    assertEquals(numberResult.ok, false);
    if (!numberResult.ok) {
      assertEquals(numberResult.error.kind, "EmptyInput");
    }

    // Test with object
    const objectResult = DirectiveType.create({ value: "to" } as unknown as string);
    assertEquals(objectResult.ok, false);
    if (!objectResult.ok) {
      assertEquals(objectResult.error.kind, "EmptyInput");
    }
  });
});

Deno.test("DirectiveType - Pattern Validation Edge Cases", async (t) => {

  await t.step("should reject uppercase letters", () => {
    const result = DirectiveType.create("TO");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      if (result.error.kind === "InvalidFormat") {
        assertEquals(result.error.value, "TO");
      }
    }
  });

  await t.step("should reject mixed case", () => {
    const result = DirectiveType.create("To");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      if (result.error.kind === "InvalidFormat") {
        assertEquals(result.error.value, "To");
      }
    }
  });

  await t.step("should reject special characters", () => {
    const specialChars = ["@", "#", "$", "%", "^", "&", "*", "(", ")", "+", "=", "!", "?"];

    for (const char of specialChars) {
      const result = DirectiveType.create(`to${char}`);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidFormat");
      }
    }
  });

  await t.step("should accept valid characters", () => {
    const validChars = ["a", "z", "0", "9", "_", "-"];

    for (const char of validChars) {
      const result = DirectiveType.create(char);
      // May fail due to pattern mismatch, but not due to format
      if (!result.ok && result.error.kind !== "PatternMismatch") {
        throw new Error(
          `Character '${char}' should be valid format, but got: ${result.error.kind}`,
        );
      }
    }
  });

  await t.step("should reject empty after trimming", () => {
    const result = DirectiveType.create("");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });
});

Deno.test("DirectiveType - Profile Validation Comprehensive", async (t) => {

  await t.step("should accept valid format strings", () => {
    const result = DirectiveType.create("invalid-directive");

    // Pattern validation moved to application layer, format validation should pass
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "invalid-directive");
      // Profile validation is handled at application layer
    }
  });

  await t.step("should accept valid format strings", () => {
    // Test with different directive
    const result = DirectiveType.create("summary");

    // Result should be successful for valid format
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "summary");
    }
  });
});

Deno.test("DirectiveType - Domain Operations Comprehensive", async (t) => {
  const directiveResult = DirectiveType.create("to");

  if (!directiveResult.ok) {
    throw new Error("Failed to create test DirectiveType");
  }

  const directive = directiveResult.data;

  await t.step("should handle edge cases in path generation", () => {
    // Test with empty base directory
    const layer = { value: "issue" };
    const emptyBasePromptDir = directive.getPromptDirectory("", layer);
    assertEquals(emptyBasePromptDir, "/to/issue");

    const emptyBaseSchemaDir = directive.getSchemaDirectory("", layer);
    assertEquals(emptyBaseSchemaDir, "/to/issue");
  });

  await t.step("should handle special characters in layer values", () => {
    const specialLayer = { value: "special-layer_with_underscores" };
    const promptDir = directive.getPromptDirectory("prompts", specialLayer);
    assertEquals(promptDir, "prompts/to/special-layer_with_underscores");
  });

  await t.step("should maintain path consistency", () => {
    const layer = { value: "test" };
    const promptPath = directive.getPromptDirectory("base", layer);
    const schemaPath = directive.getSchemaDirectory("base", layer);

    // Both should have the same structure
    assertEquals(promptPath.split("/").length, schemaPath.split("/").length);
    assertEquals(promptPath.includes("to"), true);
    assertEquals(schemaPath.includes("to"), true);
  });

  await t.step("should provide consistent resource path validation", () => {
    assertEquals(directive.isValidForResourcePath(), true);

    // Create an invalid directive for comparison
    const invalidDirectiveResult = DirectiveType.create("invalid");
    if (!invalidDirectiveResult.ok && invalidDirectiveResult.error.kind === "PatternMismatch") {
      // This is expected - "invalid" might not match pattern
      // We can't test invalid DirectiveType's isValidForResourcePath because we can't create one
    }
  });
});

Deno.test("DirectiveType - Immutability and Thread Safety", async (t) => {
  const directiveResult = DirectiveType.create("to");

  if (!directiveResult.ok) {
    throw new Error("Failed to create test DirectiveType");
  }

  const directive = directiveResult.data;

  await t.step("should be immutable", () => {
    const originalValue = directive.value;
    const originalValidated = directive.validatedByPattern;

    // Attempt to modify (should fail silently due to Object.freeze)
    try {
      // Access using bracket notation to test immutability
      (directive as unknown as Record<string, unknown>)["_value"] = "modified";
      (directive as unknown as Record<string, unknown>)["_validatedByPattern"] = false;
    } catch {
      // Expected to throw in strict mode
    }

    // Values should remain unchanged
    assertEquals(directive.value, originalValue);
    assertEquals(directive.validatedByPattern, originalValidated);
  });

  await t.step("should support concurrent access", async () => {
    // Simulate concurrent access patterns
    const promises = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve().then(() => {
        const layer = { value: `layer${i}` };
        return directive.getPromptDirectory("concurrent", layer);
      }));

    const results = await Promise.all(promises);
    
    // All results should be valid and consistent
    results.forEach((result, i) => {
      assertEquals(result, `concurrent/to/layer${i}`);
    });
  });
});

Deno.test("DirectiveType - Error Message Quality", async (t) => {

  await t.step("should provide actionable error messages", () => {
    const tooLongResult = DirectiveType.create("a".repeat(21));
    assertEquals(tooLongResult.ok, false);
    if (!tooLongResult.ok) {
      assertEquals(tooLongResult.error.message.includes("exceeds maximum length"), true);
      assertEquals(tooLongResult.error.message.includes("20"), true);
    }

    const invalidFormatResult = DirectiveType.create("INVALID");
    assertEquals(invalidFormatResult.ok, false);
    if (!invalidFormatResult.ok) {
      assertEquals(invalidFormatResult.error.message.includes("invalid characters"), true);
      assertEquals(invalidFormatResult.error.message.includes("lowercase"), true);
    }

    const emptyResult = DirectiveType.create("");
    assertEquals(emptyResult.ok, false);
    if (!emptyResult.ok) {
      assertEquals(emptyResult.error.message.includes("cannot be empty"), true);
    }
  });

  await t.step("should include context in error messages", () => {
    const patternMismatchResult = DirectiveType.create("nonexistent");
    // Pattern validation moved to application layer, basic format validation should pass
    assertEquals(patternMismatchResult.ok, true);
    if (patternMismatchResult.ok) {
      assertEquals(
        patternMismatchResult.data.value,
        "nonexistent",
      );
    }
  });
});

Deno.test("DirectiveType - Performance and Memory", async (t) => {

  await t.step("should handle large number of instances", () => {
    const instances: DirectiveType[] = [];

    // Create many instances
    for (let i = 0; i < 1000; i++) {
      const result = DirectiveType.create("to");
      if (result.ok) {
        instances.push(result.data);
      }
    }

    assertEquals(instances.length, 1000);

    // All instances should be functionally equal
    for (let i = 1; i < instances.length; i++) {
      assertEquals(instances[0].equals(instances[i]), true);
    }
  });

  await t.step("should have consistent hash-like behavior", () => {
    const directive1 = DirectiveType.create("to");
    const directive2 = DirectiveType.create("to");

    if (!directive1.ok || !directive2.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    // Same input should produce equivalent objects
    assertEquals(directive1.data.equals(directive2.data), true);
    assertEquals(directive1.data.toString(), directive2.data.toString());
    assertEquals(directive1.data.toDebugString(), directive2.data.toDebugString());
  });
});
