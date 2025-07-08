/**
 * @fileoverview 1_behavior tests for OutputFilePathResolver
 * Testing functional behavior and business logic
 * 
 * Behavior tests verify:
 * - Correct resolution of various output path types
 * - Proper handling of auto-generated filenames
 * - Expected error cases for invalid outputs
 * - Path resolution consistency across platforms
 */

import { assertEquals, assertExists } from "@std/assert";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join, isAbsolute } from "@std/path";

const logger = new BreakdownLogger("behavior-output-file-path-resolver");

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

Deno.test("1_behavior: generates output filename automatically when not specified", () => {
  logger.debug("Testing automatic filename generation");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: {}, // No output specified
      },
      expectedType: "auto-generated",
      expectedGenerated: true,
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { fromFile: "input.md" }, // Has input but no output
      },
      expectedType: "auto-generated",
      expectedGenerated: true,
    },
  ];
  
  for (const { params, expectedType, expectedGenerated } of testCases) {
    const resolverResult = OutputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
        assertEquals(pathResult.data.isGenerated, expectedGenerated);
        assertExists(pathResult.data.value);
        // Auto-generated files should include timestamp or hash
        assertEquals(pathResult.data.value.includes("_"), true);
      }
    }
  }
});

Deno.test("1_behavior: resolves absolute output paths correctly", () => {
  logger.debug("Testing absolute path resolution");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: { output: "/absolute/path/output.md" },
      },
      expected: {
        type: "absolute",
        value: "/absolute/path/output.md",
        isGenerated: false,
      },
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "task",
        options: { output: "/Users/test/documents/result.txt" },
      },
      expected: {
        type: "absolute",
        value: "/Users/test/documents/result.txt",
        isGenerated: false,
      },
    },
  ];
  
  for (const { params, expected } of testCases) {
    const resolverResult = OutputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expected.type);
        assertEquals(pathResult.data.value, expected.value);
        assertEquals(pathResult.data.isGenerated, expected.isGenerated);
        assertEquals(isAbsolute(pathResult.data.value), true);
      }
    }
  }
});

Deno.test("1_behavior: resolves relative output paths correctly", () => {
  logger.debug("Testing relative path resolution");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "issue",
        options: { output: "./output/result.md" },
      },
      expectedType: "relative",
      expectedGenerated: false,
    },
    {
      params: {
        demonstrativeType: "defect",
        layerType: "task",
        options: { output: "../results/output.txt" },
      },
      expectedType: "relative",
      expectedGenerated: false,
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "project",
        options: { output: "subfolder/output.md" },
      },
      expectedType: "relative",
      expectedGenerated: false,
    },
  ];
  
  for (const { params, expectedType, expectedGenerated } of testCases) {
    const resolverResult = OutputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
        assertEquals(pathResult.data.isGenerated, expectedGenerated);
        assertEquals(isAbsolute(pathResult.data.value), true); // Resolved to absolute
      }
    }
  }
});

Deno.test("1_behavior: resolves filename-only output paths correctly", () => {
  logger.debug("Testing filename-only path resolution");
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { destinationFile: "output.md" },
  };
  
  const resolverResult = OutputFilePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "filename");
      assertEquals(pathResult.data.isGenerated, false);
      // Should resolve to cwd/layerType/output.md
      const expectedPath = join(Deno.cwd(), "project", "output.md");
      assertEquals(pathResult.data.value, expectedPath);
    }
  }
});

Deno.test("1_behavior: handles directory-only output paths", () => {
  logger.debug("Testing directory-only output paths");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: { output: "./output/" }, // Ends with slash
      },
      expectedType: "relative",
      expectedGenerated: true,
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { output: "/absolute/directory/" },
      },
      expectedType: "absolute",
      expectedGenerated: true,
    },
  ];
  
  for (const { params, expectedType, expectedGenerated } of testCases) {
    const resolverResult = OutputFilePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
        assertEquals(pathResult.data.isGenerated, expectedGenerated);
        // Should generate filename in the specified directory
        assertEquals(pathResult.data.value.includes(params.options.output.replace(/\/$/, "")), true);
      }
    }
  }
});

Deno.test("1_behavior: handles empty output value", () => {
  logger.debug("Testing empty output value");
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { destinationFile: "" },
  };
  
  const resolverResult = OutputFilePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, false);
    if (!pathResult.ok) {
      assertEquals(pathResult.error.kind, "InvalidPath");
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
      output: "test-output.md",
    },
  };
  
  const resolverResult = OutputFilePathResolver.create(validConfig, twoParamsResult);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "filename");
      assertEquals(pathResult.data.isGenerated, false);
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
      output: "./local/output.md",
    },
  };
  
  const resolverResult = OutputFilePathResolver.create(validConfig, directiveLayerParams as any);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertEquals(pathResult.data.type, "relative");
      assertEquals(pathResult.data.isGenerated, false);
      assertExists(pathResult.data.value);
    }
  }
});

Deno.test("1_behavior: handles special characters in output paths", () => {
  logger.debug("Testing special characters in paths");
  
  const testCases = [
    {
      output: "file with spaces.md",
      expectedType: "filename",
      expectedGenerated: false,
    },
    {
      output: "./path/with spaces/output.md",
      expectedType: "relative",
      expectedGenerated: false,
    },
    {
      output: "file-with-dashes.md",
      expectedType: "filename",
      expectedGenerated: false,
    },
    {
      output: "file_with_underscores.md",
      expectedType: "filename",
      expectedGenerated: false,
    },
  ];
  
  for (const { output, expectedType, expectedGenerated } of testCases) {
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: output },
    };
    
    const resolverResult = OutputFilePathResolver.create(validConfig, params);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType);
        assertEquals(pathResult.data.isGenerated, expectedGenerated);
      }
    }
  }
});

Deno.test("1_behavior: generates unique filenames for auto-generated output", () => {
  logger.debug("Testing unique filename generation");
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {}, // No output specified
  };
  
  const resolverResult1 = OutputFilePathResolver.create(validConfig, params);
  const resolverResult2 = OutputFilePathResolver.create(validConfig, params);
  
  assertEquals(resolverResult1.ok, true);
  assertEquals(resolverResult2.ok, true);
  
  if (resolverResult1.ok && resolverResult2.ok) {
    const pathResult1 = resolverResult1.data.getPath();
    const pathResult2 = resolverResult2.data.getPath();
    
    assertEquals(pathResult1.ok, true);
    assertEquals(pathResult2.ok, true);
    
    if (pathResult1.ok && pathResult2.ok) {
      // Auto-generated filenames should be unique
      assertEquals(pathResult1.data.value !== pathResult2.data.value, true);
      assertEquals(pathResult1.data.type, "auto-generated");
      assertEquals(pathResult2.data.type, "auto-generated");
    }
  }
});