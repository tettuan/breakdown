/**
 * @fileoverview DirectiveType and LayerType Consistency Tests
 *
 * Test suite to verify consistency between DirectiveType and LayerType implementations.
 * This ensures both Value Objects follow the same design patterns and validation approaches.
 */

import { assertEquals } from "jsr:@std/assert";
import { DirectiveType } from "./directive_type.ts";
import { LayerType } from "./layer_type.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";

Deno.test("DirectiveType and LayerType - Smart Constructor Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should handle null inputs consistently", () => {
    const directiveResult = DirectiveType.create(null, defaultProfile);
    const layerResult = LayerType.create(null);

    assertEquals(directiveResult.ok, false);
    assertEquals(layerResult.ok, false);

    if (!directiveResult.ok && !layerResult.ok) {
      assertEquals(directiveResult.error.kind, "EmptyInput");
      assertEquals(layerResult.error.kind, "EmptyInput");
    }
  });

  await t.step("should handle undefined inputs consistently", () => {
    const directiveResult = DirectiveType.create(undefined, defaultProfile);
    const layerResult = LayerType.create(undefined);

    assertEquals(directiveResult.ok, false);
    assertEquals(layerResult.ok, false);

    if (!directiveResult.ok && !layerResult.ok) {
      assertEquals(directiveResult.error.kind, "EmptyInput");
      assertEquals(layerResult.error.kind, "EmptyInput");
    }
  });

  await t.step("should handle empty string inputs consistently", () => {
    const directiveResult = DirectiveType.create("", defaultProfile);
    const layerResult = LayerType.create("");

    assertEquals(directiveResult.ok, false);
    assertEquals(layerResult.ok, false);

    if (!directiveResult.ok && !layerResult.ok) {
      assertEquals(directiveResult.error.kind, "EmptyInput");
      assertEquals(layerResult.error.kind, "EmptyInput");
    }
  });

  await t.step("should handle whitespace-only inputs consistently", () => {
    const directiveResult = DirectiveType.create("   ", defaultProfile);
    const layerResult = LayerType.create("   ");

    assertEquals(directiveResult.ok, false);
    assertEquals(layerResult.ok, false);

    if (!directiveResult.ok && !layerResult.ok) {
      assertEquals(directiveResult.error.kind, "EmptyInput");
      assertEquals(layerResult.error.kind, "EmptyInput");
    }
  });
});

Deno.test("DirectiveType and LayerType - Pattern Validation Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should reject uppercase letters consistently", () => {
    const directiveResult = DirectiveType.create("UPPERCASE", defaultProfile);
    const layerResult = LayerType.create("UPPERCASE");

    assertEquals(directiveResult.ok, false);
    assertEquals(layerResult.ok, false);

    if (!directiveResult.ok && !layerResult.ok) {
      // DirectiveType might fail on InvalidFormat or PatternMismatch
      // LayerType should fail on InvalidFormat
      assertEquals(layerResult.error.kind, "InvalidFormat");
      assertEquals(
        directiveResult.error.kind === "InvalidFormat" ||
          directiveResult.error.kind === "PatternMismatch",
        true,
      );
    }
  });

  await t.step("should reject special characters consistently", () => {
    const specialChars = ["@", "#", "$", "%", "^", "&", "*", "(", ")"];

    for (const char of specialChars) {
      const testValue = `test${char}`;
      const directiveResult = DirectiveType.create(testValue, defaultProfile);
      const layerResult = LayerType.create(testValue);

      assertEquals(directiveResult.ok, false, `DirectiveType should reject '${testValue}'`);
      assertEquals(layerResult.ok, false, `LayerType should reject '${testValue}'`);

      if (!directiveResult.ok && !layerResult.ok) {
        assertEquals(layerResult.error.kind, "InvalidFormat");
        assertEquals(
          directiveResult.error.kind === "InvalidFormat" ||
            directiveResult.error.kind === "PatternMismatch",
          true,
        );
      }
    }
  });

  await t.step("should accept valid characters consistently", () => {
    const validChars = ["a", "z", "0", "9", "_", "-"];

    for (const char of validChars) {
      const directiveResult = DirectiveType.create(char, defaultProfile);
      const layerResult = LayerType.create(char);

      // LayerType should always accept valid characters
      assertEquals(layerResult.ok, true, `LayerType should accept '${char}'`);

      // DirectiveType might fail due to profile mismatch, but not format
      if (!directiveResult.ok && directiveResult.error.kind !== "PatternMismatch") {
        throw new Error(
          `DirectiveType should not fail on format for '${char}', but got: ${directiveResult.error.kind}`,
        );
      }
    }
  });
});

Deno.test("DirectiveType and LayerType - Length Validation Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should have different but reasonable length limits", () => {
    // DirectiveType has MAX_LENGTH = 20
    // LayerType has MAX_LENGTH = 30

    const directiveLimit = 20;
    const layerLimit = 30;

    // Test at directive limit
    const directiveLimitValue = "a".repeat(directiveLimit);
    const directiveLimitResult = DirectiveType.create(directiveLimitValue, defaultProfile);

    // Should not fail on length (might fail on pattern mismatch)
    if (!directiveLimitResult.ok) {
      assertEquals(directiveLimitResult.error.kind, "PatternMismatch");
    }

    // Test at layer limit
    const layerLimitValue = "a".repeat(layerLimit);
    const layerLimitResult = LayerType.create(layerLimitValue);

    assertEquals(layerLimitResult.ok, true);

    // Test exceeding directive limit
    const exceedsDirectiveLimit = "a".repeat(directiveLimit + 1);
    const exceedsDirectiveResult = DirectiveType.create(exceedsDirectiveLimit, defaultProfile);

    assertEquals(exceedsDirectiveResult.ok, false);
    if (!exceedsDirectiveResult.ok) {
      assertEquals(exceedsDirectiveResult.error.kind, "TooLong");
    }

    // Test exceeding layer limit
    const exceedsLayerLimit = "a".repeat(layerLimit + 1);
    const exceedsLayerResult = LayerType.create(exceedsLayerLimit);

    assertEquals(exceedsLayerResult.ok, false);
    if (!exceedsLayerResult.ok) {
      assertEquals(exceedsLayerResult.error.kind, "TooLong");
    }
  });
});

Deno.test("DirectiveType and LayerType - Error Message Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should provide consistent error structure", () => {
    const directiveError = DirectiveType.create("", defaultProfile);
    const layerError = LayerType.create("");

    assertEquals(directiveError.ok, false);
    assertEquals(layerError.ok, false);

    if (!directiveError.ok && !layerError.ok) {
      // Both should have the same error structure for EmptyInput
      assertEquals(directiveError.error.kind, "EmptyInput");
      assertEquals(layerError.error.kind, "EmptyInput");
      assertEquals(typeof directiveError.error.message, "string");
      assertEquals(typeof layerError.error.message, "string");
    }
  });

  await t.step("should provide consistent error information for length violations", () => {
    const tooLongDirective = DirectiveType.create("a".repeat(21), defaultProfile);
    const tooLongLayer = LayerType.create("a".repeat(31));

    assertEquals(tooLongDirective.ok, false);
    assertEquals(tooLongLayer.ok, false);

    if (!tooLongDirective.ok && !tooLongLayer.ok) {
      assertEquals(tooLongDirective.error.kind, "TooLong");
      assertEquals(tooLongLayer.error.kind, "TooLong");

      // Both should include the problematic value and max length
      if (tooLongDirective.error.kind === "TooLong" && tooLongLayer.error.kind === "TooLong") {
        assertEquals(typeof tooLongDirective.error.value, "string");
        assertEquals(typeof tooLongLayer.error.value, "string");
        assertEquals(typeof tooLongDirective.error.maxLength, "number");
        assertEquals(typeof tooLongLayer.error.maxLength, "number");
        assertEquals(tooLongDirective.error.maxLength, 20);
        assertEquals(tooLongLayer.error.maxLength, 30);
      }
    }
  });
});

Deno.test("DirectiveType and LayerType - Immutability Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should both be immutable after creation", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("task");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    // Store original values
    const originalDirectiveValue = directive.value;
    const originalLayerValue = layer.value;

    // Attempt to modify (should fail silently)
    try {
      // deno-lint-ignore no-explicit-any
      (directive as any)._value = "modified";
      // deno-lint-ignore no-explicit-any
      (layer as any)._value = "modified";
    } catch {
      // Expected to throw in strict mode
    }

    // Values should remain unchanged
    assertEquals(directive.value, originalDirectiveValue);
    assertEquals(layer.value, originalLayerValue);
  });
});

Deno.test("DirectiveType and LayerType - String Representation Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should provide consistent toString behavior", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("task");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    // toString should return the raw value
    assertEquals(directive.toString(), "to");
    assertEquals(layer.toString(), "task");

    // toString should be the same as value accessor
    assertEquals(directive.toString(), directive.value);
    assertEquals(layer.toString(), layer.value);
  });

  await t.step("should provide consistent debug string format", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("task");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    const directiveDebug = directive.toDebugString();
    const layerDebug = layer.toDebugString();

    // Both should include the class name and value
    assertEquals(directiveDebug.includes("DirectiveType"), true);
    assertEquals(directiveDebug.includes("to"), true);
    assertEquals(layerDebug.includes("LayerType"), true);
    assertEquals(layerDebug.includes("task"), true);

    // Both should include validation status
    assertEquals(directiveDebug.includes("validated"), true);
    assertEquals(layerDebug.includes("validated"), true);
  });
});

Deno.test("DirectiveType and LayerType - Equality Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should have consistent equality behavior", () => {
    const directive1 = DirectiveType.create("to", defaultProfile);
    const directive2 = DirectiveType.create("to", defaultProfile);
    const layer1 = LayerType.create("task");
    const layer2 = LayerType.create("task");

    if (!directive1.ok || !directive2.ok || !layer1.ok || !layer2.ok) {
      throw new Error("Failed to create test objects");
    }

    // Same values should be equal
    assertEquals(directive1.data.equals(directive2.data), true);
    assertEquals(layer1.data.equals(layer2.data), true);

    // Different instances of same value should still be equal
    const directive3 = DirectiveType.create("to", defaultProfile);
    const layer3 = LayerType.create("task");

    if (!directive3.ok || !layer3.ok) {
      throw new Error("Failed to create test objects");
    }

    assertEquals(directive1.data.equals(directive3.data), true);
    assertEquals(layer1.data.equals(layer3.data), true);
  });

  await t.step("should reject equality with different values", () => {
    const directive1 = DirectiveType.create("to", defaultProfile);
    const directive2 = DirectiveType.create("summary", defaultProfile);
    const layer1 = LayerType.create("task");
    const layer2 = LayerType.create("issue");

    if (!directive1.ok || !directive2.ok || !layer1.ok || !layer2.ok) {
      throw new Error("Failed to create test objects");
    }

    // Different values should not be equal
    assertEquals(directive1.data.equals(directive2.data), false);
    assertEquals(layer1.data.equals(layer2.data), false);
  });
});

Deno.test("DirectiveType and LayerType - Path Generation Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should generate consistent path structures", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("issue");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    // Test path generation consistency
    const promptDir = directive.getPromptDirectory("prompts", layer);
    const schemaDir = directive.getSchemaDirectory("schemas", layer);

    // Both should include directive and layer values
    assertEquals(promptDir.includes("to"), true);
    assertEquals(promptDir.includes("issue"), true);
    assertEquals(schemaDir.includes("to"), true);
    assertEquals(schemaDir.includes("issue"), true);

    // Both should have consistent structure
    assertEquals(promptDir, "prompts/to/issue");
    assertEquals(schemaDir, "schemas/to/issue");
  });

  await t.step("should handle empty base directories consistently", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("issue");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    const promptDir = directive.getPromptDirectory("", layer);
    const schemaDir = directive.getSchemaDirectory("", layer);

    // Should handle empty base directory gracefully
    assertEquals(promptDir, "/to/issue");
    assertEquals(schemaDir, "/to/issue");
  });
});

Deno.test("DirectiveType and LayerType - Resource Path Validation Consistency", async (t) => {
  const defaultProfile = ConfigProfileName.createDefault();

  await t.step("should provide consistent resource path validation", () => {
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("task");

    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test objects");
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

    // Both should be valid for resource path generation
    assertEquals(directive.isValidForResourcePath(), true);
    assertEquals(layer.isValidForResourcePath(), true);

    // Both should depend on validation status
    assertEquals(directive.validatedByPattern, true);
    assertEquals(layer.validatedByPattern, true);
  });
});
