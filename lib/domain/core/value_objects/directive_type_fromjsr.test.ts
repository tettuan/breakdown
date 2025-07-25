/**
 * @fileoverview DirectiveType.fromJSR() method tests
 *
 * Tests for DirectiveType JSR integration functionality.
 * Validates that DirectiveType can be created from BreakdownParams JSR-validated values.
 */

import { assertEquals } from "@std/assert";
import { DirectiveType } from "./directive_type.ts";
import { DEFAULT_SCHEMA_BASE_DIR } from "../../../config/constants.ts";

Deno.test("DirectiveType.fromJSR - Valid JSR-validated values", async (t) => {
  await t.step("Should create DirectiveType from valid JSR string", () => {
    const result = DirectiveType.fromJSR("to");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "to");
      assertEquals(result.data.validatedByPattern, true);
      assertEquals(result.data.source, "BREAKDOWN_PARAMS_VALIDATED");
    }
  });

  await t.step("Should create DirectiveType from 'summary'", () => {
    const result = DirectiveType.fromJSR("summary");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "summary");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("Should create DirectiveType from 'defect'", () => {
    const result = DirectiveType.fromJSR("defect");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "defect");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("Should create DirectiveType with complex JSR-validated values", () => {
    const complexValues = ["to-complex", "summary_detailed", "defect-check"];

    for (const value of complexValues) {
      const result = DirectiveType.fromJSR(value);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.value, value);
        assertEquals(result.data.validatedByPattern, true);
      }
    }
  });
});

Deno.test("DirectiveType.fromJSR - Invalid inputs", async (t) => {
  await t.step("Should fail with non-string input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = DirectiveType.fromJSR(123);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: directiveType must be a string");
    }
  });

  await t.step("Should fail with null input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = DirectiveType.fromJSR(null);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: directiveType must be a string");
    }
  });

  await t.step("Should fail with undefined input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = DirectiveType.fromJSR(undefined);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: directiveType must be a string");
    }
  });
});

Deno.test("DirectiveType.fromJSR - JSR vs create comparison", async (t) => {
  await t.step("fromJSR should bypass validation unlike create()", () => {
    const validValue = "to";

    // Both should succeed for valid values
    const jsrResult = DirectiveType.fromJSR(validValue);
    const createResult = DirectiveType.create(validValue);

    assertEquals(jsrResult.ok, true);
    assertEquals(createResult.ok, true);

    if (jsrResult.ok && createResult.ok) {
      assertEquals(jsrResult.data.value, createResult.data.value);
      assertEquals(jsrResult.data.validatedByPattern, true);
      assertEquals(createResult.data.validatedByPattern, true);
    }
  });

  await t.step("fromJSR should trust JSR validation even for edge cases", () => {
    // This value would normally fail create() due to validation,
    // but fromJSR should trust JSR pre-validation
    const edgeCaseValue = "valid-from-jsr";

    const jsrResult = DirectiveType.fromJSR(edgeCaseValue);
    assertEquals(jsrResult.ok, true);

    if (jsrResult.ok) {
      assertEquals(jsrResult.data.value, edgeCaseValue);
      assertEquals(jsrResult.data.validatedByPattern, true);
    }
  });
});

Deno.test("DirectiveType.fromJSR - Integration with domain operations", async (t) => {
  await t.step("Should work with path generation methods", () => {
    const result = DirectiveType.fromJSR("to");

    assertEquals(result.ok, true);
    if (result.ok) {
      const directive = result.data;

      // Test domain operations work
      assertEquals(directive.isValidForResourcePath(), true);

      const mockLayer = { value: "issue" };
      const promptDir = directive.getPromptDirectory("prompts", mockLayer);
      assertEquals(promptDir, "prompts/to/issue");

      const schemaDir = directive.getSchemaDirectory(DEFAULT_SCHEMA_BASE_DIR, mockLayer);
      assertEquals(schemaDir, `${DEFAULT_SCHEMA_BASE_DIR}/to/issue`);
    }
  });

  await t.step("Should work with equality comparison", () => {
    const result1 = DirectiveType.fromJSR("summary");
    const result2 = DirectiveType.fromJSR("summary");
    const result3 = DirectiveType.fromJSR("defect");

    assertEquals(result1.ok, true);
    assertEquals(result2.ok, true);
    assertEquals(result3.ok, true);

    if (result1.ok && result2.ok && result3.ok) {
      assertEquals(result1.data.equals(result2.data), true);
      assertEquals(result1.data.equals(result3.data), false);
    }
  });
});

Deno.test("DirectiveType.fromJSR - Debug and string representation", async (t) => {
  await t.step("Should provide correct string representation", () => {
    const result = DirectiveType.fromJSR("to");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.toString(), "to");
      assertEquals(result.data.toDebugString(), 'DirectiveType(value="to", validated=true)');
    }
  });
});
