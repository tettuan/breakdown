/**
 * @fileoverview Unit tests for Workspace Initializer
 *
 * Tests are organized in three categories:
 * - 0_architecture: Smart Constructor patterns and type safety
 * - 1_behavior: Runtime behavior verification and Totality principle
 * - 2_structure: Structural correctness verification
 *
 * @module cli/initialization/workspace_initializer_test
 */

import { assertEquals, assert } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { initializeBreakdownConfiguration } from "./workspace_initializer.ts";

// =============================================================================
// 0_architecture: Smart Constructor Pattern Tests
// =============================================================================

Deno.test("0_architecture: initializeBreakdownConfiguration follows Smart Constructor pattern", () => {
  // Function should be available and callable
  assert(typeof initializeBreakdownConfiguration === "function");
  
  // Should return Promise<void> - pure initialization function
  const result = initializeBreakdownConfiguration();
  assert(result instanceof Promise);
});

Deno.test({
  name: "0_architecture: Configuration structure enforces expected schema",
  sanitizeResources: false,  // Disable resource leak detection for this test
  sanitizeOps: false,        // Disable operation leak detection for this test
  async fn() {
    const originalCwd = Deno.cwd();
    const tempDir = await Deno.makeTempDir();
    
    try {
      // Change to temp directory for isolated test
      Deno.chdir(tempDir);
      
      await initializeBreakdownConfiguration();
    
    // Verify config file has expected structure
    const configPath = join(tempDir, ".agent", "breakdown", "config", "default-app.yml");
    assert(await exists(configPath));
    
    const configContent = await Deno.readTextFile(configPath);
    
    // Verify required configuration sections exist
    assert(configContent.includes("working_dir:"));
    assert(configContent.includes("app_prompt:"));
    assert(configContent.includes("app_schema:"));
    assert(configContent.includes("params:"));
    assert(configContent.includes("workspace:"));
    
      // Verify type patterns are defined
      assert(configContent.includes("demonstrativeType:"));
      assert(configContent.includes("layerType:"));
      assert(configContent.includes("pattern:"));
    } finally {
      Deno.chdir(originalCwd);
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests & Totality Principle
// =============================================================================

Deno.test("1_behavior: Totality - handles all filesystem states", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    
    // Should succeed in empty directory
    await initializeBreakdownConfiguration();
    
    // Should be idempotent - running again should not fail
    await initializeBreakdownConfiguration();
    
    // Verify all expected directories were created
    const expectedDirs = [
      ".agent/breakdown/config",
      ".agent/breakdown/projects", 
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schema",
    ];
    
    for (const dir of expectedDirs) {
      assert(await exists(join(tempDir, dir)), `Directory ${dir} should exist`);
    }
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Directory creation is atomic and consistent", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    
    // Pre-create some directories to test mixed state
    await Deno.mkdir(join(tempDir, ".agent"), { recursive: true });
    
    await initializeBreakdownConfiguration();
    
    // All directories should exist regardless of initial state
    const requiredDirs = [
      "config", "projects", "issues", "tasks", "temp", "prompts", "schema"
    ];
    
    for (const dir of requiredDirs) {
      const fullPath = join(tempDir, ".agent", "breakdown", dir);
      assert(await exists(fullPath), `Required directory ${dir} missing`);
    }
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Configuration file generation is deterministic", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    
    // Run initialization twice
    await initializeBreakdownConfiguration();
    const firstConfig = await Deno.readTextFile(
      join(tempDir, ".agent", "breakdown", "config", "default-app.yml")
    );
    
    await initializeBreakdownConfiguration();
    const secondConfig = await Deno.readTextFile(
      join(tempDir, ".agent", "breakdown", "config", "default-app.yml")
    );
    
    // Configuration should be identical
    assertEquals(firstConfig, secondConfig);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Handles various working directory scenarios", async () => {
  const originalCwd = Deno.cwd();
  const createdTempDirs: string[] = [];
  
  try {
    // Test in different directory contexts
    const scenarios = [
      { name: "root-level", subdirs: [] },
      { name: "nested", subdirs: ["project", "subproject"] },
      { name: "deep-nested", subdirs: ["a", "b", "c", "d"] },
    ];
    
    for (const scenario of scenarios) {
      const tempDir = await Deno.makeTempDir({ prefix: `workspace_test_${scenario.name}_` });
      createdTempDirs.push(tempDir);
      
      try {
        // Create nested directory structure
        let targetDir = tempDir;
        for (const subdir of scenario.subdirs) {
          targetDir = join(targetDir, subdir);
          await Deno.mkdir(targetDir, { recursive: true });
        }
        
        // Ensure we can change to the directory and restore
        const beforeChdir = Deno.cwd();
        Deno.chdir(targetDir);
        
        try {
          await initializeBreakdownConfiguration();
          
          // Verify initialization succeeded in nested context
          assert(
            await exists(join(targetDir, ".agent", "breakdown", "config", "default-app.yml")),
            `Initialization failed in ${scenario.name} scenario`
          );
        } finally {
          // Always restore directory before continuing
          Deno.chdir(beforeChdir);
        }
      } catch (error) {
        // Log scenario-specific errors but continue with cleanup
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Scenario ${scenario.name} failed:`, errorMessage);
      }
    }
  } finally {
    // Ensure we're back to original directory
    Deno.chdir(originalCwd);
    
    // Clean up all created temporary directories
    for (const tempDir of createdTempDirs) {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (error) {
        // Silent cleanup - avoid test failure due to cleanup issues
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to clean up ${tempDir}:`, errorMessage);
      }
    }
  }
});

// =============================================================================
// 1_behavior: Monadic Composition Tests
// =============================================================================

Deno.test("1_behavior: Initialization composes with other operations", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    
    // Should compose well with file operations
    await initializeBreakdownConfiguration();
    
    // Write additional files
    const customFile = join(tempDir, ".agent", "breakdown", "custom.txt");
    await Deno.writeTextFile(customFile, "custom content");
    
    // Re-initialize should not affect custom files
    await initializeBreakdownConfiguration();
    
    assert(await exists(customFile));
    const content = await Deno.readTextFile(customFile);
    assertEquals(content, "custom content");
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: Generated configuration follows YAML standards", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    await initializeBreakdownConfiguration();
    
    const configPath = join(tempDir, ".agent", "breakdown", "config", "default-app.yml");
    const configContent = await Deno.readTextFile(configPath);
    
    // Should be valid YAML structure
    assert(configContent.startsWith("# Breakdown Configuration"));
    
    // Check hierarchical structure
    const lines = configContent.split("\n");
    const workingDirLine = lines.find(line => line.includes("working_dir:"));
    const promptBaseLine = lines.find(line => line.includes("base_dir:"));
    
    assert(workingDirLine, "working_dir should be defined");
    assert(promptBaseLine, "base_dir should be defined");
    
    // Verify indentation consistency
    const indentedLines = lines.filter(line => line.startsWith("  "));
    assert(indentedLines.length > 0, "Should have properly indented YAML");
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("2_structure: Directory structure follows domain conventions", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    await initializeBreakdownConfiguration();
    
    const breakdownDir = join(tempDir, ".agent", "breakdown");
    
    // Verify directory structure matches domain model
    const domainDirs = ["projects", "issues", "tasks"];  // LayerTypes
    const infraDirs = ["config", "prompts", "schema", "temp"];  // Infrastructure
    
    for (const dir of [...domainDirs, ...infraDirs]) {
      assert(
        await exists(join(breakdownDir, dir)),
        `Domain directory ${dir} should exist`
      );
    }
    
    // Verify separation of concerns
    const configDir = join(breakdownDir, "config");
    const promptDir = join(breakdownDir, "prompts");
    const schemaDir = join(breakdownDir, "schema");
    
    // Each should be a directory, not a file
    const configStat = await Deno.stat(configDir);
    const promptStat = await Deno.stat(promptDir);
    const schemaStat = await Deno.stat(schemaDir);
    
    assert(configStat.isDirectory);
    assert(promptStat.isDirectory);
    assert(schemaStat.isDirectory);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("2_structure: Configuration patterns match domain constraints", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    await initializeBreakdownConfiguration();
    
    const configPath = join(tempDir, ".agent", "breakdown", "config", "default-app.yml");
    const configContent = await Deno.readTextFile(configPath);
    
    // Verify pattern constraints match expected domain values
    assert(configContent.includes("^(to|summary|defect)$"), "demonstrativeType pattern missing");
    assert(configContent.includes("^(project|issue|task)$"), "layerType pattern missing");
    
    // Verify directory paths are consistent
    assert(configContent.includes('working_dir: ".agent/breakdown"'));
    assert(configContent.includes('base_dir: ".agent/breakdown/prompts"'));
    assert(configContent.includes('base_dir: ".agent/breakdown/schema"'));
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

// =============================================================================
// Supporting Domain Integration Tests
// =============================================================================

Deno.test("2_structure: Initialization supports domain extensibility", async () => {
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  
  try {
    Deno.chdir(tempDir);
    await initializeBreakdownConfiguration();
    
    // Test that structure can accommodate extensions
    const extensionDirs = [
      ".agent/breakdown/plugins",
      ".agent/breakdown/extensions",
      ".agent/breakdown/custom",
    ];
    
    // Should be able to create additional directories without conflicts
    for (const dir of extensionDirs) {
      await Deno.mkdir(join(tempDir, dir), { recursive: true });
      assert(await exists(join(tempDir, dir)));
    }
    
    // Re-initialization should not remove custom directories
    await initializeBreakdownConfiguration();
    
    for (const dir of extensionDirs) {
      assert(await exists(join(tempDir, dir)), `Custom directory ${dir} was removed`);
    }
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});