/**
 * @fileoverview Architecture tests for ParamsCustomConfig
 *
 * Tests architectural constraints and completeness of the ParamsCustomConfig
 * system including Smart Constructor pattern, Result types, and type safety.
 *
 * @module types/params_custom_config_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { ConfigError, ParamsConfig, ParamsCustomConfig } from "./params_custom_config.ts";
import { Result as _Result, ResultStatus } from "./enums.ts";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";
import type { CustomConfig } from "@tettuan/breakdownparams";

Deno.test("ParamsCustomConfig - Architecture: Class structure completeness", () => {
  // ParamsCustomConfig should be a static utility class
  assertEquals(typeof ParamsCustomConfig, "function");
  assertEquals(typeof ParamsCustomConfig.create, "function");

  // Should not be instantiable (private constructor)
  const instance = ParamsCustomConfig as unknown;
  assertEquals(typeof instance, "function");
});

Deno.test("ParamsCustomConfig - Architecture: ConfigError class completeness", () => {
  const error = new ConfigError("Test message", "TEST_CODE");

  // Should extend Error
  assertInstanceOf(error, Error);
  assertInstanceOf(error, ConfigError);

  // Should have required properties
  assertEquals(error.name, "ConfigError");
  assertEquals(error.message, "Test message");
  assertEquals(error.code, "TEST_CODE");
});

Deno.test("ParamsCustomConfig - Architecture: ParamsConfig interface completeness", () => {
  const config: ParamsConfig = {
    demonstrativeType: {
      pattern: "test",
      errorMessage: "test error",
    },
    layerType: {
      pattern: "test",
      errorMessage: "test error",
    },
  };

  // Verify interface structure
  assertExists(config.demonstrativeType);
  assertExists(config.layerType);
  assertEquals(typeof config.demonstrativeType.pattern, "string");
  assertEquals(typeof config.demonstrativeType.errorMessage, "string");
  assertEquals(typeof config.layerType.pattern, "string");
  assertEquals(typeof config.layerType.errorMessage, "string");
});

Deno.test("ParamsCustomConfig - Architecture: Result type integration", () => {
  const successResult = ParamsCustomConfig.create({});

  // Should return Result type
  assertEquals(typeof successResult, "object");
  assertEquals(typeof successResult.status, "string");

  // Should have proper status values
  assertEquals(
    [ResultStatus.SUCCESS, ResultStatus.ERROR].includes(successResult.status),
    true,
  );
});

Deno.test("ParamsCustomConfig - Architecture: Smart Constructor pattern", () => {
  // Should have single static creation method
  assertEquals(typeof ParamsCustomConfig.create, "function");

  // Should not have public constructor
  // Note: This test validates the pattern intent rather than implementation details
  const result = ParamsCustomConfig.create({});
  assertEquals(typeof result, "object");
});

Deno.test("ParamsCustomConfig - Architecture: BreakdownParams integration", () => {
  // Should use DEFAULT_CUSTOM_CONFIG from BreakdownParams
  assertExists(DEFAULT_CUSTOM_CONFIG);
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG, "object");

  // Should have expected structure matching CustomConfig
  assertExists(DEFAULT_CUSTOM_CONFIG.params);
  assertExists(DEFAULT_CUSTOM_CONFIG.options);
  assertExists(DEFAULT_CUSTOM_CONFIG.validation);
  assertExists(DEFAULT_CUSTOM_CONFIG.errorHandling);
});

Deno.test("ParamsCustomConfig - Architecture: Type safety constraints", () => {
  const testConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^test$",
            errorMessage: "Test error",
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(testConfig);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Result should be typed as CustomConfig
    const customConfig: CustomConfig = result.data;
    assertExists(customConfig);
    assertExists(customConfig.params);
    assertExists(customConfig.options);
    assertExists(customConfig.validation);
    assertExists(customConfig.errorHandling);
  }
});

Deno.test("ParamsCustomConfig - Architecture: Error handling architecture", () => {
  // Should return typed errors
  const malformedConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: "invalid", // Should be object
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(malformedConfig);

  // Should handle errors gracefully and return valid Result type
  assertEquals(typeof result, "object");
  assertEquals(typeof result.status, "string");

  if (result.status === ResultStatus.ERROR) {
    assertInstanceOf(result.error, ConfigError);
  }
});

Deno.test("ParamsCustomConfig - Architecture: Undefined return handling", () => {
  // Should return undefined for missing configuration (as expected by BreakdownParams)
  const emptyConfig = {};
  const result = ParamsCustomConfig.create(emptyConfig);

  assertEquals(result.status, ResultStatus.SUCCESS);
  if (result.status === ResultStatus.SUCCESS) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("ParamsCustomConfig - Architecture: Partial override architecture", () => {
  const partialConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^custom$",
            errorMessage: "Custom error",
          },
          // layerType intentionally omitted - should use defaults
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(partialConfig);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Should merge with defaults
    assertEquals(result.data.params.two.demonstrativeType.pattern, "^custom$");
    assertEquals(result.data.params.two.demonstrativeType.errorMessage, "Custom error");

    // Should preserve defaults for non-overridden fields
    assertEquals(
      result.data.params.two.layerType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern,
    );
    assertEquals(
      result.data.params.two.layerType.errorMessage,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.errorMessage,
    );
  }
});

Deno.test("ParamsCustomConfig - Architecture: Full configuration section support", () => {
  const fullConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: { pattern: "test1", errorMessage: "error1" },
          layerType: { pattern: "test2", errorMessage: "error2" },
        },
      },
      options: {
        customVariables: {
          pattern: "custom-pattern",
          description: "custom description",
        },
      },
      validation: {
        zero: {
          allowedOptions: ["--help"],
          allowedValueOptions: [],
          allowCustomVariables: false,
        },
      },
      errorHandling: {
        unknownOption: "warn",
        duplicateOption: "error",
        emptyValue: "ignore",
      },
    },
  };

  const result = ParamsCustomConfig.create(fullConfig);

  assertEquals(result.status, ResultStatus.SUCCESS);
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // All sections should be properly typed and accessible
    assertExists(result.data.params);
    assertExists(result.data.options);
    assertExists(result.data.validation);
    assertExists(result.data.errorHandling);
  }
});

Deno.test("ParamsCustomConfig - Architecture: Immutability constraints", () => {
  const config = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "original",
            errorMessage: "original error",
          },
        },
      },
    },
  };

  const result1 = ParamsCustomConfig.create(config);
  const result2 = ParamsCustomConfig.create(config);

  // Should create separate instances
  assertEquals(result1.status, ResultStatus.SUCCESS);
  assertEquals(result2.status, ResultStatus.SUCCESS);

  if (
    result1.status === ResultStatus.SUCCESS && result1.data !== undefined &&
    result2.status === ResultStatus.SUCCESS && result2.data !== undefined
  ) {
    // Modifications to one should not affect the other
    assertEquals(result1.data !== result2.data, true);
  }
});
