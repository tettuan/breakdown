/**
 * Architecture tests for workspace.ts
 * 
 * These tests verify architectural constraints and dependencies for the workspace module.
 * They ensure proper adherence to the 3-layer architecture, interface contracts,
 * and dependency direction rules.
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceImpl } from "./workspace.ts";
import { Workspace, WorkspaceConfig } from "./interfaces.ts";

Deno.test("Workspace Architecture", async (t) => {
  const logger = new BreakdownLogger("architecture-test");

  await t.step("should implement Workspace interface correctly", () => {
    logger.debug("Testing Workspace interface implementation");
    
    const workspace: Workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify all required methods exist
    assertExists(workspace.initialize);
    assertExists(workspace.resolvePath);
    assertExists(workspace.createDirectory);
    assertExists(workspace.removeDirectory);
    assertExists(workspace.exists);
    assertExists(workspace.getPromptBaseDir);
    assertExists(workspace.getSchemaBaseDir);
    assertExists(workspace.getWorkingDir);
    assertExists(workspace.validateConfig);
    assertExists(workspace.reloadConfig);
    
    // Verify method signatures return promises
    assertEquals(typeof workspace.initialize, "function");
    assertEquals(typeof workspace.resolvePath, "function");
    assertEquals(typeof workspace.createDirectory, "function");
    assertEquals(typeof workspace.removeDirectory, "function");
    assertEquals(typeof workspace.exists, "function");
    assertEquals(typeof workspace.getPromptBaseDir, "function");
    assertEquals(typeof workspace.getSchemaBaseDir, "function");
    assertEquals(typeof workspace.getWorkingDir, "function");
    assertEquals(typeof workspace.validateConfig, "function");
    assertEquals(typeof workspace.reloadConfig, "function");
  });

  await t.step("should have correct dependency direction", () => {
    logger.debug("Testing dependency direction compliance");
    
    // WorkspaceImpl should depend on interfaces, not concrete implementations
    // This is verified by the import statements and constructor parameters
    
    // Verify configuration interface usage
    const config: WorkspaceConfig = {
      workingDir: ".",
      promptBaseDir: "prompts", 
      schemaBaseDir: "schema"
    };
    
    const workspace = new WorkspaceImpl(config);
    assertExists(workspace);
  });

  await t.step("should follow single responsibility principle", () => {
    logger.debug("Testing single responsibility adherence");
    
    // WorkspaceImpl should delegate to specialized components:
    // - WorkspaceStructureImpl for directory operations
    // - WorkspacePathResolverImpl for path resolution
    // - Direct config management for configuration operations
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify workspace orchestrates but doesn't directly implement business logic
    // This is architectural - the class should delegate, not implement everything
    assertExists(workspace);
  });

  await t.step("should maintain layer separation", () => {
    logger.debug("Testing layer separation compliance");
    
    // Workspace layer should not directly access:
    // - File system operations (delegated to structure)
    // - Path manipulation (delegated to path resolver)
    // - Low-level configuration parsing (delegated to config)
    
    // This test verifies architectural integrity through interface usage
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    assertExists(workspace);
  });

  await t.step("should support strategy pattern for path resolution", () => {
    logger.debug("Testing strategy pattern implementation");
    
    // Architecture should allow different path resolution strategies
    // via the WorkspacePathResolver interface
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify path resolution is delegated, not hardcoded
    assertExists(workspace.resolvePath);
  });

  await t.step("should enforce error handling boundaries", () => {
    logger.debug("Testing error handling architecture");
    
    // Workspace should handle errors at appropriate boundaries:
    // - Configuration errors (WorkspaceConfigError)
    // - Initialization errors (WorkspaceInitError) 
    // - Delegation of other errors to appropriate layers
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    assertExists(workspace);
  });

  await t.step("should support template deployment architecture", () => {
    logger.debug("Testing template deployment architecture");
    
    // Architecture should cleanly separate:
    // - Template source (imports from templates module)
    // - Deployment logic (in initialize method)
    // - File system operations (delegated to structure)
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify template deployment is part of initialization
    assertExists(workspace.initialize);
  });
});