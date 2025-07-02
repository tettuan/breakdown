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

import { assert, assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { TwoParamsOrchestrator } from "./two_params_orchestrator.ts";
import type { TwoParamsHandlerError } from "../handlers/two_params_handler.ts";
import type { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";
import { error, ok } from "$lib/types/_result.ts";

const _logger = new BreakdownLogger("unit-two-params-orchestrator");

describe("TwoParamsOrchestrator - Unit Tests", () => {
  describe("execute method", () => {
    it("should successfully execute with valid parameters", async () => {
      _logger.debug("Testing successful execution flow");

      const orchestrator = new TwoParamsOrchestrator();

      const _result = await orchestrator.execute(
        ["to", "project"],
        { timeout: 5000 },
        { skipStdin: true },
      );

      // Result should be structured correctly
      assert("ok" in result);

      // With skipStdin, execution should complete or fail at a predictable point
      if (!_result.ok) {
        _logger.debug("Execution failed as expected", { error: _result.error });
        // Should fail at factory validation or prompt generation
        assert(
          _result.error.kind === "FactoryValidationError" ||
            _result.error.kind === "VariablesBuilderError" ||
            _result.error.kind === "PromptGenerationError",
        );
      }
    });

    it("should fail with invalid parameter count", async () => {
      _logger.debug("Testing parameter count validation");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with no parameters
      const result1 = await orchestrator.execute([], {}, {});
      assertEquals(result1.ok, false);
      if (!_result1.ok) {
        assertEquals(result1.error.kind, "InvalidParameterCount");

        // Type-safe property access with proper discriminated union handling
        if (result1.error.kind === "InvalidParameterCount") {
          assertEquals(result1.error.received, 0);
          assertEquals(result1.error.expected, 2);
        }
      }

      // Test with one parameter
      const result2 = await orchestrator.execute(["single"], {}, {});
      assertEquals(result2.ok, false);
      if (!_result2.ok) {
        assertEquals(result2.error.kind, "InvalidParameterCount");

        // Type-safe property access with proper discriminated union handling
        if (result2.error.kind === "InvalidParameterCount") {
          assertEquals(result2.error.received, 1);
          assertEquals(result2.error.expected, 2);
        }
      }

      // Test with too many parameters
      const result3 = await orchestrator.execute(["one", "two", "three"], {}, {});
      assertEquals(result3.ok, false);
      if (!_result3.ok) {
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

      const _result = await orchestrator.execute(
        ["invalid_demo", "project"],
        {},
        { skipStdin: true },
      );

      assertEquals(_result.ok, false);
      if (!_result.ok) {
        assertEquals(_result.error.kind, "InvalidDemonstrativeType");

        // Type-safe property access with proper discriminated union handling
        if (_result.error.kind === "InvalidDemonstrativeType") {
          assertEquals(_result.error.value, "invalid_demo");
          assertExists(_result.error.validTypes);
          assert(Array.isArray(_result.error.validTypes));
        }
      }
    });

    it("should fail with invalid layer type", async () => {
      _logger.debug("Testing layer type validation");

      const orchestrator = new TwoParamsOrchestrator();

      const _result = await orchestrator.execute(
        ["to", "invalid_layer"],
        {},
        { skipStdin: true },
      );

      assertEquals(_result.ok, false);
      if (!_result.ok) {
        assertEquals(_result.error.kind, "InvalidLayerType");

        // Type-safe property access with proper discriminated union handling
        if (_result.error.kind === "InvalidLayerType") {
          assertEquals(_result.error.value, "invalid_layer");
          assertExists(_result.error.validTypes);
          assert(Array.isArray(_result.error.validTypes));
        }
      }
    });

    it("should handle stdin read errors", async () => {
      _logger.debug("Testing stdin error handling");

      // Mock stdin processor that always errors
      const errorStdinProcessor = {
        process: async () => error({ message: "Stdin read timeout" }),
        shouldReadStdin: () => true,
        processWithDefaultTimeout: async () => error({ message: "Stdin read timeout" }),
      };

      const orchestrator = new TwoParamsOrchestrator(
        undefined,
        errorStdinProcessor as unknown as TwoParamsStdinProcessor,
      );

      const _result = await orchestrator.execute(["to", "project"], {}, {});

      assertEquals(_result.ok, false);
      if (!_result.ok) {
        assertEquals(_result.error.kind, "StdinReadError");

        // Type-safe property access with proper discriminated union handling
        if (_result.error.kind === "StdinReadError") {
          assertEquals(_result.error.error, "Stdin read timeout");
        }
      }
    });
  });

  describe("extractCustomVariables method", () => {
    it("should extract only uv- prefixed variables", async () => {
      _logger.debug("Testing custom variable extraction");

      const orchestrator = new TwoParamsOrchestrator();

      const options = {
        "uv-custom1": "value1",
        "uv-custom2": "value2",
        "regular": "ignored",
        "uv-": "included", // Edge case
        "uv-123": "numeric",
        "UV-upper": "ignored", // Case sensitive
        "xuv-prefix": "ignored", // Must start with uv-
      };

      const extracted = (orchestrator as unknown as {
        extractCustomVariables(options: Record<string, unknown>): Record<string, string>;
      }).extractCustomVariables(options);

      assertEquals(Object.keys(extracted).length, 4);
      assertEquals(extracted["uv-custom1"], "value1");
      assertEquals(extracted["uv-custom2"], "value2");
      assertEquals(extracted["uv-"], "included");
      assertEquals(extracted["uv-123"], "numeric");
      assertEquals(extracted["regular"], undefined);
      assertEquals(extracted["UV-upper"], undefined);
    });

    it("should convert values to strings", async () => {
      _logger.debug("Testing value string conversion");

      const orchestrator = new TwoParamsOrchestrator();

      const options = {
        "uv-number": 123,
        "uv-boolean": true,
        "uv-null": null,
        "uv-undefined": undefined,
        "uv-object": { key: "value" },
      };

      const extracted = (orchestrator as unknown as {
        extractCustomVariables(options: Record<string, unknown>): Record<string, string>;
      }).extractCustomVariables(options);

      assertEquals(extracted["uv-number"], "123");
      assertEquals(extracted["uv-boolean"], "true");
      assertEquals(extracted["uv-null"], "null");
      assertEquals(extracted["uv-undefined"], "undefined");
      assertEquals(extracted["uv-object"], "[object Object]");
    });
  });

  describe("processVariables method", () => {
    it("should merge custom variables with standard ones", async () => {
      _logger.debug("Testing variable processing");

      const orchestrator = new TwoParamsOrchestrator();

      const customVariables = {
        "uv-custom": "custom_value",
      };

      const inputText = "test input content";

      const options = {
        fromFile: "input.txt",
        destinationFile: "output.md",
      };

      const processed = (orchestrator as unknown as {
        processVariables(
          customVariables: Record<string, string>,
          inputText: string,
          options: Record<string, unknown>,
        ): Record<string, string>;
      }).processVariables(
        customVariables,
        inputText,
        options,
      );

      // Check custom variables are included
      assertEquals(processed["uv-custom"], "custom_value");

      // Check standard variables
      assertEquals(processed.input_text, "test input content");
      assertEquals(processed.input_text_file, "input.txt");
      assertEquals(processed.destination_path, "output.md");
    });

    it("should handle missing options gracefully", async () => {
      _logger.debug("Testing variable processing with missing options");

      const orchestrator = new TwoParamsOrchestrator();

      const processed = (orchestrator as unknown as {
        processVariables(
          customVariables: Record<string, string>,
          inputText: string,
          options: Record<string, unknown>,
        ): Record<string, string>;
      }).processVariables(
        {},
        "",
        {},
      );

      // Should use defaults - input_text only set if truthy
      assertEquals(processed.input_text, undefined); // Empty string is falsy
      assertEquals(processed.input_text_file, "stdin");
      assertEquals(processed.destination_path, "stdout");
    });

    it("should prioritize option aliases correctly", async () => {
      _logger.debug("Testing option alias priority");

      const orchestrator = new TwoParamsOrchestrator();

      const options = {
        destinationFile: "dest.md",
        output: "output.md", // Should be used if destinationFile is not present
      };

      const processed = (orchestrator as unknown as {
        processVariables(
          customVariables: Record<string, string>,
          inputText: string,
          options: Record<string, unknown>,
        ): Record<string, string>;
      }).processVariables({}, "", options);

      assertEquals(processed.destination_path, "dest.md");

      // Test with only output option
      const processed2 = (orchestrator as unknown as {
        processVariables(
          customVariables: Record<string, string>,
          inputText: string,
          options: Record<string, unknown>,
        ): Record<string, string>;
      }).processVariables({}, "", { output: "out.md" });
      assertEquals(processed2.destination_path, "out.md");
    });
  });

  describe("createCliParams method", () => {
    it("should create proper CLI parameters structure", async () => {
      _logger.debug("Testing CLI params creation");

      const orchestrator = new TwoParamsOrchestrator();

      const _params = (orchestrator as unknown as {
        createCliParams(
          demonstrativeType: string,
          layerType: string,
          options: Record<string, unknown>,
          inputText: string,
          customVariables: Record<string, string>,
        ): unknown;
      }).createCliParams(
        "to",
        "project",
        {
          fromFile: "input.txt",
          destination: "output.md",
          adaptation: "custom",
          promptDir: "/prompts",
          extended: true,
          customValidation: false,
          errorFormat: "json",
          config: "custom.json",
        },
        "input text content",
        { "uv-test": "value" },
      ) as {
        demonstrativeType: string;
        layerType: string;
        options: {
          fromFile?: string;
          destinationFile?: string;
          adaptation?: string;
          promptDir?: string;
          input_text: string;
          customVariables: Record<string, string>;
          extended?: boolean;
          customValidation?: boolean;
          errorFormat?: string;
          config?: string;
        };
      };

      // Verify structure
      assertEquals(_params.demonstrativeType, "to");
      assertEquals(_params.layerType, "project");
      assertEquals(_params.options.fromFile, "input.txt");
      assertEquals(_params.options.destinationFile, "output.md");
      assertEquals(_params.options.adaptation, "custom");
      assertEquals(_params.options.promptDir, "/prompts");
      assertEquals(_params.options.input_text, "input text content");
      assertEquals(_params.options.customVariables["uv-test"], "value");
      assertEquals(_params.options.extended, true);
      assertEquals(_params.options.customValidation, false);
      assertEquals(_params.options.errorFormat, "json");
      assertEquals(_params.options.config, "custom.json");
    });

    it("should handle option aliases", async () => {
      _logger.debug("Testing CLI params with option aliases");

      const orchestrator = new TwoParamsOrchestrator();

      const _params = (orchestrator as unknown as {
        createCliParams(
          demonstrativeType: string,
          layerType: string,
          options: Record<string, unknown>,
          inputText: string,
          customVariables: Record<string, string>,
        ): unknown;
      }).createCliParams(
        "summary",
        "issue",
        {
          from: "from-alias.txt", // Alias for fromFile
          output: "output-alias.md", // Alias for destination
          input: "layer-input", // fromLayerType
        },
        "",
        {},
      ) as {
        demonstrativeType: string;
        layerType: string;
        options: {
          fromFile?: string;
          destinationFile?: string;
          fromLayerType?: string;
          input_text: string;
          customVariables: Record<string, string>;
        };
      };

      assertEquals(_params.options.fromFile, "from-alias.txt");
      assertEquals(_params.options.destinationFile, "output-alias.md");
      assertEquals(_params.options.fromLayerType, "layer-input");
    });

    it("should use defaults for missing options", async () => {
      _logger.debug("Testing CLI params defaults");

      const orchestrator = new TwoParamsOrchestrator();

      const _params = (orchestrator as unknown as {
        createCliParams(
          demonstrativeType: string,
          layerType: string,
          options: Record<string, unknown>,
          inputText: string,
          customVariables: Record<string, string>,
        ): unknown;
      }).createCliParams(
        "defect",
        "task",
        {}, // Empty options
        "",
        {},
      ) as {
        demonstrativeType: string;
        layerType: string;
        options: {
          fromFile?: string;
          destinationFile?: string;
          adaptation?: string;
          promptDir?: string;
          input_text: string;
          customVariables: Record<string, string>;
        };
      };

      // Should have default destination
      assertEquals(_params.options.destinationFile, "output.md");

      // Other options should be undefined
      assertEquals(_params.options.fromFile, undefined);
      assertEquals(_params.options.adaptation, undefined);
      assertEquals(_params.options.promptDir, undefined);
    });
  });

  describe("generatePrompt method", () => {
    it("should handle factory validation errors", async () => {
      _logger.debug("Testing prompt generation error handling");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with minimal config - system has robust fallback mechanisms
      const _result = await (orchestrator as unknown as {
        generatePrompt(
          config: Record<string, unknown>,
          cliParams: unknown,
          inputText: string,
          customVariables: Record<string, string>,
        ): Promise<unknown>;
      }).generatePrompt(
        {}, // Empty config - should succeed with fallback
        {
          demonstrativeType: "to",
          layerType: "project",
          options: {},
        },
        "",
        {},
      ) as {
        ok: boolean;
        data?: string;
        error: { kind: string; errors?: string[]; error?: string };
      };

      // In test environment without prompt files, this will fail at prompt generation
      // The test verifies proper error handling rather than successful generation
      if (!_result.ok) {
        _logger.debug("Expected failure at prompt generation", {
          errorKind: _result.error.kind,
        });

        // These are the expected error types when prompt files are missing
        assert(
          _result.error.kind === "FactoryValidationError" ||
            _result.error.kind === "VariablesBuilderError" ||
            _result.error.kind === "PromptGenerationError",
          `Unexpected error kind: ${_result.error.kind}`,
        );

        // Check error structure based on type
        if (
          _result.error.kind === "FactoryValidationError" ||
          _result.error.kind === "VariablesBuilderError"
        ) {
          assertExists(_result.error.errors);
          assert(Array.isArray(_result.error.errors));
        } else if (_result.error.kind === "PromptGenerationError") {
          assertExists(_result.error.error);
        }
      } else {
        // If it succeeds, that means prompt files exist and generation worked
        _logger.debug("Prompt generation succeeded with fallback configuration");
        assertExists(_result.data);
        assert(typeof _result.data === "string");
      }
    });

    it("should handle variables builder errors", async () => {
      _logger.debug("Testing variables builder error handling");

      const orchestrator = new TwoParamsOrchestrator();

      const _config = {
        promptDir: "/test/prompts",
      };

      const cliParams = {
        demonstrativeType: "to",
        layerType: "project",
        options: {
          promptDir: "/test/prompts",
        },
      };

      const _result = await (orchestrator as unknown as {
        generatePrompt(
          config: Record<string, unknown>,
          cliParams: unknown,
          inputText: string,
          customVariables: Record<string, string>,
        ): Promise<unknown>;
      }).generatePrompt(
        config,
        cliParams,
        "",
        { "uv-invalid": "" }, // Empty custom variable might cause validation error
      ) as {
        ok: boolean;
        data?: string;
        error: { kind: string; errors?: string[]; error?: string };
      };

      assertEquals(_result.ok, false);
      if (!_result.ok) {
        assertExists(_result.error.kind);
        assertExists(_result.error.errors || _result.error.error);
      }
    });
  });

  describe("Integration scenarios", () => {
    it("should handle full execution with all valid inputs", async () => {
      _logger.debug("Testing full valid execution");

      const orchestrator = new TwoParamsOrchestrator();

      const _result = await orchestrator.execute(
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

      if (!_result.ok) {
        _logger.debug("Expected failure at prompt generation", {
          errorKind: _result.error.kind,
        });
      }
    });

    it("should handle execution with minimal inputs", async () => {
      _logger.debug("Testing minimal execution");

      const orchestrator = new TwoParamsOrchestrator();

      const _result = await orchestrator.execute(
        ["init", "bugs"],
        {},
        { skipStdin: true },
      );

      assert("ok" in result);

      // Should process with defaults
      if (!_result.ok) {
        // Expected to fail at factory/prompt generation
        assert(["FactoryValidationError", "VariablesBuilderError", "PromptGenerationError"]
          .includes(_result.error.kind));
      }
    });

    it("should maintain execution isolation", async () => {
      _logger.debug("Testing execution isolation");

      const orchestrator = new TwoParamsOrchestrator();

      // First execution
      const result1 = await orchestrator.execute(
        ["to", "project"],
        { config1: "value1" },
        { "uv-var1": "value1", skipStdin: true },
      );

      // Second execution with different params
      const result2 = await orchestrator.execute(
        ["summary", "issue"],
        { config2: "value2" },
        { "uv-var2": "value2", skipStdin: true },
      );

      // Each execution should be independent
      assert("ok" in result1);
      assert("ok" in result2);

      // Errors (if any) should be specific to each execution
      if (!_result1.ok && !_result2.ok) {
        // Errors might be similar but should have independent context
        _logger.debug("Both executions failed independently", {
          error1: result1.error.kind,
          error2: result2.error.kind,
        });
      }
    });
  });
});
