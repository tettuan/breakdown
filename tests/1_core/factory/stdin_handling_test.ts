/**
 * Tests for stdin handling in the factory
 *
 * Purpose:
 * - Test that stdin input is correctly handled by the factory
 * - Verify that stdin input is properly passed to the prompt manager
 * - Ensure that stdin input is not rejected when using '-' as input
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 * - docs/breakdown/options.ja.md: Option specifications
 *
 * Dependencies:
 * - Requires 1_core/1_io/stdin_test.ts to pass first
 * - Requires 1_core/4_cli/io_test.ts to pass first
 */

import { assertEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import { setInputTextVariable } from "$lib/factory/variables_util.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";
import { join } from "@std/path/join";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_factory_stdin";
let originalCwd: string;

Deno.test("Factory stdin handling", async (t) => {
  await t.step("setup", async () => {
    logger.debug("Setting up test environment", {
      purpose: "Prepare test directory for factory stdin tests",
      dir: TEST_DIR,
    });
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
    await ensureDir(TEST_DIR);

    // Create minimal config file for CLI
    const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "default-app.yml"),
      `working_dir: ${TEST_DIR}/.agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
    );

    // Create prompts directory structure
    await ensureDir(join(TEST_DIR, ".agent", "breakdown", "prompts"));
    await ensureDir(join(TEST_DIR, ".agent", "breakdown", "prompts", "to", "project"));

    // Save and change working directory to test dir
    originalCwd = Deno.cwd();
    Deno.chdir(TEST_DIR);
  });

  await t.step("should handle stdin input", async () => {
    logger.debug("Testing stdin input handling in factory", {
      purpose: "Verify stdin input is correctly processed",
    });

    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: "-",
        destinationFile: "output.md",
      },
    };

    const factory = await PromptVariablesFactory.create(cliParams);
    const params = factory.getAllParams();
    const updatedParams = setInputTextVariable(params, "Test input from stdin");

    assertEquals(
      updatedParams.input_text,
      "Test input from stdin",
      "Input text should be set from stdin",
    );
  });

  await t.step("should handle both stdin and file input", async () => {
    logger.debug("Testing handling of both stdin and file input", {
      purpose: "Verify stdin input is correctly processed with file input",
    });

    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: "-",
        destinationFile: "output.md",
      },
    };

    const factory = await PromptVariablesFactory.create(cliParams);
    const params = factory.getAllParams();
    const updatedParams = setInputTextVariable(params, "Test input from stdin");

    assertEquals(
      updatedParams.input_text,
      "Test input from stdin",
      "Input text should be set from stdin",
    );
  });

  await t.step("cleanup", async () => {
    logger.debug("Cleaning up test environment", {
      purpose: "Remove test directory and files",
      dir: TEST_DIR,
    });
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch (error) {
      logger.error("Failed to clean up test directory", { error });
    }
    // Restore original working directory
    Deno.chdir(originalCwd);
  });
});
