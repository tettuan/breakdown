/**
 * Core tests for basic CLI commands
 * 
 * Purpose:
 * - Verify basic command functionality (init, to, summary, defect)
 * - Test command line argument parsing
 * - Validate error handling
 * 
 * Success Definition:
 * - Commands execute with correct parameters
 * - Appropriate output is generated
 * - Errors are handled gracefully
 * 
 * SPECIFICATION GAPS AND REQUIRED IMPROVEMENTS
 * 
 * 1. Missing Test Coverage:
 *    - Standard input processing for summary command
 *    - Pipe input for defect command
 *    - Help message verification
 *    - Version information display
 *    - Path normalization rules
 *    - Directory structure validation
 *    - Error message language consistency
 * 
 * 2. Validation Improvements Needed:
 *    - Environment variable overrides
 *    - Custom working directory scenarios
 *    - Error recovery procedures
 *    - Configuration file validation
 *    - Schema version compatibility
 * 
 * 3. Integration Test Gaps:
 *    - Cross-command interactions
 *    - End-to-end workflows
 *    - Error recovery flows
 *    - Performance benchmarks
 * 
 * 4. Test Environment Setup:
 *    - Mock stdin/stdout handling
 *    - Temporary file cleanup
 *    - Test data isolation
 *    - Environment variable management
 * 
 * TODO:
 * 1. Add stdin processing tests for all commands
 * 2. Implement path normalization test cases
 * 3. Add directory structure validation tests
 * 4. Create error handling and recovery tests
 * 5. Add configuration validation tests
 * 6. Implement end-to-end workflow tests
 * 7. Add performance benchmark tests
 */

import { assertEquals, assertExists, assertRejects } from "jsr:@std/testing/asserts";
import { join } from "jsr:@std/path";
import { setupTestEnvironment, cleanupTestEnvironment, runCommand, TestEnvironment } from "../../helpers/setup.ts";
import { assertCommandOutput, assertFileExists, assertDirectoryExists } from "../../helpers/assertions.ts";
import { VERSION } from "../../../version.ts";
import { runBreakdown } from "../../../cli/breakdown.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";

interface CommandResult {
  output?: string;
  error?: string;
  code: number;
}

const logger = new BreakdownLogger();
let TEST_ENV: TestEnvironment;

// Setup test environment before running tests
Deno.test({
  name: "setup",
  fn: async () => {
    TEST_ENV = await setupTestEnvironment({
      workingDir: "./tmp/test_basic_commands"
    });
  },
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
});

// Test 'init' command
Deno.test("command - init", async () => {
  logger.debug("Testing init command");
  
  const result = await runCommand(["init"]);
  assertCommandOutput(result, { output: "Working directory created" });
  
  // Verify working directory structure using URL API
  const workingDir = new URL(`file://${TEST_ENV.workingDir}`);
  const dirs = ["projects", "issues", "tasks", "temp"];
  
  for (const dir of dirs) {
    const dirUrl = new URL(dir, workingDir);
    const dirPath = decodeURIComponent(dirUrl.pathname);
    const exists = await Deno.stat(dirPath).then(
      (stat) => stat.isDirectory,
      () => false
    );
    assertEquals(exists, true, `Directory ${dir} should exist`);
  }
});

// Test 'to' command with file paths
Deno.test("command - to issue with file paths", async () => {
  logger.debug("Testing 'to issue' command with file paths");
  
  // Create test project file using URL API
  const projectUrl = new URL("project.md", `file://${TEST_ENV.workingDir}`);
  await Deno.writeTextFile(
    decodeURIComponent(projectUrl.pathname),
    "# Test Project\n\n## Features\n- Feature 1\n- Feature 2"
  );
  
  const result = await runCommand([
    "to",
    "issue",
    "--from",
    decodeURIComponent(projectUrl.pathname)
  ]);
  
  assertCommandOutput(result, { output: "Converting project to issues" });
  
  // Verify output files using URL API
  const issuesDir = new URL("issues/", `file://${TEST_ENV.workingDir}`);
  await assertDirectoryExists(decodeURIComponent(issuesDir.pathname));
  
  const issue1Path = decodeURIComponent(new URL("issue_1.md", issuesDir).pathname);
  const issue2Path = decodeURIComponent(new URL("issue_2.md", issuesDir).pathname);
  
  await assertFileExists(issue1Path);
  await assertFileExists(issue2Path);
  
  // Verify content of generated files
  const files = [issue1Path, issue2Path];
  for (const file of files) {
    const content = await Deno.readTextFile(file);
    assertEquals(content.includes("Feature"), true, "Generated issue should contain feature content");
  }
});

// Test 'summary' command with file input
Deno.test("command - summary with file", async () => {
  logger.debug("Testing summary command with file input");
  
  // Create test issue files using URL API
  const issueDir = new URL("issues/", `file://${TEST_ENV.workingDir}`);
  await Deno.mkdir(decodeURIComponent(issueDir.pathname), { recursive: true });
  
  const issue1Url = new URL("issue_1.md", issueDir);
  const issue2Url = new URL("issue_2.md", issueDir);
  
  await Deno.writeTextFile(
    decodeURIComponent(issue1Url.pathname),
    "# Issue 1\n\nPriority: High\nStatus: Open"
  );
  await Deno.writeTextFile(
    decodeURIComponent(issue2Url.pathname),
    "# Issue 2\n\nPriority: Medium\nStatus: In Progress"
  );
  
  // Test with file input
  const result = await runCommand([
    "summary",
    "--from",
    decodeURIComponent(issue1Url.pathname)
  ]);
  
  assertCommandOutput(result, { output: "Generating summary" });
  assertCommandOutput(result, { output: "Priority: High" });
  
  // Test with stdin input
  const stdinResult = await runCommand(
    ["summary"],
    "# Test Issue\n\nPriority: Critical\nStatus: Blocked"
  );
  
  assertCommandOutput(stdinResult, { output: "Generating summary" });
  assertCommandOutput(stdinResult, { output: "Priority: Critical" });
});

// Test 'defect' command with file input
Deno.test("command - defect with file", async () => {
  logger.debug("Testing defect command with file input");
  
  // Create test task file using URL API
  const taskUrl = new URL("task.md", `file://${TEST_ENV.workingDir}`);
  await Deno.writeTextFile(
    decodeURIComponent(taskUrl.pathname),
    "# Task\n\n## Steps\n1. Step 1\n2. Step 2\n\n## Expected Result\nSuccess"
  );
  
  // Test with file input
  const result = await runCommand([
    "defect",
    "--from",
    decodeURIComponent(taskUrl.pathname)
  ]);
  
  assertCommandOutput(result, { output: "Analyzing defects" });
  
  // Test with stdin input
  const stdinResult = await runCommand(
    ["defect"],
    "# Test Task\n\n## Steps\n1. Action\n\n## Expected\nSuccess\n## Actual\nFailure"
  );
  
  assertCommandOutput(stdinResult, { output: "Analyzing defects" });
  assertCommandOutput(stdinResult, { output: "Defect detected" });
});

// Test error handling
Deno.test("command - error handling", async () => {
  logger.debug("Testing error handling");
  
  // Test missing required argument
  const missingArgResult = await runCommand(["to"]);
  assertCommandOutput(missingArgResult, { error: "Error: Command requires additional arguments" });
  
  // Test invalid command
  const invalidCmdResult = await runCommand(["invalid"]);
  assertCommandOutput(invalidCmdResult, { error: "Error: Invalid command" });
  
  // Test invalid file path using URL API
  const invalidUrl = new URL("nonexistent.md", `file://${TEST_ENV.workingDir}`);
  const invalidPathResult = await runCommand([
    "to",
    "issue",
    "--from",
    decodeURIComponent(invalidUrl.pathname)
  ]);
  assertCommandOutput(invalidPathResult, { error: "Error: Failed to read input file" });
  
  // Test missing input for stdin
  const noInputResult = await runCommand(["summary"]);
  assertCommandOutput(noInputResult, { error: "Error: No input provided" });
  
  // Test invalid path characters
  const invalidCharsResult = await runCommand([
    "to",
    "issue",
    "--from",
    "test<>:*?.md"
  ]);
  assertCommandOutput(invalidCharsResult, { error: "Error: Invalid characters in path" });
});

// Test help and version commands
Deno.test("command - help and version", async () => {
  logger.debug("Testing help and version commands");
  
  // Test help command
  const helpResult = await runCommand(["help"]);
  assertCommandOutput(helpResult, { output: "Usage:" });
  assertCommandOutput(helpResult, { output: "Commands:" });
  assertCommandOutput(helpResult, { output: "Options:" });
  
  // Test version command
  const versionResult = await runCommand(["version"]);
  assertCommandOutput(versionResult, { output: "1.0.0" });
  assertCommandOutput(versionResult, { output: "Copyright" });
});

Deno.test("basic commands - help and version", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test_basic_commands_help"
  });
  try {
    // Test help command
    const helpOutput = await new Promise<string>((resolve) => {
      const originalLog = console.log;
      let output = "";
      console.log = (msg: string) => {
        output += msg + "\n";
      };
      runBreakdown(["help"]).then(() => {
        console.log = originalLog;
        resolve(output);
      });
    });

    assertEquals(helpOutput.includes("Breakdown - AI Development Instruction Tool"), true);
    assertEquals(helpOutput.includes("Usage:"), true);
    assertEquals(helpOutput.includes("Commands:"), true);

    // Test version command
    const versionOutput = await new Promise<string>((resolve) => {
      const originalLog = console.log;
      let output = "";
      console.log = (msg: string) => {
        output += msg + "\n";
      };
      runBreakdown(["version"]).then(() => {
        console.log = originalLog;
        resolve(output);
      });
    });

    assertEquals(versionOutput.includes("Breakdown v"), true);
    assertEquals(versionOutput.includes("Copyright"), true);
    assertEquals(versionOutput.includes("License: MIT"), true);
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("basic commands - init", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test_basic_commands_init"
  });
  try {
    // Test init command
    await runBreakdown(["init"]);

    // Verify directory structure
    const workingDir = env.workingDir;
    const dirs = ["projects", "issues", "tasks", "temp"];
    
    for (const dir of dirs) {
      const dirPath = join(workingDir, dir);
      const exists = await Deno.stat(dirPath).then(
        (stat) => stat.isDirectory,
        () => false
      );
      assertEquals(exists, true, `Directory ${dir} should exist`);
    }
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("basic commands - invalid command", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test_basic_commands_invalid"
  });
  try {
    await assertRejects(
      () => runBreakdown(["invalid"]),
      Error,
      "Invalid command"
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("basic commands - missing arguments", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test_basic_commands_missing"
  });
  try {
    await assertRejects(
      () => runBreakdown(["to"]),
      Error,
      "Command requires additional arguments"
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
}); 