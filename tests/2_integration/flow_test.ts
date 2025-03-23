import { assertEquals } from "$std/testing/asserts.ts";
import { Config } from "@tettuan/breakdownconfig";
import { Workspace } from "@tettuan/breakdownworkspace";
import { setupTestEnvironment, cleanupTestEnvironment, runCommand } from "../helpers/setup.ts";
import { assertValidConfig, assertDirectoryExists, assertCommandOutput } from "../helpers/assertions.ts";

/**
 * Integration tests for the breakdown workflow
 * These tests verify the interaction between different components
 * and ensure they work together correctly.
 */

const TEST_ENV = await setupTestEnvironment({
  workingDir: ".agent/breakdown"
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test basic initialization flow
Deno.test("breakdown init creates correct directory structure", async () => {
  // Run init command
  const result = await runCommand(["run", "-A", "cli.ts", "init"]);
  
  // Verify command output
  assertCommandOutput(result, {
    error: "",
  });
  
  // Verify directory structure
  await assertDirectoryExists(TEST_ENV.workingDir);
  
  // Verify config is valid
  const config = new Config(TEST_ENV.workingDir);
  assertValidConfig(await config.load());
});

// Test config and workspace integration
Deno.test("config and workspace integration", async () => {
  const config = new Config(TEST_ENV.workingDir);
  const workspace = new Workspace(config);
  
  // Verify workspace initialization with config
  await workspace.initialize();
  
  // Verify workspace directories
  await assertDirectoryExists(workspace.getPromptDir());
  await assertDirectoryExists(workspace.getSchemaDir());
  
  // Verify workspace can load config
  const loadedConfig = await workspace.getConfig();
  assertValidConfig(loadedConfig);
});

// Test error propagation
Deno.test("error propagation in workflow", async () => {
  // Test with invalid config
  const result = await runCommand([
    "run", "-A", "cli.ts",
    "--config", "nonexistent.yml",
    "init"
  ]);
  
  assertCommandOutput(result, {
    error: "Error: Config file not found",
  });
}); 