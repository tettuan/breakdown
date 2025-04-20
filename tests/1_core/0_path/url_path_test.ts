import { assertEquals, assertMatch, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";
import { autoCompletePath, normalizePath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("url-path"));

// Test URL path normalization
Deno.test("url path - normalization of URLs", () => {
  logger.debug("Testing URL path normalization");

  // Test basic URL path
  assertEquals(
    normalizePath("file:///path/to/file.md"),
    "./path/to/file.md",
    "Should normalize file URL to relative path",
  );

  // Test path with spaces
  assertEquals(
    normalizePath("path/to/my file.md"),
    "./path/to/my file.md",
    "Should handle spaces in path",
  );

  // Test path with URL-encoded spaces
  assertEquals(
    normalizePath("path/to/my%20file.md"),
    "./path/to/my file.md",
    "Should decode URL-encoded spaces",
  );

  // Test path with special characters
  assertEquals(
    normalizePath("path/to/file-with-特殊文字.md"),
    "./path/to/file-with-特殊文字.md",
    "Should handle special characters",
  );
});

// Test invalid URL paths
Deno.test("url path - invalid paths", () => {
  logger.debug("Testing invalid URL paths");

  // Test empty path
  assertThrows(
    () => normalizePath(""),
    Error,
    "Path is required",
    "Should throw on empty path",
  );

  // Test invalid URL format
  const result = normalizePath("invalid://path");
  assertMatch(
    result,
    /^\.\/invalid:\/\/path$/,
    "Should handle invalid URL format gracefully",
  );
});

// Test relative path handling
Deno.test("url path - relative paths", () => {
  logger.debug("Testing relative path handling");

  // Test current directory path
  assertEquals(
    normalizePath("./file.md"),
    "./file.md",
    "Should preserve current directory prefix",
  );

  // Test parent directory path
  assertEquals(
    normalizePath("../file.md"),
    "../file.md",
    "Should preserve parent directory reference",
  );

  // Test multiple parent directories
  assertEquals(
    normalizePath("../../file.md"),
    "../../file.md",
    "Should preserve multiple parent directory references",
  );
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
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
