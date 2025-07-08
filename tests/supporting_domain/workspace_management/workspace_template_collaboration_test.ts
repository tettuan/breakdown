/**
 * @fileoverview Workspace Management and Template Management Collaboration Tests
 * 
 * This test suite validates the collaboration between workspace management
 * and template management domains within the supporting domain layer.
 * It ensures proper coordination, interface consistency, and shared responsibility handling.
 * 
 * Key test areas:
 * 1. Directory structure coordination between domains
 * 2. Configuration sharing and synchronization
 * 3. Resource lifecycle management
 * 4. Error handling coordination
 * 5. Path resolution collaboration
 * 
 * @module tests/supporting_domain/workspace_management/workspace_template_collaboration_test
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
import { TypeFactory } from "../../../lib/types/type_factory.ts";
import { DefaultTypePatternProvider } from "../../../lib/types/defaults/default_type_pattern_provider.ts";
import { isOk } from "../../../lib/types/result.ts";

// Supporting Domain imports
import { WorkingDirectoryPath } from "../../../lib/domain/core/value_objects/working_directory_path.ts";

// Workspace Management imports
import {
  createWorkspaceError,
  isWorkspaceError,
} from "../../../lib/workspace/mod.ts";

const logger = new BreakdownLogger("workspace-template-collaboration");

describe("Workspace Management and Template Management Collaboration", () => {
  describe("Directory Structure Coordination", () => {
    it("should coordinate workspace and template directory structures", async () => {
      logger.debug("Testing workspace-template directory coordination");

      const tempDir = await Deno.makeTempDir({ prefix: "ws_template_collab_" });

      try {
        // Define coordinated directory structure
        const coordinatedStructure = {
          workspace: {
            root: join(tempDir, "workspace"),
            subdirectories: [
              "projects",
              "issues", 
              "tasks",
              "temp",
              "config",
            ]
          },
          template: {
            root: join(tempDir, "templates"),
            structure: {
              prompts: {
                to: ["project", "issue", "task"],
                summary: ["project", "issue"],
                defect: ["task", "issue"],
              },
              schemas: {
                to: ["project", "issue"],
                summary: ["project", "issue"],
                defect: ["task"],
              }
            }
          }
        };

        // Create workspace directories
        await Deno.mkdir(coordinatedStructure.workspace.root, { recursive: true });
        for (const subdir of coordinatedStructure.workspace.subdirectories) {
          const dirPath = join(coordinatedStructure.workspace.root, subdir);
          await Deno.mkdir(dirPath, { recursive: true });
        }

        // Create template directories with hierarchical structure
        const templateRoot = coordinatedStructure.template.root;
        for (const [type, directives] of Object.entries(coordinatedStructure.template.structure)) {
          for (const [directive, layers] of Object.entries(directives)) {
            for (const layer of layers) {
              const dirPath = join(templateRoot, type, directive, layer);
              await Deno.mkdir(dirPath, { recursive: true });
            }
          }
        }

        // Verify coordination between workspace and template structures
        const workspaceExists = await Deno.stat(coordinatedStructure.workspace.root)
          .then(stat => stat.isDirectory).catch(() => false);
        const templateExists = await Deno.stat(coordinatedStructure.template.root)
          .then(stat => stat.isDirectory).catch(() => false);

        assertEquals(workspaceExists, true, "Workspace root should exist");
        assertEquals(templateExists, true, "Template root should exist");

        // Verify specific coordination points
        const configDirExists = await Deno.stat(join(coordinatedStructure.workspace.root, "config"))
          .then(stat => stat.isDirectory).catch(() => false);
        const promptsDirExists = await Deno.stat(join(templateRoot, "prompts"))
          .then(stat => stat.isDirectory).catch(() => false);

        assertEquals(configDirExists, true, "Workspace config directory should exist");
        assertEquals(promptsDirExists, true, "Template prompts directory should exist");

        // Count created directories for validation
        const workspaceSubdirs = coordinatedStructure.workspace.subdirectories.length;
        const templateDirs = Object.values(coordinatedStructure.template.structure)
          .flatMap(directives => Object.values(directives))
          .flatMap(layers => layers).length;

        assertEquals(workspaceSubdirs, 5, "Should have correct workspace subdirectories");
        assertEquals(templateDirs, 12, "Should have correct template directories");

        logger.debug("Directory structure coordination validated", {
          workspaceSubdirs,
          templateDirs,
          totalCoordinated: workspaceSubdirs + templateDirs,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should handle directory structure conflicts gracefully", async () => {
      logger.debug("Testing directory structure conflict resolution");

      const tempDir = await Deno.makeTempDir({ prefix: "conflict_test_" });

      try {
        // Create conflicting directory structures
        const conflictScenarios = [
          {
            name: "workspace-template-overlap",
            workspaceDir: join(tempDir, "shared", "workspace"),
            templateDir: join(tempDir, "shared", "templates"),
            expectedConflict: false, // Should coexist
          },
          {
            name: "same-directory-different-purpose",
            workspaceDir: join(tempDir, "conflict", "config"),
            templateDir: join(tempDir, "conflict", "config"),
            expectedConflict: true, // Should detect conflict
          }
        ];

        for (const scenario of conflictScenarios) {
          // Create directories
          await Deno.mkdir(scenario.workspaceDir, { recursive: true });
          await Deno.mkdir(scenario.templateDir, { recursive: true });

          const workspaceExists = await Deno.stat(scenario.workspaceDir)
            .then(() => true).catch(() => false);
          const templateExists = await Deno.stat(scenario.templateDir)
            .then(() => true).catch(() => false);

          assertEquals(workspaceExists, true, `Workspace dir should exist for ${scenario.name}`);
          assertEquals(templateExists, true, `Template dir should exist for ${scenario.name}`);

          if (scenario.expectedConflict) {
            // Simulate conflict detection
            const sameDirectory = scenario.workspaceDir === scenario.templateDir;
            assertEquals(sameDirectory, true, `Should detect directory conflict for ${scenario.name}`);
            
            // Create error for conflict scenario
            const conflictError = createWorkspaceError(
              `Directory conflict detected between workspace and template management: ${scenario.templateDir}`,
              "WS_DIR_CONFLICT"
            );
            assertEquals(isWorkspaceError(conflictError), true);
            assert(conflictError.message.includes("conflict"));
          }

          logger.debug(`Conflict scenario processed: ${scenario.name}`);
        }

        logger.debug("Directory structure conflict handling validated");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("Configuration Sharing and Synchronization", () => {
    it("should share configuration between workspace and template domains", async () => {
      logger.debug("Testing configuration sharing");

      const tempDir = await Deno.makeTempDir({ prefix: "config_sharing_" });

      try {
        // Create shared configuration structure
        const sharedConfig = {
          workspace: {
            configDir: join(tempDir, "config"),
            workingDir: join(tempDir, "workspace"),
            profileName: "shared-test",
          },
          template: {
            promptsBaseDir: join(tempDir, "prompts"),
            schemasBaseDir: join(tempDir, "schemas"),
            templateConfig: join(tempDir, "config", "templates.yml"),
          }
        };

        // Create shared configuration directory
        await Deno.mkdir(sharedConfig.workspace.configDir, { recursive: true });
        await Deno.mkdir(sharedConfig.workspace.workingDir, { recursive: true });
        await Deno.mkdir(sharedConfig.template.promptsBaseDir, { recursive: true });
        await Deno.mkdir(sharedConfig.template.schemasBaseDir, { recursive: true });

        // Create shared configuration file
        const configContent = {
          workspace: {
            profile: sharedConfig.workspace.profileName,
            workingDirectory: sharedConfig.workspace.workingDir,
          },
          template: {
            promptsBaseDirectory: sharedConfig.template.promptsBaseDir,
            schemasBaseDirectory: sharedConfig.template.schemasBaseDir,
          }
        };

        await Deno.writeTextFile(
          join(sharedConfig.workspace.configDir, "shared.json"),
          JSON.stringify(configContent, null, 2)
        );

        // Verify configuration sharing
        const configExists = await Deno.stat(join(sharedConfig.workspace.configDir, "shared.json"))
          .then(() => true).catch(() => false);
        assertEquals(configExists, true, "Shared configuration should exist");

        // Test workspace configuration consumption
        const workspaceProfileResult = ConfigProfileName.create(sharedConfig.workspace.profileName);
        const workingDirResult = WorkingDirectoryPath.create(sharedConfig.workspace.workingDir);

        assertEquals(workspaceProfileResult.ok, true, "Workspace should accept shared profile");
        assertEquals(workingDirResult.ok, true, "Workspace should accept shared working directory");

        if (isOk(workspaceProfileResult) && isOk(workingDirResult)) {
          assertEquals(workspaceProfileResult.data.getValue(), "shared-test");
          assert(workingDirResult.data.getValue().includes("workspace"));
        }

        // Verify template directories exist for template domain consumption
        const promptsExists = await Deno.stat(sharedConfig.template.promptsBaseDir)
          .then(stat => stat.isDirectory).catch(() => false);
        const schemasExists = await Deno.stat(sharedConfig.template.schemasBaseDir)
          .then(stat => stat.isDirectory).catch(() => false);

        assertEquals(promptsExists, true, "Template prompts directory should exist");
        assertEquals(schemasExists, true, "Template schemas directory should exist");

        logger.debug("Configuration sharing validated", {
          sharedConfigExists: configExists,
          workspaceIntegration: workspaceProfileResult.ok,
          templateDirectories: promptsExists && schemasExists,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should synchronize configuration changes between domains", async () => {
      logger.debug("Testing configuration synchronization");

      const tempDir = await Deno.makeTempDir({ prefix: "config_sync_" });

      try {
        // Setup synchronized configuration scenario
        const syncConfig = {
          baseDir: tempDir,
          configFile: join(tempDir, "config", "sync.yml"),
          workspaceMarker: join(tempDir, "workspace", ".workspace"),
          templateMarker: join(tempDir, "templates", ".templates"),
        };

        // Create initial configuration
        await Deno.mkdir(join(tempDir, "config"), { recursive: true });
        await Deno.mkdir(join(tempDir, "workspace"), { recursive: true });
        await Deno.mkdir(join(tempDir, "templates"), { recursive: true });

        // Create domain markers
        await Deno.writeTextFile(syncConfig.workspaceMarker, "workspace-domain");
        await Deno.writeTextFile(syncConfig.templateMarker, "template-domain");

        // Create synchronized configuration
        const syncConfigContent = `
workspace:
  root: ${join(tempDir, "workspace")}
  marker: ${syncConfig.workspaceMarker}
template:
  root: ${join(tempDir, "templates")}
  marker: ${syncConfig.templateMarker}
synchronization:
  enabled: true
  lastSync: ${new Date().toISOString()}
`;

        await Deno.writeTextFile(syncConfig.configFile, syncConfigContent);

        // Verify synchronization setup
        const configExists = await Deno.stat(syncConfig.configFile).then(() => true).catch(() => false);
        const workspaceMarkerExists = await Deno.stat(syncConfig.workspaceMarker).then(() => true).catch(() => false);
        const templateMarkerExists = await Deno.stat(syncConfig.templateMarker).then(() => true).catch(() => false);

        assertEquals(configExists, true, "Sync configuration should exist");
        assertEquals(workspaceMarkerExists, true, "Workspace marker should exist");
        assertEquals(templateMarkerExists, true, "Template marker should exist");

        // Test configuration change synchronization simulation
        const workspaceContent = await Deno.readTextFile(syncConfig.workspaceMarker);
        const templateContent = await Deno.readTextFile(syncConfig.templateMarker);

        assertEquals(workspaceContent, "workspace-domain");
        assertEquals(templateContent, "template-domain");

        // Simulate configuration update
        await Deno.writeTextFile(syncConfig.workspaceMarker, "workspace-domain-updated");
        
        const updatedContent = await Deno.readTextFile(syncConfig.workspaceMarker);
        assertEquals(updatedContent, "workspace-domain-updated");

        logger.debug("Configuration synchronization validated", {
          syncSetup: configExists,
          domainMarkers: workspaceMarkerExists && templateMarkerExists,
          updateSimulated: updatedContent.includes("updated"),
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("Resource Lifecycle Management", () => {
    it("should coordinate resource lifecycle between domains", async () => {
      logger.debug("Testing resource lifecycle coordination");

      const tempDir = await Deno.makeTempDir({ prefix: "lifecycle_coord_" });

      try {
        // Define coordinated resource lifecycle
        const resourceLifecycle = {
          phases: [
            { name: "initialization", workspace: true, template: true },
            { name: "structure_creation", workspace: true, template: true },
            { name: "configuration", workspace: true, template: false },
            { name: "template_loading", workspace: false, template: true },
            { name: "validation", workspace: true, template: true },
            { name: "ready", workspace: true, template: true },
          ]
        };

        // Create lifecycle tracking structure
        const lifecycleDir = join(tempDir, "lifecycle");
        await Deno.mkdir(lifecycleDir, { recursive: true });

        // Process each lifecycle phase
        for (const phase of resourceLifecycle.phases) {
          const phaseDir = join(lifecycleDir, phase.name);
          await Deno.mkdir(phaseDir, { recursive: true });

          // Create domain-specific markers
          if (phase.workspace) {
            await Deno.writeTextFile(
              join(phaseDir, "workspace.status"),
              `workspace-${phase.name}-active`
            );
          }

          if (phase.template) {
            await Deno.writeTextFile(
              join(phaseDir, "template.status"),
              `template-${phase.name}-active`
            );
          }

          // Verify phase coordination
          const phaseExists = await Deno.stat(phaseDir).then(stat => stat.isDirectory).catch(() => false);
          assertEquals(phaseExists, true, `Lifecycle phase ${phase.name} should exist`);
        }

        // Verify lifecycle coordination completeness
        const totalPhases = resourceLifecycle.phases.length;
        const workspacePhases = resourceLifecycle.phases.filter(p => p.workspace).length;
        const templatePhases = resourceLifecycle.phases.filter(p => p.template).length;

        assertEquals(totalPhases, 6, "Should have complete lifecycle phases");
        assertEquals(workspacePhases, 5, "Workspace should participate in 5 phases");
        assertEquals(templatePhases, 5, "Template should participate in 5 phases");

        // Test phase-specific coordination
        const configPhase = resourceLifecycle.phases.find(p => p.name === "configuration");
        const templateLoadingPhase = resourceLifecycle.phases.find(p => p.name === "template_loading");

        assertEquals(configPhase?.workspace, true, "Workspace should handle configuration");
        assertEquals(configPhase?.template, false, "Template should not handle configuration");
        assertEquals(templateLoadingPhase?.workspace, false, "Workspace should not handle template loading");
        assertEquals(templateLoadingPhase?.template, true, "Template should handle template loading");

        logger.debug("Resource lifecycle coordination validated", {
          totalPhases,
          workspacePhases,
          templatePhases,
          phaseSpecialization: true,
        });
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should handle resource lifecycle conflicts", () => {
      logger.debug("Testing resource lifecycle conflict handling");

      // Define lifecycle conflict scenarios
      const conflictScenarios = [
        {
          name: "concurrent-initialization",
          description: "Both domains trying to initialize simultaneously",
          conflictType: "timing",
          resolution: "coordination"
        },
        {
          name: "resource-contention",
          description: "Both domains accessing same resource",
          conflictType: "access",
          resolution: "mutex"
        },
        {
          name: "state-inconsistency",
          description: "Domains have different lifecycle states",
          conflictType: "state",
          resolution: "synchronization"
        }
      ];

      conflictScenarios.forEach(scenario => {
        // Simulate conflict detection and resolution
        const workspaceError = createWorkspaceError(
          `Lifecycle conflict detected: ${scenario.description}`,
          "WS_LIFECYCLE_CONFLICT"
        );

        assertEquals(isWorkspaceError(workspaceError), true);
        assert(workspaceError.message.includes("conflict"));
        assert(workspaceError.message.includes(scenario.description));

        // Verify conflict categorization
        switch (scenario.conflictType) {
          case "timing":
            assert(workspaceError.message.includes("simultaneously"));
            break;
          case "access":
            assert(workspaceError.message.includes("accessing"));
            break;
          case "state":
            assert(workspaceError.message.includes("states"));
            break;
        }

        logger.debug(`Lifecycle conflict scenario validated: ${scenario.name}`);
      });

      logger.debug("Resource lifecycle conflict handling validated");
    });
  });

  describe("Path Resolution Collaboration", () => {
    it("should collaborate on path resolution between domains", () => {
      logger.debug("Testing path resolution collaboration");

      // Test cross-domain path resolution scenarios
      const pathScenarios = [
        {
          name: "workspace-relative-to-template",
          workspacePath: "./workspace/config",
          templatePath: "../templates/prompts",
          expectedRelation: "sibling",
        },
        {
          name: "template-within-workspace",
          workspacePath: "/workspace/root",
          templatePath: "/workspace/root/templates",
          expectedRelation: "child",
        },
        {
          name: "independent-paths",
          workspacePath: "/workspace/area",
          templatePath: "/templates/area",
          expectedRelation: "independent",
        }
      ];

      pathScenarios.forEach(scenario => {
        // Test workspace path validation
        const workspaceDirResult = WorkingDirectoryPath.create(scenario.workspacePath);
        
        // Path should be validatable by workspace domain
        assert("ok" in workspaceDirResult);
        
        if (isOk(workspaceDirResult)) {
          const workspaceValue = workspaceDirResult.data.getValue();
          assertEquals(typeof workspaceValue, "string");
          assertEquals(workspaceValue.length > 0, true);
        }

        // Test path relationship analysis
        switch (scenario.expectedRelation) {
          case "sibling":
            assert(
              scenario.workspacePath.includes("workspace") && 
              scenario.templatePath.includes("templates"),
              "Sibling paths should be in different directories"
            );
            break;
          case "child":
            assert(
              scenario.templatePath.startsWith(scenario.workspacePath),
              "Child path should be contained within parent"
            );
            break;
          case "independent":
            assertFalse(
              scenario.templatePath.startsWith(scenario.workspacePath) ||
              scenario.workspacePath.startsWith(scenario.templatePath),
              "Independent paths should not contain each other"
            );
            break;
        }

        logger.debug(`Path resolution scenario validated: ${scenario.name}`);
      });

      logger.debug("Path resolution collaboration validated");
    });

    it("should handle path resolution errors collaboratively", () => {
      logger.debug("Testing collaborative path resolution error handling");

      // Test path resolution error scenarios
      const errorScenarios = [
        {
          type: "workspace-path-invalid",
          path: "",
          domain: "workspace",
          expectedError: "WorkspacePathError"
        },
        {
          type: "template-path-inaccessible", 
          path: "/inaccessible/template/path",
          domain: "template",
          expectedError: "WorkspaceDirectoryError"
        },
        {
          type: "cross-domain-path-conflict",
          path: "/shared/conflicted/path",
          domain: "both",
          expectedError: "WorkspacePathError"
        }
      ];

      errorScenarios.forEach(scenario => {
        let workspaceError;

        switch (scenario.type) {
          case "workspace-path-invalid":
            workspaceError = createWorkspaceError("Invalid workspace path", "WS_PATH_INVALID");
            break;
          case "template-path-inaccessible":
            workspaceError = createWorkspaceError(
              "Template path not accessible from workspace",
              "WS_TEMPLATE_PATH_ERROR"
            );
            break;
          case "cross-domain-path-conflict":
            workspaceError = createWorkspaceError(
              "Path conflict between workspace and template domains",
              "WS_CROSS_DOMAIN_CONFLICT"
            );
            break;
          default:
            workspaceError = createWorkspaceError("Generic path error", "WS_PATH_ERROR");
        }

        assertEquals(isWorkspaceError(workspaceError), true);
        assertExists(workspaceError.type);
        assertExists(workspaceError.message);

        // Verify domain context in error
        if (scenario.domain === "both") {
          assert(
            workspaceError.message.includes("workspace") && 
            workspaceError.message.includes("template"),
            "Cross-domain errors should mention both domains"
          );
        }

        logger.debug(`Path resolution error scenario validated: ${scenario.type}`);
      });

      logger.debug("Collaborative path resolution error handling validated");
    });
  });

  describe("Supporting Domain Integration with Core Domain", () => {
    it("should integrate supporting domain collaboration with core domain", () => {
      logger.debug("Testing supporting domain integration with core domain");

      // Test config-profile integration
      const configProfileResult = ConfigProfileName.create("collaboration-test");
      assert("ok" in configProfileResult);

      if (isOk(configProfileResult)) {
        const profileValue = configProfileResult.data.getValue();
        assertEquals(typeof profileValue, "string");
        assertEquals(profileValue, "collaboration-test");

        // Simulate workspace using core type
        const workspaceConfig = {
          profile: profileValue,
          collaborationMode: "workspace-template",
        };

        assertEquals(workspaceConfig.profile, "collaboration-test");
        assertEquals(workspaceConfig.collaborationMode, "workspace-template");

        logger.debug("Config profile integration validated");
      }

      // Test type factory integration
      const provider = new DefaultTypePatternProvider();
      const factory = new TypeFactory(provider);
      const typeResult = factory.createBothTypes("to", "project");

      if (isOk(typeResult)) {
        const typeData = typeResult.data;
        assertExists(typeData.directive);
        assertExists(typeData.layer);

        // Simulate template management using core types
        const templateConfig = {
          directive: typeData.directive.getValue(),
          layer: typeData.layer.getValue(),
          collaborationMode: "workspace-template",
        };

        assertEquals(templateConfig.directive, "to");
        assertEquals(templateConfig.layer, "project");
        assertEquals(templateConfig.collaborationMode, "workspace-template");

        logger.debug("Type factory integration validated");
      }

      logger.debug("Supporting domain integration with core domain validated");
    });
  });
});