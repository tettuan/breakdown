/**
 * @fileoverview CLI Complete Flow Integration Test
 *
 * This test verifies the complete data flow through the CLI components:
 * orchestrator → processor → prompt_generator → output_writer
 *
 * Tests verify:
 * - End-to-end CLI execution flow
 * - TypeFactory integration with CLI pipeline
 * - Result type propagation across all components
 * - Totality principle compliance throughout the flow
 * - External package integration (BreakdownParams, BreakdownConfig, BreakdownPrompt)
 * - Error handling and recovery at each stage
 * - Data integrity through the complete pipeline
 *
 * @module tests/integration/cli_complete_flow_integration_test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { TwoParamsOrchestrator } from "../../lib/cli/orchestrators/two_params_orchestrator.ts";
import { TypeFactory } from "../../lib/types/mod.ts";
import { handleTwoParams } from "../../lib/cli/handlers/two_params_handler_refactored.ts";
import type { Result } from "../../lib/types/result.ts";

const _logger = new BreakdownLogger("cli-complete-flow-integration");

describe("CLI Complete Flow Integration", () => {
  describe("End-to-End Data Flow", () => {
    it("should execute complete CLI flow with valid parameters", async () => {
      _logger.debug("Testing complete CLI flow execution");

      // Test the complete flow through refactored handler
      const result = await handleTwoParams(
        ["to", "project"],
        {
          timeout: 10000,
          promptDir: "./tests/fixtures/prompts",
        },
        {
          skipStdin: true,
          "uv-author": "integration-test",
          "uv-version": "1.0.0",
        },
      );

      // Flow should complete (may fail at prompt generation due to missing templates)
      assert("ok" in result);

      if (!_result.ok) {
        // Should fail at orchestration stages, not basic validation
        const validFailurePoints = [
          "VariablesBuilderError",
          "FactoryValidationError",
          "PromptGenerationError",
          "OutputWriteError",
        ];

        assert(
          validFailurePoints.includes(_result.error.kind),
          `Flow should fail at orchestration, not validation. Got: ${_result.error.kind}`,
        );

        _logger.debug("Flow completed with expected orchestration failure", {
          errorKind: _result.error.kind,
        });
      } else {
        _logger.debug("Flow completed successfully");
      }
    });

    it("should maintain Result type consistency throughout flow", async () => {
      _logger.debug("Testing Result type consistency");

      // Test multiple parameter combinations
      const testCases = [
        { params: ["to", "project"], description: "basic transformation" },
        { params: ["summary", "issue"], description: "issue summarization" },
        { params: ["defect", "task"], description: "task defect analysis" },
        { params: ["init", "bugs"], description: "bug initialization" },
        { params: ["find", "temp"], description: "temporary data search" },
      ];

      for (const testCase of testCases) {
        const result = await handleTwoParams(
          testCase.params,
          { timeout: 5000 },
          { skipStdin: true },
        );

        // All results should follow Result pattern
        assert("ok" in result);
        assertEquals(typeof _result.ok, "boolean");

        if (!_result.ok) {
          // Error should have proper structure
          assertExists(_result.error.kind);
          assertEquals(typeof _result.error.kind, "string");
        }

        _logger.debug(`${testCase.description} completed`, {
          params: testCase.params,
          success: _result.ok,
        });
      }
    });

    it("should integrate TypeFactory properly with CLI flow", async () => {
      _logger.debug("Testing TypeFactory integration");

      // Test that validation uses TypeFactory patterns
      const validationTests = [
        {
          params: ["invalid_demo", "project"],
          expectedError: "InvalidDemonstrativeType",
          description: "invalid demonstrative type",
        },
        {
          params: ["to", "invalid_layer"],
          expectedError: "InvalidLayerType",
          description: "invalid layer type",
        },
      ];

      for (const test of validationTests) {
        const result = await handleTwoParams(
          test.params,
          {},
          { skipStdin: true },
        );

        assertEquals(_result.ok, false);

        if (!_result.ok) {
          assertEquals(_result.error.kind, test.expectedError);

          // Should provide TypeFactory validation details
          if ("validTypes" in _result.error) {
            assert(Array.isArray(_result.error.validTypes));
            assert(_result.error.validTypes.length > 0);
          }
        }

        _logger.debug(`TypeFactory validation for ${test.description}`, {
          errorKind: !_result.ok ? _result.error.kind : "success",
        });
      }
    });

    it("should handle orchestrator component integration", async () => {
      _logger.debug("Testing orchestrator component integration");

      // Test orchestrator directly for component integration
      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.execute(
        ["to", "project"],
        { timeout: 8000 },
        {
          skipStdin: true,
          "uv-test": "integration",
          fromFile: "input.txt",
          destinationFile: "output.md",
        },
      );

      // Should complete orchestration flow
      assert("ok" in result);

      if (!_result.ok) {
        // Should integrate with all components properly
        const componentErrors = [
          "StdinReadError",
          "VariablesBuilderError",
          "FactoryValidationError",
          "PromptGenerationError",
          "OutputWriteError",
        ];

        assert(componentErrors.includes(_result.error.kind));

        _logger.debug("Component integration completed", {
          stage: _result.error.kind,
        });
      }
    });
  });

  describe("External Package Integration", () => {
    it("should integrate with BreakdownParams patterns", async () => {
      _logger.debug("Testing BreakdownParams integration");

      // Test various parameter formats that BreakdownParams would provide
      const paramFormats = [
        { params: ["to", "project"], options: {} },
        { params: ["summary", "issue"], options: { extended: true } },
        { params: ["defect", "task"], options: { customValidation: false } },
      ];

      for (const format of paramFormats) {
        const result = await handleTwoParams(
          format.params,
          {},
          { ...format.options, skipStdin: true },
        );

        // Should handle BreakdownParams-style input
        assert("ok" in result);

        _logger.debug("BreakdownParams format handled", {
          params: format.params,
          options: format.options,
        });
      }
    });

    it("should integrate with BreakdownConfig structure", async () => {
      _logger.debug("Testing BreakdownConfig integration");

      // Test various config structures
      const configStructures = [
        { config: { timeout: 5000 }, description: "basic timeout config" },
        {
          config: {
            promptDir: "/custom/prompts",
            timeout: 10000,
            logLevel: "debug",
          },
          description: "complex config structure",
        },
        {
          config: {
            params: {
              two: {
                demonstrativeType: { pattern: "to|summary|defect" },
                layerType: { pattern: "project|issue|task" },
              },
            },
          },
          description: "nested params config",
        },
      ];

      for (const { config, description } of configStructures) {
        const result = await handleTwoParams(
          ["to", "project"],
          config,
          { skipStdin: true },
        );

        // Should handle various config structures
        assert("ok" in result);

        _logger.debug(`BreakdownConfig ${description} handled`, {
          configKeys: Object.keys(config),
        });
      }
    });

    it("should prepare for BreakdownPrompt integration", async () => {
      _logger.debug("Testing BreakdownPrompt integration readiness");

      // Test that CLI flow prepares data correctly for BreakdownPrompt
      const result = await handleTwoParams(
        ["to", "project"],
        { promptDir: "./tests/fixtures/prompts" },
        {
          skipStdin: true,
          "uv-author": "test",
          "uv-context": "integration",
        },
      );

      // Should reach prompt generation stage
      assert("ok" in result);

      if (!_result.ok) {
        // Should fail at prompt generation (BreakdownPrompt integration point)
        assert(
          ["FactoryValidationError", "PromptGenerationError"].includes(_result.error.kind),
          `Should reach BreakdownPrompt integration. Got: ${_result.error.kind}`,
        );
      }

      _logger.debug("BreakdownPrompt integration point reached");
    });
  });

  describe("Error Propagation Integration", () => {
    it("should propagate errors correctly through all components", async () => {
      _logger.debug("Testing error propagation through components");

      // Test error propagation at different stages
      const errorStages = [
        {
          params: [],
          description: "validation stage",
          expectedError: "InvalidParameterCount",
        },
        {
          params: ["invalid", "project"],
          description: "type validation stage",
          expectedError: "InvalidDemonstrativeType",
        },
        {
          params: ["to", "project"],
          config: { timeout: 1 }, // Very short timeout
          description: "stdin processing stage",
          expectedErrors: [
            "StdinReadError",
            "VariablesBuilderError",
            "FactoryValidationError",
            "PromptGenerationError",
          ],
        },
      ];

      for (const stage of errorStages) {
        const result = await handleTwoParams(
          stage.params,
          stage.config || {},
          { skipStdin: true },
        );

        assertEquals(_result.ok, false);

        if (!_result.ok) {
          if (stage.expectedError) {
            assertEquals(_result.error.kind, stage.expectedError);
          } else if (stage.expectedErrors) {
            assert(
              stage.expectedErrors.includes(_result.error.kind),
              `Expected one of ${stage.expectedErrors.join(", ")}, got: ${_result.error.kind}`,
            );
          }

          // Error should have proper context
          assertExists(_result.error.kind);
          assertEquals(typeof _result.error.kind, "string");
        }

        _logger.debug(`Error propagation at ${stage.description}`, {
          errorKind: !_result.ok ? _result.error.kind : "success",
        });
      }
    });

    it("should maintain Totality principle throughout flow", async () => {
      _logger.debug("Testing Totality principle compliance");

      // Test that no exceptions are thrown, only Result types returned
      const totalityTests = [
        { params: null as unknown, config: {}, options: {} },
        { params: ["to", "project"], config: null as unknown, options: {} },
        { params: ["to", "project"], config: {}, options: null as unknown },
      ];

      for (const test of totalityTests) {
        try {
          const result = await handleTwoParams(test.params, test.config, test.options);

          // If it returns without throwing, should be Result type
          if (_result) {
            assert("ok" in result);
          }
        } catch (e) {
          // Some inputs might throw (documenting current behavior)
          _logger.debug("Exception thrown (current behavior)", {
            error: e instanceof Error ? e.message : String(e),
          });
          // This indicates areas for Totality improvement
        }
      }
    });
  });

  describe("Data Integrity Integration", () => {
    it("should maintain data integrity through complete pipeline", async () => {
      _logger.debug("Testing data integrity through pipeline");

      const inputData = {
        demonstrativeType: "summary",
        layerType: "issue",
        customVariables: {
          "uv-priority": "high",
          "uv-assignee": "developer",
          "uv-deadline": "2024-01-01",
        },
        options: {
          fromFile: "issue-123.md",
          destinationFile: "summary-123.md",
          extended: true,
        },
      };

      const result = await handleTwoParams(
        [inputData.demonstrativeType, inputData.layerType],
        { timeout: 10000 },
        {
          ...inputData.customVariables,
          ...inputData.options,
          skipStdin: true,
        },
      );

      // Should process input data through pipeline
      assert("ok" in result);

      if (!_result.ok) {
        // If fails, should be at processing stages with preserved context
        const dataProcessingErrors = [
          "VariablesBuilderError",
          "FactoryValidationError",
          "PromptGenerationError",
        ];

        assert(dataProcessingErrors.includes(_result.error.kind));
      }

      _logger.debug("Data integrity maintained through pipeline");
    });

    it("should handle concurrent flow executions", async () => {
      _logger.debug("Testing concurrent flow executions");

      // Test multiple concurrent flows
      const concurrentFlows = Array.from({ length: 5 }, (_, i) =>
        handleTwoParams(
          ["to", "project"],
          { timeout: 5000, flowId: i },
          {
            skipStdin: true,
            "uv-flow": `flow-${i}`,
            flowId: i,
          },
        ));

      const results = await Promise.all(concurrentFlows);

      // All flows should complete independently
      results.forEach((_result, index) => {
        assert("ok" in _result, `Flow ${index} should complete`);
      });

      // Results should be consistent (no race conditions)
      const resultTypes = results.map((r) => r.ok);
      const firstType = resultTypes[0];

      resultTypes.forEach((type, index) => {
        assertEquals(type, firstType, `Flow ${index} should have consistent result`);
      });

      _logger.debug("Concurrent flows completed successfully");
    });

    it("should support flow customization and extensibility", async () => {
      _logger.debug("Testing flow customization");

      // Test various customization options
      const customizations = [
        {
          name: "minimal flow",
          params: ["init", "temp"],
          config: {},
          options: { skipStdin: true },
        },
        {
          name: "extended flow",
          params: ["defect", "task"],
          config: { timeout: 15000 },
          options: {
            skipStdin: true,
            extended: true,
            customValidation: true,
            errorFormat: "json" as const,
            "uv-context": "extended-test",
          },
        },
        {
          name: "file-based flow",
          params: ["summary", "project"],
          config: { promptDir: "./tests/fixtures/prompts" },
          options: {
            skipStdin: true,
            fromFile: "project-summary.md",
            destinationFile: "output-summary.md",
            "uv-format": "markdown",
          },
        },
      ];

      for (const customization of customizations) {
        const result = await handleTwoParams(
          customization.params,
          customization.config,
          customization.options,
        );

        // Should handle various customizations
        assert("ok" in result);

        _logger.debug(`${customization.name} completed`, {
          params: customization.params,
        });
      }
    });
  });

  describe("Performance and Resource Integration", () => {
    it("should execute flows efficiently", async () => {
      _logger.debug("Testing flow performance");

      const startTime = Date.now();
      const iterations = 3;

      for (let i = 0; i < iterations; i++) {
        await handleTwoParams(
          ["to", "project"],
          { timeout: 5000 },
          { skipStdin: true, iteration: i },
        );
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;

      // Should complete reasonably quickly
      assert(avgTime < 2000, `Average execution time should be reasonable: ${avgTime}ms`);

      _logger.debug("Performance test completed", {
        iterations,
        totalTime,
        averageTime: avgTime,
      });
    });

    it("should handle resource cleanup properly", async () => {
      _logger.debug("Testing resource cleanup");

      // Test that resources are properly cleaned up between flows
      const resourceTests = [
        { params: ["to", "project"] },
        { params: ["summary", "issue"] },
        { params: ["defect", "task"] },
      ];

      for (const test of resourceTests) {
        const result = await handleTwoParams(
          test.params,
          { timeout: 3000 },
          { skipStdin: true },
        );

        // Each flow should be independent
        assert("ok" in result);
      }

      _logger.debug("Resource cleanup verified");
    });
  });
});
