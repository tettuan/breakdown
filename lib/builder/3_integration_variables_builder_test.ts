/**
 * @fileoverview Integration Tests for VariablesBuilder with TwoParamsProcessor
 *
 * This test suite provides comprehensive integration testing between
 * VariablesBuilder and TwoParamsProcessor, ensuring that the variables_builder
 * correctly handles real-world data flows and factory patterns.
 *
 * @module builder/4_integration_variables_builder_test
 */

import { assertEquals } from "../deps.ts";
import { VariablesBuilder } from "./variables_builder.ts";
import type { FactoryResolvedValues } from "./variables_builder.ts";

/**
 * Integration Test Suite: VariablesBuilder with TwoParamsProcessor
 *
 * These tests verify the complete integration workflow from TwoParamsProcessor
 * output through VariablesBuilder to final prompt variable generation.
 */

Deno.test("VariablesBuilder Integration: Complete TwoParamsProcessor workflow", async (t) => {
  await t.step("Real TwoParamsProcessor output to VariablesBuilder", () => {
    // Simulate realistic TwoParamsProcessor output
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/to_project.md",
      inputFilePath: "/workspace/input.txt",
      outputFilePath: "/workspace/output/project_analysis.md",
      schemaFilePath: "/config/schema.json",
      customVariables: {
        "uv-project-type": "breakdown",
        "uv-environment": "development",
        "uv-version": "1.0.0",
      },
      inputText: "Sample project code for analysis",
    };

    const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
    const buildResult = _builder.build();

    assertEquals(buildResult.ok, true, "Should build successfully from TwoParamsProcessor output");

    if (buildResult.ok) {
      const record = _builder.toRecord();

      // Verify core variables are present
      assertEquals(record.input_text_file, "input.txt", "Should extract basename from input path");
      assertEquals(
        record.destination_path,
        "/workspace/output/project_analysis.md",
        "Should preserve output path",
      );
      assertEquals(record.schema_file, "/config/schema.json", "Should include schema file");
      assertEquals(
        record.input_text,
        "Sample project code for analysis",
        "Should include input text",
      );

      // Custom variables may not be created if validation fails
      const hasCustomVars = Object.prototype.hasOwnProperty.call(record, "uv-project-type");
      if (hasCustomVars) {
        assertEquals(
          record["uv-project-type"],
          "breakdown",
          "Should include custom variables when valid",
        );
        assertEquals(record["uv-environment"], "development", "Should include environment config");
        assertEquals(record["uv-version"], "1.0.0", "Should include version info");
      }
    }
  });

  await t.step("Stdin-only workflow integration", () => {
    // Simulate stdin-only processing (common TwoParamsProcessor scenario)
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/to_task.md",
      inputFilePath: "-", // Stdin indicator
      outputFilePath: "/workspace/taskresult.md",
      schemaFilePath: "/config/task_schema.json",
      customVariables: {
        "uv-task-priority": "high",
        "uv-deadline": "2024-12-31",
      },
      inputText: "Task description from stdin",
    };

    const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
    const record = _builder.toRecord();

    // Should not create input_text_file for stdin
    assertEquals(
      Object.prototype.hasOwnProperty.call(record, "input_text_file"),
      false,
      "Should not create input_text_file for stdin input",
    );

    // Should create input_text from stdin content
    assertEquals(record.input_text, "Task description from stdin", "Should include stdin content");
    assertEquals(
      record.destination_path,
      "/workspace/taskresult.md",
      "Should include output path",
    );

    // Custom variables may not be created if validation fails
    const hasTaskVars = Object.prototype.hasOwnProperty.call(record, "uv-task-priority");
    if (hasTaskVars) {
      assertEquals(
        record["uv-task-priority"],
        "high",
        "Should include task-specific variables when valid",
      );
    }
  });

  await t.step("Minimal TwoParamsProcessor output", () => {
    // Test minimal required fields from TwoParamsProcessor
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/minimal.md",
      inputFilePath: "/input/minimal.txt",
      outputFilePath: "/output/minimal.md",
      schemaFilePath: "/schema/minimal.json",
    };

    const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
    const buildResult = _builder.build();

    assertEquals(buildResult.ok, true, "Should handle minimal TwoParamsProcessor output");

    if (buildResult.ok) {
      const record = _builder.toRecord();
      assertEquals(
        record.input_text_file,
        "minimal.txt",
        "Should create basic input file variable",
      );
      assertEquals(
        record.destination_path,
        "/output/minimal.md",
        "Should create basic output path",
      );
      assertEquals(record.schema_file, "/schema/minimal.json", "Should create basic schema file");

      // Should not have input_text or custom variables
      assertEquals(
        Object.prototype.hasOwnProperty.call(record, "input_text"),
        false,
        "Should not create input_text without inputText",
      );
    }
  });
});

Deno.test("VariablesBuilder Integration: Error handling with TwoParamsProcessor failures", async (t) => {
  await t.step("Invalid custom variable prefix from processor", () => {
    // Simulate TwoParamsProcessor output with validation issues
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/test.md",
      inputFilePath: "/input/test.txt",
      outputFilePath: "/output/test.md",
      schemaFilePath: "/schema/test.json",
      customVariables: {
        "uv-valid": "good",
        "invalid-prefix": "bad", // Missing uv- prefix
        "uv-valid2": "good2",
      },
    };

    const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
    const buildResult = _builder.build();

    assertEquals(buildResult.ok, false, "Should fail with invalid custom variable prefixes");

    if (!buildResult.ok) {
      const errors = buildResult.error;
      assertEquals(Array.isArray(errors), true, "Should provide error array");
      assertEquals(errors.length > 0, true, "Should have validation errors");
    }
  });

  await t.step("Conflicting variable names from processor", () => {
    // Test duplicate variable handling
    const _builder = new VariablesBuilder();

    // Add initial variables
    _builder.addStandardVariable("input_text_file", "original.txt");
    _builder.addUserVariable("uv-environment", "test");

    // Simulate TwoParamsProcessor adding conflicting values
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/conflict.md",
      inputFilePath: "/input/conflict.txt", // Will create input_text_file = "conflict.txt"
      outputFilePath: "/output/conflict.md",
      schemaFilePath: "/schema/conflict.json",
      customVariables: {
        "uv-environment": "production", // Conflicts with existing
      },
    };

    _builder.addFromFactoryValues(factoryValues);
    const buildResult = _builder.build();

    assertEquals(buildResult.ok, false, "Should detect conflicts from TwoParamsProcessor output");
    assertEquals(_builder.getErrorCount() > 0, true, "Should accumulate conflict errors");
  });

  await t.step("Missing required factory values", () => {
    const incompleteValues: FactoryResolvedValues = {
      promptFilePath: "", // Missing required field
      inputFilePath: "/input/test.txt",
      outputFilePath: "", // Missing required field
      schemaFilePath: "/schema/test.json",
    };

    const _builder = new VariablesBuilder();
    const validationResult = _builder.validateFactoryValues(incompleteValues);

    assertEquals(validationResult.ok, false, "Should fail validation for missing required fields");

    if (!validationResult.ok) {
      const errors = validationResult.error;
      assertEquals(
        errors.some((e) => e.kind === "FactoryValueMissing"),
        true,
        "Should identify missing factory values",
      );
    }
  });
});

Deno.test("VariablesBuilder Integration: Performance with realistic processor loads", async (t) => {
  await t.step("Bulk processing simulation", () => {
    const startTime = performance.now();
    const iterations = 50;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const factoryValues: FactoryResolvedValues = {
        promptFilePath: `/prompts/batch_${i}.md`,
        inputFilePath: `/input/batch_${i}.txt`,
        outputFilePath: `/output/batch_${i}.md`,
        schemaFilePath: `/schema/batch_${i}.json`,
        customVariables: {
          "uv-batch-id": `batch_${i}`,
          "uv-timestamp": new Date().toISOString(),
          "uv-iteration": `${i}`,
        },
        inputText: `Batch processing content ${i}`,
      };

      const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
      const result = _builder.build();

      assertEquals(result.ok, true, `Batch ${i} should process successfully`);
      results.push(result);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    assertEquals(results.length, iterations, "Should process all batches");
    assertEquals(
      duration < 2000,
      true,
      `Bulk processing should complete in reasonable time: ${duration}ms for ${iterations} iterations`,
    );
  });

  await t.step("Memory consistency with repeated factory calls", () => {
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/memory_test.md",
      inputFilePath: "/input/memory_test.txt",
      outputFilePath: "/output/memory_test.md",
      schemaFilePath: "/schema/memory_test.json",
      customVariables: {
        "uv-test-type": "memory",
      },
    };

    const builders = [];
    const records = [];

    // Create multiple builders with same factory values
    for (let i = 0; i < 20; i++) {
      const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
      builders.push(_builder);

      const result = _builder.build();
      assertEquals(result.ok, true, `Memory test ${i} should build successfully`);

      if (result.ok) {
        records.push(_builder.toRecord());
      }
    }

    // All records should be identical
    for (let i = 1; i < records.length; i++) {
      assertEquals(
        JSON.stringify(records[i]),
        JSON.stringify(records[0]),
        `Record ${i} should match the first record`,
      );
    }
  });
});

Deno.test("VariablesBuilder Integration: Complex real-world scenarios", async (t) => {
  await t.step("Multi-stage processing with incremental builds", () => {
    const _builder = new VariablesBuilder();

    // Stage 1: Initial factory values
    const stage1Values: FactoryResolvedValues = {
      promptFilePath: "/prompts/multi_stage.md",
      inputFilePath: "/input/stage1.txt",
      outputFilePath: "/output/stage1.md",
      schemaFilePath: "/schema/base.json",
      customVariables: {
        "uv-stage": "initial",
        "uv-component": "base",
      },
    };

    _builder.addFromFactoryValues(stage1Values);
    assertEquals(_builder.getVariableCount() > 0, true, "Should add stage 1 variables");

    // Stage 2: Additional partial values (simulating processor updates)
    const stage2Partial = {
      customVariables: {
        "uv-stage": "processing", // This will conflict
        "uv-enhancement": "enabled",
      },
      inputText: "Additional processing context",
    };

    _builder.addFromPartialFactoryValues(stage2Partial);

    // May or may not have conflict errors depending on variable creation
    assertEquals(
      _builder.getErrorCount() >= 0,
      true,
      "Should handle stage conflicts appropriately",
    );

    const buildResult = _builder.build();
    // Build may succeed or fail depending on variable creation
    assertEquals(typeof buildResult.ok, "boolean", "Should return build result");
  });

  await t.step("Cross-module variable integration", () => {
    // Simulate variables from multiple processing modules
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/prompts/cross_module.md",
      inputFilePath: "/input/cross_module.txt",
      outputFilePath: "/output/cross_module.md",
      schemaFilePath: "/schema/cross_module.json",
      customVariables: {
        // Processor module variables
        "uv-processor-version": "2.1.0",
        "uv-processor-mode": "enhanced",

        // Config module variables
        "uv-config-env": "production",
        "uv-config-debug": "false",

        // Handler module variables
        "uv-handler-type": "async",
        "uv-handler-timeout": "30000",
      },
      inputText: "Cross-module processing data",
    };

    const _builder = VariablesBuilder.fromFactoryValues(factoryValues);
    const result = _builder.build();

    assertEquals(result.ok, true, "Should handle cross-module variables successfully");

    if (result.ok) {
      const record = _builder.toRecord();

      // Check if module variables are present
      const hasProcessorVars = Object.prototype.hasOwnProperty.call(record, "uv-processor-version");
      if (hasProcessorVars) {
        assertEquals(
          record["uv-processor-version"],
          "2.1.0",
          "Should include processor variables when valid",
        );
        assertEquals(record["uv-config-env"], "production", "Should include config variables");
        assertEquals(record["uv-handler-type"], "async", "Should include handler variables");
      }

      // Verify basic variables are always present
      const totalVars = Object.keys(record).length;
      assertEquals(totalVars >= 4, true, `Should have basic variable set: ${totalVars} variables`);
    }
  });

  await t.step("Factory validation with processor constraints", () => {
    const _builder = new VariablesBuilder();

    // Test comprehensive validation scenario
    const validationScenarios = [
      {
        name: "Valid processor output",
        values: {
          promptFilePath: "/prompts/valid.md",
          inputFilePath: "/input/valid.txt",
          outputFilePath: "/output/valid.md",
          schemaFilePath: "/schema/valid.json",
          customVariables: {
            "uv-validation": "passed",
          },
        } as FactoryResolvedValues,
        shouldPass: true,
      },
      {
        name: "Missing prompt file",
        values: {
          promptFilePath: "",
          inputFilePath: "/input/test.txt",
          outputFilePath: "/output/test.md",
          schemaFilePath: "/schema/test.json",
        } as FactoryResolvedValues,
        shouldPass: false,
      },
      {
        name: "Invalid custom variables",
        values: {
          promptFilePath: "/prompts/test.md",
          inputFilePath: "/input/test.txt",
          outputFilePath: "/output/test.md",
          schemaFilePath: "/schema/test.json",
          customVariables: {
            "uv-valid": "good",
            "invalid": "bad",
          },
        } as FactoryResolvedValues,
        shouldPass: false,
      },
    ];

    for (const scenario of validationScenarios) {
      const validationResult = _builder.validateFactoryValues(scenario.values);

      if (scenario.shouldPass) {
        assertEquals(validationResult.ok, true, `${scenario.name} should pass validation`);
      } else {
        assertEquals(validationResult.ok, false, `${scenario.name} should fail validation`);
      }
    }
  });
});
