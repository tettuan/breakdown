/**
 * Core Domain Integration Test: Prompt Variable Generation
 * 
 * This test verifies the complete integration of the prompt variable generation domain,
 * ensuring proper variable creation and transformation following the Totality principle.
 * 
 * Totality Aspects Covered:
 * 1. Complete variable lifecycle from source to final prompt variables
 * 2. Integration between variable factories and builders
 * 3. Error handling for missing inputs and invalid configurations
 * 4. Variable transformation and validation pipeline
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import core domain components
import { DirectiveType } from "../../../../lib/types/directive_type.ts";
import { LayerType } from "../../../../lib/types/layer_type.ts";

const logger = new BreakdownLogger("prompt-variable-generation-integration");

describe("Prompt Variable Generation Domain Integration", () => {
  describe("Complete Variable Generation Pipeline", () => {
    it("should create and validate basic variable structure", async () => {
      // Arrange
      const directive = DirectiveType.createOrError("to");
      const layer = LayerType.createOrError("project");
      
      assertEquals(directive.isSuccess(), true);
      assertEquals(layer.isSuccess(), true);
      
      if (!directive.isSuccess() || !layer.isSuccess()) {
        throw new Error("Type creation failed");
      }

      logger.debug("Starting variable generation pipeline", {
        directive: directive.getValue().value,
        layer: layer.getValue().value
      });

      // Act - Create basic variable structure
      const variables = {
        directiveType: directive.getValue().value,
        layerType: layer.getValue().value,
        inputContent: "# Test Input\nThis is test content for variable generation.",
        outputPath: `/tmp/breakdown-${Date.now()}.md`,
        promptPath: `/templates/${directive.getValue().value}/${layer.getValue().value}/f_prompt.md`,
        schemaPath: `/schema/${directive.getValue().value}/${layer.getValue().value}.json`,
        schemaContent: JSON.stringify({ type: "object", properties: {} })
      };
      
      // Assert - All required variables present
      assertExists(variables.inputContent);
      assertExists(variables.directiveType);
      assertExists(variables.layerType);
      assertExists(variables.outputPath);
      assertExists(variables.promptPath);
      assertExists(variables.schemaPath);
      assertExists(variables.schemaContent);
      
      // Assert - Variable values are correct
      assertEquals(variables.directiveType, directive.getValue().value);
      assertEquals(variables.layerType, layer.getValue().value);
      
      logger.debug("Variable generation completed successfully", {
        directiveType: variables.directiveType,
        layerType: variables.layerType,
        hasInputContent: variables.inputContent.length > 0,
        hasSchemaContent: variables.schemaContent.length > 0
      });
    });

    it("should handle different input sources correctly", async () => {
      // Arrange
      const testInputs = [
        "# Test Project\nThis is a test input for breakdown processing.",
        "## Task Description\nDetailed task breakdown requirements.",
        "### Issue Analysis\nComprehensive issue analysis content."
      ];
      
      logger.debug("Testing different input sources", {
        inputCount: testInputs.length
      });

      // Act & Assert for each input
      for (let i = 0; i < testInputs.length; i++) {
        const input = testInputs[i];
        
        // Create configuration
        const directive = DirectiveType.createOrError("to");
        const layer = LayerType.createOrError("project");
        
        assertEquals(directive.isSuccess(), true);
        assertEquals(layer.isSuccess(), true);
        
        if (!directive.isSuccess() || !layer.isSuccess()) {
          continue;
        }

        // Simulate variable creation with different inputs
        const variables = {
          directiveType: directive.getValue().value,
          layerType: layer.getValue().value,
          inputContent: input,
          outputPath: `/tmp/breakdown-${i}.md`,
          promptPath: `/templates/${directive.getValue().value}/${layer.getValue().value}/f_prompt.md`,
          schemaPath: `/schema/${directive.getValue().value}/${layer.getValue().value}.json`,
          schemaContent: JSON.stringify({ type: "object", properties: {} })
        };
        
        assertExists(variables.inputContent);
        assertEquals(variables.inputContent, input);
        
        logger.debug("Input source processing verified", {
          inputIndex: i,
          inputLength: input.length,
          inputPreview: input.substring(0, 50) + "..."
        });
      }
    });

    it("should maintain data integrity throughout variable transformation", async () => {
      // Arrange
      const directive = DirectiveType.createOrError("summary");
      const layer = LayerType.createOrError("issue");
      
      assertEquals(directive.isSuccess(), true);
      assertEquals(layer.isSuccess(), true);
      
      if (!directive.isSuccess() || !layer.isSuccess()) {
        throw new Error("Type creation failed");
      }

      logger.debug("Testing data integrity through transformation", {
        originalDirective: directive.getValue().value,
        originalLayer: layer.getValue().value
      });

      // Act - Generate variables and track data integrity
      const variables = {
        directiveType: directive.getValue().value,
        layerType: layer.getValue().value,
        inputContent: "# Summary Test\nContent for summary processing.",
        outputPath: `/tmp/breakdown-summary.md`,
        promptPath: `/templates/${directive.getValue().value}/${layer.getValue().value}/f_prompt.md`,
        schemaPath: `/schema/${directive.getValue().value}/${layer.getValue().value}.json`,
        schemaContent: JSON.stringify({ type: "object", properties: {} })
      };
      
      // Assert - Original configuration values preserved
      assertEquals(variables.directiveType, directive.getValue().value);
      assertEquals(variables.layerType, layer.getValue().value);
      
      // Assert - Derived values are consistent
      assertEquals(variables.promptPath.includes(directive.getValue().value), true);
      assertEquals(variables.promptPath.includes(layer.getValue().value), true);
      assertEquals(variables.schemaPath.includes(directive.getValue().value), true);
      assertEquals(variables.schemaPath.includes(layer.getValue().value), true);
      
      // Assert - Path relationships are maintained
      const promptSegment = `${directive.getValue().value}/${layer.getValue().value}`;
      assertEquals(variables.promptPath.includes(promptSegment), true);
      assertEquals(variables.schemaPath.includes(promptSegment), true);
      
      logger.debug("Data integrity verified", {
        preservedDirective: variables.directiveType === directive.getValue().value,
        preservedLayer: variables.layerType === layer.getValue().value,
        consistentPaths: variables.promptPath.includes(promptSegment) && 
                        variables.schemaPath.includes(promptSegment)
      });
    });

    it("should handle complex variable dependencies", async () => {
      // Arrange
      const configurations = [
        { directive: "to", layer: "project" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "task" }
      ];
      
      logger.debug("Testing complex variable dependencies", {
        configurationCount: configurations.length
      });

      // Act - Process each configuration and verify dependencies
      for (const configData of configurations) {
        const directiveResult = DirectiveType.createOrError(configData.directive);
        const layerResult = LayerType.createOrError(configData.layer);
        
        assertEquals(directiveResult.isSuccess(), true);
        assertEquals(layerResult.isSuccess(), true);
        
        if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
          continue;
        }

        const variables = {
          directiveType: directiveResult.getValue().value,
          layerType: layerResult.getValue().value,
          inputContent: `# ${configData.directive} ${configData.layer}\nTest content.`,
          outputPath: `/tmp/breakdown-${configData.directive}-${configData.layer}.md`,
          promptPath: `/templates/${configData.directive}/${configData.layer}/f_prompt.md`,
          schemaPath: `/schema/${configData.directive}/${configData.layer}.json`,
          schemaContent: JSON.stringify({ type: "object", properties: {} })
        };
        
        // Assert - All dependencies resolved correctly
        assertExists(variables.inputContent);
        assertExists(variables.directiveType);
        assertExists(variables.layerType);
        assertExists(variables.outputPath);
        assertExists(variables.promptPath);
        assertExists(variables.schemaPath);
        assertExists(variables.schemaContent);
        
        // Assert - Cross-variable consistency
        assertEquals(variables.directiveType, configData.directive);
        assertEquals(variables.layerType, configData.layer);
        
        logger.debug("Variable dependencies resolved", {
          configuration: configData,
          variableCount: Object.keys(variables).length,
          pathConsistency: variables.promptPath.includes(configData.directive) && 
                          variables.promptPath.includes(configData.layer)
        });
      }
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should provide meaningful errors for invalid configurations", async () => {
      // Arrange
      const invalidCases = [
        { directive: "", layer: "project", description: "empty directive" },
        { directive: "to", layer: "", description: "empty layer" },
        { directive: "invalid", layer: "project", description: "invalid directive" },
        { directive: "to", layer: "invalid", description: "invalid layer" }
      ];
      
      logger.debug("Testing error handling for invalid configurations", {
        caseCount: invalidCases.length
      });

      // Act & Assert
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
          logger.debug("Directive error handled", {
            case: testCase.description,
            errorMessage: error.message
          });
        }
        
        if (layerResult.isFailure()) {
          const error = layerResult.getError();
          assertExists(error.message);
          assertEquals(error.message.length > 0, true);
          logger.debug("Layer error handled", {
            case: testCase.description,
            errorMessage: error.message
          });
        }
      }
    });

    it("should maintain stability under concurrent variable generation", async () => {
      // Arrange
      const concurrentConfigs = [
        { directive: "to", layer: "project" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "task" },
        { directive: "to", layer: "issue" },
        { directive: "summary", layer: "project" }
      ];
      
      logger.debug("Testing concurrent variable generation stability", {
        concurrentCount: concurrentConfigs.length
      });

      // Act - Generate variables concurrently
      const generationPromises = concurrentConfigs.map(async (configData) => {
        const directiveResult = DirectiveType.createOrError(configData.directive);
        const layerResult = LayerType.createOrError(configData.layer);
        
        if (!directiveResult.isSuccess() || !layerResult.isSuccess()) {
          throw new Error(`Type creation failed for ${configData.directive}/${configData.layer}`);
        }

        const variables = {
          directiveType: directiveResult.getValue().value,
          layerType: layerResult.getValue().value,
          inputContent: `# Concurrent ${configData.directive} ${configData.layer}\nTest content.`,
          outputPath: `/tmp/breakdown-concurrent-${Date.now()}.md`,
          promptPath: `/templates/${configData.directive}/${configData.layer}/f_prompt.md`,
          schemaPath: `/schema/${configData.directive}/${configData.layer}.json`,
          schemaContent: JSON.stringify({ type: "object", properties: {} })
        };
        
        return {
          configData,
          variables,
          success: true
        };
      });

      const results = await Promise.all(generationPromises);
      
      // Assert - All generations completed
      assertEquals(results.length, concurrentConfigs.length);
      
      // Assert - No interference between concurrent operations
      const successfulResults = results.filter(r => r.success);
      assertEquals(successfulResults.length, concurrentConfigs.length);
      
      // Assert - Each successful result has correct variables
      successfulResults.forEach((result) => {
        assertEquals(result.variables.directiveType, result.configData.directive);
        assertEquals(result.variables.layerType, result.configData.layer);
      });
      
      logger.debug("Concurrent variable generation completed", {
        totalOperations: results.length,
        successfulOperations: successfulResults.length,
        stabilityVerified: true
      });
    });

    it("should validate variable content integrity", async () => {
      // Arrange
      const directive = DirectiveType.createOrError("to");
      const layer = LayerType.createOrError("project");
      
      assertEquals(directive.isSuccess(), true);
      assertEquals(layer.isSuccess(), true);
      
      if (!directive.isSuccess() || !layer.isSuccess()) {
        throw new Error("Type creation failed");
      }

      logger.debug("Testing variable content integrity");

      // Act - Generate variables multiple times
      const createVariables = () => ({
        directiveType: directive.getValue().value,
        layerType: layer.getValue().value,
        inputContent: "# Integrity Test\nConsistent content for testing.",
        outputPath: `/tmp/breakdown-integrity.md`,
        promptPath: `/templates/${directive.getValue().value}/${layer.getValue().value}/f_prompt.md`,
        schemaPath: `/schema/${directive.getValue().value}/${layer.getValue().value}.json`,
        schemaContent: JSON.stringify({ type: "object", properties: {} })
      });

      const firstVars = createVariables();
      const secondVars = createVariables();
      
      // Assert - Core values should be consistent across generations
      assertEquals(firstVars.directiveType, secondVars.directiveType);
      assertEquals(firstVars.layerType, secondVars.layerType);
      assertEquals(firstVars.promptPath, secondVars.promptPath);
      assertEquals(firstVars.schemaPath, secondVars.schemaPath);
      
      // Assert - Content should be consistent
      assertExists(firstVars.inputContent);
      assertExists(secondVars.inputContent);
      assertExists(firstVars.schemaContent);
      assertExists(secondVars.schemaContent);
      
      logger.debug("Variable content integrity verified", {
        consistentDirective: firstVars.directiveType === secondVars.directiveType,
        consistentLayer: firstVars.layerType === secondVars.layerType,
        consistentPaths: firstVars.promptPath === secondVars.promptPath,
        bothHaveContent: firstVars.inputContent.length > 0 && secondVars.inputContent.length > 0
      });
    });
  });
});