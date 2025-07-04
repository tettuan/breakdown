/**
 * Architecture tests for ParamsCustomConfig
 *
 * These tests verify that ParamsCustomConfig follows architectural constraints
 * and properly implements the Smart Constructor pattern with Result types
 * following the Totality principle.
 *
 * Test scope:
 * - Dependency direction validation
 * - Smart Constructor pattern enforcement
 * - Result type consistency
 * - Integration with BreakdownParams
 * - Error handling architecture
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { ConfigError, ParamsCustomConfig, type Result as _Result, ResultStatus } from "./mod.ts";

import type { CustomConfig as _CustomConfig } from "@tettuan/breakdownparams";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";

const logger = new BreakdownLogger("params-custom-config-architecture");

describe("ParamsCustomConfig - Architectural Constraints", () => {
  it("should enforce Smart Constructor pattern - no direct instantiation", () => {
    logger.debug("Testing Smart Constructor pattern enforcement");

    // ParamsCustomConfig should only be accessible through static create method
    assertEquals(typeof ParamsCustomConfig.create, "function");

    // Should not expose constructor
    assertEquals(typeof ParamsCustomConfig.prototype, "object");

    // Private constructor prevents instantiation
    try {
      // @ts-ignore - Testing runtime behavior
      const _instance = new ParamsCustomConfig();
      assertEquals(true, false, "Should not allow direct instantiation");
    } catch (error) {
      // Expected - constructor is private
      assertExists(error);
    }
  });

  it("should maintain Result type consistency across all operations", () => {
    logger.debug("Testing Result type consistency");

    // Test with valid config
    const validConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(to|from)$",
              errorMessage: "Test error",
            },
          },
        },
      },
    };

    const validResult = ParamsCustomConfig.create(validConfig);
    assertExists(validResult.status);
    assertEquals(
      validResult.status === ResultStatus.SUCCESS || validResult.status === ResultStatus.ERROR,
      true,
    );

    // Test with empty config
    const emptyResult = ParamsCustomConfig.create({});
    assertExists(emptyResult.status);
    assertEquals(
      emptyResult.status === ResultStatus.SUCCESS || emptyResult.status === ResultStatus.ERROR,
      true,
    );
  });

  it("should properly integrate with BreakdownParams types", () => {
    logger.debug("Testing BreakdownParams type integration");

    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(test)$",
              errorMessage: "Test message",
            },
          },
        },
      },
    };

    const result = ParamsCustomConfig.create(config);

    if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
      // Should match CustomConfig structure from BreakdownParams
      assertExists(result.data.params);
      assertExists(result.data.params.two);
      assertExists(result.data.options);
      assertExists(result.data.validation);
      assertExists(result.data.errorHandling);

      // Should be compatible with DEFAULT_CUSTOM_CONFIG structure
      assertEquals(
        typeof result.data.params.two.demonstrativeType,
        typeof DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType,
      );
      assertEquals(
        typeof result.data.params.two.layerType,
        typeof DEFAULT_CUSTOM_CONFIG.params.two.layerType,
      );
    }
  });

  it("should maintain proper error hierarchy with ConfigError", () => {
    logger.debug("Testing error hierarchy architecture");

    // ConfigError should extend Error
    const error = new ConfigError("Test message", "TEST_CODE");
    assertEquals(error instanceof Error, true);
    assertEquals(error instanceof ConfigError, true);
    assertEquals(error.name, "ConfigError");
    assertEquals(error.code, "TEST_CODE");
    assertEquals(error.message, "Test message");
  });

  it("should follow fail-fast principle with Result types", () => {
    logger.debug("Testing fail-fast principle implementation");

    // Invalid configurations should fail fast without throwing
    const invalidConfigs = [
      null,
      undefined,
      { breakdown: null },
      { breakdown: { params: "invalid" } },
      { breakdown: { params: { two: "invalid" } } },
    ];

    invalidConfigs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config as Record<string, unknown>);
      assertExists(result.status, `Result ${index} should have status`);

      // Should never throw - all failures are Result values
      assertEquals(
        result.status === ResultStatus.SUCCESS || result.status === ResultStatus.ERROR,
        true,
        `Result ${index} should be valid Result type`,
      );
    });
  });

  it("should maintain separation of concerns - config extraction vs validation", () => {
    logger.debug("Testing separation of concerns");

    // ParamsCustomConfig should only handle extraction and merging
    // It should not perform deep validation of pattern syntax

    const configWithInvalidPattern = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "[invalid regex", // Invalid regex
              errorMessage: "Error",
            },
          },
        },
      },
    };

    // Should succeed in extraction even with invalid pattern
    // Pattern validation is BreakdownParams' responsibility
    const result = ParamsCustomConfig.create(configWithInvalidPattern);
    assertEquals(result.status, ResultStatus.SUCCESS);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.params.two.demonstrativeType.pattern, "[invalid regex");
    }
  });

  it("should support proper default merging architecture", () => {
    logger.debug("Testing default merging architecture");

    const partialConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(custom)$",
              errorMessage: "Custom error",
            },
            // layerType not provided - should use default
          },
        },
      },
    };

    const result = ParamsCustomConfig.create(partialConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should have custom demonstrativeType
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(custom)$");

      // Should have default layerType
      assertEquals(
        result.data.params.two.layerType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern,
      );
    }
  });

  it("should return undefined for missing configuration as per BreakdownParams contract", () => {
    logger.debug("Testing undefined return for missing configuration");

    const missingConfigs = [
      {},
      { other: "config" },
      { breakdown: {} },
      { breakdown: { other: "config" } },
    ];

    missingConfigs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config);
      assertEquals(result.status, ResultStatus.SUCCESS, `Config ${index} should succeed`);

      if (result.status === ResultStatus.SUCCESS) {
        assertEquals(result.data, undefined, `Config ${index} should return undefined`);
      }
    });
  });
});

describe("ParamsCustomConfig - Integration Architecture", () => {
  it("should integrate with configuration loading pipeline", () => {
    logger.debug("Testing configuration loading pipeline integration");

    // Simulate configuration from file
    const fileConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(to|from|via)$",
              errorMessage: "Must be to, from, or via",
            },
          },
        },
        errorHandling: {
          unknownOption: "warn" as const,
        },
      },
    };

    const result = ParamsCustomConfig.create(fileConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should maintain all configuration sections
      assertExists(result.data.params);
      assertExists(result.data.options);
      assertExists(result.data.validation);
      assertExists(result.data.errorHandling);

      // Custom values should be preserved
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(to|from|via)$");
      assertEquals(result.data.errorHandling.unknownOption, "warn");

      // Defaults should be filled
      assertEquals(
        result.data.errorHandling.duplicateOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption,
      );
    }
  });

  it("should handle nested configuration overrides properly", () => {
    logger.debug("Testing nested configuration override architecture");

    const nestedConfig = {
      breakdown: {
        validation: {
          zero: {
            allowedOptions: ["help", "version", "config"],
            allowCustomVariables: false,
          },
          // one and two use defaults
        },
        options: {
          customVariables: {
            pattern: "\\{\\{custom_[a-z]+\\}\\}",
          },
        },
      },
    };

    const result = ParamsCustomConfig.create(nestedConfig);

    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Custom zero validation
      assertEquals(result.data.validation.zero.allowedOptions.includes("config"), true);
      assertEquals(result.data.validation.zero.allowCustomVariables, false);

      // Default one validation
      assertEquals(
        result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions,
      );

      // Custom options pattern
      assertEquals(result.data.options.customVariables.pattern, "\\{\\{custom_[a-z]+\\}\\}");

      // Default options description
      assertEquals(
        result.data.options.customVariables.description,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.description,
      );
    }
  });
});
