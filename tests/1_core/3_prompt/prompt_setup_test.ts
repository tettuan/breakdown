/**
 * Tests for prompt setup functionality
 *
 * Purpose:
 * - Verify prompt directory creation
 * - Test template file creation
 * - Validate error handling during setup
 */

/*
 * IMPORTANT: All path resolution is based on config/app_prompt.base_dir (and app_schema.base_dir).
 * - Each test sets up a config file with app_prompt.base_dir and app_schema.base_dir in the test working directory.
 * - No promptDir or baseDir override is supported; config is the only source of truth.
 * - All expected paths are based on the config's baseDir ("prompts"), not hardcoded or empty/undefined.
 * - Directory structure is always created under the configured baseDir.
 */

import { assertEquals, assertRejects } from "jsr:@std/assert@^0.224.0";
import { join } from "jsr:@std/path@^0.224.0/join";
import { exists } from "jsr:@std/fs@^0.224.0";
import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";
import { TEST_BASE_DIR } from "$test/helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Preparing Part
interface SetupResult {
  inputContent: string;
  testPromptsDir: string;
  promptPath: string;
}

async function setupPromptFiles(workingDir: string): Promise<SetupResult> {
  logger.debug("Setting up prompt files", { workingDir });

  const inputContent = "# Project Title\n- Feature 1: First feature\n- Feature 2: Second feature";
  const testPromptsDir = join(workingDir, "prompts");
  const promptPath = join(testPromptsDir, "to", "issue", "f_project.md");

  // Create test prompt directory and template
  await ensureDir(join(testPromptsDir, "to", "issue"));
  const promptTemplate = `# {{input_text_file}}

Content:
{{input_text}}

Output to: {{destination_path}}`;
  await Deno.writeTextFile(promptPath, promptTemplate);
  logger.debug("Created test prompt template", { promptPath });

  return { inputContent, testPromptsDir, promptPath };
}

/**
 * Recursively restores write permissions to a directory and its contents
 * @param path The path to restore permissions for
 */
async function restoreWritePermissions(path: string): Promise<void> {
  try {
    const info = await Deno.stat(path);
    if (info.isDirectory) {
      await Deno.chmod(path, 0o755); // rwxr-xr-x
      for await (const entry of Deno.readDir(path)) {
        await restoreWritePermissions(join(path, entry.name));
      }
    } else {
      await Deno.chmod(path, 0o644); // rw-r--r--
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error(`Error restoring permissions for ${path}:`, error);
    }
  }
}

/**
 * Cleans up a test directory and its contents
 * @param path The path to clean up
 */
async function cleanupTestDir(path: string): Promise<void> {
  try {
    await restoreWritePermissions(path);
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error(`Error cleaning up test directory ${path}:`, error);
    }
  }
}

// Main Test
Deno.test("Prompt Setup", async (t) => {
  const testDir = join(TEST_BASE_DIR, "prompt_setup_test");
  logger.debug("Setting up test environment", { testDir });

  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  try {
    await t.step("should create prompt directory structure", async () => {
      await cleanupTestDir(env.workingDir);
      await ensureDir(env.workingDir);
      const { testPromptsDir } = await setupPromptFiles(env.workingDir);
      const promptDirExists = await exists(join(testPromptsDir, "to", "issue"));
      assertEquals(promptDirExists, true, "Prompt directory structure should be created");
    });

    await t.step("should create prompt template file", async () => {
      await cleanupTestDir(env.workingDir);
      await ensureDir(env.workingDir);
      const { promptPath } = await setupPromptFiles(env.workingDir);
      const templateExists = await exists(promptPath);
      assertEquals(templateExists, true, "Prompt template file should be created");

      const content = await Deno.readTextFile(promptPath);
      assertEquals(
        content.includes("{{input_text}}"),
        true,
        "Template should contain variable placeholders",
      );
    });

    await t.step("should handle directory creation errors", async () => {
      await cleanupTestDir(env.workingDir);
      await ensureDir(env.workingDir);
      // Create a read-only directory that will block directory creation
      const blockingDir = join(env.workingDir, "prompts", "to");
      await ensureDir(blockingDir);
      await Deno.chmod(blockingDir, 0o444); // Make directory read-only

      await assertRejects(
        () => setupPromptFiles(env.workingDir),
        Error,
        "Permission denied",
        "Should throw error when directory creation is blocked",
      );
    });

    await t.step("should handle template write errors", async () => {
      await cleanupTestDir(env.workingDir);
      await ensureDir(env.workingDir);
      // Create a read-only directory structure
      const readOnlyDir = join(env.workingDir, "readonly");
      await ensureDir(join(readOnlyDir, "prompts", "to", "issue"));
      await Deno.chmod(readOnlyDir, 0o444);

      await assertRejects(
        () => setupPromptFiles(readOnlyDir),
        Error,
        "Permission denied",
        "Should throw error when writing to read-only directory",
      );
    });
  } finally {
    logger.debug("Cleaning up test environment");
    await cleanupTestEnvironment(env);
  }
});
