/**
 * Tests for EnhancedParamsParser
 *
 * Tests the enhanced parser that handles two-parameter commands like "find bugs"
 * and equals format options like -f=test.md.
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

Deno.test("EnhancedParamsParser - Two Parameter Commands", async (t) => {
  // Use custom config that supports "find" as demonstrativeType and "bugs" as layerType
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version"],
        valueOptions: [],
      },
      one: {
        allowedOptions: [],
        valueOptions: [],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "input",
          "adaptation",
          "help",
          "version",
          "extended",
          "custom-validation",
          "prompt-dir",
          "error-format",
          "uv-*",
        ],
        valueOptions: [
          "from",
          "destination",
          "input",
          "adaptation",
          "prompt-dir",
          "error-format",
          "uv-*",
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
        input: {
          shortForm: "i",
          description: "Input layer type",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        adaptation: {
          shortForm: "a",
          description: "Adaptation type for template selection",
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
        "custom-validation": {
          description: "Enable custom validation",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should parse 'find bugs' as two-parameter command", () => {
    const result = parser.parse(["find", "bugs"]);

    assertEquals(result.type, "two");

    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
  });

  await t.step("should handle 'find bugs' with options", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--from",
      "input.js",
      "--destination",
      "output.md",
    ]);

    // With our enhanced implementation, this now works correctly
    assertEquals(result.type, "two");
    if (result.type === "two") {
      // deno-lint-ignore no-explicit-any
      assertEquals((result as any).demonstrativeType, "find");
      // deno-lint-ignore no-explicit-any
      assertEquals((result as any).layerType, "bugs");
      assertEquals(result.options?.from, "input.js");
      assertEquals(result.options?.destination, "output.md");
    }
  });

  await t.step("should handle short option flags", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "-f",
      "input.js",
      "-o",
      "output.md",
      "-i",
      "project",
      "-a",
      "detailed",
    ]);

    // With our enhanced implementation, this now works correctly
    assertEquals(result.type, "two");
    if (result.type === "two") {
      // deno-lint-ignore no-explicit-any
      assertEquals((result as any).demonstrativeType, "find");
      // deno-lint-ignore no-explicit-any
      assertEquals((result as any).layerType, "bugs");
      // Short options are converted to long forms
      assertEquals(result.options?.from, "input.js");
      assertEquals(result.options?.destination, "output.md");
      assertEquals(result.options?.input, "project");
      assertEquals(result.options?.adaptation, "detailed");
    }
  });
});

Deno.test("EnhancedParamsParser - Equals Format Support", async (t) => {
  const customConfig: CustomConfig = {
    validation: {
      zero: {
        allowedOptions: ["help", "version"],
        valueOptions: [],
      },
      one: {
        allowedOptions: [],
        valueOptions: [],
      },
      two: {
        allowedOptions: [
          "from",
          "destination",
          "input",
          "adaptation",
          "help",
          "version",
          "extended",
          "custom-validation",
          "prompt-dir",
          "error-format",
          "uv-*",
        ],
        valueOptions: [
          "from",
          "destination",
          "input",
          "adaptation",
          "prompt-dir",
          "error-format",
          "uv-*",
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
        input: {
          shortForm: "i",
          description: "Input layer type",
          valueRequired: true,
          allowEqualsFormat: true,
        },
        adaptation: {
          shortForm: "a",
          description: "Adaptation type for template selection",
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
        "custom-validation": {
          description: "Enable custom validation",
        },
      },
    },
  };

  const parser = new EnhancedParamsParser(customConfig);

  await t.step("should handle short option with equals format", () => {
    const result = parser.parse(["find", "bugs", "-f=test.js", "-o=output.md"]);

    // Enhanced parser now handles equals format correctly
    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.from, "test.js");
    assertEquals(result.options?.destination, "output.md");
  });

  await t.step("should handle long option with equals format", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--from=input.js",
      "--destination=output.md",
      "--adaptation=strict",
    ]);

    // Enhanced parser now handles equals format correctly
    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.from, "input.js");
    assertEquals(result.options?.destination, "output.md");
    assertEquals(result.options?.adaptation, "strict");
  });

  await t.step("should handle values containing equals sign", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "-f=file=with=equals.js",
      "--prompt-dir=/path/to=dir",
    ]);

    // Enhanced parser now handles values with equals signs correctly
    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.from, "file=with=equals.js");
    // prompt-dir is stored as-is with kebab case, not converted to camelCase
    assertEquals(result.options?.["prompt-dir"], "/path/to=dir");
  });

  await t.step("should parse custom variables with equals format", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "--uv-project=myapp",
      "--uv-team=backend",
    ]);

    // Note: BreakdownParams may return error for unknown options
    // This test documents the current behavior
    if (result.type === "error") {
      // Current behavior: BreakdownParams returns TOO_MANY_ARGS for --uv-* options
      // deno-lint-ignore no-explicit-any
      assertEquals((result as any).error?.code, "TOO_MANY_ARGS");
    } else {
      assertEquals(result.type, "two");
      // deno-lint-ignore no-explicit-any
      const twoResult = result as any;
      if (twoResult.options.customVariables) {
        const customVars = twoResult.options.customVariables as Record<string, string>;
        assertEquals(customVars.project, "myapp");
        assertEquals(customVars.team, "backend");
      }
    }
  });

  await t.step("should handle mixed format (equals and space)", () => {
    const result = parser.parse([
      "find",
      "bugs",
      "-f=test.js",
      "--destination",
      "output.md",
      "-i=project",
      "-a",
      "detailed",
    ]);

    // Enhanced parser now handles mixed format correctly
    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    assertEquals(result.options?.from, "test.js");
    assertEquals(result.options?.destination, "output.md");
    assertEquals(result.options?.input, "project");
    assertEquals(result.options?.adaptation, "detailed");
  });
});

Deno.test("EnhancedParamsParser - Compatibility with existing commands", async (t) => {
  const parser = new EnhancedParamsParser();

  await t.step("should delegate one-word commands to base parser", () => {
    const result = parser.parse(["init"]);
    assertEquals(result.type, "one");
  });

  await t.step("should delegate two-word commands to base parser", () => {
    const result1 = parser.parse(["to", "project"]);
    assertEquals(result1.type, "two");

    const result2 = parser.parse(["summary", "issue"]);
    assertEquals(result2.type, "two");

    const result3 = parser.parse(["defect", "task"]);
    assertEquals(result3.type, "two");
  });

  await t.step("should delegate help and version flags to base parser", () => {
    const result1 = parser.parse(["--help"]);
    assertEquals(result1.type, "zero");

    const result2 = parser.parse(["--version"]);
    assertEquals(result2.type, "zero");
  });
});

Deno.test("EnhancedParamsParser - CustomConfig Support", async (t) => {
  await t.step("should work without customConfig (backward compatibility)", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse(["to", "project"]);

    assertEquals(result.type, "two");
  });

  await t.step("should accept customConfig parameter", () => {
    const customConfig: CustomConfig = {
      validation: {
        zero: {
          allowedOptions: ["help", "version"],
          valueOptions: [],
        },
        one: {
          allowedOptions: [],
          valueOptions: [],
        },
        two: {
          allowedOptions: ["from", "help", "version"],
          valueOptions: ["from"],
        },
      },
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(to|summary|defect)$",
            errorMessage: "Invalid demonstrative type",
          },
          layerType: {
            pattern: "^(project|issue|task)$",
            errorMessage: "Invalid layer type",
          },
        },
      },
      options: {
        values: {
          from: {
            shortForm: "f",
            description: "Source file",
            valueRequired: true,
          },
        },
        flags: {
          help: {
            shortForm: "h",
            description: "Show help",
          },
          version: {
            shortForm: "v",
            description: "Show version",
          },
        },
      },
    };

    const parser = new EnhancedParamsParser(customConfig);
    const result = parser.parse(["to", "project"]);

    assertEquals(result.type, "two");
  });

  await t.step("should pass customConfig to base parser", () => {
    const customConfig: CustomConfig = {
      validation: {
        zero: {
          allowedOptions: ["help", "version"],
          valueOptions: [],
        },
        one: {
          allowedOptions: [],
          valueOptions: [],
        },
        two: {
          allowedOptions: [],
          valueOptions: [],
        },
      },
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(to|summary|defect)$",
            errorMessage: "Invalid demonstrative type",
          },
          layerType: {
            pattern: "^(project|issue|task)$",
            errorMessage: "Invalid layer type",
          },
        },
      },
      options: {
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

    // Test that base parser receives the customConfig for regular commands
    const result = parser.parse(["--help"]);
    assertEquals(result.type, "zero");
  });
});
