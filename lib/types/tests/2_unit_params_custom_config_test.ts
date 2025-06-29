/**
 * Unit tests for ParamsCustomConfig - Functional behavior validation
 * 
 * These tests verify the functional behavior of ParamsCustomConfig.create method
 * and ensure correct handling of various configuration scenarios.
 * 
 * Test scope:
 * - Configuration detection logic
 * - Override extraction and merging
 * - Default value handling
 * - Error scenarios
 * - Edge cases
 */

import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { 
  ParamsCustomConfig,
  ConfigError,
  ResultStatus,
  type Result
} from "../mod.ts";

import type { CustomConfig } from "@tettuan/breakdownparams";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";

const logger = new BreakdownLogger("params-custom-config-unit");

describe("ParamsCustomConfig.create - Missing Configuration Detection", () => {
  it("should return undefined for empty object", () => {
    logger.debug("Testing empty object configuration");
    
    const result = ParamsCustomConfig.create({});
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return undefined for null configuration", () => {
    logger.debug("Testing null configuration");
    
    const result = ParamsCustomConfig.create(null as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return undefined for undefined configuration", () => {
    logger.debug("Testing undefined configuration");
    
    const result = ParamsCustomConfig.create(undefined as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return undefined when breakdown is null", () => {
    logger.debug("Testing null breakdown section");
    
    const result = ParamsCustomConfig.create({ breakdown: null } as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return undefined when breakdown is empty", () => {
    logger.debug("Testing empty breakdown section");
    
    const result = ParamsCustomConfig.create({ breakdown: {} });
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return undefined when breakdown has only unrelated config", () => {
    logger.debug("Testing breakdown with unrelated configuration");
    
    const result = ParamsCustomConfig.create({ 
      breakdown: { 
        unrelated: "config",
        other: { nested: "value" }
      } 
    } as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS) {
      assertEquals(result.data, undefined);
    }
  });

  it("should return config when any valid section exists", () => {
    logger.debug("Testing detection of valid sections");
    
    const configs = [
      { breakdown: { params: {} } },
      { breakdown: { options: {} } },
      { breakdown: { validation: {} } },
      { breakdown: { errorHandling: {} } }
    ];
    
    configs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config);
      
      assertEquals(result.status, ResultStatus.SUCCESS, `Config ${index} should succeed`);
      if (result.status === ResultStatus.SUCCESS) {
        assertExists(result.data, `Config ${index} should return data`);
      }
    });
  });
});

describe("ParamsCustomConfig.create - Params Section Extraction", () => {
  it("should extract demonstrativeType override", () => {
    logger.debug("Testing demonstrativeType extraction");
    
    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(custom|test)$",
              errorMessage: "Must be custom or test"
            }
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(custom|test)$");
      assertEquals(result.data.params.two.demonstrativeType.errorMessage, "Must be custom or test");
      
      // layerType should use default
      assertEquals(
        result.data.params.two.layerType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern
      );
    }
  });

  it("should extract layerType override", () => {
    logger.debug("Testing layerType extraction");
    
    const config = {
      breakdown: {
        params: {
          two: {
            layerType: {
              pattern: "^(domain|application|infrastructure)$",
              errorMessage: "Invalid layer type"
            }
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.params.two.layerType.pattern, "^(domain|application|infrastructure)$");
      assertEquals(result.data.params.two.layerType.errorMessage, "Invalid layer type");
      
      // demonstrativeType should use default
      assertEquals(
        result.data.params.two.demonstrativeType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern
      );
    }
  });

  it("should extract both type overrides", () => {
    logger.debug("Testing both types extraction");
    
    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(get|post|put|delete)$",
              errorMessage: "Invalid HTTP method"
            },
            layerType: {
              pattern: "^(controller|service|repository)$",
              errorMessage: "Invalid layer"
            }
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(get|post|put|delete)$");
      assertEquals(result.data.params.two.layerType.pattern, "^(controller|service|repository)$");
    }
  });

  it("should ignore invalid params structures", () => {
    logger.debug("Testing invalid params structure handling");
    
    const invalidConfigs = [
      { breakdown: { params: "string" } },
      { breakdown: { params: { two: "string" } } },
      { breakdown: { params: { two: { demonstrativeType: "string" } } } },
      { breakdown: { params: { two: { demonstrativeType: { pattern: 123 } } } } },
      { breakdown: { params: { two: { demonstrativeType: { pattern: "valid", errorMessage: 123 } } } } }
    ];
    
    invalidConfigs.forEach((config, index) => {
      const result = ParamsCustomConfig.create(config as any);
      
      assertEquals(result.status, ResultStatus.SUCCESS, `Config ${index} should not error`);
      if (result.status === ResultStatus.SUCCESS && result.data) {
        // Should use defaults when invalid
        assertEquals(
          result.data.params.two.demonstrativeType.pattern,
          DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern,
          `Config ${index} should use default pattern`
        );
      }
    });
  });
});

describe("ParamsCustomConfig.create - Options Section Extraction", () => {
  it("should extract customVariables pattern override", () => {
    logger.debug("Testing customVariables pattern extraction");
    
    const config = {
      breakdown: {
        options: {
          customVariables: {
            pattern: "\\[\\[\\w+\\]\\]"
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.options.customVariables.pattern, "\\[\\[\\w+\\]\\]");
      // Description should use default
      assertEquals(
        result.data.options.customVariables.description,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.description
      );
    }
  });

  it("should extract customVariables description override", () => {
    logger.debug("Testing customVariables description extraction");
    
    const config = {
      breakdown: {
        options: {
          customVariables: {
            description: "Custom variable format"
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.options.customVariables.description, "Custom variable format");
      // Pattern should use default
      assertEquals(
        result.data.options.customVariables.pattern,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.pattern
      );
    }
  });
});

describe("ParamsCustomConfig.create - Validation Section Extraction", () => {
  it("should extract zero validation overrides", () => {
    logger.debug("Testing zero validation extraction");
    
    const config = {
      breakdown: {
        validation: {
          zero: {
            allowedOptions: ["help", "version", "init"],
            allowedValueOptions: ["config"],
            allowCustomVariables: true
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.validation.zero.allowedOptions, ["help", "version", "init"]);
      assertEquals(result.data.validation.zero.allowedValueOptions, ["config"]);
      assertEquals(result.data.validation.zero.allowCustomVariables, true);
      
      // Other validations should use defaults
      assertEquals(
        result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions
      );
    }
  });

  it("should handle partial validation overrides", () => {
    logger.debug("Testing partial validation overrides");
    
    const config = {
      breakdown: {
        validation: {
          one: {
            allowCustomVariables: false
            // Other fields not provided
          },
          two: {
            allowedOptions: ["custom1", "custom2"]
            // Other fields not provided
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      // one: only allowCustomVariables overridden
      assertEquals(result.data.validation.one.allowCustomVariables, false);
      assertEquals(
        result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions
      );
      
      // two: only allowedOptions overridden
      assertEquals(result.data.validation.two.allowedOptions, ["custom1", "custom2"]);
      assertEquals(
        result.data.validation.two.allowCustomVariables,
        DEFAULT_CUSTOM_CONFIG.validation.two.allowCustomVariables
      );
    }
  });
});

describe("ParamsCustomConfig.create - ErrorHandling Section Extraction", () => {
  it("should extract all errorHandling overrides", () => {
    logger.debug("Testing complete errorHandling extraction");
    
    const config = {
      breakdown: {
        errorHandling: {
          unknownOption: "ignore" as const,
          duplicateOption: "warn" as const,
          emptyValue: "error" as const
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      assertEquals(result.data.errorHandling.unknownOption, "ignore");
      assertEquals(result.data.errorHandling.duplicateOption, "warn");
      assertEquals(result.data.errorHandling.emptyValue, "error");
    }
  });

  it("should ignore invalid errorHandling values", () => {
    logger.debug("Testing invalid errorHandling value handling");
    
    const config = {
      breakdown: {
        errorHandling: {
          unknownOption: "invalid",
          duplicateOption: 123,
          emptyValue: null
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should use defaults for invalid values
      assertEquals(
        result.data.errorHandling.unknownOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.unknownOption
      );
      assertEquals(
        result.data.errorHandling.duplicateOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption
      );
      assertEquals(
        result.data.errorHandling.emptyValue,
        DEFAULT_CUSTOM_CONFIG.errorHandling.emptyValue
      );
    }
  });
});

describe("ParamsCustomConfig.create - Complex Scenarios", () => {
  it("should handle complete configuration override", () => {
    logger.debug("Testing complete configuration override");
    
    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(read|write|execute)$",
              errorMessage: "Invalid operation"
            },
            layerType: {
              pattern: "^(data|logic|presentation)$",
              errorMessage: "Invalid layer"
            }
          }
        },
        options: {
          customVariables: {
            pattern: "<%\\w+%>",
            description: "ASP-style variables"
          }
        },
        validation: {
          zero: {
            allowedOptions: ["h", "v"],
            allowedValueOptions: [],
            allowCustomVariables: false
          },
          one: {
            allowedOptions: ["o", "c"],
            allowedValueOptions: ["f"],
            allowCustomVariables: true
          },
          two: {
            allowedOptions: [],
            allowedValueOptions: ["x", "y"],
            allowCustomVariables: true
          }
        },
        errorHandling: {
          unknownOption: "warn" as const,
          duplicateOption: "ignore" as const,
          emptyValue: "ignore" as const
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Verify all overrides
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(read|write|execute)$");
      assertEquals(result.data.params.two.layerType.pattern, "^(data|logic|presentation)$");
      assertEquals(result.data.options.customVariables.pattern, "<%\\w+%>");
      assertEquals(result.data.options.customVariables.description, "ASP-style variables");
      assertEquals(result.data.validation.zero.allowedOptions, ["h", "v"]);
      assertEquals(result.data.validation.one.allowedOptions, ["o", "c"]);
      assertEquals(result.data.validation.two.allowedValueOptions, ["x", "y"]);
      assertEquals(result.data.errorHandling.unknownOption, "warn");
      assertEquals(result.data.errorHandling.duplicateOption, "ignore");
      assertEquals(result.data.errorHandling.emptyValue, "ignore");
    }
  });

  it("should handle deeply nested partial overrides", () => {
    logger.debug("Testing deeply nested partial overrides");
    
    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              errorMessage: "Custom error only"
              // pattern not provided
            }
          }
        },
        validation: {
          one: {
            allowedOptions: ["custom"]
            // other fields not provided
          }
        }
      }
    };
    
    const result = ParamsCustomConfig.create(config);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should preserve partial override but not apply incomplete objects
      // Since pattern is missing, the whole demonstrativeType should use default
      assertEquals(
        result.data.params.two.demonstrativeType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern
      );
      assertEquals(
        result.data.params.two.demonstrativeType.errorMessage,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.errorMessage
      );
      
      // Validation should be partially overridden
      assertEquals(result.data.validation.one.allowedOptions, ["custom"]);
    }
  });

  it("should handle configuration with extra fields", () => {
    logger.debug("Testing configuration with extra fields");
    
    const config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(test)$",
              errorMessage: "Test",
              extraField: "ignored"
            },
            extraType: {
              pattern: "ignored"
            }
          },
          three: {
            ignored: "value"
          }
        },
        extraSection: {
          ignored: "value"
        }
      },
      otherConfig: {
        ignored: "value"
      }
    };
    
    const result = ParamsCustomConfig.create(config as any);
    
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data) {
      // Should extract valid fields and ignore extras
      assertEquals(result.data.params.two.demonstrativeType.pattern, "^(test)$");
      
      // Should not include extra fields
      assertEquals((result.data.params.two.demonstrativeType as any).extraField, undefined);
      assertEquals((result.data.params.two as any).extraType, undefined);
      assertEquals((result.data.params as any).three, undefined);
    }
  });
});