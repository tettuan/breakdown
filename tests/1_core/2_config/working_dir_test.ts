import { assertEquals } from "jsr:@std/assert@^0.224.0/assert-equals";
import { assertRejects } from "jsr:@std/assert@^0.224.0/assert-rejects";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { assertDirectoryExists } from "$test/helpers/assertions.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";
import { join } from "jsr:@std/path@^0.224.0/join";

const logger = new BreakdownLogger();

/**
 * Working Directory Configuration Tests
 *
 * Purpose:
 * Test the working directory configuration as specified in app_config.ja.md
 *
 * Configuration Structure:
 * 1. Application settings (breakdown/config/app.yml)
 *    - working_dir: Working directory path (default: .agent/breakdown)
 *    - app_prompt.base_dir: Prompt file base directory
 *    - app_schema.base_dir: Schema file base directory
 * 2. User settings (in application settings hierarchy)
 *
 * Test Strategy:
 * 1. Basic configuration loading
 *    - Simple pattern: Default configuration
 *    - Normal pattern: Custom configuration
 * 2. Directory structure validation
 *    - Simple pattern: Required directories
 *    - Normal pattern: Directory permissions
 * 3. Error handling
 *    - Edge cases: Invalid paths, missing files
 *
 * Note:
 * - All paths are relative to project root
 * - Configuration is managed through app.yml only
 * - No environment variable overrides
 */

let TEST_ENV: TestEnvironment;

// Setup test environment before running tests
Deno.test({
  name: "setup",
  fn: async () => {
    logger.debug("Setting up test environment", {
      purpose: "Create test directory structure as specified in app_config.ja.md",
      step: "Initial setup",
      state: "Starting",
    });
    TEST_ENV = await setupTestEnvironment({
      workingDir: "./tmp/test/config-working-dir",
    });
    logger.debug("Test environment ready", {
      workingDir: TEST_ENV.workingDir,
      step: "Initial setup",
      state: "Complete",
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    logger.debug("Cleaning up test environment", {
      step: "Cleanup",
      state: "Starting",
    });
    await cleanupTestEnvironment(TEST_ENV);
    logger.debug("Test environment cleaned", {
      step: "Cleanup",
      state: "Complete",
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Group 1: Simple Pattern - Default Configuration
Deno.test({
  name: "working_dir - simple pattern - default configuration",
  async fn() {
    logger.debug("Testing default configuration", {
      purpose: "Verify basic configuration loading",
      step: "Simple pattern",
      state: "Starting",
      expectedDir: ".agent/breakdown",
    });

    const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configPath, { recursive: true });

    logger.debug("Creating config file", {
      step: "File creation",
      configPath,
    });

    const configFile = join(configPath, "app.yml");
    await Deno.writeTextFile(
      configFile,
      `
working_dir: .agent/breakdown
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

    const config = new BreakdownConfig(TEST_ENV.workingDir);
    await config.loadConfig();
    const settings = await config.getConfig();

    logger.debug("Configuration loaded", {
      step: "Verification",
      actualWorkingDir: settings.working_dir,
      expectedDir: ".agent/breakdown",
    });
    assertEquals(settings.working_dir, ".agent/breakdown");
  },
});

// Group 2: Simple Pattern - Directory Structure
Deno.test({
  name: "working_dir - simple pattern - directory structure",
  async fn() {
    logger.debug("Testing directory structure", {
      purpose: "Verify required directories exist",
      step: "Simple pattern",
      state: "Starting",
    });

    // Create config directory and file first
    const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configPath, { recursive: true });
    const configFile = join(configPath, "app.yml");
    await Deno.writeTextFile(
      configFile,
      `
working_dir: .agent/breakdown
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

    // Create the required directories
    const workingDir = join(TEST_ENV.workingDir, ".agent", "breakdown");
    const requiredDirs = [
      "projects", // For project-related outputs
      "issues", // For issue-related outputs
      "tasks", // For task-related outputs
      "temp", // For temporary files
      "config", // For configuration files
      "prompts", // For prompt files
      "schema", // For schema files
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(workingDir, dir);
      await Deno.mkdir(dirPath, { recursive: true });
    }

    const config = new BreakdownConfig(TEST_ENV.workingDir);
    await config.loadConfig();
    const settings = await config.getConfig();

    for (const dir of requiredDirs) {
      const dirPath = join(TEST_ENV.workingDir, settings.working_dir, dir);
      logger.debug("Checking directory", {
        step: "Directory verification",
        dir: dirPath,
        state: "Checking",
      });
      await assertDirectoryExists(dirPath);
      logger.debug("Directory verified", {
        step: "Directory verification",
        dir: dirPath,
        state: "Complete",
      });
    }
  },
});

// Group 3: Normal Pattern - Custom Configuration
Deno.test({
  name: "working_dir - normal pattern - custom configuration",
  async fn() {
    const customWorkingDir = "./tmp/test/custom-config";
    logger.debug("Testing custom configuration", {
      purpose: "Verify custom working directory",
      step: "Normal pattern",
      state: "Starting",
      customWorkingDir,
    });

    // Create config directory and file
    const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configPath, { recursive: true });
    const configFile = join(configPath, "app.yml");
    await Deno.writeTextFile(
      configFile,
      `
working_dir: ${customWorkingDir}/.agent/breakdown
app_prompt:
  base_dir: custom/prompts
app_schema:
  base_dir: custom/schema
`,
    );

    const config = new BreakdownConfig(TEST_ENV.workingDir);
    await config.loadConfig();
    const settings = await config.getConfig();

    logger.debug("Configuration loaded", {
      step: "Verification",
      actualWorkingDir: settings.working_dir,
      expectedDir: `${customWorkingDir}/.agent/breakdown`,
    });
    assertEquals(settings.working_dir, `${customWorkingDir}/.agent/breakdown`);
  },
});

// Group 4: Edge Cases - Invalid Configuration
Deno.test({
  name: "working_dir - edge cases - invalid configuration",
  async fn() {
    logger.debug("Testing invalid configurations", {
      purpose: "Verify error handling",
      step: "Edge cases",
      state: "Starting",
    });

    // Test non-existent path
    logger.debug("Testing non-existent path", {
      step: "Error handling",
      path: "/non/existent/path",
      state: "Starting",
    });

    await assertRejects(
      async () => {
        const config = new BreakdownConfig("/non/existent/path");
        await config.loadConfig();
      },
      Error,
      "ERR1001: Application configuration file not found",
    );

    logger.debug("Non-existent path test complete", {
      step: "Error handling",
      state: "Complete",
    });

    // Test file path instead of directory
    logger.debug("Testing file path", {
      step: "Error handling",
      file: "/tmp/test/config-working-dir/test.txt",
      state: "Starting",
    });

    const testFile = join(TEST_ENV.workingDir, "test.txt");
    await Deno.writeTextFile(testFile, "test");

    await assertRejects(
      async () => {
        const config = new BreakdownConfig(testFile);
        await config.loadConfig();
      },
      Error,
      "Not a directory",
    );

    // Also test with a file that exists in the config path
    const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configPath, { recursive: true });
    const invalidConfigFile = join(configPath, "invalid.txt");
    await Deno.writeTextFile(invalidConfigFile, "test");

    await assertRejects(
      async () => {
        const config = new BreakdownConfig(invalidConfigFile);
        await config.loadConfig();
      },
      Error,
      "Not a directory",
    );

    logger.debug("File path test complete", {
      step: "Error handling",
      state: "Complete",
    });
  },
});
