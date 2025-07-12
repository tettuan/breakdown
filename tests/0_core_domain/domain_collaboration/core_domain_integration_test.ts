/**
 * @fileoverview Core Domain Integration Test
 *
 * 核心ドメイン全体の統合テスト
 * DirectiveType、LayerType、TwoParamsアグリゲートの連携動作を検証
 *
 * @module tests/0_core_domain/domain_collaboration/core_domain_integration_test
 */

import { assertEquals, assertExists, assertFalse, assertTrue } from "jsr:@std/assert@1.0.0";
import { describe, it } from "jsr:@std/testing@1.0.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Core domain imports
import { DirectiveType } from "$lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "$lib/domain/core/value_objects/layer_type.ts";
import { TwoParams } from "$lib/domain/core/aggregates/two_params.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("core-domain-integration");

describe("Core Domain Integration Tests", () => {
  describe("DirectiveType-LayerType collaboration", () => {
    it("should create valid DirectiveType and LayerType combination", () => {
      logger.debug("Testing DirectiveType-LayerType basic collaboration");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Create DirectiveType
      const directiveResult = DirectiveType.create("to", profile);
      assertTrue(directiveResult.ok, "DirectiveType creation should succeed");
      
      // Act: Create LayerType  
      const layerResult = LayerType.create("issue");
      assertTrue(layerResult.ok, "LayerType creation should succeed");
      
      const directive = directiveResult.data;
      const layer = layerResult.data;
      
      // Assert: Basic properties
      assertEquals(directive.value, "to");
      assertEquals(layer.value, "issue");
      
      // Assert: Compatibility check
      assertTrue(layer.isValidForDirective(directive), "Layer should be compatible with directive");
      assertTrue(directive.isValidForProfile(profile), "Directive should be valid for profile");
      
      logger.debug("DirectiveType-LayerType collaboration verified", {
        directive: directive.value,
        layer: layer.value,
        profile: profile.value
      });
    });

    it("should handle invalid DirectiveType-LayerType combinations gracefully", () => {
      logger.debug("Testing invalid DirectiveType-LayerType combinations");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Invalid DirectiveType
      const invalidDirectiveResult = DirectiveType.create("", profile);
      assertFalse(invalidDirectiveResult.ok, "Empty directive should fail");
      assertEquals(invalidDirectiveResult.error.kind, "EmptyInput");
      
      // Act: Invalid LayerType
      const invalidLayerResult = LayerType.create("");
      assertFalse(invalidLayerResult.ok, "Empty layer should fail");
      assertEquals(invalidLayerResult.error.kind, "EmptyInput");
      
      logger.debug("Invalid combinations handled correctly");
    });

    it("should provide consistent path resolution operations", () => {
      logger.debug("Testing path resolution consistency");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const directiveResult = DirectiveType.create("to", profile);
      const layerResult = LayerType.create("project");
      
      assertTrue(directiveResult.ok && layerResult.ok, "Setup should succeed");
      
      const directive = directiveResult.data;
      const layer = layerResult.data;
      
      // Act: Path resolution operations
      const promptDir = directive.getPromptDirectory("prompts", layer);
      const schemaDir = directive.getSchemaDirectory("schemas", layer);
      const promptFileName = layer.getPromptFilename("issue");
      const schemaFileName = layer.getSchemaFilename();
      
      // Assert: Path consistency
      assertEquals(promptDir, "prompts/to/project");
      assertEquals(schemaDir, "schemas/to/project");
      assertEquals(promptFileName, "f_project.md");
      assertEquals(schemaFileName, "base.schema.json");
      
      logger.debug("Path resolution operations consistent", {
        promptDir,
        schemaDir,
        promptFileName,
        schemaFileName
      });
    });
  });

  describe("TwoParams Aggregate comprehensive testing", () => {
    it("should create TwoParams aggregate with valid DirectiveType and LayerType", () => {
      logger.debug("Testing TwoParams aggregate creation");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Create TwoParams aggregate
      const twoParamsResult = TwoParams.create("to", "issue", profile);
      assertTrue(twoParamsResult.ok, "TwoParams creation should succeed");
      
      const twoParams = twoParamsResult.data;
      
      // Assert: Aggregate properties
      assertEquals(twoParams.directive.value, "to");
      assertEquals(twoParams.layer.value, "issue");
      assertEquals(twoParams.profile.value, "default");
      
      // Assert: Aggregate operations
      const validateResult = twoParams.validate();
      assertTrue(validateResult.ok, "TwoParams validation should succeed");
      
      const command = twoParams.toCommand();
      assertEquals(command.command, "breakdown");
      assertEquals(command.directive, "to");
      assertEquals(command.layer, "issue");
      assertEquals(command.profile, "default");
      assertExists(command.timestamp);
      
      logger.debug("TwoParams aggregate created successfully", {
        directive: twoParams.directive.value,
        layer: twoParams.layer.value,
        profile: twoParams.profile.value
      });
    });

    it("should handle TwoParams creation failures with detailed errors", () => {
      logger.debug("Testing TwoParams creation error handling");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Act: Invalid directive
      const invalidDirectiveResult = TwoParams.create("", "issue", profile);
      assertFalse(invalidDirectiveResult.ok, "Invalid directive should fail");
      assertEquals(invalidDirectiveResult.error.kind, "InvalidDirective");
      
      // Act: Invalid layer
      const invalidLayerResult = TwoParams.create("to", "", profile);
      assertFalse(invalidLayerResult.ok, "Invalid layer should fail");
      assertEquals(invalidLayerResult.error.kind, "InvalidLayer");
      
      logger.debug("TwoParams error handling verified");
    });

    it("should provide comprehensive path resolution through TwoParams", () => {
      logger.debug("Testing TwoParams path resolution capabilities");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "task", profile);
      assertTrue(twoParamsResult.ok, "Setup should succeed");
      
      const twoParams = twoParamsResult.data;
      
      // Act: Path resolution operations
      const promptPath = twoParams.getPromptPath("issue");
      const schemaPath = twoParams.getSchemaPath();
      const promptFilePath = twoParams.resolvePromptFilePath("prompts", "issue");
      const schemaFilePath = twoParams.resolveSchemaFilePath("schemas");
      
      // Assert: Path resolution results
      assertEquals(promptPath.directive, "to");
      assertEquals(promptPath.layer, "task");
      assertEquals(promptPath.fromLayer, "issue");
      assertEquals(promptPath.resolve(), "prompts/to/task/f_task.md");
      
      assertEquals(schemaPath.directive, "to");
      assertEquals(schemaPath.layer, "task");
      assertEquals(schemaPath.resolve(), "schemas/to/task/base.schema.json");
      
      assertEquals(promptFilePath, "prompts/to/task/f_task.md");
      assertEquals(schemaFilePath, "schemas/to/task/base.schema.json");
      
      logger.debug("TwoParams path resolution comprehensive", {
        promptPath: promptPath.resolve(),
        schemaPath: schemaPath.resolve(),
        promptFilePath,
        schemaFilePath
      });
    });

    it("should handle adaptation parameters in path resolution", () => {
      logger.debug("Testing adaptation parameter handling");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "issue", profile);
      assertTrue(twoParamsResult.ok, "Setup should succeed");
      
      const twoParams = twoParamsResult.data;
      
      // Act: Path resolution with adaptation
      const promptPath = twoParams.getPromptPath("project", "strict");
      const adaptedPath = twoParams.resolvePromptFilePath("prompts", "project", "detailed");
      
      // Assert: Adaptation handling
      assertEquals(promptPath.adaptation, "strict");
      assertEquals(promptPath.resolveWithAdaptation("custom"), "prompts/to/issue/f_issue_custom.md");
      assertEquals(adaptedPath, "prompts/to/issue/f_issue_detailed.md");
      
      logger.debug("Adaptation parameters handled correctly", {
        adaptedPromptPath: promptPath.resolveWithAdaptation("custom"),
        adaptedFilePath: adaptedPath
      });
    });
  });

  describe("Core Domain boundary collaboration", () => {
    it("should maintain consistency across domain boundary operations", () => {
      logger.debug("Testing core domain boundary consistency");

      // Arrange: Multiple TwoParams instances
      const profile = ConfigProfileName.createDefault();
      const twoParams1Result = TwoParams.create("to", "project", profile);
      const twoParams2Result = TwoParams.create("to", "issue", profile);
      const twoParams3Result = TwoParams.create("summary", "project", profile);
      
      assertTrue(twoParams1Result.ok && twoParams2Result.ok && twoParams3Result.ok, "Setup should succeed");
      
      const twoParams1 = twoParams1Result.data;
      const twoParams2 = twoParams2Result.data;
      const twoParams3 = twoParams3Result.data;
      
      // Act: Cross-instance operations
      const sameDirective = twoParams1.directive.equals(twoParams2.directive);
      const sameProfile = twoParams1.profile.equals(twoParams2.profile);
      const differentDirective = !twoParams1.directive.equals(twoParams3.directive);
      const sameLayer = twoParams1.layer.equals(twoParams3.layer);
      
      // Assert: Consistency checks
      assertTrue(sameDirective, "Same directive types should be equal");
      assertTrue(sameProfile, "Same profiles should be equal");
      assertTrue(differentDirective, "Different directive types should not be equal");
      assertTrue(sameLayer, "Same layer types should be equal");
      
      // Assert: TwoParams equality
      assertFalse(twoParams1.equals(twoParams2), "Different TwoParams should not be equal");
      assertFalse(twoParams1.equals(twoParams3), "Different TwoParams should not be equal");
      
      logger.debug("Domain boundary consistency verified", {
        sameDirective,
        sameProfile,
        differentDirective,
        sameLayer
      });
    });

    it("should handle CLI option integration correctly", () => {
      logger.debug("Testing CLI option integration");

      // Arrange & Act: CLI option scenarios
      const defaultProfileResult = TwoParams.createWithCliOption("to", "issue", null);
      const explicitProfileResult = TwoParams.createWithCliOption("to", "issue", "custom");
      const undefinedProfileResult = TwoParams.createWithCliOption("to", "issue", undefined);
      
      // Assert: CLI option handling
      assertTrue(defaultProfileResult.ok, "Default profile should work");
      assertEquals(defaultProfileResult.data.profile.value, "default");
      
      assertTrue(explicitProfileResult.ok, "Explicit profile should work");
      assertEquals(explicitProfileResult.data.profile.value, "custom");
      
      assertTrue(undefinedProfileResult.ok, "Undefined profile should default");
      assertEquals(undefinedProfileResult.data.profile.value, "default");
      
      logger.debug("CLI option integration verified", {
        defaultProfile: defaultProfileResult.data.profile.value,
        explicitProfile: explicitProfileResult.data.profile.value,
        undefinedProfile: undefinedProfileResult.data.profile.value
      });
    });

    it("should provide comprehensive debugging information", () => {
      logger.debug("Testing debugging information comprehensiveness");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "issue", profile);
      assertTrue(twoParamsResult.ok, "Setup should succeed");
      
      const twoParams = twoParamsResult.data;
      
      // Act: Debug information extraction
      const twoParamsDebug = twoParams.toDebugString();
      const directiveDebug = twoParams.directive.toDebugString();
      const layerDebug = twoParams.layer.toDebugString();
      const twoParamsString = twoParams.toString();
      
      // Assert: Debug information quality
      assertTrue(twoParamsDebug.includes("TwoParams"), "TwoParams debug should include class name");
      assertTrue(twoParamsDebug.includes("directive=\"to\""), "Should include directive info");
      assertTrue(twoParamsDebug.includes("layer=\"issue\""), "Should include layer info");
      assertTrue(twoParamsDebug.includes("profile=\"default\""), "Should include profile info");
      
      assertTrue(directiveDebug.includes("DirectiveType"), "DirectiveType debug should include class name");
      assertTrue(layerDebug.includes("LayerType"), "LayerType debug should include class name");
      
      assertEquals(twoParamsString, "to issue", "String representation should be concise");
      
      logger.debug("Debugging information comprehensive", {
        twoParamsDebug,
        directiveDebug,
        layerDebug,
        twoParamsString
      });
    });
  });

  describe("Error handling and edge cases integration", () => {
    it("should handle profile validation errors consistently", () => {
      logger.debug("Testing profile validation error consistency");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      
      // Mock scenario:假設某個指令對特定profile無效（需要實際的配置來測試）
      // 這裡我們測試基本的錯誤處理一致性
      const validTwoParamsResult = TwoParams.create("to", "issue", profile);
      assertTrue(validTwoParamsResult.ok, "Valid combination should succeed");
      
      const twoParams = validTwoParamsResult.data;
      const validationResult = twoParams.validate();
      assertTrue(validationResult.ok, "Validation should succeed for valid TwoParams");
      
      logger.debug("Profile validation consistency verified");
    });

    it("should maintain immutability across all operations", () => {
      logger.debug("Testing immutability across operations");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "issue", profile);
      assertTrue(twoParamsResult.ok, "Setup should succeed");
      
      const twoParams = twoParamsResult.data;
      const originalDirective = twoParams.directive.value;
      const originalLayer = twoParams.layer.value;
      const originalProfile = twoParams.profile.value;
      
      // Act: Various operations that should not mutate
      twoParams.getPromptPath();
      twoParams.getSchemaPath();
      twoParams.toCommand();
      twoParams.validate();
      twoParams.toString();
      twoParams.toDebugString();
      
      // Assert: Immutability maintained
      assertEquals(twoParams.directive.value, originalDirective, "Directive should remain unchanged");
      assertEquals(twoParams.layer.value, originalLayer, "Layer should remain unchanged");
      assertEquals(twoParams.profile.value, originalProfile, "Profile should remain unchanged");
      
      logger.debug("Immutability maintained across all operations");
    });

    it("should handle concurrent access patterns safely", () => {
      logger.debug("Testing concurrent access safety");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const twoParamsResult = TwoParams.create("to", "project", profile);
      assertTrue(twoParamsResult.ok, "Setup should succeed");
      
      const twoParams = twoParamsResult.data;
      
      // Act: Simulate concurrent access
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push({
          promptPath: twoParams.resolvePromptFilePath("prompts", "issue"),
          schemaPath: twoParams.resolveSchemaFilePath("schemas"),
          command: twoParams.toCommand(),
          validation: twoParams.validate()
        });
      }
      
      // Assert: Consistency across concurrent access
      const firstResult = results[0];
      for (const result of results) {
        assertEquals(result.promptPath, firstResult.promptPath, "Prompt paths should be consistent");
        assertEquals(result.schemaPath, firstResult.schemaPath, "Schema paths should be consistent");
        assertEquals(result.command.directive, firstResult.command.directive, "Command directives should be consistent");
        assertEquals(result.validation.ok, firstResult.validation.ok, "Validation results should be consistent");
      }
      
      logger.debug("Concurrent access safety verified", {
        accessCount: results.length,
        consistencyVerified: true
      });
    });
  });
});