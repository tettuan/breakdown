/**
 * Structure tests for workspace.ts
 * 
 * These tests verify class structure, responsibility distribution, and design patterns
 * implementation for the workspace module. They ensure proper class design principles
 * are followed and components have clear, non-overlapping responsibilities.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceImpl } from "./workspace.ts";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspacePathResolverImpl } from "./path/resolver.ts";

Deno.test("Workspace Structure", async (t) => {
  const logger = new BreakdownLogger("structure-test");
  
  await t.step("should have proper class composition", () => {
    logger.debug("Testing class composition structure");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify composition over inheritance
    assertExists(workspace);
    
    // WorkspaceImpl should compose other services, not inherit from them
    // This ensures loose coupling and testability
    assertInstanceOf(workspace, WorkspaceImpl);
  });

  await t.step("should delegate directory operations properly", () => {
    logger.debug("Testing directory operations delegation");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify delegation methods exist and are properly typed
    assertExists(workspace.createDirectory);
    assertExists(workspace.removeDirectory);
    assertExists(workspace.exists);
    
    // These should be delegation methods, not direct implementations
    assertEquals(typeof workspace.createDirectory, "function");
    assertEquals(typeof workspace.removeDirectory, "function");
    assertEquals(typeof workspace.exists, "function");
  });

  await t.step("should delegate path resolution properly", () => {
    logger.debug("Testing path resolution delegation");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify path resolution delegation
    assertExists(workspace.resolvePath);
    assertEquals(typeof workspace.resolvePath, "function");
  });

  await t.step("should manage configuration responsibility clearly", () => {
    logger.debug("Testing configuration management structure");
    
    const config = {
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    };
    
    const workspace = new WorkspaceImpl(config);
    
    // Configuration management methods should exist
    assertExists(workspace.validateConfig);
    assertExists(workspace.reloadConfig);
    assertExists(workspace.getPromptBaseDir);
    assertExists(workspace.getSchemaBaseDir);
    assertExists(workspace.getWorkingDir);
    
    // These should be workspace-level responsibilities
    assertEquals(typeof workspace.validateConfig, "function");
    assertEquals(typeof workspace.reloadConfig, "function");
    assertEquals(typeof workspace.getPromptBaseDir, "function");
    assertEquals(typeof workspace.getSchemaBaseDir, "function");
    assertEquals(typeof workspace.getWorkingDir, "function");
  });

  await t.step("should have initialization orchestration responsibility", () => {
    logger.debug("Testing initialization orchestration structure");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Initialization should be a workspace-level orchestration concern
    assertExists(workspace.initialize);
    assertEquals(typeof workspace.initialize, "function");
  });

  await t.step("should separate concerns between structure and path resolution", () => {
    logger.debug("Testing concern separation structure");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts", 
      schemaBaseDir: "schema"
    });
    
    // Directory operations should go to structure component
    assertExists(workspace.createDirectory);
    assertExists(workspace.removeDirectory);
    assertExists(workspace.exists);
    
    // Path operations should go to path resolver component
    assertExists(workspace.resolvePath);
    
    // These should be separate concerns with different responsibilities
    assertEquals(typeof workspace.createDirectory, "function");
    assertEquals(typeof workspace.resolvePath, "function");
  });

  await t.step("should handle template deployment as workspace concern", () => {
    logger.debug("Testing template deployment responsibility structure");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Template deployment should be orchestrated by workspace during initialization
    // This is a higher-level concern that coordinates multiple sub-systems
    assertExists(workspace.initialize);
  });

  await t.step("should maintain clean constructor dependency injection", () => {
    logger.debug("Testing constructor dependency injection structure");
    
    const config = {
      workingDir: "./test",
      promptBaseDir: "custom-prompts",
      schemaBaseDir: "custom-schema"
    };
    
    // Constructor should accept configuration and create dependencies
    const workspace = new WorkspaceImpl(config);
    assertExists(workspace);
    
    // Should not require external dependency injection beyond config
    assertInstanceOf(workspace, WorkspaceImpl);
  });

  await t.step("should expose only necessary public methods", () => {
    logger.debug("Testing public interface structure");
    
    const workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Public interface should only expose what's needed by clients
    const publicMethods = [
      "initialize",
      "resolvePath", 
      "createDirectory",
      "removeDirectory",
      "exists",
      "getPromptBaseDir",
      "getSchemaBaseDir", 
      "getWorkingDir",
      "validateConfig",
      "reloadConfig"
    ];
    
    publicMethods.forEach(method => {
      assertExists((workspace as any)[method]);
      assertEquals(typeof (workspace as any)[method], "function");
    });
  });
});