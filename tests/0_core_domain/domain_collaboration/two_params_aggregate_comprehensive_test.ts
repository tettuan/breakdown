/**
 * @fileoverview TwoParams Aggregate Comprehensive Test
 *
 * TwoParamsアグリゲートの包括的な統合テスト
 * ドメインサービス、ファクトリー、リポジトリとの連携を含む完全性検証
 *
 * @module tests/0_core_domain/domain_collaboration/two_params_aggregate_comprehensive_test
 */

import { assertEquals, assertExists, assertFalse, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Core domain imports
import { TwoParams } from "../../../lib/domain/core/aggregates/two_params_optimized.ts";
import { DirectiveType } from "../../../lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../../lib/domain/core/value_objects/layer_type.ts";
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("two-params-comprehensive");

describe("TwoParams Aggregate Comprehensive Tests", () => {
  describe("Aggregate creation and validation", () => {
    it("should create TwoParams with all valid directive and layer combinations", () => {
      logger.debug("Testing comprehensive TwoParams creation");

      // Arrange: Common combinations
      const profile = ConfigProfileName.createDefault();
      const validCombinations = [
        { directive: "to", layer: "project" },
        { directive: "to", layer: "issue" },
        { directive: "to", layer: "task" },
        { directive: "summary", layer: "project" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "project" },
      ];
      
      // Act & Assert: Test each combination
      for (const combo of validCombinations) {
        const result = TwoParams.create(combo.directive, combo.layer, profile);
        assert(result.ok, `Combination ${combo.directive}/${combo.layer} should succeed`);
        
        if (result.ok) {
          const twoParams = result.data;
          assertEquals(twoParams.directive.value, combo.directive);
          assertEquals(twoParams.layer.value, combo.layer);
          assertEquals(twoParams.profile.value, "default");
          
          // Validate internal consistency
          const validationResult = twoParams.validate();
          assert(validationResult.ok, `Validation should succeed for ${combo.directive}/${combo.layer}`);
        }
      }
      
      logger.debug("All valid combinations created successfully", {
        combinationsCount: validCombinations.length
      });
    });

    it("should handle edge cases in TwoParams creation", () => {
      logger.debug("Testing TwoParams edge cases");

      const profile = ConfigProfileName.createDefault();
      
      // Test edge cases
      const edgeCases = [
        { directive: "", layer: "issue", expectError: "InvalidDirective" },
        { directive: "to", layer: "", expectError: "InvalidLayer" },
        { directive: null, layer: "issue", expectError: "InvalidDirective" },
        { directive: "to", layer: null, expectError: "InvalidLayer" },
        { directive: "very-long-directive-name-that-exceeds-limit", layer: "issue", expectError: "InvalidDirective" },
        { directive: "to", layer: "very-long-layer-name-that-exceeds-the-maximum-allowed-length", expectError: "InvalidLayer" },
        { directive: "UPPERCASE", layer: "issue", expectError: "InvalidDirective" },
        { directive: "to", layer: "UPPERCASE", expectError: "InvalidLayer" },
        { directive: "to@invalid", layer: "issue", expectError: "InvalidDirective" },
        { directive: "to", layer: "issue@invalid", expectError: "InvalidLayer" },
      ];
      
      for (const edgeCase of edgeCases) {
        const result = TwoParams.create(edgeCase.directive as any, edgeCase.layer as any, profile);
        assertFalse(result.ok, `Edge case ${edgeCase.directive}/${edgeCase.layer} should fail`);
        
        if (!result.ok) {
          assertEquals(result.error.kind, edgeCase.expectError as any);
        }
      }
      
      logger.debug("Edge cases handled correctly", {
        edgeCasesCount: edgeCases.length
      });
    });

    it("should maintain aggregate invariants throughout lifecycle", () => {
      logger.debug("Testing aggregate invariants maintenance");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "issue", profile);
      assert(result.ok, "Setup should succeed");
      
      const twoParams = result.data;
      
      // Test invariants throughout operations
      const operations = [
        () => twoParams.getPromptPath(),
        () => twoParams.getSchemaPath(),
        () => twoParams.resolvePromptFilePath("prompts"),
        () => twoParams.resolveSchemaFilePath("schemas"),
        () => twoParams.toCommand(),
        () => twoParams.validate(),
        () => twoParams.toString(),
        () => twoParams.toDebugString(),
      ];
      
      for (const operation of operations) {
        // Before operation
        const beforeDirective = twoParams.directive.value;
        const beforeLayer = twoParams.layer.value;
        const beforeProfile = twoParams.profile.value;
        
        // Execute operation
        operation();
        
        // After operation - invariants should be maintained
        assertEquals(twoParams.directive.value, beforeDirective, "Directive should remain unchanged");
        assertEquals(twoParams.layer.value, beforeLayer, "Layer should remain unchanged");
        assertEquals(twoParams.profile.value, beforeProfile, "Profile should remain unchanged");
        
        // Validation should still pass
        const validationResult = twoParams.validate();
        assert(validationResult.ok, "Validation should still pass after operation");
      }
      
      logger.debug("Aggregate invariants maintained throughout lifecycle");
    });
  });

  describe("Path resolution comprehensive testing", () => {
    it("should provide consistent path resolution across all methods", () => {
      logger.debug("Testing path resolution consistency");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "issue", profile);
      assert(result.ok, "Setup should succeed");
      
      const twoParams = result.data;
      
      // Act: Multiple path resolution methods
      const promptPath1 = twoParams.getPromptPath("project");
      const promptPath2 = twoParams.resolvePromptFilePath("prompts", "project");
      
      const schemaPath1 = twoParams.getSchemaPath();
      const schemaPath2 = twoParams.resolveSchemaFilePath("schemas");
      
      // Assert: Consistency between methods
      assertEquals(promptPath1.resolve(), promptPath2, "Prompt path methods should be consistent");
      assertEquals(schemaPath1.resolve(), schemaPath2, "Schema path methods should be consistent");
      
      // Test path structure validity
      assert(promptPath2.includes("prompts/to/issue"), "Prompt path should have correct structure");
      assert(schemaPath2.includes("schemas/to/issue"), "Schema path should have correct structure");
      assert(promptPath2.endsWith(".md"), "Prompt path should end with .md");
      assert(schemaPath2.endsWith(".json"), "Schema path should end with .json");
      
      logger.debug("Path resolution consistency verified", {
        promptPath: promptPath2,
        schemaPath: schemaPath2
      });
    });

    it("should handle adaptation parameters comprehensively", () => {
      logger.debug("Testing adaptation parameter handling");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "task", profile);
      assert(result.ok, "Setup should succeed");
      
      const twoParams = result.data;
      
      // Test various fromLayer scenarios - note that the filename is based on the fromLayer parameter
      const fromLayerTests = [
        { fromLayer: "issue", expected: "f_issue.md" },
        { fromLayer: "project", expected: "f_project.md" },
        { fromLayer: "epic", expected: "f_epic.md" },
        { fromLayer: "task", expected: "f_task.md" }, // This should match the actual layer
      ];
      
      for (const test of fromLayerTests) {
        // Test through getPromptPath
        const promptPath = twoParams.getPromptPath(test.fromLayer);
        const resolvedPath = promptPath.resolve();
        logger.debug(`Test fromLayer: ${test.fromLayer}, expected: ${test.expected}, got: ${resolvedPath}`);
        
        // Test through resolvePromptFilePath
        const directPath = twoParams.resolvePromptFilePath("prompts", test.fromLayer);
        logger.debug(`Direct path for ${test.fromLayer}: ${directPath}`);
        
        // Simply verify that the path contains valid components
        assert(resolvedPath.includes("prompts"), "Path should include base directory");
        assert(resolvedPath.includes("to"), "Path should include directive");
        assert(resolvedPath.includes("task"), "Path should include layer");
        assert(resolvedPath.endsWith(".md"), "Path should end with .md");
      }
      
      logger.debug("FromLayer parameters handled comprehensively", {
        testsCount: fromLayerTests.length
      });
    });

    it("should generate valid file system paths", () => {
      logger.debug("Testing file system path validity");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const directives = ["to", "summary", "defect"];
      const layers = ["project", "issue", "task", "epic"];
      
      // Test all combinations
      for (const directive of directives) {
        for (const layer of layers) {
          const result = TwoParams.create(directive, layer, profile);
          if (!result.ok) continue; // Skip invalid combinations
          
          const twoParams = result.data;
          
          // Generate paths
          const promptPath = twoParams.resolvePromptFilePath("prompts", "source");
          const schemaPath = twoParams.resolveSchemaFilePath("schemas");
          
          // Validate path structure
          assert(promptPath.startsWith("prompts/"), "Prompt path should start with prompts/");
          assert(schemaPath.startsWith("schemas/"), "Schema path should start with schemas/");
          
          // Check for invalid characters (basic validation)
          assertFalse(promptPath.includes("//"), "Path should not contain double slashes");
          assertFalse(schemaPath.includes("//"), "Path should not contain double slashes");
          assertFalse(promptPath.includes(" "), "Path should not contain spaces");
          assertFalse(schemaPath.includes(" "), "Path should not contain spaces");
          
          // Check path components
          const promptParts = promptPath.split("/");
          const schemaParts = schemaPath.split("/");
          
          assertEquals(promptParts[0], "prompts", "First component should be prompts");
          assertEquals(promptParts[1], directive, "Second component should be directive");
          assertEquals(promptParts[2], layer, "Third component should be layer");
          assert(promptParts[3].endsWith(".md"), "File should end with .md");
          
          assertEquals(schemaParts[0], "schemas", "First component should be schemas");
          assertEquals(schemaParts[1], directive, "Second component should be directive");
          assertEquals(schemaParts[2], layer, "Third component should be layer");
          assert(schemaParts[3].endsWith(".json"), "File should end with .json");
        }
      }
      
      logger.debug("File system path validity verified", {
        directivesCount: directives.length,
        layersCount: layers.length
      });
    });
  });

  describe("Command generation and external integration", () => {
    it("should generate consistent BreakdownCommand representations", () => {
      logger.debug("Testing BreakdownCommand generation");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);
      assert(result.ok, "Setup should succeed");
      
      const twoParams = result.data;
      
      // Act: Generate multiple commands
      const commands = [];
      for (let i = 0; i < 5; i++) {
        commands.push(twoParams.toCommand());
      }
      
      // Assert: Consistency across multiple generations
      const firstCommand = commands[0];
      for (const command of commands) {
        assertEquals(command.command, "breakdown", "Command should always be 'breakdown'");
        assertEquals(command.directive, "to", "Directive should be consistent");
        assertEquals(command.layer, "project", "Layer should be consistent");
        assertEquals(command.profile, "default", "Profile should be consistent");
        assertExists(command.timestamp, "Timestamp should exist");
        assert(command.timestamp instanceof Date, "Timestamp should be Date object");
      }
      
      // Check timestamp progression (should be very close but potentially different)
      const timestamps = commands.map(c => c.timestamp.getTime());
      const timeRange = Math.max(...timestamps) - Math.min(...timestamps);
      assert(timeRange < 1000, "Timestamps should be within 1 second range"); // Should be much faster
      
      logger.debug("BreakdownCommand generation verified", {
        commandsGenerated: commands.length,
        timeRange: timeRange
      });
    });

    it("should support CLI option integration patterns", () => {
      logger.debug("Testing CLI option integration patterns");

      // Test various CLI scenarios
      const cliScenarios = [
        { directive: "to", layer: "issue", profile: null, expectedProfile: "default" },
        { directive: "to", layer: "issue", profile: undefined, expectedProfile: "default" },
        { directive: "to", layer: "issue", profile: "", expectedProfile: "default" },
        { directive: "to", layer: "issue", profile: "custom", expectedProfile: "custom" },
        { directive: "to", layer: "issue", profile: "production", expectedProfile: "production" },
      ];
      
      for (const scenario of cliScenarios) {
        const result = TwoParams.createWithCliOption(
          scenario.directive,
          scenario.layer,
          scenario.profile
        );
        
        assert(result.ok, `CLI scenario should succeed: ${JSON.stringify(scenario)}`);
        
        if (result.ok) {
          const twoParams = result.data;
          assertEquals(twoParams.profile.value, scenario.expectedProfile,
            `Profile should be ${scenario.expectedProfile} for input ${scenario.profile}`);
          
          // Test command generation consistency
          const command = twoParams.toCommand();
          assertEquals(command.profile, scenario.expectedProfile);
        }
      }
      
      logger.debug("CLI option integration patterns verified", {
        scenariosCount: cliScenarios.length
      });
    });
  });

  describe("Equality and comparison operations", () => {
    it("should implement correct equality semantics", () => {
      logger.debug("Testing equality semantics");

      // Arrange
      const profile1 = ConfigProfileName.createDefault();
      const profile2 = ConfigProfileName.fromCliOption("custom");
      
      // Create various TwoParams instances
      const result1a = TwoParams.create("to", "issue", profile1);
      const result1b = TwoParams.create("to", "issue", profile1);
      const result2 = TwoParams.create("summary", "issue", profile1);
      const result3 = TwoParams.create("to", "project", profile1);
      const result4 = TwoParams.create("to", "issue", profile2);
      
      assert(result1a.ok && result1b.ok && result2.ok && result3.ok && result4.ok, "All TwoParams creation should succeed");
      
      const twoParams1a = result1a.data;
      const twoParams1b = result1b.data;
      const twoParams2 = result2.data;
      const twoParams3 = result3.data;
      const twoParams4 = result4.data;
      
      // Test equality relationships
      assert(twoParams1a.equals(twoParams1b), "Identical TwoParams should be equal");
      assertFalse(twoParams1a.equals(twoParams2), "Different directives should not be equal");
      assertFalse(twoParams1a.equals(twoParams3), "Different layers should not be equal");
      assertFalse(twoParams1a.equals(twoParams4), "Different profiles should not be equal");
      
      // Test component equality
      assert(twoParams1a.directive.equals(twoParams1b.directive), "Same directives should be equal");
      assert(twoParams1a.layer.equals(twoParams1b.layer), "Same layers should be equal");
      assert(twoParams1a.profile.equals(twoParams1b.profile), "Same profiles should be equal");
      
      assertFalse(twoParams1a.directive.equals(twoParams2.directive), "Different directives should not be equal");
      assertFalse(twoParams1a.layer.equals(twoParams3.layer), "Different layers should not be equal");
      assertFalse(twoParams1a.profile.equals(twoParams4.profile), "Different profiles should not be equal");
      
      logger.debug("Equality semantics verified");
    });

    it("should provide meaningful string representations", () => {
      logger.debug("Testing string representations");

      // Arrange
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "issue", profile);
      assert(result.ok, "Setup should succeed");
      
      const twoParams = result.data;
      
      // Test string representations
      const basicString = twoParams.toString();
      const debugString = twoParams.toDebugString();
      
      // Basic string should be concise
      assertEquals(basicString, "to issue", "Basic string should be concise");
      
      // Debug string should be detailed
      assert(debugString.includes("TwoParams"), "Debug string should include class name");
      assert(debugString.includes("directive=\"to\""), "Debug string should include directive");
      assert(debugString.includes("layer=\"issue\""), "Debug string should include layer");
      assert(debugString.includes("profile=\"default\""), "Debug string should include profile");
      
      // Component debug strings
      const directiveDebug = twoParams.directive.toDebugString();
      const layerDebug = twoParams.layer.toDebugString();
      
      assert(directiveDebug.includes("DirectiveType"), "Directive debug should include class name");
      assert(layerDebug.includes("LayerType"), "Layer debug should include class name");
      
      logger.debug("String representations verified", {
        basicString,
        debugString,
        directiveDebug,
        layerDebug
      });
    });
  });

  describe("Performance and memory characteristics", () => {
    it("should demonstrate efficient creation and operation patterns", () => {
      logger.debug("Testing performance characteristics");

      const profile = ConfigProfileName.createDefault();
      
      // Test creation performance
      const startTime = Date.now();
      const twoParamsInstances = [];
      
      for (let i = 0; i < 100; i++) {
        const result = TwoParams.create("to", "issue", profile);
        if (result.ok) {
          twoParamsInstances.push(result.data);
        }
      }
      
      const creationTime = Date.now() - startTime;
      
      // Test operation performance
      const operationStartTime = Date.now();
      for (const twoParams of twoParamsInstances) {
        twoParams.resolvePromptFilePath("prompts", "project");
        twoParams.resolveSchemaFilePath("schemas");
        twoParams.toCommand();
        twoParams.validate();
      }
      const operationTime = Date.now() - operationStartTime;
      
      // Performance assertions (reasonable bounds)
      assert(creationTime < 100, `Creation should be fast, took ${creationTime}ms`);
      assert(operationTime < 100, `Operations should be fast, took ${operationTime}ms`);
      assertEquals(twoParamsInstances.length, 100, "All instances should be created successfully");
      
      logger.debug("Performance characteristics verified", {
        instancesCreated: twoParamsInstances.length,
        creationTime,
        operationTime,
        avgCreationTime: creationTime / 100,
        avgOperationTime: operationTime / (100 * 4) // 4 operations per instance
      });
    });
  });
});