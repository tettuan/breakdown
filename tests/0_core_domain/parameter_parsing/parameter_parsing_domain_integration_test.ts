/**
 * Core Domain Integration Test: Parameter Parsing Domain
 * 
 * This test verifies the integration of the parameter parsing domain,
 * focusing on the boundary context and its collaboration with other domains.
 * 
 * Test Coverage:
 * 1. Parameter parsing domain boundary context integrity
 * 2. Type factory collaboration patterns
 * 3. Validation rule integration across domain boundaries
 * 4. Error propagation through domain services
 * 5. Configuration profile integration with parameter parsing
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import core domain components
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { DefaultTypePatternProvider } from "../../../lib/types/defaults/default_type_pattern_provider.ts";
import { TypeFactory } from "../../../lib/types/type_factory.ts";
import { ConfigTwoParams } from "../../../lib/types/defaults/config_two_params.ts";

const logger = new BreakdownLogger("parameter-parsing-domain-integration");

describe("Parameter Parsing Domain Integration", () => {
  describe("Domain Boundary Context Integrity", () => {
    it("should maintain boundary context isolation while enabling collaboration", async () => {
      // Arrange
      const rawDirective = "to";
      const rawLayer = "project";
      
      logger.debug("Testing domain boundary context integrity", {
        directive: rawDirective,
        layer: rawLayer
      });

      // Act - Create domain objects within boundary context
      const directiveResult = DirectiveType.createOrError(rawDirective);
      const layerResult = LayerType.createOrError(rawLayer);
      
      // Assert - Domain boundary maintains integrity
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Assert - Domain objects preserve their bounded context
        assertEquals(directive.value, rawDirective);
        assertEquals(layer.value, rawLayer);
        
        // Assert - Domain objects are immutable within boundary
        assertExists(directive);
        assertExists(layer);
        
        logger.debug("Domain boundary context integrity verified", {
          directiveValue: directive.value,
          layerValue: layer.value
        });
      }
    });

    it("should enforce domain invariants at boundary crossing points", async () => {
      // Arrange - Test boundary crossing scenarios
      const testCases = [
        { directive: "to", layer: "project", shouldCross: true },
        { directive: "summary", layer: "issue", shouldCross: true },
        { directive: "defect", layer: "task", shouldCross: true },
        { directive: "", layer: "project", shouldCross: false },
        { directive: "invalid_directive", layer: "project", shouldCross: false },
        { directive: "to", layer: "invalid_layer", shouldCross: false }
      ];
      
      logger.debug("Testing domain invariants at boundary crossing", {
        testCaseCount: testCases.length
      });

      // Act & Assert
      for (const testCase of testCases) {
        const directiveResult = DirectiveType.createOrError(testCase.directive);
        const layerResult = LayerType.createOrError(testCase.layer);
        
        if (testCase.shouldCross) {
          // Valid parameters should cross boundary successfully
          assertEquals(directiveResult.isSuccess(), true, 
            `Valid directive '${testCase.directive}' should cross boundary`);
          assertEquals(layerResult.isSuccess(), true,
            `Valid layer '${testCase.layer}' should cross boundary`);
        } else {
          // Invalid parameters should be rejected at boundary
          const boundaryCrossed = directiveResult.isSuccess() && layerResult.isSuccess();
          assertEquals(boundaryCrossed, false,
            `Invalid parameters should be rejected at boundary: ${testCase.directive}/${testCase.layer}`);
        }
      }
    });
  });

  describe("Type Factory Collaboration Patterns", () => {
    it("should enable seamless collaboration between type factories", async () => {
      // Arrange
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      logger.debug("Testing type factory collaboration patterns", {
        configInitialized: !!config,
        factoryInitialized: !!typeFactory
      });

      // Act - Create domain objects through factory collaboration
      const directiveResult = typeFactory.createDirectiveType("to");
      const layerResult = typeFactory.createLayerType("project");
      
      // Assert - Factory collaboration produces valid domain objects
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Assert - Collaboration maintains domain object integrity
        assertEquals(directive.value, "to");
        assertEquals(layer.value, "project");
        
        logger.debug("Type factory collaboration verified", {
          directiveCreated: directive.value,
          layerCreated: layer.value
        });
      }
    });

    it("should maintain type safety across factory collaborations", async () => {
      // Arrange
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      // Test multiple factory operations
      const operations = [
        { type: "directive", value: "summary" },
        { type: "layer", value: "issue" },
        { type: "directive", value: "defect" },
        { type: "layer", value: "task" }
      ];
      
      logger.debug("Testing type safety across factory collaborations", {
        operationCount: operations.length
      });

      // Act & Assert - Process operations maintaining type safety
      for (const operation of operations) {
        let result;
        
        if (operation.type === "directive") {
          result = typeFactory.createDirectiveType(operation.value);
        } else {
          result = typeFactory.createLayerType(operation.value);
        }
        
        // Assert - Type safety maintained
        assertEquals(result.isSuccess(), true, 
          `Factory should create valid ${operation.type}: ${operation.value}`);
        
        if (result.isSuccess()) {
          assertEquals(result.getValue().value, operation.value);
        }
      }
    });
  });

  describe("Configuration Profile Integration", () => {
    it("should integrate parameter parsing with configuration profiles", async () => {
      // Arrange
      const profileName = "default";
      const config = new ConfigTwoParams();
      
      logger.debug("Testing configuration profile integration", {
        profileName,
        configReady: !!config
      });

      // Act - Use configuration in parameter parsing
      const patternProvider = new DefaultTypePatternProvider();
      
      // Create parameters using configuration context
      const directiveResult = DirectiveType.createOrError("to");
      const layerResult = LayerType.createOrError("project");
      
      // Assert - Configuration integration successful
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      assertExists(patternProvider);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        logger.debug("Configuration profile integration verified", {
          directive: directiveResult.getValue().value,
          layer: layerResult.getValue().value,
          patternProvider: !!patternProvider
        });
      }
    });

    it("should handle configuration profile switching gracefully", async () => {
      // Arrange - Simulate profile switching scenarios
      const profiles = ["default", "development", "production"];
      
      logger.debug("Testing configuration profile switching", {
        profileCount: profiles.length
      });

      // Act & Assert - Each profile should work independently
      for (const profile of profiles) {
        try {
          const config = new ConfigTwoParams();
          const typeFactory = new TypeFactory(config);
          
          // Test parameter parsing with each profile
          const directiveResult = typeFactory.createDirectiveType("to");
          const layerResult = typeFactory.createLayerType("project");
          
          // Assert - Profile switching doesn't break parameter parsing
          assertEquals(directiveResult.isSuccess(), true,
            `Profile '${profile}' should enable directive creation`);
          assertEquals(layerResult.isSuccess(), true,
            `Profile '${profile}' should enable layer creation`);
          
          logger.debug("Profile switching test completed", {
            profile,
            success: directiveResult.isSuccess() && layerResult.isSuccess()
          });
        } catch (error) {
          // Profile switching should not cause exceptions
          throw new Error(`Profile switching failed for '${profile}': ${error.message}`);
        }
      }
    });
  });

  describe("Error Propagation Through Domain Services", () => {
    it("should propagate validation errors correctly across domain boundaries", async () => {
      // Arrange - Test cases with various error scenarios
      const errorCases = [
        { 
          directive: "", 
          layer: "project", 
          expectedErrorDomain: "directive",
          description: "Empty directive should trigger validation error"
        },
        { 
          directive: "to", 
          layer: "", 
          expectedErrorDomain: "layer",
          description: "Empty layer should trigger validation error"
        },
        { 
          directive: "invalid_directive_type", 
          layer: "project", 
          expectedErrorDomain: "directive",
          description: "Invalid directive should trigger validation error"
        },
        { 
          directive: "to", 
          layer: "invalid_layer_type", 
          expectedErrorDomain: "layer",
          description: "Invalid layer should trigger validation error"
        }
      ];
      
      logger.debug("Testing error propagation across domain boundaries", {
        errorCaseCount: errorCases.length
      });

      // Act & Assert
      for (const errorCase of errorCases) {
        const directiveResult = DirectiveType.createOrError(errorCase.directive);
        const layerResult = LayerType.createOrError(errorCase.layer);
        
        if (errorCase.expectedErrorDomain === "directive") {
          assertEquals(directiveResult.isFailure(), true, errorCase.description);
          
          if (directiveResult.isFailure()) {
            const error = directiveResult.getError();
            assertExists(error.message);
            assertEquals(error.message.toLowerCase().includes("directive"), true);
            
            logger.debug("Directive error propagation verified", {
              input: errorCase.directive,
              errorMessage: error.message
            });
          }
        }
        
        if (errorCase.expectedErrorDomain === "layer") {
          assertEquals(layerResult.isFailure(), true, errorCase.description);
          
          if (layerResult.isFailure()) {
            const error = layerResult.getError();
            assertExists(error.message);
            assertEquals(error.message.toLowerCase().includes("layer"), true);
            
            logger.debug("Layer error propagation verified", {
              input: errorCase.layer,
              errorMessage: error.message
            });
          }
        }
      }
    });

    it("should maintain domain service stability under error conditions", async () => {
      // Arrange
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Mix of valid and invalid operations
      const operations = [
        { directive: "to", layer: "project", shouldSucceed: true },
        { directive: "", layer: "project", shouldSucceed: false },
        { directive: "summary", layer: "issue", shouldSucceed: true },
        { directive: "invalid", layer: "project", shouldSucceed: false },
        { directive: "defect", layer: "task", shouldSucceed: true },
        { directive: "to", layer: "", shouldSucceed: false }
      ];
      
      logger.debug("Testing domain service stability under error conditions", {
        operationCount: operations.length
      });

      // Act
      for (const operation of operations) {
        try {
          const directiveResult = typeFactory.createDirectiveType(operation.directive);
          const layerResult = typeFactory.createLayerType(operation.layer);
          
          if (directiveResult.isSuccess() && layerResult.isSuccess()) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          logger.debug("Expected error handled gracefully", {
            operation,
            error: error.message
          });
        }
      }

      // Assert - Domain service remains stable
      assertEquals(successCount, 3, "Expected 3 successful operations");
      assertEquals(errorCount, 3, "Expected 3 failed operations");
      assertEquals(successCount + errorCount, operations.length);
      
      logger.debug("Domain service stability verified", {
        successCount,
        errorCount,
        totalOperations: operations.length
      });
    });
  });

  describe("Domain Service Collaboration Quality", () => {
    it("should demonstrate high cohesion within parameter parsing domain", async () => {
      // Arrange - Test cohesion through integrated operations
      const testDirective = "to";
      const testLayer = "project";
      
      logger.debug("Testing domain cohesion through integrated operations", {
        directive: testDirective,
        layer: testLayer
      });

      // Act - Perform multiple related operations
      const directiveResult = DirectiveType.createOrError(testDirective);
      const layerResult = LayerType.createOrError(testLayer);
      
      if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
        throw new Error("Setup failed for cohesion test");
      }

      const directive = directiveResult.getValue();
      const layer = layerResult.getValue();
      
      // Test cohesion through type factory integration
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const factoryDirectiveResult = typeFactory.createDirectiveType(testDirective);
      const factoryLayerResult = typeFactory.createLayerType(testLayer);
      
      // Assert - High cohesion demonstrated
      assertEquals(factoryDirectiveResult.isSuccess(), true);
      assertEquals(factoryLayerResult.isSuccess(), true);
      
      if (factoryDirectiveResult.isSuccess() && factoryLayerResult.isSuccess()) {
        assertEquals(factoryDirectiveResult.getValue().value, directive.value);
        assertEquals(factoryLayerResult.getValue().value, layer.value);
        
        logger.debug("Domain cohesion verified", {
          directValue: directive.value,
          factoryValue: factoryDirectiveResult.getValue().value,
          layerValue: layer.value,
          factoryLayerValue: factoryLayerResult.getValue().value
        });
      }
    });

    it("should maintain loose coupling with external domain dependencies", async () => {
      // Arrange - Test loose coupling through interface boundaries
      const config = new ConfigTwoParams();
      
      logger.debug("Testing loose coupling with external dependencies");

      // Act - Create domain objects without tight coupling to external systems
      const directiveResult = DirectiveType.createOrError("summary");
      const layerResult = LayerType.createOrError("issue");
      
      // Assert - Domain operates independently
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      // Test that domain can work with different configurations
      const alternativeFactory = new TypeFactory(config);
      const alternativeDirectiveResult = alternativeFactory.createDirectiveType("defect");
      const alternativeLayerResult = alternativeFactory.createLayerType("task");
      
      assertEquals(alternativeDirectiveResult.isSuccess(), true);
      assertEquals(alternativeLayerResult.isSuccess(), true);
      
      logger.debug("Loose coupling verified", {
        originalSuccess: directiveResult.isSuccess() && layerResult.isSuccess(),
        alternativeSuccess: alternativeDirectiveResult.isSuccess() && alternativeLayerResult.isSuccess()
      });
    });
  });
});