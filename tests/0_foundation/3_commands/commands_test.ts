/**
 * Command Parameter Parsing Tests (0)
 *
 * Execution Order: 1st (Most fundamental)
 * This test must run first as it validates the most basic functionality:
 * command-line argument parsing.
 *
 * Purpose:
 * Test the pre-processing of command parameters before execution
 * This is a foundational test that must pass before running command execution tests
 *
 * Dependencies:
 * - @tettuan/breakdownparams for command parameter handling
 * - @tettuan/breakdownlogger for logging
 *
 * Test Strategy:
 * 1. Parameter parsing
 *    - Simple pattern: Help and version flags
 *    - Normal pattern: Command with options
 */

import { assertEquals, assertExists } from "../../../deps.ts";
import { join } from "@std/path";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  type OneParamsResult,
  ParamsParser,
  type ZeroParamsResult,
} from "@tettuan/breakdownparams";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";
import { displayHelp, displayVersion, initWorkspace } from "../../../lib/commands/mod.ts";
import { validateCommandOptions } from "../../../lib/cli/args.ts";
import { VERSION } from "../../../lib/version.ts";
import { exists } from "jsr:@std/fs";

const logger = new BreakdownLogger();
let TEST_ENV: TestEnvironment;

// Setup test environment before running tests
Deno.test({
  name: "setup",
  fn: async () => {
    logger.debug("Setting up test environment", { test: "setup" });
    TEST_ENV = await setupTestEnvironment({
      workingDir: "./tmp/test_commands",
    });
    logger.debug("Test environment setup complete", { workingDir: TEST_ENV.workingDir });
  },
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    logger.debug("Cleaning up test environment", { test: "cleanup" });
    await cleanupTestEnvironment(TEST_ENV);
    logger.debug("Test environment cleanup complete");
  },
});

// Group 1: Simple Pattern - Flag Commands
Deno.test("parseParams - help command", () => {
  logger.debug("Testing help flag parsing", {
    purpose: "Verify help flag recognition",
    step: "Simple pattern",
    args: ["--help"],
  });
  const args = ["--help"];
  const parser = new ParamsParser();
  const result = parser.parse(args);
  if (result.type !== "zero") {
    throw new Error("Expected zero result type");
  }
  const noParamsResult = result as ZeroParamsResult;
  assertEquals(noParamsResult.options.help, true);
  logger.debug("Help flag parsing test complete", { result: noParamsResult });
});

Deno.test("parseParams - version command", () => {
  logger.debug("Testing version flag parsing", {
    purpose: "Verify version flag recognition",
    step: "Simple pattern",
    args: ["--version"],
  });
  const args = ["--version"];
  const parser = new ParamsParser();
  const result = parser.parse(args);
  if (result.type !== "zero") {
    throw new Error("Expected zero result type");
  }
  const noParamsResult = result as ZeroParamsResult;
  assertEquals(noParamsResult.options.version, true);
  logger.debug("Version flag parsing test complete", { result: noParamsResult });
});

// Group 2: Normal Pattern - Basic Commands
Deno.test("parseParams - init command", () => {
  logger.debug("Testing init command parsing", {
    purpose: "Verify init command recognition",
    step: "Normal pattern",
    args: ["init"],
  });
  const args = ["init"];
  const parser = new ParamsParser();
  const result = parser.parse(args);
  if (result.type !== "one") {
    throw new Error("Expected one result type");
  }
  const singleResult = result as OneParamsResult;
  assertEquals(singleResult.demonstrativeType, "init");
  logger.debug("Init command parsing test complete", { result: singleResult });
});

// Group 3: Command Options Tests
Deno.test("parseParams - adaptation option (long form)", () => {
  logger.debug("Testing adaptation option parsing", {
    purpose: "Verify --adaptation flag recognition",
    step: "Command options",
    args: [
      "summary",
      "task",
      "--from",
      "input.md",
      "--destination",
      "output.md",
      "--adaptation",
      "strict",
    ],
  });
  const args = [
    "summary",
    "task",
    "--from",
    "input.md",
    "--destination",
    "output.md",
    "--adaptation",
    "strict",
  ];
  const options = validateCommandOptions(args.slice(2)); // Skip command and subcommand
  assertEquals(options.adaptation, "strict");
  logger.debug("Adaptation option parsing test complete", { options });
});

Deno.test("parseParams - adaptation option (short form)", () => {
  logger.debug("Testing adaptation short option parsing", {
    purpose: "Verify -a flag recognition",
    step: "Command options",
    args: ["summary", "task", "--from=input.md", "--destination=output.md", "-a=a"],
  });
  const args = ["summary", "task", "--from=input.md", "--destination=output.md", "-a=a"];
  const options = validateCommandOptions(args.slice(2)); // Skip command and subcommand
  assertEquals(options.adaptation, "a");
  logger.debug("Adaptation short option parsing test complete", { options });
});

Deno.test("Command Module Tests", async (t) => {
  const TEST_DIR = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();
  Deno.chdir(TEST_DIR);
  try {
    await t.step("setup", async () => {
      try {
        await Deno.remove(TEST_DIR, { recursive: true });
      } catch { /* ignore */ }
    });

    await t.step("initWorkspace should create required directories", async () => {
      const result = await initWorkspace(TEST_DIR);
      assertEquals(result.success, true);
      assertEquals(result.error, "");
      // Verify .agent/breakdown directory exists
      const breakdownDir = join(TEST_DIR, ".agent/breakdown");
      const breakdownDirInfo = await Deno.stat(breakdownDir);
      assertExists(breakdownDirInfo);
      assertEquals(breakdownDirInfo.isDirectory, true);
      // Verify required subdirectories exist
      const requiredDirs = [
        "projects",
        "issues",
        "tasks",
        "temp",
        "config",
        "prompts",
        "schema",
      ];
      for (const dir of requiredDirs) {
        const dirPath = join(TEST_DIR, ".agent", "breakdown", dir);
        const dirInfo = await Deno.stat(dirPath);
        assertExists(dirInfo);
        assertEquals(dirInfo.isDirectory, true);
      }
      // Cleanup after test
      await Deno.remove(join(TEST_DIR, ".agent"), { recursive: true });
    });

    await t.step("displayHelp should not throw", () => {
      displayHelp();
    });

    await t.step("displayVersion should not throw and output correct version", () => {
      const result = displayVersion();
      assertEquals(result.success, true);
      assertEquals(result.output, `Breakdown v${VERSION}`);
    });

    // Cleanup: Remove test directory
    await t.step("cleanup", async () => {
      // No need to remove TEST_DIR here, will be removed in finally
    });
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(TEST_DIR, { recursive: true });
  }
});

Deno.test("cli - init command should finish and create config", async () => {
  const logger = new BreakdownLogger();
  const testDir = await Deno.makeTempDir();
  logger.debug("[CLI INIT TEST] Cleaning up test dir", { testDir });
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch { /* ignore */ }
  await Deno.mkdir(testDir, { recursive: true });
  logger.debug("[CLI INIT TEST] Running CLI init command", { testDir });
  const cliPath = new URL("../../../cli/breakdown.ts", import.meta.url).pathname;
  const cmd = new Deno.Command("deno", {
    args: ["run", "--allow-all", cliPath, "init"],
    cwd: testDir,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  logger.debug("[CLI INIT TEST] CLI finished", { code, out, err });
  if (code !== 0) {
    logger.error("[CLI INIT TEST] CLI failed", {
      output: out,
      error: err,
      exitCode: code,
      testDir: testDir,
      cliPath: cliPath,
    });
  }
  // Check exit code
  assertEquals(code, 0);
  // Check config file exists
  const configFile = `${testDir}/.agent/breakdown/config/app.yml`;
  const existsConfig = await exists(configFile);
  logger.debug("[CLI INIT TEST] Config file exists?", { configFile, existsConfig });
  assertEquals(existsConfig, true);
  // Check main directories
  for (const dir of ["projects", "issues", "tasks", "temp", "config", "prompts", "schema"]) {
    const dirPath = `${testDir}/.agent/breakdown/${dir}`;
    const existsDir = await exists(dirPath);
    logger.debug("[CLI INIT TEST] Directory exists?", { dirPath, existsDir });
    assertEquals(existsDir, true);
  }
  // Cleanup
  await Deno.remove(testDir, { recursive: true });
});

Deno.test("CLI Command Execution", async (t) => {
  const TEST_DIR = await Deno.makeTempDir();
  await Deno.mkdir(TEST_DIR, { recursive: true });
  const originalCwd = Deno.cwd();
  Deno.chdir(TEST_DIR);
  try {
    await t.step("setup", async () => {
      // ... existing code ...
    });
    // ... all other steps ...
    await t.step("cleanup", async () => {
      // ... existing code ...
    });
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(TEST_DIR, { recursive: true });
  }
});
