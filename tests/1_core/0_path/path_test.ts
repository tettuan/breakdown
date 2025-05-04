import { assertEquals, assertMatch } from "jsr:@std/testing@^0.224.0/asserts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";
import { autoCompletePath, generateDefaultFilename, normalizePath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";
import { PromptVariablesFactory } from "$lib/factory/PromptVariablesFactory.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
import { join } from "@std/path/join";

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
Deno.test("path - autoCompletePath with filename", async () => {
  logger.debug("Testing path completion with filename");
  const input = "test.md";
  const demonstrative = "to";
  // Ensure config file exists
  const configDir = join(".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);
  const cliParams = { demonstrativeType: demonstrative, layerType: "issue", options: { fromFile: input } };
  const factory = await PromptVariablesFactory.create(cliParams);
  const result = autoCompletePath(input, demonstrative, factory);
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
Deno.test("path - autoCompletePath with invalid input", async () => {
  logger.debug("Testing path completion with invalid input");
  const input = undefined;
  const demonstrative = "to";
  // Ensure config file exists
  const configDir = join(".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);
  const cliParams = { demonstrativeType: demonstrative, layerType: "issue", options: { fromFile: input } };
  const factory = await PromptVariablesFactory.create(cliParams);
  const result = autoCompletePath(input, demonstrative, factory);
  logger.debug("Path completion with invalid input result", { input, demonstrative, result });
  assertEquals(result, "");
});
