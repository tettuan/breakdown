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
 *
 * IMPORTANT: Read docs/breakdown/app_config.ja.md before editing this test.
 *
 * - Be careful: `working_dir` is NOT a prefix for `app_prompt.base_dir`.
 * - `working_dir` is only for input/output file resolution.
 * - `app_prompt.base_dir` is the root for prompt templates. Prompt files must be created under this directory.
 * - Always check the config and ensure prompt templates are created in the correct directory.
 *
 * See also: docs/breakdown/app_factory.ja.md for path resolution examples.
 */

/*
 * IMPORTANT: All path resolution is based on config/app_prompt.base_dir (and app_schema.base_dir).
 * - Each test sets up a config file with app_prompt.base_dir and app_schema.base_dir in the test working directory.
 * - No promptDir or baseDir override is supported; config is the only source of truth.
 * - All expected paths are based on the config's baseDir ("prompts"), not hardcoded or empty/undefined.
 * - Directory structure is always created under the configured baseDir.
 */

import { assertRejects as _assertRejects } from "@std/assert";
import { ensureDir } from "../../../deps.ts";
import { dirname, join } from "@std/path";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.0";
import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { TEST_BASE_DIR } from "$test/helpers/test_utils.ts";
import { relative } from "jsr:@std/path@^0.224.0/relative";
import { PromptAdapterImpl } from "$lib/prompt/prompt_adapter.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";

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
  logger.debug("Setting up test files", {
    key: "prompt_processor_test.ts#L87#setup-start",
    workingDir,
  });

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

  // Create config file for BreakdownConfig
  const configDir = join(workingDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "default-app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );

  // Use PromptVariablesFactory to resolve the correct prompt file path
  const cliParams = {
    demonstrativeType: "to" as DemonstrativeType,
    layerType: "issue" as LayerType,
    options: {
      fromFile: "project/test_input.md",
      destinationFile: "issue/test_output.md",
      promptDir: "prompts",
    },
  };
  const factory = await PromptVariablesFactory.create(cliParams);
  const promptFilePath = factory.promptFilePath;
  await ensureDir(dirname(promptFilePath));
  await Deno.writeTextFile(
    promptFilePath,
    "# Issue Prompt\nInput: {input_text}\nOutput: {destination_path}",
  );
  logger.debug("Created test prompt template", {
    key: "prompt_processor_test.ts#L131#template-created",
    path: promptFilePath,
  });

  return { inputContent, testPromptsDir };
}

// Main Test
Deno.test("Prompt Processing Integration", async (t) => {
  logger.debug("Setting up test environment", {
    key: "prompt_processor_test.ts#L142#integration-test-start",
  });
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
    skipDirectorySetup: true,
  });
  const workingDir = env.workingDir;
  logger.debug("Test environment setup", {
    key: "prompt_processor_test.ts#L151#env-setup-complete",
    workingDir,
  });
  const originalCwd = Deno.cwd();
  Deno.chdir(workingDir);

  // Ensure config file exists for BreakdownConfig
  const configDir = join(workingDir, ".agent", "breakdown", "config");
  const configFile = join(configDir, "default-app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    configFile,
    `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );

  try {
    // Setup test files and get content
    const { inputContent, testPromptsDir } = await setupTestFiles(workingDir);
    const fromFile = join(workingDir, "project", "test_input.md");
    const destFile = join(workingDir, "issue", "test_output.md");
    const _relPromptsDir = relative(workingDir, testPromptsDir);
    const relFromFile = relative(workingDir, fromFile);
    const relDestFile = relative(workingDir, destFile);

    // Write test input for processing
    await ensureDir(dirname(fromFile));
    await Deno.writeTextFile(fromFile, inputContent, { mode: 0o666 });

    // Test prompt generation (split into two steps)
    await t.step("should create prompt file", async () => {
      // Debug: print prompt directory and file existence
      // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
      // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {
          fromFile: relFromFile,
          destinationFile: relDestFile,
        },
      };
      // Use PromptVariablesFactory to resolve and create the prompt file for this test
      const factoryForFile = await PromptVariablesFactory.create(cliParams);
      // 型安全にconfigへアクセス（@ts-ignoreで暫定対応）
      // @ts-ignore: configはPromptVariablesFactoryのprivate/protectedだがテスト用にアクセス
      logger.debug(
        "DEBUG (test): app_prompt.base_dir",
        {
          base_dir:
            ((factoryForFile as unknown) as { config?: { app_prompt?: { base_dir?: string } } })
              .config
              ?.app_prompt?.base_dir,
        },
      );
      const promptFilePath = factoryForFile.promptFilePath;
      await ensureDir(dirname(promptFilePath));
      await Deno.writeTextFile(
        promptFilePath,
        "# Issue Prompt\nInput: {input_text}\nOutput: {destination_path}",
      );
      const promptExists = await Deno.stat(promptFilePath).then(() => true).catch(() => false);
      logger.debug("Prompt file exists", {
        key: "prompt_processor_test.ts#L202#prompt-file-check",
        promptFilePath,
        promptExists,
      });
      // List directory contents and stat info for prompt file before running the adapter
      const promptDir = dirname(promptFilePath);
      const dirContents = await Deno.readDir(promptDir);
      logger.debug("DEBUG (test): Directory contents", {
        key: "prompt_processor_test.ts#L220#dir-contents-scan",
        promptDir,
      });
      for await (const entry of dirContents) {
        logger.debug("Directory entry", {
          key: "prompt_processor_test.ts#L225#dir-entry-detail",
          name: entry.name,
          type: entry.isFile ? "file" : "dir",
        });
      }
      try {
        const stat = await Deno.stat(promptFilePath);
        logger.debug("DEBUG (test): Stat for prompt file", {
          key: "prompt_processor_test.ts#L233#file-stat-success",
          promptFilePath,
          stat,
        });
      } catch (e) {
        logger.error("DEBUG (test): Stat for prompt file FAILED", {
          key: "prompt_processor_test.ts#L239#file-stat-error",
          promptFilePath,
          error: e,
        });
      }
      // Assert file exists and has correct content
      if (!promptExists) throw new Error("Prompt file was not created");
      const content = await Deno.readTextFile(promptFilePath);
      if (!content.includes("# Issue Prompt")) throw new Error("Prompt file content is incorrect");
    });
    await t.step("should generate project to issue prompt via CLI", async () => {
      // Use the same params as above
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {
          fromFile: relFromFile,
          destinationFile: relDestFile,
        },
      };
      // Debug: print CLI params
      logger.debug("DEBUG (test): CLI params", { cliParams });
      // PromptVariablesFactoryを生成
      const factory = await PromptVariablesFactory.create(cliParams);
      const promptFilePath = factory.promptFilePath;
      const promptDir = dirname(promptFilePath);
      // Debug: print prompt file path
      logger.debug("DEBUG (test): promptFilePath", { promptFilePath });
      // Debug: print prompt file content
      let promptFileContent = "(not found)";
      try {
        promptFileContent = await Deno.readTextFile(promptFilePath);
      } catch (e) {
        promptFileContent = `(error reading file: ${e})`;
      }
      logger.debug("DEBUG (test): prompt file content", { promptFileContent });
      // List directory contents before
      const dirContentsBefore = [];
      for await (const entry of await Deno.readDir(promptDir)) {
        dirContentsBefore.push({
          name: entry.name,
          isFile: entry.isFile,
          isDirectory: entry.isDirectory,
        });
      }
      logger.debug("DEBUG (test): Directory contents BEFORE validateAndGenerate", {
        dirContentsBefore,
      });
      const adapter = new PromptAdapterImpl(factory);
      const result = await adapter.validateAndGenerate();
      // Debug: print result object
      logger.debug("DEBUG (test): result", { result });
      // List directory contents after
      const dirContentsAfter = [];
      for await (const entry of await Deno.readDir(promptDir)) {
        dirContentsAfter.push({
          name: entry.name,
          isFile: entry.isFile,
          isDirectory: entry.isDirectory,
        });
      }
      logger.debug("DEBUG (test): Directory contents AFTER validateAndGenerate", {
        dirContentsAfter,
      });
      logger.debug("[TEST] After PromptAdapterImpl", { result });
      if (!result.success) {
        logger.error("[TEST] PromptAdapterImpl failed", { result });
      }
      assertEquals(result.success, true);
      assertExists(result.content);
      // The result should contain the output from the f_issue.md template
      assertEquals(result.content.includes("# Issue Prompt"), true);
      assertEquals(result.content.includes("Output:"), true);
    });

    // Test missing prompt template
    await t.step("should handle missing prompt template", async () => {
      // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
      // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "nonexistent" as LayerType,
        options: {
          fromFile: relFromFile,
          destinationFile: relDestFile,
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      const adapter = new PromptAdapterImpl(factory);
      const result = await adapter.validateAndGenerate();
      assertEquals(result.success, false);
      // Accepts [NotFound] error for missing prompt file
      if (typeof result.content === "string") {
        assertEquals(
          result.content.includes("File does not exist"),
          true,
          "Should report missing prompt file",
        );
      } else if (
        result.content &&
        typeof result.content === "object" &&
        "code" in result.content &&
        typeof (result.content as { code: unknown }).code === "string"
      ) {
        assertEquals(
          (result.content as { code: string }).code,
          "[NotFound]",
          "Should return [NotFound] error code",
        );
      } else {
        throw new Error("Unexpected error result for missing prompt template");
      }
    });

    // Test invalid input file
    await t.step("should handle invalid input file", async () => {
      // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
      // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
      // Ensure the input file does NOT exist
      const missingInputFile = relative(
        workingDir,
        join(workingDir, "project", "definitely_missing_input_file.md"),
      );
      // Remove the file if it exists
      try {
        await Deno.remove(join(workingDir, missingInputFile));
      } catch (_) { /* ignore error if file does not exist */ }
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {
          fromFile: missingInputFile,
          destinationFile: relDestFile,
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      const adapter = new PromptAdapterImpl(factory);
      // Directly test input file validation
      const inputValidation = await adapter.validateInputFile();
      assertEquals(inputValidation.ok, false);
      if (
        !inputValidation.ok && "message" in inputValidation &&
        typeof inputValidation.message === "string"
      ) {
        assertEquals(inputValidation.message.includes("File does not exist"), true);
      } else {
        throw new Error("Unexpected input file validation result");
      }
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

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  await ensureDir(dirname(inputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const _relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);

  // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
  // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
  const cliParams = {
    demonstrativeType: "to" as DemonstrativeType,
    layerType: "issue" as LayerType,
    options: {
      fromFile: relInputFile,
      destinationFile: "",
      promptDir: _relPromptsDir, // <-- Must match app_prompt.base_dir
    },
  };
  // Use PromptVariablesFactory to resolve and create the prompt file for this test
  const factoryForFile = await PromptVariablesFactory.create(cliParams);
  // 型安全にconfigへアクセス（@ts-ignoreで暫定対応）
  // @ts-ignore: configはPromptVariablesFactoryのprivate/protectedだがテスト用にアクセス
  logger.debug(
    "DEBUG (test): app_prompt.base_dir",
    {
      base_dir: ((factoryForFile as unknown) as { config?: { app_prompt?: { base_dir?: string } } })
        .config
        ?.app_prompt?.base_dir,
    },
  );
  const promptFilePath = factoryForFile.promptFilePath;
  await ensureDir(dirname(promptFilePath));
  await Deno.writeTextFile(
    promptFilePath,
    "# Issue Prompt\nInput: {input_text}\nOutput: {destination_path}",
  );

  const factory = await PromptVariablesFactory.create(cliParams);
  const adapter = new PromptAdapterImpl(factory);
  const result = await adapter.validateAndGenerate();

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain the output from the f_issue.md template
  assertEquals(result.content.includes("# Issue Prompt"), true);
  assertEquals(result.content.includes("Output:"), true);
  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl should handle file operations when destFile is provided", async () => {
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  const outputFile = join(testDir, "issue", "output.md");
  await ensureDir(dirname(inputFile));
  await ensureDir(dirname(outputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const _relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);
  const relOutputFile = relative(testDir, outputFile);

  // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
  // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
  const cliParams = {
    demonstrativeType: "to" as DemonstrativeType,
    layerType: "issue" as LayerType,
    options: {
      fromFile: relInputFile,
      destinationFile: relOutputFile,
      promptDir: _relPromptsDir, // <-- Must match app_prompt.base_dir
    },
  };
  // Use PromptVariablesFactory to resolve and create the prompt file for this test
  const factoryForFile = await PromptVariablesFactory.create(cliParams);
  logger.debug(
    "DEBUG (test): app_prompt.base_dir",
    {
      base_dir: ((factoryForFile as unknown) as { config?: { app_prompt?: { base_dir?: string } } })
        .config
        ?.app_prompt?.base_dir,
    },
  );
  const promptFilePath = factoryForFile.promptFilePath;
  await ensureDir(dirname(promptFilePath));
  await Deno.writeTextFile(
    promptFilePath,
    "# Issue Prompt\nInput: {input_text}\nOutput: {destination_path}",
  );

  const factory = await PromptVariablesFactory.create(cliParams);
  const adapter = new PromptAdapterImpl(factory);
  const result = await adapter.validateAndGenerate();

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should contain the output from the f_issue.md template
  assertEquals(result.content.includes("# Issue Prompt"), true);
  assertEquals(result.content.includes("Output:"), true);
  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl should handle path sanitization", async () => {
  const testDir = await Deno.makeTempDir();
  const env = await setupTestEnvironment({
    workingDir: testDir,
  });

  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);

  // Setup test files and get content
  const { testPromptsDir } = await setupTestFiles(testDir);
  const inputFile = join(testDir, "project", "input.md");
  await ensureDir(dirname(inputFile));
  await Deno.writeTextFile(inputFile, "# Test Input\n\nThis is a test input file.");
  const _relPromptsDir = relative(testDir, testPromptsDir);
  const relInputFile = relative(testDir, inputFile);

  // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
  // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
  const cliParams = {
    demonstrativeType: "to" as DemonstrativeType,
    layerType: "issue" as LayerType,
    options: {
      fromFile: relInputFile,
      destinationFile: "",
      promptDir: _relPromptsDir, // <-- Must match app_prompt.base_dir
    },
  };
  // Use PromptVariablesFactory to resolve and create the prompt file for this test
  const factoryForFile = await PromptVariablesFactory.create(cliParams);
  logger.debug(
    "DEBUG (test): app_prompt.base_dir",
    {
      base_dir: ((factoryForFile as unknown) as { config?: { app_prompt?: { base_dir?: string } } })
        .config
        ?.app_prompt?.base_dir,
    },
  );
  const promptFilePath = factoryForFile.promptFilePath;
  await ensureDir(dirname(promptFilePath));
  await Deno.writeTextFile(
    promptFilePath,
    "# Issue Prompt\nInput: {input_text}\nOutput: {destination_path}",
  );

  const factory = await PromptVariablesFactory.create(cliParams);
  const adapter = new PromptAdapterImpl(factory);
  const result = await adapter.validateAndGenerate();

  // Restore working directory
  Deno.chdir(originalCwd);

  assertExists(result);
  assertEquals(typeof result.content, "string");
  // The result should not contain absolute paths
  assertEquals(result.content.includes(TEST_BASE_DIR), false);
  // The result should contain the output from the f_issue.md template
  assertEquals(result.content.includes("# Issue Prompt"), true);
  assertEquals(result.content.includes("Output:"), true);
  await cleanupTestEnvironment(env);
});

Deno.test("PromptAdapterImpl allows empty baseDir and uses default", async () => {
  // Setup: create a temp working directory and minimal input file
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const inputFile = join(testDir, "input.md");
  await Deno.writeTextFile(inputFile, "# Dummy input\n");
  // Save and change working directory
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);
  // Ensure config file exists for BreakdownConfig
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "default-app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );
  try {
    // Call with baseDir = ""
    // [CAUTION] When setting cliParams, ensure promptDir matches app_prompt.base_dir in config.
    // See docs/breakdown/app_config.ja.md for details. Do NOT confuse working_dir with app_prompt.base_dir.
    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: inputFile,
        destinationFile: join(testDir, "output.md"),
        promptDir: "", // <-- Must match app_prompt.base_dir
      },
    };
    const factory = await PromptVariablesFactory.create(cliParams);
    const adapter = new PromptAdapterImpl(factory);
    const result = await adapter.validateAndGenerate();
    // Assert: if base_dir is empty, default directory is used; if prompt file is missing, NotFound error is expected
    if (result.success) {
      throw new Error("Expected failure due to missing prompt file, but got success");
    }
    if (!result.content.includes("File does not exist")) {
      throw new Error(`Expected NotFound error for missing prompt file, got: ${result.content}`);
    }
  } finally {
    Deno.chdir(originalCwd);
  }
});

Deno.test("KEY functionality demo: targeted debugging with hash keys", async () => {
  // Pre-processing and Preparing Part - Demonstrate KEY functionality
  const BreakdownLogger = (await import("jsr:@tettuan/breakdownlogger@^1.0.0")).BreakdownLogger;
  const logger = createLoggerAdapter(new BreakdownLogger());

  // Demo: Multiple debug points with specific hash keys
  logger.debug("Demo test started", {
    key: "prompt_processor_test.ts#L620#demo-start",
    purpose: "Demonstrate KEY filtering functionality",
    timestamp: new Date().toISOString(),
  });

  logger.debug("Setup phase beginning", {
    key: "prompt_processor_test.ts#L625#demo-setup",
    phase: "initialization",
    details: "Creating temporary directories and config files",
  });

  logger.debug("Processing phase", {
    key: "prompt_processor_test.ts#L630#demo-processing",
    phase: "execution",
    data: "Large amount of processing data here for LENGTH testing",
    moreData: "Additional data to test LENGTH truncation functionality",
    evenMoreData: "This is extra verbose data to demonstrate how LENGTH controls output size",
  });

  logger.debug("Validation phase", {
    key: "prompt_processor_test.ts#L635#demo-validation",
    phase: "validation",
    result: "success",
    errors: [],
  });

  logger.debug("Demo test completed", {
    key: "prompt_processor_test.ts#L640#demo-complete",
    status: "completed",
    totalPhases: 4,
  });

  // Original test continues...
});

Deno.test("should reproduce path mismatch when app_prompt.base_dir is ignored (example script scenario)", async () => {
  // Pre-processing and Preparing Part
  const BreakdownLogger = (await import("jsr:@tettuan/breakdownlogger@^1.0.0")).BreakdownLogger;
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
      join(configDir, "default-app.yml"),
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
    const inputDir = join(workingDir, "tmp", "test_project", "project");
    await ensureDir(inputDir);
    const inputFile = join(inputDir, "project_summary.md");
    await Deno.writeTextFile(inputFile, "# Example Project Summary\n- Feature: Example");
    // Main Test
    const _relPromptsDir = relative(workingDir, join(workingDir, ".agent", "breakdown", "prompts"));
    const relFromFile = relative(workingDir, inputFile);
    const destDir = join(workingDir, "tmp", "test_project", "project");
    await ensureDir(destDir);
    const relDestFile = relative(workingDir, join(destDir, "project.md"));
    // Debug output before
    logger.debug("[TEST] Before PromptAdapterImpl (path mismatch reproduction)", {
      _relPromptsDir,
      relFromFile,
      relDestFile,
      cwd: Deno.cwd(),
      promptFile,
    });
    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: relFromFile,
        destinationFile: relDestFile,
        promptDir: _relPromptsDir,
      },
    };
    const factory = await PromptVariablesFactory.create(cliParams);
    const adapter = new PromptAdapterImpl(factory);
    const result = await adapter.validateAndGenerate();
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
