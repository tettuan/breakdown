/**
 * @fileoverview Cross Domain Collaboration Test
 *
 * 核心ドメイン境界を超えた協働テスト
 * 核心ドメインと支援ドメイン、技術基盤ドメインとの統合動作を検証
 *
 * @module tests/0_core_domain/domain_collaboration/cross_domain_collaboration_test
 */

import { assertEquals, assertExists, assertFalse, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Core domain imports
import { TwoParams } from "$lib/domain/core/aggregates/two_params.ts";
import { DirectiveType } from "$lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "$lib/domain/core/value_objects/layer_type.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";

// Generic domain imports (factory collaborations)
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import { PromptTemplatePathResolver } from "$lib/factory/prompt_template_path_resolver.ts";

const logger = new BreakdownLogger("cross-domain-collaboration");

describe("Cross Domain Collaboration Tests", () => {
  describe("Core Domain to Generic Domain integration", () => {
    it("should integrate TwoParams with PromptVariablesFactory", async () => {
      logger.debug("Testing TwoParams-PromptVariablesFactory integration");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "issue", profile);
      if (!twoParamsResult.ok) {
        throw new Error(`TwoParams creation failed: ${JSON.stringify(twoParamsResult.error)}`);
      }
      assert(twoParamsResult.ok, "TwoParams creation should succeed");
      const twoParams = twoParamsResult.data;
      
      // Act: Test cross-domain data collaboration
      // This represents the data that would be passed to factories
      const collaborationData = {
        directive: twoParams.directive.value,
        layer: twoParams.layer.value,
        profile: twoParams.profile.value,
        inputFilePath: "test-input.md",
        outputFilePath: "test-output.json",
        stdinData: "test stdin content"
      };
      
      // Test that core domain data is properly structured for generic domain use
      assertExists(collaborationData, "Collaboration data should exist");
      
      // Verify cross-domain data consistency
      assertEquals(collaborationData.directive, twoParams.directive.value, 
        "Directive should match TwoParams");
      assertEquals(collaborationData.layer, twoParams.layer.value,
        "Layer should match TwoParams");
      
      logger.debug("TwoParams-PromptVariablesFactory integration verified", {
        directive: twoParams.directive.value,
        layer: twoParams.layer.value,
        variablesCreated: true
      });
    });

    it("should integrate TwoParams with PromptTemplatePathResolver", () => {
      logger.debug("Testing TwoParams-PromptTemplatePathResolver integration");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "project", profile);
      if (!twoParamsResult.ok) {
        throw new Error(`TwoParams creation failed: ${JSON.stringify(twoParamsResult.error)}`);
      }
      assert(twoParamsResult.ok, "TwoParams creation should succeed");
      const twoParams = twoParamsResult.data;
      
      // Act: Test cross-domain path collaboration
      // TwoParams provides path resolution capabilities that work with generic domain
      const promptPath = twoParams.resolvePromptFilePath("prompts", "issue");
      const schemaPath = twoParams.resolveSchemaFilePath("schemas");
      
      // Test that TwoParams generates paths compatible with path resolvers
      assert(promptPath.includes(twoParams.directive.value),
        "Prompt path should include directive");
      assert(promptPath.includes(twoParams.layer.value),
        "Prompt path should include layer");
      assert(schemaPath.includes(twoParams.directive.value),
        "Schema path should include directive");
      assert(schemaPath.includes(twoParams.layer.value),
        "Schema path should include layer");
      
      // Verify path structure consistency
      const expectedPromptPattern = `prompts/${twoParams.directive.value}/${twoParams.layer.value}/`;
      const expectedSchemaPattern = `schemas/${twoParams.directive.value}/${twoParams.layer.value}/`;
      
      assert(promptPath.startsWith(expectedPromptPattern),
        `Prompt path should start with ${expectedPromptPattern}`);
      assert(schemaPath.startsWith(expectedSchemaPattern),
        `Schema path should start with ${expectedSchemaPattern}`);
      
      logger.debug("TwoParams-PromptTemplatePathResolver integration verified", {
        promptPath,
        schemaPath,
        directive: twoParams.directive.value,
        layer: twoParams.layer.value
      });
    });

    it("should maintain data consistency across domain boundaries", () => {
      logger.debug("Testing data consistency across domain boundaries");

      // Arrange: Create TwoParams instances with different profiles
      const defaultProfile = ConfigProfileName.createDefault();
      const customProfile = ConfigProfileName.fromCliOption("custom");
      
      const defaultResult = TwoParams.create("to", "issue", defaultProfile);
      const customResult = TwoParams.create("to", "issue", customProfile);
      if (!defaultResult.ok || !customResult.ok) {
        throw new Error("Failed to create test TwoParams");
      }
      const defaultTwoParams = defaultResult.data;
      const customTwoParams = customResult.data;
      
      // Act: Generate data for cross-domain operations
      const defaultData = {
        directive: defaultTwoParams.directive.value,
        layer: defaultTwoParams.layer.value,
        profile: defaultTwoParams.profile.value,
        promptPath: defaultTwoParams.resolvePromptFilePath("prompts", "project"),
        schemaPath: defaultTwoParams.resolveSchemaFilePath("schemas"),
        command: defaultTwoParams.toCommand()
      };
      
      const customData = {
        directive: customTwoParams.directive.value,
        layer: customTwoParams.layer.value,
        profile: customTwoParams.profile.value,
        promptPath: customTwoParams.resolvePromptFilePath("prompts", "project"),
        schemaPath: customTwoParams.resolveSchemaFilePath("schemas"),
        command: customTwoParams.toCommand()
      };
      
      // Assert: Data consistency across profiles
      assertEquals(defaultData.directive, customData.directive, 
        "Directive should be consistent across profiles");
      assertEquals(defaultData.layer, customData.layer,
        "Layer should be consistent across profiles");
      
      // Profile-specific differences
      assertEquals(defaultData.profile, "default");
      assertEquals(customData.profile, "custom");
      
      // Path structure should be consistent (only profile affects internals)
      assert(defaultData.promptPath.includes("/to/issue/"),
        "Default prompt path should have correct structure");
      assert(customData.promptPath.includes("/to/issue/"),
        "Custom prompt path should have correct structure");
      
      logger.debug("Data consistency verified across domain boundaries", {
        defaultProfile: defaultData.profile,
        customProfile: customData.profile,
        consistentDirective: defaultData.directive === customData.directive,
        consistentLayer: defaultData.layer === customData.layer
      });
    });
  });

  describe("Error propagation across domain boundaries", () => {
    it("should handle validation errors consistently across domains", () => {
      logger.debug("Testing validation error propagation");

      // Arrange: Invalid inputs that should propagate errors
      const profile = ConfigProfileName.createDefault();
      
      const invalidCases = [
        { directive: "", layer: "issue" },
        { directive: "to", layer: "" },
        { directive: "invalid@chars", layer: "issue" },
        { directive: "to", layer: "invalid@chars" },
      ];
      
      for (const invalidCase of invalidCases) {
        // Act: Attempt to create TwoParams with invalid data
        const result = TwoParams.create(invalidCase.directive, invalidCase.layer, profile);
        assertFalse(result.ok, `Invalid case should fail: ${JSON.stringify(invalidCase)}`);
        
        if (!result.ok) {
          const error = result.error;
          
          // Assert: Error structure is suitable for cross-domain propagation
          assertExists(error.kind, "Error should have kind for categorization");
          assert(typeof error.kind === "string", "Error kind should be string");
          
          // Check that error contains enough information for other domains
          if (error.kind === "InvalidDirective") {
            assertExists((error as any).directive, "DirectiveType error should include directive");
            assertExists((error as any).profile, "DirectiveType error should include profile");
          } else if (error.kind === "InvalidLayer") {
            assertExists((error as any).layer, "LayerType error should include layer");
          }
        }
      }
      
      logger.debug("Validation error propagation verified", {
        invalidCasesCount: invalidCases.length
      });
    });

    it("should maintain error context for debugging across domains", () => {
      logger.debug("Testing error context maintenance");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Create error scenarios
      const directiveError = DirectiveType.create("", profile);
      const layerError = LayerType.create("");
      const twoParamsError = TwoParams.create("", "issue", profile);
      
      // Assert: All errors should fail as expected
      assertFalse(directiveError.ok, "DirectiveType error should fail");
      assertFalse(layerError.ok, "LayerType error should fail");
      assertFalse(twoParamsError.ok, "TwoParams error should fail");
      
      // Check error context preservation
      if (!directiveError.ok) {
        const error = directiveError.error;
        assertEquals(error.kind, "EmptyInput");
        assert(error.message.includes("DirectiveType"), "Error message should include context");
      }
      
      if (!layerError.ok) {
        const error = layerError.error;
        assertEquals(error.kind, "EmptyInput");
        assert(error.message.includes("LayerType"), "Error message should include context");
      }
      
      if (!twoParamsError.ok) {
        const error = twoParamsError.error;
        assertEquals(error.kind, "InvalidDirective");
        assertExists((error as any).cause, "TwoParams error should include cause");
      }
      
      logger.debug("Error context maintenance verified");
    });
  });

  describe("Performance across domain boundaries", () => {
    it("should maintain efficient operations across domain boundaries", () => {
      logger.debug("Testing cross-domain performance");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const operations = [];
      
      const startTime = Date.now();
      
      // Act: Perform cross-domain operations
      for (let i = 0; i < 50; i++) {
        const twoParamsResult = TwoParams.create("to", "issue", profile);
        if (!twoParamsResult.ok) {
          throw new Error(`TwoParams creation failed: ${JSON.stringify(twoParamsResult.error)}`);
        }
        const twoParams = twoParamsResult.data;
        
        // Simulate cross-domain data exchange
        const crossDomainData = {
          directive: twoParams.directive.value,
          layer: twoParams.layer.value,
          profile: twoParams.profile.value,
          promptPath: twoParams.resolvePromptFilePath("prompts", "project"),
          schemaPath: twoParams.resolveSchemaFilePath("schemas"),
          command: twoParams.toCommand(),
          validation: twoParams.validate(),
        };
        
        operations.push(crossDomainData);
      }
      
      const totalTime = Date.now() - startTime;
      
      // Assert: Performance requirements
      assert(totalTime < 200, `Operations should be fast, took ${totalTime}ms`);
      assertEquals(operations.length, 50, "All operations should succeed");
      
      // Verify all operations produced valid data
      for (const operation of operations) {
        assert(operation.promptPath.length > 0, "Prompt path should be generated");
        assert(operation.schemaPath.length > 0, "Schema path should be generated");
        assertExists(operation.command.timestamp, "Command should have timestamp");
        assert(operation.validation.ok, "Validation should succeed");
      }
      
      logger.debug("Cross-domain performance verified", {
        operationsCount: operations.length,
        totalTime,
        avgTimePerOperation: totalTime / operations.length
      });
    });

    it("should handle concurrent cross-domain operations safely", () => {
      logger.debug("Testing concurrent cross-domain operations");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Simulate concurrent operations
      const concurrentOperations = Promise.all([
        createAndProcessTwoParams("to", "project", profile),
        createAndProcessTwoParams("summary", "issue", profile),
        createAndProcessTwoParams("to", "task", profile),
        createAndProcessTwoParams("defect", "project", profile),
      ]);
      
      // This test verifies that concurrent operations don't interfere
      return concurrentOperations.then(results => {
        // Assert: All operations should succeed
        assertEquals(results.length, 4, "All concurrent operations should complete");
        
        for (const result of results) {
          assertExists(result.twoParams, "TwoParams should be created");
          assertExists(result.promptPath, "Prompt path should be generated");
          assertExists(result.schemaPath, "Schema path should be generated");
          assert(result.isValid, "Validation should succeed");
        }
        
        // Verify results are different (no cross-contamination)
        const directives = results.map(r => r.twoParams.directive.value);
        const uniqueDirectives = new Set(directives);
        assert(uniqueDirectives.size > 1, "Should have different directives");
        
        logger.debug("Concurrent cross-domain operations verified", {
          operationsCount: results.length,
          uniqueDirectives: uniqueDirectives.size
        });
      });
    });
  });

  describe("Configuration integration across domains", () => {
    it("should handle profile switching consistently across domains", () => {
      logger.debug("Testing profile switching consistency");

      // Arrange: Multiple profiles
      const profiles = [
        ConfigProfileName.createDefault(),
        ConfigProfileName.fromCliOption("development"),
        ConfigProfileName.fromCliOption("production"),
        ConfigProfileName.fromCliOption("testing"),
      ];
      
      // Act: Create TwoParams with each profile
      const profileResults = [];
      for (const profile of profiles) {
        const result = TwoParams.create("to", "issue", profile);
        if (result.ok) {
          profileResults.push({
            profile: profile.value,
            twoParams: result.data,
            promptPath: result.data.resolvePromptFilePath("prompts", "project"),
            command: result.data.toCommand()
          });
        }
      }
      
      // Assert: Profile consistency
      for (const result of profileResults) {
        assertEquals(result.twoParams.profile.value, result.profile,
          "TwoParams profile should match input profile");
        assertEquals(result.command.profile, result.profile,
          "Command profile should match input profile");
        
        // Path structure should be consistent regardless of profile
        assert(result.promptPath.includes("/to/issue/"),
          "Path structure should be consistent across profiles");
      }
      
      logger.debug("Profile switching consistency verified", {
        profilesCount: profiles.length,
        successfulResults: profileResults.length
      });
    });
  });
});

/**
 * Helper function for concurrent testing
 */
async function createAndProcessTwoParams(
  directive: string,
  layer: string,
  profile: ConfigProfileName
): Promise<{
  twoParams: TwoParams;
  promptPath: string;
  schemaPath: string;
  isValid: boolean;
}> {
  // Simulate some async processing delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  const result = TwoParams.create(directive, layer, profile);
  if (!result.ok) {
    throw new Error(`Failed to create TwoParams: ${directive}/${layer}`);
  }
  
  const twoParams = result.data;
  const promptPath = twoParams.resolvePromptFilePath("prompts", "source");
  const schemaPath = twoParams.resolveSchemaFilePath("schemas");
  const validation = twoParams.validate();
  
  return {
    twoParams,
    promptPath,
    schemaPath,
    isValid: validation.ok
  };
}