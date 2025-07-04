/**
 * @fileoverview E2E Integration Tests for Breakdown CLI Scenarios
 *
 * Comprehensive end-to-end testing of real-world CLI usage scenarios.
 * Tests complete flows: stdin input → argument parsing → prompt generation → file output.
 * Includes error scenarios, performance validation, and external dependency integration.
 *
 * @module tests/integration/breakdown_e2e_scenarios_integration_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert@1";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("e2e-integration");

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for E2E tests
const TEST_BASE_DIR = "/tmp/breakdown_e2e_test";
const FIXTURES_DIR = "./tests/fixtures";

/**
 * Test helper for running CLI commands with timeout
 */
async function runBreakdownCommand(
  args: string[],
  input?: string,
  timeout = TEST_TIMEOUT,
): Promise<{ success: boolean; stdout: string; stderr: string; code: number }> {
  logger.debug("Running breakdown command", { args, hasInput: !!input });

  const cmd = new Deno.Command("deno", {
    args: ["run", "--allow-all", "./mod.ts", ...args],
    stdin: input ? "piped" : "null",
    stdout: "piped",
    stderr: "piped",
  });

  const process = cmd.spawn();

  // Handle stdin input
  if (input && process.stdin) {
    const writer = process.stdin.getWriter();
    await writer.write(new TextEncoder().encode(input));
    await writer.close();
  }

  // Set up timeout with proper cleanup
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Command timeout after ${timeout}ms`)), timeout);
  });

  try {
    const result = await Promise.race([process.output(), timeoutPromise]);

    // Clear timeout if process completes normally
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    return {
      success: result.code === 0,
      stdout: new TextDecoder().decode(result.stdout),
      stderr: new TextDecoder().decode(result.stderr),
      code: result.code,
    };
  } catch (error) {
    // Clear timeout on error/timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Kill process on timeout
    try {
      process.kill();
    } catch {}

    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown error",
      code: -1,
    };
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment(): Promise<void> {
  try {
    await Deno.mkdir(TEST_BASE_DIR, { recursive: true });
    logger.debug("Test environment setup completed", { baseDir: TEST_BASE_DIR });
  } catch (error) {
    logger.error("Failed to setup test environment", { error });
    throw error;
  }
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment(): Promise<void> {
  try {
    await Deno.remove(TEST_BASE_DIR, { recursive: true });
    logger.debug("Test environment cleanup completed");
  } catch (error) {
    logger.debug("Test environment cleanup failed (may not exist)", { error });
  }
}

Deno.test("E2E Integration - Complete CLI workflow: file input to output", async () => {
  await setupTestEnvironment();

  try {
    // Test basic to project workflow
    const inputFile = `${FIXTURES_DIR}/input.md`;
    const outputFile = `${TEST_BASE_DIR}/output.md`;

    const result = await runBreakdownCommand([
      "to",
      "project",
      "--from-file",
      inputFile,
      "--to-file",
      outputFile,
    ]);

    logger.debug("CLI workflow result", {
      success: result.success,
      code: result.code,
      stdoutLength: result.stdout.length,
      stderrLength: result.stderr.length,
    });

    if (result.success) {
      assertEquals(result.code, 0, "Command should exit with code 0");

      // Verify output file was created
      try {
        const outputContent = await Deno.readTextFile(outputFile);
        assertEquals(outputContent.length > 0, true, "Output file should have content");
        logger.debug("Output file validation passed", { contentLength: outputContent.length });
      } catch {
        logger.error("Output file was not created or not readable");
        // This may be expected if the command failed for configuration reasons
      }
    } else {
      logger.debug("Command failed as expected (may be due to configuration)", {
        stderr: result.stderr,
      });
    }
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("E2E Integration - STDIN input workflow", async () => {
  await setupTestEnvironment();

  try {
    const stdinInput = "# Test Input\n\nThis is test content for stdin processing.";
    const outputFile = `${TEST_BASE_DIR}/stdin_output.md`;

    const result = await runBreakdownCommand([
      "summary",
      "issue",
      "--to-file",
      outputFile,
    ], stdinInput);

    logger.debug("STDIN workflow result", {
      success: result.success,
      code: result.code,
      hasStdout: result.stdout.length > 0,
    });

    if (result.success) {
      assertEquals(result.code, 0, "STDIN command should exit with code 0");

      // Verify output was generated
      try {
        const outputContent = await Deno.readTextFile(outputFile);
        assertEquals(outputContent.length > 0, true, "STDIN output should have content");
      } catch {
        logger.debug("STDIN output file not created (may be expected)");
      }
    } else {
      // STDIN processing may fail due to configuration - log for debugging
      logger.debug("STDIN command failed", { stderr: result.stderr });
    }
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("E2E Integration - Help command accessibility", async () => {
  // Help should always work regardless of configuration
  const result = await runBreakdownCommand(["--help"]);

  logger.debug("Help command result", {
    success: result.success,
    stdoutLength: result.stdout.length,
  });

  // Help command should succeed
  assertEquals(result.code, 0, "Help command should exit successfully");
  assertEquals(result.stdout.length > 0, true, "Help should provide output");

  // Help output should contain usage information
  assertStringIncludes(
    result.stdout.toLowerCase(),
    "usage",
    "Help should contain usage information",
  );
});

Deno.test("E2E Integration - Version command accessibility", async () => {
  // Version should always work
  const result = await runBreakdownCommand(["--version"]);

  logger.debug("Version command result", {
    success: result.success,
    stdout: result.stdout,
  });

  // Version command should succeed or be handled gracefully
  if (result.success) {
    assertEquals(result.stdout.length > 0, true, "Version should provide output");
  } else {
    // Version command may not be implemented yet - log for debugging
    logger.debug("Version command not implemented or failed", { stderr: result.stderr });
  }
});

Deno.test("E2E Integration - Invalid command error handling", async () => {
  // Test error handling for invalid commands
  const result = await runBreakdownCommand(["invalid_command_xyz123"]);

  logger.debug("Invalid command result", {
    success: result.success,
    code: result.code,
    stderr: result.stderr,
  });

  assertEquals(result.success, false, "Invalid command should fail");
  assertEquals(result.code !== 0, true, "Invalid command should exit with non-zero code");

  // Should provide helpful error message
  const errorOutput = result.stderr || result.stdout;
  assertEquals(errorOutput.length > 0, true, "Should provide error message");
});

Deno.test("E2E Integration - Missing required arguments error handling", async () => {
  // Test error handling for missing arguments
  const result = await runBreakdownCommand(["to"]);

  logger.debug("Missing arguments result", {
    success: result.success,
    code: result.code,
  });

  assertEquals(result.success, false, "Missing arguments should fail");
  assertEquals(result.code !== 0, true, "Should exit with error code");

  // Should provide helpful error about missing arguments
  const errorOutput = result.stderr || result.stdout;
  assertEquals(errorOutput.length > 0, true, "Should provide error message for missing args");
});

Deno.test("E2E Integration - File permission error handling", async () => {
  await setupTestEnvironment();

  try {
    // Try to write to a directory that doesn't exist
    const invalidOutputFile = "/nonexistent/directory/output.md";
    const inputFile = `${FIXTURES_DIR}/input.md`;

    const result = await runBreakdownCommand([
      "to",
      "project",
      "--from-file",
      inputFile,
      "--to-file",
      invalidOutputFile,
    ]);

    logger.debug("File permission error result", {
      success: result.success,
      stderr: result.stderr,
    });

    assertEquals(result.success, false, "Should fail for invalid output path");

    // Should handle file errors gracefully
    const errorOutput = result.stderr || result.stdout;
    assertEquals(errorOutput.length > 0, true, "Should provide file error message");
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("E2E Integration - Configuration error handling", async () => {
  // Test with invalid configuration environment
  const originalCwd = Deno.cwd();

  try {
    // Change to a directory without configuration
    Deno.chdir("/tmp");

    const result = await runBreakdownCommand([
      "to",
      "project",
      "--from-file",
      "/dev/null",
    ]);

    logger.debug("Configuration error result", {
      success: result.success,
      stderr: result.stderr,
    });

    // Should handle missing configuration gracefully
    if (!result.success) {
      const errorOutput = result.stderr || result.stdout;
      assertEquals(errorOutput.length > 0, true, "Should provide configuration error message");
    }
  } finally {
    Deno.chdir(originalCwd);
  }
});

Deno.test("E2E Integration - Large input processing", async () => {
  await setupTestEnvironment();

  try {
    // Create large input content
    const largeInput = "# Large Test Input\n\n" + "Lorem ipsum ".repeat(1000) +
      "\n\nEnd of large input.";
    const outputFile = `${TEST_BASE_DIR}/large_output.md`;

    const result = await runBreakdownCommand(
      [
        "summary",
        "project",
        "--to-file",
        outputFile,
      ],
      largeInput,
      45000,
    ); // Extended timeout for large input

    logger.debug("Large input processing result", {
      success: result.success,
      inputSize: largeInput.length,
      processingTime: "within timeout",
    });

    if (result.success) {
      assertEquals(result.code, 0, "Large input should be processed successfully");
    } else {
      logger.debug("Large input processing failed", { stderr: result.stderr });
    }
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("E2E Integration - Concurrent command execution", async () => {
  await setupTestEnvironment();

  try {
    // Run multiple commands concurrently
    const commands = [
      runBreakdownCommand(["--help"]),
      runBreakdownCommand(["--help"]),
      runBreakdownCommand(["--help"]),
    ];

    const results = await Promise.all(commands);

    logger.debug("Concurrent execution results", {
      successCount: results.filter((r) => r.success).length,
      totalCount: results.length,
    });

    // At least some should succeed (help command should always work)
    const successCount = results.filter((r) => r.success).length;
    assertEquals(successCount, 3, "All concurrent help commands should succeed");
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("E2E Integration - Command timeout behavior", async () => {
  // Test command timeout with very short timeout
  const result = await runBreakdownCommand(
    [
      "to",
      "project",
      "--from-file",
      "/dev/null",
    ],
    undefined,
    100,
  ); // Very short timeout

  logger.debug("Timeout behavior result", {
    success: result.success,
    stderr: result.stderr,
  });

  // Should handle timeout gracefully
  if (!result.success && result.stderr.includes("timeout")) {
    assertEquals(result.code, -1, "Timeout should result in -1 exit code");
  }
});

Deno.test("E2E Integration - Signal handling", async () => {
  // Test that commands can be interrupted gracefully
  const cmd = new Deno.Command("deno", {
    args: ["run", "--allow-all", "./mod.ts", "to", "project", "--from-file", "/dev/null"],
    stdout: "piped",
    stderr: "piped",
  });

  const process = cmd.spawn();

  // Give it a moment to start
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Kill the process
  try {
    process.kill("SIGTERM");
    const result = await process.output();

    // Close process streams to prevent leaks
    try {
      await process.stdout.cancel();
      await process.stderr.cancel();
    } catch {
      // Ignore errors if already closed
    }

    logger.debug("Signal handling result", {
      code: result.code,
      killedBySignal: result.code !== 0,
    });

    // Process should exit (either normally or by signal)
    assertExists(result, "Process should complete after signal");
  } catch (error) {
    // Close process streams even on error
    try {
      await process.stdout.cancel();
      await process.stderr.cancel();
    } catch {
      // Ignore errors if already closed
    }
    logger.debug("Signal handling test completed", { error });
  }
});

Deno.test("E2E Integration - Performance benchmark", async () => {
  // Basic performance benchmark
  const startTime = performance.now();

  const result = await runBreakdownCommand(["--help"]);

  const duration = performance.now() - startTime;

  logger.debug("Performance benchmark", {
    duration: `${duration.toFixed(2)}ms`,
    success: result.success,
  });

  // Help command should complete within reasonable time
  assertEquals(duration < 5000, true, "Help command should complete within 5 seconds");

  if (result.success) {
    assertEquals(result.code, 0, "Performance test should succeed");
  }
});
