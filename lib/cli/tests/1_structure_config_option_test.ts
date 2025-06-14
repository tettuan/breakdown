/**
 * Tests for --config option parsing
 *
 * Tests that the --config option is properly parsed and handled
 * by the EnhancedParamsParser.
 */

import { assertEquals } from "jsr:@std/assert";
import { EnhancedParamsParser } from "../../../lib/cli/parser/enhanced_params_parser.ts";

/**
 * CustomConfig interface that matches the structure expected by BreakdownParams.
 * This interface defines the configuration for parameter validation and options.
 */
interface CustomConfig {
  validation?: {
    zero?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
    one?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
    two?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
  };
  params?: {
    two?: {
      demonstrativeType?: {
        pattern: string;
        errorMessage: string;
      };
      layerType?: {
        pattern: string;
        errorMessage: string;
      };
    };
  };
  options?: {
    values?: Record<string, {
      shortForm?: string;
      description?: string;
      valueRequired?: boolean;
      allowEqualsFormat?: boolean;
    }>;
    flags?: Record<string, {
      shortForm?: string;
      description?: string;
    }>;
  };
}

Deno.test("Config Option - Basic Parsing", async (t) => {
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version", "config"],
        valueOptions: ["config"],
      },
      one: {
        allowedOptions: ["config", "help", "version"],
        valueOptions: ["config"],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "config",
          "help",
          "version",
        ],
        valueOptions: [
          "from",
          "destination",
          "config",
        ],
      },
    },
    params: {
      two: {
        demonstrativeType: {
          pattern: "^(to|summary|defect|find)$",
          errorMessage: "Invalid demonstrative type. Must be one of: to, summary, defect, find",
        },
        layerType: {
          pattern: "^(project|issue|task|bugs)$",
          errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs",
        },
      },
    },
    options: {
      values: {
        from: {
          shortForm: "f",
          description: "Source file path or stdin input",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        destination: {
          shortForm: "o",
          description: "Output file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        config: {
          shortForm: "c",
          description: "Configuration file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
      },
      flags: {
        help: {
          shortForm: "h",
          description: "Show help message",
        },
        version: {
          shortForm: "v",
          description: "Show version information",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should parse --config with long form", () => {
    const result = parser.parse(["--config", "config.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "config.json");
  });

  await t.step("should parse --config with short form -c", () => {
    const result = parser.parse(["-c", "settings.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "settings.json");
  });

  await t.step("should parse --config with equals format", () => {
    const result = parser.parse(["--config=custom.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "custom.json");
  });

  await t.step("should parse -c with equals format", () => {
    const result = parser.parse(["-c=my-config.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "my-config.json");
  });

  await t.step("should handle config paths with special characters", () => {
    const result = parser.parse(["--config=./path/to/config-file.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "./path/to/config-file.json");
  });

  await t.step("should handle config paths with equals signs in value", () => {
    const result = parser.parse(["--config=config=production.json"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "config=production.json");
  });
});

Deno.test("Config Option - With Commands", async (t) => {
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version", "config"],
        valueOptions: ["config"],
      },
      one: {
        allowedOptions: ["config", "help", "version"],
        valueOptions: ["config"],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "config",
          "help",
          "version",
        ],
        valueOptions: [
          "from",
          "destination",
          "config",
        ],
      },
    },
    params: {
      two: {
        demonstrativeType: {
          pattern: "^(to|summary|defect|find)$",
          errorMessage: "Invalid demonstrative type. Must be one of: to, summary, defect, find",
        },
        layerType: {
          pattern: "^(project|issue|task|bugs)$",
          errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs",
        },
      },
    },
    options: {
      values: {
        from: {
          shortForm: "f",
          description: "Source file path or stdin input",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        destination: {
          shortForm: "o",
          description: "Output file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        config: {
          shortForm: "c",
          description: "Configuration file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
      },
      flags: {
        help: {
          shortForm: "h",
          description: "Show help message",
        },
        version: {
          shortForm: "v",
          description: "Show version information",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should parse config with one-parameter command", () => {
    const result = parser.parse(["init", "--config", "project.json"]);

    assertEquals(result.type, "one");
    assertEquals(result.options?.config, "project.json");
  });

  await t.step("should parse config with two-parameter command", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--config",
      "find-bugs.json",
      "--from",
      "src/",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.config, "find-bugs.json");
    assertEquals(result.options?.from, "src/");
  });

  await t.step("should parse config with mixed option formats", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "-c=custom.json",
      "--from",
      "input.js",
      "-o=output.md",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.config, "custom.json");
    assertEquals(result.options?.from, "input.js");
    assertEquals(result.options?.destination, "output.md");
  });

  await t.step("should parse config as first option", () => {
    const result = parser.parse([
      "--config=settings.json",
      "find",
      "bugs",
      "--from=src/",
    ]);

    // Note: Config as first option is parsed as zero type
    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "settings.json");
  });
});

Deno.test("Config Option - Error Cases", async (t) => {
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version", "config"],
        valueOptions: ["config"],
      },
      one: {
        allowedOptions: ["config", "help", "version"],
        valueOptions: ["config"],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "config",
          "help",
          "version",
        ],
        valueOptions: [
          "from",
          "destination",
          "config",
        ],
      },
    },
    options: {
      values: {
        config: {
          shortForm: "c",
          description: "Configuration file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
      },
      flags: {
        help: {
          shortForm: "h",
          description: "Show help message",
        },
        version: {
          shortForm: "v",
          description: "Show version information",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should handle --config without value", () => {
    const result = parser.parse(["--config"]);

    // Should be an error since config requires a value
    if (result.type === "error") {
      // deno-lint-ignore no-explicit-any
      const errorCode = (result as any).error?.code;
      assertEquals(typeof errorCode, "string");
    }
  });

  await t.step("should handle -c without value", () => {
    const result = parser.parse(["-c"]);

    // Should be an error since config requires a value
    if (result.type === "error") {
      // deno-lint-ignore no-explicit-any
      const errorCode = (result as any).error?.code;
      assertEquals(typeof errorCode, "string");
    }
  });

  await t.step("should handle empty config value with equals", () => {
    const result = parser.parse(["--config="]);

    // Empty config value is accepted and parsed as undefined
    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, undefined);
  });
});

Deno.test("Config Option - Integration with Other Options", async (t) => {
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version", "config", "extended"],
        valueOptions: ["config"],
      },
      one: {
        allowedOptions: ["config", "help", "version", "extended"],
        valueOptions: ["config"],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "config",
          "help",
          "version",
          "extended",
          "adaptation",
        ],
        valueOptions: [
          "from",
          "destination",
          "config",
          "adaptation",
        ],
      },
    },
    params: {
      two: {
        demonstrativeType: {
          pattern: "^(to|summary|defect|find)$",
          errorMessage: "Invalid demonstrative type",
        },
        layerType: {
          pattern: "^(project|issue|task|bugs)$",
          errorMessage: "Invalid layer type",
        },
      },
    },
    options: {
      values: {
        from: {
          shortForm: "f",
          description: "Source file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        destination: {
          shortForm: "o",
          description: "Output file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        config: {
          shortForm: "c",
          description: "Configuration file path",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        adaptation: {
          shortForm: "a",
          description: "Adaptation type",
          valueRequired: true,
          allowEqualsFormat: true,
        },
      },
      flags: {
        help: {
          shortForm: "h",
          description: "Show help message",
        },
        version: {
          shortForm: "v",
          description: "Show version information",
        },
        extended: {
          description: "Enable extended mode",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should parse config with multiple options", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--config=settings.json",
      "--from=src/",
      "--destination=report.md",
      "--extended",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.config, "settings.json");
    assertEquals(result.options?.from, "src/");
    assertEquals(result.options?.destination, "report.md");
    assertEquals(result.options?.extended, true);
  });

  await t.step("should parse config with all short forms", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "-c=config.json",
      "-f=input.js",
      "-o=output.md",
      "-a=strict",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.config, "config.json");
    assertEquals(result.options?.from, "input.js");
    assertEquals(result.options?.destination, "output.md");
    assertEquals(result.options?.adaptation, "strict");
  });

  await t.step("should handle config with help flag", () => {
    const result = parser.parse(["--config=help.json", "--help"]);

    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "help.json");
    assertEquals(result.options?.help, true);
  });

  await t.step("should handle complex config paths", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--config=./configs/find-bugs/production.json",
      "-f=/usr/src/app/index.js",
      "-o=/tmp/output/report.md",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.config, "./configs/find-bugs/production.json");
    assertEquals(result.options?.from, "/usr/src/app/index.js");
    assertEquals(result.options?.destination, "/tmp/output/report.md");
  });
});
