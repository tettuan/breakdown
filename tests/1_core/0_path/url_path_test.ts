import { assertEquals, assertMatch } from "$std/testing/asserts.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { setupTestEnvironment, cleanupTestEnvironment } from "../../helpers/setup.ts";
import { normalizePath, autoCompletePath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("url-path"));

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// URL path normalization tests
Deno.test("url path - normalizePath with URL-like paths", () => {
  logger.debug("Testing URL path normalization");
  
  const testCases = [
    {
      input: "file:///path/to/file.md",
      expected: "./path/to/file.md",
    },
    {
      input: "/absolute/path/file.md",
      expected: "./absolute/path/file.md",
    },
    {
      input: "./relative/path/file.md",
      expected: "./relative/path/file.md",
    },
  ];

  for (const { input, expected } of testCases) {
    logger.debug("Testing case", { input, expected });
    const result = normalizePath(input);
    assertEquals(result, expected);
    logger.debug("Case passed", { input, expected, result });
  }
});

// URL path completion tests
Deno.test("url path - autoCompletePath with URL-like paths", () => {
  logger.debug("Testing URL path completion");
  
  const testCases = [
    {
      input: "file:///test.md",
      demonstrative: "to",
      shouldContain: "/test.md",
    },
    {
      input: "/absolute/test.md",
      demonstrative: "summary",
      shouldContain: "/absolute/test.md",
    },
  ];

  for (const { input, demonstrative, shouldContain } of testCases) {
    logger.debug("Testing case", { input, demonstrative, shouldContain });
    const result = autoCompletePath(input, demonstrative);
    assertMatch(result, new RegExp(shouldContain.replace(/\//g, "\\/")));
    logger.debug("Case passed", { input, demonstrative, result });
  }
});

// Edge cases
Deno.test("url path - normalizePath with special characters", () => {
  logger.debug("Testing path normalization with special characters");
  
  const testCases = [
    {
      input: "path/with spaces/file.md",
      shouldContain: "path/with spaces/file.md",
    },
    {
      input: "path/with%20encoded/file.md",
      shouldContain: "path/with encoded/file.md",
    },
  ];

  for (const { input, shouldContain } of testCases) {
    logger.debug("Testing case", { input, shouldContain });
    const result = normalizePath(input);
    assertMatch(result, new RegExp(shouldContain.replace(/\//g, "\\/")));
    logger.debug("Case passed", { input, shouldContain, result });
  }
}); 