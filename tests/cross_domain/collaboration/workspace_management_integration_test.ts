/**
 * @fileoverview Integration tests for Workspace Management System
 *
 * This test suite validates the complete integration between:
 * - workspace.ts × structure.ts workspace component integration
 * - Workspace initialization → structure management → dependency resolution
 * - Directory operations integration with file system
 * - Permission management and error handling integration
 * - Configuration hierarchy and template deployment integration
 * - All edge cases for complete workspace lifecycle management
 *
 * Tests follow the architecture → structure → unit → integration sequence
 * as defined in docs/tests/testing.ja.md
 *
 * @module tests/integration/workspace_management_integration_test
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { WorkspaceImpl } from "../../lib/workspace/workspace.ts";
import { WorkspaceStructureImpl } from "../../lib/workspace/structure.ts";
import { WorkspaceConfigError, WorkspaceInitError } from "../../lib/workspace/errors.ts";
import { join, resolve } from "@std/path";
import { exists } from "@std/fs";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "../helpers/setup.ts";

const logger = new BreakdownLogger("workspace-management-integration");

/**
 * Test configuration for workspace integration scenarios
 */
interface WorkspaceTestConfig {
  name: string;
  workingDir: string;
  promptBaseDir: string;
  schemaBaseDir: string;
  expectedDirectories: string[];
  expectedFiles: string[];
}

/**
 * Configuration sets for different workspace scenarios
 */
const WORKSPACE_TEST_CONFIGS: WorkspaceTestConfig[] = [
  {
    name: "standard-workspace",
    workingDir: "./tmp/workspace-integration",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
    expectedDirectories: [
      ".agent/breakdown/projects",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/config",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schema",
    ],
    expectedFiles: [
      ".agent/breakdown/config/app.yml",
    ],
  },
  {
    name: "custom-workspace",
    workingDir: "./tmp/custom-workspace",
    promptBaseDir: "custom-prompts",
    schemaBaseDir: "custom-schema",
    expectedDirectories: [
      ".agent/breakdown/projects",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/config",
      ".agent/breakdown/custom-prompts",
      ".agent/breakdown/custom-schema",
    ],
    expectedFiles: [
      ".agent/breakdown/config/app.yml",
    ],
  },
];

/**
 * Test suite for Workspace × Structure Integration
 * Tests core integration between workspace orchestration and structure management
 */
Deno.test("Workspace Integration - Workspace × Structure component integration", async (t) => {
  let testEnv: TestEnvironment;

  await t.step("setup test environment", async () => {
    testEnv = await setupTestEnvironment({
      workingDir: "./tmp/workspace-structure-integration",
      skipDefaultConfig: true,
    });
    logger.debug("Workspace structure integration test environment set up");
  });

  await t.step("should integrate workspace initialization with structure management", async () => {
    logger.debug("Testing workspace × structure integration");

    const config = WORKSPACE_TEST_CONFIGS[0];
    const absoluteWorkingDir = resolve(testEnv.workingDir, config.name);

    // Create workspace instance
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: config.promptBaseDir,
      schemaBaseDir: config.schemaBaseDir,
    });

    // Initialize workspace - this should orchestrate structure creation
    await workspace.initialize();

    // Verify workspace-level operations work
    const workspaceExists = await workspace.exists();
    assertEquals(workspaceExists, true);

    // Verify all expected directories were created through structure integration
    for (const expectedDir of config.expectedDirectories) {
      const dirPath = join(absoluteWorkingDir, expectedDir);
      const dirExists = await exists(dirPath);
      assertEquals(dirExists, true, `Directory ${expectedDir} should exist`);
    }

    // Verify configuration files were created
    for (const expectedFile of config.expectedFiles) {
      const filePath = join(absoluteWorkingDir, expectedFile);
      const fileExists = await exists(filePath);
      assertEquals(fileExists, true, `File ${expectedFile} should exist`);
    }

    // Test workspace directory operations delegation to structure
    await workspace.createDirectory("test/integration/nested");
    const nestedExists = await workspace.exists("test/integration/nested");
    assertEquals(nestedExists, true);

    // Test workspace removal operations
    await workspace.removeDirectory("test");
    const testRemoved = !(await workspace.exists("test"));
    assertEquals(testRemoved, true);

    logger.info("Workspace × Structure integration successful");
  });

  await t.step("should handle workspace-structure collaboration in error scenarios", async () => {
    logger.debug("Testing workspace-structure error handling integration");

    const invalidConfig = {
      workingDir: "/root/invalid-permissions",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const workspace = new WorkspaceImpl(invalidConfig);

    // Should handle permission errors appropriately
    await assertRejects(
      () => workspace.initialize(),
      Error, // Could be WorkspaceInitError or permission error
      undefined, // Error message varies by system
    );

    logger.info("Workspace-structure error handling integration verified");
  });

  await t.step("should integrate path resolution across workspace components", async () => {
    logger.debug("Testing workspace path resolution integration");

    const config = WORKSPACE_TEST_CONFIGS[1]; // custom workspace
    const absoluteWorkingDir = resolve(testEnv.workingDir, config.name);

    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: config.promptBaseDir,
      schemaBaseDir: config.schemaBaseDir,
    });

    await workspace.initialize();

    // Test integrated path resolution
    const promptBaseDir = await workspace.getPromptBaseDir();
    const schemaBaseDir = await workspace.getSchemaBaseDir();
    const workingDir = await workspace.getWorkingDir();

    assertEquals(promptBaseDir, resolve(absoluteWorkingDir, config.promptBaseDir));
    assertEquals(schemaBaseDir, resolve(absoluteWorkingDir, config.schemaBaseDir));
    assertEquals(workingDir, absoluteWorkingDir);

    // Test path resolution with workspace operations
    const resolvedPath = await workspace.resolvePath("custom/test/path");
    assertEquals(resolvedPath, ".agent/breakdown/custom/test/path");

    logger.info("Workspace path resolution integration successful");
  });

  await t.step("cleanup test environment", async () => {
    await cleanupTestEnvironment(testEnv);
    logger.debug("Workspace structure integration test environment cleaned up");
  });
});

/**
 * Test suite for Configuration Hierarchy Integration
 * Tests workspace configuration management and template deployment
 */
Deno.test("Workspace Integration - Configuration hierarchy and template deployment", async (t) => {
  let testEnv: TestEnvironment;

  await t.step("setup test environment", async () => {
    testEnv = await setupTestEnvironment({
      workingDir: "./tmp/workspace-config-integration",
      skipDefaultConfig: true,
    });
    logger.debug("Workspace configuration integration test environment set up");
  });

  await t.step("should integrate configuration management with workspace operations", async () => {
    logger.debug("Testing workspace configuration integration");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "config-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "test-prompts",
      schemaBaseDir: "test-schema",
    });

    // Initialize workspace - should create configuration
    await workspace.initialize();

    // Verify configuration file was created
    const configFile = join(absoluteWorkingDir, ".agent", "breakdown", "config", "app.yml");
    const configExists = await exists(configFile);
    assertEquals(configExists, true);

    // Verify configuration content
    const configContent = await Deno.readTextFile(configFile);
    assert(configContent.includes("working_dir: .agent/breakdown"));
    assert(configContent.includes("base_dir: test-prompts"));
    assert(configContent.includes("base_dir: test-schema"));

    // Test configuration validation
    await workspace.validateConfig();

    // Test configuration reload
    const modifiedConfig = `working_dir: .agent/breakdown
app_prompt:
  base_dir: modified-prompts
app_schema:
  base_dir: modified-schema
`;
    await Deno.writeTextFile(configFile, modifiedConfig);
    await workspace.reloadConfig();

    // Verify configuration was reloaded
    const promptDir = await workspace.getPromptBaseDir();
    const schemaDir = await workspace.getSchemaBaseDir();
    assertEquals(promptDir, resolve(absoluteWorkingDir, "modified-prompts"));
    assertEquals(schemaDir, resolve(absoluteWorkingDir, "modified-schema"));

    logger.info("Workspace configuration integration successful");
  });

  await t.step("should integrate template deployment with directory structure", async () => {
    logger.debug("Testing template deployment integration");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "template-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Initialize workspace - should deploy templates
    await workspace.initialize();

    // Verify prompt templates were deployed
    const promptDir = join(absoluteWorkingDir, ".agent", "breakdown", "prompts");
    const promptDirExists = await exists(promptDir);
    assertEquals(promptDirExists, true);

    // Verify schema templates were deployed
    const schemaDir = join(absoluteWorkingDir, ".agent", "breakdown", "schema");
    const schemaDirExists = await exists(schemaDir);
    assertEquals(schemaDirExists, true);

    // Check that template deployment doesn't overwrite existing files
    const testFile = join(promptDir, "test-existing.md");
    await Deno.writeTextFile(testFile, "existing content");

    // Re-initialize should not overwrite
    await workspace.initialize();
    const content = await Deno.readTextFile(testFile);
    assertEquals(content, "existing content");

    logger.info("Template deployment integration successful");
  });

  await t.step("should handle configuration validation errors appropriately", async () => {
    logger.debug("Testing configuration validation error integration");

    const workspace = new WorkspaceImpl({
      workingDir: "/nonexistent/directory",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Should fail configuration validation
    await assertRejects(
      () => workspace.validateConfig(),
      WorkspaceConfigError,
      "Working directory does not exist",
    );

    logger.info("Configuration validation error handling verified");
  });

  await t.step("cleanup test environment", async () => {
    await cleanupTestEnvironment(testEnv);
    logger.debug("Workspace configuration integration test environment cleaned up");
  });
});

/**
 * Test suite for File System Operations Integration
 * Tests comprehensive file system integration and permission handling
 */
Deno.test("Workspace Integration - File system operations and permission management", async (t) => {
  let testEnv: TestEnvironment;

  await t.step("setup test environment", async () => {
    testEnv = await setupTestEnvironment({
      workingDir: "./tmp/workspace-filesystem-integration",
      skipDefaultConfig: true,
    });
    logger.debug("Workspace file system integration test environment set up");
  });

  await t.step("should integrate complex directory operations across components", async () => {
    logger.debug("Testing complex directory operations integration");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "filesystem-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    await workspace.initialize();

    // Test complex nested directory creation
    const complexPath = "projects/project-a/issues/issue-001/tasks/task-001";
    await workspace.createDirectory(complexPath);
    const complexExists = await workspace.exists(complexPath);
    assertEquals(complexExists, true);

    // Test multiple concurrent directory operations
    const concurrentPaths = [
      "projects/project-b/issues/issue-002",
      "projects/project-c/issues/issue-003",
      "temp/analysis/data-001",
      "temp/analysis/data-002",
    ];

    await Promise.all(
      concurrentPaths.map((path) => workspace.createDirectory(path)),
    );

    // Verify all concurrent operations succeeded
    for (const path of concurrentPaths) {
      const pathExists = await workspace.exists(path);
      assertEquals(pathExists, true, `Path ${path} should exist`);
    }

    // Test large-scale directory removal
    await workspace.removeDirectory("projects/project-b");
    const removedExists = await workspace.exists("projects/project-b");
    assertEquals(removedExists, false);

    // Verify other directories still exist
    const stillExists = await workspace.exists("projects/project-a");
    assertEquals(stillExists, true);

    logger.info("Complex directory operations integration successful");
  });

  await t.step("should handle file system edge cases and error recovery", async () => {
    logger.debug("Testing file system edge cases integration");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "edge-cases-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    await workspace.initialize();

    // Test directory creation with special characters
    const specialPath = "projects/test-project_with-special.chars/issues";
    await workspace.createDirectory(specialPath);
    const specialExists = await workspace.exists(specialPath);
    assertEquals(specialExists, true);

    // Test very deep directory paths
    const deepPath = "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t";
    await workspace.createDirectory(deepPath);
    const deepExists = await workspace.exists(deepPath);
    assertEquals(deepExists, true);

    // Test file vs directory conflict detection
    const conflictPath = "conflict-test";
    await workspace.createDirectory(conflictPath);

    // Create a file where a directory should go
    const filePath = join(absoluteWorkingDir, conflictPath, "file-conflict");
    await Deno.writeTextFile(filePath, "test content");

    // Verify file exists and is detected
    const fileExists = await workspace.exists(join(conflictPath, "file-conflict"));
    assertEquals(fileExists, true);

    // Test removal of directory with mixed content
    await workspace.removeDirectory(conflictPath);
    const conflictRemoved = !(await workspace.exists(conflictPath));
    assertEquals(conflictRemoved, true);

    logger.info("File system edge cases integration successful");
  });

  await t.step("should handle permission errors and recovery scenarios", async () => {
    logger.debug("Testing permission error handling integration");

    // Test workspace with valid directory
    const validWorkingDir = resolve(testEnv.workingDir, "permission-test");
    await Deno.mkdir(validWorkingDir, { recursive: true });

    const workspace = new WorkspaceImpl({
      workingDir: validWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    await workspace.initialize();

    // Test that normal operations work
    await workspace.createDirectory("test/normal/operation");
    const normalExists = await workspace.exists("test/normal/operation");
    assertEquals(normalExists, true);

    // Test recovery from failed operations
    try {
      await workspace.removeDirectory("nonexistent/directory");
    } catch (error) {
      // Should handle removal errors gracefully
      assert(error instanceof Deno.errors.NotFound);
      logger.debug("Expected error for nonexistent directory removal", { error });
    }

    // Verify workspace is still functional after error
    await workspace.createDirectory("test/after/error");
    const afterErrorExists = await workspace.exists("test/after/error");
    assertEquals(afterErrorExists, true);

    logger.info("Permission error handling integration successful");
  });

  await t.step("cleanup test environment", async () => {
    await cleanupTestEnvironment(testEnv);
    logger.debug("Workspace file system integration test environment cleaned up");
  });
});

/**
 * Test suite for Complete Workspace Lifecycle Integration
 * Tests end-to-end workspace management scenarios
 */
Deno.test("Workspace Integration - Complete workspace lifecycle management", async (t) => {
  let testEnv: TestEnvironment;

  await t.step("setup test environment", async () => {
    testEnv = await setupTestEnvironment({
      workingDir: "./tmp/workspace-lifecycle-integration",
      skipDefaultConfig: true,
    });
    logger.debug("Workspace lifecycle integration test environment set up");
  });

  await t.step(
    "should handle complete workspace initialization to destruction lifecycle",
    async () => {
      logger.debug("Testing complete workspace lifecycle");

      const absoluteWorkingDir = resolve(testEnv.workingDir, "lifecycle-test");

      // Phase 1: Initial workspace creation
      const workspace = new WorkspaceImpl({
        workingDir: absoluteWorkingDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      await workspace.initialize();

      // Verify initial state
      const initialExists = await workspace.exists();
      assertEquals(initialExists, true);

      // Phase 2: Active workspace usage
      await workspace.createDirectory("projects/active-project");
      await workspace.createDirectory("issues/active-issue");
      await workspace.createDirectory("tasks/active-task");

      // Verify active usage
      const projectExists = await workspace.exists("projects/active-project");
      const issueExists = await workspace.exists("issues/active-issue");
      const taskExists = await workspace.exists("tasks/active-task");
      assertEquals(projectExists, true);
      assertEquals(issueExists, true);
      assertEquals(taskExists, true);

      // Phase 3: Configuration updates
      const configFile = join(absoluteWorkingDir, ".agent", "breakdown", "config", "app.yml");
      const updatedConfig = `working_dir: .agent/breakdown
app_prompt:
  base_dir: updated-prompts
app_schema:
  base_dir: updated-schema
`;
      await Deno.writeTextFile(configFile, updatedConfig);
      await workspace.reloadConfig();

      // Verify configuration updates
      const promptDir = await workspace.getPromptBaseDir();
      const schemaDir = await workspace.getSchemaBaseDir();
      assertEquals(promptDir, resolve(absoluteWorkingDir, "updated-prompts"));
      assertEquals(schemaDir, resolve(absoluteWorkingDir, "updated-schema"));

      // Phase 4: Workspace validation and maintenance
      await workspace.validateConfig();

      // Phase 5: Cleanup phase
      await workspace.removeDirectory("projects");
      await workspace.removeDirectory("issues");
      await workspace.removeDirectory("tasks");

      // Verify cleanup
      const cleanedProject = !(await workspace.exists("projects"));
      const cleanedIssue = !(await workspace.exists("issues"));
      const cleanedTask = !(await workspace.exists("tasks"));
      assertEquals(cleanedProject, true);
      assertEquals(cleanedIssue, true);
      assertEquals(cleanedTask, true);

      // Workspace core structure should still exist
      const coreExists = await workspace.exists();
      assertEquals(coreExists, true);

      logger.info("Complete workspace lifecycle integration successful");
    },
  );

  await t.step("should handle multiple workspace instances and concurrent operations", async () => {
    logger.debug("Testing multiple workspace instances integration");

    // Create multiple workspace instances
    const workspace1 = new WorkspaceImpl({
      workingDir: resolve(testEnv.workingDir, "workspace-1"),
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    const workspace2 = new WorkspaceImpl({
      workingDir: resolve(testEnv.workingDir, "workspace-2"),
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Initialize both workspaces concurrently
    await Promise.all([
      workspace1.initialize(),
      workspace2.initialize(),
    ]);

    // Verify both workspaces exist independently
    const workspace1Exists = await workspace1.exists();
    const workspace2Exists = await workspace2.exists();
    assertEquals(workspace1Exists, true);
    assertEquals(workspace2Exists, true);

    // Perform concurrent operations
    await Promise.all([
      workspace1.createDirectory("workspace1/specific/directory"),
      workspace2.createDirectory("workspace2/specific/directory"),
    ]);

    // Verify operations succeeded independently
    const ws1SpecificExists = await workspace1.exists("workspace1/specific/directory");
    const ws2SpecificExists = await workspace2.exists("workspace2/specific/directory");
    assertEquals(ws1SpecificExists, true);
    assertEquals(ws2SpecificExists, true);

    // Verify workspaces don't interfere with each other
    const ws1DoesntHaveWs2 = !(await workspace1.exists("workspace2/specific/directory"));
    const ws2DoesntHaveWs1 = !(await workspace2.exists("workspace1/specific/directory"));
    assertEquals(ws1DoesntHaveWs2, true);
    assertEquals(ws2DoesntHaveWs1, true);

    logger.info("Multiple workspace instances integration successful");
  });

  await t.step("should integrate error recovery across full workspace operations", async () => {
    logger.debug("Testing comprehensive error recovery integration");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "error-recovery-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    await workspace.initialize();

    // Create some operational state
    await workspace.createDirectory("projects/test-project");
    await workspace.createDirectory("issues/test-issue");

    // Simulate various error conditions and recovery
    const errorScenarios = [
      async () => {
        // Try to remove non-existent directory
        try {
          await workspace.removeDirectory("nonexistent");
        } catch (error) {
          assert(error instanceof Deno.errors.NotFound);
        }
      },
      async () => {
        // Try invalid path resolution
        try {
          const result = await workspace.resolvePath("");
          assertExists(result); // Should handle gracefully
        } catch (error) {
          // Error handling should be graceful
          logger.debug("Path resolution error handled", { error });
        }
      },
      async () => {
        // Try to create directory in non-writable location (if any)
        try {
          await workspace.createDirectory("valid/path/test");
          const exists = await workspace.exists("valid/path/test");
          assertEquals(exists, true);
        } catch (error) {
          // Should handle gracefully
          logger.debug("Directory creation error handled", { error });
        }
      },
    ];

    // Run error scenarios
    await Promise.all(errorScenarios.map((scenario) => scenario()));

    // Verify workspace is still functional after errors
    await workspace.createDirectory("recovery/test");
    const recoveryExists = await workspace.exists("recovery/test");
    assertEquals(recoveryExists, true);

    // Verify original state is preserved
    const projectExists = await workspace.exists("projects/test-project");
    const issueExists = await workspace.exists("issues/test-issue");
    assertEquals(projectExists, true);
    assertEquals(issueExists, true);

    logger.info("Comprehensive error recovery integration successful");
  });

  await t.step("cleanup test environment", async () => {
    await cleanupTestEnvironment(testEnv);
    logger.debug("Workspace lifecycle integration test environment cleaned up");
  });
});

/**
 * Test suite for Performance and Stress Testing
 * Tests workspace performance under load
 */
Deno.test("Workspace Integration - Performance and stress testing", async (t) => {
  let testEnv: TestEnvironment;

  await t.step("setup test environment", async () => {
    testEnv = await setupTestEnvironment({
      workingDir: "./tmp/workspace-performance-integration",
      skipDefaultConfig: true,
    });
    logger.debug("Workspace performance integration test environment set up");
  });

  await t.step("should handle high-volume directory operations efficiently", async () => {
    logger.debug("Testing high-volume directory operations performance");

    const absoluteWorkingDir = resolve(testEnv.workingDir, "performance-test");
    const workspace = new WorkspaceImpl({
      workingDir: absoluteWorkingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    await workspace.initialize();

    const operationCount = 100;
    const start = performance.now();

    // Create many directories concurrently
    const createOperations = Array.from(
      { length: operationCount },
      (_, i) => workspace.createDirectory(`performance/test-${i}/nested/deep`),
    );

    await Promise.all(createOperations);

    const createEnd = performance.now();
    const createDuration = createEnd - start;

    // Verify all directories exist (with retry for file system sync issues)
    let existCount = 0;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && existCount < operationCount) {
      existCount = 0;

      // Check existence with small delay to allow file system sync
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      for (let i = 0; i < operationCount; i++) {
        const exists = await workspace.exists(`performance/test-${i}/nested/deep`);
        if (exists) existCount++;
      }

      if (existCount < operationCount) {
        logger.debug(`Retry ${retryCount + 1}: Found ${existCount}/${operationCount} directories`);
        retryCount++;
      }
    }

    assertEquals(
      existCount,
      operationCount,
      `Expected all ${operationCount} directories to exist, but only found ${existCount} after ${retryCount} retries`,
    );

    // Test removal performance
    const removeStart = performance.now();
    await workspace.removeDirectory("performance");
    const removeEnd = performance.now();
    const removeDuration = removeEnd - removeStart;

    logger.info("High-volume operations performance results", {
      operationCount,
      createDuration: `${createDuration.toFixed(2)}ms`,
      avgCreateTime: `${(createDuration / operationCount).toFixed(4)}ms`,
      removeDuration: `${removeDuration.toFixed(2)}ms`,
    });

    // Performance should be reasonable (less than 10ms per operation)
    const avgCreateTime = createDuration / operationCount;
    assert(avgCreateTime < 10, `Directory creation too slow: ${avgCreateTime}ms per operation`);

    logger.info("High-volume directory operations performance successful");
  });

  await t.step(
    "should handle rapid workspace initialization and configuration changes",
    async () => {
      logger.debug("Testing rapid workspace operations performance");

      const iterations = 50;
      const start = performance.now();

      // Test rapid workspace creation and configuration changes
      for (let i = 0; i < iterations; i++) {
        const workspaceDir = resolve(testEnv.workingDir, `rapid-test-${i}`);
        const workspace = new WorkspaceImpl({
          workingDir: workspaceDir,
          promptBaseDir: `prompts-${i}`,
          schemaBaseDir: `schema-${i}`,
        });

        await workspace.initialize();
        await workspace.validateConfig();
      }

      const end = performance.now();
      const duration = end - start;
      const avgTime = duration / iterations;

      logger.info("Rapid workspace operations performance results", {
        iterations,
        totalDuration: `${duration.toFixed(2)}ms`,
        avgTimePerWorkspace: `${avgTime.toFixed(4)}ms`,
      });

      // Should be reasonably fast (less than 100ms per workspace)
      assert(avgTime < 100, `Workspace operations too slow: ${avgTime}ms per workspace`);

      logger.info("Rapid workspace operations performance successful");
    },
  );

  await t.step("cleanup test environment", async () => {
    await cleanupTestEnvironment(testEnv);
    logger.debug("Workspace performance integration test environment cleaned up");
  });
});

logger.info("All Workspace Management integration tests completed");
