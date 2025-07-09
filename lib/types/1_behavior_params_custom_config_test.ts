/**
 * @fileoverview Behavior tests for ParamsCustomConfig
 * 
 * Tests the behavioral aspects of ParamsCustomConfig including:
 * - Configuration creation and merging logic
 * - Override behaviors and precedence
 * - Error handling scenarios
 * - Missing configuration detection
 * 
 * @module types/params_custom_config_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  ConfigError,
  ParamsCustomConfig,
} from "./params_custom_config.ts";
import { ResultStatus } from "./enums.ts";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";

Deno.test("ParamsCustomConfig - Behavior: create returns undefined for empty config", () => {
  const emptyConfig = {};
  const result = ParamsCustomConfig.create(emptyConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  if (result.status === ResultStatus.SUCCESS) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("ParamsCustomConfig - Behavior: create returns undefined for missing breakdown section", () => {
  const configWithoutBreakdown = {
    otherSection: {
      someValue: "test",
    },
  };
  
  const result = ParamsCustomConfig.create(configWithoutBreakdown);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  if (result.status === ResultStatus.SUCCESS) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles partial params override", () => {
  const partialConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(custom|test)$",
            errorMessage: "Custom demonstrative error",
          },
          // layerType intentionally omitted
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(partialConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Should override demonstrativeType
    assertEquals(result.data.params.two.demonstrativeType.pattern, "^(custom|test)$");
    assertEquals(result.data.params.two.demonstrativeType.errorMessage, "Custom demonstrative error");
    
    // Should preserve default layerType
    assertEquals(
      result.data.params.two.layerType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern
    );
    assertEquals(
      result.data.params.two.layerType.errorMessage,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.errorMessage
    );
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles complete params override", () => {
  const completeConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^custom_demo$",
            errorMessage: "Custom demo error",
          },
          layerType: {
            pattern: "^custom_layer$",
            errorMessage: "Custom layer error",
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(completeConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    assertEquals(result.data.params.two.demonstrativeType.pattern, "^custom_demo$");
    assertEquals(result.data.params.two.demonstrativeType.errorMessage, "Custom demo error");
    assertEquals(result.data.params.two.layerType.pattern, "^custom_layer$");
    assertEquals(result.data.params.two.layerType.errorMessage, "Custom layer error");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles options override", () => {
  const configWithOptions = {
    breakdown: {
      options: {
        customVariables: {
          pattern: "^custom-.*$",
          description: "Custom variables pattern",
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(configWithOptions);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    assertEquals(result.data.options.customVariables.pattern, "^custom-.*$");
    assertEquals(result.data.options.customVariables.description, "Custom variables pattern");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles validation override", () => {
  const configWithValidation = {
    breakdown: {
      validation: {
        zero: {
          allowedOptions: ["--custom-help", "--custom-version"],
          allowedValueOptions: [],
          allowCustomVariables: true,
        },
        one: {
          allowedOptions: ["--from", "--output"],
          allowedValueOptions: ["--from", "--output"],
          allowCustomVariables: false,
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(configWithValidation);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    assertEquals(result.data.validation.zero.allowedOptions, ["--custom-help", "--custom-version"]);
    assertEquals(result.data.validation.zero.allowCustomVariables, true);
    assertEquals(result.data.validation.one.allowedOptions, ["--from", "--output"]);
    assertEquals(result.data.validation.one.allowCustomVariables, false);
    
    // Non-overridden section should use defaults
    assertEquals(
      result.data.validation.two.allowedOptions,
      DEFAULT_CUSTOM_CONFIG.validation.two.allowedOptions
    );
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles errorHandling override", () => {
  const configWithErrorHandling = {
    breakdown: {
      errorHandling: {
        unknownOption: "warn",
        duplicateOption: "ignore",
        emptyValue: "error",
      },
    },
  };

  const result = ParamsCustomConfig.create(configWithErrorHandling);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    assertEquals(result.data.errorHandling.unknownOption, "warn");
    assertEquals(result.data.errorHandling.duplicateOption, "ignore");
    assertEquals(result.data.errorHandling.emptyValue, "error");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles mixed section overrides", () => {
  const mixedConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^mixed$",
            errorMessage: "Mixed error",
          },
        },
      },
      errorHandling: {
        unknownOption: "warn",
      },
    },
  };

  const result = ParamsCustomConfig.create(mixedConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Params override should work
    assertEquals(result.data.params.two.demonstrativeType.pattern, "^mixed$");
    assertEquals(result.data.params.two.demonstrativeType.errorMessage, "Mixed error");
    
    // ErrorHandling override should work
    assertEquals(result.data.errorHandling.unknownOption, "warn");
    
    // Non-overridden sections should use defaults
    assertEquals(
      result.data.params.two.layerType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern
    );
    assertEquals(
      result.data.errorHandling.duplicateOption,
      DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption
    );
    assertEquals(
      result.data.options.customVariables.pattern,
      DEFAULT_CUSTOM_CONFIG.options.customVariables.pattern
    );
  }
});

Deno.test("ParamsCustomConfig - Behavior: create ignores invalid field types", () => {
  const invalidConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: "invalid_string_instead_of_object",
          layerType: {
            pattern: "valid_pattern",
            errorMessage: "valid error",
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(invalidConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Invalid demonstrativeType should be ignored, default should be used
    assertEquals(
      result.data.params.two.demonstrativeType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern
    );
    
    // Valid layerType should be used
    assertEquals(result.data.params.two.layerType.pattern, "valid_pattern");
    assertEquals(result.data.params.two.layerType.errorMessage, "valid error");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create ignores invalid errorHandling values", () => {
  const invalidErrorHandlingConfig = {
    breakdown: {
      errorHandling: {
        unknownOption: "invalid_value", // Should be "error" | "ignore" | "warn"
        duplicateOption: "warn", // Valid
        emptyValue: "error", // Valid
      },
    },
  };

  const result = ParamsCustomConfig.create(invalidErrorHandlingConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Invalid value should be ignored, default should be used
    assertEquals(
      result.data.errorHandling.unknownOption,
      DEFAULT_CUSTOM_CONFIG.errorHandling.unknownOption
    );
    
    // Valid values should be used
    assertEquals(result.data.errorHandling.duplicateOption, "warn");
    assertEquals(result.data.errorHandling.emptyValue, "error");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles deeply nested invalid structure", () => {
  const deeplyInvalidConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: 123, // Should be string
            errorMessage: true, // Should be string
          },
          layerType: {
            pattern: "valid",
            errorMessage: "valid",
            extraField: "ignored", // Extra fields should be ignored
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(deeplyInvalidConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Invalid demonstrativeType should be ignored
    assertEquals(
      result.data.params.two.demonstrativeType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern
    );
    
    // Valid layerType should be used (extra fields ignored)
    assertEquals(result.data.params.two.layerType.pattern, "valid");
    assertEquals(result.data.params.two.layerType.errorMessage, "valid");
  }
});

Deno.test("ParamsCustomConfig - Behavior: create preserves all defaults for unspecified sections", () => {
  const minimalConfig = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: {
            pattern: "^minimal$",
            errorMessage: "Minimal error",
          },
        },
      },
    },
  };

  const result = ParamsCustomConfig.create(minimalConfig);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Specified override should work
    assertEquals(result.data.params.two.demonstrativeType.pattern, "^minimal$");
    
    // All other sections should match defaults exactly
    assertEquals(
      JSON.stringify(result.data.options),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.options)
    );
    assertEquals(
      JSON.stringify(result.data.validation),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.validation)
    );
    assertEquals(
      JSON.stringify(result.data.errorHandling),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.errorHandling)
    );
    assertEquals(
      result.data.params.two.layerType.pattern,
      DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern
    );
  }
});

Deno.test("ParamsCustomConfig - Behavior: create handles null and undefined values gracefully", () => {
  const configWithNulls = {
    breakdown: {
      params: {
        two: {
          demonstrativeType: null,
          layerType: undefined,
        },
      },
      options: null,
      validation: undefined,
    },
  };

  const result = ParamsCustomConfig.create(configWithNulls);
  
  assertEquals(result.status, ResultStatus.SUCCESS);
  
  if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
    // Should use defaults for null/undefined sections
    assertEquals(
      JSON.stringify(result.data.params.two),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.params.two)
    );
    assertEquals(
      JSON.stringify(result.data.options),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.options)
    );
    assertEquals(
      JSON.stringify(result.data.validation),
      JSON.stringify(DEFAULT_CUSTOM_CONFIG.validation)
    );
  }
});