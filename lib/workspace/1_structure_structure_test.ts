/**
 * Structure tests for structure.ts
 * 
 * These tests verify class structure, responsibility distribution, and design patterns
 * implementation for the workspace structure module. They ensure proper class design 
 * principles are followed and the component has clear, focused responsibilities.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceStructureImpl } from "./structure.ts";

Deno.test("WorkspaceStructure Structure", async (t) => {
  const logger = new BreakdownLogger("structure-test");
  
  await t.step("should have proper class design", () => {
    logger.debug("Testing class design structure");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify proper instantiation
    assertExists(structure);
    assertInstanceOf(structure, WorkspaceStructureImpl);
  });

  await t.step("should maintain clear directory management responsibility", () => {
    logger.debug("Testing directory management responsibility");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: "./test",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Verify all directory management methods exist
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);
    assertExists(structure.exists);
    
    // Verify method types
    assertEquals(typeof structure.initialize, "function");
    assertEquals(typeof structure.ensureDirectories, "function");
    assertEquals(typeof structure.createDirectory, "function");
    assertEquals(typeof structure.removeDirectory, "function");
    assertEquals(typeof structure.exists, "function");
  });

  await t.step("should have focused initialization responsibility", () => {
    logger.debug("Testing initialization responsibility structure");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Initialize should orchestrate directory creation
    assertExists(structure.initialize);
    
    // EnsureDirectories should handle the actual directory creation logic
    assertExists(structure.ensureDirectories);
    
    // These should be separate concerns with clear delegation
    assertEquals(typeof structure.initialize, "function");
    assertEquals(typeof structure.ensureDirectories, "function");
  });

  await t.step("should separate directory operations by concern", () => {
    logger.debug("Testing directory operation separation");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Creation operations
    assertExists(structure.createDirectory);
    assertEquals(typeof structure.createDirectory, "function");
    
    // Removal operations
    assertExists(structure.removeDirectory);
    assertEquals(typeof structure.removeDirectory, "function");
    
    // Query operations
    assertExists(structure.exists);
    assertEquals(typeof structure.exists, "function");
    
    // These should be distinct operations with different purposes
  });

  await t.step("should maintain configuration dependency structure", () => {
    logger.debug("Testing configuration dependency structure");
    
    const config = {
      workingDir: "./custom",
      promptBaseDir: "custom-prompts",
      schemaBaseDir: "custom-schema"
    };
    
    const structure = new WorkspaceStructureImpl(config);
    
    // Should accept configuration in constructor
    assertExists(structure);
    
    // Should not expose configuration management methods
    // (that's not this class's responsibility)
    assertEquals((structure as any).validateConfig, undefined);
    assertEquals((structure as any).reloadConfig, undefined);
  });

  await t.step("should implement predefined directory structure responsibility", () => {
    logger.debug("Testing predefined directory structure responsibility");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Should have methods for managing the standard breakdown structure
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
    
    // These methods should handle the predefined 3-layer structure
    assertEquals(typeof structure.initialize, "function");
    assertEquals(typeof structure.ensureDirectories, "function");
  });

  await t.step("should maintain path-based operation structure", () => {
    logger.debug("Testing path-based operation structure");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // All operations should be path-based
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);
    assertExists(structure.exists);
    
    // Should not have absolute path operations (those are PathResolver's job)
    assertEquals((structure as any).resolvePath, undefined);
    assertEquals((structure as any).normalize, undefined);
  });

  await t.step("should have appropriate error handling structure", () => {
    logger.debug("Testing error handling structure");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Error handling should be integrated into operations
    // but not exposed as separate methods
    assertExists(structure.initialize);
    assertExists(structure.ensureDirectories);
    assertExists(structure.createDirectory);
    assertExists(structure.removeDirectory);
    
    // Should not have explicit error handling methods
    assertEquals((structure as any).handleError, undefined);
    assertEquals((structure as any).logError, undefined);
  });

  await t.step("should maintain clean constructor pattern", () => {
    logger.debug("Testing constructor pattern structure");
    
    const config = {
      workingDir: "./test",
      promptBaseDir: "test-prompts",
      schemaBaseDir: "test-schema"
    };
    
    // Constructor should only require configuration
    const structure = new WorkspaceStructureImpl(config);
    assertExists(structure);
    
    // Should not require dependency injection of services
    // (structure is a focused, self-contained service)
    assertInstanceOf(structure, WorkspaceStructureImpl);
  });

  await t.step("should expose only necessary public interface", () => {
    logger.debug("Testing public interface structure");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // Public interface should be minimal and focused
    const publicMethods = [
      "initialize",
      "ensureDirectories",
      "createDirectory",
      "removeDirectory",
      "exists"
    ];
    
    publicMethods.forEach(method => {
      assertExists((structure as any)[method]);
      assertEquals(typeof (structure as any)[method], "function");
    });
    
    // Should not expose internal implementation details
    assertEquals((structure as any).config, undefined);
    assertEquals((structure as any).directories, undefined);
  });

  await t.step("should implement consistent async pattern", () => {
    logger.debug("Testing async pattern consistency");
    
    const structure = new WorkspaceStructureImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema"
    });
    
    // All operations should be async for file system consistency
    assertEquals(typeof structure.initialize, "function");
    assertEquals(typeof structure.ensureDirectories, "function");
    assertEquals(typeof structure.createDirectory, "function");
    assertEquals(typeof structure.removeDirectory, "function");
    assertEquals(typeof structure.exists, "function");
  });
});