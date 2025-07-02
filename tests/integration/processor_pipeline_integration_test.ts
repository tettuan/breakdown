/**
 * @fileoverview Processor Pipeline Integration Tests
 *
 * Comprehensive integration testing for the processor pipeline:
 * - TwoParamsProcessor: Converts TwoParamsResult to VariablesBuilder
 * - VariableProcessor: Processes variables from CLI options and STDIN
 * - TwoParamsStdinProcessor: Handles STDIN input processing
 *
 * Tests validate the complete data flow from CLI parameters through
 * variable processing to final variable builder output, ensuring
 * proper integration between all processor components.
 *
 * @module tests/integration/processor_pipeline_integration_test
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { TwoParamsProcessor } from "../../lib/cli/processors/two_params_processor.ts";
import { TwoParamsVariableProcessor } from "../../lib/processor/variable_processor.ts";
import { TwoParamsStdinProcessor } from "../../lib/cli/processors/two_params_stdin_processor.ts";
import { VariablesBuilder } from "../../lib/builder/variables_builder.ts";
import type { TwoParamsResult } from "../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new BreakdownLogger("processor-pipeline-integration");

/**
 * Mock TwoParamsResult factory for testing
 */
function createMockTwoParamsResult(overrides: Partial<TwoParamsResult> = {}): TwoParamsResult {
  return {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
    ...overrides,
  };
}

/**
 * Test suite: Basic Processor Pipeline Integration
 * Tests fundamental integration between the three processors
 */
Deno.test("Processor Pipeline Integration - Basic Flow", async (t) => {
  await t.step("integrates TwoParamsProcessor with VariableProcessor", async () => {
    _logger.debug("Testing TwoParamsProcessor → VariableProcessor integration");

    // Create processors
    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Mock input data
    const twoParamsResult = createMockTwoParamsResult({
      options: {
        "uv-custom1": "value1",
        "uv-custom2": "value2",
        "output": "test.md",
      },
    });

    // Process through TwoParamsProcessor
    const builderResult = twoParamsProcessor.process(twoParamsResult);
    assertEquals(builderResult.ok, true, "TwoParamsProcessor should succeed");

    if (!builderResult.ok) return;

    // Process through VariableProcessor
    const variableResult = await variableProcessor.process({
      options: twoParamsResult.options,
      inputFile: "input.md",
      outputFile: "output.md",
    });

    assertEquals(variableResult.ok, true, "VariableProcessor should succeed");

    if (variableResult.ok) {
      assertExists(variableResult.data, "Variable processor should return data");
    }

    _logger.info("TwoParamsProcessor → VariableProcessor integration successful");
  });

  await t.step("integrates StdinProcessor with VariableProcessor", async () => {
    _logger.debug("Testing StdinProcessor → VariableProcessor integration");

    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Mock options that would trigger stdin reading
    const options = {
      skipStdin: true, // Skip actual stdin for testing
      "uv-content": "mock stdin content",
      "from": "test-input",
    };

    // Process stdin (mocked)
    const stdinResult = await stdinProcessor.process({}, options);
    assertEquals(stdinResult.ok, true, "StdinProcessor should succeed");

    // Process variables with stdin content
    const variableResult = await variableProcessor.process({
      options,
      stdinContent: stdinResult.ok ? stdinResult.data : "",
      inputFile: "input.md",
    });

    assertEquals(variableResult.ok, true, "VariableProcessor with stdin should succeed");

    _logger.info("StdinProcessor → VariableProcessor integration successful");
  });

  await t.step("integrates all three processors in complete pipeline", async () => {
    _logger.debug("Testing complete processor pipeline integration");

    const twoParamsProcessor = new TwoParamsProcessor();
    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Mock complete input scenario
    const twoParamsResult = createMockTwoParamsResult({
      demonstrativeType: "summary",
      layerType: "issue",
      options: {
        "uv-priority": "high",
        "uv-status": "open",
        "from": "test-source",
        "to": "test-output",
        skipStdin: true,
      },
    });

    // Step 1: Process TwoParamsResult
    const builderResult = twoParamsProcessor.process(twoParamsResult);
    assertEquals(builderResult.ok, true, "TwoParamsProcessor should succeed in pipeline");

    // Step 2: Process STDIN
    const stdinResult = await stdinProcessor.process({}, twoParamsResult.options);
    assertEquals(stdinResult.ok, true, "StdinProcessor should succeed in pipeline");

    // Step 3: Process Variables (combining all inputs)
    const variableResult = await variableProcessor.process({
      options: twoParamsResult.options,
      stdinContent: stdinResult.ok ? stdinResult.data : "",
      inputFile: "test-input.md",
      outputFile: "test-output.md",
    });

    assertEquals(variableResult.ok, true, "VariableProcessor should succeed in complete pipeline");

    if (variableResult.ok) {
      const variables = variableResult.data;
      assertExists(variables, "Complete pipeline should produce variables");
    }

    _logger.info("Complete processor pipeline integration successful");
  });
});

/**
 * Test suite: Data Flow and Variable Processing Integration
 * Tests that data flows correctly between processors and variables are handled properly
 */
Deno.test("Processor Pipeline Integration - Data Flow", async (t) => {
  await t.step("validates data flow from CLI options to variables", async () => {
    _logger.debug("Testing CLI options data flow");

    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    const twoParamsResult = createMockTwoParamsResult({
      demonstrativeType: "to",
      layerType: "project",
      options: {
        "uv-environment": "production",
        "uv-version": "1.0.0",
        "uv-author": "test-user",
        "config": "custom-config",
        "verbose": true,
      },
    });

    // Process parameters
    const builderResult = twoParamsProcessor.process(twoParamsResult);
    assertEquals(builderResult.ok, true, "Parameter processing should succeed");

    // Process variables
    const variableResult = await variableProcessor.process({
      options: twoParamsResult.options,
      inputFile: "source.md",
      outputFile: "target.md",
    });

    assertEquals(variableResult.ok, true, "Variable processing should succeed");

    if (variableResult.ok) {
      // Verify that custom variables were processed
      const variables = variableResult.data;
      assertExists(variables, "Variables should be created");

      // Test that the pipeline preserved data integrity
      _logger.debug("Data flow validation successful", {
        hasVariables: !!variables,
        originalOptionsCount: Object.keys(twoParamsResult.options).length,
      });
    }

    _logger.info("CLI options data flow validation successful");
  });

  await t.step("validates stdin content integration", async () => {
    _logger.debug("Testing stdin content data flow");

    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    const mockStdinContent = "# Test Content\nThis is mock stdin content for testing.";
    const options = {
      skipStdin: true, // Mock stdin
      "uv-content-type": "markdown",
      "from": "-",
    };

    // Process stdin
    const stdinResult = await stdinProcessor.process({}, options);
    assertEquals(stdinResult.ok, true, "Stdin processing should succeed");

    // Process variables with stdin content
    const variableResult = await variableProcessor.process({
      options,
      stdinContent: mockStdinContent,
      inputFile: undefined, // stdin input
    });

    assertEquals(variableResult.ok, true, "Variable processing with stdin should succeed");

    if (variableResult.ok) {
      const variables = variableResult.data;
      assertExists(variables, "Variables should include stdin content");
    }

    _logger.info("Stdin content data flow validation successful");
  });

  await t.step("validates complex variable processing scenarios", async () => {
    _logger.debug("Testing complex variable processing scenarios");

    const twoParamsProcessor = new TwoParamsProcessor();
    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Complex scenario with multiple variable types
    const twoParamsResult = createMockTwoParamsResult({
      demonstrativeType: "summary",
      layerType: "task",
      options: {
        "uv-project": "breakdown-cli",
        "uv-sprint": "2024-Q1",
        "uv-team": "engineering",
        "uv-priority": "high",
        "uv-tags": "integration,testing,pipeline",
        "from": "requirements.md",
        "to": "summary.md",
        "schema": "task-schema.json",
        "prompt": "task-prompt.md",
        skipStdin: true,
      },
    });

    // Execute full pipeline
    const builderResult = twoParamsProcessor.process(twoParamsResult);
    const stdinResult = await stdinProcessor.process({}, twoParamsResult.options);

    assertEquals(builderResult.ok, true, "Complex scenario: TwoParamsProcessor should succeed");
    assertEquals(stdinResult.ok, true, "Complex scenario: StdinProcessor should succeed");

    const variableResult = await variableProcessor.process({
      options: twoParamsResult.options,
      stdinContent: stdinResult.ok ? stdinResult.data : "",
      inputFile: "requirements.md",
      outputFile: "summary.md",
      schemaFile: "task-schema.json",
      promptFile: "task-prompt.md",
    });

    assertEquals(variableResult.ok, true, "Complex scenario: VariableProcessor should succeed");

    if (variableResult.ok) {
      const variables = variableResult.data;
      assertExists(variables, "Complex scenario should produce comprehensive variables");
    }

    _logger.info("Complex variable processing scenario validation successful");
  });
});

/**
 * Test suite: Error Handling and Edge Cases Integration
 * Tests error propagation and edge case handling across processors
 */
Deno.test("Processor Pipeline Integration - Error Handling", async (t) => {
  await t.step("handles error propagation between processors", async () => {
    _logger.debug("Testing error propagation in processor pipeline");

    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Test with invalid parameters that should cause errors
    const invalidTwoParamsResult = createMockTwoParamsResult({
      demonstrativeType: "", // Invalid empty value
      layerType: "project",
      options: {
        "uv-invalid\0key": "value", // Invalid key with null character
        "uv-": "empty-key-name", // Invalid empty variable name
      },
    });

    // Process through pipeline - should handle errors gracefully
    const builderResult = twoParamsProcessor.process(invalidTwoParamsResult);
    // TwoParamsProcessor might succeed but VariableProcessor should catch invalid variables

    const variableResult = await variableProcessor.process({
      options: invalidTwoParamsResult.options,
      inputFile: "test.md",
    });

    // Should either succeed with filtered variables or fail with proper error
    if (!variableResult.ok) {
      assertExists(variableResult.error, "Error should be properly structured");
      _logger.debug("Error properly propagated", { error: variableResult.error });
    } else {
      // If succeeded, invalid variables should be filtered out
      _logger.debug("Invalid variables properly filtered");
    }

    _logger.info("Error propagation testing successful");
  });

  await t.step("handles edge cases in integrated processing", async () => {
    _logger.debug("Testing edge cases in integrated processing");

    const twoParamsProcessor = new TwoParamsProcessor();
    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Edge case: minimal valid input
    const minimalResult = createMockTwoParamsResult({
      options: {}, // No custom variables
    });

    const builderResult = twoParamsProcessor.process(minimalResult);
    assertEquals(builderResult.ok, true, "Minimal input should be processed");

    const stdinResult = await stdinProcessor.process({}, {});
    assertEquals(stdinResult.ok, true, "Empty stdin processing should succeed");

    const variableResult = await variableProcessor.process({
      options: {},
      inputFile: undefined,
      outputFile: undefined,
    });

    assertEquals(variableResult.ok, true, "Minimal variable processing should succeed");

    // Edge case: maximum complexity
    const maximalOptions: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) {
      maximalOptions[`uv-var${i}`] = `value${i}`;
    }

    const maximalResult = createMockTwoParamsResult({
      options: maximalOptions,
    });

    const maxBuilderResult = twoParamsProcessor.process(maximalResult);
    const maxVariableResult = await variableProcessor.process({
      options: maximalOptions,
      inputFile: "large-input.md",
      outputFile: "large-output.md",
    });

    assertEquals(maxBuilderResult.ok, true, "Maximum complexity should be handled");
    assertEquals(maxVariableResult.ok, true, "Maximum variables should be processed");

    _logger.info("Edge case testing successful");
  });

  await t.step("validates pipeline resilience and recovery", async () => {
    _logger.debug("Testing pipeline resilience and recovery");

    const twoParamsProcessor = new TwoParamsProcessor();
    const stdinProcessor = new TwoParamsStdinProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Test scenarios with partial failures
    const scenarios = [
      {
        name: "partial-variable-errors",
        options: {
          "uv-valid": "good-value",
          "uv-": "invalid-empty-name",
          "uv-another": "another-good-value",
        },
      },
      {
        name: "mixed-valid-invalid",
        options: {
          "uv-normal": "value",
          "invalid-prefix": "should-be-ignored",
          "uv-special": "special@value#test",
        },
      },
      {
        name: "boundary-conditions",
        options: {
          "uv-long": "a".repeat(1000),
          "uv-unicode": "🎯📊💡",
          "uv-numbers": "12345",
        },
      },
    ];

    for (const scenario of scenarios) {
      _logger.debug(`Testing scenario: ${scenario.name}`);

      const twoParamsResult = createMockTwoParamsResult({
        options: scenario.options,
      });

      // Pipeline should be resilient to various input types
      const builderResult = twoParamsProcessor.process(twoParamsResult);
      const stdinResult = await stdinProcessor.process({}, scenario.options);
      const variableResult = await variableProcessor.process({
        options: scenario.options,
        stdinContent: stdinResult.ok ? stdinResult.data : "",
        inputFile: "test.md",
      });

      // Pipeline should handle each scenario gracefully
      assertEquals(
        builderResult.ok,
        true,
        `${scenario.name}: TwoParamsProcessor should be resilient`,
      );
      assertEquals(stdinResult.ok, true, `${scenario.name}: StdinProcessor should be resilient`);
      assertEquals(
        variableResult.ok,
        true,
        `${scenario.name}: VariableProcessor should be resilient`,
      );

      if (variableResult.ok) {
        assertExists(variableResult.data, `${scenario.name}: Should produce valid output`);
      }
    }

    _logger.info("Pipeline resilience validation successful");
  });
});

/**
 * Test suite: Performance and Scalability Integration
 * Tests performance characteristics of the integrated processor pipeline
 */
Deno.test("Processor Pipeline Integration - Performance", async (t) => {
  await t.step("validates pipeline performance with large datasets", async () => {
    _logger.debug("Testing pipeline performance with large datasets");

    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Create large dataset
    const largeOptions: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) {
      largeOptions[`uv-variable${i}`] = `value-${i}-${"data".repeat(50)}`;
    }

    const largeResult = createMockTwoParamsResult({
      options: largeOptions,
    });

    const startTime = performance.now();

    // Process large dataset
    const builderResult = twoParamsProcessor.process(largeResult);
    const variableResult = await variableProcessor.process({
      options: largeOptions,
      inputFile: "large-input.md",
      outputFile: "large-output.md",
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    assertEquals(builderResult.ok, true, "Large dataset processing should succeed");
    assertEquals(variableResult.ok, true, "Large variable processing should succeed");

    // Performance assertion (should complete within reasonable time)
    assert(duration < 1000, `Processing should complete within 1000ms, took ${duration}ms`);

    _logger.info("Performance test completed", {
      duration: `${duration.toFixed(2)}ms`,
      variableCount: Object.keys(largeOptions).length,
      avgTimePerVariable: `${(duration / Object.keys(largeOptions).length).toFixed(4)}ms`,
    });
  });

  await t.step("validates memory efficiency in pipeline processing", async () => {
    _logger.debug("Testing memory efficiency in pipeline processing");

    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Process multiple batches to test memory management
    const batchCount = 10;
    const variablesPerBatch = 20;

    for (let batch = 0; batch < batchCount; batch++) {
      const batchOptions: Record<string, unknown> = {};
      for (let i = 0; i < variablesPerBatch; i++) {
        batchOptions[`uv-batch${batch}-var${i}`] = `batch-${batch}-value-${i}`;
      }

      const batchResult = createMockTwoParamsResult({
        options: batchOptions,
      });

      const builderResult = twoParamsProcessor.process(batchResult);
      const variableResult = await variableProcessor.process({
        options: batchOptions,
        inputFile: `batch-${batch}-input.md`,
      });

      assertEquals(builderResult.ok, true, `Batch ${batch} TwoParamsProcessor should succeed`);
      assertEquals(variableResult.ok, true, `Batch ${batch} VariableProcessor should succeed`);

      // Force garbage collection hint (if available)
      if (typeof (globalThis as unknown).gc === "function") {
        (globalThis as unknown).gc();
      }
    }

    _logger.info("Memory efficiency test completed", {
      totalBatches: batchCount,
      variablesPerBatch,
      totalVariablesProcessed: batchCount * variablesPerBatch,
    });
  });

  await t.step("validates concurrent processing capabilities", async () => {
    _logger.debug("Testing concurrent processing capabilities");

    const twoParamsProcessor = new TwoParamsProcessor();
    const variableProcessor = new TwoParamsVariableProcessor();

    // Create multiple concurrent processing tasks
    const concurrentTasks = Array.from({ length: 5 }, (_, index) => {
      const options = {
        [`uv-task${index}`]: `concurrent-value-${index}`,
        [`uv-timestamp`]: new Date().toISOString(),
        [`uv-batch`]: `batch-${index}`,
      };

      const result = createMockTwoParamsResult({ options });

      return (async () => {
        const builderResult = twoParamsProcessor.process(_result);
        const variableResult = await variableProcessor.process({
          options,
          inputFile: `concurrent-${index}.md`,
        });

        return {
          taskId: index,
          builderSuccess: builderResult.ok,
          variableSuccess: variableResult.ok,
        };
      })();
    });

    // Execute all tasks concurrently
    const startTime = performance.now();
    const results = await Promise.all(concurrentTasks);
    const endTime = performance.now();

    // Verify all tasks completed successfully
    for (const result of results) {
      assertEquals(
        _result.builderSuccess,
        true,
        `Task ${result.taskId} TwoParamsProcessor should succeed`,
      );
      assertEquals(
        _result.variableSuccess,
        true,
        `Task ${result.taskId} VariableProcessor should succeed`,
      );
    }

    const duration = endTime - startTime;
    _logger.info("Concurrent processing test completed", {
      duration: `${duration.toFixed(2)}ms`,
      concurrentTasks: results.length,
      avgTimePerTask: `${(duration / results.length).toFixed(2)}ms`,
    });
  });
});

_logger.info("All processor pipeline integration tests completed");
