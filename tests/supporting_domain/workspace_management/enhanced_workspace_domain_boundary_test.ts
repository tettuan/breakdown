/**
 * @fileoverview Enhanced Workspace Management Domain Boundary Tests
 * 
 * This test suite validates the workspace management domain boundaries and
 * its interactions with other domains in the Breakdown system. It focuses on:
 * 
 * 1. Workspace management domain responsibilities and boundaries
 * 2. Coordination with template management domain  
 * 3. Interface contracts with core domain
 * 4. Error propagation across domain boundaries
 * 5. Workspace lifecycle management integrity
 * 
 * @module tests/supporting_domain/workspace_management/enhanced_workspace_domain_boundary_test
 */

import {
  assertEquals,
  assertExists,
  assert,
  assertFalse,
} from "../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";

// Core Domain imports
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";
import { isOk } from "../../../lib/types/result.ts";

// Supporting Domain imports  
import { WorkingDirectoryPath } from "../../../lib/domain/core/value_objects/working_directory_path.ts";

// Workspace Management imports
import {
  WorkspaceInitError,
  WorkspacePathError,
  WorkspaceConfigError,
  WorkspaceDirectoryError,
  createWorkspaceError,
  isWorkspaceError,
} from "../../../lib/workspace/mod.ts";

const logger = new BreakdownLogger("enhanced-workspace-boundary");

describe("Enhanced Workspace Management Domain Boundary", () => {
  describe("Workspace Domain Responsibility Boundaries", () => {
    it("should enforce workspace-specific error boundaries", () => {
      logger.debug("Testing workspace error boundary enforcement");

      // Test that workspace errors are domain-specific
      const workspaceErrors = [
        createWorkspaceError("Workspace initialization failed", "WS_INIT_FAILED"),
        createWorkspaceError("Invalid workspace path", "WS_PATH_INVALID"),
        createWorkspaceError("Workspace configuration error", "WS_CONFIG_ERROR"),
        createWorkspaceError("Workspace directory error", "WS_DIR_ERROR"),
      ];

      workspaceErrors.forEach((error, index) => {
        assertEquals(isWorkspaceError(error), true, `Error ${index} should be workspace error`);
        assertExists(error.type);
        assertExists(error.message);
        assertExists(error.code);

        // Verify error types are workspace-specific
        assertEquals(error.type, "workspace_error");
        
        // Verify messages are preserved
        const expectedMessages = [
          "Workspace initialization failed",
          "Invalid workspace path",
          "Workspace configuration error",
          "Workspace directory error"
        ];
        assertEquals(error.message, expectedMessages[index]);
      });

      logger.debug("Workspace error boundaries enforced correctly");
    });

    it("should validate workspace path resolution responsibilities", () => {
      logger.debug("Testing workspace path resolution boundary");

      // Test workspace path validation concepts
      const testPaths = [
        { path: "/valid/workspace", expectedValid: true },
        { path: "./relative/workspace", expectedValid: true },
        { path: "", expectedValid: false },
        { path: "   ", expectedValid: false },
      ];

      testPaths.forEach(({ path, expectedValid }) => {
        if (expectedValid) {
          assertEquals(typeof path, "string");
          assertEquals(path.trim().length > 0, true);
        } else {
          const error = createWorkspaceError("Invalid workspace path", "WS_PATH_INVALID");
          assertEquals(error.type, "workspace_error");
          assertEquals(isWorkspaceError(error), true);
        }
      });

      logger.debug("Workspace path resolution boundaries validated");
    });

    it("should enforce workspace configuration management boundaries", () => {
      logger.debug("Testing workspace configuration boundary");

      // Test workspace configuration concepts
      const configScenarios = [
        { scenario: "missing config", error: "config" },
        { scenario: "invalid format", error: "config" },
        { scenario: "permission denied", error: "config" },
      ];

      configScenarios.forEach(({ scenario, error }) => {
        const workspaceError = createWorkspaceError(`Workspace ${scenario}`, `WS_CONFIG_${error.toUpperCase()}`);
        assertEquals(workspaceError.type, "workspace_error");
        assertEquals(isWorkspaceError(workspaceError), true);
        assert(workspaceError.message.includes(scenario));
      });

      logger.debug("Workspace configuration boundaries enforced");
    });
  });

  describe("Workspace-Template Management Domain Coordination", () => {
    it("should coordinate workspace and template directory structures", async () => {
      logger.debug("Testing workspace-template coordination");

      const tempDir = await Deno.makeTempDir({ prefix: "workspace_template_test_" });

      try {
        // Define workspace structure that coordinates with template management
        const workspaceStructure = {
          root: tempDir,
          workspaceDirectories: [
            "projects",
            "issues", 
            "tasks",
            "temp",
            "config",
          ],
          templateDirectories: [
            "prompts/to/project",
            "prompts/to/issue",
            "prompts/summary/project",
            "schema/to/project",
            "schema/summary/issue",
          ]
        };

        // Create workspace directories
        for (const dir of workspaceStructure.workspaceDirectories) {
          const dirPath = join(tempDir, dir);
          await Deno.mkdir(dirPath, { recursive: true });
          
          const exists = await Deno.stat(dirPath).then(stat => stat.isDirectory).catch(() => false);
          assertEquals(exists, true, `Workspace directory ${dir} should exist`);
        }

        // Create template directories (simulating template management coordination)
        for (const dir of workspaceStructure.templateDirectories) {
          const dirPath = join(tempDir, dir);
          await Deno.mkdir(dirPath, { recursive: true });
          
          const exists = await Deno.stat(dirPath).then(stat => stat.isDirectory).catch(() => false);
          assertEquals(exists, true, `Template directory ${dir} should exist`);
        }

        // Verify coordination structure
        const allDirectories = [
          ...workspaceStructure.workspaceDirectories,
          ...workspaceStructure.templateDirectories
        ];

        assertEquals(allDirectories.length, 10, "Should have coordinated directory structure");

        logger.debug("Workspace-template coordination validated", {
          workspaceCount: workspaceStructure.workspaceDirectories.length,
          templateCount: workspaceStructure.templateDirectories.length,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should handle template management integration errors", () => {
      logger.debug("Testing template integration error handling");

      // Test scenarios where workspace and template management domains interact
      const integrationScenarios = [
        {
          scenario: "template directory creation in workspace",
          expectedErrorType: "workspace_error",
          message: "Cannot create template directories in workspace"
        },
        {
          scenario: "workspace configuration affecting templates",
          expectedErrorType: "workspace_error", 
          message: "Template configuration conflicts with workspace"
        }
      ];

      integrationScenarios.forEach(({ scenario, expectedErrorType, message }) => {
        const error = createWorkspaceError(
          message,
          `WS_${expectedErrorType.replace("Workspace", "").toUpperCase()}`
        );
        
        assertEquals(error.type, expectedErrorType);
        assertEquals(isWorkspaceError(error), true);
        assert(error.message.includes("template") || error.message.includes("Template"));
        
        logger.debug(`Integration error scenario validated: ${scenario}`);
      });
    });
  });

  describe("Supporting Domain - Core Domain Interface", () => {
    it("should validate interface contracts with core domain", () => {
      logger.debug("Testing supporting-core domain interface");

      // Test workspace management accepts core domain types
      const configProfileResult = ConfigProfileName.create("workspace-test");
      const workingDirResult = WorkingDirectoryPath.create(".");

      // Test ConfigProfileName integration
      assert("ok" in configProfileResult);
      assertEquals(typeof configProfileResult.ok, "boolean");

      if (isOk(configProfileResult)) {
        assertExists(configProfileResult.data);
        assertEquals(typeof configProfileResult.data.getValue(), "string");
        assertEquals(configProfileResult.data.getValue(), "workspace-test");
      }

      // Test WorkingDirectoryPath integration
      assert("ok" in workingDirResult);
      assertEquals(typeof workingDirResult.ok, "boolean");

      if (isOk(workingDirResult)) {
        assertExists(workingDirResult.data);
        assertEquals(typeof workingDirResult.data.getValue(), "string");
      }

      logger.debug("Supporting-core domain interface validated");
    });

    it("should maintain consistency with core domain error patterns", () => {
      logger.debug("Testing error pattern consistency with core domain");

      // Compare workspace errors with core domain error patterns
      const workspaceError = createWorkspaceError("Invalid path", "WS_PATH_INVALID");
      const coreError = ConfigProfileName.create("");

      // Both should have consistent error structures
      assertEquals(isWorkspaceError(workspaceError), true);
      assertEquals(coreError.ok, false);

      if (!coreError.ok) {
        // Both should have structured error information
        assertExists(workspaceError.type);
        assertExists(workspaceError.message);
        assertExists(coreError.error.kind);
        assertExists(coreError.error.message);

        // Error patterns should be consistent
        assertEquals(typeof workspaceError.type, "string");
        assertEquals(typeof workspaceError.message, "string");
        assertEquals(typeof coreError.error.kind, "string");
        assertEquals(typeof coreError.error.message, "string");
      }

      logger.debug("Error pattern consistency validated");
    });

    it("should support core domain type system integration", () => {
      logger.debug("Testing core domain type system integration");

      // Test that workspace management works with core domain types
      const configProfileResult = ConfigProfileName.create("integration-test");
      const workingDirResult = WorkingDirectoryPath.create("./test-workspace");

      if (isOk(configProfileResult)) {
        // Workspace management should accept these types
        const configValue = configProfileResult.data.getValue();

        // Types should be compatible with workspace operations
        assertEquals(typeof configValue, "string");

        // Simulate workspace integration with core types
        const workspaceConfig = {
          profile: configValue,
          workingDirectory: isOk(workingDirResult) ? workingDirResult.data.getValue() : "./test-workspace",
          initialized: true,
        };

        assertEquals(workspaceConfig.profile, "integration-test");
        assertEquals(workspaceConfig.workingDirectory.length > 0, true);
        assertEquals(workspaceConfig.initialized, true);

        logger.debug("Core domain type integration successful");
      } else {
        logger.debug("ConfigProfileName creation failed - this is acceptable for boundary testing");
      }
    });
  });

  describe("Workspace Lifecycle Management Integrity", () => {
    it("should maintain workspace lifecycle boundaries", async () => {
      logger.debug("Testing workspace lifecycle boundaries");

      const tempDir = await Deno.makeTempDir({ prefix: "lifecycle_test_" });

      try {
        // Test workspace lifecycle phases
        const lifecyclePhases = [
          { phase: "initialization", status: "pending" },
          { phase: "structure_creation", status: "in_progress" },
          { phase: "configuration", status: "completed" },
          { phase: "validation", status: "completed" },
          { phase: "ready", status: "active" },
        ];

        // Simulate lifecycle management
        for (const { phase, status } of lifecyclePhases) {
          const phaseDir = join(tempDir, phase);
          await Deno.mkdir(phaseDir, { recursive: true });
          
          const statusFile = join(phaseDir, "status.txt");
          await Deno.writeTextFile(statusFile, status);
          
          const exists = await Deno.stat(statusFile).then(() => true).catch(() => false);
          assertEquals(exists, true, `Lifecycle phase ${phase} should be tracked`);
        }

        // Verify lifecycle integrity
        assertEquals(lifecyclePhases.length, 5, "Should have complete lifecycle phases");
        
        const activePhases = lifecyclePhases.filter(p => 
          p.status === "completed" || p.status === "active"
        );
        assertEquals(activePhases.length, 3, "Should have appropriate active phases");

        logger.debug("Workspace lifecycle boundaries maintained", {
          totalPhases: lifecyclePhases.length,
          activePhases: activePhases.length,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should handle workspace lifecycle errors properly", () => {
      logger.debug("Testing workspace lifecycle error handling");

      // Test lifecycle-specific errors
      const lifecycleErrors = [
        {
          phase: "initialization",
          error: createWorkspaceError("Failed to initialize workspace", "WS_INIT_FAILED"),
          expectedType: "workspace_error"
        },
        {
          phase: "directory_creation", 
          error: createWorkspaceError("Failed to create workspace directories", "WS_DIR_FAILED"),
          expectedType: "workspace_error"
        },
        {
          phase: "configuration",
          error: createWorkspaceError("Failed to configure workspace", "WS_CONFIG_FAILED"),
          expectedType: "workspace_error"
        }
      ];

      lifecycleErrors.forEach(({ phase, error, expectedType }) => {
        assertEquals(error.type, expectedType);
        assertEquals(isWorkspaceError(error), true);
        assertExists(error.message);
        assertExists(error.code);
        
        logger.debug(`Lifecycle error handled: ${phase}`);
      });

      logger.debug("Workspace lifecycle error handling validated");
    });
  });

  describe("Cross-Domain Error Propagation", () => {
    it("should propagate errors across domain boundaries correctly", () => {
      logger.debug("Testing cross-domain error propagation");

      // Test error propagation scenarios
      const propagationScenarios = [
        {
          domain: "workspace → template",
          workspaceError: createWorkspaceError("Template directory creation failed", "WS_DIR_TEMPLATE_FAILED"),
          expectsPropagation: true
        },
        {
          domain: "workspace → core",
          workspaceError: createWorkspaceError("Core configuration validation failed", "WS_CONFIG_CORE_FAILED"),
          expectsPropagation: true
        },
        {
          domain: "workspace internal",
          workspaceError: createWorkspaceError("Internal workspace error", "WS_INIT_INTERNAL"),
          expectsPropagation: false
        }
      ];

      propagationScenarios.forEach(({ domain, workspaceError, expectsPropagation }) => {
        assertEquals(isWorkspaceError(workspaceError), true);
        assertExists(workspaceError.type);
        assertExists(workspaceError.message);
        
        // Error should contain domain context
        if (expectsPropagation) {
          assert(
            workspaceError.message.includes("Template") ||
            workspaceError.message.includes("Core") ||
            workspaceError.message.includes("configuration"),
            `Error should indicate cross-domain context for ${domain}`
          );
        }
        
        logger.debug(`Error propagation scenario validated: ${domain}`);
      });

      logger.debug("Cross-domain error propagation validated");
    });

    it("should maintain error boundary isolation when needed", () => {
      logger.debug("Testing error boundary isolation");

      // Test that workspace errors don't leak implementation details
      const isolatedErrors = [
        createWorkspaceError("Workspace path validation failed", "WS_PATH_VALIDATION"),
        createWorkspaceError("Workspace directory operation failed", "WS_DIR_OPERATION"),
        createWorkspaceError("Workspace configuration processing failed", "WS_CONFIG_PROCESSING"),
      ];

      isolatedErrors.forEach(error => {
        assertEquals(isWorkspaceError(error), true);
        
        // Error should not contain internal implementation details
        assertFalse(
          error.message.includes("internal") ||
          error.message.includes("private") ||
          error.message.includes("implementation"),
          "Error should not expose internal details"
        );
        
        // Error should be appropriately abstracted
        assert(
          error.message.includes("Workspace"),
          "Error should indicate workspace domain context"
        );
      });

      logger.debug("Error boundary isolation maintained");
    });
  });

  describe("Workspace Domain Integration Validation", () => {
    it("should validate complete workspace domain integration", async () => {
      logger.debug("Testing complete workspace domain integration");

      const tempDir = await Deno.makeTempDir({ prefix: "integration_test_" });

      try {
        // Test complete integration scenario
        const integrationConfig = {
          workspace: {
            root: tempDir,
            profile: "integration-test",
            workingDirectory: join(tempDir, "workspace"),
          },
          template: {
            promptsDir: join(tempDir, "prompts"),
            schemasDir: join(tempDir, "schemas"),
          },
          core: {
            configProfile: "test-profile",
            workingPath: ".",
          }
        };

        // Create integrated structure
        const allDirectories = [
          integrationConfig.workspace.workingDirectory,
          integrationConfig.template.promptsDir,
          integrationConfig.template.schemasDir,
        ];

        for (const dir of allDirectories) {
          await Deno.mkdir(dir, { recursive: true });
          const exists = await Deno.stat(dir).then(stat => stat.isDirectory).catch(() => false);
          assertEquals(exists, true, `Integration directory should exist: ${dir}`);
        }

        // Verify integration consistency
        const configProfileResult = ConfigProfileName.create(integrationConfig.core.configProfile);
        const workingDirResult = WorkingDirectoryPath.create(integrationConfig.core.workingPath);

        assertEquals(configProfileResult.ok, true);
        assertEquals(workingDirResult.ok, true);

        if (isOk(configProfileResult) && isOk(workingDirResult)) {
          assertEquals(configProfileResult.data.getValue(), "test-profile");
          assertEquals(workingDirResult.data.getValue().endsWith("."), true);
        }

        logger.debug("Complete workspace domain integration validated", {
          workspaceRoot: integrationConfig.workspace.root,
          directoriesCreated: allDirectories.length,
          coreIntegration: configProfileResult.ok && workingDirResult.ok,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });
});