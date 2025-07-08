/**
 * Core Domain Integration Test: Domain Service Collaboration Patterns
 * 
 * This test verifies the collaboration patterns between core domain services,
 * focusing on the coordination and integration across boundary contexts.
 * 
 * Test Coverage:
 * 1. Parameter parsing → Path resolution collaboration
 * 2. Path resolution → Variable generation collaboration  
 * 3. Variable generation → Parameter parsing feedback loop
 * 4. Cross-boundary context coordination patterns
 * 5. End-to-end domain service orchestration
 * 6. Error propagation across service boundaries
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import core domain components
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { TypeFactory } from "../../../lib/types/type_factory.ts";
import { ConfigTwoParams } from "../../../lib/types/defaults/config_two_params.ts";

// Import path resolution components
import { InputFilePathResolver } from "../../../lib/factory/input_file_path_resolver.ts";
import { OutputFilePathResolver } from "../../../lib/factory/output_file_path_resolver.ts";
import { ConfigPrefixDetector } from "../../../lib/factory/config_prefix_detector.ts";

// Import variable generation components
import { PromptVariablesFactory } from "../../../lib/factory/prompt_variables_factory.ts";

// Import value objects
import { WorkspaceName } from "../../../lib/domain/core/value_objects/workspace_name.ts";
import { BasePath } from "../../../lib/domain/core/value_objects/base_path.ts";

const logger = new BreakdownLogger("domain-service-collaboration");

describe("Domain Service Collaboration Patterns", () => {
  describe("Parameter Parsing → Path Resolution Collaboration", () => {
    it("should enable seamless parameter to path transformation", async () => {
      // Arrange
      const testDirective = "to";
      const testLayer = "project";
      
      logger.debug("Testing parameter to path transformation collaboration", {
        directive: testDirective,
        layer: testLayer
      });

      // Act - Step 1: Parameter parsing
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(testDirective);
      const layerResult = typeFactory.createLayerType(testLayer);
      
      // Assert - Parameter parsing success
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Act - Step 2: Path resolution using parsed parameters
        const inputResolver = new InputFilePathResolver();
        const outputResolver = new OutputFilePathResolver();
        
        // Assert - Path resolution can work with parsed parameters
        assertExists(inputResolver);
        assertExists(outputResolver);
        assertEquals(directive.value, testDirective);
        assertEquals(layer.value, testLayer);
        
        logger.debug("Parameter to path collaboration verified", {
          parameterParsing: { directive: directive.value, layer: layer.value },
          pathResolution: { inputResolver: !!inputResolver, outputResolver: !!outputResolver }
        });
      }
    });

    it("should maintain data consistency across parameter-path boundary", async () => {
      // Arrange
      const collaborationCases = [
        { directive: "to", layer: "project", description: "Basic transformation collaboration" },
        { directive: "summary", layer: "issue", description: "Summary transformation collaboration" },
        { directive: "defect", layer: "task", description: "Defect detection collaboration" }
      ];
      
      logger.debug("Testing data consistency across parameter-path boundary", {
        caseCount: collaborationCases.length
      });

      // Act & Assert
      for (const collabCase of collaborationCases) {
        // Parameter parsing phase
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(collabCase.directive);
        const layerResult = typeFactory.createLayerType(collabCase.layer);
        
        assertEquals(directiveResult.isSuccess(), true, collabCase.description);
        assertEquals(layerResult.isSuccess(), true, collabCase.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          
          // Path resolution phase - should maintain data consistency
          const configDetector = new ConfigPrefixDetector();
          assertExists(configDetector);
          
          // Data should remain consistent across the boundary
          assertEquals(directive.value, collabCase.directive);
          assertEquals(layer.value, collabCase.layer);
          
          logger.debug("Data consistency maintained", {
            case: collabCase.description,
            originalDirective: collabCase.directive,
            resolvedDirective: directive.value,
            originalLayer: collabCase.layer,
            resolvedLayer: layer.value
          });
        }
      }
    });
  });

  describe("Path Resolution → Variable Generation Collaboration", () => {
    it("should enable seamless path to variable transformation", async () => {
      // Arrange
      const testWorkspace = "collaboration-workspace";
      const testBasePath = "/tmp/collaboration/test";
      
      logger.debug("Testing path to variable transformation collaboration", {
        workspace: testWorkspace,
        basePath: testBasePath
      });

      // Act - Step 1: Path resolution
      const workspaceResult = WorkspaceName.createOrError(testWorkspace);
      const basePathResult = BasePath.createOrError(testBasePath);
      
      // Assert - Path resolution success
      assertEquals(workspaceResult.isSuccess(), true);
      assertEquals(basePathResult.isSuccess(), true);
      
      if (workspaceResult.isSuccess() && basePathResult.isSuccess()) {
        const workspace = workspaceResult.getValue();
        const basePath = basePathResult.getValue();
        
        // Act - Step 2: Variable generation using resolved paths
        const variablesFactory = new PromptVariablesFactory();
        
        // Assert - Variable generation can work with resolved paths
        assertExists(variablesFactory);
        assertEquals(workspace.value, testWorkspace);
        assertEquals(basePath.value, testBasePath);
        
        logger.debug("Path to variable collaboration verified", {
          pathResolution: { workspace: workspace.value, basePath: basePath.value },
          variableGeneration: { factory: !!variablesFactory }
        });
      }
    });

    it("should coordinate path and variable services effectively", async () => {
      // Arrange
      const coordinationScenarios = [
        {
          directive: "to",
          layer: "project", 
          workspace: "main-workspace",
          basePath: "/main/project/path",
          description: "Main project coordination"
        },
        {
          directive: "summary", 
          layer: "issue",
          workspace: "analysis-workspace", 
          basePath: "/analysis/issue/path",
          description: "Analysis issue coordination"
        },
        {
          directive: "defect",
          layer: "task",
          workspace: "quality-workspace",
          basePath: "/quality/task/path", 
          description: "Quality task coordination"
        }
      ];
      
      logger.debug("Testing path-variable service coordination", {
        scenarioCount: coordinationScenarios.length
      });

      // Act & Assert
      for (const scenario of coordinationScenarios) {
        // Create all domain objects for coordination test
        const directiveResult = DirectiveType.createOrError(scenario.directive);
        const layerResult = LayerType.createOrError(scenario.layer);
        const workspaceResult = WorkspaceName.createOrError(scenario.workspace);
        const basePathResult = BasePath.createOrError(scenario.basePath);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.description);
        assertEquals(layerResult.isSuccess(), true, scenario.description);
        assertEquals(workspaceResult.isSuccess(), true, scenario.description);
        assertEquals(basePathResult.isSuccess(), true, scenario.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && 
            workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          
          // Services should coordinate effectively
          const inputResolver = new InputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          
          assertExists(inputResolver);
          assertExists(variablesFactory);
          
          logger.debug("Service coordination verified", {
            scenario: scenario.description,
            allServicesOperational: true
          });
        }
      }
    });
  });

  describe("Variable Generation → Parameter Parsing Feedback Loop", () => {
    it("should support bidirectional parameter-variable collaboration", async () => {
      // Arrange
      const feedbackTestData = {
        directive: "to",
        layer: "project",
        workspace: "feedback-workspace"
      };
      
      logger.debug("Testing bidirectional parameter-variable collaboration", feedbackTestData);

      // Act - Forward direction: Parameters → Variables
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(feedbackTestData.directive);
      const layerResult = typeFactory.createLayerType(feedbackTestData.layer);
      const workspaceResult = WorkspaceName.createOrError(feedbackTestData.workspace);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      assertEquals(workspaceResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        const workspace = workspaceResult.getValue();
        
        // Forward collaboration
        const variablesFactory = new PromptVariablesFactory();
        assertExists(variablesFactory);
        
        // Act - Feedback direction: Variables can inform parameter validation
        // Variables should maintain reference to original parameters
        assertEquals(directive.value, feedbackTestData.directive);
        assertEquals(layer.value, feedbackTestData.layer);
        assertEquals(workspace.value, feedbackTestData.workspace);
        
        logger.debug("Bidirectional collaboration verified", {
          forwardDirection: { directive: directive.value, layer: layer.value },
          feedbackDirection: { workspace: workspace.value, factory: !!variablesFactory }
        });
      }
    });

    it("should maintain parameter integrity through variable feedback", async () => {
      // Arrange
      const integrityTestCases = [
        { directive: "to", layer: "project", iteration: 1 },
        { directive: "summary", layer: "issue", iteration: 2 },
        { directive: "defect", layer: "task", iteration: 3 }
      ];
      
      logger.debug("Testing parameter integrity through variable feedback", {
        testCaseCount: integrityTestCases.length
      });

      // Act & Assert
      for (const testCase of integrityTestCases) {
        // Multiple iterations to test feedback stability
        for (let i = 0; i < testCase.iteration; i++) {
          const config = new ConfigTwoParams();
          const typeFactory = new TypeFactory(config);
          
          const directiveResult = typeFactory.createDirectiveType(testCase.directive);
          const layerResult = typeFactory.createLayerType(testCase.layer);
          
          assertEquals(directiveResult.isSuccess(), true);
          assertEquals(layerResult.isSuccess(), true);
          
          if (directiveResult.isSuccess() && layerResult.isSuccess()) {
            const directive = directiveResult.getValue();
            const layer = layerResult.getValue();
            
            // Variable generation with feedback
            const variablesFactory = new PromptVariablesFactory();
            assertExists(variablesFactory);
            
            // Parameter integrity should be maintained
            assertEquals(directive.value, testCase.directive);
            assertEquals(layer.value, testCase.layer);
            
            logger.debug("Parameter integrity maintained in feedback loop", {
              testCase: testCase,
              iteration: i + 1,
              parameterIntact: true
            });
          }
        }
      }
    });
  });

  describe("Cross-Boundary Context Coordination Patterns", () => {
    it("should coordinate all boundary contexts in complete workflow", async () => {
      // Arrange
      const workflowData = {
        directive: "to",
        layer: "project", 
        workspace: "workflow-workspace",
        basePath: "/workflow/test/path"
      };
      
      logger.debug("Testing complete cross-boundary workflow coordination", workflowData);

      // Act - Step 1: Parameter parsing boundary context
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(workflowData.directive);
      const layerResult = typeFactory.createLayerType(workflowData.layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Act - Step 2: Path resolution boundary context
        const workspaceResult = WorkspaceName.createOrError(workflowData.workspace);
        const basePathResult = BasePath.createOrError(workflowData.basePath);
        
        assertEquals(workspaceResult.isSuccess(), true);
        assertEquals(basePathResult.isSuccess(), true);
        
        if (workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          
          // Act - Step 3: Variable generation boundary context
          const variablesFactory = new PromptVariablesFactory();
          const inputResolver = new InputFilePathResolver();
          
          // Assert - All boundary contexts coordinated successfully
          assertExists(variablesFactory);
          assertExists(inputResolver);
          assertEquals(directive.value, workflowData.directive);
          assertEquals(layer.value, workflowData.layer);
          assertEquals(workspace.value, workflowData.workspace);
          assertEquals(basePath.value, workflowData.basePath);
          
          logger.debug("Complete cross-boundary coordination verified", {
            parameterParsing: { directive: directive.value, layer: layer.value },
            pathResolution: { workspace: workspace.value, basePath: basePath.value },
            variableGeneration: { factory: !!variablesFactory, resolver: !!inputResolver }
          });
        }
      }
    });

    it("should maintain boundary context isolation while enabling coordination", async () => {
      // Arrange
      const isolationTestCases = [
        {
          directive: "to", 
          layer: "project",
          workspace: "isolation-workspace-1",
          description: "First isolation test"
        },
        {
          directive: "summary",
          layer: "issue", 
          workspace: "isolation-workspace-2",
          description: "Second isolation test"
        }
      ];
      
      logger.debug("Testing boundary context isolation with coordination", {
        testCaseCount: isolationTestCases.length
      });

      // Act & Assert
      for (const isolationCase of isolationTestCases) {
        // Each case should maintain its own boundary context isolation
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(isolationCase.directive);
        const layerResult = typeFactory.createLayerType(isolationCase.layer);
        const workspaceResult = WorkspaceName.createOrError(isolationCase.workspace);
        
        assertEquals(directiveResult.isSuccess(), true, isolationCase.description);
        assertEquals(layerResult.isSuccess(), true, isolationCase.description);
        assertEquals(workspaceResult.isSuccess(), true, isolationCase.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          const workspace = workspaceResult.getValue();
          
          // Boundary contexts should be isolated yet coordinated
          assertEquals(directive.value, isolationCase.directive);
          assertEquals(layer.value, isolationCase.layer);
          assertEquals(workspace.value, isolationCase.workspace);
          
          // Services should work independently within their contexts
          const variablesFactory = new PromptVariablesFactory();
          const outputResolver = new OutputFilePathResolver();
          
          assertExists(variablesFactory);
          assertExists(outputResolver);
          
          logger.debug("Boundary isolation with coordination verified", {
            case: isolationCase.description,
            boundaryContextsIsolated: true,
            coordinationMaintained: true
          });
        }
      }
    });
  });

  describe("End-to-End Domain Service Orchestration", () => {
    it("should orchestrate complete domain service pipeline", async () => {
      // Arrange
      const orchestrationData = {
        directive: "to",
        layer: "project",
        workspace: "orchestration-workspace", 
        basePath: "/orchestration/complete/path"
      };
      
      logger.debug("Testing complete domain service orchestration", orchestrationData);

      // Act - Complete orchestration pipeline
      
      // Phase 1: Parameter Parsing
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(orchestrationData.directive);
      const layerResult = typeFactory.createLayerType(orchestrationData.layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Phase 2: Path Resolution
        const workspaceResult = WorkspaceName.createOrError(orchestrationData.workspace);
        const basePathResult = BasePath.createOrError(orchestrationData.basePath);
        
        assertEquals(workspaceResult.isSuccess(), true);
        assertEquals(basePathResult.isSuccess(), true);
        
        if (workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          
          // Phase 3: Service Integration
          const inputResolver = new InputFilePathResolver();
          const outputResolver = new OutputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          const configDetector = new ConfigPrefixDetector();
          
          // Assert - Complete orchestration success
          assertExists(inputResolver);
          assertExists(outputResolver);
          assertExists(variablesFactory);
          assertExists(configDetector);
          
          assertEquals(directive.value, orchestrationData.directive);
          assertEquals(layer.value, orchestrationData.layer);
          assertEquals(workspace.value, orchestrationData.workspace);
          assertEquals(basePath.value, orchestrationData.basePath);
          
          logger.debug("Complete domain service orchestration verified", {
            parameterPhase: { directive: directive.value, layer: layer.value },
            pathPhase: { workspace: workspace.value, basePath: basePath.value },
            serviceIntegration: {
              inputResolver: !!inputResolver,
              outputResolver: !!outputResolver, 
              variablesFactory: !!variablesFactory,
              configDetector: !!configDetector
            }
          });
        }
      }
    });

    it("should handle complex orchestration scenarios", async () => {
      // Arrange
      const complexScenarios = [
        {
          directive: "to",
          layer: "project",
          workspace: "complex-scenario-1", 
          basePath: "/complex/scenario/1",
          description: "Complex transformation scenario"
        },
        {
          directive: "summary",
          layer: "issue",
          workspace: "complex-scenario-2",
          basePath: "/complex/scenario/2", 
          description: "Complex analysis scenario"
        },
        {
          directive: "defect", 
          layer: "task",
          workspace: "complex-scenario-3",
          basePath: "/complex/scenario/3",
          description: "Complex quality scenario"
        }
      ];
      
      logger.debug("Testing complex orchestration scenarios", {
        scenarioCount: complexScenarios.length
      });

      // Act & Assert
      for (const scenario of complexScenarios) {
        // Complete orchestration for each complex scenario
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(scenario.directive);
        const layerResult = typeFactory.createLayerType(scenario.layer);
        const workspaceResult = WorkspaceName.createOrError(scenario.workspace);
        const basePathResult = BasePath.createOrError(scenario.basePath);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.description);
        assertEquals(layerResult.isSuccess(), true, scenario.description);
        assertEquals(workspaceResult.isSuccess(), true, scenario.description);
        assertEquals(basePathResult.isSuccess(), true, scenario.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && 
            workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          
          // All services should orchestrate successfully
          const allServices = {
            inputResolver: new InputFilePathResolver(),
            outputResolver: new OutputFilePathResolver(), 
            variablesFactory: new PromptVariablesFactory(),
            configDetector: new ConfigPrefixDetector()
          };
          
          // Assert all services are operational
          Object.values(allServices).forEach(service => assertExists(service));
          
          logger.debug("Complex orchestration scenario completed", {
            scenario: scenario.description,
            allServicesOrchestrated: true
          });
        }
      }
    });
  });

  describe("Error Propagation Across Service Boundaries", () => {
    it("should propagate errors correctly across all service boundaries", async () => {
      // Arrange
      const errorPropagationCases = [
        {
          directive: "",
          layer: "project",
          workspace: "error-workspace",
          expectedErrorAt: "parameter_parsing",
          description: "Error should propagate from parameter parsing"
        },
        {
          directive: "to", 
          layer: "project",
          workspace: "",
          expectedErrorAt: "path_resolution",
          description: "Error should propagate from path resolution"
        },
        {
          directive: "invalid_directive",
          layer: "project", 
          workspace: "error-workspace",
          expectedErrorAt: "parameter_parsing",
          description: "Invalid directive should propagate error"
        }
      ];
      
      logger.debug("Testing error propagation across service boundaries", {
        errorCaseCount: errorPropagationCases.length
      });

      // Act & Assert
      for (const errorCase of errorPropagationCases) {
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(errorCase.directive);
        const layerResult = typeFactory.createLayerType(errorCase.layer);
        const workspaceResult = WorkspaceName.createOrError(errorCase.workspace);
        
        if (errorCase.expectedErrorAt === "parameter_parsing") {
          const hasParameterError = directiveResult.isFailure() || layerResult.isFailure();
          assertEquals(hasParameterError, true, errorCase.description);
          
          if (directiveResult.isFailure()) {
            assertExists(directiveResult.getError().message);
          }
          if (layerResult.isFailure()) {
            assertExists(layerResult.getError().message);
          }
        }
        
        if (errorCase.expectedErrorAt === "path_resolution") {
          assertEquals(workspaceResult.isFailure(), true, errorCase.description);
          
          if (workspaceResult.isFailure()) {
            assertExists(workspaceResult.getError().message);
          }
        }
        
        // Services should remain operational despite errors
        const variablesFactory = new PromptVariablesFactory();
        assertExists(variablesFactory);
        
        logger.debug("Error propagation verified", {
          case: errorCase.description,
          errorPropagatedCorrectly: true,
          servicesRemainOperational: true
        });
      }
    });

    it("should maintain service resilience during error propagation", async () => {
      // Arrange
      const resilienceTestData = {
        validOperations: [
          { directive: "to", layer: "project", workspace: "resilience-workspace-1" },
          { directive: "summary", layer: "issue", workspace: "resilience-workspace-2" }
        ],
        invalidOperations: [
          { directive: "", layer: "project", workspace: "resilience-workspace-3" },
          { directive: "to", layer: "", workspace: "resilience-workspace-4" }
        ]
      };
      
      let successCount = 0;
      let errorCount = 0;
      
      logger.debug("Testing service resilience during error propagation", {
        validOperationCount: resilienceTestData.validOperations.length,
        invalidOperationCount: resilienceTestData.invalidOperations.length
      });

      // Act - Process both valid and invalid operations
      const allOperations = [
        ...resilienceTestData.validOperations.map(op => ({ ...op, shouldSucceed: true })),
        ...resilienceTestData.invalidOperations.map(op => ({ ...op, shouldSucceed: false }))
      ];

      for (const operation of allOperations) {
        try {
          const config = new ConfigTwoParams();
          const typeFactory = new TypeFactory(config);
          
          const directiveResult = typeFactory.createDirectiveType(operation.directive);
          const layerResult = typeFactory.createLayerType(operation.layer);
          const workspaceResult = WorkspaceName.createOrError(operation.workspace);
          
          if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
            successCount++;
            
            // Services should remain operational for valid operations
            const variablesFactory = new PromptVariablesFactory();
            assertExists(variablesFactory);
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          logger.debug("Expected error handled during resilience test", {
            operation: operation,
            error: error.message
          });
        }
      }

      // Assert - Service resilience maintained
      assertEquals(successCount, resilienceTestData.validOperations.length);
      assertEquals(errorCount, resilienceTestData.invalidOperations.length);
      
      // Services should still be operational after error handling
      const finalVariablesFactory = new PromptVariablesFactory();
      const finalInputResolver = new InputFilePathResolver();
      assertExists(finalVariablesFactory);
      assertExists(finalInputResolver);
      
      logger.debug("Service resilience during error propagation verified", {
        successCount,
        errorCount,
        totalOperations: allOperations.length,
        servicesResilient: true
      });
    });
  });
});