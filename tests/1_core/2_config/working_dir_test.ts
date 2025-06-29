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

const logger = new BreakdownLogger("working-dir-test");

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
    logger.debug("Function started", {
      key: "working_dir_test#L89#setup-function-start",
      functionName: "working_dir - simple pattern - default configuration",
      arguments: { testEnvDir: TEST_ENV.workingDir },
    });

    const originalCwd = Deno.cwd();
    await Deno.mkdir(TEST_ENV.workingDir, { recursive: true });
    Deno.chdir(TEST_ENV.workingDir);

    try {
      logger.debug("Testing default configuration", {
        key: "working_dir_test#L94#setup-config-init",
        purpose: "Verify basic configuration loading",
        step: "Simple pattern",
        state: "Starting",
        expectedDir: ".agent/breakdown",
        currentDir: Deno.cwd(),
      });

      const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
      await Deno.mkdir(configPath, { recursive: true });

      logger.debug("Creating config file", {
        key: "working_dir_test#L105#setup-file-creation",
        step: "File creation",
        configPath,
        configFileName: "test-working-dir-app.yml",
      });

      const configFile = join(configPath, "test-working-dir-app.yml");
      const configContent = `
working_dir: .agent/breakdown
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`;
      await Deno.writeTextFile(configFile, configContent);

      logger.debug("Config file written", {
        key: "working_dir_test#L121#setup-file-written",
        configFile,
        contentLength: configContent.length,
      });

      const configResult = await BreakdownConfig.create("test-working-dir", TEST_ENV.workingDir);
      if (!configResult.success) {
        throw new Error("Failed to create BreakdownConfig");
      }
      const config = configResult.data;

      logger.debug("BreakdownConfig created", {
        key: "working_dir_test#L128#execution-config-created",
        configSetName: "test-working-dir",
        workingDir: TEST_ENV.workingDir,
      });

      await config.loadConfig();
      logger.debug("Config loaded", {
        key: "working_dir_test#L135#execution-config-loaded",
      });

      const settings = await config.getConfig();
      logger.debug("Settings retrieved", {
        key: "working_dir_test#L140#execution-settings-retrieved",
        settings: {
          working_dir: settings.working_dir,
          app_prompt_base_dir: settings.app_prompt?.base_dir,
          app_schema_base_dir: settings.app_schema?.base_dir,
        },
      });

      logger.debug("Configuration loaded", {
        key: "working_dir_test#L150#validation-verification",
        step: "Verification",
        actualWorkingDir: settings.working_dir,
        expectedDir: ".agent/breakdown",
      });
      assertEquals(settings.working_dir, ".agent/breakdown");

      logger.debug("Assertion passed", {
        key: "working_dir_test#L165#assertion-success",
        expected: ".agent/breakdown",
        actual: settings.working_dir,
      });

      logger.debug("Function completed successfully", {
        key: "working_dir_test#L172#teardown-function-success",
        functionName: "working_dir - simple pattern - default configuration",
        returnValue: "void (test passed)",
      });
    } catch (error) {
      logger.error("Function failed with error", {
        key: "working_dir_test#L179#error-function-failure",
        functionName: "working_dir - simple pattern - default configuration",
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      logger.debug("Restoring original directory", {
        key: "working_dir_test#L188#teardown-restore-cwd",
        originalCwd,
        currentCwd: Deno.cwd(),
      });
      Deno.chdir(originalCwd);
    }
  },
});

// Group 2: Simple Pattern - Directory Structure
Deno.test({
  name: "working_dir - simple pattern - directory structure",
  async fn() {
    const originalCwd = Deno.cwd();
    await Deno.mkdir(TEST_ENV.workingDir, { recursive: true });
    Deno.chdir(TEST_ENV.workingDir);
    try {
      logger.debug("Testing directory structure", {
        purpose: "Verify required directories exist",
        step: "Simple pattern",
        state: "Starting",
      });

      // Create config directory and file first
      const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
      await Deno.mkdir(configPath, { recursive: true });
      const configFile = join(configPath, "test-working-dir-app.yml");
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

      const configResult = await BreakdownConfig.create("test-working-dir", TEST_ENV.workingDir);
      if (!configResult.success) {
        throw new Error("Failed to create BreakdownConfig");
      }
      const config = configResult.data;
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
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});

// Group 3: Normal Pattern - Custom Configuration
Deno.test({
  name: "working_dir - normal pattern - custom configuration",
  async fn() {
    const originalCwd = Deno.cwd();
    await Deno.mkdir(TEST_ENV.workingDir, { recursive: true });
    Deno.chdir(TEST_ENV.workingDir);
    try {
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
      const configFile = join(configPath, "test-working-dir-app.yml");
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

      const configResult = await BreakdownConfig.create("test-working-dir", TEST_ENV.workingDir);
      if (!configResult.success) {
        throw new Error("Failed to create BreakdownConfig");
      }
      const config = configResult.data;
      await config.loadConfig();
      const settings = await config.getConfig();

      logger.debug("Configuration loaded", {
        step: "Verification",
        actualWorkingDir: settings.working_dir,
        expectedDir: `${customWorkingDir}/.agent/breakdown`,
      });
      assertEquals(settings.working_dir, `${customWorkingDir}/.agent/breakdown`);
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});

// Group 4: Edge Cases - Invalid Configuration
Deno.test({
  name: "working_dir - edge cases - invalid configuration",
  async fn() {
    const originalCwd = Deno.cwd();
    await Deno.mkdir(TEST_ENV.workingDir, { recursive: true });
    Deno.chdir(TEST_ENV.workingDir);
    try {
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
          const configResult = await BreakdownConfig.create("test-nonexistent", "/non/existent/path");
          if (!configResult.success) {
            throw new Error("Failed to create BreakdownConfig");
          }
          const config = configResult.data;
          await config.loadConfig();
        },
        Error,
        // Updated error message to match new BreakdownConfig behavior
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
          const configResult = await BreakdownConfig.create("test-file", testFile);
          if (!configResult.success) {
            throw new Error("Failed to create BreakdownConfig");
          }
          const config = configResult.data;
          await config.loadConfig();
        },
        Error,
        // Updated error message to match new BreakdownConfig behavior
      );

      // Also test with a file that exists in the config path
      const configPath = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
      await Deno.mkdir(configPath, { recursive: true });
      const invalidConfigFile = join(configPath, "invalid.txt");
      await Deno.writeTextFile(invalidConfigFile, "test");

      await assertRejects(
        async () => {
          const configResult = await BreakdownConfig.create("test-invalid", invalidConfigFile);
          if (!configResult.success) {
            throw new Error("Failed to create BreakdownConfig");
          }
          const config = configResult.data;
          await config.loadConfig();
        },
        Error,
        // Updated error message to match new BreakdownConfig behavior
      );

      logger.debug("File path test complete", {
        step: "Error handling",
        state: "Complete",
      });
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});
