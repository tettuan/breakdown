/**
 * Unit tests for structure.ts
 * 
 * These tests verify individual method functionality, error handling scenarios,
 * edge cases, and boundary conditions for the workspace structure module.
 */

import { assertEquals, assertRejects, assertExists } from "@std/assert";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspaceInitError } from "./errors.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { join } from "@std/path";
import { exists } from "@std/fs";

Deno.test("WorkspaceStructure Unit Tests", async (t) => {
  const logger = new BreakdownLogger("unit-test");
  
  await t.step("Initialization Tests", async (t) => {
    
    await t.step("should initialize workspace structure successfully", async () => {
      logger.debug("Testing successful structure initialization");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.initialize();
        
        // Verify all predefined directories were created
        const expectedDirs = [
          ".agent/breakdown/projects",
          ".agent/breakdown/issues", 
          ".agent/breakdown/tasks",
          ".agent/breakdown/temp",
          ".agent/breakdown/config",
          ".agent/breakdown/prompts",
          ".agent/breakdown/schema"
        ];
        
        for (const dir of expectedDirs) {
          const dirPath = join(tempDir, dir);
          const dirExists = await exists(dirPath);
          assertEquals(dirExists, true, `Directory ${dir} should exist`);
        }
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle existing directories gracefully", async () => {
      logger.debug("Testing existing directory handling");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts", 
        schemaBaseDir: "schema",
      });
      
      try {
        // Create some directories first
        const preExistingDir = join(tempDir, ".agent", "breakdown", "projects");
        await Deno.mkdir(preExistingDir, { recursive: true });
        
        // Initialize should succeed even with existing directories
        await structure.initialize();
        
        // Verify directory still exists
        const dirExists = await exists(preExistingDir);
        assertEquals(dirExists, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should fail when path exists but is not a directory", async () => {
      logger.debug("Testing file blocking directory creation");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Create a file where a directory should be
        const conflictPath = join(tempDir, ".agent", "breakdown", "projects");
        await Deno.mkdir(join(tempDir, ".agent", "breakdown"), { recursive: true });
        await Deno.writeTextFile(conflictPath, "blocking file");
        
        // Should throw WorkspaceInitError
        await assertRejects(
          () => structure.initialize(),
          WorkspaceInitError,
          "Path exists but is not a directory"
        );
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Directory Operations Tests", async (t) => {
    
    await t.step("should create directories correctly", async () => {
      logger.debug("Testing directory creation");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.createDirectory("test/nested/path");
        
        const createdPath = join(tempDir, "test", "nested", "path");
        const dirExists = await exists(createdPath);
        assertEquals(dirExists, true);
        
        // Verify it's actually a directory
        const stat = await Deno.stat(createdPath);
        assertEquals(stat.isDirectory, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should create parent directories automatically", async () => {
      logger.debug("Testing parent directory creation");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.createDirectory("level1/level2/level3/level4");
        
        // Verify all parent directories were created
        const paths = [
          join(tempDir, "level1"),
          join(tempDir, "level1", "level2"),
          join(tempDir, "level1", "level2", "level3"),
          join(tempDir, "level1", "level2", "level3", "level4")
        ];
        
        for (const path of paths) {
          const dirExists = await exists(path);
          assertEquals(dirExists, true, `Path ${path} should exist`);
        }
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should remove directories correctly", async () => {
      logger.debug("Testing directory removal");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Create a directory with content
        const testDir = "test/directory";
        await structure.createDirectory(testDir);
        await structure.createDirectory(join(testDir, "subdirectory"));
        
        const filePath = join(tempDir, testDir, "test.txt");
        await Deno.writeTextFile(filePath, "test content");
        
        // Remove the directory
        await structure.removeDirectory(testDir);
        
        // Verify it was removed
        const dirExists = await exists(join(tempDir, testDir));
        assertEquals(dirExists, false);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle removal of non-existent directory", async () => {
      logger.debug("Testing removal of non-existent directory");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Should throw error when trying to remove non-existent directory
        await assertRejects(
          () => structure.removeDirectory("non/existent/directory"),
          Deno.errors.NotFound
        );
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Exists Check Tests", async (t) => {
    
    await t.step("should correctly identify existing paths", async () => {
      logger.debug("Testing exists check for existing paths");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.createDirectory("existing/directory");
        
        const exists1 = await structure.exists("existing");
        const exists2 = await structure.exists("existing/directory");
        
        assertEquals(exists1, true);
        assertEquals(exists2, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should correctly identify non-existent paths", async () => {
      logger.debug("Testing exists check for non-existent paths");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        const exists1 = await structure.exists("non/existent");
        const exists2 = await structure.exists("also/missing");
        
        assertEquals(exists1, false);
        assertEquals(exists2, false);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should check working directory when no path provided", async () => {
      logger.debug("Testing exists check with no path parameter");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Should check working directory itself
        const workingDirExists = await structure.exists();
        assertEquals(workingDirExists, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle files vs directories correctly", async () => {
      logger.debug("Testing exists check for files vs directories");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Create a file
        const filePath = join(tempDir, "test.txt");
        await Deno.writeTextFile(filePath, "test content");
        
        // Create a directory
        await structure.createDirectory("test/dir");
        
        // Both should be detected as existing
        const fileExists = await structure.exists("test.txt");
        const dirExists = await structure.exists("test/dir");
        
        assertEquals(fileExists, true);
        assertEquals(dirExists, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("EnsureDirectories Tests", async (t) => {
    
    await t.step("should ensure all predefined directories exist", async () => {
      logger.debug("Testing ensure directories functionality");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.ensureDirectories();
        
        // Verify all predefined directories exist
        const expectedDirs = [
          ".agent/breakdown/projects",
          ".agent/breakdown/issues",
          ".agent/breakdown/tasks", 
          ".agent/breakdown/temp",
          ".agent/breakdown/config",
          ".agent/breakdown/prompts",
          ".agent/breakdown/schema"
        ];
        
        for (const dir of expectedDirs) {
          const dirPath = join(tempDir, dir);
          const dirExists = await exists(dirPath);
          assertEquals(dirExists, true, `Directory ${dir} should exist`);
        }
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle partial existing structure", async () => {
      logger.debug("Testing ensure directories with partial existing structure");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Pre-create some directories
        await Deno.mkdir(join(tempDir, ".agent", "breakdown", "projects"), { recursive: true });
        await Deno.mkdir(join(tempDir, ".agent", "breakdown", "config"), { recursive: true });
        
        await structure.ensureDirectories();
        
        // All directories should exist after ensure
        const expectedDirs = [
          ".agent/breakdown/projects",
          ".agent/breakdown/issues",
          ".agent/breakdown/tasks",
          ".agent/breakdown/temp", 
          ".agent/breakdown/config",
          ".agent/breakdown/prompts",
          ".agent/breakdown/schema"
        ];
        
        for (const dir of expectedDirs) {
          const dirPath = join(tempDir, dir);
          const dirExists = await exists(dirPath);
          assertEquals(dirExists, true, `Directory ${dir} should exist`);
        }
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Edge Cases and Error Handling", async (t) => {
    
    await t.step("should handle special characters in working directory", async () => {
      logger.debug("Testing special characters in working directory");
      
      const tempDir = await Deno.makeTempDir();
      const specialDir = join(tempDir, "test with spaces & symbols");
      await Deno.mkdir(specialDir, { recursive: true });
      
      const structure = new WorkspaceStructureImpl({
        workingDir: specialDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        await structure.initialize();
        
        // Should handle special characters correctly
        const projectsDir = join(specialDir, ".agent", "breakdown", "projects");
        const dirExists = await exists(projectsDir);
        assertEquals(dirExists, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle very deep directory paths", async () => {
      logger.debug("Testing very deep directory paths");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        const deepPath = "very/deep/directory/structure/with/many/levels/and/more/levels";
        await structure.createDirectory(deepPath);
        
        const deepDirExists = await structure.exists(deepPath);
        assertEquals(deepDirExists, true);
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle empty path strings gracefully", async () => {
      logger.debug("Testing empty path string handling");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Empty path should not cause errors
        const emptyPathExists = await structure.exists("");
        assertEquals(typeof emptyPathExists, "boolean");
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle concurrent directory operations", async () => {
      logger.debug("Testing concurrent directory operations");
      
      const tempDir = await Deno.makeTempDir();
      const structure = new WorkspaceStructureImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      
      try {
        // Create multiple directories concurrently
        const operations = [];
        for (let i = 0; i < 5; i++) {
          operations.push(structure.createDirectory(`concurrent/test${i}`));
        }
        
        await Promise.all(operations);
        
        // Verify all directories were created
        for (let i = 0; i < 5; i++) {
          const dirExists = await structure.exists(`concurrent/test${i}`);
          assertEquals(dirExists, true, `Directory test${i} should exist`);
        }
        
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });
});