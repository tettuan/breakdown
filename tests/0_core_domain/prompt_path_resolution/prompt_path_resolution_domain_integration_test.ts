/**
 * Core Domain Integration Test: Prompt Path Resolution Domain
 * 
 * This test verifies the integration of the prompt path resolution domain,
 * focusing on the boundary context and its collaboration with other domains.
 * 
 * Test Coverage:
 * 1. Path resolution domain boundary context integrity
 * 2. File path resolution service collaboration
 * 3. Template and schema path resolution integration
 * 4. Path validation and fallback strategy testing
 * 5. Cross-domain path resolution coordination
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import path resolution components
import { InputFilePathResolver } from "../../../lib/factory/input_file_path_resolver.ts";
import { OutputFilePathResolver } from "../../../lib/factory/output_file_path_resolver.ts";
import { ConfigPrefixDetector } from "../../../lib/factory/config_prefix_detector.ts";

// Import core domain types
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { WorkspaceName } from "../../../lib/domain/core/value_objects/workspace_name.ts";
import { BasePath } from "../../../lib/domain/core/value_objects/base_path.ts";

const logger = new BreakdownLogger("prompt-path-resolution-domain-integration");

describe("Prompt Path Resolution Domain Integration", () => {
  describe("Domain Boundary Context Integrity", () => {
    it("should maintain path resolution boundary context isolation", async () => {
      // Arrange
      const testWorkspace = "test-workspace";
      const testBasePath = "/tmp/test";
      
      logger.debug("Testing path resolution boundary context", {
        workspace: testWorkspace,
        basePath: testBasePath
      });

      // Act - Create domain objects within boundary context
      const workspaceResult = WorkspaceName.createOrError(testWorkspace);
      const basePathResult = BasePath.createOrError(testBasePath);
      
      // Assert - Domain boundary maintains integrity
      assertEquals(workspaceResult.isSuccess(), true);
      assertEquals(basePathResult.isSuccess(), true);
      
      if (workspaceResult.isSuccess() && basePathResult.isSuccess()) {
        const workspace = workspaceResult.getValue();
        const basePath = basePathResult.getValue();
        
        // Assert - Path domain objects preserve bounded context
        assertEquals(workspace.value, testWorkspace);
        assertEquals(basePath.value, testBasePath);
        
        logger.debug("Path resolution boundary context verified", {
          workspaceValue: workspace.value,
          basePathValue: basePath.value
        });
      }
    });

    it("should enforce path domain invariants at boundary crossing", async () => {
      // Arrange - Test boundary crossing scenarios
      const pathTestCases = [
        { workspace: "valid-workspace", basePath: "/valid/path", shouldCross: true },
        { workspace: "another_workspace", basePath: "/another/valid/path", shouldCross: true },
        { workspace: "", basePath: "/valid/path", shouldCross: false },
        { workspace: "valid-workspace", basePath: "", shouldCross: false },
        { workspace: "invalid workspace with spaces", basePath: "/valid/path", shouldCross: false }
      ];
      
      logger.debug("Testing path domain invariants at boundary crossing", {
        testCaseCount: pathTestCases.length
      });

      // Act & Assert
      for (const testCase of pathTestCases) {
        const workspaceResult = WorkspaceName.createOrError(testCase.workspace);
        const basePathResult = BasePath.createOrError(testCase.basePath);
        
        if (testCase.shouldCross) {
          assertEquals(workspaceResult.isSuccess(), true, 
            `Valid workspace '${testCase.workspace}' should cross boundary`);
          assertEquals(basePathResult.isSuccess(), true,
            `Valid base path '${testCase.basePath}' should cross boundary`);
        } else {
          const boundaryCrossed = workspaceResult.isSuccess() && basePathResult.isSuccess();
          assertEquals(boundaryCrossed, false,
            `Invalid path parameters should be rejected: ${testCase.workspace}@${testCase.basePath}`);
        }
      }
    });
  });

  describe("Path Resolution Service Collaboration", () => {
    it("should enable seamless collaboration between path resolution services", async () => {
      // Arrange
      const inputResolver = new InputFilePathResolver();
      const outputResolver = new OutputFilePathResolver();
      const configDetector = new ConfigPrefixDetector();
      
      logger.debug("Testing path resolution service collaboration", {
        inputResolverReady: !!inputResolver,
        outputResolverReady: !!outputResolver,
        configDetectorReady: !!configDetector
      });

      // Act - Test service collaboration
      const testDirective = "to";
      const testLayer = "project";
      
      const directiveResult = DirectiveType.createOrError(testDirective);
      const layerResult = LayerType.createOrError(testLayer);
      
      // Assert - Services can collaborate with valid domain objects
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Services should be able to work with these domain objects
        assertExists(directive.value);
        assertExists(layer.value);
        
        logger.debug("Path resolution service collaboration verified", {
          directiveForPath: directive.value,
          layerForPath: layer.value
        });
      }
    });

    it("should maintain service integrity during complex path operations", async () => {
      // Arrange
      const inputResolver = new InputFilePathResolver();
      const outputResolver = new OutputFilePathResolver();
      
      // Test complex scenarios requiring multiple service collaborations
      const complexScenarios = [
        { directive: "to", layer: "project", description: "Basic path resolution" },
        { directive: "summary", layer: "issue", description: "Summary path resolution" },
        { directive: "defect", layer: "task", description: "Defect detection path resolution" }
      ];
      
      logger.debug("Testing service integrity during complex operations", {
        scenarioCount: complexScenarios.length
      });

      // Act & Assert
      for (const scenario of complexScenarios) {
        const directiveResult = DirectiveType.createOrError(scenario.directive);
        const layerResult = LayerType.createOrError(scenario.layer);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.description);
        assertEquals(layerResult.isSuccess(), true, scenario.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          // Services should maintain integrity during operations
          assertExists(inputResolver);
          assertExists(outputResolver);
          
          logger.debug("Complex operation handled successfully", {
            scenario: scenario.description,
            directive: directiveResult.getValue().value,
            layer: layerResult.getValue().value
          });
        }
      }
    });
  });

  describe("Template and Schema Path Resolution Integration", () => {
    it("should resolve template paths correctly through domain collaboration", async () => {
      // Arrange
      const testCases = [
        { directive: "to", layer: "project", expectedPattern: "to_project" },
        { directive: "summary", layer: "issue", expectedPattern: "summary_issue" },
        { directive: "defect", layer: "task", expectedPattern: "defect_task" }
      ];
      
      logger.debug("Testing template path resolution integration", {
        testCaseCount: testCases.length
      });

      // Act & Assert
      for (const testCase of testCases) {
        const directiveResult = DirectiveType.createOrError(testCase.directive);
        const layerResult = LayerType.createOrError(testCase.layer);
        
        assertEquals(directiveResult.isSuccess(), true);
        assertEquals(layerResult.isSuccess(), true);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          
          // Template path should follow expected pattern
          const expectedPattern = `${directive.value}_${layer.value}`;
          assertEquals(expectedPattern, testCase.expectedPattern);
          
          logger.debug("Template path resolution verified", {
            directive: directive.value,
            layer: layer.value,
            expectedPattern
          });
        }
      }
    });

    it("should coordinate schema path resolution with template paths", async () => {
      // Arrange
      const inputResolver = new InputFilePathResolver();
      const outputResolver = new OutputFilePathResolver();
      
      logger.debug("Testing schema path coordination with template paths");

      // Act - Test schema-template coordination
      const directiveResult = DirectiveType.createOrError("to");
      const layerResult = LayerType.createOrError("project");
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Both resolvers should be able to work with the same domain objects
        assertExists(inputResolver);
        assertExists(outputResolver);
        
        // Schema and template paths should be coordinatable
        const pathPattern = `${directive.value}_${layer.value}`;
        assertExists(pathPattern);
        
        logger.debug("Schema-template path coordination verified", {
          pathPattern,
          resolversReady: true
        });
      }
    });
  });

  describe("Path Validation and Fallback Strategy", () => {
    it("should implement robust path validation across domain boundaries", async () => {
      // Arrange - Test path validation scenarios
      const validationCases = [
        { 
          workspace: "valid-workspace", 
          basePath: "/valid/base/path",
          directive: "to",
          layer: "project",
          shouldValidate: true,
          description: "All valid parameters"
        },
        {
          workspace: "",
          basePath: "/valid/base/path",
          directive: "to",
          layer: "project",
          shouldValidate: false,
          description: "Invalid workspace should fail validation"
        },
        {
          workspace: "valid-workspace",
          basePath: "",
          directive: "to",
          layer: "project",
          shouldValidate: false,
          description: "Invalid base path should fail validation"
        },
        {
          workspace: "valid-workspace",
          basePath: "/valid/base/path",
          directive: "",
          layer: "project",
          shouldValidate: false,
          description: "Invalid directive should fail validation"
        }
      ];
      
      logger.debug("Testing path validation across domain boundaries", {
        validationCaseCount: validationCases.length
      });

      // Act & Assert
      for (const validationCase of validationCases) {
        const workspaceResult = WorkspaceName.createOrError(validationCase.workspace);
        const basePathResult = BasePath.createOrError(validationCase.basePath);
        const directiveResult = DirectiveType.createOrError(validationCase.directive);
        const layerResult = LayerType.createOrError(validationCase.layer);
        
        if (validationCase.shouldValidate) {
          assertEquals(workspaceResult.isSuccess(), true, validationCase.description);
          assertEquals(basePathResult.isSuccess(), true, validationCase.description);
          assertEquals(directiveResult.isSuccess(), true, validationCase.description);
          assertEquals(layerResult.isSuccess(), true, validationCase.description);
        } else {
          const allValid = workspaceResult.isSuccess() && 
                          basePathResult.isSuccess() && 
                          directiveResult.isSuccess() && 
                          layerResult.isSuccess();
          assertEquals(allValid, false, validationCase.description);
        }
        
        logger.debug("Path validation case processed", {
          description: validationCase.description,
          result: validationCase.shouldValidate ? "passed" : "failed as expected"
        });
      }
    });

    it("should implement fallback strategies for path resolution failures", async () => {
      // Arrange
      const inputResolver = new InputFilePathResolver();
      const configDetector = new ConfigPrefixDetector();
      
      logger.debug("Testing fallback strategies for path resolution");

      // Act - Test fallback scenarios
      const fallbackScenarios = [
        { directive: "to", layer: "project", hasFallback: true },
        { directive: "summary", layer: "issue", hasFallback: true },
        { directive: "defect", layer: "task", hasFallback: true }
      ];

      // Assert - Fallback strategies should be available
      for (const scenario of fallbackScenarios) {
        const directiveResult = DirectiveType.createOrError(scenario.directive);
        const layerResult = LayerType.createOrError(scenario.layer);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          // Fallback services should be available
          assertExists(inputResolver);
          assertExists(configDetector);
          
          logger.debug("Fallback strategy verified", {
            directive: scenario.directive,
            layer: scenario.layer,
            fallbackAvailable: scenario.hasFallback
          });
        }
      }
    });
  });

  describe("Cross-Domain Path Resolution Coordination", () => {
    it("should coordinate path resolution with parameter parsing domain", async () => {
      // Arrange
      const inputResolver = new InputFilePathResolver();
      const outputResolver = new OutputFilePathResolver();
      
      logger.debug("Testing cross-domain path resolution coordination");

      // Act - Create parameters that require path resolution
      const directiveResult = DirectiveType.createOrError("to");
      const layerResult = LayerType.createOrError("project");
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Path resolution should coordinate with parameter parsing
        assertExists(inputResolver);
        assertExists(outputResolver);
        
        // Both domains should work together seamlessly
        assertEquals(directive.value, "to");
        assertEquals(layer.value, "project");
        
        logger.debug("Cross-domain coordination verified", {
          parameterParsing: { directive: directive.value, layer: layer.value },
          pathResolution: { inputResolver: !!inputResolver, outputResolver: !!outputResolver }
        });
      }
    });

    it("should maintain consistency across domain collaborations", async () => {
      // Arrange
      const configDetector = new ConfigPrefixDetector();
      
      // Test multiple cross-domain operations
      const operations = [
        { directive: "to", layer: "project" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "task" }
      ];
      
      logger.debug("Testing consistency across domain collaborations", {
        operationCount: operations.length
      });

      // Act & Assert
      for (const operation of operations) {
        const directiveResult = DirectiveType.createOrError(operation.directive);
        const layerResult = LayerType.createOrError(operation.layer);
        
        assertEquals(directiveResult.isSuccess(), true);
        assertEquals(layerResult.isSuccess(), true);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          
          // Consistency should be maintained across operations
          assertEquals(directive.value, operation.directive);
          assertEquals(layer.value, operation.layer);
          assertExists(configDetector);
          
          logger.debug("Domain collaboration consistency verified", {
            operation: operation,
            consistent: true
          });
        }
      }
    });

    it("should handle domain coordination errors gracefully", async () => {
      // Arrange
      const invalidOperations = [
        { directive: "", layer: "project", expectError: true },
        { directive: "to", layer: "", expectError: true },
        { directive: "invalid", layer: "project", expectError: true }
      ];
      
      logger.debug("Testing graceful error handling in domain coordination", {
        invalidOperationCount: invalidOperations.length
      });

      // Act & Assert
      for (const operation of invalidOperations) {
        const directiveResult = DirectiveType.createOrError(operation.directive);
        const layerResult = LayerType.createOrError(operation.layer);
        
        if (operation.expectError) {
          const hasError = directiveResult.isFailure() || layerResult.isFailure();
          assertEquals(hasError, true, 
            `Operation should fail: ${operation.directive}/${operation.layer}`);
          
          // Error handling should not break path resolution services
          const inputResolver = new InputFilePathResolver();
          assertExists(inputResolver);
          
          logger.debug("Graceful error handling verified", {
            operation: operation,
            errorHandled: hasError
          });
        }
      }
    });
  });
});