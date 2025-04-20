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

import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { assertCommandOutput } from "$test/helpers/assertions.ts";
import { cleanupTestEnvironment, runCommand, setupTestEnvironment } from "$test/helpers/setup.ts";

const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });

// Test the core functionality: using JSR packages for configuration and parameter handling
Deno.test("core functionality - JSR package integration", async () => {
  logger.debug("Starting JSR package integration test");
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/core-integration" });

  try {
    // Test BreakdownConfig integration
    const configResult = await runCommand(["run", "main.ts", "init"]);
    logger.debug("Config integration result", { configResult });
    assertCommandOutput(configResult, { error: "" });

    // Test BreakdownParams integration
    const paramsResult = await runCommand(["run", "main.ts", "--help"]);
    logger.debug("Params integration result", { paramsResult });
    assertCommandOutput(paramsResult, { error: "" });

    // Test BreakdownPrompt integration
    const promptResult = await runCommand([
      "run",
      "main.ts",
      "to",
      "issue",
      "--from",
      "input.md",
    ]);
    logger.debug("Prompt integration result", { promptResult });
    assertCommandOutput(promptResult, { error: "" });
  } finally {
    await cleanupTestEnvironment(env);
  }
});
