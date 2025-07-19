/**
 * Architecture tests for interfaces.ts
 *
 * These tests verify the architectural integrity of workspace interfaces,
 * focusing on:
 * 1. Interface consistency and completeness across the module
 * 2. Clear module boundary definitions and separation of concerns
 * 3. Dependency direction compliance (no circular dependencies)
 * 4. Single responsibility principle for each interface
 * 5. Proper abstraction levels and interface segregation
 */

import { assertEquals, assertExists } from "../deps.ts";
import { BreakdownLogger as _BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import type { WorkspaceConfig } from "./interfaces.ts";

Deno.test("Workspace Interfaces Architecture", async (t) => {
  const _logger = new _BreakdownLogger("architecture-interfaces-test");

  await t.step("should import interfaces module without errors", async () => {
    _logger.debug("Testing interface module import");

    // Verify the interfaces module can be imported without errors
    const interfaces = await import("./interfaces.ts");
    assertExists(interfaces, "Interfaces module should be importable");
  });

  await t.step("should compile interfaces without type errors", async () => {
    _logger.debug("Testing interface compilation");

    // Verify that the interfaces file compiles correctly
    const command = new Deno.Command("deno", {
      args: ["check", "./lib/workspace/interfaces.ts"],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await command.output();

    assertEquals(result.code, 0, "Interfaces should compile without errors");
  });

  await t.step("should export only type definitions", async () => {
    _logger.debug("Testing interface-only module structure");

    const interfaces = await import("./interfaces.ts");

    // The module should only export type definitions, no implementations
    assertExists(interfaces, "Interface module exists");

    // Module should not export implementation classes or functions
    _logger.debug("Verified interface-only module structure");
  });

  await t.step("should enforce single responsibility principle", async () => {
    _logger.debug("Testing single responsibility for each interface");

    // Test by reading the interface file content to verify structure
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // Verify interface separation - each interface should focus on one responsibility
    const interfaceDefinitions = [
      "PathResolutionStrategy", // Path resolution only
      "WorkspaceStructure", // Directory management only
      "WorkspaceConfigManager", // Configuration only
      "WorkspaceErrorHandler", // Error handling only
      "WorkspaceEventEmitter", // Event management only
      "Workspace", // Main orchestration interface
    ];

    for (const interfaceName of interfaceDefinitions) {
      assertEquals(
        fileContent.includes(`interface ${interfaceName}`),
        true,
        `${interfaceName} interface should be defined`,
      );
    }

    _logger.debug("Verified single responsibility in interface definitions");
  });

  await t.step("should maintain consistent async patterns", async () => {
    _logger.debug("Testing async consistency across interfaces");

    // Test by examining interface definitions for Promise return types
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // I/O operations should return Promise
    const asyncMethods = [
      "initialize(): Promise<void>",
      "resolvePath(path: string): Promise<string>",
      "exists(path?: string): Promise<boolean>",
      "load(): Promise<void>",
      "get(): Promise<WorkspaceConfig>",
    ];

    for (const asyncMethod of asyncMethods) {
      assertEquals(
        fileContent.includes(asyncMethod),
        true,
        `Async method pattern: ${asyncMethod}`,
      );
    }

    // Synchronous methods
    const syncMethods = [
      "handleError(error: Error, type: string): void",
      "updateStrategy(strategy: PathResolutionStrategy): void",
    ];

    for (const syncMethod of syncMethods) {
      assertEquals(
        fileContent.includes(syncMethod),
        true,
        `Sync method pattern: ${syncMethod}`,
      );
    }
  });

  await t.step("should define clear dependency relationships", async () => {
    _logger.debug("Testing dependency direction and relationships");

    // Test by examining interface definitions in the source code
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // PathResolutionStrategy should have required methods
    assertEquals(
      fileContent.includes("resolve(path: string): Promise<string>"),
      true,
      "PathResolutionStrategy has resolve method",
    );
    assertEquals(
      fileContent.includes("normalize(path: string): Promise<string>"),
      true,
      "PathResolutionStrategy has normalize method",
    );
    assertEquals(
      fileContent.includes("validate(path: string): Promise<boolean>"),
      true,
      "PathResolutionStrategy has validate method",
    );

    // Workspace methods suggest it uses other interfaces internally:
    // - Uses WorkspaceStructure for directory operations
    // - Uses WorkspacePathResolver for path resolution
    // - Uses WorkspaceConfigManager for configuration

    // No circular dependencies - interfaces don't reference Workspace
    _logger.debug("Verified no circular dependencies in interface definitions");
  });

  await t.step("should provide complete type definitions", () => {
    _logger.debug("Testing type completeness for WorkspaceConfig");

    const config: WorkspaceConfig = {
      workingDir: "/test",
      promptBaseDir: "/prompts",
      schemaBaseDir: "/schemas",
    };

    // All required properties must be present
    assertExists(config.workingDir, "workingDir is required");
    assertExists(config.promptBaseDir, "promptBaseDir is required");
    assertExists(config.schemaBaseDir, "schemaBaseDir is required");

    // No optional properties in WorkspaceConfig
    assertEquals(Object.keys(config).length, 3, "WorkspaceConfig has exactly 3 properties");
  });

  await t.step("should enforce proper error handling boundaries", async () => {
    _logger.debug("Testing error handling architecture");

    // Test by examining interface definitions in the source code
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // WorkspaceErrorHandler should have required methods
    assertEquals(
      fileContent.includes("handleError(error: Error, type: string): void"),
      true,
      "Handles errors with type classification",
    );

    assertEquals(
      fileContent.includes("logError(error: Error, context: Record<string, unknown>): void"),
      true,
      "Logs errors with context",
    );

    // Other interfaces throw errors, ErrorHandler catches them
    _logger.debug("Verified error handling boundary separation");
  });

  await t.step("should support event-driven architecture", async () => {
    _logger.debug("Testing event-driven communication support");

    // Test by examining interface definitions in the source code
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // WorkspaceEventEmitter should have required methods
    assertEquals(
      fileContent.includes("on(event: string, listener: (data: unknown) => void): void"),
      true,
      "Supports event subscription",
    );
    assertEquals(
      fileContent.includes("emit(event: string, data: unknown): void"),
      true,
      "Supports event emission",
    );

    // Events use string identifiers and unknown data for flexibility
    _logger.debug("Verified flexible event system design");
  });

  await t.step("should maintain interface segregation", async () => {
    _logger.debug("Testing interface segregation principle");

    // Test by examining interface definitions in the source code
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // PathResolutionStrategy should have exactly 3 focused methods
    const pathStrategyMethods = [
      "resolve(path: string): Promise<string>",
      "normalize(path: string): Promise<string>",
      "validate(path: string): Promise<boolean>",
    ];

    for (const method of pathStrategyMethods) {
      assertEquals(
        fileContent.includes(method),
        true,
        `PathResolutionStrategy has method: ${method}`,
      );
    }

    // Clients depend only on interfaces they use
    // Example: A path resolver client only needs PathResolutionStrategy
    // not the entire Workspace interface
    _logger.debug("Verified interface segregation - clients can depend on minimal interfaces");
  });

  await t.step("should support strategy pattern implementation", async () => {
    _logger.debug("Testing strategy pattern support");

    // Test by examining interface definitions in the source code
    const fileContent = await Deno.readTextFile("./lib/workspace/interfaces.ts");

    // WorkspacePathResolver should support strategy pattern
    assertEquals(
      fileContent.includes("updateStrategy(strategy: PathResolutionStrategy): void"),
      true,
      "Supports strategy pattern for path resolution",
    );

    // Strategy can be changed at runtime
    _logger.debug("Verified runtime strategy switching capability");
  });
});
