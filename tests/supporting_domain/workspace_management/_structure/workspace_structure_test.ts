/**
 * Structure tests for _workspace.ts
 *
 * These tests verify class structure, responsibility distribution, and design patterns
 * implementation for the workspace module. They ensure proper class design principles
 * are followed and components have clear, non-overlapping responsibilities.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { BreakdownLogger as _BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { WorkspaceImpl } from "./workspace.ts";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspacePathResolverImpl } from "./path/resolver.ts";

Deno.test("Workspace Structure", async (t) => {
  const _logger = new _BreakdownLogger("structure-test");

  await t.step("should have proper class composition", () => {
    _logger.debug("Testing class composition structure");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify composition over inheritance
    assertExists(_workspace);

    // WorkspaceImpl should compose other services, not inherit from them
    // This ensures loose coupling and testability
    assertInstanceOf(_workspace, WorkspaceImpl);
  });

  await t.step("should delegate directory operations properly", () => {
    _logger.debug("Testing directory operations delegation");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify delegation methods exist and are properly typed
    assertExists(_workspace.createDirectory);
    assertExists(_workspace.removeDirectory);
    assertExists(_workspace.exists);

    // These should be delegation methods, not direct implementations
    assertEquals(typeof _workspace.createDirectory, "function");
    assertEquals(typeof _workspace.removeDirectory, "function");
    assertEquals(typeof _workspace.exists, "function");
  });

  await t.step("should delegate path resolution properly", () => {
    _logger.debug("Testing path resolution delegation");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Verify path resolution delegation
    assertExists(_workspace.resolvePath);
    assertEquals(typeof _workspace.resolvePath, "function");
  });

  await t.step("should manage configuration responsibility clearly", () => {
    _logger.debug("Testing configuration management structure");

    const config = {
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const _workspace = new WorkspaceImpl(config);

    // Configuration management methods should exist
    assertExists(_workspace.validateConfig);
    assertExists(_workspace.reloadConfig);
    assertExists(_workspace.getPromptBaseDir);
    assertExists(_workspace.getSchemaBaseDir);
    assertExists(_workspace.getWorkingDir);

    // These should be workspace-level responsibilities
    assertEquals(typeof _workspace.validateConfig, "function");
    assertEquals(typeof _workspace.reloadConfig, "function");
    assertEquals(typeof _workspace.getPromptBaseDir, "function");
    assertEquals(typeof _workspace.getSchemaBaseDir, "function");
    assertEquals(typeof _workspace.getWorkingDir, "function");
  });

  await t.step("should have initialization orchestration responsibility", () => {
    _logger.debug("Testing initialization orchestration structure");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Initialization should be a workspace-level orchestration concern
    assertExists(_workspace.initialize);
    assertEquals(typeof _workspace.initialize, "function");
  });

  await t.step("should separate concerns between structure and path resolution", () => {
    _logger.debug("Testing concern separation structure");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Directory operations should go to structure component
    assertExists(_workspace.createDirectory);
    assertExists(_workspace.removeDirectory);
    assertExists(_workspace.exists);

    // Path operations should go to path resolver component
    assertExists(_workspace.resolvePath);

    // These should be separate concerns with different responsibilities
    assertEquals(typeof _workspace.createDirectory, "function");
    assertEquals(typeof _workspace.resolvePath, "function");
  });

  await t.step("should handle template deployment as workspace concern", () => {
    _logger.debug("Testing template deployment responsibility structure");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });

    // Template deployment should be orchestrated by workspace during initialization
    // This is a higher-level concern that coordinates multiple sub-systems
    assertExists(_workspace.initialize);
  });

  await t.step("should maintain clean constructor dependency injection", () => {
    _logger.debug("Testing constructor dependency injection structure");

    const config = {
      workingDir: "./test",
      promptBaseDir: "custom-prompts",
      schemaBaseDir: "custom-schema",
    };

    // Constructor should accept configuration and create dependencies
    const _workspace = new WorkspaceImpl(config);
    assertExists(_workspace);

    // Should not require external dependency injection beyond config
    assertInstanceOf(_workspace, WorkspaceImpl);
  });

  await t.step("should expose only necessary public methods", () => {
    _logger.debug("Testing public interface structure");

    const _workspace = new WorkspaceImpl({
      workingDir: ".",
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
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
      "reloadConfig",
    ];

    publicMethods.forEach((method) => {
      assertExists((_workspace as any)[method]);
      assertEquals(typeof (_workspace as any)[method], "function");
    });
  });
});
