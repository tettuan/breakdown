/**
 * @fileoverview Enhanced LayerType Features Test
 *
 * Tests for the new enhanced features of LayerType:
 * - readonly validatedByPattern property
 * - パス解決メソッド群
 * - isValidForDirective検証メソッド
 */

import { assertEquals, assertExists } from "@std/assert";
import { LayerType, TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test data
const mockTwoParamsResult: TwoParams_Result = {
  type: "two",
  demonstrativeType: "to",
  layerType: "project",
  options: {},
  params: ["to", "project"],
};

const mockTaskResult: TwoParams_Result = {
  type: "two",
  demonstrativeType: "to",
  layerType: "task",
  options: {},
  params: ["to", "task"],
};

const mockBugsResult: TwoParams_Result = {
  type: "two",
  demonstrativeType: "defect",
  layerType: "bugs",
  options: {},
  params: ["defect", "bugs"],
};

Deno.test("LayerType Enhanced Features - validatedByPattern property", async (t) => {
  await t.step("should store and return the pattern used for validation", () => {
    const pattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");
    assertExists(pattern);

    const layerType = LayerType.create(mockTwoParamsResult, pattern);

    assertEquals(layerType.validatedByPattern, pattern);
    assertEquals(layerType.validatedByPattern?.getPattern(), "^(project|issue|task)$");
  });

  await t.step("should return undefined when no pattern was used", () => {
    const layerType = LayerType.create(mockTwoParamsResult);

    assertEquals(layerType.validatedByPattern, undefined);
  });

  await t.step("should work with createOrError method", () => {
    const pattern = TwoParamsLayerTypePattern.create("^(project|issue|task|bugs)$");
    assertExists(pattern);

    const result = LayerType.createOrError(mockTwoParamsResult, pattern);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.validatedByPattern, pattern);
    }
  });
});

Deno.test("LayerType Enhanced Features - Path Resolution Methods", async (t) => {
  const layerType = LayerType.create(mockTwoParamsResult);

  await t.step("resolvePromptTemplatePath should generate correct paths", () => {
    const path = layerType.resolvePromptTemplatePath("to");
    assertEquals(path, "prompts/to/project.md");

    const customPath = layerType.resolvePromptTemplatePath("summary", "templates");
    assertEquals(customPath, "templates/summary/project.md");
  });

  await t.step("resolveSchemaPath should generate correct paths", () => {
    const path = layerType.resolveSchemaPath("to");
    assertEquals(path, "schema/to-project.json");

    const customPath = layerType.resolveSchemaPath("summary", "schemas");
    assertEquals(customPath, "schemas/summary-project.json");
  });

  await t.step("resolveOutputPath should generate correct paths with timestamp", () => {
    const path = layerType.resolveOutputPath("to");

    // Check the pattern (contains timestamp)
    const today = new Date().toISOString().slice(0, 10);
    assertEquals(path, `output/to-project-${today}.md`);
  });

  await t.step("resolveOutputPath should support custom extension and base dir", () => {
    const path = layerType.resolveOutputPath("to", ".json", "results");

    const today = new Date().toISOString().slice(0, 10);
    assertEquals(path, `results/to-project-${today}.json`);
  });

  await t.step("resolveConfigPath should generate correct config paths", () => {
    const appPath = layerType.resolveConfigPath("app");
    assertEquals(appPath, "config/default-app.yml");

    const userPath = layerType.resolveConfigPath("user", "production");
    assertEquals(userPath, "config/production-user.yml");

    const customPath = layerType.resolveConfigPath("app", "staging", "settings");
    assertEquals(customPath, "settings/staging-app.yml");
  });
});

Deno.test("LayerType Enhanced Features - isValidForDirective validation", async (t) => {
  const projectLayer = LayerType.create(mockTwoParamsResult);
  const taskLayer = LayerType.create(mockTaskResult);
  const bugsLayer = LayerType.create(mockBugsResult);

  await t.step("should validate default combinations correctly", () => {
    // Valid combinations
    assertEquals(projectLayer.isValidForDirective("to"), true);
    assertEquals(projectLayer.isValidForDirective("summary"), true);
    assertEquals(projectLayer.isValidForDirective("analysis"), true);

    assertEquals(taskLayer.isValidForDirective("to"), true);
    assertEquals(taskLayer.isValidForDirective("summary"), true);
    assertEquals(taskLayer.isValidForDirective("defect"), true);

    assertEquals(bugsLayer.isValidForDirective("defect"), true);
    assertEquals(bugsLayer.isValidForDirective("to"), true);

    // Invalid combinations
    assertEquals(projectLayer.isValidForDirective("defect"), false);
    assertEquals(bugsLayer.isValidForDirective("analysis"), false);
  });

  await t.step("should allow undefined DirectiveTypes", () => {
    assertEquals(projectLayer.isValidForDirective("unknown"), true);
    assertEquals(taskLayer.isValidForDirective("custom"), true);
  });

  await t.step("should support custom validation rules", () => {
    const customRules = {
      "custom": ["task", "bugs"],
      "special": ["project"],
    };

    assertEquals(taskLayer.isValidForDirective("custom", customRules), true);
    assertEquals(projectLayer.isValidForDirective("custom", customRules), false);
    assertEquals(projectLayer.isValidForDirective("special", customRules), true);
    assertEquals(taskLayer.isValidForDirective("special", customRules), false);
  });
});

Deno.test("LayerType Enhanced Features - isValidForDirectiveOrError validation", async (t) => {
  const projectLayer = LayerType.create(mockTwoParamsResult);
  const taskLayer = LayerType.create(mockTaskResult);

  await t.step("should return success for valid combinations", () => {
    const result = projectLayer.isValidForDirectiveOrError("to");
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, true);
    }
  });

  await t.step("should return error for invalid combinations", () => {
    const result = projectLayer.isValidForDirectiveOrError("defect");
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.errors.length, 1);
        assertEquals(
          result.error.errors[0].includes("'project' is not valid for DirectiveType 'defect'"),
          true,
        );
      }
    }
  });

  await t.step("should validate DirectiveType parameter", () => {
    const emptyResult = projectLayer.isValidForDirectiveOrError("");
    assertEquals(emptyResult.ok, false);
    if (!emptyResult.ok) {
      assertEquals(emptyResult.error.kind, "InvalidInput");
      if (emptyResult.error.kind === "InvalidInput") {
        assertEquals(emptyResult.error.field, "directiveType");
      }
    }

    // @ts-expect-error Testing invalid input
    const nullResult = projectLayer.isValidForDirectiveOrError(null);
    assertEquals(nullResult.ok, false);
    if (!nullResult.ok) {
      assertEquals(nullResult.error.kind, "InvalidInput");
    }
  });

  await t.step("should work with custom validation rules", () => {
    const customRules = {
      "restricted": ["task"],
    };

    const validResult = taskLayer.isValidForDirectiveOrError("restricted", customRules);
    assertEquals(validResult.ok, true);

    const invalidResult = projectLayer.isValidForDirectiveOrError("restricted", customRules);
    assertEquals(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assertEquals(invalidResult.error.kind, "ValidationFailed");
      if (invalidResult.error.kind === "ValidationFailed") {
        assertEquals(invalidResult.error.errors[0].includes("Valid LayerTypes: task"), true);
      }
    }
  });
});

Deno.test("LayerType Enhanced Features - Integration Test", async (t) => {
  await t.step("should work together seamlessly", () => {
    // Create LayerType with pattern
    const pattern = TwoParamsLayerTypePattern.create("^(project|issue|task|bugs)$");
    assertExists(pattern);

    const layerType = LayerType.create(mockTwoParamsResult, pattern);

    // Verify pattern is stored
    assertEquals(layerType.validatedByPattern, pattern);

    // Use path resolution
    const promptPath = layerType.resolvePromptTemplatePath("to");
    assertEquals(promptPath, "prompts/to/project.md");

    // Use directive validation
    assertEquals(layerType.isValidForDirective("to"), true);
    assertEquals(layerType.isValidForDirective("defect"), false);

    // Verify original functionality is preserved
    assertEquals(layerType.value, "project");
    assertEquals(layerType.toString(), "LayerType(project)");
  });

  await t.step("should maintain immutability and thread safety", () => {
    const pattern = TwoParamsLayerTypePattern.create("^(project|task)$");
    assertExists(pattern);

    const layerType = LayerType.create(mockTwoParamsResult, pattern);

    // Multiple calls should return consistent results
    assertEquals(layerType.validatedByPattern, layerType.validatedByPattern);
    assertEquals(
      layerType.resolvePromptTemplatePath("to"),
      layerType.resolvePromptTemplatePath("to"),
    );
    assertEquals(layerType.isValidForDirective("to"), layerType.isValidForDirective("to"));

    // Internal state should not change
    assertEquals(layerType.value, "project");
    assertEquals(layerType.originalResult, mockTwoParamsResult);
  });
});
