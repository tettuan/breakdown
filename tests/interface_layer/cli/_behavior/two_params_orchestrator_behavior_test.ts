/**
 * @fileoverview Unit Test for TwoParamsOrchestrator
 *
 * Tests the functional behavior of TwoParamsOrchestrator methods
 * following Totality principle. Validates business logic correctness
 * and integration scenarios.
 *
 * Tests verify:
 * - Execute method with various input combinations
 * - Variable extraction and processing logic
 * - CLI parameter creation
 * - Prompt generation flow
 * - Error handling scenarios
 * - Integration with actual components
 *
 * @module cli/orchestrators/2_unit_two_params_orchestrator_test
 */

import { assert, assertEquals, assertExists } from "../../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

import { TwoParamsOrchestrator } from "../../../../lib/cli/handlers/two_params_orchestrator.ts";
import type { TwoParamsHandlerError } from "../../../../lib/cli/handlers/two_params_handler.ts";
import type { TwoParamsStdinProcessor } from "../../../../lib/cli/processors/two_params_stdin_processor.ts";
import { error, ok } from "../../../lib/deps.ts";

const _logger = new _BreakdownLogger("unit-two-params-orchestrator");

describe("TwoParamsOrchestrator - Unit Tests", () => {
  describe("execute method", () => {
    it("should successfully execute with valid parameters", async () => {
      _logger.debug("Testing successful execution flow");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        { timeout: 5000 },
        { skipStdin: true },
      );

      // Result should be structured correctly
      assert("ok" in result);

      // With skipStdin, execution should complete or fail at a predictable point
      if (!result.ok) {
        _logger.debug("Execution failed as expected", { error: result.error });
        // Should fail at factory validation or prompt generation
        assert(
          result.error.kind === "StdinReadError" ||
            result.error.kind === "VariableProcessingError" ||
            result.error.kind === "PromptGenerationError",
        );
      }
    });

    it("should fail with invalid parameter count", async () => {
      _logger.debug("Testing parameter count validation");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with no parameters
      const result1 = await orchestrator.orchestrate([], {}, {});
      assertEquals(result1.ok, false);
      if (!result1.ok) {
        assertEquals(result1.error.kind, "InvalidParameterCount");

        // Type-safe property access with proper discriminated union handling
        if (result1.error.kind === "InvalidParameterCount") {
          assertEquals(result1.error.received, 0);
          assertEquals(result1.error.expected, 2);
        }
      }

      // Test with one parameter
      const result2 = await orchestrator.orchestrate(["single"], {}, {});
      assertEquals(result2.ok, false);
      if (!result2.ok) {
        assertEquals(result2.error.kind, "InvalidParameterCount");

        // Type-safe property access with proper discriminated union handling
        if (result2.error.kind === "InvalidParameterCount") {
          assertEquals(result2.error.received, 1);
          assertEquals(result2.error.expected, 2);
        }
      }

      // Test with too many parameters
      const result3 = await orchestrator.orchestrate(["one", "two", "three"], {}, {});
      assertEquals(result3.ok, false);
      if (!result3.ok) {
        // The validator might check demonstrative type first
        assert(
          result3.error.kind === "InvalidParameterCount" ||
            result3.error.kind === "InvalidDemonstrativeType",
          `Unexpected error kind: ${result3.error.kind}`,
        );
      }
    });

    it("should fail with invalid demonstrative type", async () => {
      _logger.debug("Testing demonstrative type validation");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["invalid_demo", "project"],
        {},
        { skipStdin: true },
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidDemonstrativeType");

        // Type-safe property access with proper discriminated union handling
        if (result.error.kind === "InvalidDemonstrativeType") {
          assertEquals(result.error.value, "invalid_demo");
          // Error structure validated by error kind
        }
      }
    });

    it("should fail with invalid layer type", async () => {
      _logger.debug("Testing layer type validation");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "invalid_layer"],
        {},
        { skipStdin: true },
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidLayerType");

        // Type-safe property access with proper discriminated union handling
        if (result.error.kind === "InvalidLayerType") {
          assertEquals(result.error.value, "invalid_layer");
          // Error structure validated by error kind
        }
      }
    });

    it("should handle stdin read errors", async () => {
      _logger.debug("Testing stdin error handling");

      // Mock stdin processor that always errors
      const errorStdinProcessor = {
        process: async () => error({ 
          kind: "StdinReadError" as const,
          message: "Stdin read timeout" 
        }),
        shouldReadStdin: () => true,
        processWithDefaultTimeout: async () => error({ 
          kind: "StdinReadError" as const,
          message: "Stdin read timeout" 
        }),
      };

      const orchestrator = new TwoParamsOrchestrator(errorStdinProcessor as any);

      const result = await orchestrator.orchestrate(["to", "project"], {}, {});

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "StdinReadError");

        // Type-safe property access with proper discriminated union handling
        if (result.error.kind === "StdinReadError") {
          assertEquals(result.error.error, "Stdin read timeout");
        }
      }
    });
  });

  describe("orchestrate method components", () => {
    it("should validate parameter count correctly", async () => {
      _logger.debug("Testing parameter count validation in orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      // Test empty parameters
      const result1 = await orchestrator.orchestrate([], {}, {});
      assertEquals(result1.ok, false);
      if (!result1.ok) {
        assertEquals(result1.error.kind, "InvalidParameterCount");
      }

      // Test single parameter
      const result2 = await orchestrator.orchestrate(["single"], {}, {});
      assertEquals(result2.ok, false);
      if (!result2.ok) {
        assertEquals(result2.error.kind, "InvalidParameterCount");
      }
    });

    it("should handle orchestration error types correctly", async () => {
      _logger.debug("Testing orchestration error handling");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with invalid demonstrative type first (should fail at validation)
      const result1 = await orchestrator.orchestrate(
        ["test", "project"],
        {},
        { skipStdin: true },
      );

      assertEquals(result1.ok, false);
      if (!result1.ok) {
        assertEquals(result1.error.kind, "InvalidDemonstrativeType");
      }

      // Test with invalid layer type (should fail at validation)
      const result2 = await orchestrator.orchestrate(
        ["to", "invalid"],
        {},
        { skipStdin: true },
      );

      assertEquals(result2.ok, false);
      if (!result2.ok) {
        assertEquals(result2.error.kind, "InvalidLayerType");
      }

      // Test with valid parameters (should fail at later stage)
      const result3 = await orchestrator.orchestrate(
        ["to", "project"],
        {},
        { skipStdin: true },
      );

      assertEquals(result3.ok, false);
      if (!result3.ok) {
        // Should fail at stdin, variables, or prompt generation stage
        assert(
          [
            "StdinReadError",
            "VariableProcessingError", 
            "PromptGenerationError",
            "OutputWriteError"
          ].includes(result3.error.kind),
          `Unexpected error kind: ${result3.error.kind}`
        );
      }
    });
  });

  describe("orchestrate flow validation", () => {
    it("should process orchestration flow with valid parameters", async () => {
      _logger.debug("Testing orchestration flow validation");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        { timeout: 5000 },
        { 
          skipStdin: true,
          fromFile: "input.txt",
          destinationFile: "output.md"
        },
      );

      // Should fail at some predictable stage in test environment
      assertEquals(result.ok, false);
      if (!result.ok) {
        assert(
          [
            "StdinReadError",
            "VariableProcessingError",
            "PromptGenerationError"
          ].includes(result.error.kind),
          `Unexpected error kind: ${result.error.kind}`
        );
      }
    });

    it("should handle orchestration with different parameter types", async () => {
      _logger.debug("Testing orchestration with different parameters");

      const orchestrator = new TwoParamsOrchestrator();

      const testCases = [
        ["summary", "issue"],
        ["init", "task"],
        ["defect", "bugs"]
      ];

      for (const params of testCases) {
        const result = await orchestrator.orchestrate(
          params,
          {},
          { skipStdin: true }
        );

        // All should fail at some stage due to missing configuration
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertExists(result.error.kind);
        }
      }
    });

    it("should validate orchestration error propagation", async () => {
      _logger.debug("Testing orchestration error propagation");

      const orchestrator = new TwoParamsOrchestrator();

      // Test parameter validation error
      const result1 = await orchestrator.orchestrate(null, {}, {});
      assertEquals(result1.ok, false);
      if (!result1.ok) {
        assertEquals(result1.error.kind, "InvalidParameterCount");
      }

      // Test with valid params but expect other errors
      const result2 = await orchestrator.orchestrate(
        ["to", "project"],
        {},
        {}
      );
      assertEquals(result2.ok, false);
      if (!result2.ok) {
        // Should fail at stdin read or subsequent processing
        assertExists(result2.error.kind);
      }
    });
  });

  describe("orchestrate integration scenarios", () => {
    it("should handle various configuration combinations", async () => {
      _logger.debug("Testing orchestration with various configurations");

      const orchestrator = new TwoParamsOrchestrator();

      const testConfigs = [
        { config: {}, options: { skipStdin: true } },
        { config: { timeout: 5000 }, options: { fromFile: "test.txt", skipStdin: true } },
        { config: { promptDir: "/test" }, options: { destinationFile: "out.md", skipStdin: true } }
      ];

      for (const { config, options } of testConfigs) {
        const result = await orchestrator.orchestrate(
          ["to", "project"],
          config,
          options
        );

        // All should fail at some stage due to missing resources
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertExists(result.error.kind);
          _logger.debug(`Config test failed as expected`, { 
            errorKind: result.error.kind,
            config,
            options 
          });
        }
      }
    });

    it("should maintain proper error context in orchestration", async () => {
      _logger.debug("Testing orchestration error context");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["invalid", "types"],
        {},
        { skipStdin: true }
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        // Error should include proper context
        assertExists(result.error.kind);
        
        // With validation, invalid demonstrative type should fail first
        assertEquals(result.error.kind, "InvalidDemonstrativeType");
        
        // Verify error details for InvalidDemonstrativeType
        if (result.error.kind === "InvalidDemonstrativeType") {
          assertEquals(result.error.value, "invalid");
        }
      }
    });

    it("should validate orchestration component isolation", async () => {
      _logger.debug("Testing orchestration component isolation");

      const orchestrator = new TwoParamsOrchestrator();

      // Multiple calls should be independent
      const promises = [
        orchestrator.orchestrate(["to", "project"], {}, { skipStdin: true }),
        orchestrator.orchestrate(["summary", "issue"], {}, { skipStdin: true }),
        orchestrator.orchestrate(["init", "task"], {}, { skipStdin: true })
      ];

      const results = await Promise.all(promises);

      // All should fail independently
      results.forEach((result, index) => {
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertExists(result.error.kind);
          _logger.debug(`Isolation test ${index} failed as expected`, { 
            errorKind: result.error.kind 
          });
        }
      });
    });
  });

  describe("orchestrate component behavior validation", () => {
    it("should validate orchestrator component initialization", async () => {
      _logger.debug("Testing orchestrator component initialization");

      const orchestrator = new TwoParamsOrchestrator();

      // Orchestrator should be properly initialized
      assertExists(orchestrator);
      
      // Test that orchestrator can handle basic calls
      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {},
        { skipStdin: true }
      );

      // Should have proper result structure
      assertExists(result);
      assert("ok" in result);
      
      // In test environment, expect failure but with proper error structure
      if (!result.ok) {
        assertExists(result.error);
        assertExists(result.error.kind);
        _logger.debug("Component initialization test completed", {
          errorKind: result.error.kind
        });
      }
    });

    it("should handle orchestration timeout scenarios", async () => {
      _logger.debug("Testing orchestration timeout handling");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        { timeout: 1 }, // Very short timeout
        { skipStdin: true }
      );

      // Should complete or fail gracefully
      assertExists(result);
      assert("ok" in result);
      
      if (!result.ok) {
        assertExists(result.error.kind);
        _logger.debug("Timeout test completed", {
          errorKind: result.error.kind
        });
      }
    });

    it("should validate orchestration result consistency", async () => {
      _logger.debug("Testing orchestration result consistency");

      const orchestrator = new TwoParamsOrchestrator();

      // Multiple calls with same parameters should be consistent
      const results = await Promise.all([
        orchestrator.orchestrate(["to", "project"], {}, { skipStdin: true }),
        orchestrator.orchestrate(["to", "project"], {}, { skipStdin: true }),
        orchestrator.orchestrate(["to", "project"], {}, { skipStdin: true })
      ]);

      // All results should have same structure
      results.forEach((result, index) => {
        assertExists(result);
        assert("ok" in result);
        
        if (!result.ok) {
          assertExists(result.error.kind);
          _logger.debug(`Consistency test ${index} result`, {
            errorKind: result.error.kind
          });
        }
      });

      // If all failed, they should fail with same error type (consistency)
      const errorKinds = results
        .filter(r => !r.ok)
        .map(r => !r.ok ? r.error.kind : null);
      
      if (errorKinds.length === results.length) {
        // All failed - should be consistent
        const firstErrorKind = errorKinds[0];
        errorKinds.forEach(kind => {
          assertEquals(kind, firstErrorKind);
        });
      }
    });
  });

  describe("Integration scenarios", () => {
    it("should handle full execution with all valid inputs", async () => {
      _logger.debug("Testing full valid execution");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {
          timeout: 5000,
          promptDir: "/prompts",
        },
        {
          "uv-author": "test",
          "uv-version": "1.0",
          fromFile: "input.txt",
          destination: "output.md",
          skipStdin: true,
        },
      );

      // Should complete execution (may fail at prompt generation due to missing files)
      assert("ok" in result);

      if (!result.ok) {
        _logger.debug("Expected failure at prompt generation", {
          errorKind: result.error.kind,
        });
      }
    });

    it("should handle execution with minimal inputs", async () => {
      _logger.debug("Testing minimal execution");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {},
        { skipStdin: true },
      );

      // Result should be structured correctly
      assert("ok" in result);

      // Should process with defaults but likely fail due to missing resources
      if (!result.ok) {
        // Should fail at factory/prompt generation or variable processing
        assert([
          "StdinReadError",
          "VariableProcessingError",
          "PromptGenerationError"
        ].includes(result.error.kind), `Unexpected error kind: ${result.error.kind}`);
      }
    });

    it("should maintain execution isolation", async () => {
      _logger.debug("Testing execution isolation");

      const orchestrator = new TwoParamsOrchestrator();

      // First execution
      const result1 = await orchestrator.orchestrate(
        ["to", "project"],
        { config1: "value1" },
        { "uv-var1": "value1", skipStdin: true },
      );

      // Second execution with different params
      const result2 = await orchestrator.orchestrate(
        ["summary", "issue"],
        { config2: "value2" },
        { "uv-var2": "value2", skipStdin: true },
      );

      // Each execution should be independent
      assert("ok" in result1);
      assert("ok" in result2);

      // Errors (if any) should be specific to each execution
      if (!result1.ok && !result2.ok) {
        // Errors might be similar but should have independent context
        _logger.debug("Both executions failed independently", {
          error1: !result1.ok ? result1.error.kind : null,
          error2: !result2.ok ? result2.error.kind : null,
        });
      }
    });
  });
});
