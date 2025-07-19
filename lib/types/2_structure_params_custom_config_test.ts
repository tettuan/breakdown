/**
 * @fileoverview Structure tests for ParamsCustomConfig
 *
 * Tests structural integrity and relationships within the ParamsCustomConfig
 * system including:
 * - Type consistency and constraints
 * - Interface structure validation
 * - Data structure integrity
 * - BreakdownParams compatibility
 *
 * @module types/params_custom_config_test
 */

import { assertEquals, assertInstanceOf } from "jsr:@std/assert@0.224.0";
import { ConfigError, ParamsConfig, ParamsCustomConfig } from "./params_custom_config.ts";
import { ResultStatus } from "./enums.ts";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";
import type { CustomConfig } from "@tettuan/breakdownparams";

Deno.test("ParamsCustomConfig - Structure: ConfigError extends Error properly", () => {
  const error = new ConfigError("Test message", "TEST_CODE");

  // Should be instance of both Error and ConfigError
  assertInstanceOf(error, Error);
  assertInstanceOf(error, ConfigError);

  // Should have proper property types
  assertEquals(typeof error.name, "string");
  assertEquals(typeof error.message, "string");
  assertEquals(typeof error.code, "string");
  assertEquals(typeof error.stack, "string");

  // Should have expected values
  assertEquals(error.name, "ConfigError");
  assertEquals(error.message, "Test message");
  assertEquals(error.code, "TEST_CODE");
});

Deno.test("ParamsCustomConfig - Structure: ParamsConfig interface consistency", () => {
  // Should match expected structure
  const config: ParamsConfig = {
    directiveType: {
      pattern: "test-pattern",
      errorMessage: "test-error",
    },
    demonstrativeType: {
      pattern: "test-pattern",
      errorMessage: "test-error",
    },
    layerType: {
      pattern: "layer-pattern",
      errorMessage: "layer-error",
    },
  };

  // All fields should be required and typed correctly
  assertEquals(typeof config.directiveType, "object");
  assertEquals(typeof config.demonstrativeType, "object");
  assertEquals(typeof config.layerType, "object");
  assertEquals(typeof config.directiveType.pattern, "string");
  assertEquals(typeof config.directiveType.errorMessage, "string");
  assertEquals(typeof config.demonstrativeType.pattern, "string");
  assertEquals(typeof config.demonstrativeType.errorMessage, "string");
  assertEquals(typeof config.layerType.pattern, "string");
  assertEquals(typeof config.layerType.errorMessage, "string");
});

Deno.test("ParamsCustomConfig - Structure: Result type structure consistency", () => {
  const successResult = ParamsCustomConfig.create({
    breakdown: {
      params: { two: { demonstrativeType: { pattern: "test", errorMessage: "test" } } },
    },
  });

  // Success result structure
  assertEquals(typeof successResult, "object");
  assertEquals(typeof successResult.status, "string");
  assertEquals(successResult.status, ResultStatus.SUCCESS);

  if (successResult.status === ResultStatus.SUCCESS) {
    // Success should have data property
    assertEquals("data" in successResult, true);
    assertEquals("error" in successResult, false);
  }

  // Error result structure (simulate error)
  const malformedInput = { breakdown: { params: "invalid" } };
  const errorResult = ParamsCustomConfig.create(malformedInput);

  assertEquals(typeof errorResult, "object");
  assertEquals(typeof errorResult.status, "string");

  if (errorResult.status === ResultStatus.ERROR) {
    assertEquals("error" in errorResult, true);
    assertEquals("data" in errorResult, false);
    assertInstanceOf(errorResult.error, ConfigError);
  }
});

Deno.test("ParamsCustomConfig - Structure: CustomConfig compatibility", () => {
  const result = ParamsCustomConfig.create({
    breakdown: {
      params: {
        two: {
          demonstrativeType: { pattern: "test", errorMessage: "test" },
        },
      },
    },
  });

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    const customConfig: CustomConfig = result.data;

    // Should have all required CustomConfig sections
    assertEquals(typeof customConfig.params, "object");
    assertEquals(typeof customConfig.options, "object");
    assertEquals(typeof customConfig.validation, "object");
    assertEquals(typeof customConfig.errorHandling, "object");

    // Params structure should match
    assertEquals(typeof customConfig.params.two, "object");
    assertEquals(typeof customConfig.params.two.demonstrativeType, "object");
    assertEquals(typeof customConfig.params.two.layerType, "object");

    // Options structure should match
    assertEquals(typeof customConfig.options.customVariables, "object");
    assertEquals(typeof customConfig.options.customVariables.pattern, "string");
    assertEquals(typeof customConfig.options.customVariables.description, "string");

    // Validation structure should match
    assertEquals(typeof customConfig.validation.zero, "object");
    assertEquals(typeof customConfig.validation.one, "object");
    assertEquals(typeof customConfig.validation.two, "object");
    assertEquals(Array.isArray(customConfig.validation.zero.allowedOptions), true);
    assertEquals(Array.isArray(customConfig.validation.zero.allowedValueOptions), true);
    assertEquals(typeof customConfig.validation.zero.allowCustomVariables, "boolean");

    // ErrorHandling structure should match
    assertEquals(typeof customConfig.errorHandling.unknownOption, "string");
    assertEquals(typeof customConfig.errorHandling.duplicateOption, "string");
    assertEquals(typeof customConfig.errorHandling.emptyValue, "string");
  }
});

Deno.test("ParamsCustomConfig - Structure: DEFAULT_CUSTOM_CONFIG structure consistency", () => {
  // Should have required top-level sections
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG, "object");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params, "object");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.options, "object");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.validation, "object");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.errorHandling, "object");

  // Params structure
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params.two, "object");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern, "string");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.errorMessage, "string");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern, "string");
  assertEquals(typeof DEFAULT_CUSTOM_CONFIG.params.two.layerType.errorMessage, "string");

  // Validation structure
  ["zero", "one", "two"].forEach((key) => {
    const section =
      DEFAULT_CUSTOM_CONFIG.validation[key as keyof typeof DEFAULT_CUSTOM_CONFIG.validation];
    assertEquals(Array.isArray(section.allowedOptions), true);
    assertEquals(Array.isArray(section.allowedValueOptions), true);
    assertEquals(typeof section.allowCustomVariables, "boolean");
  });

  // ErrorHandling values should be valid enum values
  const validValues = ["error", "ignore", "warn"];
  assertEquals(validValues.includes(DEFAULT_CUSTOM_CONFIG.errorHandling.unknownOption), true);
  assertEquals(validValues.includes(DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption), true);
  assertEquals(validValues.includes(DEFAULT_CUSTOM_CONFIG.errorHandling.emptyValue), true);
});

Deno.test("ParamsCustomConfig - Structure: Input configuration structure validation", () => {
  // Valid input structure
  const validInput = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "string",
            errorMessage: "string",
          },
          layerType: {
            pattern: "string",
            errorMessage: "string",
          },
        },
      },
      options: {
        customVariables: {
          pattern: "string",
          description: "string",
        },
      },
      validation: {
        zero: {
          allowedOptions: ["string"],
          allowedValueOptions: ["string"],
          allowCustomVariables: true,
        },
      },
      errorHandling: {
        unknownOption: "warn",
        duplicateOption: "error",
        emptyValue: "ignore",
      },
    },
  };

  const result = ParamsCustomConfig.create(validInput);
  assertEquals(result.status, ResultStatus.SUCCESS);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Structure should be preserved and properly typed
    assertEquals(typeof result.data, "object");
  }
});

Deno.test("ParamsCustomConfig - Structure: Nested object validation consistency", () => {
  const nestedConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "nested-test",
            errorMessage: "nested-error",
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(nestedConfig);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Deep object access should work
    assertEquals(result.data.params.two.demonstrativeType.pattern, "nested-test");
    assertEquals(result.data.params.two.demonstrativeType.errorMessage, "nested-error");

    // Non-overridden nested objects should maintain structure
    assertEquals(typeof result.data.params.two.layerType, "object");
    assertEquals(typeof result.data.params.two.layerType.pattern, "string");
    assertEquals(typeof result.data.params.two.layerType.errorMessage, "string");
  }
});

Deno.test("ParamsCustomConfig - Structure: Array field type consistency", () => {
  const configWithArrays = {
    breakdown: {
      validation: {
        zero: {
          allowedOptions: ["--help", "--version"],
          allowedValueOptions: [],
          allowCustomVariables: false,
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(configWithArrays);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Arrays should maintain proper type
    assertEquals(Array.isArray(result.data.validation.zero.allowedOptions), true);
    assertEquals(Array.isArray(result.data.validation.zero.allowedValueOptions), true);

    // Array contents should be strings
    result.data.validation.zero.allowedOptions.forEach((option) => {
      assertEquals(typeof option, "string");
    });

    // Boolean field should maintain type
    assertEquals(typeof result.data.validation.zero.allowCustomVariables, "boolean");
  }
});

Deno.test("ParamsCustomConfig - Structure: Enum value constraints", () => {
  const validEnumValues = ["error", "ignore", "warn"] as const;

  // Test valid enum values
  validEnumValues.forEach((value) => {
    const config = {
      breakdown: {
        errorHandling: {
          unknownOption: value,
        },
      },
    };

    const result = ParamsCustomConfig.create(config);

    if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
      assertEquals(result.data.errorHandling.unknownOption, value);
    }
  });

  // Invalid enum value should be ignored
  const invalidConfig = {
    breakdown: {
      errorHandling: {
        unknownOption: "invalid_value",
      },
    },
  };

  const invalidResult = ParamsCustomConfig.create(invalidConfig);

  if (invalidResult.status === ResultStatus.SUCCESS && invalidResult.data !== undefined) {
    // Should fall back to default
    assertEquals(
      invalidResult.data.errorHandling.unknownOption,
      DEFAULT_CUSTOM_CONFIG.errorHandling.unknownOption,
    );
  }
});

Deno.test("ParamsCustomConfig - Structure: Object immutability structure", () => {
  const originalConfig = {
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

  const result = ParamsCustomConfig.create(originalConfig);

  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Modifying input should not affect result
    originalConfig.breakdown.params.two.demonstrativeType.pattern = "modified";

    assertEquals(result.data.params.two.demonstrativeType.pattern, "original");
  }
});

Deno.test("ParamsCustomConfig - Structure: Return type union consistency", () => {
  // Success case should have data property
  const successResult = ParamsCustomConfig.create({
    breakdown: {
      params: { two: { demonstrativeType: { pattern: "test", errorMessage: "test" } } },
    },
  });

  if (successResult.status === ResultStatus.SUCCESS) {
    assertEquals("data" in successResult, true);
    assertEquals("error" in successResult, false);

    // Data can be undefined or CustomConfig
    assertEquals(
      successResult.data === undefined || typeof successResult.data === "object",
      true,
    );
  }

  // Error case should have error property
  const errorInput = { breakdown: { params: "invalid_structure" } };
  const errorResult = ParamsCustomConfig.create(errorInput);

  if (errorResult.status === ResultStatus.ERROR) {
    assertEquals("error" in errorResult, true);
    assertEquals("data" in errorResult, false);
    assertInstanceOf(errorResult.error, ConfigError);
  }
});
