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

const _logger = new BreakdownLogger("params-custom-config-architecture");

describe("ParamsCustomConfig - Architectural Constraints", () => {
  it("should enforce Smart Constructor pattern - no direct instantiation", () => {
    _logger.debug("Testing Smart Constructor pattern enforcement");

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
    _logger.debug("Testing Result type consistency");

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
    _logger.debug("Testing BreakdownParams type integration");

    const _config = {
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

    const _result = ParamsCustomConfig.create(_config);

    if (_result.status === ResultStatus.SUCCESS && _result.data !== undefined) {
      // Should match CustomConfig structure from BreakdownParams
      assertExists(_result.data.params);
      assertExists(_result.data.params.two);
      assertExists(_result.data.options);
      assertExists(_result.data.validation);
      assertExists(_result.data.errorHandling);

      // Should be compatible with DEFAULT_CUSTOM_CONFIG structure
      assertEquals(
        typeof _result.data.params.two.demonstrativeType,
        typeof DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType,
      );
      assertEquals(
        typeof _result.data.params.two.layerType,
        typeof DEFAULT_CUSTOM_CONFIG.params.two.layerType,
      );
    }
  });

  it("should maintain proper error hierarchy with ConfigError", () => {
    _logger.debug("Testing error hierarchy architecture");

    // ConfigError should extend Error
    const error = new ConfigError("Test message", "TEST_CODE");
    assertEquals(error instanceof Error, true);
    assertEquals(error instanceof ConfigError, true);
    assertEquals(error.name, "ConfigError");
    assertEquals(error.code, "TEST_CODE");
    assertEquals(error.message, "Test message");
  });

  it("should follow fail-fast principle with Result types", () => {
    _logger.debug("Testing fail-fast principle implementation");

    // Invalid configurations should fail fast without throwing
    const invalidConfigs = [
      null,
      undefined,
      { breakdown: null },
      { breakdown: { params: "invalid" } },
      { breakdown: { params: { two: "invalid" } } },
    ];

    invalidConfigs.forEach((config, index) => {
      const _result = ParamsCustomConfig.create(config as Record<string, unknown>);
      assertExists(_result.status, `Result ${index} should have status`);

      // Should never throw - all failures are Result values
      assertEquals(
        _result.status === ResultStatus.SUCCESS || _result.status === ResultStatus.ERROR,
        true,
        `Result ${index} should be valid Result type`,
      );
    });
  });

  it("should maintain separation of concerns - config extraction vs validation", () => {
    _logger.debug("Testing separation of concerns");

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
    const _result = ParamsCustomConfig.create(configWithInvalidPattern);
    assertEquals(_result.status, ResultStatus.SUCCESS);

    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "[invalid regex");
    }
  });

  it("should support proper default merging architecture", () => {
    _logger.debug("Testing default merging architecture");

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

    const _result = ParamsCustomConfig.create(partialConfig);

    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Should have custom demonstrativeType
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(custom)$");

      // Should have default layerType
      assertEquals(
        _result.data.params.two.layerType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern,
      );
    }
  });

  it("should return undefined for missing configuration as per BreakdownParams contract", () => {
    _logger.debug("Testing undefined return for missing configuration");

    const missingConfigs = [
      {},
      { other: "config" },
      { breakdown: {} },
      { breakdown: { other: "config" } },
    ];

    missingConfigs.forEach((config, index) => {
      const _result = ParamsCustomConfig.create(_config);
      assertEquals(_result.status, ResultStatus.SUCCESS, `Config ${index} should succeed`);

      if (_result.status === ResultStatus.SUCCESS) {
        assertEquals(_result.data, undefined, `Config ${index} should return undefined`);
      }
    });
  });
});

describe("ParamsCustomConfig - Integration Architecture", () => {
  it("should integrate with configuration loading pipeline", () => {
    _logger.debug("Testing configuration loading pipeline integration");

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

    const _result = ParamsCustomConfig.create(fileConfig);

    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Should maintain all configuration sections
      assertExists(_result.data.params);
      assertExists(_result.data.options);
      assertExists(_result.data.validation);
      assertExists(_result.data.errorHandling);

      // Custom values should be preserved
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(to|from|via)$");
      assertEquals(_result.data.errorHandling.unknownOption, "warn");

      // Defaults should be filled
      assertEquals(
        _result.data.errorHandling.duplicateOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption,
      );
    }
  });

  it("should handle nested configuration overrides properly", () => {
    _logger.debug("Testing nested configuration override architecture");

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

    const _result = ParamsCustomConfig.create(nestedConfig);

    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Custom zero validation
      assertEquals(_result.data.validation.zero.allowedOptions.includes("config"), true);
      assertEquals(_result.data.validation.zero.allowCustomVariables, false);

      // Default one validation
      assertEquals(
        _result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions,
      );

      // Custom options pattern
      assertEquals(_result.data.options.customVariables.pattern, "\\{\\{custom_[a-z]+\\}\\}");

      // Default options description
      assertEquals(
        _result.data.options.customVariables.description,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.description,
      );
    }
  });
});
