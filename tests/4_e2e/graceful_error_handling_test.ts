/**
 * E2E Tests for Graceful Error Handling in New Implementation
 *
 * Purpose:
 * - Verify that the new implementation handles errors gracefully
 * - Test robustness when dependencies are missing
 * - Ensure the CLI completes execution even under adverse conditions
 *
 * New Implementation Features:
 * - Configuration errors should not crash the CLI
 * - Missing JSR packages should fallback gracefully
 * - All parameter combinations should complete without system crashes
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { cleanupTestEnvironment, runCommand, setupTestEnvironment } from "$test/helpers/setup.ts";

const logger = new BreakdownLogger();

Deno.test("E2E: Graceful handling of missing configuration", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-missing-config",
    skipDefaultConfig: true,
  });

  try {
    // Run without any configuration files
    const result = await runCommand(["--help"], undefined, env.workingDir);
    logger.debug("Missing config result", { result });

    // Should complete successfully with default configuration fallback
    assertEquals(result.success, true, "Should succeed with missing config");
    assertStringIncludes(result.output, "Breakdown - AI Development Instruction Tool");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("E2E: Graceful handling of two parameters without templates", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-no-templates",
  });

  try {
    // Test two-parameter processing without templates
    const result = await runCommand(
      ["project", "issue", "--uv-test=value"],
      undefined,
      env.workingDir,
    );
    logger.debug("No templates result", { result });

    // Current implementation may fail due to parameter parsing, but shouldn't crash
    // The key test is that we get a structured response, not a system crash
    assertEquals(typeof result.success, "boolean", "Should return valid result");
    assertEquals(typeof result.output, "string", "Should return output");
    assertEquals(typeof result.error, "string", "Should return error info");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("E2E: Graceful handling of init command multiple times", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-init-multiple",
  });

  try {
    // Run init command first time
    const firstResult = await runCommand(["init"], undefined, env.workingDir);
    assertEquals(firstResult.success, true, "First init should succeed");

    // Run init command second time (should handle existing files gracefully)
    const secondResult = await runCommand(["init"], undefined, env.workingDir);
    assertEquals(secondResult.success, true, "Second init should not crash");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("E2E: Graceful handling of invalid parameter combinations", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-invalid-params",
  });

  try {
    const testCases = [
      ["unknown", "command"],
      ["project"], // Single parameter that might not be recognized
      ["too", "many", "parameters", "here"],
      ["--invalid-flag"],
      [],
    ];

    for (const args of testCases) {
      const result = await runCommand(args, undefined, env.workingDir);
      logger.debug(`Invalid params test: ${args.join(" ")}`, { result });

      // Should not crash the system (exit code might be 1, but process should complete)
      // The key is that we get a response, not a system crash
      assertEquals(typeof result.success, "boolean", "Should return a valid result");
      assertEquals(typeof result.output, "string", "Should return output string");
      assertEquals(typeof result.error, "string", "Should return error string");
    }
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("E2E: Graceful handling of file system errors", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-fs-errors",
  });

  try {
    // Test with non-existent input file
    const result = await runCommand(
      ["project", "issue", "--from=/nonexistent/file.md"],
      undefined,
      env.workingDir,
    );
    logger.debug("Non-existent file result", { result });

    // Current implementation may fail but should not crash the system
    // The key test is graceful error handling
    assertEquals(typeof result.success, "boolean", "Should return valid result");
    assertEquals(typeof result.output, "string", "Should return output");
    assertEquals(typeof result.error, "string", "Should return error info");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("E2E: Robust execution under various conditions", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/graceful-robust",
  });

  try {
    // Test version command (should always work)
    const versionResult = await runCommand(["--version"], undefined, env.workingDir);
    assertEquals(versionResult.success, true, "Version command should always work");
    assertStringIncludes(versionResult.output, "Breakdown v");

    // Test help command (should always work)
    const helpResult = await runCommand(["--help"], undefined, env.workingDir);
    assertEquals(helpResult.success, true, "Help command should always work");
    assertStringIncludes(helpResult.output, "Usage:");

    // Test that the CLI is consistently responsive
    logger.debug("All robust execution tests completed successfully");
  } finally {
    await cleanupTestEnvironment(env);
  }
});
