/**
 * Consistency tests for EnhancedParamsParser with/without customConfig
 *
 * These tests ensure that the EnhancedParamsParser behaves consistently
 * across different configuration scenarios and documents the current
 * limitations of BreakdownParams integration.
 */

import { assertEquals } from "@std/assert";
import { EnhancedParamsParser } from "../../../lib/cli/parser/enhanced_params_parser.ts";

Deno.test("EnhancedParamsParser - CustomConfig vs No Config Consistency", async (t) => {
  await t.step("should handle 'find bugs' consistently without custom config", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse(["find", "bugs"]);

    // Without custom config, "find bugs" should be treated as two-parameter command
    assertEquals(result.type, "two");

    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
  });

  await t.step("should handle 'find bugs' with custom config that defines find pattern", () => {
    const customConfig = {
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
          allowedOptions: ["from", "destination"],
          valueOptions: ["from", "destination"],
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
    };

    const parser = new EnhancedParamsParser(customConfig);
    const result = parser.parse(["find", "bugs"]);

    // With custom config that defines "find" pattern, should be treated as two-parameter
    assertEquals(result.type, "two");

    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
  });

  await t.step("should handle commands with extra arguments as errors", () => {
    const parserNoConfig = new EnhancedParamsParser();
    const parserWithConfig = new EnhancedParamsParser({
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
            pattern: "^(to|summary|defect)$", // Note: "find" not included
            errorMessage: "Invalid demonstrative type. Must be one of: to, summary, defect",
          },
          layerType: {
            pattern: "^(project|issue|task)$", // Note: "bugs" not included
            errorMessage: "Invalid layer type. Must be one of: project, issue, task",
          },
        },
      },
    });

    // Both should treat "find bugs layer" as error due to too many arguments
    const result1 = parserNoConfig.parse(["find", "bugs", "component"]);
    const result2 = parserWithConfig.parse(["find", "bugs", "component"]);

    assertEquals(result1.type, "error");
    assertEquals(result2.type, "error");
  });
});

Deno.test("EnhancedParamsParser - BreakdownParams Limitations Documentation", async (t) => {
  await t.step("should handle options correctly with custom config", () => {
    const customConfig = {
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
          allowedOptions: ["from", "destination"],
          valueOptions: ["from", "destination"],
        },
      },
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(find)$",
            errorMessage: "Invalid demonstrative type. Must be: find",
          },
          layerType: {
            pattern: "^(bugs)$",
            errorMessage: "Invalid layer type. Must be: bugs",
          },
        },
      },
    };

    const parser = new EnhancedParamsParser(customConfig);

    // With proper validation config and enhanced parser, options are handled correctly
    const result = parser.parse(["find", "bugs", "--from", "test.js"]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).demonstrativeType, "find");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).layerType, "bugs");
    // deno-lint-ignore no-explicit-any
    assertEquals((result as any).options.from, "test.js");
  });

  await t.step("should document equals format preprocessing", () => {
    const parser = new EnhancedParamsParser();

    // Test that equals format is preprocessed correctly
    const result = parser.parse(["find", "bugs", "--from=test.js"]);

    assertEquals(result.type, "two");

    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");

    // The equals format should be preprocessed and the option parsed
    assertEquals(twoResult.options.from, "test.js");
  });

  await t.step("should handle unknown options correctly", () => {
    const parser = new EnhancedParamsParser();

    // Unknown options should be handled gracefully
    const result = parser.parse(["find", "bugs", "--unknown-option=value"]);

    assertEquals(result.type, "two");

    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.options["unknown-option"], "value");
  });
});

Deno.test("EnhancedParamsParser - Edge Cases and Backwards Compatibility", async (t) => {
  await t.step("should maintain backwards compatibility with standard commands", () => {
    const parser = new EnhancedParamsParser();

    // Standard two-word commands should work as before
    const result1 = parser.parse(["to", "project"]);
    const result2 = parser.parse(["summary", "issue"]);

    assertEquals(result1.type, "two");
    assertEquals(result2.type, "two");

    // deno-lint-ignore no-explicit-any
    assertEquals((result1 as any).demonstrativeType, "to");
    // deno-lint-ignore no-explicit-any
    assertEquals((result1 as any).layerType, "project");

    // deno-lint-ignore no-explicit-any
    assertEquals((result2 as any).demonstrativeType, "summary");
    // deno-lint-ignore no-explicit-any
    assertEquals((result2 as any).layerType, "issue");
  });

  await t.step("should handle empty and minimal args", () => {
    const parser = new EnhancedParamsParser();

    const result1 = parser.parse([]);
    const result2 = parser.parse(["init"]);

    assertEquals(result1.type, "zero");
    assertEquals(result2.type, "one");
  });

  await t.step("should handle custom variables with extra arguments as error", () => {
    const parser = new EnhancedParamsParser();

    const result = parser.parse([
      "find",
      "bugs",
      "layer",
      "--uv-project=myapp",
      "--uv-team=backend",
    ]);

    // Too many arguments should result in error
    assertEquals(result.type, "error");
  });
});
