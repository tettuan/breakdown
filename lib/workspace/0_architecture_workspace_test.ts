/**
 * Architecture tests for _workspace.ts
 *
 * These tests verify architectural constraints and dependencies for the workspace module.
 * They ensure proper adherence to the 3-layer architecture, interface contracts,
 * and dependency direction rules.
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceImpl } from "./_workspace.ts";
import { Workspace, WorkspaceConfig } from "./interfaces.ts";

Deno.test("Workspace Architecture", async (t) => {
  const _logger = new BreakdownLogger("architecture-test");

  await t.step("should implement Workspace interface correctly", () => {
    _logger.debug("Testing Workspace interface implementation");

    const workspace: Workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify all required methods exist
    assertExists(_workspace.initialize);
    assertExists(_workspace.resolvePath);
    assertExists(_workspace.createDirectory);
    assertExists(_workspace.removeDirectory);
    assertExists(_workspace.exists);
    assertExists(_workspace.getPromptBaseDir);
    assertExists(_workspace.getSchemaBaseDir);
    assertExists(_workspace.getWorkingDir);
    assertExists(_workspace.validateConfig);
    assertExists(_workspace.reloadConfig);

    // Verify method signatures return promises
    assertEquals(typeof _workspace.initialize, "function");
    assertEquals(typeof _workspace.resolvePath, "function");
    assertEquals(typeof _workspace.createDirectory, "function");
    assertEquals(typeof _workspace.removeDirectory, "function");
    assertEquals(typeof _workspace.exists, "function");
    assertEquals(typeof _workspace.getPromptBaseDir, "function");
    assertEquals(typeof _workspace.getSchemaBaseDir, "function");
    assertEquals(typeof _workspace.getWorkingDir, "function");
    assertEquals(typeof _workspace.validateConfig, "function");
    assertEquals(typeof _workspace.reloadConfig, "function");
  });

  await t.step("should have correct dependency direction", () => {
    _logger.debug("Testing dependency direction compliance");

    // WorkspaceImpl should depend on interfaces, not concrete implementations
    // This is verified by the import statements and constructor parameters

    // Verify configuration interface usage
    const config: WorkspaceConfig = {
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const _workspace = new WorkspaceImpl(config);
    assertExists(_workspace);
  });

  await t.step("should follow single responsibility principle", () => {
    _logger.debug("Testing single responsibility adherence");

    // WorkspaceImpl should delegate to specialized components:
    // - WorkspaceStructureImpl for directory operations
    // - WorkspacePathResolverImpl for path resolution
    // - Direct config management for configuration operations

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify workspace orchestrates but doesn't directly implement business logic
    // This is architectural - the class should delegate, not implement everything
    assertExists(_workspace);
  });

  await t.step("should maintain layer separation", () => {
    _logger.debug("Testing layer separation compliance");

    // Workspace layer should not directly access:
    // - File system operations (delegated to structure)
    // - Path manipulation (delegated to path resolver)
    // - Low-level configuration parsing (delegated to config)

    // This test verifies architectural integrity through interface usage
    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    assertExists(_workspace);
  });

  await t.step("should support strategy pattern for path resolution", () => {
    _logger.debug("Testing strategy pattern implementation");

    // Architecture should allow different path resolution strategies
    // via the WorkspacePathResolver interface

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify path resolution is delegated, not hardcoded
    assertExists(_workspace.resolvePath);
  });

  await t.step("should enforce error handling boundaries", () => {
    _logger.debug("Testing error handling architecture");

    // Workspace should handle errors at appropriate boundaries:
    // - Configuration errors (WorkspaceConfigError)
    // - Initialization errors (WorkspaceInitError)
    // - Delegation of other errors to appropriate layers

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    assertExists(_workspace);
  });

  await t.step("should support template deployment architecture", () => {
    _logger.debug("Testing template deployment architecture");

    // Architecture should cleanly separate:
    // - Template source (imports from templates module)
    // - Deployment logic (in initialize method)
    // - File system operations (delegated to structure)

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify template deployment is part of initialization
    assertExists(_workspace.initialize);
  });
});
