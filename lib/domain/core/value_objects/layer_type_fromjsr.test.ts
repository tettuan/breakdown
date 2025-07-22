/**
 * @fileoverview LayerType.fromJSR() method tests
 *
 * Tests for LayerType JSR integration functionality.
 * Validates that LayerType can be created from BreakdownParams JSR-validated values.
 */

import { assertEquals } from "@std/assert";
import { LayerType } from "./layer_type.ts";

Deno.test("LayerType.fromJSR - Valid JSR-validated values", async (t) => {
  await t.step("Should create LayerType from valid JSR string", () => {
    const result = LayerType.fromJSR("project");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "project");
      assertEquals(result.data.validatedByPattern, true);
      assertEquals(result.data.source, "BREAKDOWN_PARAMS_VALIDATED");
    }
  });

  await t.step("Should create LayerType from 'issue'", () => {
    const result = LayerType.fromJSR("issue");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "issue");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("Should create LayerType from 'task'", () => {
    const result = LayerType.fromJSR("task");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "task");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("Should create LayerType with complex JSR-validated values", () => {
    const complexValues = ["component", "module", "feature-branch", "epic_large"];

    for (const value of complexValues) {
      const result = LayerType.fromJSR(value);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.value, value);
        assertEquals(result.data.validatedByPattern, true);
      }
    }
  });
});

Deno.test("LayerType.fromJSR - Invalid inputs", async (t) => {
  await t.step("Should fail with non-string input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = LayerType.fromJSR(123);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: layerType must be a string");
    }
  });

  await t.step("Should fail with null input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = LayerType.fromJSR(null);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: layerType must be a string");
    }
  });

  await t.step("Should fail with undefined input", () => {
    // @ts-expect-error Testing runtime type checking
    const result = LayerType.fromJSR(undefined);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyInput");
      assertEquals(result.error.message, "Invalid JSR value: layerType must be a string");
    }
  });
});

Deno.test("LayerType.fromJSR - JSR vs create comparison", async (t) => {
  await t.step("fromJSR should bypass validation unlike create()", () => {
    const validValue = "project";

    // Both should succeed for valid values
    const jsrResult = LayerType.fromJSR(validValue);
    const createResult = LayerType.create(validValue);

    assertEquals(jsrResult.ok, true);
    assertEquals(createResult.ok, true);

    if (jsrResult.ok && createResult.ok) {
      assertEquals(jsrResult.data.value, createResult.data.value);
      assertEquals(jsrResult.data.validatedByPattern, true);
      assertEquals(createResult.data.validatedByPattern, true);
    }
  });

  await t.step("fromJSR should trust JSR validation even for edge cases", () => {
    // This value would be trusted by fromJSR since it's from JSR
    const edgeCaseValue = "valid-from-jsr-layer";

    const jsrResult = LayerType.fromJSR(edgeCaseValue);
    assertEquals(jsrResult.ok, true);

    if (jsrResult.ok) {
      assertEquals(jsrResult.data.value, edgeCaseValue);
      assertEquals(jsrResult.data.validatedByPattern, true);
    }
  });
});

Deno.test("LayerType.fromJSR - Integration with domain operations", async (t) => {
  await t.step("Should work with file name generation methods", () => {
    const result = LayerType.fromJSR("issue");

    assertEquals(result.ok, true);
    if (result.ok) {
      const layer = result.data;

      // Test domain operations work
      assertEquals(layer.isValidForResourcePath(), true);
      assertEquals(layer.getCanonicalLayerName(), "issue");

      // Test filename generation
      const promptFilename = layer.getPromptFilename("project");
      assertEquals(promptFilename, "f_project.md");

      const schemaFilename = layer.getSchemaFilename();
      assertEquals(schemaFilename, "issue.json");
    }
  });

  await t.step("Should work with DirectiveType compatibility", () => {
    const result = LayerType.fromJSR("task");

    assertEquals(result.ok, true);
    if (result.ok) {
      const layer = result.data;
      const mockDirective = { value: "to" };

      assertEquals(layer.isValidForDirective(mockDirective), true);
    }
  });

  await t.step("Should work with equality comparison", () => {
    const result1 = LayerType.fromJSR("project");
    const result2 = LayerType.fromJSR("project");
    const result3 = LayerType.fromJSR("issue");

    assertEquals(result1.ok, true);
    assertEquals(result2.ok, true);
    assertEquals(result3.ok, true);

    if (result1.ok && result2.ok && result3.ok) {
      assertEquals(result1.data.equals(result2.data), true);
      assertEquals(result1.data.equals(result3.data), false);
    }
  });
});

Deno.test("LayerType.fromJSR - Debug and string representation", async (t) => {
  await t.step("Should provide correct string representation", () => {
    const result = LayerType.fromJSR("task");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.toString(), "task");
      assertEquals(result.data.toDebugString(), 'LayerType(value="task", validated=true)');
    }
  });
});

Deno.test("LayerType.fromJSR - Configuration independence", async (t) => {
  await t.step("Should create LayerType without configuration dependency", () => {
    // fromJSR should work without requiring configuration
    // since it trusts JSR pre-validation
    const result = LayerType.fromJSR("custom-layer-type");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, "custom-layer-type");
      assertEquals(result.data.validatedByPattern, true);
    }
  });

  await t.step("Should bypass pattern matching requirements", () => {
    // Values that might not be in configuration should still work
    // because JSR has already validated them
    const specialValues = ["edge-case", "non_standard", "special123"];

    for (const value of specialValues) {
      const result = LayerType.fromJSR(value);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.value, value);
        assertEquals(result.data.validatedByPattern, true);
      }
    }
  });
});
