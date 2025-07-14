/**
 * @fileoverview Tests for prompt migration utilities
 *
 * Verifies the correct migration from legacy PromptCliParams to the new type system.
 *
 * @module migration/prompt_migration_utils_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import {
  createMigrationSummary,
  extractPromptPath,
  migrateCliParamsToVariables,
  migratePromptCliParams,
} from "./prompt_migration_utils.ts";
import type { PromptCliParams } from "../types/prompt_variables_vo.ts";

Deno.test("migrateCliParamsToVariables - basic parameters", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = migrateCliParamsToVariables(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 2);

    const records = result.data.map((v) => v.toRecord());
    assertEquals(records[0], { directive_type: "to" });
    assertEquals(records[1], { layer_type: "project" });
  }
});

Deno.test("migrateCliParamsToVariables - with file options", () => {
  const params: PromptCliParams = {
    directiveType: "summary",
    layerType: "task",
    options: {
      fromFile: "/path/to/input.md",
      destinationFile: "/path/to/output.md",
    },
  };

  const result = migrateCliParamsToVariables(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 4);

    const records = result.data.map((v) => v.toRecord());
    assertEquals(records[2], { input_text_file: "/path/to/input.md" });
    assertEquals(records[3], { destination_path: "/path/to/output.md" });
  }
});

Deno.test("migrateCliParamsToVariables - with stdin and custom variables", () => {
  const params: PromptCliParams = {
    directiveType: "defect",
    layerType: "issue",
    options: {
      input_text: "Some input from stdin",
      customVariables: {
        author: "test-user",
        version: "1.0.0",
      },
    },
  };

  const result = migrateCliParamsToVariables(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 5); // 2 standard + 1 stdin + 2 custom

    const records = result.data.map((v) => v.toRecord());
    // Check stdin variable
    assertEquals(records[2], { input_text: "Some input from stdin" });
    // Check custom variables
    assertEquals(records[3], { author: "test-user" });
    assertEquals(records[4], { version: "1.0.0" });
  }
});

Deno.test("extractPromptPath - from directiveType and layerType", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = extractPromptPath(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    if (result.data) {
      assertEquals(result.data.toString(), "prompts/to_project.md");
    }
  }
});

Deno.test("extractPromptPath - with promptDir option", () => {
  const params: PromptCliParams = {
    directiveType: "summary",
    layerType: "task",
    options: {
      promptDir: "/custom/prompts",
    },
  };

  const result = extractPromptPath(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    if (result.data) {
      assertEquals(result.data.toString(), "/custom/prompts/summary_task.md");
    }
  }
});

Deno.test("extractPromptPath - no path parameters", () => {
  const params: PromptCliParams = {
    directiveType: "",
    layerType: "",
    options: {},
  };

  const result = extractPromptPath(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, null);
  }
});

Deno.test("migratePromptCliParams - complete migration with warnings", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      fromFile: "input.md",
      adaptation: "some-adaptation", // deprecated
      extended: true, // deprecated
      customValidation: true, // deprecated
      errorFormat: "json", // deprecated
      config: "custom.yml", // should be handled by BreakdownConfig
    },
  };

  const result = migratePromptCliParams(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    // Check path
    assertExists(result.data.path);
    if (result.data.path) {
      assertEquals(result.data.path.toString(), "prompts/to_project.md");
    }

    // Check variables
    assertEquals(result.data.variables.length, 3);

    // Check warnings
    assertEquals(result.data.warnings.length, 5);
    assertEquals(
      result.data.warnings.includes("Option 'adaptation' is deprecated and was ignored"),
      true,
    );
    assertEquals(
      result.data.warnings.includes("Option 'extended' is deprecated and was ignored"),
      true,
    );
    assertEquals(
      result.data.warnings.includes("Option 'customValidation' is deprecated and was ignored"),
      true,
    );
    assertEquals(
      result.data.warnings.includes("Option 'errorFormat' is deprecated and was ignored"),
      true,
    );
    assertEquals(
      result.data.warnings.includes("Option 'config' should be handled by BreakdownConfig package"),
      true,
    );
  }
});

Deno.test("createMigrationSummary - generates readable summary", () => {
  const params: PromptCliParams = {
    directiveType: "summary",
    layerType: "issue",
    options: {
      fromFile: "tasks.md",
      customVariables: {
        project: "breakdown",
      },
    },
  };

  const migrationResult = migratePromptCliParams(params);
  assertEquals(migrationResult.ok, true);

  if (migrationResult.ok) {
    const summary = createMigrationSummary(params, migrationResult.data);

    // Check that summary contains expected information
    assertEquals(summary.includes("Migration Summary:"), true);
    assertEquals(summary.includes("Prompt path: prompts/summary_issue.md"), true);
    assertEquals(summary.includes("Variables created: 4"), true);
    assertEquals(summary.includes("directive_type: summary"), true);
    assertEquals(summary.includes("layer_type: issue"), true);
    assertEquals(summary.includes("input_text_file: tasks.md"), true);
    assertEquals(summary.includes("project: breakdown"), true);
  }
});

Deno.test("migrateCliParamsToVariables - handles empty custom variable values", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "task",
    options: {
      customVariables: {
        emptyVar: "", // Empty string should be allowed
        normalVar: "value",
      },
    },
  };

  const result = migrateCliParamsToVariables(params);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 4); // 2 standard + 2 custom

    const records = result.data.map((v) => v.toRecord());
    assertEquals(records[2], { emptyVar: "" });
    assertEquals(records[3], { normalVar: "value" });
  }
});
