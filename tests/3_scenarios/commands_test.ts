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

import { assertEquals } from "$std/testing/asserts.ts";
import { setupTestEnvironment, cleanupTestEnvironment, runCommand, setupTestPromptAndSchemaFiles } from "../helpers/setup.ts";
import { assertCommandOutput, assertFileExists, assertDirectoryExists } from "../helpers/assertions.ts";

const TEST_ENV = await setupTestEnvironment();

// Set up test files
await setupTestPromptAndSchemaFiles(TEST_ENV.testDir);

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic Command Scenarios
Deno.test("CLI - basic command execution", async () => {
  const result = await runCommand(["run", "-A", "cli.ts", "--help"]);
  
  assertCommandOutput(result, {
    output: "Usage:",
    error: "",
  });
});

Deno.test("CLI - version command", async () => {
  const result = await runCommand(["run", "-A", "cli.ts", "--version"]);
  
  assertCommandOutput(result, {
    output: "breakdown version",
    error: "",
  });
});

// Project Conversion Scenarios
Deno.test("CLI - project to issue conversion", async () => {
  const inputFile = `${TEST_ENV.testDir}/project.md`;
  const outputDir = `${TEST_ENV.testDir}/output`;
  
  // Create test project file
  await Deno.writeTextFile(inputFile, "# Test Project\n\n## Tasks\n- Task 1\n- Task 2");
  
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "--input", inputFile,
    "--output", outputDir,
    "convert",
    "--type", "project-to-issue"
  ]);
  
  await assertFileExists(inputFile);
  await assertDirectoryExists(outputDir);
  await assertFileExists(`${outputDir}/issues.md`);
  
  assertCommandOutput(result, {
    error: "",
  });
});

// Issue Analysis Scenarios
Deno.test("CLI - issue analysis", async () => {
  const inputFile = `${TEST_ENV.testDir}/issues.md`;
  const outputFile = `${TEST_ENV.testDir}/analysis.md`;
  
  // Create test issue file
  await Deno.writeTextFile(inputFile, "# Issues\n\n## Issue 1\nPriority: High\n\n## Issue 2\nPriority: Medium");
  
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "--input", inputFile,
    "--output", outputFile,
    "analyze",
    "--type", "priority"
  ]);
  
  await assertFileExists(inputFile);
  await assertFileExists(outputFile);
  
  assertCommandOutput(result, {
    error: "",
  });
});

// Error Scenarios
Deno.test("CLI - invalid input file", async () => {
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "--input", "nonexistent.md",
    "process"
  ]);
  
  assertCommandOutput(result, {
    error: "Error: Input file not found",
  });
});

Deno.test("CLI - invalid command", async () => {
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "invalid-command"
  ]);
  
  assertCommandOutput(result, {
    error: "Error: Unknown command",
  });
});

Deno.test("CLI - missing required option", async () => {
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "convert",
    "--type", "project-to-issue"
  ]);
  
  assertCommandOutput(result, {
    error: "Error: Required option --input is missing",
  });
}); 