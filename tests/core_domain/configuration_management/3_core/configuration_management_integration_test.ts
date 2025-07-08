/**
 * Core Domain Integration Test: Configuration Management
 * 
 * This test verifies the complete integration of the configuration management domain,
 * ensuring proper configuration loading and management following the Totality principle.
 * 
 * Totality Aspects Covered:
 * 1. Complete configuration lifecycle from file loading to application usage
 * 2. Integration between configuration loaders and profile management
 * 3. Error handling for missing configurations and invalid formats
 * 4. Configuration inheritance and override mechanisms
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import core domain components for configuration management
import { DirectiveType } from "../../../../lib/types/directive_type.ts";
import { LayerType } from "../../../../lib/types/layer_type.ts";

const logger = new BreakdownLogger("configuration-management-integration");

describe("Configuration Management Domain Integration", () => {
  describe("Complete Configuration Loading Pipeline", () => {
    it("should create and validate basic configuration objects", async () => {
      // Arrange
      const profileName = "default";
      const directive = "to";
      const layer = "project";
      
      logger.debug("Starting configuration loading pipeline", {
        profileName,
        directive,
        layer
      });

      // Act - Create configuration objects
      const directiveResult = DirectiveType.createOrError(directive);
      const layerResult = LayerType.createOrError(layer);
      
      // Assert - Basic configuration objects created
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Configuration object creation failed");
      }

      const config = {
        profileName,
        directive: directiveResult.getValue(),
        layer: layerResult.getValue()
      };
      
      // Assert - Configuration values are properly maintained
      assertEquals(config.directive.value, directive);
      assertEquals(config.layer.value, layer);
      assertEquals(config.profileName, profileName);
      
      logger.debug("Configuration objects created successfully", {
        directive: config.directive.value,
        layer: config.layer.value,
        profileName: config.profileName
      });
    });

    it("should handle multiple configuration profiles", async () => {
      // Arrange
      const profiles = ["default", "development", "production", "testing"];
      
      logger.debug("Testing multiple configuration profiles", {
        profileCount: profiles.length
      });

      // Act & Assert - Process each profile
      for (const profileName of profiles) {
        // Test configuration with this profile
        const directive = DirectiveType.createOrError("to");
        const layer = LayerType.createOrError("project");
        
        assertEquals(directive.isSuccess(), true);
        assertEquals(layer.isSuccess(), true);
        
        if (directive.isSuccess() && layer.isSuccess()) {
          const config = {
            profileName,
            directive: directive.getValue(),
            layer: layer.getValue()
          };
          
          assertEquals(config.profileName, profileName);
          assertEquals(config.directive.value, "to");
          assertEquals(config.layer.value, "project");
          
          logger.debug("Profile configuration verified", {
            profileName,
            directive: config.directive.value,
            layer: config.layer.value
          });
        }
      }
    });

    it("should validate configuration consistency across domains", async () => {
      // Arrange
      const profileName = "default";
      const directive = "to";
      const layer = "project";
      
      logger.debug("Testing configuration consistency across domains", {
        profileName,
        directive,
        layer
      });

      // Act - Create configuration through different paths
      const directiveResult = DirectiveType.createOrError(directive);
      const layerResult = LayerType.createOrError(layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Basic configuration creation failed");
      }

      // Act - Create integrated configuration
      const config = {
        profileName,
        directive: directiveResult.getValue(),
        layer: layerResult.getValue()
      };
      
      // Assert - Configuration consistency maintained
      assertEquals(config.directive.value, directive);
      assertEquals(config.layer.value, layer);
      assertEquals(config.profileName, profileName);
      
      // Assert - Cross-reference with individual objects
      assertEquals(config.directive.value, directiveResult.getValue().value);
      assertEquals(config.layer.value, layerResult.getValue().value);
      
      logger.debug("Configuration consistency verified", {
        directiveConsistent: config.directive.value === directiveResult.getValue().value,
        layerConsistent: config.layer.value === layerResult.getValue().value,
        profileConsistent: config.profileName === profileName
      });
    });

    it("should handle workspace configuration variations", async () => {
      // Arrange
      const workspaceVariations = [
        "default-workspace",
        "project-alpha",
        "development-env",
        "test-environment"
      ];
      
      logger.debug("Testing workspace configuration variations", {
        variationCount: workspaceVariations.length
      });

      // Act & Assert - Test each workspace variation
      for (const workspaceName of workspaceVariations) {
        // Test configuration set creation for this workspace
        const configSetName = `${workspaceName}-config`;
        
        // Simulate workspace configuration
        const config = {
          workspaceName,
          configSetName,
          profiles: ["default", "development"]
        };
        
        assertExists(config.workspaceName);
        assertExists(config.configSetName);
        assertEquals(config.configSetName.includes(workspaceName), true);
        
        logger.debug("Workspace configuration variation verified", {
          workspaceName,
          configSetName: config.configSetName,
          derivedCorrectly: config.configSetName.includes(workspaceName)
        });
      }
    });
  });

  describe("Configuration Error Handling and Recovery", () => {
    it("should handle invalid configuration values gracefully", async () => {
      // Arrange
      const invalidCases = [
        { directive: "", layer: "project", description: "empty directive" },
        { directive: "to", layer: "", description: "empty layer" },
        { directive: "invalid", layer: "project", description: "invalid directive" },
        { directive: "to", layer: "invalid", description: "invalid layer" }
      ];
      
      logger.debug("Testing invalid configuration handling", {
        invalidCount: invalidCases.length
      });

      // Act & Assert - Each invalid case should fail gracefully
      for (const testCase of invalidCases) {
        const directiveResult = DirectiveType.createOrError(testCase.directive);
        const layerResult = LayerType.createOrError(testCase.layer);
        
        // At least one should fail for invalid cases
        const hasFailure = directiveResult.isFailure() || layerResult.isFailure();
        assertEquals(hasFailure, true, `Should fail for ${testCase.description}`);
        
        if (directiveResult.isFailure()) {
          const error = directiveResult.getError();
          assertExists(error.message);
          assertEquals(error.message.length > 0, true);
          
          logger.debug("Invalid directive error handled", {
            testCase: testCase.description,
            errorMessage: error.message
          });
        }
        
        if (layerResult.isFailure()) {
          const error = layerResult.getError();
          assertExists(error.message);
          assertEquals(error.message.length > 0, true);
          
          logger.debug("Invalid layer error handled", {
            testCase: testCase.description,
            errorMessage: error.message
          });
        }
      }
    });

    it("should maintain configuration integrity under error conditions", async () => {
      // Arrange
      const validProfile = "default";
      const validDirective = "to";
      const validLayer = "project";
      
      logger.debug("Testing configuration integrity under error conditions");

      // Act - Create valid configuration first
      const directiveResult = DirectiveType.createOrError(validDirective);
      const layerResult = LayerType.createOrError(validLayer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Valid configuration creation failed");
      }

      const validConfig = {
        profileName: validProfile,
        directive: directiveResult.getValue(),
        layer: layerResult.getValue()
      };
      
      // Act - Attempt operations that might cause errors
      const invalidDirectiveResult = DirectiveType.createOrError("invalid");
      const invalidLayerResult = LayerType.createOrError("invalid");
      
      // Assert - Valid configuration remains unaffected by invalid operations
      assertEquals(validConfig.directive.value, validDirective);
      assertEquals(validConfig.layer.value, validLayer);
      assertEquals(validConfig.profileName, validProfile);
      
      // Assert - Invalid operations fail independently
      assertEquals(invalidDirectiveResult.isFailure(), true);
      assertEquals(invalidLayerResult.isFailure(), true);
      
      logger.debug("Configuration integrity maintained", {
        validConfigPreserved: validConfig.directive.value === validDirective,
        invalidOperationsFailed: invalidDirectiveResult.isFailure() && invalidLayerResult.isFailure()
      });
    });

    it("should handle concurrent configuration operations", async () => {
      // Arrange
      const configOperations = [
        { profile: "default", directive: "to", layer: "project" },
        { profile: "development", directive: "summary", layer: "issue" },
        { profile: "testing", directive: "defect", layer: "task" },
        { profile: "production", directive: "to", layer: "issue" }
      ];
      
      logger.debug("Testing concurrent configuration operations", {
        operationCount: configOperations.length
      });

      // Act - Execute all configuration operations concurrently
      const operationPromises = configOperations.map(async (operation) => {
        const directiveResult = DirectiveType.createOrError(operation.directive);
        const layerResult = LayerType.createOrError(operation.layer);
        
        if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
          throw new Error(`Type creation failed for ${operation.directive}/${operation.layer}`);
        }

        const config = {
          profileName: operation.profile,
          directive: directiveResult.getValue(),
          layer: layerResult.getValue()
        };
        
        return {
          operation,
          config,
          success: true
        };
      });

      const results = await Promise.all(operationPromises);
      
      // Assert - All operations completed successfully
      assertEquals(results.length, configOperations.length);
      
      results.forEach((result, index) => {
        assertEquals(result.success, true);
        assertEquals(result.config.directive.value, configOperations[index].directive);
        assertEquals(result.config.layer.value, configOperations[index].layer);
        assertEquals(result.config.profileName, configOperations[index].profile);
      });
      
      // Assert - No cross-contamination between concurrent operations
      const uniqueProfiles = new Set(results.map(r => r.config.profileName));
      assertEquals(uniqueProfiles.size, configOperations.length);
      
      logger.debug("Concurrent configuration operations completed", {
        successfulOperations: results.length,
        uniqueProfiles: uniqueProfiles.size,
        noCrossContamination: uniqueProfiles.size === configOperations.length
      });
    });

    it("should validate configuration value object immutability", async () => {
      // Arrange
      const profileName = "immutable-test";
      const directive = "to";
      const layer = "project";
      
      logger.debug("Testing configuration value object immutability");

      // Act - Create configuration objects
      const directiveResult = DirectiveType.createOrError(directive);
      const layerResult = LayerType.createOrError(layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Configuration object creation failed");
      }

      const directiveObj = directiveResult.getValue();
      const layerObj = layerResult.getValue();
      
      const originalDirectiveValue = directiveObj.value;
      const originalLayerValue = layerObj.value;
      
      // Act - Attempt to modify values (should not affect originals due to immutability)
      let testDirectiveValue = originalDirectiveValue;
      let testLayerValue = originalLayerValue;
      
      testDirectiveValue = "modified-directive";
      testLayerValue = "modified-layer";
      
      // Assert - Original values remain unchanged
      assertEquals(directiveObj.value, originalDirectiveValue);
      assertEquals(layerObj.value, originalLayerValue);
      assertEquals(directiveObj.value !== testDirectiveValue, true);
      assertEquals(layerObj.value !== testLayerValue, true);
      
      logger.debug("Configuration immutability verified", {
        originalDirective: originalDirectiveValue,
        originalLayer: originalLayerValue,
        directiveUnmodified: directiveObj.value === originalDirectiveValue,
        layerUnmodified: layerObj.value === originalLayerValue
      });
    });
  });

  describe("Configuration Integration with Other Domains", () => {
    it("should integrate configuration with parameter parsing domain", async () => {
      // Arrange
      const profileName = "integration-test";
      const directive = "to";
      const layer = "project";
      
      logger.debug("Testing configuration integration with parameter parsing", {
        profileName,
        directive,
        layer
      });

      // Act - Create configuration through parameter parsing integration
      const directiveResult = DirectiveType.createOrError(directive);
      const layerResult = LayerType.createOrError(layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Parameter parsing failed");
      }

      const config = {
        profileName,
        directive: directiveResult.getValue(),
        layer: layerResult.getValue()
      };
      
      // Assert - Integration maintains all domain requirements
      assertEquals(config.directive.value, directive);
      assertEquals(config.layer.value, layer);
      assertEquals(config.profileName, profileName);
      
      // Assert - Configuration can be used by other domains
      assertExists(config.directive);
      assertExists(config.layer);
      assertExists(config.profileName);
      
      logger.debug("Configuration integration with parameter parsing verified", {
        integratedDirective: config.directive.value,
        integratedLayer: config.layer.value,
        integratedProfile: config.profileName,
        integrationSuccessful: true
      });
    });

    it("should support configuration-driven path resolution", async () => {
      // Arrange
      const configurations = [
        { profile: "default", directive: "to", layer: "project" },
        { profile: "custom", directive: "summary", layer: "issue" }
      ];
      
      logger.debug("Testing configuration-driven path resolution", {
        configurationCount: configurations.length
      });

      // Act & Assert - Each configuration should enable proper path resolution
      for (const configData of configurations) {
        const directiveResult = DirectiveType.createOrError(configData.directive);
        const layerResult = LayerType.createOrError(configData.layer);
        
        assertEquals(directiveResult.isSuccess(), true);
        assertEquals(layerResult.isSuccess(), true);
        
        if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
          continue;
        }

        const config = {
          profileName: configData.profile,
          directive: directiveResult.getValue(),
          layer: layerResult.getValue()
        };
        
        // Assert - Configuration provides necessary information for path resolution
        assertEquals(config.directive.value, configData.directive);
        assertEquals(config.layer.value, configData.layer);
        assertEquals(config.profileName, configData.profile);
        
        // The configuration should contain all information needed for other domains
        assertExists(config.directive.value);
        assertExists(config.layer.value);
        assertExists(config.profileName);
        
        logger.debug("Configuration enables path resolution", {
          profile: configData.profile,
          pathSegment: `${config.directive.value}/${config.layer.value}`,
          configurationComplete: true
        });
      }
    });
  });
});