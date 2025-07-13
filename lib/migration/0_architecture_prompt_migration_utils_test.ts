/**
 * @fileoverview 0_architecture tests for prompt migration utilities
 *
 * Tests architectural constraints and design principles of migration functionality:
 * - System boundary enforcement and isolation
 * - Migration path integrity and determinism
 * - Legacy compatibility maintenance
 * - Type system integration compliance
 * - Error propagation and containment
 * - Resource lifecycle management
 * - API contract adherence
 *
 * @module migration/prompt_migration_utils
 */

import { assert, assertEquals, assertExists } from "../deps.ts";
import {
  convertPromptCliParamsToPromptPath,
  convertPromptCliParamsToPromptVariables,
  createMigrationSummary,
  extractPromptPath,
  migrateCliParamsToVariables,
  migratePromptCliParams,
  type MigrationError,
  type MigrationResult as _MigrationResult,
} from "./prompt_migration_utils.ts";
import type { PromptCliParams } from "../types/prompt_variables_vo.ts";
import { PromptPath } from "../types/prompt_types.ts";

Deno.test("Migration utils - module exports follow architectural patterns", () => {
  // Verify all public functions are properly exported
  assertEquals(typeof migrateCliParamsToVariables, "function");
  assertEquals(typeof extractPromptPath, "function");
  assertEquals(typeof migratePromptCliParams, "function");
  assertEquals(typeof createMigrationSummary, "function");
  assertEquals(typeof convertPromptCliParamsToPromptPath, "function");
  assertEquals(typeof convertPromptCliParamsToPromptVariables, "function");

  // Verify function signatures maintain consistency
  assertEquals(migrateCliParamsToVariables.length, 1);
  assertEquals(extractPromptPath.length, 1);
  assertEquals(migratePromptCliParams.length, 1);
  assertEquals(createMigrationSummary.length, 2);
  assertEquals(convertPromptCliParamsToPromptPath.length, 1);
  assertEquals(convertPromptCliParamsToPromptVariables.length, 1);
});

Deno.test("Migration functions - maintain referential transparency", () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "test.md" },
  };

  // Multiple calls with same input should produce equivalent results
  const result1 = migrateCliParamsToVariables(params);
  const result2 = migrateCliParamsToVariables(params);

  assertEquals(result1.ok, result2.ok);
  if (result1.ok && result2.ok) {
    assertEquals(result1.data.length, result2.data.length);

    // Compare variable records
    const records1 = result1.data.map((v) => v.toRecord());
    const records2 = result2.data.map((v) => v.toRecord());
    for (let i = 0; i < records1.length; i++) {
      assertEquals(records1[i], records2[i]);
    }
  }
});

Deno.test("Migration system - maintains immutability of input parameters", () => {
  const originalParams: PromptCliParams = {
    demonstrativeType: "summary",
    layerType: "task",
    options: {
      fromFile: "input.md",
      customVariables: { version: "1.0" },
    },
  };

  // Create deep copy to verify original doesn't change
  const paramsCopy = JSON.parse(JSON.stringify(originalParams));

  // Perform migration
  const _result = migratePromptCliParams(originalParams);

  // Verify original parameters unchanged
  assertEquals(originalParams, paramsCopy);
  assertEquals(originalParams.demonstrativeType, "summary");
  assertEquals(originalParams.layerType, "task");
  assertEquals(originalParams.options?.fromFile, "input.md");
  assertEquals(originalParams.options?.customVariables?.version, "1.0");
});

Deno.test("Migration architecture - enforces type system boundaries", () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };

  // Migration result must conform to strict Result<T, E> pattern
  const variablesResult = migrateCliParamsToVariables(params);

  // Result must have exactly one of 'ok' or 'error' properties
  const hasOk = "ok" in variablesResult;
  const hasData = "data" in variablesResult;
  const hasError = "error" in variablesResult;

  assert(hasOk);
  if (variablesResult.ok) {
    assert(hasData);
    assert(!hasError);
    assert(Array.isArray(variablesResult.data));
  } else {
    assert(!hasData);
    assert(hasError);
    assert(typeof variablesResult.error === "object");
  }
});

Deno.test("Migration error handling - follows architectural error patterns", () => {
  // Test with invalid parameters that should trigger errors
  const invalidParams: PromptCliParams = {
    demonstrativeType: "", // Invalid empty value
    layerType: "project",
    options: {},
  };

  const result = migrateCliParamsToVariables(invalidParams);

  if (!result.ok) {
    const error = result.error as MigrationError;

    // Verify error structure follows architectural pattern
    assertEquals(error.kind, "MigrationError");
    assertExists(error.source);
    assertExists(error.details);
    assert(Array.isArray(error.details));
    assertEquals(typeof error.source, "string");

    // Verify error provides actionable information
    assert(error.details.length > 0);
    for (const detail of error.details) {
      assertEquals(typeof detail, "string");
      assert(detail.length > 0);
    }
  }
});

Deno.test("Path extraction - maintains architectural isolation", () => {
  const params: PromptCliParams = {
    demonstrativeType: "summary",
    layerType: "issue",
    options: { promptDir: "/custom/path" },
  };

  const pathResult = extractPromptPath(params);

  assertEquals(pathResult.ok, true);
  if (pathResult.ok && pathResult.data) {
    // Verify path creation follows domain constraints
    assert(pathResult.data instanceof PromptPath);

    // Verify path doesn't leak implementation details
    const pathString = pathResult.data.toString();
    assertEquals(typeof pathString, "string");
    assert(pathString.includes("summary"));
    assert(pathString.includes("issue"));
  }
});

Deno.test("Migration completeness - ensures no data loss", () => {
  const comprehensiveParams: PromptCliParams = {
    demonstrativeType: "defect",
    layerType: "bugs",
    options: {
      fromFile: "/src/input.md",
      destinationFile: "/dst/output.md",
      input_text: "stdin content",
      promptDir: "/templates",
      customVariables: {
        author: "test-user",
        project: "breakdown",
        version: "2.0.0",
      },
    },
  };

  const result = migratePromptCliParams(comprehensiveParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const migrationResult = result.data;

    // Verify all input data is preserved in migration
    assertEquals(migrationResult.variables.length, 8); // 2 standard + 1 stdin + 2 file + 3 custom

    const variableRecords = migrationResult.variables.map((v) => v.toRecord());
    const flatRecords = Object.assign({}, ...variableRecords);

    // Verify key information preserved
    assertEquals(flatRecords.demonstrative_type, "defect");
    assertEquals(flatRecords.layer_type, "bugs");
    assertEquals(flatRecords.input_text_file, "/src/input.md");
    assertEquals(flatRecords.destination_path, "/dst/output.md");
    assertEquals(flatRecords.input_text, "stdin content");
    assertEquals(flatRecords.author, "test-user");
    assertEquals(flatRecords.project, "breakdown");
    assertEquals(flatRecords.version, "2.0.0");
  }
});

Deno.test("Wrapper functions - maintain architectural consistency", () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "test.md" },
  };

  // Wrapper functions should provide identical results to core functions
  const pathResult1 = extractPromptPath(params);
  const pathResult2 = convertPromptCliParamsToPromptPath(params);

  assertEquals(pathResult1.ok, pathResult2.ok);
  if (pathResult1.ok && pathResult2.ok) {
    if (pathResult1.data && pathResult2.data) {
      assertEquals(pathResult1.data.toString(), pathResult2.data.toString());
    } else {
      assertEquals(pathResult1.data, pathResult2.data); // Both null
    }
  }

  const variablesResult1 = migrateCliParamsToVariables(params);
  const variablesResult2 = convertPromptCliParamsToPromptVariables(params);

  assertEquals(variablesResult1.ok, variablesResult2.ok);
  if (variablesResult1.ok && variablesResult2.ok) {
    assertEquals(variablesResult1.data.length, variablesResult2.data.length);
  }
});

Deno.test("Migration warnings - architectural concern separation", () => {
  const paramsWithDeprecated: PromptCliParams = {
    demonstrativeType: "summary",
    layerType: "project",
    options: {
      adaptation: "deprecated-feature",
      fromLayerType: "deprecated-layer",
      extended: true,
      customValidation: true,
      errorFormat: "json",
      config: "custom.yml",
    },
  };

  const result = migratePromptCliParams(paramsWithDeprecated);

  assertEquals(result.ok, true);
  if (result.ok) {
    // Verify warnings are properly categorized and don't affect core migration
    assertEquals(result.data.warnings.length, 6);

    // Verify core migration still succeeds despite deprecated options
    assertEquals(result.data.variables.length, 2); // Only standard variables
    assertExists(result.data.path);

    // Verify warning messages provide clear guidance
    const allWarnings = result.data.warnings.join(" ");
    assert(allWarnings.includes("deprecated"));
    assert(allWarnings.includes("BreakdownConfig")); // Guidance for config option
  }
});

Deno.test("Migration summary - output format architectural compliance", () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "task",
    options: {
      fromFile: "input.md",
      customVariables: { env: "test" },
    },
  };

  const migrationResult = migratePromptCliParams(params);
  assertEquals(migrationResult.ok, true);

  if (migrationResult.ok) {
    const summary = createMigrationSummary(params, migrationResult.data);

    // Verify summary follows structured format
    assert(summary.startsWith("Migration Summary:"));
    const lines = summary.split("\n");
    assert(lines.length > 1);

    // Verify summary contains all required sections
    assert(summary.includes("Prompt path:"));
    assert(summary.includes("Variables created:"));
    assert(summary.includes("demonstrative_type:"));
    assert(summary.includes("layer_type:"));
    assert(summary.includes("input_text_file:"));
    assert(summary.includes("env:"));

    // Verify hierarchical structure (indentation)
    const variableLines = lines.filter((line) => line.startsWith("  - "));
    assert(variableLines.length > 0);
  }
});

Deno.test("Migration architecture - handles edge cases gracefully", () => {
  const edgeCases: PromptCliParams[] = [
    // Minimal parameters
    { demonstrativeType: "to", layerType: "project", options: {} },

    // Empty optional fields
    {
      demonstrativeType: "summary",
      layerType: "task",
      options: {
        customVariables: {},
        fromFile: "",
        destinationFile: "",
      },
    },

    // Mixed valid/invalid data
    {
      demonstrativeType: "defect",
      layerType: "issue",
      options: {
        fromFile: "valid.md",
        customVariables: {
          validVar: "value",
          emptyVar: "",
        },
      },
    },
  ];

  for (const params of edgeCases) {
    const result = migratePromptCliParams(params);

    // All edge cases should either succeed or fail gracefully
    assert(typeof result.ok === "boolean");

    if (result.ok) {
      // Successful migrations should have valid structure
      assertExists(result.data.variables);
      assert(Array.isArray(result.data.variables));
      assert(Array.isArray(result.data.warnings));
    } else {
      // Failed migrations should provide clear error information
      assertExists(result.error);
      assertEquals(result.error.kind, "MigrationError");
      assert(Array.isArray(result.error.details));
    }
  }
});

Deno.test("Migration system - enforces single responsibility principle", () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "test.md" },
  };

  // Each function should have a single, well-defined responsibility

  // migrateCliParamsToVariables: Only converts parameters to variables
  const variablesResult = migrateCliParamsToVariables(params);
  assertEquals(variablesResult.ok, true);
  if (variablesResult.ok) {
    // Should only return variables, no path or warnings
    assert(Array.isArray(variablesResult.data));
  }

  // extractPromptPath: Only extracts path information
  const pathResult = extractPromptPath(params);
  assertEquals(pathResult.ok, true);
  if (pathResult.ok) {
    // Should only return path or null, no variables or warnings
    if (pathResult.data) {
      assert(pathResult.data instanceof PromptPath);
    }
  }

  // migratePromptCliParams: Orchestrates complete migration
  const fullResult = migratePromptCliParams(params);
  assertEquals(fullResult.ok, true);
  if (fullResult.ok) {
    // Should combine all aspects: path, variables, and warnings
    assertExists(fullResult.data.variables);
    assert(Array.isArray(fullResult.data.warnings));
    // Path may be present or undefined
  }
});

Deno.test("Migration architecture - maintains legacy compatibility boundaries", () => {
  // Test with legacy-style parameters that may contain deprecated fields
  const legacyParams: PromptCliParams = {
    demonstrativeType: "summary",
    layerType: "project",
    options: {
      // Legacy fields that should be handled gracefully
      adaptation: "old-style",
      fromLayerType: "legacy-layer",
      extended: true,
      customValidation: false,
      errorFormat: "json",

      // Current fields that should work normally
      fromFile: "input.md",
      customVariables: { legacy: "value" },
    },
  };

  const result = migratePromptCliParams(legacyParams);

  // Migration should succeed despite legacy fields
  assertEquals(result.ok, true);
  if (result.ok) {
    // Legacy fields should be ignored but warned about
    assertEquals(result.data.warnings.length, 4);

    // Valid current fields should be migrated normally
    const variableRecords = result.data.variables.map((v) => v.toRecord());
    const flatRecords = Object.assign({}, ...variableRecords);

    assertEquals(flatRecords.demonstrative_type, "summary");
    assertEquals(flatRecords.layer_type, "project");
    assertEquals(flatRecords.input_text_file, "input.md");
    assertEquals(flatRecords.legacy, "value");
  }
});
