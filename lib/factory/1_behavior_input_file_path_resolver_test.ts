/**
 * @fileoverview 1_behavior tests for InputFilePathResolver
 * Testing functional behavior and business logic
 *
 * Behavior tests verify:
 * - Correct resolution of various input path types
 * - Proper handling of stdin input
 * - Expected error cases for invalid inputs
 * - Path resolution consistency across platforms
 */

import { assertEquals, assertExists } from "@std/assert";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { isAbsolute, join } from "@std/path";

const logger = new BreakdownLogger("behavior-input-file-path-resolver");

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

Deno.test("1_behavior: resolves stdin input correctly", () => {
  logger.debug("Testing stdin input resolution");

  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: { fromFile: "-" },
      },
      expected: { type: "stdin", value: "-", exists: true },
    },
    {
      params: {
        demonstrativeType: "to",
        layerType: "task",
        options: { fromFile: "stdin" },
      },
      expected: { type: "filename", exists: true },
    },
  ];

  for (const { params, expected } of testCases) {
    const resolverResult = InputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expected.type);
        if (expected.value !== undefined) {
          assertEquals(pathResult.data.value, expected.value);
        }
        assertEquals(pathResult.data.exists, expected.exists);
      }
    }
  }
});

Deno.test("1_behavior: resolves absolute paths correctly", () => {
  logger.debug("Testing absolute path resolution");

  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: { fromFile: "/absolute/path/file.md" },
      },
      expected: {
        type: "absolute",
        value: "/absolute/path/file.md",
      },
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { fromFile: "/Users/test/documents/input.txt" },
      },
      expected: {
        type: "absolute",
        value: "/Users/test/documents/input.txt",
      },
    },
  ];

  for (const { params, expected } of testCases) {
    const resolverResult = InputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expected.type);
        assertEquals(pathResult.data.value, expected.value);
        assertEquals(isAbsolute(pathResult.data.value), true);
      }
    }
  }
});

Deno.test("1_behavior: resolves relative paths correctly", () => {
  logger.debug("Testing relative path resolution");

  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "task",
        options: { fromFile: "./input/file.md" },
      },
      expectedType: "filename",
    },
    {
      params: {
        demonstrativeType: "defect",
        layerType: "issue",
        options: { fromFile: "../documents/input.txt" },
      },
      expectedType: "filename",
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "project",
        options: { fromFile: "subfolder/file.md" },
      },
      expectedType: "relative",
    },
  ];

  for (const { params, expectedType } of testCases) {
    const resolverResult = InputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
        assertEquals(isAbsolute(pathResult.data.value), true); // Resolved to absolute
      }
    }
  }
});

Deno.test("1_behavior: resolves filename-only paths correctly", () => {
  logger.debug("Testing filename-only path resolution");

  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "input.md" },
  };

  const resolverResult = InputFilePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);

    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "filename");
      // Should resolve to current working directory + filename
      const expectedPath = join(Deno.cwd(), "input.md");
      assertEquals(pathResult.data.value, expectedPath);
    }
  }
});

Deno.test("1_behavior: handles missing fromFile option", () => {
  logger.debug("Testing missing fromFile option");

  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {}, // No fromFile
  };

  const resolverResult = InputFilePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // When fromFile is missing, it should handle gracefully
      assertExists(pathResult.data);
    }
  }
});

Deno.test("1_behavior: handles empty fromFile value", () => {
  logger.debug("Testing empty fromFile value");

  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "" },
  };

  const resolverResult = InputFilePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // When fromFile is empty, it should handle gracefully
      assertExists(pathResult.data);
    }
  }
});

Deno.test("1_behavior: supports TwoParams_Result format", () => {
  logger.debug("Testing TwoParams_Result format support");

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromFile: "test-input.md",
    },
  };

  const resolverResult = InputFilePathResolver.create(validConfig, twoParamsResult);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);

    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "filename");
      assertExists(pathResult.data.value);
    }
  }
});

Deno.test("1_behavior: supports directive/layer object format", () => {
  logger.debug("Testing directive/layer object format support");

  const directiveLayerParams = {
    directive: { value: "to", data: "to" },
    layer: { value: "project", data: "project" },
    options: {
      fromFile: "./local/file.md",
    },
  };

  const resolverResult = InputFilePathResolver.create(
    validConfig,
    directiveLayerParams as unknown as PromptCliParams,
  );
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);

    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "filename");
      assertExists(pathResult.data.value);
    }
  }
});

Deno.test("1_behavior: handles special characters in paths", () => {
  logger.debug("Testing special characters in paths");

  const testCases = [
    {
      fromFile: "file with spaces.md",
      expectedType: "filename",
    },
    {
      fromFile: "./path/with spaces/file.md",
      expectedType: "filename",
    },
    {
      fromFile: "file-with-dashes.md",
      expectedType: "filename",
    },
    {
      fromFile: "file_with_underscores.md",
      expectedType: "filename",
    },
  ];

  for (const { fromFile, expectedType } of testCases) {
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile },
    };

    const resolverResult = InputFilePathResolver.create(validConfig, params);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
      }
    }
  }
});
