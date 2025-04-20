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

import { assertEquals, assertExists } from "$deps/mod.ts";
import { join } from "$deps/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  type NoParamsResult,
  ParamsParser,
  type SingleParamResult,
} from "@tettuan/breakdownparams";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";
import { displayHelp, displayVersion, initWorkspace } from "../../lib/commands/mod.ts";

const logger = new BreakdownLogger();
let TEST_ENV: TestEnvironment;

const TEST_DIR = "./test_workspace";

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
  if (result.type !== "no-params") {
    throw new Error("Expected no-params result type");
  }
  const noParamsResult = result as NoParamsResult;
  assertEquals(noParamsResult.help, true);
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
  if (result.type !== "no-params") {
    throw new Error("Expected no-params result type");
  }
  const noParamsResult = result as NoParamsResult;
  assertEquals(noParamsResult.version, true);
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
  if (result.type !== "single") {
    throw new Error("Expected single result type");
  }
  const singleResult = result as SingleParamResult;
  assertEquals(singleResult.command, "init");
  logger.debug("Init command parsing test complete", { result: singleResult });
});

Deno.test("Command Module Tests", async (t) => {
  // Setup: Create test directory
  await t.step("setup", async () => {
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  await t.step("initWorkspace should create required directories", async () => {
    await initWorkspace(TEST_DIR);

    // Verify breakdown directory exists
    const breakdownDir = join(TEST_DIR, "breakdown");
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
      const dirPath = join(breakdownDir, dir);
      const dirInfo = await Deno.stat(dirPath);
      assertExists(dirInfo);
      assertEquals(dirInfo.isDirectory, true);
    }
  });

  await t.step("displayHelp should not throw", () => {
    displayHelp();
  });

  await t.step("displayVersion should not throw", () => {
    displayVersion();
  });

  // Cleanup: Remove test directory
  await t.step("cleanup", async () => {
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});
