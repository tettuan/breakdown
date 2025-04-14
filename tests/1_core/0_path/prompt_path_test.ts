import { assertEquals, assertMatch } from "$std/testing/asserts.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { setupTestEnvironment, cleanupTestEnvironment } from "../../helpers/setup.ts";
import { getPromptPath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("prompt-path"));

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic prompt path tests
Deno.test("prompt path - basic path generation", () => {
  logger.debug("Testing basic prompt path generation");
  
  const testCases = [
    {
      demonstrativeType: "to",
      layerType: "issue",
      fromFile: "project_summary.md",
      shouldContain: "/to/issue/f_project.md",
    },
    {
      demonstrativeType: "summary",
      layerType: "task",
      fromFile: "issue_details.md",
      shouldContain: "/summary/task/f_issue.md",
    },
  ];

  for (const { demonstrativeType, layerType, fromFile, shouldContain } of testCases) {
    logger.debug("Testing case", { demonstrativeType, layerType, fromFile });
    const result = getPromptPath(demonstrativeType, layerType, fromFile);
    assertMatch(result, new RegExp(shouldContain.replace(/\//g, "\\/")));
    logger.debug("Case passed", { demonstrativeType, layerType, fromFile, result });
  }
});

// Layer type inference tests
Deno.test("prompt path - layer type inference", () => {
  logger.debug("Testing layer type inference from file names");
  
  const testCases = [
    {
      demonstrativeType: "to",
      layerType: "task",
      fromFile: "path/to/project_file.md",
      expectedType: "project",
    },
    {
      demonstrativeType: "to",
      layerType: "task",
      fromFile: "path/to/issue_details.md",
      expectedType: "issue",
    },
    {
      demonstrativeType: "to",
      layerType: "issue",
      fromFile: "path/to/task_list.md",
      expectedType: "task",
    },
  ];

  for (const { demonstrativeType, layerType, fromFile, expectedType } of testCases) {
    logger.debug("Testing type inference", { fromFile, expectedType });
    const result = getPromptPath(demonstrativeType, layerType, fromFile);
    assertMatch(result, new RegExp(`f_${expectedType}\\.md$`));
    logger.debug("Type inference passed", { fromFile, expectedType, result });
  }
});

// Special character handling
Deno.test("prompt path - special characters in paths", () => {
  logger.debug("Testing prompt paths with special characters");
  
  const testCases = [
    {
      demonstrativeType: "to",
      layerType: "issue",
      fromFile: "path/with spaces/project.md",
      shouldContain: "/to/issue/f_project.md",
    },
    {
      demonstrativeType: "summary",
      layerType: "task",
      fromFile: "path/with%20spaces/issue.md",
      shouldContain: "/summary/task/f_issue.md",
    },
  ];

  for (const { demonstrativeType, layerType, fromFile, shouldContain } of testCases) {
    logger.debug("Testing special character case", { fromFile });
    const result = getPromptPath(demonstrativeType, layerType, fromFile);
    assertMatch(result, new RegExp(shouldContain.replace(/\//g, "\\/")));
    logger.debug("Special character case passed", { fromFile, result });
  }
});

// Fallback behavior tests
Deno.test("prompt path - fallback to layer type", () => {
  logger.debug("Testing fallback to layer type when no type found in filename");
  
  const testCases = [
    {
      demonstrativeType: "to",
      layerType: "issue",
      fromFile: "generic_file.md",
      expectedType: "issue",
    },
    {
      demonstrativeType: "summary",
      layerType: "task",
      fromFile: "no_type_here.md",
      expectedType: "task",
    },
  ];

  for (const { demonstrativeType, layerType, fromFile, expectedType } of testCases) {
    logger.debug("Testing fallback case", { fromFile, layerType });
    const result = getPromptPath(demonstrativeType, layerType, fromFile);
    assertMatch(result, new RegExp(`f_${expectedType}\\.md$`));
    logger.debug("Fallback case passed", { fromFile, layerType, result });
  }
}); 