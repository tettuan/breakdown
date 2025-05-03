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
 */

import { assertRejects } from "@std/assert";
import { dirname, ensureDir, join } from "$deps/mod.ts";
import { DemonstrativeType, LayerType } from "$lib/types/mod.ts";
import { processWithPrompt } from "$lib/prompt/processor.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { sanitizePathForPrompt } from "$lib/prompt/processor.ts";
import { TEST_BASE_DIR } from "$test/helpers/test_utils.ts";
import { relative } from "jsr:@std/path@^0.224.0/relative";

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
  const testPromptsDir = join(workingDir, ".agent", "breakdown", "prompts");
  const schemaDir = join(workingDir, ".agent", "breakdown", "schema");

  // Create test prompt directory and template
  await ensureDir(join(testPromptsDir, "to", "issue"));
  await ensureDir(schemaDir);

  // Create schema file
  const schema = {
    type: "object",
    properties: {
      input_markdown_file: { type: "string" },
      input_markdown: { type: "string" },
      destination_path: { type: "string" }
    }
  };
  await Deno.writeTextFile(
    join(schemaDir, "implementation.json"),
    JSON.stringify(schema, null, 2),
    { mode: 0o666 }
  );

  const promptTemplate = `# {input_markdown_file}

Content:
{input_markdown}

Output to: {destination_path}`;
  await Deno.writeTextFile(
    join(testPromptsDir, "to", "issue", "f_project.md"),
    promptTemplate,
    { mode: 0o666 }
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
      console.log("CWD before processWithPrompt:", Deno.cwd());
      console.log("relPromptsDir:", relPromptsDir);
      console.log("relFromFile:", relFromFile);
      console.log("relDestFile:", relDestFile);
      console.log("fromFile (abs):", fromFile);
      console.log("destFile (abs):", destFile);
      logger.debug("[TEST] Before processWithPrompt", { fromFile, destFile });
      const result = await processWithPrompt(
        relPromptsDir,
        "to",
        "issue",
        relFromFile,
        relDestFile,
        "",
        logger
      );
      logger.debug("[TEST] After processWithPrompt", { result });
      if (!result.success) {
        logger.error("[TEST] processWithPrompt failed", { result });
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
          await processWithPrompt(
            relPromptsDir,
            "invalid",
            "issue",
            relFromFile,
            relDestFile,
            "",
            logger
          );
        },
        Error,
        "Unsupported demonstrative type: invalid"
      );
    });

    // Test missing prompt template
    await t.step("should handle missing prompt template", async () => {
      const result = await processWithPrompt(
        relPromptsDir,
        "to",
        "nonexistent",
        relFromFile,
        relDestFile,
        "",
        logger
      );
      assertEquals(result.success, false);
      assertEquals(result.content, "Invalid layer type: nonexistent");
    });

    // Test invalid input file
    await t.step("should handle invalid input file", async () => {
      const result = await processWithPrompt(
        relPromptsDir,
        "to",
        "issue",
        relative(workingDir, join(workingDir, "project", "nonexistent.md")),
        relDestFile,
        "",
        logger
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

// Path sanitization tests remain unchanged as they are still relevant
interface TestPaths {
  input: string;
  expected: string;
}

function setupPathTestCases(): TestPaths[] {
  return [
    {
      input: "path/to/file.md",
      expected: "path/to/file.md"
    },
    {
      input: "/absolute/path/file.md",
      expected: "absolute/path/file.md"
    },
    {
      input: "path/../file.md",
      expected: "file.md"
    },
    {
      input: "path/with spaces/file.md",
      expected: "path/with_spaces/file.md"
    },
    {
      input: "path/with@special#chars/file.md",
      expected: "path/with_special_chars/file.md"
    }
  ];
}

Deno.test("sanitizePathForPrompt handles various path formats correctly", async () => {
  const testCases = setupPathTestCases();

  for (const { input, expected } of testCases) {
    const result = sanitizePathForPrompt(input);
    assertEquals(result, expected, `Failed to sanitize path: ${input}`);
  }
});

Deno.test("processWithPrompt should generate prompt text", async () => {
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

  const result = await processWithPrompt(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    "",
    "",
    logger
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain some expected content from the prompt template
  assertEquals(result.content.includes("input.md"), true);

  await cleanupTestEnvironment(env);
});

Deno.test("processWithPrompt should handle file operations when destFile is provided", async () => {
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

  const result = await processWithPrompt(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    relOutputFile,
    "",
    logger
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain some expected content from the prompt template
  assertEquals(result.content.includes("input.md"), true);

  await cleanupTestEnvironment(env);
});

Deno.test("processWithPrompt should handle path sanitization", async () => {
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

  const result = await processWithPrompt(
    relPromptsDir,
    "to",
    "issue",
    relInputFile,
    "",
    "",
    logger
  );

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should not contain absolute paths
  assertEquals(result.content.includes(TEST_BASE_DIR), false);

  await cleanupTestEnvironment(env);
});
