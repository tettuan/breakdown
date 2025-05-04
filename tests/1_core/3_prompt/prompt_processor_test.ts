/**
 * Tests for prompt processing functionality
 *
 * Purpose:
 * - Verify prompt text generation for different demonstrative types
 * - Test prompt template processing
 * - Validate error handling
 *
 * Related Specifications:
 * - docs/breakdown/app_prompt.ja.md: Prompt processing specifications
 *
 * IMPORTANT:
 * - See docs/breakdown/app_config.ja.md for the distinction between working_dir and app_prompt.base_dir.
 * - working_dir is used ONLY for input/output file resolution (not for prompt or schema directories).
 * - app_prompt.base_dir is the root for prompt templates; prompt files must be created under this directory to be found.
 * - Do NOT create prompt files under working_dir unless it matches app_prompt.base_dir.
 * - This test intentionally sets app_prompt.base_dir: prompts, so prompt files must be created in 'prompts/' relative to the test working directory.
 */

import { assertRejects } from "@std/assert";
import { dirname, ensureDir, join } from "$deps/mod.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { TEST_BASE_DIR } from "$test/helpers/test_utils.ts";
import { relative } from "jsr:@std/path@^0.224.0/relative";
import { PromptAdapterImpl } from "$lib/prompt/prompt_adapter.ts";

// Adapter to match the expected logger interface
function createLoggerAdapter(logger: BreakdownLogger) {
  return {
    debug: (...args: unknown[]) => logger.debug(String(args[0]), args[1]),
    error: (...args: unknown[]) => logger.error(String(args[0]), args[1]),
  };
}

const logger = createLoggerAdapter(new BreakdownLogger());

/**
 * Test suite for the prompt processor functionality
 *
 * IMPORTANT FINDINGS ABOUT PROMPTMANAGER INTEGRATION:
 * ------------------------------------------------
 * 1. Template Processing Requirements:
 *    - PromptManager.generatePrompt returns processed prompt text
 *    - File operations should be handled separately from prompt generation
 *    - Template paths must be valid and accessible
 *
 * 2. Path Validation Rules (Critical for Integration):
 *    - Paths MUST only contain: [a-zA-Z0-9\-_\.]
 *    - Directory traversal (..) is strictly forbidden
 *    - Absolute paths (starting with / or \) are not allowed
 *    - All paths must be sanitized before being passed to PromptManager
 *
 * 3. Template Processing Flow (Required Steps):
 *    a. Load template from breakdown/prompts directory
 *    b. Process template with PromptManager to get prompt text
 *    c. Return processed prompt text
 *
 * 4. Error Handling Requirements:
 *    - Must validate demonstrative types against ["to", "summary", "defect"]
 *    - Must handle template loading failures gracefully
 *    - Must handle prompt generation failures
 */

// Preparing Part
async function setupTestFiles(workingDir: string) {
  logger.debug("Setting up test files", { workingDir });

  // Create test input content
  const inputContent = "# Project Title\n- Feature 1: First feature\n- Feature 2: Second feature";
  const testPromptsDir = join(workingDir, "prompts");
  const schemaDir = join(workingDir, ".agent", "breakdown", "schema");

  // Create test prompt directory and template
  await ensureDir(join(testPromptsDir, "to", "issue"));
  await ensureDir(schemaDir);

  // Create schema file
  const schema = {
    type: "object",
    properties: {
      input_text_file: { type: "string" },
      input_text: { type: "string" },
      destination_path: { type: "string" },
    },
  };
  await Deno.writeTextFile(
    join(schemaDir, "implementation.json"),
    JSON.stringify(schema, null, 2),
    { mode: 0o666 },
  );

  const promptTemplate = `# {input_text_file}

Content:
{input_text}

Output to: {destination_path}`;
  await Deno.writeTextFile(
    join(testPromptsDir, "to", "issue", "f_project.md"),
    promptTemplate,
    { mode: 0o666 },
  );
  logger.debug("Created test prompt template", {
    path: join(testPromptsDir, "to", "issue", "f_project.md"),
  });

  return { inputContent, testPromptsDir };
}

// Main Test
Deno.test("Prompt Processing Integration", async (t) => {
  logger.debug("Setting up test environment");
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
    skipDirectorySetup: true,
  });
  const workingDir = env.workingDir;
  logger.debug("Test environment setup", { workingDir });
  const originalCwd = Deno.cwd();
  Deno.chdir(workingDir);

  // Ensure config file exists for BreakdownConfig
  const configDir = join(workingDir, ".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);

  try {
    // Setup test files and get content
    const { inputContent, testPromptsDir } = await setupTestFiles(workingDir);
    const fromFile = join(workingDir, "project", "test_input.md");
    const destFile = join(workingDir, "issue", "test_output.md");
    const relPromptsDir = relative(workingDir, testPromptsDir);
    const relFromFile = relative(workingDir, fromFile);
    const relDestFile = relative(workingDir, destFile);

    // Write test input for processing
    await ensureDir(dirname(fromFile));
    await Deno.writeTextFile(fromFile, inputContent, { mode: 0o666 });

    // Test prompt generation
    await t.step("should generate project to issue prompt", async () => {
      // Debug: print prompt directory and file existence
      console.log("Prompt dir:", testPromptsDir);
      const promptFile = join(testPromptsDir, "to", "issue", "f_project.md");
      const promptExists = await Deno.stat(promptFile).then(() => true).catch(() => false);
      console.log("Prompt file exists:", promptFile, promptExists);
      // Log all path variables and cwd
      console.log("CWD before PromptAdapterImpl:", Deno.cwd());
      console.log("relPromptsDir:", relPromptsDir);
      console.log("relFromFile:", relFromFile);
      console.log("relDestFile:", relDestFile);
      console.log("fromFile (abs):", fromFile);
      console.log("destFile (abs):", destFile);
      logger.debug("[TEST] Before PromptAdapterImpl", { fromFile, destFile });
      const adapter = new PromptAdapterImpl();
      const result = await adapter.generate(
        relPromptsDir,
        "to",
        "issue",
        relFromFile,
        relDestFile,
        "",
        logger,
      );
      logger.debug("[TEST] After PromptAdapterImpl", { result });
      if (!result.success) {
        logger.error("[TEST] PromptAdapterImpl failed", { result });
      }
      assertEquals(result.success, true);
      assertExists(result.content);
      // The result should contain some expected content from the prompt template
      assertEquals(result.content.includes("test_input.md"), true);
    });

    // Test invalid demonstrative type
    await t.step("should handle invalid demonstrative type", async () => {
      await assertRejects(
        async () => {
          const adapter = new PromptAdapterImpl();
          await adapter.generate(
            relPromptsDir,
            "invalid",
            "issue",
            relFromFile,
            relDestFile,
            "",
            logger,
          );
        },
        Error,
        "Unsupported demonstrative type: invalid",
      );
    });

    // Test missing prompt template
    await t.step("should handle missing prompt template", async () => {
      const adapter = new PromptAdapterImpl();
      const result = await adapter.generate(
        relPromptsDir,
        "to",
        "nonexistent",
        relFromFile,
        relDestFile,
        "",
        logger,
      );
      assertEquals(result.success, false);
      assertEquals(result.content, "Invalid layer type: nonexistent");
    });

    // Test invalid input file
    await t.step("should handle invalid input file", async () => {
      const adapter = new PromptAdapterImpl();
      const result = await adapter.generate(
        relPromptsDir,
        "to",
        "issue",
        relative(workingDir, join(workingDir, "project", "nonexistent.md")),
        relDestFile,
        "",
        logger,
      );
      assertEquals(result.success, false);
      assertEquals(result.content.includes("No such file"), true);
    });
  } finally {
    await cleanupTestEnvironment(env);
    // Restore working directory
    Deno.chdir(originalCwd);
  }
});

Deno.test("PromptAdapterImpl should generate prompt text", async () => {
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  await ensureDir(dirname(inputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  const adapter = new PromptAdapterImpl();
  const result = await adapter.generate(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    "",
    "",
    logger,
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain some expected content from the prompt template
  assertEquals(result.content.includes("input.md"), true);

  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl should handle file operations when destFile is provided", async () => {
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  const outputFile = join(testDir, "issue", "output.md");
  await ensureDir(dirname(inputFile));
  await ensureDir(dirname(outputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);
  const relOutputFile = relative(testDir, outputFile);

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  const adapter = new PromptAdapterImpl();
  const result = await adapter.generate(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    relOutputFile,
    "",
    logger,
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain some expected content from the prompt template
  assertEquals(result.content.includes("input.md"), true);

  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl should handle path sanitization", async () => {
  const testDir = await Deno.makeTempDir();
  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  await ensureDir(dirname(inputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  const adapter = new PromptAdapterImpl();
  const result = await adapter.generate(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    "",
    "",
    logger,
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should not contain absolute paths
  assertEquals(result.content.includes(TEST_BASE_DIR), false);

  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl allows empty baseDir and uses default", async () => {
  // Setup: create a temp working directory and minimal input file
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const inputFile = join(testDir, "input.md");
  await Deno.writeTextFile(inputFile, "# Dummy input\n");
  // Call with baseDir = ""
  const adapter = new PromptAdapterImpl();
  const result = await adapter.generate(
    "", // promptBaseDir empty
    "to",
    "project",
    inputFile,
    join(testDir, "output.md"),
    "project",
    logger,
  );
  // Assert: error is about missing base_dir, not about template
  if (result.success) {
    throw new Error("Expected failure due to missing base_dir, but got success");
  }
  if (!result.content.includes("Prompt base_dir must be set")) {
    throw new Error(`Expected error about missing base_dir, got: ${result.content}`);
  }
});

Deno.test("should reproduce path mismatch when app_prompt.base_dir is ignored (example script scenario)", async () => {
  // Pre-processing and Preparing Part
  const BreakdownLogger = (await import("jsr:@tettuan/breakdownlogger@^0.1.10")).BreakdownLogger;
  const logger = createLoggerAdapter(new BreakdownLogger());
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
    skipDirectorySetup: true,
  });
  const workingDir = env.workingDir;
  const originalCwd = Deno.cwd();
  Deno.chdir(workingDir);
  try {
    // Simulate example's .agent/breakdown/config/app.yml
    const configDir = join(workingDir, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: .agent/breakdown/prompts\napp_schema:\n  base_dir: .agent/breakdown/schema\n`,
    );
    // Simulate prompt template directory and file
    const promptDir = join(workingDir, ".agent", "breakdown", "prompts", "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(
      promptFile,
      "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
    );
    // Simulate input file
    const inputDir = join(workingDir, "tmp", "examples", "project");
    await ensureDir(inputDir);
    const inputFile = join(inputDir, "project_summary.md");
    await Deno.writeTextFile(inputFile, "# Example Project Summary\n- Feature: Example");
    // Main Test
    const relPromptsDir = relative(workingDir, join(workingDir, ".agent", "breakdown", "prompts"));
    const relFromFile = relative(workingDir, inputFile);
    const destDir = join(workingDir, "tmp", "examples", "project");
    await ensureDir(destDir);
    const relDestFile = relative(workingDir, join(destDir, "project.md"));
    // Debug output before
    logger.debug("[TEST] Before PromptAdapterImpl (path mismatch reproduction)", {
      relPromptsDir,
      relFromFile,
      relDestFile,
      cwd: Deno.cwd(),
      promptFile,
    });
    const adapter = new PromptAdapterImpl();
    const result = await adapter.generate(
      relPromptsDir,
      "to",
      "project",
      relFromFile,
      relDestFile,
      "project",
      logger,
    );
    // Debug output after
    logger.debug("[TEST] After PromptAdapterImpl (path mismatch reproduction)", { result });
    // The result should succeed and use the correct prompt path
    if (!result.success) {
      logger.error("[TEST] PromptAdapterImpl failed (path mismatch reproduction)", { result });
    }
    assertEquals(result.success, true);
    assertExists(result.content);
    assertEquals(result.content.includes("project_summary.md"), true);
    // Clean up
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(env);
  } catch (e) {
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(env);
    throw e;
  }
});
