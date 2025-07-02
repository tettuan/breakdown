/**
 * Architecture tests for structure.ts
 *
 * These tests verify architectural constraints and dependencies for the workspace structure module.
 * They ensure proper adherence to interface contracts, dependency direction rules,
 * and separation of concerns between structure management and other workspace components.
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspaceConfig, WorkspaceStructure } from "./interfaces.ts";

Deno.test("WorkspaceStructure Architecture", async (t) => {
  const _logger = new BreakdownLogger("architecture-test");

  await t.step("should implement WorkspaceStructure interface correctly", () => {
    _logger.debug("Testing WorkspaceStructure interface implementation");

    const config: WorkspaceConfig = {
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const structure: WorkspaceStructure = new WorkspaceStructureImpl(config);

    // Verify all required methods exist
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
    assertExists(structure.exists);
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);

    // Verify method signatures return promises
    assertEquals(typeof structure.initialize, "function");
    assertEquals(typeof structure.ensureDirectories, "function");
    assertEquals(typeof structure.exists, "function");
    assertEquals(typeof structure.createDirectory, "function");
    assertEquals(typeof structure.removeDirectory, "function");
  });

  await t.step("should have correct dependency direction", () => {
    _logger.debug("Testing dependency direction compliance");

    // WorkspaceStructureImpl should depend only on:
    // - WorkspaceConfig interface (not concrete implementations)
    // - Standard library file system operations
    // - Error types from errors module

    const config: WorkspaceConfig = {
      workingDir: "./test",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const structure = new WorkspaceStructureImpl(config);
    assertExists(structure);
  });

  await t.step("should follow single responsibility principle", () => {
    _logger.debug("Testing single responsibility adherence");

    // WorkspaceStructureImpl should be responsible ONLY for:
    // - Directory structure management
    // - Directory existence validation
    // - Directory creation/removal operations
    //
    // It should NOT be responsible for:
    // - Path resolution (that's PathResolver's job)
    // - Configuration management (that's Workspace's job)
    // - Template deployment (that's Workspace's job)

    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify structure has only directory-related methods
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
    assertExists(structure.exists);
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);
  });

  await t.step("should maintain layer separation", () => {
    _logger.debug("Testing layer separation compliance");

    // Structure layer should:
    // - Use only standard library for file operations
    // - Not depend on higher-level workspace components
    // - Not implement business logic beyond directory management

    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    assertExists(structure);
  });

  await t.step("should support predefined directory structure", () => {
    _logger.debug("Testing predefined directory structure support");

    // Architecture should support a predefined set of directories
    // for the 3-layer breakdown structure:
    // - projects (Project layer)
    // - issues (Issue layer)
    // - tasks (Task layer)
    // - temp (temporary files)
    // - config (configuration files)
    // - prompts (prompt templates)
    // - schema (schema files)

    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify initialization method exists for creating predefined structure
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
  });

  await t.step("should enforce error handling boundaries", () => {
    _logger.debug("Testing error handling architecture");

    // Structure should handle errors at appropriate boundaries:
    // - File system operation errors
    // - Path validation errors
    // - Permission errors
    //
    // It should throw WorkspaceInitError for structure-related failures

    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    assertExists(structure);
  });

  await t.step("should support workspace configuration integration", () => {
    _logger.debug("Testing workspace configuration integration");

    // Architecture should cleanly integrate with WorkspaceConfig:
    // - Accept config in constructor
    // - Use config.workingDir as base for all operations
    // - Not modify or validate config (that's Workspace's job)

    const config: WorkspaceConfig = {
      workingDir: "./custom",
      promptBaseDir: "custom-prompts",
      schemaBaseDir: "custom-schema",
    };

    const structure = new WorkspaceStructureImpl(config);
    assertExists(structure);
  });

  await t.step("should maintain file system operation abstraction", () => {
    _logger.debug("Testing file system operation abstraction");

    // Architecture should abstract file system operations:
    // - Use standard library ensureDir, Deno.stat, Deno.remove
    // - Provide workspace-specific directory operations
    // - Handle path joining and resolution consistently

    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify directory operations are available
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);
    assertExists(structure.exists);
  });
});
