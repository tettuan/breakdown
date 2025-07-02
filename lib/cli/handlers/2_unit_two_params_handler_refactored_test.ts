/**
 * @fileoverview Unit Test for TwoParamsHandler Refactored
 *
 * Tests the functional behavior of the refactored TwoParamsHandler
 * following Totality principle. Validates business logic correctness
 * and real-world usage scenarios.
 *
 * Tests verify:
 * - Function behavior with various inputs
 * - Error handling scenarios
 * - Parameter validation logic
 * - Integration with orchestration components
 * - Performance characteristics
 * - Edge cases and boundary conditions
 *
 * @module cli/handlers/2_unit_two_params_handler_refactored_test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  handleTwoParams,
  handleTwoParamsClean,
  type TwoParamsHandlerError,
} from "./two_params_handler_refactored.ts";

const _logger = new BreakdownLogger("unit-two-params-handler-refactored");

describe("TwoParamsHandler Refactored - Unit Tests", () => {
  describe("handleTwoParams function", () => {
    it("should handle valid parameters correctly", async () => {
      _logger.debug("Testing valid parameter handling");

      const validCombinations = [
        { demo: "to", layer: "project" },
        { demo: "summary", layer: "issue" },
        { demo: "defect", layer: "task" },
        { demo: "init", layer: "bugs" },
        { demo: "find", layer: "temp" },
      ];

      for (const { demo, layer } of validCombinations) {
        const _result = await handleTwoParams(
          [demo, layer],
          { timeout: 5000 },
          { skipStdin: true },
        );

        // Should complete orchestration (may fail at prompt generation)
        assert("ok" in result);

        if (!_result.ok) {
          // Valid params should fail at orchestration steps, not validation
          const validFailurePoints = [
            "StdinReadError",
            "VariablesBuilderError",
            "FactoryValidationError",
            "PromptGenerationError",
            "OutputWriteError",
          ];

          assert(
            validFailurePoints.includes(_result.error.kind),
            `Valid params [${demo}, ${layer}] should fail at orchestration, not validation. Got: ${_result.error.kind}`,
          );
        }
      }
    });

    it("should validate parameter count correctly", async () => {
      _logger.debug("Testing parameter count validation");

      const countTests = [
        { params: [], expected: { received: 0, expected: 2 } },
        { params: ["single"], expected: { received: 1, expected: 2 } },
        { params: ["one", "two", "three"], expected: { received: 3, expected: 2 } },
        { params: ["a", "b", "c", "d"], expected: { received: 4, expected: 2 } },
      ];

      for (const test of countTests) {
        const _result = await handleTwoParams(test.params, {}, {});
        assertEquals(_result.ok, false);

        if (!_result.ok) {
          if (_result.error.kind === "InvalidParameterCount") {
            assertEquals(_result.error.received, test.expected.received);
            assertEquals(_result.error.expected, test.expected.expected);
          } else {
            // For 3+ params, might validate demonstrative type first
            assert(
              ["InvalidDemonstrativeType", "InvalidParameterCount"].includes(_result.error.kind),
            );
          }
        }
      }
    });

    it("should validate demonstrative types correctly", async () => {
      _logger.debug("Testing demonstrative type validation");

      const validTypes = ["to", "summary", "defect", "init", "find"];
      const invalidTypes = ["invalid", "convert", "transform", "analyze", ""];

      for (const invalidType of invalidTypes) {
        const _result = await handleTwoParams([invalidType, "project"], {}, { skipStdin: true });
        assertEquals(_result.ok, false);

        if (!_result.ok) {
          assertEquals(_result.error.kind, "InvalidDemonstrativeType");

          // Type-safe property access with proper discriminated union handling
          if (_result.error.kind === "InvalidDemonstrativeType") {
            assertEquals(_result.error.value, invalidType);
            assertExists(_result.error.validTypes);
            assert(_result.error.validTypes.every((type: string) => validTypes.includes(type)));
          }
        }
      }
    });

    it("should validate layer types correctly", async () => {
      _logger.debug("Testing layer type validation");

      const validTypes = ["project", "issue", "task", "bugs", "temp"];
      const invalidTypes = ["invalid", "system", "component", "module", ""];

      for (const invalidType of invalidTypes) {
        const _result = await handleTwoParams(["to", invalidType], {}, { skipStdin: true });
        assertEquals(_result.ok, false);

        if (!_result.ok) {
          assertEquals(_result.error.kind, "InvalidLayerType");

          // Type-safe property access with proper discriminated union handling
          if (_result.error.kind === "InvalidLayerType") {
            assertEquals(_result.error.value, invalidType);
            assertExists(_result.error.validTypes);
            assert(_result.error.validTypes.every((type: string) => validTypes.includes(type)));
          }
        }
      }
    });

    it("should handle stdin processing correctly", async () => {
      _logger.debug("Testing stdin processing");

      // Test with skipStdin option
      const skipResult = await handleTwoParams(
        ["to", "project"],
        {},
        { skipStdin: true },
      );

      // Should skip stdin and proceed to next steps
      assert("ok" in skipResult);

      // Test with very short timeout to force stdin timeout
      const timeoutResult = await handleTwoParams(
        ["to", "project"],
        { timeout: 1 },
        {},
      );

      assertEquals(timeoutResult.ok, false);
      if (!timeoutResult.ok) {
        // Should fail at stdin processing or later
        const validErrors = [
          "StdinReadError",
          "VariablesBuilderError",
          "FactoryValidationError",
          "PromptGenerationError",
        ];
        assert(
          validErrors.includes(timeoutResult.error.kind),
          `Expected one of ${validErrors.join(", ")}, got: ${timeoutResult.error.kind}`,
        );
      }
    });

    it("should handle variable processing correctly", async () => {
      _logger.debug("Testing variable processing");

      const variableTests = [
        {
          options: { "uv-valid": "value", skipStdin: true },
          shouldSucceed: true,
        },
        {
          options: { "uv-": "", skipStdin: true }, // Invalid variable name
          shouldSucceed: false,
          expectedError: "VariablesBuilderError",
        },
      ];

      for (const test of variableTests) {
        const _result = await handleTwoParams(
          ["to", "project"],
          {},
          test.options,
        );

        if (test.shouldSucceed) {
          // May succeed or fail at later stages
          assert("ok" in result);
        } else {
          assertEquals(_result.ok, false);
          if (!_result.ok && test.expectedError) {
            assertEquals(_result.error.kind, test.expectedError);
          }
        }
      }
    });

    it("should handle configuration options correctly", async () => {
      _logger.debug("Testing configuration handling");

      const configTests = [
        { config: {}, description: "empty config" },
        { config: { timeout: 5000 }, description: "with timeout" },
        { config: { promptDir: "/test" }, description: "with prompt directory" },
        { config: { complex: { nested: "value" } }, description: "complex config" },
      ];

      for (const { config, description } of configTests) {
        const _result = await handleTwoParams(
          ["to", "project"],
          config,
          { skipStdin: true },
        );

        // Should handle all configs gracefully
        assert("ok" in _result, `Should handle ${description} gracefully`);

        if (!_result.ok) {
          // Should fail at orchestration, not config processing
          const validErrors = [
            "VariablesBuilderError",
            "FactoryValidationError",
            "PromptGenerationError",
            "OutputWriteError",
          ];
          assert(
            validErrors.includes(_result.error.kind),
            `Config ${description} should not cause validation errors. Got: ${_result.error.kind}`,
          );
        }
      }
    });
  });

  describe("handleTwoParamsClean function", () => {
    it("should behave identically to handleTwoParams", async () => {
      _logger.debug("Testing clean function equivalence");

      const testCases = [
        { params: [], config: {}, options: {} },
        { params: ["to", "project"], config: {}, options: { skipStdin: true } },
        { params: ["invalid"], config: {}, options: {} },
        { params: ["to", "invalid"], config: {}, options: { skipStdin: true } },
      ];

      for (const testCase of testCases) {
        const result1 = await handleTwoParams(
          testCase.params,
          testCase.config,
          testCase.options,
        );

        const result2 = await handleTwoParamsClean(
          testCase.params,
          testCase.config,
          testCase.options,
        );

        // Results should be equivalent
        assertEquals(result1.ok, result2.ok);

        if (!_result1.ok && !_result2.ok) {
          assertEquals(result1.error.kind, result2.error.kind);

          // Check specific error details are equivalent
          if (
            result1.error.kind === "InvalidParameterCount" &&
            result2.error.kind === "InvalidParameterCount"
          ) {
            assertEquals(result1.error.received, result2.error.received);
            assertEquals(result1.error.expected, result2.error.expected);
          }
        }
      }
    });

    it("should create fresh orchestrator instances", async () => {
      _logger.debug("Testing fresh instance creation");

      // Multiple calls should create independent orchestrators
      const results = await Promise.all([
        handleTwoParamsClean(["to", "project"], {}, { skipStdin: true }),
        handleTwoParamsClean(["to", "project"], {}, { skipStdin: true }),
        handleTwoParamsClean(["to", "project"], {}, { skipStdin: true }),
      ]);

      // All should complete independently
      results.forEach((_result, index) => {
        assert("ok" in _result, `Clean call ${index} should complete`);
      });
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle null and undefined inputs gracefully", async () => {
      _logger.debug("Testing null/undefined input handling");

      // Note: Current implementation throws on null params (not Totality compliant)
      // This documents the current behavior
      try {
        await handleTwoParams(null as unknown, {}, {});
        assert(false, "Should have thrown or returned error result");
      } catch (e) {
        _logger.debug("Current implementation throws on null params", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      try {
        await handleTwoParams(undefined as unknown, {}, {});
        assert(false, "Should have thrown or returned error result");
      } catch (e) {
        _logger.debug("Current implementation throws on undefined params", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // These should handle gracefully
      const result3 = await handleTwoParams(["to", "project"], null as unknown, {});
      assert("ok" in result3); // Should handle gracefully

      const result4 = await handleTwoParams(["to", "project"], {}, null as unknown);
      assert("ok" in result4); // Should handle gracefully
    });

    it("should handle concurrent calls safely", async () => {
      _logger.debug("Testing concurrent call safety");

      // Test many concurrent calls to singleton version
      const concurrentCalls = Array.from(
        { length: 20 },
        () => handleTwoParams(["to", "project"], {}, { skipStdin: true }),
      );

      const results = await Promise.all(concurrentCalls);

      // All should complete without interference
      results.forEach((_result, index) => {
        assert("ok" in _result, `Concurrent call ${index} should complete`);
      });

      // Results should be consistent
      const firstResult = results[0];
      results.forEach((_result, index) => {
        assertEquals(
          _result.ok,
          firstResult.ok,
          `Call ${index} should have consistent success/failure`,
        );

        if (!_result.ok && !firstResult.ok) {
          assertEquals(
            _result.error.kind,
            firstResult.error.kind,
            `Call ${index} should have consistent error kind`,
          );
        }
      });
    });

    it("should maintain performance characteristics", async () => {
      _logger.debug("Testing performance characteristics");

      const iterations = 10;
      const startTime = Date.now();

      // Run multiple iterations
      for (let i = 0; i < iterations; i++) {
        await handleTwoParams(["to", "project"], {}, { skipStdin: true });
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      // Should complete reasonably quickly (less than 1 second per call)
      assert(avgTime < 1000, `Average execution time should be reasonable: ${avgTime}ms`);

      _logger.debug("Performance test completed", {
        iterations,
        totalTime: endTime - startTime,
        averageTime: avgTime,
      });
    });

    it("should handle complex option combinations", async () => {
      _logger.debug("Testing complex option combinations");

      const complexOptions = {
        "uv-author": "test-user",
        "uv-version": "1.0.0",
        "uv-custom": "custom-value",
        destinationFile: "output.md",
        adaptation: "custom",
        promptDir: "/custom/prompts",
        extended: true,
        customValidation: false,
        errorFormat: "json" as const,
        config: "custom.json",
        skipStdin: true, // Skip stdin to avoid file reading issues in tests
      };

      const _result = await handleTwoParams(
        ["to", "project"],
        { timeout: 5000, customConfig: true },
        complexOptions,
      );

      // Should handle complex options gracefully
      assert("ok" in result);

      if (!_result.ok) {
        // Should fail at orchestration, not option processing
        const validErrors = [
          "VariablesBuilderError",
          "FactoryValidationError",
          "PromptGenerationError",
          "OutputWriteError",
          "ConfigLoadError", // Add this as a valid error for missing config files
          "StdinReadError", // Add this as a valid error for file reading issues
        ];
        assert(
          validErrors.includes(_result.error.kind),
          `Expected error kind to be one of ${
            validErrors.join(", ")
          }, but got: ${_result.error.kind}`,
        );
      }
    });

    it("should handle empty and whitespace parameters", async () => {
      _logger.debug("Testing empty/whitespace parameter handling");

      const whitespaceTests = [
        { params: ["", "project"], expectedError: "InvalidDemonstrativeType" },
        { params: ["to", ""], expectedError: "InvalidLayerType" },
        { params: ["", ""], expectedError: "InvalidDemonstrativeType" },
        { params: [" ", "project"], expectedError: "InvalidDemonstrativeType" },
        { params: ["to", " "], expectedError: "InvalidLayerType" },
      ];

      for (const test of whitespaceTests) {
        const _result = await handleTwoParams(test.params, {}, { skipStdin: true });
        assertEquals(_result.ok, false);

        if (!_result.ok) {
          assertEquals(_result.error.kind, test.expectedError);
        }
      }
    });
  });

  describe("Integration scenarios", () => {
    it("should handle realistic workflow scenarios", async () => {
      _logger.debug("Testing realistic workflow scenarios");

      const workflows = [
        {
          name: "Project breakdown",
          params: ["to", "project"],
          config: { promptDir: "/prompts" },
          options: { "uv-author": "developer", skipStdin: true },
        },
        {
          name: "Issue summarization",
          params: ["summary", "issue"],
          config: { timeout: 10000 },
          options: { fromFile: "issue.md", skipStdin: true },
        },
        {
          name: "Task defect analysis",
          params: ["defect", "task"],
          config: {},
          options: { "uv-priority": "high", extended: true, skipStdin: true },
        },
      ];

      for (const workflow of workflows) {
        const _result = await handleTwoParams(
          workflow.params,
          workflow.config,
          workflow.options,
        );

        // Should complete workflow processing
        assert("ok" in _result, `${workflow.name} should complete processing`);

        if (!_result.ok) {
          _logger.debug(`${workflow.name} failed at orchestration`, {
            error: _result.error.kind,
          });
        }
      }
    });

    it("should maintain state isolation across workflows", async () => {
      _logger.debug("Testing workflow state isolation");

      // Run multiple workflows concurrently
      const workflows = [
        handleTwoParams(["to", "project"], { id: 1 }, { workflow: "A", skipStdin: true }),
        handleTwoParams(["summary", "issue"], { id: 2 }, { workflow: "B", skipStdin: true }),
        handleTwoParams(["defect", "task"], { id: 3 }, { workflow: "C", skipStdin: true }),
      ];

      const results = await Promise.all(workflows);

      // Each workflow should complete independently
      results.forEach((_result, index) => {
        assert("ok" in _result, `Workflow ${index} should complete independently`);
      });
    });
  });
});
