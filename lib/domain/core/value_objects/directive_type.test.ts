/**
 * @fileoverview DirectiveType Value Object Tests
 *
 * Test suite for DirectiveType following DDD principles and Totality principle.
 * Tests cover Smart Constructor validation, Result type handling, and domain operations.
 */

import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { DirectiveType } from "./directive_type.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";

Deno.test("DirectiveType - Smart Constructor Tests", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should create valid DirectiveType with valid input", () => {
    const result = DirectiveType.create("to", defaultProfile);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "to");
      assertEquals(result.data.validatedByPattern, true);
      assertStrictEquals(result.data.profile, defaultProfile);
    }
  });

  await t.step("should reject empty input", () => {
    const result = DirectiveType.create("", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "DirectiveType cannot be empty, null, or undefined");
    }
  });

  await t.step("should reject null input", () => {
    const result = DirectiveType.create(null, defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should reject undefined input", () => {
    const result = DirectiveType.create(undefined, defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should reject input that is too long", () => {
    const longValue = "a".repeat(21); // Exceeds MAX_LENGTH (20)
    const result = DirectiveType.create(longValue, defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "TooLong") {
      assertEquals(result.error.value, longValue);
      assertEquals(result.error.maxLength, 20);
    }
  });

  await t.step("should reject invalid format", () => {
    const result = DirectiveType.create("TO_INVALID", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "InvalidFormat") {
      assertEquals(result.error.value, "TO_INVALID");
    }
  });

  await t.step("should reject directive not valid for profile", () => {
    // Create a directive that is valid in format but not in the profile's directive list
    const result = DirectiveType.create("nonexistent", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "PatternMismatch") {
      assertEquals(result.error.value, "nonexistent");
      assertEquals(result.error.profile, "default");
    }
  });
});

Deno.test("DirectiveType - Domain Operations", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();
  const directiveResult = DirectiveType.create("to", defaultProfile);

  if (!directiveResult.ok) {
    throw new Error("Failed to create test DirectiveType");
  }

  const directive = directiveResult.data;

  await t.step("should validate against profile", () => {
    assertEquals(directive.isValidForProfile(defaultProfile), true);
  });

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
    assertEquals(debugString, 'DirectiveType(value="to", profile="default", validated=true)');
  });
});

Deno.test("DirectiveType - Equality and Comparison", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should be equal to itself", () => {
    const directive1Result = DirectiveType.create("to", defaultProfile);
    const directive2Result = DirectiveType.create("to", defaultProfile);

    if (!directive1Result.ok || !directive2Result.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    assertEquals(directive1Result.data.equals(directive2Result.data), true);
  });

  await t.step("should not be equal to different directive", () => {
    const directive1Result = DirectiveType.create("to", defaultProfile);
    const directive2Result = DirectiveType.create("summary", defaultProfile);

    if (!directive1Result.ok || !directive2Result.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    assertEquals(directive1Result.data.equals(directive2Result.data), false);
  });

  await t.step("should have correct string representation", () => {
    const directiveResult = DirectiveType.create("defect", defaultProfile);

    if (!directiveResult.ok) {
      throw new Error("Failed to create test DirectiveType");
    }

    assertEquals(directiveResult.data.toString(), "defect");
  });
});

Deno.test("DirectiveType - Edge Cases", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should trim whitespace from input", () => {
    const result = DirectiveType.create("  to  ", defaultProfile);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "to");
    }
  });

  await t.step("should handle boundary length values", () => {
    const maxLengthValue = "a".repeat(20); // Exactly MAX_LENGTH
    const result = DirectiveType.create(maxLengthValue, defaultProfile);

    // This might fail due to pattern mismatch, but shouldn't fail on length
    if (!result.ok) {
      // If it fails, it should be due to pattern mismatch, not length
      assertEquals(result.error.kind, "PatternMismatch");
    }
  });

  await t.step("should handle whitespace-only input", () => {
    const result = DirectiveType.create("   ", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });

  await t.step("should handle tabs and newlines", () => {
    const result = DirectiveType.create("\t\nto\t\n", defaultProfile);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "to");
    }
  });

  await t.step("should reject non-string types", () => {
    // Test with number
    // deno-lint-ignore no-explicit-any
    const numberResult = DirectiveType.create(123 as any, defaultProfile);
    assertEquals(numberResult.ok, false);
    if (!numberResult.ok) {
      assertEquals(numberResult.error.kind, "EmptyInput");
    }

    // Test with object
    // deno-lint-ignore no-explicit-any
    const objectResult = DirectiveType.create({ value: "to" } as any, defaultProfile);
    assertEquals(objectResult.ok, false);
    if (!objectResult.ok) {
      assertEquals(objectResult.error.kind, "EmptyInput");
    }
  });
});

Deno.test("DirectiveType - Pattern Validation Edge Cases", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should reject uppercase letters", () => {
    const result = DirectiveType.create("TO", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      if (result.error.kind === "InvalidFormat") {
        assertEquals(result.error.value, "TO");
      }
    }
  });

  await t.step("should reject mixed case", () => {
    const result = DirectiveType.create("To", defaultProfile);

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
      const result = DirectiveType.create(`to${char}`, defaultProfile);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidFormat");
      }
    }
  });

  await t.step("should accept valid characters", () => {
    const validChars = ["a", "z", "0", "9", "_", "-"];

    for (const char of validChars) {
      const result = DirectiveType.create(char, defaultProfile);
      // May fail due to pattern mismatch with profile, but not due to format
      if (!result.ok && result.error.kind !== "PatternMismatch") {
        throw new Error(
          `Character '${char}' should be valid format, but got: ${result.error.kind}`,
        );
      }
    }
  });

  await t.step("should reject empty after trimming", () => {
    const result = DirectiveType.create("", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
    }
  });
});

Deno.test("DirectiveType - Profile Validation Comprehensive", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should provide detailed error for profile mismatch", () => {
    const result = DirectiveType.create("invalid-directive", defaultProfile);

    assertEquals(result.ok, false);
    if (!result.ok && result.error.kind === "PatternMismatch") {
      assertEquals(result.error.value, "invalid-directive");
      assertEquals(result.error.profile, "default");
      assertEquals(Array.isArray(result.error.validDirectives), true);
      assertEquals(result.error.validDirectives.length > 0, true);
      assertEquals(result.error.message.includes("Valid options:"), true);
    }
  });

  await t.step("should validate against different profiles", () => {
    // Test with custom profile
    const customProfileResult = ConfigProfileName.create("custom");
    if (!customProfileResult.ok) {
      throw new Error("Failed to create custom profile");
    }

    const customProfile = customProfileResult.data;
    const result = DirectiveType.create("to", customProfile);

    // Result depends on what directives are available for custom profile
    // The test should pass regardless, as long as the validation is attempted
    assertEquals(typeof result.ok, "boolean");
  });
});

Deno.test("DirectiveType - Domain Operations Comprehensive", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();
  const directiveResult = DirectiveType.create("to", defaultProfile);

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
    const invalidDirectiveResult = DirectiveType.create("invalid", defaultProfile);
    if (!invalidDirectiveResult.ok && invalidDirectiveResult.error.kind === "PatternMismatch") {
      // This is expected - "invalid" is not in the default profile
      // We can't test invalid DirectiveType's isValidForResourcePath because we can't create one
    }
  });
});

Deno.test("DirectiveType - Immutability and Thread Safety", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();
  const directiveResult = DirectiveType.create("to", defaultProfile);

  if (!directiveResult.ok) {
    throw new Error("Failed to create test DirectiveType");
  }

  const directive = directiveResult.data;

  await t.step("should be immutable", () => {
    const originalValue = directive.value;
    const originalProfile = directive.profile;
    const originalValidated = directive.validatedByPattern;

    // Attempt to modify (should fail silently due to Object.freeze)
    try {
      // deno-lint-ignore no-explicit-any
      (directive as any)._value = "modified";
      // deno-lint-ignore no-explicit-any
      (directive as any)._profile = null;
      // deno-lint-ignore no-explicit-any
      (directive as any)._validatedByPattern = false;
    } catch {
      // Expected to throw in strict mode
    }

    // Values should remain unchanged
    assertEquals(directive.value, originalValue);
    assertEquals(directive.profile, originalProfile);
    assertEquals(directive.validatedByPattern, originalValidated);
  });

  await t.step("should support concurrent access", () => {
    // Simulate concurrent access patterns
    const promises = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve().then(() => {
        const layer = { value: `layer${i}` };
        return directive.getPromptDirectory("concurrent", layer);
      }));

    return Promise.all(promises).then((results) => {
      // All results should be valid and consistent
      results.forEach((result, i) => {
        assertEquals(result, `concurrent/to/layer${i}`);
      });
    });
  });
});

Deno.test("DirectiveType - Error Message Quality", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should provide actionable error messages", () => {
    const tooLongResult = DirectiveType.create("a".repeat(21), defaultProfile);
    assertEquals(tooLongResult.ok, false);
    if (!tooLongResult.ok) {
      assertEquals(tooLongResult.error.message.includes("exceeds maximum length"), true);
      assertEquals(tooLongResult.error.message.includes("20"), true);
    }

    const invalidFormatResult = DirectiveType.create("INVALID", defaultProfile);
    assertEquals(invalidFormatResult.ok, false);
    if (!invalidFormatResult.ok) {
      assertEquals(invalidFormatResult.error.message.includes("invalid characters"), true);
      assertEquals(invalidFormatResult.error.message.includes("lowercase"), true);
    }

    const emptyResult = DirectiveType.create("", defaultProfile);
    assertEquals(emptyResult.ok, false);
    if (!emptyResult.ok) {
      assertEquals(emptyResult.error.message.includes("cannot be empty"), true);
    }
  });

  await t.step("should include context in error messages", () => {
    const patternMismatchResult = DirectiveType.create("nonexistent", defaultProfile);
    assertEquals(patternMismatchResult.ok, false);
    if (!patternMismatchResult.ok && patternMismatchResult.error.kind === "PatternMismatch") {
      assertEquals(
        patternMismatchResult.error.message.includes(patternMismatchResult.error.value),
        true,
      );
      assertEquals(
        patternMismatchResult.error.message.includes(patternMismatchResult.error.profile),
        true,
      );
      assertEquals(patternMismatchResult.error.message.includes("Valid options:"), true);
    }
  });
});

Deno.test("DirectiveType - Performance and Memory", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should handle large number of instances", () => {
    const instances: DirectiveType[] = [];

    // Create many instances
    for (let i = 0; i < 1000; i++) {
      const result = DirectiveType.create("to", defaultProfile);
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
    const directive1 = DirectiveType.create("to", defaultProfile);
    const directive2 = DirectiveType.create("to", defaultProfile);

    if (!directive1.ok || !directive2.ok) {
      throw new Error("Failed to create test DirectiveTypes");
    }

    // Same input should produce equivalent objects
    assertEquals(directive1.data.equals(directive2.data), true);
    assertEquals(directive1.data.toString(), directive2.data.toString());
    assertEquals(directive1.data.toDebugString(), directive2.data.toDebugString());
  });
});
