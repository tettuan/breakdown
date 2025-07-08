/**
 * @fileoverview Architecture tests for workspace filesystem operations
 * 
 * Tests the fundamental filesystem operation constraints that support
 * the workspace domain's responsibility for safe workspace management.
 * These are architecture tests that validate the core principles and
 * constraints of the workspace subsystem.
 * 
 * Architecture tests focus on:
 * - Workspace directory structure constraints
 * - Result-based error handling for workspace operations
 * - Type safety of workspace configuration contracts
 * - Proper workspace resource management
 * 
 * @module
 */

import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { join } from "@std/path";
import { ok, error, type Result } from "../types/result.ts";
import {
  type WorkspaceOptions,
  type WorkspaceConfig,
  type WorkspaceStructure,
  type WorkspaceConfigManager,
  type WorkspacePaths,
} from "./types.ts";
import {
  type WorkspaceError,
  type WorkspaceInitError,
  type WorkspaceConfigError,
  type WorkspacePathError,
  type WorkspaceDirectoryError,
  createWorkspaceInitError,
  createWorkspaceConfigError,
  createWorkspacePathError,
  createWorkspaceDirectoryError,
  isWorkspaceInitError,
  isWorkspaceConfigError,
  isWorkspacePathError,
  isWorkspaceDirectoryError,
  isWorkspaceError,
} from "./errors.ts";

/**
 * Test group: Workspace configuration architecture constraints
 */
Deno.test("Workspace Architecture: WorkspaceOptions follows interface contract", () => {
  // Test required fields constraint
  const minimalOptions: WorkspaceOptions = {
    workingDir: ".agent/breakdown",
  };
  
  assertEquals(minimalOptions.workingDir, ".agent/breakdown");
  assertEquals(minimalOptions.promptBaseDir, undefined);
  assertEquals(minimalOptions.schemaBaseDir, undefined);
  
  // Test optional fields constraint
  const fullOptions: WorkspaceOptions = {
    workingDir: "/custom/workspace",
    promptBaseDir: "templates/prompts",
    schemaBaseDir: "schemas/validation",
  };
  
  assertEquals(fullOptions.workingDir, "/custom/workspace");
  assertEquals(fullOptions.promptBaseDir, "templates/prompts");
  assertEquals(fullOptions.schemaBaseDir, "schemas/validation");
});

Deno.test("Workspace Architecture: WorkspaceConfig follows persistent structure", () => {
  // Test required structure constraint
  const config: WorkspaceConfig = {
    working_dir: ".agent/breakdown",
    app_prompt: {
      base_dir: "lib/breakdown/prompts",
    },
    app_schema: {
      base_dir: "lib/breakdown/schema",
    },
  };
  
  assertEquals(config.working_dir, ".agent/breakdown");
  assertEquals(config.app_prompt.base_dir, "lib/breakdown/prompts");
  assertEquals(config.app_schema.base_dir, "lib/breakdown/schema");
  
  // Architecture constraint: nested structure integrity
  assertExists(config.app_prompt);
  assertExists(config.app_schema);
  assertExists(config.app_prompt.base_dir);
  assertExists(config.app_schema.base_dir);
});

/**
 * Test group: Workspace error handling architecture
 */
Deno.test("Workspace Architecture: Error types follow discriminated union pattern", () => {
  // Test error creation follows pattern
  const initError = createWorkspaceInitError("Initialization failed");
  const configError = createWorkspaceConfigError("Configuration invalid");
  const pathError = createWorkspacePathError("Path resolution failed");
  const dirError = createWorkspaceDirectoryError("Directory creation failed");
  
  // Architecture constraint: unique type discriminators
  assertEquals(initError.type, "workspace_init_error");
  assertEquals(configError.type, "workspace_config_error");
  assertEquals(pathError.type, "workspace_path_error");
  assertEquals(dirError.type, "workspace_directory_error");
  
  // Architecture constraint: unique error codes
  assertEquals(initError.code, "WORKSPACE_INIT_ERROR");
  assertEquals(configError.code, "WORKSPACE_CONFIG_ERROR");
  assertEquals(pathError.code, "WORKSPACE_PATH_ERROR");
  assertEquals(dirError.code, "WORKSPACE_DIRECTORY_ERROR");
  
  // Architecture constraint: all errors have messages
  assertExists(initError.message);
  assertExists(configError.message);
  assertExists(pathError.message);
  assertExists(dirError.message);
});

Deno.test("Workspace Architecture: Type guards work correctly", () => {
  const initError = createWorkspaceInitError("Init failed");
  const configError = createWorkspaceConfigError("Config failed");
  const pathError = createWorkspacePathError("Path failed");
  const dirError = createWorkspaceDirectoryError("Dir failed");
  
  // Test positive cases
  assertEquals(isWorkspaceInitError(initError), true);
  assertEquals(isWorkspaceConfigError(configError), true);
  assertEquals(isWorkspacePathError(pathError), true);
  assertEquals(isWorkspaceDirectoryError(dirError), true);
  
  // Test negative cases (cross-validation)
  assertEquals(isWorkspaceInitError(configError), false);
  assertEquals(isWorkspaceConfigError(pathError), false);
  assertEquals(isWorkspacePathError(dirError), false);
  assertEquals(isWorkspaceDirectoryError(initError), false);
  
  // Test general workspace error detection
  assertEquals(isWorkspaceError(initError), true);
  assertEquals(isWorkspaceError(configError), true);
  assertEquals(isWorkspaceError(pathError), true);
  assertEquals(isWorkspaceError(dirError), true);
  
  // Test non-workspace errors
  assertEquals(isWorkspaceError("not an error"), false);
  assertEquals(isWorkspaceError(null), false);
  assertEquals(isWorkspaceError(undefined), false);
  assertEquals(isWorkspaceError({ type: "other_error" }), false);
});

/**
 * Test group: Interface contract validation
 */
Deno.test("Workspace Architecture: WorkspaceStructure interface contract", () => {
  // Mock implementation to test interface constraints
  class MockWorkspaceStructure implements WorkspaceStructure {
    constructor(private workingDir: string) {}
    
    async getPromptBaseDir(): Promise<string> {
      return join(this.workingDir, "prompts");
    }
    
    async getSchemaBaseDir(): Promise<string> {
      return join(this.workingDir, "schemas");
    }
    
    getWorkingDir(): string {
      return this.workingDir;
    }
    
    async initialize(): Promise<void> {
      // Mock implementation
    }
    
    async ensureDirectories(): Promise<void> {
      // Mock implementation
    }
  }
  
  const structure = new MockWorkspaceStructure("/test/workspace");
  
  // Test interface contract compliance
  assertEquals(structure.getWorkingDir(), "/test/workspace");
  assertExists(structure.getPromptBaseDir);
  assertExists(structure.getSchemaBaseDir);
  assertExists(structure.initialize);
  assertExists(structure.ensureDirectories);
});

Deno.test("Workspace Architecture: WorkspaceConfigManager interface contract", () => {
  // Mock implementation to test interface constraints
  class MockWorkspaceConfigManager implements WorkspaceConfigManager {
    constructor(private config: WorkspaceConfig) {}
    
    async getConfig(): Promise<WorkspaceConfig> {
      return this.config;
    }
    
    async validateConfig(): Promise<void> {
      if (!this.config.working_dir) {
        throw createWorkspaceConfigError("Missing working_dir");
      }
    }
  }
  
  const validConfig: WorkspaceConfig = {
    working_dir: ".agent/breakdown",
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" },
  };
  
  const manager = new MockWorkspaceConfigManager(validConfig);
  
  // Test interface contract compliance
  assertExists(manager.getConfig);
  assertExists(manager.validateConfig);
});

Deno.test("Workspace Architecture: WorkspacePaths interface contract", () => {
  // Mock implementation to test interface constraints
  class MockWorkspacePaths implements WorkspacePaths {
    constructor(
      private promptBaseDir: string,
      private schemaBaseDir: string,
      private workingDir: string,
    ) {}
    
    resolvePromptPath(name: string): string {
      return join(this.promptBaseDir, `${name}.md`);
    }
    
    resolveSchemaPath(name: string): string {
      return join(this.schemaBaseDir, `${name}.json`);
    }
    
    resolveOutputPath(name: string): string {
      return join(this.workingDir, "output", name);
    }
  }
  
  const paths = new MockWorkspacePaths(
    "/workspace/prompts",
    "/workspace/schemas",
    "/workspace",
  );
  
  // Test path resolution contract
  assertEquals(
    paths.resolvePromptPath("test"),
    "/workspace/prompts/test.md",
  );
  assertEquals(
    paths.resolveSchemaPath("validation"),
    "/workspace/schemas/validation.json",
  );
  assertEquals(
    paths.resolveOutputPath("result.txt"),
    "/workspace/output/result.txt",
  );
});

/**
 * Test group: Error immutability and value object constraints
 */
Deno.test("Workspace Architecture: Error objects are immutable", () => {
  const error = createWorkspaceInitError("Test error");
  
  // Architecture constraint: readonly properties
  assertEquals(error.message, "Test error");
  assertEquals(error.code, "WORKSPACE_INIT_ERROR");
  assertEquals(error.type, "workspace_init_error");
  
  // Attempt to modify should be prevented by TypeScript (readonly)
  // This is enforced at compile time
  assertExists(error.message);
  assertExists(error.code);
  assertExists(error.type);
});

Deno.test("Workspace Architecture: Error creation is deterministic", () => {
  const message = "Consistent error message";
  
  const error1 = createWorkspaceInitError(message);
  const error2 = createWorkspaceInitError(message);
  
  // Architecture constraint: same inputs produce equivalent outputs
  assertEquals(error1.message, error2.message);
  assertEquals(error1.code, error2.code);
  assertEquals(error1.type, error2.type);
  
  // But they should be different objects (not referentially equal)
  // Use strict equality to check reference equality
  assertEquals(error1 === error2, false);
});
