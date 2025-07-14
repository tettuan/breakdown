/**
 * @fileoverview 2_structure tests for prompt migration utilities
 *
 * Tests structural integrity and data consistency of migration functionality:
 * - Data structure validation and type consistency
 * - Input/output format integrity
 * - Migration result structure completeness
 * - Error object structure and hierarchy
 * - Function signature consistency
 * - Data transformation consistency
 * - Interface contract compliance
 * - State preservation and immutability
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
  type MigrationResult,
} from "./prompt_migration_utils.ts";
import type { PromptCliParams, PromptVariables } from "../types/prompt_variables_vo.ts";
import { PromptPath } from "../types/prompt_types.ts";

Deno.test("MigrationError structure - conforms to defined interface contract", () => {
  const sampleError: MigrationError = {
    kind: "MigrationError",
    source: "test-source",
    details: ["detail1", "detail2"],
  };

  // Verify required properties exist with correct types
  assertEquals(sampleError.kind, "MigrationError");
  assertEquals(typeof sampleError.source, "string");
  assert(Array.isArray(sampleError.details));

  // Verify details array contains only strings
  sampleError.details.forEach((detail) => {
    assertEquals(typeof detail, "string");
  });

  // Verify structure completeness (no extra properties)
  const expectedProperties = ["kind", "source", "details"];
  const actualProperties = Object.keys(sampleError);
  assertEquals(actualProperties.length, expectedProperties.length);
  expectedProperties.forEach((prop) => {
    assert(actualProperties.includes(prop));
  });
});

Deno.test("MigrationResult structure - maintains consistent data organization", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      fromFile: "test.md",
      customVariables: { env: "test" },
    },
  };

  const result = migratePromptCliParams(params);
  assertEquals(result.ok, true);

  if (result.ok) {
    const migrationResult = result.data;

    // Verify required properties structure
    assertExists(migrationResult.variables);
    assertExists(migrationResult.warnings);
    assert(Array.isArray(migrationResult.variables));
    assert(Array.isArray(migrationResult.warnings));

    // Verify optional path property type
    if (migrationResult.path) {
      assert(migrationResult.path instanceof PromptPath);
    }

    // Verify variables array contains only valid PromptVariable objects
    migrationResult.variables.forEach((variable) => {
      assertEquals(typeof variable.toRecord, "function");
      const record = variable.toRecord();
      assertEquals(typeof record, "object");

      // Each record should have exactly one key-value pair
      const entries = Object.entries(record);
      assertEquals(entries.length, 1);

      const [key, value] = entries[0];
      assertEquals(typeof key, "string");
      assertEquals(typeof value, "string");
      assert(key.length > 0);
    });

    // Verify warnings array contains only strings
    migrationResult.warnings.forEach((warning) => {
      assertEquals(typeof warning, "string");
      assert(warning.length > 0);
    });
  }
});

Deno.test("Function signature consistency - all functions maintain expected interface", () => {
  // Verify function existence and parameter counts
  assertEquals(typeof migrateCliParamsToVariables, "function");
  assertEquals(migrateCliParamsToVariables.length, 1);

  assertEquals(typeof extractPromptPath, "function");
  assertEquals(extractPromptPath.length, 1);

  assertEquals(typeof migratePromptCliParams, "function");
  assertEquals(migratePromptCliParams.length, 1);

  assertEquals(typeof createMigrationSummary, "function");
  assertEquals(createMigrationSummary.length, 2);

  assertEquals(typeof convertPromptCliParamsToPromptPath, "function");
  assertEquals(convertPromptCliParamsToPromptPath.length, 1);

  assertEquals(typeof convertPromptCliParamsToPromptVariables, "function");
  assertEquals(convertPromptCliParamsToPromptVariables.length, 1);
});

Deno.test("Input parameter structure validation - accepts only valid PromptCliParams", () => {
  const validParams: PromptCliParams = {
    directiveType: "summary",
    layerType: "task",
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
      input_text: "content",
      promptDir: "/custom",
      customVariables: { key: "value" },
      adaptation: "deprecated",
      fromLayerType: "deprecated",
      extended: true,
      customValidation: false,
      errorFormat: "json",
      config: "config.yml",
    },
  };

  // Verify structure requirements
  assertEquals(typeof validParams.directiveType, "string");
  assertEquals(typeof validParams.layerType, "string");
  assertEquals(typeof validParams.options, "object");

  // Verify optional fields maintain correct types when present
  if (validParams.options) {
    const options = validParams.options;

    if (options.fromFile) assertEquals(typeof options.fromFile, "string");
    if (options.destinationFile) assertEquals(typeof options.destinationFile, "string");
    if (options.input_text) assertEquals(typeof options.input_text, "string");
    if (options.promptDir) assertEquals(typeof options.promptDir, "string");
    if (options.customVariables) {
      assertEquals(typeof options.customVariables, "object");
      Object.entries(options.customVariables).forEach(([key, value]) => {
        assertEquals(typeof key, "string");
        assertEquals(typeof value, "string");
      });
    }

    // Verify deprecated fields maintain backward compatibility
    if (options.adaptation) assertEquals(typeof options.adaptation, "string");
    if (options.fromLayerType) assertEquals(typeof options.fromLayerType, "string");
    if (options.extended !== undefined) assertEquals(typeof options.extended, "boolean");
    if (options.customValidation !== undefined) {
      assertEquals(typeof options.customValidation, "boolean");
    }
    if (options.errorFormat) {
      assert(["simple", "detailed", "json"].includes(options.errorFormat));
    }
    if (options.config) assertEquals(typeof options.config, "string");
  }
});

Deno.test("Result type structure - maintains consistent Result<T, E> pattern", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  // Test migrateCliParamsToVariables result structure
  const variablesResult = migrateCliParamsToVariables(params);
  assert(typeof variablesResult.ok === "boolean");

  if (variablesResult.ok) {
    assertExists(variablesResult.data);
    assert(Array.isArray(variablesResult.data));
    assert(!("error" in variablesResult));
  } else {
    assertExists(variablesResult.error);
    assert(!("data" in variablesResult));
    assertEquals(variablesResult.error.kind, "MigrationError");
  }

  // Test extractPromptPath result structure
  const pathResult = extractPromptPath(params);
  assert(typeof pathResult.ok === "boolean");

  if (pathResult.ok) {
    // data can be PromptPath or null
    if (pathResult.data !== null) {
      assert(pathResult.data instanceof PromptPath);
    }
    assert(!("error" in pathResult));
  } else {
    assertExists(pathResult.error);
    assert(!("data" in pathResult));
    assertEquals(pathResult.error.kind, "MigrationError");
  }

  // Test migratePromptCliParams result structure
  const fullResult = migratePromptCliParams(params);
  assert(typeof fullResult.ok === "boolean");

  if (fullResult.ok) {
    assertExists(fullResult.data);
    assertEquals(typeof fullResult.data, "object");
    assert(!("error" in fullResult));
  } else {
    assertExists(fullResult.error);
    assert(!("data" in fullResult));
    assertEquals(fullResult.error.kind, "MigrationError");
  }
});

Deno.test("Data transformation consistency - maintains one-to-one mapping relationships", () => {
  const params: PromptCliParams = {
    directiveType: "defect",
    layerType: "bugs",
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
      input_text: "stdin content",
      customVariables: {
        author: "test-user",
        version: "2.0.0",
        environment: "production",
      },
    },
  };

  const result = migrateCliParamsToVariables(params);
  assertEquals(result.ok, true);

  if (result.ok) {
    const variables = result.data;

    // Verify total variable count matches expected transformations
    // 2 standard + 2 file + 1 stdin + 3 custom = 8 variables
    assertEquals(variables.length, 8);

    // Convert to flat record for verification
    const variableRecords = variables.map((v) => v.toRecord());
    const flatRecord = Object.assign({}, ...variableRecords);

    // Verify one-to-one mappings
    assertEquals(flatRecord.directive_type, params.directiveType);
    assertEquals(flatRecord.layer_type, params.layerType);
    assertEquals(flatRecord.input_text_file, params.options?.fromFile);
    assertEquals(flatRecord.destination_path, params.options?.destinationFile);
    assertEquals(flatRecord.input_text, params.options?.input_text);

    // Verify custom variables maintain their values
    if (params.options?.customVariables) {
      Object.entries(params.options.customVariables).forEach(([key, value]) => {
        assertEquals(flatRecord[key], value);
      });
    }

    // Verify no extra keys were added
    const expectedKeys = new Set([
      "directive_type",
      "layer_type",
      "input_text_file",
      "destination_path",
      "input_text",
      "author",
      "version",
      "environment",
    ]);

    Object.keys(flatRecord).forEach((key) => {
      assert(expectedKeys.has(key), `Unexpected key: ${key}`);
    });
  }
});

Deno.test("Wrapper function consistency - maintain identical behavior to core functions", () => {
  const params: PromptCliParams = {
    directiveType: "summary",
    layerType: "issue",
    options: {
      fromFile: "tasks.md",
      customVariables: { project: "breakdown" },
    },
  };

  // Test path extraction wrapper consistency
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

  if (!pathResult1.ok && !pathResult2.ok) {
    assertEquals(pathResult1.error.kind, pathResult2.error.kind);
    assertEquals(pathResult1.error.source, pathResult2.error.source);
  }

  // Test variables conversion wrapper consistency
  const variablesResult1 = migrateCliParamsToVariables(params);
  const variablesResult2 = convertPromptCliParamsToPromptVariables(params);

  assertEquals(variablesResult1.ok, variablesResult2.ok);

  if (variablesResult1.ok && variablesResult2.ok) {
    assertEquals(variablesResult1.data.length, variablesResult2.data.length);

    // Verify variable content is identical
    const records1 = variablesResult1.data.map((v) => v.toRecord());
    const records2 = variablesResult2.data.map((v) => v.toRecord());

    for (let i = 0; i < records1.length; i++) {
      assertEquals(records1[i], records2[i]);
    }
  }

  if (!variablesResult1.ok && !variablesResult2.ok) {
    assertEquals(variablesResult1.error.kind, variablesResult2.error.kind);
    assertEquals(variablesResult1.error.source, variablesResult2.error.source);
  }
});

Deno.test("Migration summary structure - maintains readable format consistency", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "task",
    options: {
      fromFile: "input.md",
      customVariables: { env: "test", version: "1.0" },
    },
  };

  const migrationResult = migratePromptCliParams(params);
  assertEquals(migrationResult.ok, true);

  if (migrationResult.ok) {
    const summary = createMigrationSummary(params, migrationResult.data);

    // Verify summary structure
    assertEquals(typeof summary, "string");
    assert(summary.length > 0);

    // Verify required sections are present
    const lines = summary.split("\n");
    assert(lines.length > 1);

    // Verify header format
    assertEquals(lines[0], "Migration Summary:");

    // Verify consistent formatting patterns
    let foundPromptPath = false;
    let foundVariablesSection = false;
    let variableCount = 0;

    lines.forEach((line) => {
      if (line.startsWith("- Prompt path:")) {
        foundPromptPath = true;
        assert(line.includes("prompts/to_task.md"));
      }

      if (line.startsWith("- Variables created:")) {
        foundVariablesSection = true;
        const countMatch = line.match(/: (\d+)$/);
        assert(countMatch);
        variableCount = parseInt(countMatch[1]);
        assert(variableCount > 0);
      }

      if (line.startsWith("  - ")) {
        // Variable line format: "  - key: value"
        const colonIndex = line.indexOf(":");
        assert(colonIndex > 4); // After "  - " and at least one character

        const key = line.substring(4, colonIndex);
        const value = line.substring(colonIndex + 2);

        assert(key.length > 0);
        assert(value.length > 0);
        assertEquals(typeof key, "string");
        assertEquals(typeof value, "string");
      }
    });

    if (migrationResult.data.path) {
      assert(foundPromptPath);
    }
    assert(foundVariablesSection);

    // Count actual variable lines
    const variableLines = lines.filter((line) =>
      line.startsWith("  - ") && !line.includes("Warnings:")
    );
    assertEquals(variableLines.length, variableCount);
  }
});

Deno.test("Warning message structure - maintains consistent format and content", () => {
  const paramsWithDeprecated: PromptCliParams = {
    directiveType: "summary",
    layerType: "project",
    options: {
      adaptation: "old-value",
      fromLayerType: "old-layer",
      extended: true,
      customValidation: false,
      errorFormat: "json",
      config: "custom.yml",
    },
  };

  const result = migratePromptCliParams(paramsWithDeprecated);
  assertEquals(result.ok, true);

  if (result.ok) {
    const warnings = result.data.warnings;

    // Verify warnings structure
    assert(Array.isArray(warnings));
    assertEquals(warnings.length, 5);

    // Verify each warning is a non-empty string
    warnings.forEach((warning) => {
      assertEquals(typeof warning, "string");
      assert(warning.length > 0);
    });

    // Verify expected warning patterns
    const expectedWarnings = [
      "Option 'adaptation' is deprecated and was ignored",
      "Option 'fromLayerType' is deprecated and was ignored",
      "Option 'extended' is deprecated and was ignored",
      "Option 'errorFormat' is deprecated and was ignored",
      "Option 'config' should be handled by BreakdownConfig package",
    ];

    expectedWarnings.forEach((expected) => {
      assert(warnings.includes(expected), `Missing warning: ${expected}`);
    });

    // Verify warning format consistency
    warnings.forEach((warning) => {
      if (warning.includes("deprecated")) {
        assert(warning.startsWith("Option '"));
        assert(warning.includes("' is deprecated and was ignored"));
      } else if (warning.includes("config")) {
        assert(warning.includes("BreakdownConfig package"));
      }
    });
  }
});

Deno.test("Edge case structure handling - maintains robustness across input variations", () => {
  const edgeCases: PromptCliParams[] = [
    // Minimal structure
    { directiveType: "", layerType: "", options: {} },

    // Missing options
    { directiveType: "to", layerType: "project", options: {} },

    // Empty string values
    {
      directiveType: "summary",
      layerType: "task",
      options: {
        fromFile: "",
        destinationFile: "",
        input_text: "",
        customVariables: {},
      },
    },

    // Mixed valid/empty custom variables
    {
      directiveType: "defect",
      layerType: "issue",
      options: {
        customVariables: {
          validVar: "value",
          emptyVar: "",
          spaceVar: "   ",
        },
      },
    },
  ];

  edgeCases.forEach((params, index) => {
    const result = migratePromptCliParams(params);

    // All results should maintain consistent structure
    assert(typeof result.ok === "boolean", `Case ${index}: Invalid result structure`);

    if (result.ok) {
      const data = result.data;

      // Verify required properties exist
      assertExists(data.variables, `Case ${index}: Missing variables property`);
      assertExists(data.warnings, `Case ${index}: Missing warnings property`);

      // Verify array types
      assert(Array.isArray(data.variables), `Case ${index}: variables not array`);
      assert(Array.isArray(data.warnings), `Case ${index}: warnings not array`);

      // Verify path property type when present
      if (data.path) {
        assert(data.path instanceof PromptPath, `Case ${index}: Invalid path type`);
      }

      // Verify all variables maintain structure
      data.variables.forEach((variable, varIndex) => {
        assertEquals(
          typeof variable.toRecord,
          "function",
          `Case ${index}, Var ${varIndex}: Missing toRecord`,
        );
        const record = variable.toRecord();
        assertEquals(
          typeof record,
          "object",
          `Case ${index}, Var ${varIndex}: Invalid record type`,
        );
      });
    } else {
      const error = result.error;

      // Verify error structure
      assertExists(error, `Case ${index}: Missing error property`);
      assertEquals(error.kind, "MigrationError", `Case ${index}: Invalid error kind`);
      assertEquals(typeof error.source, "string", `Case ${index}: Invalid error source type`);
      assert(Array.isArray(error.details), `Case ${index}: error.details not array`);

      // Verify error details structure
      error.details.forEach((detail, detailIndex) => {
        assertEquals(
          typeof detail,
          "string",
          `Case ${index}, Detail ${detailIndex}: Invalid detail type`,
        );
        assert(detail.length > 0, `Case ${index}, Detail ${detailIndex}: Empty detail`);
      });
    }
  });
});

Deno.test("Type safety structure - enforces strict typing throughout migration chain", () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      fromFile: "test.md",
      customVariables: { key: "value" },
    },
  };

  // Test variable type consistency
  const variablesResult = migrateCliParamsToVariables(params);
  assertEquals(variablesResult.ok, true);

  if (variablesResult.ok) {
    const variables: PromptVariables = variablesResult.data;

    // Verify each variable maintains type contract
    variables.forEach((variable, index) => {
      // Verify duck typing contract
      assertEquals(
        typeof variable.toRecord,
        "function",
        `Variable ${index}: Missing toRecord method`,
      );

      const record = variable.toRecord();
      assertEquals(typeof record, "object", `Variable ${index}: toRecord must return object`);
      assert(record !== null, `Variable ${index}: toRecord must not return null`);

      // Verify record structure
      const entries = Object.entries(record);
      assertEquals(
        entries.length,
        1,
        `Variable ${index}: toRecord must return exactly one key-value pair`,
      );

      const [key, value] = entries[0];
      assertEquals(typeof key, "string", `Variable ${index}: Key must be string`);
      assertEquals(typeof value, "string", `Variable ${index}: Value must be string`);
      assert(key.length > 0, `Variable ${index}: Key must not be empty`);
    });
  }

  // Test path type consistency
  const pathResult = extractPromptPath(params);
  assertEquals(pathResult.ok, true);

  if (pathResult.ok && pathResult.data) {
    const path = pathResult.data;

    // Verify PromptPath contract
    assert(path instanceof PromptPath, "extractPromptPath must return PromptPath instance");
    assertEquals(typeof path.toString, "function", "PromptPath must have toString method");

    const pathString = path.toString();
    assertEquals(typeof pathString, "string", "toString must return string");
    assert(pathString.length > 0, "toString must return non-empty string");
  }

  // Test migration result type consistency
  const fullResult = migratePromptCliParams(params);
  assertEquals(fullResult.ok, true);

  if (fullResult.ok) {
    const migrationResult: MigrationResult = fullResult.data;

    // Verify MigrationResult contract
    assertExists(migrationResult.variables, "MigrationResult must have variables property");
    assertExists(migrationResult.warnings, "MigrationResult must have warnings property");

    // Optional path property type check
    if (migrationResult.path !== undefined) {
      assert(
        migrationResult.path instanceof PromptPath,
        "MigrationResult.path must be PromptPath instance",
      );
    }

    // Verify array types and content
    assert(Array.isArray(migrationResult.variables), "variables must be array");
    assert(Array.isArray(migrationResult.warnings), "warnings must be array");

    migrationResult.warnings.forEach((warning, index) => {
      assertEquals(typeof warning, "string", `Warning ${index} must be string`);
      assert(warning.length > 0, `Warning ${index} must not be empty`);
    });
  }
});
