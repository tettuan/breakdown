/**
 * Scenario tests for CLI commands
 *
 * Purpose:
 * - Verify end-to-end behavior of CLI commands
 * - Test command line argument parsing with --input option
 * - Validate error cases
 *
 * Related Specifications:
 * - docs/breakdown/options.ja.md: CLI option specifications
 *
 * Implementation Considerations:
 * 1. Command Line Argument Parsing
 *    - Required option validation
 *    - Alias resolution
 *    - Invalid value error handling
 *
 * 2. File Operations
 *    - Input file existence check
 *    - Output directory creation
 *    - File path normalization
 *
 * 3. Error Handling
 *    - Appropriate error messages
 *    - Error exit codes
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { assertCommandOutput } from "$test/helpers/assertions.ts";
import { assertEquals } from "@std/assert";
import { cleanupTestEnvironment, runCommand, setupTestEnvironment } from "$test/helpers/setup.ts";

const logger = new BreakdownLogger();

// Test the core functionality: using JSR packages for configuration and parameter handling
Deno.test("core functionality - JSR package integration", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/core-integration" });

  // Debug: List files in the source directory before copying
  const lsCommand = new Deno.Command("ls", {
    args: ["-l", "tests/fixtures/prompts/to/project/"],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout, stderr } = await lsCommand.output();
  logger.debug("ls -l tests/fixtures/prompts/to/project/ output", {
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr),
  });

  // Debug: Check if the source prompt template exists before copying
  const srcPromptPath = "tests/fixtures/prompts/to/project/f_project.md";
  try {
    const stat = await Deno.stat(srcPromptPath);
    logger.debug("Source prompt template stat before copy", { srcPromptPath, stat });
  } catch (e) {
    logger.error("Source prompt template does NOT exist before copy", {
      srcPromptPath,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // Copy prompt templates into the test working directory
  logger.debug("Copying prompt templates to test working directory", {
    dest: `${env.workingDir}/prompts/to/project/f_project.md`,
  });
  await Deno.mkdir(`${env.workingDir}/prompts/to/project`, { recursive: true });
  await Deno.copyFile(srcPromptPath, `${env.workingDir}/prompts/to/project/f_project.md`);

  Deno.env.set("LOG_LEVEL", "error");
  logger.debug("Starting JSR package integration test");
  const envInfo = { workingDir: env.workingDir };
  logger.debug("Test environment info", envInfo);

  // 入力ファイルを作業ディレクトリにコピー
  logger.debug("Copying input file", {
    src: "tests/fixtures/input.md",
    dest: `${env.workingDir}/input.md`,
  });
  await Deno.copyFile("tests/fixtures/input.md", `${env.workingDir}/input.md`);
  // fromLayerTypeが"project"の場合に備え、project/input.mdにもコピー
  await Deno.mkdir(`${env.workingDir}/project`, { recursive: true });
  await Deno.copyFile("tests/fixtures/input.md", `${env.workingDir}/project/input.md`);

  try {
    // Test BreakdownConfig integration
    const configResult = await runCommand(["init"], undefined, env.workingDir);
    logger.debug("Config integration result", { configResult });
    assertCommandOutput(configResult, { error: "" });

    // Test BreakdownParams integration
    const paramsResult = await runCommand(["--help"], undefined, env.workingDir);
    logger.debug("Params integration result", { paramsResult });
    assertCommandOutput(paramsResult, { error: "" });

    // Test BreakdownPrompt integration
    const promptResult = await runCommand(
      [
        "to",
        "project",
        "--from",
        "input.md",
        "--destination",
        "output.md",
      ],
      undefined,
      env.workingDir,
    );
    logger.debug("Prompt integration result (raw)", { promptResult });
    logger.debug("Prompt output for assertion", { output: promptResult.output });
    // Parser now correctly handles options, should succeed
    assertEquals(promptResult.success, true);
    logger.debug("Prompt integration error", { error: promptResult.error });
  } finally {
    logger.debug("Cleaning up test environment");
    await cleanupTestEnvironment(env);
  }
});
