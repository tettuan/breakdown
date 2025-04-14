import { assertEquals, assertMatch } from "$std/testing/asserts.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { setupTestEnvironment, cleanupTestEnvironment } from "../../helpers/setup.ts";
import { normalizePath, autoCompletePath, generateDefaultFilename } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("path"));

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Simple path tests
Deno.test("path - normalizePath basic", () => {
  logger.debug("Testing basic path normalization");
  const input = "test/path";
  const expected = "./test/path";
  assertEquals(normalizePath(input), expected);
  logger.debug("Basic path normalization successful", { input, expected });
});

// Path completion tests
Deno.test("path - autoCompletePath with filename", () => {
  logger.debug("Testing path completion with filename");
  const input = "test.md";
  const demonstrative = "to";
  const result = autoCompletePath(input, demonstrative);
  logger.debug("Path completion result", { input, demonstrative, result });
  assertMatch(result, /\/test\.md$/);
});

// Default filename generation
Deno.test("path - generateDefaultFilename format", () => {
  logger.debug("Testing default filename generation");
  const filename = generateDefaultFilename();
  logger.debug("Generated filename", { filename });
  
  // Check format: YYYYMMDD_hash.md
  const pattern = /^\d{8}_[a-f0-9]{8}\.md$/;
  assertMatch(filename, pattern, `Filename ${filename} does not match expected pattern`);
});

// Error cases
Deno.test("path - autoCompletePath with invalid input", () => {
  logger.debug("Testing path completion with invalid input");
  const input = undefined;
  const demonstrative = "to";
  const result = autoCompletePath(input, demonstrative);
  logger.debug("Path completion with invalid input result", { input, demonstrative, result });
  assertMatch(result, /\.md$/);
}); 