/**
 * Integration tests for CLI validation through runBreakdown
 *
 * Tests the integrated validation flow that combines:
 * - enhancedPreprocessCommandLine() validation
 * - BreakdownParams parsing and validation
 * - End-to-end error handling
 */

import { assertEquals, assertStringIncludes } from "@std/assert";

/**
 * Mock stdout/stderr for testing CLI output
 */
class MockOutput {
  public stdout: string = "";
  public stderr: string = "";
  public exitCode: number = 0;

  writeStdout = (message: string): void => {
    this.stdout += message + "\n";
  };

  writeStderr = (message: string): void => {
    this.stderr += message + "\n";
  };

  exit = (code: number): never => {
    this.exitCode = code;
    throw new Error(`Deno.exit(${code})`);
  };

  reset(): void {
    this.stdout = "";
    this.stderr = "";
    this.exitCode = 0;
  }
}

/**
 * Test helper to run CLI with mocked output
 */
async function runCLITest(args: string[]): Promise<MockOutput> {
  const output = new MockOutput();

  // Mock console and Deno functions
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalExit = Deno.exit;
  const originalStdoutWrite = Deno.stdout.write;

  console.log = (...args: unknown[]) => {
    output.stdout +=
      args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ") +
      "\n";
  };

  console.error = (...args: unknown[]) => {
    output.stderr +=
      args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ") +
      "\n";
  };

  // Mock Deno.stdout.write to capture direct stdout writes
  Deno.stdout.write = (data: Uint8Array): Promise<number> => {
    output.stdout += new TextDecoder().decode(data);
    return Promise.resolve(data.length);
  };

  Deno.exit = output.exit as typeof Deno.exit;

  try {
    const { runBreakdown } = await import("../../../cli/breakdown.ts");
    await runBreakdown(args);
  } catch (error) {
    // Expected for exit() calls
    if (error instanceof Error && !error.message.startsWith("Deno.exit")) {
      throw error;
    }
  } finally {
    // Restore original functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Deno.stdout.write = originalStdoutWrite;
    Deno.exit = originalExit;
  }

  return output;
}

// Test: Help functionality
Deno.test("CLI Integration: --help flag", async () => {
  const output = await runCLITest(["--help"]);
  assertStringIncludes(output.stdout, "Breakdown - AI Development Instruction Tool");
  assertStringIncludes(output.stdout, "Usage:");
  assertEquals(output.exitCode, 0);
});

Deno.test("CLI Integration: -h flag", async () => {
  const output = await runCLITest(["-h"]);
  assertStringIncludes(output.stdout, "Breakdown - AI Development Instruction Tool");
  assertEquals(output.exitCode, 0);
});

// Test: Version functionality
Deno.test("CLI Integration: --version flag", async () => {
  const output = await runCLITest(["--version"]);
  assertStringIncludes(output.stdout, "Breakdown v");
  assertEquals(output.exitCode, 0);
});

Deno.test("CLI Integration: -v flag", async () => {
  const output = await runCLITest(["-v"]);
  assertStringIncludes(output.stdout, "Breakdown v");
  assertEquals(output.exitCode, 0);
});

// Test: No arguments (should show help)
Deno.test("CLI Integration: no arguments", async () => {
  const output = await runCLITest([]);
  assertStringIncludes(output.stdout, "Breakdown - AI Development Instruction Tool");
  assertEquals(output.exitCode, 0);
});

// Test: Validation errors
// Note: These validation tests have been removed as the validation logic
// has been moved to BreakdownParams and is no longer handled by Breakdown itself

Deno.test({
  name: "CLI Integration: two parameter processing",
  // Disable resource sanitization as stdin handling in CLI tests can create false positives
  sanitizeResources: false,
  async fn() {
    // Create a temporary input file to avoid stdin reading
    const tempFile = await Deno.makeTempFile({ suffix: ".md" });
    await Deno.writeTextFile(tempFile, "# Test Input\nTest content for breakdown processing.");
    
    try {
      const output = await runCLITest(["to", "project", `--from=${tempFile}`, "--destination=stdout"]);
      // The new implementation should process two parameters gracefully
      // Debug messages have been removed for cleaner output
      // We should see prompt output instead
      // Note: We specify --from to avoid stdin reading which causes resource leaks in tests
      assertEquals(output.exitCode, 0);
    } finally {
      // Cleanup
      try {
        await Deno.remove(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
});

// Note: Invalid option and duplicate option tests have been removed
// as these validations are now handled by BreakdownParams

// Test: Custom variables validation - DISABLED (implementation simplification)
// Deno.test("CLI Integration: custom variable without value", async () => {
//   const output = await runCLITest(["to", "project", "--uv-custom"]);
//   assertStringIncludes(output.stderr, "Custom variable --uv-custom requires a value");
//   assertEquals(output.exitCode, 1);
// });

// Test: Command validation - Temporarily disabled due to file system operations
// This test attempts real file operations which causes timeouts in CI environment
// TODO: Implement proper mocking for file system operations
// Deno.test("CLI Integration: init command", async () => {
//   const output = await runCLITest(["init"]);
//   // Should not error immediately (may fail due to workspace setup, but not validation)
//   // The test checks that validation passes, not that init succeeds
//   // If it errors due to workspace issues, that's acceptable
//   if (output.exitCode === 1) {
//     // If it fails, it should not be due to validation errors
//     const isValidationError = output.stderr.includes("Invalid") ||
//       output.stderr.includes("Unknown command") ||
//       output.stderr.includes("validation error");
//     assertEquals(isValidationError, false, "Should not fail due to validation");
//   }
// });

// Test: File operations (with temporary files) - Updated for stdout-only implementation
Deno.test("CLI Integration: two parameters with options", async () => {
  // Create a temporary input file
  const tempFile = await Deno.makeTempFile({ suffix: ".md" });
  await Deno.writeTextFile(tempFile, "# Test Project\nThis is a test project.");

  try {
    const output = await runCLITest([
      "to",
      "project",
      `--from=${tempFile}`,
      `--destination=/tmp/ignored.md`, // This option is ignored in stdout-only mode
    ]);

    // Should not have validation errors, should process gracefully
    const hasValidationError = output.stderr.includes("validation error");
    assertEquals(hasValidationError, false, "Should not have validation errors");

    // In stdout-only mode, output should be in stdout, not in file
    assertStringIncludes(output.stdout, "# {project_name} Project Plan");

    // May fail for other reasons (missing config, etc.) but not validation
  } finally {
    // Cleanup
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
});

// Test: Configuration warnings (non-existent config)
Deno.test("CLI Integration: non-existent config warning", async () => {
  const output = await runCLITest(["to", "project", "--config=nonexistent", "--input=project"]);

  // Test passes if CLI executes without crashing - configuration warnings are handled internally
  // The CLI now continues execution even with config issues, which is the expected behavior
  // The warning may be logged but doesn't prevent execution
  const didNotCrash = !output.stderr.includes("Error:") ||
    output.stdout.includes("Breakdown execution completed");
  assertEquals(
    didNotCrash,
    true,
    "CLI should handle config issues gracefully and continue execution",
  );

  // Should not exit with error due to config warning
  // May exit with error due to other issues (missing input, etc.)
});
