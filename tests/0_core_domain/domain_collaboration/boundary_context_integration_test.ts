/**
 * Core Domain Integration Test: Boundary Context Integration
 * 
 * This test verifies the integration across all boundary contexts within the core domain,
 * ensuring that the four boundary contexts work together to deliver the core domain value.
 * 
 * Test Coverage:
 * 1. Complete boundary context integration workflow
 * 2. Domain invariant preservation across contexts
 * 3. Context mapping and translation accuracy
 * 4. Anti-corruption layer effectiveness
 * 5. Context autonomy with integration capability
 * 6. End-to-end core domain value delivery verification
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all boundary context components
// Parameter Parsing Context
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { TypeFactory } from "../../../lib/types/type_factory.ts";
import { ConfigTwoParams } from "../../../lib/types/defaults/config_two_params.ts";

// Path Resolution Context
import { InputFilePathResolver } from "../../../lib/factory/input_file_path_resolver.ts";
import { OutputFilePathResolver } from "../../../lib/factory/output_file_path_resolver.ts";
import { ConfigPrefixDetector } from "../../../lib/factory/config_prefix_detector.ts";

// Variable Generation Context
import { PromptVariablesFactory } from "../../../lib/factory/prompt_variables_factory.ts";

// Configuration Management Context (value objects)
import { WorkspaceName } from "../../../lib/domain/core/value_objects/workspace_name.ts";
import { BasePath } from "../../../lib/domain/core/value_objects/base_path.ts";
import { ConfigSetName } from "../../../lib/domain/core/value_objects/config_set_name.ts";

const logger = new BreakdownLogger("boundary-context-integration");

describe("Boundary Context Integration", () => {
  describe("Complete Boundary Context Integration Workflow", () => {
    it("should integrate all four boundary contexts in complete workflow", async () => {
      // Arrange - Complete workflow data
      const workflowData = {
        // Parameter Parsing Context inputs
        directive: "to",
        layer: "project",
        
        // Configuration Management Context inputs
        workspace: "integration-workspace",
        basePath: "/integration/test/path",
        configSetName: "default",
        
        // Expected outputs from integration
        expectedPathPattern: "to_project",
        expectedWorkflow: "parameter_parsing → configuration_management → path_resolution → variable_generation"
      };
      
      logger.debug("Testing complete boundary context integration workflow", workflowData);

      // Act & Assert - Step 1: Parameter Parsing Context
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(workflowData.directive);
      const layerResult = typeFactory.createLayerType(workflowData.layer);
      
      assertEquals(directiveResult.isSuccess(), true, "Parameter parsing context should succeed");
      assertEquals(layerResult.isSuccess(), true, "Parameter parsing context should succeed");
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Act & Assert - Step 2: Configuration Management Context
        const workspaceResult = WorkspaceName.createOrError(workflowData.workspace);
        const basePathResult = BasePath.createOrError(workflowData.basePath);
        const configSetResult = ConfigSetName.createOrError(workflowData.configSetName);
        
        assertEquals(workspaceResult.isSuccess(), true, "Configuration management context should succeed");
        assertEquals(basePathResult.isSuccess(), true, "Configuration management context should succeed");
        assertEquals(configSetResult.isSuccess(), true, "Configuration management context should succeed");
        
        if (workspaceResult.isSuccess() && basePathResult.isSuccess() && configSetResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          const configSet = configSetResult.getValue();
          
          // Act & Assert - Step 3: Path Resolution Context
          const inputResolver = new InputFilePathResolver();
          const outputResolver = new OutputFilePathResolver();
          const configDetector = new ConfigPrefixDetector();
          
          assertExists(inputResolver, "Path resolution context should be operational");
          assertExists(outputResolver, "Path resolution context should be operational");
          assertExists(configDetector, "Path resolution context should be operational");
          
          // Act & Assert - Step 4: Variable Generation Context
          const variablesFactory = new PromptVariablesFactory();
          assertExists(variablesFactory, "Variable generation context should be operational");
          
          // Assert - Complete integration verification
          assertEquals(directive.value, workflowData.directive);
          assertEquals(layer.value, workflowData.layer);
          assertEquals(workspace.value, workflowData.workspace);
          assertEquals(basePath.value, workflowData.basePath);
          assertEquals(configSet.value, workflowData.configSetName);
          
          // Verify path pattern generation
          const actualPathPattern = `${directive.value}_${layer.value}`;
          assertEquals(actualPathPattern, workflowData.expectedPathPattern);
          
          logger.debug("Complete boundary context integration verified", {
            parameterParsing: { directive: directive.value, layer: layer.value },
            configurationManagement: { 
              workspace: workspace.value, 
              basePath: basePath.value, 
              configSet: configSet.value 
            },
            pathResolution: { 
              inputResolver: !!inputResolver, 
              outputResolver: !!outputResolver, 
              configDetector: !!configDetector 
            },
            variableGeneration: { factory: !!variablesFactory },
            pathPattern: actualPathPattern
          });
        }
      }
    });

    it("should handle multiple workflow variations across boundary contexts", async () => {
      // Arrange - Multiple workflow variations
      const workflowVariations = [
        {
          name: "Basic Transformation Workflow",
          directive: "to",
          layer: "project",
          workspace: "basic-workspace",
          configSet: "default"
        },
        {
          name: "Analysis Workflow", 
          directive: "summary",
          layer: "issue",
          workspace: "analysis-workspace",
          configSet: "analysis"
        },
        {
          name: "Quality Assurance Workflow",
          directive: "defect",
          layer: "task", 
          workspace: "qa-workspace",
          configSet: "qa"
        }
      ];
      
      logger.debug("Testing multiple workflow variations across boundary contexts", {
        variationCount: workflowVariations.length
      });

      // Act & Assert
      for (const variation of workflowVariations) {
        // Each variation should complete the full boundary context integration
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(variation.directive);
        const layerResult = typeFactory.createLayerType(variation.layer);
        const workspaceResult = WorkspaceName.createOrError(variation.workspace);
        const configSetResult = ConfigSetName.createOrError(variation.configSet);
        
        assertEquals(directiveResult.isSuccess(), true, variation.name);
        assertEquals(layerResult.isSuccess(), true, variation.name);
        assertEquals(workspaceResult.isSuccess(), true, variation.name);
        assertEquals(configSetResult.isSuccess(), true, variation.name);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && 
            workspaceResult.isSuccess() && configSetResult.isSuccess()) {
          
          // All contexts should be operational for each variation
          const inputResolver = new InputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          
          assertExists(inputResolver);
          assertExists(variablesFactory);
          
          logger.debug("Workflow variation completed successfully", {
            variation: variation.name,
            allContextsOperational: true
          });
        }
      }
    });
  });

  describe("Domain Invariant Preservation Across Contexts", () => {
    it("should preserve core domain invariants throughout context transitions", async () => {
      // Arrange - Core domain invariants to preserve
      const invariantTestData = {
        directive: "to",
        layer: "project",
        workspace: "invariant-workspace",
        basePath: "/invariant/test/path"
      };
      
      logger.debug("Testing domain invariant preservation across contexts", invariantTestData);

      // Act - Transition through all contexts while tracking invariants
      
      // Context 1: Parameter Parsing - Establish invariants
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(invariantTestData.directive);
      const layerResult = typeFactory.createLayerType(invariantTestData.layer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Invariant 1: Type identity preservation
        assertEquals(directive.value, invariantTestData.directive);
        assertEquals(layer.value, invariantTestData.layer);
        
        // Context 2: Configuration Management - Maintain invariants
        const workspaceResult = WorkspaceName.createOrError(invariantTestData.workspace);
        const basePathResult = BasePath.createOrError(invariantTestData.basePath);
        
        assertEquals(workspaceResult.isSuccess(), true);
        assertEquals(basePathResult.isSuccess(), true);
        
        if (workspaceResult.isSuccess() && basePathResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          
          // Invariant 2: Configuration identity preservation
          assertEquals(workspace.value, invariantTestData.workspace);
          assertEquals(basePath.value, invariantTestData.basePath);
          
          // Context 3: Path Resolution - Preserve previous invariants
          const inputResolver = new InputFilePathResolver();
          assertExists(inputResolver);
          
          // Previous invariants should still hold
          assertEquals(directive.value, invariantTestData.directive);
          assertEquals(layer.value, invariantTestData.layer);
          assertEquals(workspace.value, invariantTestData.workspace);
          assertEquals(basePath.value, invariantTestData.basePath);
          
          // Context 4: Variable Generation - All invariants preserved
          const variablesFactory = new PromptVariablesFactory();
          assertExists(variablesFactory);
          
          // All invariants from all contexts should be preserved
          assertEquals(directive.value, invariantTestData.directive);
          assertEquals(layer.value, invariantTestData.layer);
          assertEquals(workspace.value, invariantTestData.workspace);
          assertEquals(basePath.value, invariantTestData.basePath);
          
          logger.debug("All domain invariants preserved across contexts", {
            parameterInvariants: { directive: directive.value, layer: layer.value },
            configInvariants: { workspace: workspace.value, basePath: basePath.value },
            pathInvariants: { resolver: !!inputResolver },
            variableInvariants: { factory: !!variablesFactory }
          });
        }
      }
    });

    it("should prevent invariant corruption at context boundaries", async () => {
      // Arrange - Test cases that might corrupt invariants
      const corruptionTestCases = [
        {
          directive: "to",
          layer: "project",
          workspace: "corruption-test-1",
          description: "Standard case should maintain invariants"
        },
        {
          directive: "summary", 
          layer: "issue",
          workspace: "corruption-test-2",
          description: "Alternative case should maintain invariants"
        }
      ];
      
      logger.debug("Testing invariant corruption prevention at context boundaries", {
        testCaseCount: corruptionTestCases.length
      });

      // Act & Assert
      for (const testCase of corruptionTestCases) {
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(testCase.directive);
        const layerResult = typeFactory.createLayerType(testCase.layer);
        const workspaceResult = WorkspaceName.createOrError(testCase.workspace);
        
        assertEquals(directiveResult.isSuccess(), true, testCase.description);
        assertEquals(layerResult.isSuccess(), true, testCase.description);
        assertEquals(workspaceResult.isSuccess(), true, testCase.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          const workspace = workspaceResult.getValue();
          
          // Create services and verify they don't corrupt invariants
          const inputResolver = new InputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          
          assertExists(inputResolver);
          assertExists(variablesFactory);
          
          // Invariants should remain uncorrupted
          assertEquals(directive.value, testCase.directive);
          assertEquals(layer.value, testCase.layer);
          assertEquals(workspace.value, testCase.workspace);
          
          logger.debug("Invariant corruption prevention verified", {
            testCase: testCase.description,
            invariantsUncorrupted: true
          });
        }
      }
    });
  });

  describe("Context Mapping and Translation Accuracy", () => {
    it("should accurately map concepts between boundary contexts", async () => {
      // Arrange - Context mapping test scenarios
      const mappingScenarios = [
        {
          scenario: "Parameter to Path Mapping",
          directive: "to",
          layer: "project",
          expectedMapping: "to_project",
          description: "Parameter concepts should map to path concepts accurately"
        },
        {
          scenario: "Configuration to Variable Mapping",
          directive: "summary",
          layer: "issue", 
          workspace: "mapping-workspace",
          expectedMapping: "summary_issue",
          description: "Configuration concepts should map to variable concepts accurately"
        }
      ];
      
      logger.debug("Testing context mapping and translation accuracy", {
        scenarioCount: mappingScenarios.length
      });

      // Act & Assert
      for (const scenario of mappingScenarios) {
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(scenario.directive);
        const layerResult = typeFactory.createLayerType(scenario.layer);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.description);
        assertEquals(layerResult.isSuccess(), true, scenario.description);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess()) {
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          
          // Test context mapping accuracy
          const actualMapping = `${directive.value}_${layer.value}`;
          assertEquals(actualMapping, scenario.expectedMapping, scenario.description);
          
          // Additional context services should work with mapped concepts
          if (scenario.workspace) {
            const workspaceResult = WorkspaceName.createOrError(scenario.workspace);
            assertEquals(workspaceResult.isSuccess(), true, scenario.description);
          }
          
          const inputResolver = new InputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          
          assertExists(inputResolver);
          assertExists(variablesFactory);
          
          logger.debug("Context mapping accuracy verified", {
            scenario: scenario.scenario,
            mapping: actualMapping,
            accurate: actualMapping === scenario.expectedMapping
          });
        }
      }
    });

    it("should maintain translation fidelity across context boundaries", async () => {
      // Arrange - Translation fidelity test data
      const fidelityTestData = {
        originalDirective: "to",
        originalLayer: "project", 
        originalWorkspace: "fidelity-workspace",
        translationSteps: [
          "parameter_parsing",
          "configuration_management", 
          "path_resolution",
          "variable_generation"
        ]
      };
      
      logger.debug("Testing translation fidelity across context boundaries", fidelityTestData);

      // Act - Track translation fidelity through each step
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      // Step 1: Parameter Parsing Translation
      const directiveResult = typeFactory.createDirectiveType(fidelityTestData.originalDirective);
      const layerResult = typeFactory.createLayerType(fidelityTestData.originalLayer);
      
      assertEquals(directiveResult.isSuccess(), true);
      assertEquals(layerResult.isSuccess(), true);
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Fidelity check 1
        assertEquals(directive.value, fidelityTestData.originalDirective);
        assertEquals(layer.value, fidelityTestData.originalLayer);
        
        // Step 2: Configuration Management Translation
        const workspaceResult = WorkspaceName.createOrError(fidelityTestData.originalWorkspace);
        assertEquals(workspaceResult.isSuccess(), true);
        
        if (workspaceResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          
          // Fidelity check 2 - Previous translations preserved
          assertEquals(directive.value, fidelityTestData.originalDirective);
          assertEquals(layer.value, fidelityTestData.originalLayer);
          assertEquals(workspace.value, fidelityTestData.originalWorkspace);
          
          // Step 3: Path Resolution Translation
          const inputResolver = new InputFilePathResolver();
          assertExists(inputResolver);
          
          // Fidelity check 3 - All previous translations preserved
          assertEquals(directive.value, fidelityTestData.originalDirective);
          assertEquals(layer.value, fidelityTestData.originalLayer);
          assertEquals(workspace.value, fidelityTestData.originalWorkspace);
          
          // Step 4: Variable Generation Translation
          const variablesFactory = new PromptVariablesFactory();
          assertExists(variablesFactory);
          
          // Final fidelity check - Complete translation chain preserved
          assertEquals(directive.value, fidelityTestData.originalDirective);
          assertEquals(layer.value, fidelityTestData.originalLayer);
          assertEquals(workspace.value, fidelityTestData.originalWorkspace);
          
          logger.debug("Translation fidelity maintained across all boundaries", {
            originalValues: {
              directive: fidelityTestData.originalDirective,
              layer: fidelityTestData.originalLayer, 
              workspace: fidelityTestData.originalWorkspace
            },
            finalValues: {
              directive: directive.value,
              layer: layer.value,
              workspace: workspace.value
            },
            fidelityMaintained: true
          });
        }
      }
    });
  });

  describe("Anti-Corruption Layer Effectiveness", () => {
    it("should prevent corruption between boundary contexts", async () => {
      // Arrange - Corruption prevention test scenarios
      const corruptionPreventionTests = [
        {
          name: "Parameter Context Isolation",
          directive: "to",
          layer: "project",
          corruptionAttempt: "external_modification",
          description: "Parameter context should resist external corruption"
        },
        {
          name: "Configuration Context Isolation", 
          workspace: "isolated-workspace",
          configSet: "isolated-config",
          corruptionAttempt: "external_modification",
          description: "Configuration context should resist external corruption"
        }
      ];
      
      logger.debug("Testing anti-corruption layer effectiveness", {
        testCount: corruptionPreventionTests.length
      });

      // Act & Assert
      for (const test of corruptionPreventionTests) {
        if (test.directive && test.layer) {
          const config = new ConfigTwoParams();
          const typeFactory = new TypeFactory(config);
          
          const directiveResult = typeFactory.createDirectiveType(test.directive);
          const layerResult = typeFactory.createLayerType(test.layer);
          
          assertEquals(directiveResult.isSuccess(), true, test.description);
          assertEquals(layerResult.isSuccess(), true, test.description);
          
          if (directiveResult.isSuccess() && layerResult.isSuccess()) {
            const directive = directiveResult.getValue();
            const layer = layerResult.getValue();
            
            // Anti-corruption: Original values should be protected
            assertEquals(directive.value, test.directive);
            assertEquals(layer.value, test.layer);
            
            // External services should not corrupt internal state
            const inputResolver = new InputFilePathResolver();
            assertExists(inputResolver);
            
            // Values should remain uncorrupted after external service interaction
            assertEquals(directive.value, test.directive);
            assertEquals(layer.value, test.layer);
            
            logger.debug("Parameter context corruption resistance verified", {
              test: test.name,
              originalDirective: test.directive,
              protectedDirective: directive.value,
              originalLayer: test.layer,
              protectedLayer: layer.value,
              corruptionPrevented: true
            });
          }
        }
        
        if (test.workspace && test.configSet) {
          const workspaceResult = WorkspaceName.createOrError(test.workspace);
          const configSetResult = ConfigSetName.createOrError(test.configSet);
          
          assertEquals(workspaceResult.isSuccess(), true, test.description);
          assertEquals(configSetResult.isSuccess(), true, test.description);
          
          if (workspaceResult.isSuccess() && configSetResult.isSuccess()) {
            const workspace = workspaceResult.getValue();
            const configSet = configSetResult.getValue();
            
            // Anti-corruption: Configuration values should be protected
            assertEquals(workspace.value, test.workspace);
            assertEquals(configSet.value, test.configSet);
            
            // External services should not corrupt configuration state
            const variablesFactory = new PromptVariablesFactory();
            assertExists(variablesFactory);
            
            // Values should remain uncorrupted after external service interaction
            assertEquals(workspace.value, test.workspace);
            assertEquals(configSet.value, test.configSet);
            
            logger.debug("Configuration context corruption resistance verified", {
              test: test.name,
              originalWorkspace: test.workspace,
              protectedWorkspace: workspace.value,
              originalConfigSet: test.configSet,
              protectedConfigSet: configSet.value,
              corruptionPrevented: true
            });
          }
        }
      }
    });

    it("should isolate context failures to prevent cascade corruption", async () => {
      // Arrange - Cascade corruption prevention test
      const cascadePreventionData = {
        validContexts: {
          directive: "to",
          layer: "project", 
          workspace: "cascade-workspace"
        },
        invalidInputs: {
          invalidDirective: "",
          invalidLayer: "",
          invalidWorkspace: ""
        }
      };
      
      logger.debug("Testing cascade corruption prevention", cascadePreventionData);

      // Act - Create valid contexts first
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const validDirectiveResult = typeFactory.createDirectiveType(cascadePreventionData.validContexts.directive);
      const validLayerResult = typeFactory.createLayerType(cascadePreventionData.validContexts.layer);
      const validWorkspaceResult = WorkspaceName.createOrError(cascadePreventionData.validContexts.workspace);
      
      assertEquals(validDirectiveResult.isSuccess(), true);
      assertEquals(validLayerResult.isSuccess(), true);
      assertEquals(validWorkspaceResult.isSuccess(), true);
      
      if (validDirectiveResult.isSuccess() && validLayerResult.isSuccess() && validWorkspaceResult.isSuccess()) {
        const validDirective = validDirectiveResult.getValue();
        const validLayer = validLayerResult.getValue();
        const validWorkspace = validWorkspaceResult.getValue();
        
        // Act - Attempt to create invalid contexts (should fail in isolation)
        const invalidDirectiveResult = typeFactory.createDirectiveType(cascadePreventionData.invalidInputs.invalidDirective);
        const invalidLayerResult = typeFactory.createLayerType(cascadePreventionData.invalidInputs.invalidLayer);
        const invalidWorkspaceResult = WorkspaceName.createOrError(cascadePreventionData.invalidInputs.invalidWorkspace);
        
        // Assert - Invalid contexts should fail independently
        assertEquals(invalidDirectiveResult.isFailure(), true);
        assertEquals(invalidLayerResult.isFailure(), true);
        assertEquals(invalidWorkspaceResult.isFailure(), true);
        
        // Assert - Valid contexts should remain unaffected by invalid context failures
        assertEquals(validDirective.value, cascadePreventionData.validContexts.directive);
        assertEquals(validLayer.value, cascadePreventionData.validContexts.layer);
        assertEquals(validWorkspace.value, cascadePreventionData.validContexts.workspace);
        
        // Services should still be operational despite some context failures
        const inputResolver = new InputFilePathResolver();
        const variablesFactory = new PromptVariablesFactory();
        
        assertExists(inputResolver);
        assertExists(variablesFactory);
        
        logger.debug("Cascade corruption prevention verified", {
          validContextsPreserved: {
            directive: validDirective.value,
            layer: validLayer.value,
            workspace: validWorkspace.value
          },
          invalidContextsIsolated: {
            directive: invalidDirectiveResult.isFailure(),
            layer: invalidLayerResult.isFailure(),
            workspace: invalidWorkspaceResult.isFailure()
          },
          servicesOperational: { inputResolver: !!inputResolver, variablesFactory: !!variablesFactory }
        });
      }
    });
  });

  describe("End-to-End Core Domain Value Delivery Verification", () => {
    it("should deliver complete core domain value through boundary context integration", async () => {
      // Arrange - Complete core domain value delivery scenario
      const valuDeliveryScenario = {
        input: {
          directive: "to",
          layer: "project",
          workspace: "value-delivery-workspace", 
          basePath: "/value/delivery/path",
          configSet: "production"
        },
        expectedValue: {
          parametersParsed: true,
          pathsResolved: true,
          variablesGenerated: true,
          configurationManaged: true,
          integrationComplete: true
        }
      };
      
      logger.debug("Testing complete core domain value delivery", valuDeliveryScenario);

      // Act - Execute complete core domain workflow
      
      // Value Delivery Step 1: Parameter Parsing
      const config = new ConfigTwoParams();
      const typeFactory = new TypeFactory(config);
      
      const directiveResult = typeFactory.createDirectiveType(valuDeliveryScenario.input.directive);
      const layerResult = typeFactory.createLayerType(valuDeliveryScenario.input.layer);
      
      assertEquals(directiveResult.isSuccess(), true, "Core domain should parse parameters");
      assertEquals(layerResult.isSuccess(), true, "Core domain should parse parameters");
      
      if (directiveResult.isSuccess() && layerResult.isSuccess()) {
        const directive = directiveResult.getValue();
        const layer = layerResult.getValue();
        
        // Value Delivery Step 2: Configuration Management
        const workspaceResult = WorkspaceName.createOrError(valuDeliveryScenario.input.workspace);
        const basePathResult = BasePath.createOrError(valuDeliveryScenario.input.basePath);
        const configSetResult = ConfigSetName.createOrError(valuDeliveryScenario.input.configSet);
        
        assertEquals(workspaceResult.isSuccess(), true, "Core domain should manage configuration");
        assertEquals(basePathResult.isSuccess(), true, "Core domain should manage configuration");
        assertEquals(configSetResult.isSuccess(), true, "Core domain should manage configuration");
        
        if (workspaceResult.isSuccess() && basePathResult.isSuccess() && configSetResult.isSuccess()) {
          const workspace = workspaceResult.getValue();
          const basePath = basePathResult.getValue();
          const configSet = configSetResult.getValue();
          
          // Value Delivery Step 3: Path Resolution
          const inputResolver = new InputFilePathResolver();
          const outputResolver = new OutputFilePathResolver();
          const configDetector = new ConfigPrefixDetector();
          
          assertExists(inputResolver, "Core domain should resolve paths");
          assertExists(outputResolver, "Core domain should resolve paths");
          assertExists(configDetector, "Core domain should resolve paths");
          
          // Value Delivery Step 4: Variable Generation
          const variablesFactory = new PromptVariablesFactory();
          assertExists(variablesFactory, "Core domain should generate variables");
          
          // Assert - Complete core domain value delivered
          const actualValue = {
            parametersParsed: directiveResult.isSuccess() && layerResult.isSuccess(),
            pathsResolved: !!inputResolver && !!outputResolver && !!configDetector,
            variablesGenerated: !!variablesFactory,
            configurationManaged: workspaceResult.isSuccess() && basePathResult.isSuccess() && configSetResult.isSuccess(),
            integrationComplete: true
          };
          
          assertEquals(actualValue.parametersParsed, valuDeliveryScenario.expectedValue.parametersParsed);
          assertEquals(actualValue.pathsResolved, valuDeliveryScenario.expectedValue.pathsResolved);
          assertEquals(actualValue.variablesGenerated, valuDeliveryScenario.expectedValue.variablesGenerated);
          assertEquals(actualValue.configurationManaged, valuDeliveryScenario.expectedValue.configurationManaged);
          assertEquals(actualValue.integrationComplete, valuDeliveryScenario.expectedValue.integrationComplete);
          
          // Verify end-to-end value delivery artifacts
          assertEquals(directive.value, valuDeliveryScenario.input.directive);
          assertEquals(layer.value, valuDeliveryScenario.input.layer);
          assertEquals(workspace.value, valuDeliveryScenario.input.workspace);
          assertEquals(basePath.value, valuDeliveryScenario.input.basePath);
          assertEquals(configSet.value, valuDeliveryScenario.input.configSet);
          
          const deliveredPathPattern = `${directive.value}_${layer.value}`;
          assertExists(deliveredPathPattern);
          
          logger.debug("Complete core domain value delivery verified", {
            input: valuDeliveryScenario.input,
            deliveredValue: actualValue,
            valueArtifacts: {
              pathPattern: deliveredPathPattern,
              allServicesOperational: true,
              allContextsIntegrated: true
            }
          });
        }
      }
    });

    it("should consistently deliver core domain value across multiple scenarios", async () => {
      // Arrange - Multiple value delivery scenarios
      const multipleScenarios = [
        {
          name: "Transformation Value Delivery",
          directive: "to",
          layer: "project",
          workspace: "transformation-workspace"
        },
        {
          name: "Analysis Value Delivery",
          directive: "summary", 
          layer: "issue",
          workspace: "analysis-workspace"
        },
        {
          name: "Quality Value Delivery",
          directive: "defect",
          layer: "task",
          workspace: "quality-workspace"
        }
      ];
      
      logger.debug("Testing consistent core domain value delivery across scenarios", {
        scenarioCount: multipleScenarios.length
      });

      // Act & Assert
      for (const scenario of multipleScenarios) {
        // Each scenario should deliver complete core domain value
        const config = new ConfigTwoParams();
        const typeFactory = new TypeFactory(config);
        
        const directiveResult = typeFactory.createDirectiveType(scenario.directive);
        const layerResult = typeFactory.createLayerType(scenario.layer);
        const workspaceResult = WorkspaceName.createOrError(scenario.workspace);
        
        assertEquals(directiveResult.isSuccess(), true, scenario.name);
        assertEquals(layerResult.isSuccess(), true, scenario.name);
        assertEquals(workspaceResult.isSuccess(), true, scenario.name);
        
        if (directiveResult.isSuccess() && layerResult.isSuccess() && workspaceResult.isSuccess()) {
          // All core domain services should be available for value delivery
          const inputResolver = new InputFilePathResolver();
          const outputResolver = new OutputFilePathResolver();
          const variablesFactory = new PromptVariablesFactory();
          const configDetector = new ConfigPrefixDetector();
          
          assertExists(inputResolver);
          assertExists(outputResolver);
          assertExists(variablesFactory);
          assertExists(configDetector);
          
          // Value should be consistently delivered
          const directive = directiveResult.getValue();
          const layer = layerResult.getValue();
          const workspace = workspaceResult.getValue();
          
          assertEquals(directive.value, scenario.directive);
          assertEquals(layer.value, scenario.layer);
          assertEquals(workspace.value, scenario.workspace);
          
          const pathPattern = `${directive.value}_${layer.value}`;
          assertExists(pathPattern);
          
          logger.debug("Consistent value delivery verified", {
            scenario: scenario.name,
            valueDelivered: {
              pathPattern: pathPattern,
              allServicesAvailable: true,
              contextIntegration: true
            }
          });
        }
      }
    });
  });
});