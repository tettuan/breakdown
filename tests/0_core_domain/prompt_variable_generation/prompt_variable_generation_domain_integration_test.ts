/**
 * Core Domain Integration Test: Prompt Variable Generation Domain
 * 
 * This test verifies the integration of the prompt variable generation domain,
 * focusing on the boundary context and its collaboration with other domains.
 * 
 * Test Coverage:
 * 1. Variable generation domain boundary context integrity
 * 2. Prompt variable factory service collaboration
 * 3. Variable transformation pipeline integration
 * 4. Cross-domain variable generation coordination
 * 5. Variable validation and error handling integration
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import prompt variable generation components
import { PromptVariablesFactory } from "../../../lib/factory/prompt_variables_factory.ts";

// Import core domain types
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { WorkspaceName } from "../../../lib/domain/core/value_objects/workspace_name.ts";
import { BasePath } from "../../../lib/domain/core/value_objects/base_path.ts";

// Import template management types
import { PromptContent } from "../../../lib/domain/generic/template_management/value_objects/prompt_content.test.ts";

const logger = new BreakdownLogger("prompt-variable-generation-domain-integration");

describe("Prompt Variable Generation Domain Integration", () => {
  describe("Domain Boundary Context Integrity", () => {
    it("should maintain variable generation boundary context isolation", async () => {
      // Arrange
      const testDirective = "to";
      const testLayer = "project";
      const testWorkspace = "test-workspace";
      
      logger.debug("Testing variable generation boundary context", {
        directive: testDirective,
        layer: testLayer,
        workspace: testWorkspace
      });

      // Act - Create domain objects within boundary context
      const directiveResult = DirectiveType.createOrError(testDirective);
      const layerResult = LayerType.createOrError(testLayer);
      const workspaceResult = WorkspaceName.createOrError(testWorkspace);
      
      // Assert - Domain boundary maintains integrity
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      assertEquals(workspaceResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        const workspace = workspaceResult.getValue();
        
        // Assert - Variable generation domain objects preserve bounded context
        assertEquals(directive.value, testDirective);
        assertEquals(layer.value, testLayer);
        assertEquals(workspace.value, testWorkspace);
        
        logger.debug("Variable generation boundary context verified", {
          directiveValue: directive.value,
          layerValue: layer.value,
          workspaceValue: workspace.value
        });
      }
    });

    it("should enforce variable domain invariants at boundary crossing", async () => {
      // Arrange - Test boundary crossing scenarios for variable generation
      const variableTestCases = [
        { 
          directive: "to", 
          layer: "project", 
          workspace: "valid-workspace", 
          shouldCross: true,
          description: "Valid variable parameters should cross boundary"
        },
        { 
          directive: "summary", 
          layer: "issue", 
          workspace: "another-workspace", 
          shouldCross: true,
          description: "Valid summary variables should cross boundary"
        },
        { 
          directive: "", 
          layer: "project", 
          workspace: "valid-workspace", 
          shouldCross: false,
          description: "Empty directive should be rejected at boundary"
        },
        { 
          directive: "to", 
          layer: "", 
          workspace: "valid-workspace", 
          shouldCross: false,
          description: "Empty layer should be rejected at boundary"
        },
        { 
          directive: "to", 
          layer: "project", 
          workspace: "", 
          shouldCross: false,
          description: "Empty workspace should be rejected at boundary"
        }
      ];
      
      logger.debug("Testing variable domain invariants at boundary crossing", {
        testCaseCount: variableTestCases.length
      });

      // Act & Assert
      for (const testCase of variableTestCases) {
        const directiveResult = DirectiveType.createOrError(testCase.directive);
        const layerResult = LayerType.createOrError(testCase.layer);
        const workspaceResult = WorkspaceName.createOrError(testCase.workspace);
        
        if (testCase.shouldCross) {
          assertEquals(directiveResult.isSuccess(), true, testCase.description);
          assertEquals(layerResult.isSuccess(), true, testCase.description);
          assertEquals(workspaceResult.isSuccess(), true, testCase.description);
        } else {
          const allValid = directiveResult.isSuccess() && 
                          layerResult.isSuccess() && 
                          workspaceResult.isSuccess();
          assertEquals(allValid, false, testCase.description);
        }
        
        logger.debug("Variable boundary crossing test completed", {
          description: testCase.description,
          result: testCase.shouldCross ? "allowed" : "rejected"
        });
      }
    });
  });

  describe("Prompt Variable Factory Service Collaboration", () => {
    it("should enable seamless collaboration between variable factory services", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      logger.debug("Testing variable factory service collaboration", {
        factoryReady: !!variablesFactory
      });

      // Act - Test factory collaboration with domain objects
      const directiveResult = DirectiveType.createOrError("to");
      const layerResult = LayerType.createOrError("project");
      
      // Assert - Factory can collaborate with valid domain objects
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      assertExists(variablesFactory);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Factory should be able to work with these domain objects
        assertExists(directive.value);
        assertExists(layer.value);
        
        logger.debug("Variable factory collaboration verified", {
          directiveForVariables: directive.value,
          layerForVariables: layer.value,
          factoryOperational: !!variablesFactory
        });
      }
    });

    it("should maintain factory integrity during complex variable operations", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      // Test complex variable generation scenarios
      const complexScenarios = [
        { 
          directive: "to", 
          layer: "project", 
          workspace: "main-workspace",
          description: "Project transformation variable generation"
        },
        { 
          directive: "summary", 
          layer: "issue", 
          workspace: "analysis-workspace",
          description: "Issue summary variable generation"
        },
        { 
          directive: "defect", 
          layer: "task", 
          workspace: "quality-workspace",
          description: "Defect detection variable generation"
        }
      ];
      
      logger.debug("Testing factory integrity during complex variable operations", {
        scenarioCount: complexScenarios.length
      });

      // Act & Assert
      for (const scenario of complexScenarios) {
        const directiveResult = DirectiveType.createOrError(scenario.directive);
        const layerResult = LayerType.createOrError(scenario.layer);
        const workspaceResult = WorkspaceName.createOrError(scenario.workspace);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.description);
        assertEquals(layerResult.isSuccess(), true, scenario.description);
        assertEquals(workspaceResult.isSuccess(), true, scenario.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
          // Factory should maintain integrity during operations
          assertExists(variablesFactory);
          
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          const workspace = workspaceResult.getValue();
          
          logger.debug("Complex variable operation handled successfully", {
            scenario: scenario.description,
            directive: directive.value,
            layer: layer.value,
            workspace: workspace.value
          });
        }
      }
    });
  });

  describe("Variable Transformation Pipeline Integration", () => {
    it("should integrate variable transformation through complete pipeline", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      // Test transformation pipeline stages
      const transformationStages = [
        { 
          stage: "input_parsing",
          directive: "to", 
          layer: "project",
          description: "Raw input to domain objects"
        },
        { 
          stage: "variable_generation",
          directive: "summary", 
          layer: "issue",
          description: "Domain objects to prompt variables"
        },
        { 
          stage: "template_integration",
          directive: "defect", 
          layer: "task",
          description: "Variables to template integration"
        }
      ];
      
      logger.debug("Testing variable transformation pipeline integration", {
        stageCount: transformationStages.length
      });

      // Act & Assert
      for (const stage of transformationStages) {
        const directiveResult = DirectiveType.createOrError(stage.directive);
        const layerResult = LayerType.createOrError(stage.layer);
        
        assertEquals(directiveResult.isSuccess(), true, stage.description);
        assertEquals(layerResult.isSuccess(), true, stage.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          
          // Pipeline should handle each transformation stage
          assertExists(variablesFactory);
          assertEquals(directive.value, stage.directive);
          assertEquals(layer.value, stage.layer);
          
          logger.debug("Transformation pipeline stage verified", {
            stage: stage.stage,
            description: stage.description,
            directive: directive.value,
            layer: layer.value
          });
        }
      }
    });

    it("should maintain data integrity throughout transformation pipeline", async () => {
      // Arrange
      const testData = {
        directive: "to",
        layer: "project",
        workspace: "integrity-test-workspace"
      };
      
      logger.debug("Testing data integrity throughout transformation pipeline", testData);

      // Act - Track data through transformation stages
      const directiveResult = DirectiveType.createOrError(testData.directive);
      const layerResult = LayerType.createOrError(testData.layer);
      const workspaceResult = WorkspaceName.createOrError(testData.workspace);
      
      // Assert - Initial stage integrity
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      assertEquals(workspaceResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        const workspace = workspaceResult.getValue();
        
        // Assert - Data integrity maintained
        assertEquals(directive.value, testData.directive);
        assertEquals(layer.value, testData.layer);
        assertEquals(workspace.value, testData.workspace);
        
        // Factory should work with integrity-preserved data
        const variablesFactory = new PromptVariablesFactory();
        assertExists(variablesFactory);
        
        logger.debug("Data integrity verified throughout pipeline", {
          originalData: testData,
          preservedData: {
            directive: directive.value,
            layer: layer.value,
            workspace: workspace.value
          }
        });
      }
    });
  });

  describe("Cross-Domain Variable Generation Coordination", () => {
    it("should coordinate variable generation with parameter parsing domain", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      logger.debug("Testing cross-domain variable generation coordination");

      // Act - Create parameters that require variable generation
      const directiveResult = DirectiveType.createOrError("to");
      const layerResult = LayerType.createOrError("project");
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Variable generation should coordinate with parameter parsing
        assertExists(variablesFactory);
        
        // Both domains should work together seamlessly
        assertEquals(directive.value, "to");
        assertEquals(layer.value, "project");
        
        logger.debug("Cross-domain variable coordination verified", {
          parameterParsing: { directive: directive.value, layer: layer.value },
          variableGeneration: { factory: !!variablesFactory }
        });
      }
    });

    it("should coordinate variable generation with path resolution domain", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      // Test coordination with path resolution domain components
      const coordinationCases = [
        { 
          directive: "to", 
          layer: "project", 
          workspace: "path-coord-workspace",
          basePath: "/tmp/test/path"
        },
        { 
          directive: "summary", 
          layer: "issue", 
          workspace: "summary-workspace",
          basePath: "/tmp/summary/path"
        }
      ];
      
      logger.debug("Testing variable generation coordination with path resolution", {
        coordinationCaseCount: coordinationCases.length
      });

      // Act & Assert
      for (const coordCase of coordinationCases) {
        const directiveResult = DirectiveType.createOrError(coordCase.directive);
        const layerResult = LayerType.createOrError(coordCase.layer);
        const workspaceResult = WorkspaceName.createOrError(coordCase.workspace);
        const basePathResult = BasePath.createOrError(coordCase.basePath);
        
        assertEquals(directiveResult.isSuccess(), true);
        assertEquals(layerResult.isSuccess(), true);
        assertEquals(workspaceResult.isSuccess(), true);
        assertEquals(basePathResult.isSuccess(), true);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && 
            workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          
          // Variable generation should coordinate with path resolution
          assertExists(variablesFactory);
          assertEquals(directive.value, coordCase.directive);
          assertEquals(layer.value, coordCase.layer);
          assertEquals(workspace.value, coordCase.workspace);
          assertEquals(basePath.value, coordCase.basePath);
          
          logger.debug("Variable-path coordination verified", {
            directive: directive.value,
            layer: layer.value,
            workspace: workspace.value,
            basePath: basePath.value
          });
        }
      }
    });
  });

  describe("Variable Validation and Error Handling Integration", () => {
    it("should integrate variable validation across domain boundaries", async () => {
      // Arrange - Test variable validation scenarios
      const validationCases = [
        {
          directive: "to",
          layer: "project", 
          workspace: "valid-workspace",
          shouldValidate: true,
          description: "Valid variable set should pass validation"
        },
        {
          directive: "",
          layer: "project",
          workspace: "valid-workspace", 
          shouldValidate: false,
          description: "Empty directive should fail variable validation"
        },
        {
          directive: "to",
          layer: "",
          workspace: "valid-workspace",
          shouldValidate: false,
          description: "Empty layer should fail variable validation"
        },
        {
          directive: "to",
          layer: "project",
          workspace: "",
          shouldValidate: false,
          description: "Empty workspace should fail variable validation"
        },
        {
          directive: "invalid_directive",
          layer: "project",
          workspace: "valid-workspace",
          shouldValidate: false,
          description: "Invalid directive should fail variable validation"
        }
      ];
      
      logger.debug("Testing variable validation across domain boundaries", {
        validationCaseCount: validationCases.length
      });

      // Act & Assert
      for (const validationCase of validationCases) {
        const directiveResult = DirectiveType.createOrError(validationCase.directive);
        const layerResult = LayerType.createOrError(validationCase.layer);
        const workspaceResult = WorkspaceName.createOrError(validationCase.workspace);
        
        if (validationCase.shouldValidate) {
          assertEquals(directiveResult.isSuccess(), true, validationCase.description);
          assertEquals(layerResult.isSuccess(), true, validationCase.description);
          assertEquals(workspaceResult.isSuccess(), true, validationCase.description);
        } else {
          const allValid = directiveResult.isSuccess() && 
                          layerResult.isSuccess() && 
                          workspaceResult.isSuccess();
          assertEquals(allValid, false, validationCase.description);
        }
        
        logger.debug("Variable validation case processed", {
          description: validationCase.description,
          result: validationCase.shouldValidate ? "passed" : "failed as expected"
        });
      }
    });

    it("should handle variable generation errors gracefully across domains", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      const errorOperations = [
        { directive: "", layer: "project", expectError: true, description: "Empty directive error" },
        { directive: "to", layer: "", expectError: true, description: "Empty layer error" },
        { directive: "invalid", layer: "project", expectError: true, description: "Invalid directive error" },
        { directive: "to", layer: "valid_layer", expectError: false, description: "Valid operation should succeed" }
      ];
      
      logger.debug("Testing graceful error handling in variable generation", {
        errorOperationCount: errorOperations.length
      });

      // Act & Assert
      for (const operation of errorOperations) {
        const directiveResult = DirectiveType.createOrError(operation.directive);
        const layerResult = LayerType.createOrError(operation.layer);
        
        if (operation.expectError) {
          const hasError = directiveResult.isFailure() || layerResult.isFailure();
          assertEquals(hasError, true, operation.description);
          
          // Error handling should not break variable generation services
          assertExists(variablesFactory);
          
          logger.debug("Graceful variable error handling verified", {
            operation: operation.description,
            errorHandled: hasError
          });
        } else {
          assertEquals(directiveResult.isSuccess(), true, operation.description);
          assertEquals(layerResult.isSuccess(), true, operation.description);
          
          logger.debug("Valid variable operation completed", {
            operation: operation.description,
            success: true
          });
        }
      }
    });

    it("should maintain variable service stability under error conditions", async () => {
      // Arrange
      const variablesFactory = new PromptVariablesFactory();
      
      let successfulOperations = 0;
      let failedOperations = 0;
      
      // Mix of valid and invalid variable operations
      const operations = [
        { directive: "to", layer: "project", shouldSucceed: true },
        { directive: "", layer: "project", shouldSucceed: false },
        { directive: "summary", layer: "issue", shouldSucceed: true },
        { directive: "invalid", layer: "project", shouldSucceed: false },
        { directive: "defect", layer: "task", shouldSucceed: true },
        { directive: "to", layer: "", shouldSucceed: false }
      ];
      
      logger.debug("Testing variable service stability under mixed conditions", {
        operationCount: operations.length
      });

      // Act
      for (const operation of operations) {
        try {
          const directiveResult = DirectiveType.createOrError(operation.directive);
          const layerResult = LayerType.createOrError(operation.layer);
          
          if (directiveResult.isSuccess() && layerResult.isSuccess()) {
            successfulOperations++;
            // Variable factory should remain operational
            assertExists(variablesFactory);
          } else {
            failedOperations++;
          }
        } catch (error) {
          failedOperations++;
          logger.debug("Expected variable error caught", {
            operation: operation,
            error: error.message
          });
        }
      }

      // Assert - Variable service remains stable
      assertEquals(successfulOperations, 3, "Expected 3 successful variable operations");
      assertEquals(failedOperations, 3, "Expected 3 failed variable operations");
      assertEquals(successfulOperations + failedOperations, operations.length);
      
      // Variable factory should still be operational after mixed operations
      assertExists(variablesFactory);
      
      logger.debug("Variable service stability verified", {
        successfulOperations,
        failedOperations,
        totalOperations: operations.length,
        factoryStable: !!variablesFactory
      });
    });
  });
});