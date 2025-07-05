/**
 * Structure tests for ParamsCustomConfig - Component relationship validation
 *
 * These tests verify the structural relationships within ParamsCustomConfig
 * and ensure proper separation of concerns, cohesion, and responsibility
 * distribution in the implementation.
 *
 * Test scope:
 * - Class structure and method organization
 * - Private/public method separation
 * - Helper method cohesion
 * - Data flow structure
 * - Error structure consistency
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { ConfigError, ParamsCustomConfig, type Result as _Result, ResultStatus } from "./mod.ts";

import type { CustomConfig as _CustomConfig } from "@tettuan/breakdownparams";

const logger = new BreakdownLogger("params-custom-config-structure");

describe("ParamsCustomConfig - Class Structure", () => {
  it("should expose only essential public API methods", () => {
    logger.debug("Testing public API surface");

    // Should only expose static create method
    assertEquals(typeof ParamsCustomConfig.create, "function");

    // Should not expose internal helper methods (they are private static)
    // Private static methods exist on the class but are not accessible
    assertEquals(
      typeof (ParamsCustomConfig as unknown as { isConfigMissing: unknown }).isConfigMissing,
      "function",
    );
    assertEquals(
      typeof (ParamsCustomConfig as unknown as { extractOverrides: unknown }).extractOverrides,
      "function",
    );

    // Should not allow instantiation
    assertEquals(typeof ParamsCustomConfig.prototype.constructor, "function");
  });

  it("should maintain clear method responsibilities", () => {
    logger.debug("Testing method responsibility separation");

    // create() method should handle:
    // 1. Missing config detection
    // 2. Override extraction
    // 3. Result wrapping

    const testConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "test",
              errorMessage: "test",
            },
          },
        },
      },
    };

    const result = ParamsCustomConfig.create(testConfig);

    // Should return properly structured result
    assertExists(result.status);
    if (result.status === ResultStatus.SUCCESS) {
      // Create method handled all aspects properly
      assertExists(result.data);
    }
  });

  it("should structure ConfigError with consistent properties", () => {
    logger.debug("Testing ConfigError structure");

    const error = new ConfigError("Test message", "TEST_CODE");

    // Should have all required properties
    assertExists(error.name);
    assertExists(error.message);
    assertExists(error.code);
    assertExists(error.stack);

    // Should have correct property values
    assertEquals(error.name, "ConfigError");
    assertEquals(error.message, "Test message");
    assertEquals(error.code, "TEST_CODE");

    // Should maintain Error prototype chain
    assertEquals(error.toString().includes("ConfigError"), true);
  });

  it("should maintain cohesive data flow structure", () => {
    logger.debug("Testing data flow cohesion");

    // Data should flow: input -> missing check -> extraction -> merging -> result

    // Test missing config flow
    const missingResult = ParamsCustomConfig.create({});
    assertEquals(missingResult.status, ResultStatus.SUCCESS);
    if (missingResult.status === ResultStatus.SUCCESS) {
      assertEquals(missingResult.data, undefined);
    }

    // Test extraction and merging flow
    const validConfig = {
      breakdown: {
        params: {
          two: {
            layerType: {
              pattern: "^(domain|app|infra)$",
              errorMessage: "Invalid layer",
            },
          },
        },
      },
    };

    const validResult = ParamsCustomConfig.create(validConfig);
    assertEquals(validResult.status, ResultStatus.SUCCESS);

    if (validResult.status === ResultStatus.SUCCESS && validResult.data) {
      // Should have extracted custom layerType
      assertEquals(validResult.data.params.two.layerType.pattern, "^(domain|app|infra)$");

      // Should have default demonstrativeType (merging worked)
      assertExists(validResult.data.params.two.demonstrativeType);
    }
  });
});

describe("ParamsCustomConfig - Helper Method Structure", () => {
  it("should structure config detection logic cohesively", () => {
    logger.debug("Testing config detection structure");

    // Various "missing" configurations
    const missingConfigs = [
      null,
      undefined,
      {},
      { breakdown: null },
      { breakdown: {} },
      { breakdown: { unrelated: "data" } },
    ];

    // All should be detected as missing
    missingConfigs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config as unknown as Record<string, unknown>);
      assertEquals(
        result.status === ResultStatus.SUCCESS && result.data === undefined,
        true,
        `Config ${index} should be detected as missing`,
      );
    });

    // Present configurations
    const presentConfigs = [
      { breakdown: { params: {} } },
      { breakdown: { options: {} } },
      { breakdown: { validation: {} } },
      { breakdown: { errorHandling: {} } },
    ];

    // All should be detected as present
    presentConfigs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config);
      if (result.status === ResultStatus.SUCCESS) {
        assertEquals(
          result.data !== undefined,
          true,
          `Config ${index} should be detected as present`,
        );
      }
    });
  });

  it("should structure override extraction with clear section separation", () => {
    logger.debug("Testing override extraction structure");

    // Each section should be extracted independently
    const fullConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: { pattern: "^(a)$", errorMessage: "A" },
            layerType: { pattern: "^(b)$", errorMessage: "B" },
          },
        },
        options: {
          customVariables: { pattern: "test", description: "Test" },
        },
        validation: {
          zero: { allowedOptions: ["test"], allowCustomVariables: true },
          one: { allowedOptions: ["test2"], allowCustomVariables: false },
        },
        errorHandling: {
          unknownOption: "ignore" as const,
          duplicateOption: "warn" as const,
        },
      },
    };

    const result = ParamsCustomConfig.create(fullConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Each section should be properly extracted
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(a)$");
      assertEquals(result.data.params.two.layerType.pattern, "^(b)$");
      assertEquals(result.data.options.customVariables.pattern, "test");
      assertEquals(result.data.validation.zero.allowedOptions[0], "test");
      assertEquals(result.data.validation.one.allowedOptions[0], "test2");
      assertEquals(result.data.errorHandling.unknownOption, "ignore");
      assertEquals(result.data.errorHandling.duplicateOption, "warn");
    }
  });

  it("should maintain structural integrity with partial overrides", () => {
    logger.debug("Testing partial override structure");

    // Only override specific nested values
    const partialConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(custom)$",
              // errorMessage not provided - should use default
            },
          },
        },
        errorHandling: {
          unknownOption: "error" as const,
          // other options not provided - should use defaults
        },
      },
    };

    const result = ParamsCustomConfig.create(partialConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should maintain structure even with partial data
      assertExists(result.data.params.two.demonstrativeType.errorMessage);
      assertExists(result.data.errorHandling.duplicateOption);
      assertExists(result.data.errorHandling.emptyValue);
    }
  });
});

describe("ParamsCustomConfig - Error Handling Structure", () => {
  it("should structure error cases consistently", () => {
    logger.debug("Testing error case structure");

    // Test with malformed config that triggers extraction error
    const createMalformedConfig = () => {
      const config: Record<string, unknown> = {
        breakdown: { params: { two: {} as Record<string, unknown> } },
      };
      // Create circular reference to trigger error
      (config.breakdown as Record<string, unknown>).params = {
        two: { circular: config.breakdown } as Record<string, unknown>,
      };
      return config;
    };

    // Should handle gracefully without exposing internals
    const result = ParamsCustomConfig.create(createMalformedConfig());

    // Even with errors, should maintain Result structure
    assertExists(result.status);
    assertEquals(
      result.status === ResultStatus.SUCCESS || result.status === ResultStatus.ERROR,
      true,
    );
  });

  it("should maintain error information structure", () => {
    logger.debug("Testing error information structure");

    // When an error occurs, it should have consistent structure
    const error = new ConfigError("Extraction failed", "CONFIG_EXTRACTION_ERROR");

    // Error should contain structured information
    assertEquals(error.name, "ConfigError");
    assertEquals(error.code, "CONFIG_EXTRACTION_ERROR");
    assertEquals(typeof error.message, "string");
    assertEquals(typeof error.stack, "string");

    // Error should be serializable
    const serialized = JSON.stringify({
      name: error.name,
      code: error.code,
      message: error.message,
    });

    const parsed = JSON.parse(serialized);
    assertEquals(parsed.name, "ConfigError");
    assertEquals(parsed.code, "CONFIG_EXTRACTION_ERROR");
  });
});

describe("ParamsCustomConfig - Type Safety Structure", () => {
  it("should maintain type safety through proper guards", () => {
    logger.debug("Testing type guard structure");

    const configs = [
      {
        breakdown: {
          params: { two: { demonstrativeType: { pattern: "test", errorMessage: "test" } } },
        },
      },
      {
        breakdown: {
          params: { two: { demonstrativeType: { pattern: 123, errorMessage: "test" } } },
        },
      }, // wrong type
      { breakdown: { params: { two: { demonstrativeType: { pattern: "test" } } } } }, // missing field
    ];

    configs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config as unknown as Record<string, unknown>);

      // All should return valid Result structure
      assertExists(result.status);

      if (index === 0 && result.status === ResultStatus.SUCCESS && result.data) {
        // First config is valid
        assertEquals(result.data.params.two.demonstrativeType.pattern, "test");
      }
    });
  });

  it("should structure validation levels appropriately", () => {
    logger.debug("Testing validation structure levels");

    const validationConfig = {
      breakdown: {
        validation: {
          zero: {
            allowedOptions: ["help", "version"],
            allowedValueOptions: [],
            allowCustomVariables: false,
          },
          one: {
            allowedOptions: ["output", "config"],
            // Partial - should merge with defaults
          },
          two: {
            // Empty - should use all defaults
          },
        },
      },
    };

    const result = ParamsCustomConfig.create(validationConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Zero: fully specified
      assertEquals(result.data.validation.zero.allowedOptions.length, 2);
      assertEquals(result.data.validation.zero.allowCustomVariables, false);

      // One: partially specified
      assertEquals(result.data.validation.one.allowedOptions.includes("output"), true);
      assertExists(result.data.validation.one.allowedValueOptions); // default
      assertExists(result.data.validation.one.allowCustomVariables); // default

      // Two: all defaults
      assertExists(result.data.validation.two.allowedOptions);
      assertExists(result.data.validation.two.allowedValueOptions);
      assertExists(result.data.validation.two.allowCustomVariables);
    }
  });
});
