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

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { ConfigError, ParamsCustomConfig, type Result, ResultStatus } from "./mod.ts";

import type { CustomConfig } from "@tettuan/breakdownparams";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";

const _logger = new BreakdownLogger("params-custom-config-unit");

describe("ParamsCustomConfig.create - Missing Configuration Detection", () => {
  it("should return undefined for empty object", () => {
    _logger.debug("Testing empty object configuration");

    const _result = ParamsCustomConfig.create({});

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return undefined for null configuration", () => {
    _logger.debug("Testing null configuration");

    const _result = ParamsCustomConfig.create(null as unknown as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return undefined for undefined configuration", () => {
    _logger.debug("Testing undefined configuration");

    const _result = ParamsCustomConfig.create(undefined as unknown as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return undefined when breakdown is null", () => {
    _logger.debug("Testing null breakdown section");

    const _result = ParamsCustomConfig.create({ breakdown: null } as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return undefined when breakdown is empty", () => {
    _logger.debug("Testing empty breakdown section");

    const _result = ParamsCustomConfig.create({ breakdown: {} });

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return undefined when breakdown has only unrelated config", () => {
    _logger.debug("Testing breakdown with unrelated configuration");

    const _result = ParamsCustomConfig.create({
      breakdown: {
        unrelated: "config",
        other: { nested: "value" },
      },
    } as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS) {
      assertEquals(_result.data, undefined);
    }
  });

  it("should return config when any valid section exists", () => {
    _logger.debug("Testing detection of valid sections");

    const configs = [
      { breakdown: { params: {} } },
      { breakdown: { options: {} } },
      { breakdown: { validation: {} } },
      { breakdown: { errorHandling: {} } },
    ];

    configs.forEach((config, index) => {
      const _result = ParamsCustomConfig.create(_config);

      assertEquals(_result.status, ResultStatus.SUCCESS, `Config ${index} should succeed`);
      if (_result.status === ResultStatus.SUCCESS) {
        assertExists(_result.data, `Config ${index} should return data`);
      }
    });
  });
});

describe("ParamsCustomConfig.create - Params Section Extraction", () => {
  it("should extract demonstrativeType override", () => {
    _logger.debug("Testing demonstrativeType extraction");

    const _config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(custom|test)$",
              errorMessage: "Must be custom or test",
            },
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(custom|test)$");
      assertEquals(_result.data.params.two.demonstrativeType.errorMessage, "Must be custom or test");

      // layerType should use default
      assertEquals(
        _result.data.params.two.layerType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.layerType.pattern,
      );
    }
  });

  it("should extract layerType override", () => {
    _logger.debug("Testing layerType extraction");

    const _config = {
      breakdown: {
        params: {
          two: {
            layerType: {
              pattern: "^(domain|application|infrastructure)$",
              errorMessage: "Invalid layer type",
            },
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(
        _result.data.params.two.layerType.pattern,
        "^(domain|application|infrastructure)$",
      );
      assertEquals(_result.data.params.two.layerType.errorMessage, "Invalid layer type");

      // demonstrativeType should use default
      assertEquals(
        _result.data.params.two.demonstrativeType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern,
      );
    }
  });

  it("should extract both type overrides", () => {
    _logger.debug("Testing both types extraction");

    const _config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(get|post|put|delete)$",
              errorMessage: "Invalid HTTP method",
            },
            layerType: {
              pattern: "^(controller|service|repository)$",
              errorMessage: "Invalid layer",
            },
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(get|post|put|delete)$");
      assertEquals(_result.data.params.two.layerType.pattern, "^(controller|service|repository)$");
    }
  });

  it("should ignore invalid params structures", () => {
    _logger.debug("Testing invalid params structure handling");

    const invalidConfigs = [
      { breakdown: { params: "string" } },
      { breakdown: { params: { two: "string" } } },
      { breakdown: { params: { two: { demonstrativeType: "string" } } } },
      { breakdown: { params: { two: { demonstrativeType: { pattern: 123 } } } } },
      {
        breakdown: {
          params: { two: { demonstrativeType: { pattern: "valid", errorMessage: 123 } } },
        },
      },
    ];

    invalidConfigs.forEach((config, index) => {
      const _result = ParamsCustomConfig.create(config as Record<string, unknown>);

      assertEquals(_result.status, ResultStatus.SUCCESS, `Config ${index} should not error`);
      if (_result.status === ResultStatus.SUCCESS && _result.data) {
        // Should use defaults when invalid
        assertEquals(
          _result.data.params.two.demonstrativeType.pattern,
          DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern,
          `Config ${index} should use default pattern`,
        );
      }
    });
  });
});

describe("ParamsCustomConfig.create - Options Section Extraction", () => {
  it("should extract customVariables pattern override", () => {
    _logger.debug("Testing customVariables pattern extraction");

    const _config = {
      breakdown: {
        options: {
          customVariables: {
            pattern: "\\[\\[\\w+\\]\\]",
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.options.customVariables.pattern, "\\[\\[\\w+\\]\\]");
      // Description should use default
      assertEquals(
        _result.data.options.customVariables.description,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.description,
      );
    }
  });

  it("should extract customVariables description override", () => {
    _logger.debug("Testing customVariables description extraction");

    const _config = {
      breakdown: {
        options: {
          customVariables: {
            description: "Custom variable format",
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.options.customVariables.description, "Custom variable format");
      // Pattern should use default
      assertEquals(
        _result.data.options.customVariables.pattern,
        DEFAULT_CUSTOM_CONFIG.options.customVariables.pattern,
      );
    }
  });
});

describe("ParamsCustomConfig.create - Validation Section Extraction", () => {
  it("should extract zero validation overrides", () => {
    _logger.debug("Testing zero validation extraction");

    const _config = {
      breakdown: {
        validation: {
          zero: {
            allowedOptions: ["help", "version", "init"],
            allowedValueOptions: ["config"],
            allowCustomVariables: true,
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.validation.zero.allowedOptions, ["help", "version", "init"]);
      assertEquals(_result.data.validation.zero.allowedValueOptions, ["config"]);
      assertEquals(_result.data.validation.zero.allowCustomVariables, true);

      // Other validations should use defaults
      assertEquals(
        _result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions,
      );
    }
  });

  it("should handle partial validation overrides", () => {
    _logger.debug("Testing partial validation overrides");

    const _config = {
      breakdown: {
        validation: {
          one: {
            allowCustomVariables: false,
            // Other fields not provided
          },
          two: {
            allowedOptions: ["custom1", "custom2"],
            // Other fields not provided
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // one: only allowCustomVariables overridden
      assertEquals(_result.data.validation.one.allowCustomVariables, false);
      assertEquals(
        _result.data.validation.one.allowedOptions,
        DEFAULT_CUSTOM_CONFIG.validation.one.allowedOptions,
      );

      // two: only allowedOptions overridden
      assertEquals(_result.data.validation.two.allowedOptions, ["custom1", "custom2"]);
      assertEquals(
        _result.data.validation.two.allowCustomVariables,
        DEFAULT_CUSTOM_CONFIG.validation.two.allowCustomVariables,
      );
    }
  });
});

describe("ParamsCustomConfig.create - ErrorHandling Section Extraction", () => {
  it("should extract all errorHandling overrides", () => {
    _logger.debug("Testing complete errorHandling extraction");

    const _config = {
      breakdown: {
        errorHandling: {
          unknownOption: "ignore" as const,
          duplicateOption: "warn" as const,
          emptyValue: "error" as const,
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      assertEquals(_result.data.errorHandling.unknownOption, "ignore");
      assertEquals(_result.data.errorHandling.duplicateOption, "warn");
      assertEquals(_result.data.errorHandling.emptyValue, "error");
    }
  });

  it("should ignore invalid errorHandling values", () => {
    _logger.debug("Testing invalid errorHandling value handling");

    const _config = {
      breakdown: {
        errorHandling: {
          unknownOption: "invalid",
          duplicateOption: 123,
          emptyValue: null,
        },
      },
    };

    const _result = ParamsCustomConfig.create(config as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Should use defaults for invalid values
      assertEquals(
        _result.data.errorHandling.unknownOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.unknownOption,
      );
      assertEquals(
        _result.data.errorHandling.duplicateOption,
        DEFAULT_CUSTOM_CONFIG.errorHandling.duplicateOption,
      );
      assertEquals(
        _result.data.errorHandling.emptyValue,
        DEFAULT_CUSTOM_CONFIG.errorHandling.emptyValue,
      );
    }
  });
});

describe("ParamsCustomConfig.create - Complex Scenarios", () => {
  it("should handle complete configuration override", () => {
    _logger.debug("Testing complete configuration override");

    const _config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(read|write|execute)$",
              errorMessage: "Invalid operation",
            },
            layerType: {
              pattern: "^(data|logic|presentation)$",
              errorMessage: "Invalid layer",
            },
          },
        },
        options: {
          customVariables: {
            pattern: "<%\\w+%>",
            description: "ASP-style variables",
          },
        },
        validation: {
          zero: {
            allowedOptions: ["h", "v"],
            allowedValueOptions: [],
            allowCustomVariables: false,
          },
          one: {
            allowedOptions: ["o", "c"],
            allowedValueOptions: ["f"],
            allowCustomVariables: true,
          },
          two: {
            allowedOptions: [],
            allowedValueOptions: ["x", "y"],
            allowCustomVariables: true,
          },
        },
        errorHandling: {
          unknownOption: "warn" as const,
          duplicateOption: "ignore" as const,
          emptyValue: "ignore" as const,
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Verify all overrides
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(read|write|execute)$");
      assertEquals(_result.data.params.two.layerType.pattern, "^(data|logic|presentation)$");
      assertEquals(_result.data.options.customVariables.pattern, "<%\\w+%>");
      assertEquals(_result.data.options.customVariables.description, "ASP-style variables");
      assertEquals(_result.data.validation.zero.allowedOptions, ["h", "v"]);
      assertEquals(_result.data.validation.one.allowedOptions, ["o", "c"]);
      assertEquals(_result.data.validation.two.allowedValueOptions, ["x", "y"]);
      assertEquals(_result.data.errorHandling.unknownOption, "warn");
      assertEquals(_result.data.errorHandling.duplicateOption, "ignore");
      assertEquals(_result.data.errorHandling.emptyValue, "ignore");
    }
  });

  it("should handle deeply nested partial overrides", () => {
    _logger.debug("Testing deeply nested partial overrides");

    const _config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              errorMessage: "Custom error only",
              // pattern not provided
            },
          },
        },
        validation: {
          one: {
            allowedOptions: ["custom"],
            // other fields not provided
          },
        },
      },
    };

    const _result = ParamsCustomConfig.create(_config);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Should preserve partial override but not apply incomplete objects
      // Since pattern is missing, the whole demonstrativeType should use default
      assertEquals(
        _result.data.params.two.demonstrativeType.pattern,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.pattern,
      );
      assertEquals(
        _result.data.params.two.demonstrativeType.errorMessage,
        DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType.errorMessage,
      );

      // Validation should be partially overridden
      assertEquals(_result.data.validation.one.allowedOptions, ["custom"]);
    }
  });

  it("should handle configuration with extra fields", () => {
    _logger.debug("Testing configuration with extra fields");

    const _config = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "^(test)$",
              errorMessage: "Test",
              extraField: "ignored",
            },
            extraType: {
              pattern: "ignored",
            },
          },
          three: {
            ignored: "value",
          },
        },
        extraSection: {
          ignored: "value",
        },
      },
      otherConfig: {
        ignored: "value",
      },
    };

    const _result = ParamsCustomConfig.create(config as Record<string, unknown>);

    assertEquals(_result.status, ResultStatus.SUCCESS);
    if (_result.status === ResultStatus.SUCCESS && _result.data) {
      // Should extract valid fields and ignore extras
      assertEquals(_result.data.params.two.demonstrativeType.pattern, "^(test)$");

      // Should not include extra fields
      assertEquals(
        (_result.data.params.two.demonstrativeType as unknown as { extraField?: unknown })
          .extraField,
        undefined,
      );
      assertEquals(
        (_result.data.params.two as unknown as { extraType?: unknown }).extraType,
        undefined,
      );
      assertEquals((_result.data.params as unknown as { three?: unknown }).three, undefined);
    }
  });
});
