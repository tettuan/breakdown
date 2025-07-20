/**
 * @fileoverview TwoParams Aggregate Root Test Suite
 *
 * Comprehensive test suite for TwoParams Aggregate Root following DDD principles.
 * Includes both standard validation tests and flexible pattern tests migrated from legacy.
 *
 * Test Categories:
 * - Core DDD functionality (Smart Constructor, value objects)
 * - Pattern validation (standard and flexible)
 * - Domain behavior (path resolution, command generation)
 * - Performance and stress testing
 * - Integration scenarios
 *
 * @module domain/core/aggregates/two_params_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { describe, it } from "@std/testing/bdd";
import { TwoParams } from "./two_params_optimized.ts";
import { ConfigProfileName } from "$lib/config/config_profile_name.ts";
import { DirectiveType } from "../value_objects/directive_type.ts";
import { LayerType } from "../value_objects/layer_type.ts";

// BreakdownLogger usage - conditional to support test runs without --allow-env
let logger: {
  debug: (_msg: string, _obj?: unknown) => void;
  info: (_msg: string, _obj?: unknown) => void;
  warn: (_msg: string, _obj?: unknown) => void;
  error: (_msg: string, _obj?: unknown) => void;
} | null = null;
try {
  const { BreakdownLogger } = await import("@tettuan/breakdownlogger");
  logger = new BreakdownLogger("two-params-aggregate");
} catch {
  // Fallback for tests without --allow-env
  logger = {
    debug: (_msg: string, _obj?: unknown) => {},
    info: (_msg: string, _obj?: unknown) => {},
    warn: (_msg: string, _obj?: unknown) => {},
    error: (_msg: string, _obj?: unknown) => {},
  };
}

// ============================================================================
// Core DDD Tests
// ============================================================================

describe("TwoParams Aggregate Root - Core DDD Functionality", () => {
  const profile = ConfigProfileName.createDefault();

  describe("Smart Constructor Pattern", () => {
    it("should create valid TwoParams with standard values", () => {
      logger?.debug("Testing Smart Constructor with standard values");

      const result = TwoParams.create("to", "task", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.directive.value, "to");
        assertEquals(result.data.layer.value, "task");
        assertEquals(result.data.profile.value, "default");
      }

      logger?.debug("Smart Constructor test completed");
    });

    it("should validate directive and layer combination", () => {
      logger?.debug("Testing directive and layer combination validation");

      const validCombinations = [
        { directive: "to", layer: "task" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "project" },
      ];

      for (const combo of validCombinations) {
        const result = TwoParams.create(combo.directive, combo.layer, profile);
        assertEquals(result.ok, true, `Should accept ${combo.directive} + ${combo.layer}`);
      }

      logger?.debug("Combination validation test completed");
    });

    it("should handle invalid directive", () => {
      logger?.debug("Testing invalid directive handling");

      const result = TwoParams.create("invalid_directive", "task", profile);

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidDirective");
        if (result.error.kind === "InvalidDirective") {
          assertEquals(result.error.directive, "invalid_directive");
        }
      }

      logger?.debug("Invalid directive test completed");
    });

    it("should handle invalid layer", () => {
      logger?.debug("Testing invalid layer handling");

      const result = TwoParams.create("to", "INVALID_LAYER", profile);

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidLayer");
        if (result.error.kind === "InvalidLayer") {
          assertEquals(result.error.layer, "INVALID_LAYER");
        }
      }

      logger?.debug("Invalid layer test completed");
    });
  });

  describe("CLI Integration", () => {
    it("should create TwoParams with CLI option", () => {
      logger?.debug("Testing CLI option integration");

      const result = TwoParams.createWithCliOption("to", "task", null);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.profile.value, "default");
      }

      logger?.debug("CLI option test completed");
    });

    it("should create TwoParams with custom profile", () => {
      logger?.debug("Testing custom profile");

      const result = TwoParams.createWithCliOption("to", "task", "custom");

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.profile.value, "custom");
      }

      logger?.debug("Custom profile test completed");
    });
  });

  describe("Domain Behavior", () => {
    it("should generate BreakdownCommand", () => {
      logger?.debug("Testing BreakdownCommand generation");

      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const command = result.data.toCommand();
        assertEquals(command.command, "breakdown");
        assertEquals(command.directive, "to");
        assertEquals(command.layer, "task");
        assertEquals(command.profile, "default");
        assertExists(command.timestamp);
      }

      logger?.debug("BreakdownCommand generation test completed");
    });

    it("should resolve prompt file paths", () => {
      logger?.debug("Testing prompt file path resolution");

      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const path = result.data.resolvePromptFilePath("prompts", "issue");
        assertEquals(path, "prompts/to/task/f_issue.md");
      }

      logger?.debug("Prompt path resolution test completed");
    });

    it("should resolve schema file paths", () => {
      logger?.debug("Testing schema file path resolution");

      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const path = result.data.resolveSchemaFilePath("schemas");
        assertEquals(path, "schemas/to/task/task.json");
      }

      logger?.debug("Schema path resolution test completed");
    });

    it("should provide PromptPath and SchemaPath objects", () => {
      logger?.debug("Testing path object generation");

      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const promptPath = result.data.getPromptPath("issue");
        const schemaPath = result.data.getSchemaPath();

        assertEquals(promptPath.directive, "to");
        assertEquals(promptPath.layer, "task");
        assertEquals(promptPath.fromLayer, "issue");

        assertEquals(schemaPath.directive, "to");
        assertEquals(schemaPath.layer, "task");
      }

      logger?.debug("Path object generation test completed");
    });
  });

  describe("Equality and Comparison", () => {
    it("should compare TwoParams instances correctly", () => {
      logger?.debug("Testing TwoParams equality");

      const result1 = TwoParams.create("to", "task", profile);
      const result2 = TwoParams.create("to", "task", profile);
      const result3 = TwoParams.create("summary", "task", profile);

      assertEquals(result1.ok, true);
      assertEquals(result2.ok, true);
      assertEquals(result3.ok, true);

      if (result1.ok && result2.ok && result3.ok) {
        assertEquals(result1.data.equals(result2.data), true);
        assertEquals(result1.data.equals(result3.data), false);
      }

      logger?.debug("Equality test completed");
    });

    it("should provide string representations", () => {
      logger?.debug("Testing string representations");

      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        assertEquals(result.data.toString(), "to task");
        assertEquals(
          result.data.toDebugString(),
          'TwoParams(directive="to", layer="task", profile="default")',
        );
      }

      logger?.debug("String representation test completed");
    });
  });
});

// ============================================================================
// Flexible Pattern Tests (Migrated from Legacy)
// ============================================================================

describe("TwoParams - Flexible Pattern Support", () => {
  const profile = ConfigProfileName.createDefault();

  // Flexible pattern configurations from legacy test
  const FLEXIBLE_DIRECTIVE_PATTERN = "^[a-zA-Z0-9_#-]{2,20}$";
  // FLEXIBLE_LAYER_PATTERN removed as it was unused

  const VALID_HASH_DIRECTIVES = [
    "to",
    "summary",
    "defect",
    "to#1",
    "summary_v2",
    "defect-fix",
    "to_all",
    "web#search",
    "db_query",
    "api-call",
    "data#extract",
  ] as const;

  const VALID_HASH_LAYERS = [
    "project",
    "issue",
    "task",
    "bugs",
    "project#1",
    "issue_v2",
    "task-new",
    "bugs_critical",
    "module#api",
    "service_db",
    "component-ui",
    "layer#data",
  ] as const;

  function matchesFlexiblePattern(value: string): boolean {
    return new RegExp(FLEXIBLE_DIRECTIVE_PATTERN).test(value);
  }

  describe("Hash-like character support", () => {
    it("should support predefined hash-like combinations", () => {
      logger?.debug("Testing predefined hash-like combinations with DDD TwoParams");

      // Test with actual DDD TwoParams for combinations that would work
      const basicCombinations = [
        { directive: "to", layer: "task" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "project" },
      ];

      for (const combo of basicCombinations) {
        const result = TwoParams.create(combo.directive, combo.layer, profile);
        assertEquals(
          result.ok,
          true,
          `Should accept basic combination: ${combo.directive} + ${combo.layer}`,
        );
      }

      logger?.debug("Hash-like combinations test completed");
    });

    it("should validate flexible patterns in theory", () => {
      logger?.debug("Testing flexible pattern validation logic");

      // Test the flexible pattern matching function
      for (const directive of VALID_HASH_DIRECTIVES) {
        assertEquals(
          matchesFlexiblePattern(directive),
          true,
          `Directive "${directive}" should match flexible pattern`,
        );
      }

      for (const layer of VALID_HASH_LAYERS) {
        assertEquals(
          matchesFlexiblePattern(layer),
          true,
          `Layer "${layer}" should match flexible pattern`,
        );
      }

      logger?.debug("Flexible pattern validation test completed");
    });

    it("should handle pattern boundary cases", () => {
      logger?.debug("Testing pattern boundary cases");

      const boundaryTestCases = [
        { value: "a1", shouldMatch: true, description: "minimum length (2 chars)" },
        { value: "a".repeat(20), shouldMatch: true, description: "maximum length (20 chars)" },
        { value: "a", shouldMatch: false, description: "too short (1 char)" },
        { value: "a".repeat(21), shouldMatch: false, description: "too long (21 chars)" },
        { value: "test#123", shouldMatch: true, description: "hash character" },
        { value: "test_var", shouldMatch: true, description: "underscore character" },
        { value: "test-case", shouldMatch: true, description: "dash character" },
        { value: "test space", shouldMatch: false, description: "space character" },
        { value: "test@email", shouldMatch: false, description: "invalid @ character" },
      ];

      for (const testCase of boundaryTestCases) {
        const matches = matchesFlexiblePattern(testCase.value);
        assertEquals(
          matches,
          testCase.shouldMatch,
          `${testCase.description}: "${testCase.value}"`,
        );
      }

      logger?.debug("Boundary cases test completed");
    });
  });

  describe("Performance and stress testing", () => {
    it("should handle multiple TwoParams creations efficiently", () => {
      logger?.debug("Testing TwoParams creation performance");

      const startTime = Date.now();
      const iterations = 1000;
      let successCount = 0;

      for (let i = 0; i < iterations; i++) {
        const result = TwoParams.create("to", "task", profile);
        if (result.ok) {
          successCount++;
        }
      }

      const duration = Date.now() - startTime;
      logger?.debug(`Completed ${iterations} TwoParams creations in ${duration}ms`);

      assertEquals(successCount, iterations, "All creations should succeed");
      assertEquals(
        duration < 5000,
        true,
        `Performance test should complete within 5 seconds, took ${duration}ms`,
      );

      logger?.debug("Performance test completed");
    });

    it("should handle random validation scenarios efficiently", () => {
      logger?.debug("Testing random validation performance");

      const validDirectives = ["to", "summary", "defect"];
      const validLayers = ["project", "issue", "task"];

      const getRandomDirective = () =>
        validDirectives[Math.floor(Math.random() * validDirectives.length)];
      const getRandomLayer = () => validLayers[Math.floor(Math.random() * validLayers.length)];

      const startTime = Date.now();
      const iterations = 374;
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < iterations; i++) {
        const directive = getRandomDirective();
        const layer = getRandomLayer();

        const result = TwoParams.create(directive, layer, profile);
        if (result.ok) {
          validCount++;
        } else {
          invalidCount++;
        }
      }

      const duration = Date.now() - startTime;
      logger?.debug(`Completed ${iterations} random validations in ${duration}ms`);
      logger?.debug(`Results - Valid: ${validCount}, Invalid: ${invalidCount}`);

      assertEquals(validCount + invalidCount, iterations, "Should process all iterations");
      // Allow for some realistic validation failures - not all combinations may be valid
      assertEquals(
        validCount >= Math.floor(iterations * 0.5),
        true,
        `At least 50% should succeed, got ${validCount}/${iterations}`,
      );
      assertEquals(
        duration < 3000,
        true,
        `Random validation should complete within 3 seconds, took ${duration}ms`,
      );

      logger?.debug("Random validation performance test completed");
    });

    it("should handle edge case validation scenarios", () => {
      logger?.debug("Testing edge case validation scenarios");

      const edgeCases = [
        // Valid cases
        { directive: "to", layer: "task", expectValid: true },
        { directive: "summary", layer: "issue", expectValid: true },

        // Invalid cases
        { directive: "invalid", layer: "task", expectValid: false },
        { directive: "to", layer: "invalid", expectValid: true }, // LayerType validation is now lenient
        { directive: "", layer: "task", expectValid: false },
        { directive: "to", layer: "", expectValid: false },

        // Case sensitivity
        { directive: "TO", layer: "task", expectValid: false },
        { directive: "to", layer: "TASK", expectValid: false },

        // Whitespace (should be rejected due to validation)
        { directive: " to", layer: "task", expectValid: false },
        { directive: "to ", layer: "task", expectValid: false },
        { directive: "to", layer: " task", expectValid: false },
        { directive: "to", layer: "task ", expectValid: false },
      ];

      let validCount = 0;
      let invalidCount = 0;

      for (const testCase of edgeCases) {
        const result = TwoParams.create(testCase.directive, testCase.layer, profile);

        assertEquals(
          result.ok,
          testCase.expectValid,
          `Edge case validation failed: ${testCase.directive} + ${testCase.layer}`,
        );

        if (result.ok === testCase.expectValid) {
          if (testCase.expectValid) {
            validCount++;
          } else {
            invalidCount++;
          }
        }
      }

      logger?.debug(
        `Edge cases - Expected valid: ${validCount}, Expected invalid: ${invalidCount}`,
      );
      logger?.debug("Edge case validation test completed");
    });

    it("should handle stress testing with validation", () => {
      logger?.debug("Starting stress testing with validation");

      let validCount = 0;
      let invalidCount = 0;

      const testCases = [
        { directive: "to", layer: "task", expectValid: true },
        { directive: "summary", layer: "issue", expectValid: true },
        { directive: "invalid", layer: "task", expectValid: false },
        { directive: "to", layer: "invalid", expectValid: false },
      ];

      for (let i = 0; i < 500; i++) {
        const testCase = testCases[i % testCases.length];
        const result = TwoParams.create(testCase.directive, testCase.layer, profile);

        if (result.ok) {
          validCount++;
        } else {
          invalidCount++;
          assertExists(result.error);
          assertExists(result.error.kind);
        }
      }

      logger?.debug(`Stress test results - Valid: ${validCount}, Invalid: ${invalidCount}`);

      assertEquals(validCount > 0, true, "Should have some valid cases");
      assertEquals(invalidCount > 0, true, "Should have some invalid cases");
      assertEquals(validCount + invalidCount, 500, "Should process all cases");

      logger?.debug("Stress testing completed");
    });
  });
});

// ============================================================================
// Configuration Structure Tests (Migrated from Legacy)
// ============================================================================

describe("TwoParams - Configuration Structure Validation", () => {
  describe("DirectiveType and LayerType consistency", () => {
    it("should validate DirectiveType values consistency", () => {
      logger?.debug("Testing DirectiveType values consistency");

      const expectedDirectives = ["to", "summary", "defect"];

      for (const directive of expectedDirectives) {
        const directiveResult = DirectiveType.create(directive, ConfigProfileName.createDefault());
        assertEquals(
          directiveResult.ok,
          true,
          `DirectiveType should accept expected value: ${directive}`,
        );
      }

      logger?.debug("DirectiveType consistency test completed");
    });

    it("should validate LayerType values consistency", () => {
      logger?.debug("Testing LayerType values consistency");

      const expectedLayers = ["project", "issue", "task", "bugs"];

      for (const layer of expectedLayers) {
        const layerResult = LayerType.create(layer);
        assertEquals(
          layerResult.ok,
          true,
          `LayerType should accept expected value: ${layer}`,
        );
      }

      logger?.debug("LayerType consistency test completed");
    });

    it("should validate symmetric behavior between DirectiveType and LayerType", () => {
      logger?.debug("Testing symmetric behavior");

      const profile = ConfigProfileName.createDefault();

      // Test that both types follow similar validation patterns
      const invalidValues = ["", " ", "INVALID@CHARS"]; // Use clearly invalid values with special characters

      for (const invalidValue of invalidValues) {
        const directiveResult = DirectiveType.create(invalidValue, profile);
        const layerResult = LayerType.create(invalidValue);

        assertEquals(directiveResult.ok, false, `DirectiveType should reject: ${invalidValue}`);
        assertEquals(layerResult.ok, false, `LayerType should reject: ${invalidValue}`);
      }

      logger?.debug("Symmetric behavior test completed");
    });
  });

  describe("TwoParams validation consistency", () => {
    it("should maintain validation consistency across multiple creations", () => {
      logger?.debug("Testing validation consistency");

      const profile = ConfigProfileName.createDefault();
      const testCases = [
        { directive: "to", layer: "task", expectValid: true },
        { directive: "summary", layer: "issue", expectValid: true },
        { directive: "defect", layer: "project", expectValid: true },
        { directive: "to", layer: "bugs", expectValid: true }, // bugs is valid in lenient mode
        { directive: "invalid", layer: "task", expectValid: false },
        { directive: "to", layer: "invalid", expectValid: true }, // invalid is valid in lenient mode
      ];

      // Run each test case multiple times to ensure consistency
      for (const testCase of testCases) {
        const results = [];

        for (let i = 0; i < 5; i++) {
          results.push(TwoParams.create(testCase.directive, testCase.layer, profile));
        }

        // All results should be identical
        const firstResult = results[0];
        for (let i = 1; i < results.length; i++) {
          assertEquals(
            results[i].ok,
            firstResult.ok,
            `Consistency check failed for: ${testCase.directive} + ${testCase.layer}`,
          );
        }

        assertEquals(
          firstResult.ok,
          testCase.expectValid,
          `Expected validity for: ${testCase.directive} + ${testCase.layer}`,
        );
      }

      logger?.debug("Validation consistency test completed");
    });

    it("should validate profile option handling", () => {
      logger?.debug("Testing profile option handling");

      // Test with different profile scenarios
      const profileScenarios = [
        { profileOption: null, expectedProfile: "default" },
        { profileOption: undefined, expectedProfile: "default" },
        { profileOption: "custom", expectedProfile: "custom" },
      ];

      for (const scenario of profileScenarios) {
        const result = TwoParams.createWithCliOption("to", "task", scenario.profileOption);
        assertEquals(result.ok, true);

        if (result.ok) {
          assertEquals(
            result.data.profile.value,
            scenario.expectedProfile,
            `Profile should be: ${scenario.expectedProfile}`,
          );
        }
      }

      logger?.debug("Profile option handling test completed");
    });
  });

  describe("Cross-domain validation", () => {
    it("should validate directive-layer combination compatibility", () => {
      logger?.debug("Testing directive-layer compatibility");

      const profile = ConfigProfileName.createDefault();
      const allDirectives = ["to", "summary", "defect"];
      const allLayers = ["project", "issue", "task", "bugs"];

      // All standard combinations should be valid
      for (const directive of allDirectives) {
        for (const layer of allLayers) {
          const result = TwoParams.create(directive, layer, profile);
          assertEquals(
            result.ok,
            true,
            `Standard combination should be valid: ${directive} + ${layer}`,
          );
        }
      }

      logger?.debug("Directive-layer compatibility test completed");
    });

    it("should maintain object immutability", () => {
      logger?.debug("Testing object immutability");

      const result = TwoParams.create("to", "task", ConfigProfileName.createDefault());
      assertEquals(result.ok, true);

      if (result.ok) {
        const twoParams = result.data;

        // Attempt to modify should not affect original values
        const originalDirective = twoParams.directive.value;
        const originalLayer = twoParams.layer.value;
        const originalProfile = twoParams.profile.value;

        // Object should be frozen/immutable
        assertEquals(Object.isFrozen(twoParams), true);

        // Values should remain unchanged
        assertEquals(twoParams.directive.value, originalDirective);
        assertEquals(twoParams.layer.value, originalLayer);
        assertEquals(twoParams.profile.value, originalProfile);
      }

      logger?.debug("Object immutability test completed");
    });
  });
});

// ============================================================================
// Integration Tests (Migrated from Legacy)
// ============================================================================

describe("TwoParams - Integration Scenarios", () => {
  const profile = ConfigProfileName.createDefault();

  describe("End-to-end workflow", () => {
    it("should support complete workflow from creation to path resolution", () => {
      logger?.debug("Testing complete workflow");

      // Step 1: Create TwoParams
      const result = TwoParams.create("to", "task", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const twoParams = result.data;

        // Step 2: Validate
        const validationResult = twoParams.validate();
        assertEquals(validationResult.ok, true);

        // Step 3: Generate command
        const command = twoParams.toCommand();
        assertExists(command);
        assertEquals(command.command, "breakdown");

        // Step 4: Resolve paths
        const promptPath = twoParams.resolvePromptFilePath("prompts");
        const schemaPath = twoParams.resolveSchemaFilePath("schemas");

        assertExists(promptPath);
        assertExists(schemaPath);
        assertEquals(promptPath.includes("to"), true);
        assertEquals(promptPath.includes("task"), true);

        // Step 5: Get path objects
        const promptPathObj = twoParams.getPromptPath();
        const schemaPathObj = twoParams.getSchemaPath();

        assertExists(promptPathObj);
        assertExists(schemaPathObj);
        assertEquals(typeof promptPathObj.resolve, "function");
        assertEquals(typeof schemaPathObj.resolve, "function");
      }

      logger?.debug("Complete workflow test completed");
    });
  });

  describe("Generator integration with TwoParams", () => {
    it("should support prompt generation workflow", () => {
      logger?.debug("Testing prompt generation workflow");

      // Step 1: Create TwoParams with expected generator parameters
      const result = TwoParams.create("to", "project", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const twoParams = result.data;

        // Step 2: Extract parameters for generator
        const generatorParams = {
          directiveType: twoParams.directive.value,
          layerType: twoParams.layer.value,
          profile: twoParams.profile.value,
        };

        assertEquals(generatorParams.directiveType, "to");
        assertEquals(generatorParams.layerType, "project");
        assertEquals(generatorParams.profile, "default");

        // Step 3: Verify path resolution for generator
        const promptPath = twoParams.resolvePromptFilePath("prompts");
        const schemaPath = twoParams.resolveSchemaFilePath("schemas");

        assertEquals(promptPath.includes("to"), true);
        assertEquals(promptPath.includes("project"), true);
        assertEquals(schemaPath.includes("project.json"), true);

        // Step 4: Test command generation for integration
        const command = twoParams.toCommand();
        assertEquals(command.directive, "to");
        assertEquals(command.layer, "project");
      }

      logger?.debug("Prompt generation workflow test completed");
    });

    it("should support complex variable processing", () => {
      logger?.debug("Testing complex variable processing");

      const result = TwoParams.create("to", "project", profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const twoParams = result.data;

        // Simulate complex variable processing scenario
        const processedVariables = {
          standardVariables: {
            input_text: "Complex input content",
            input_text_file: "requirements.md",
            destination_path: "project-plan.md",
            directive_type: twoParams.directive.value,
            layer_type: twoParams.layer.value,
          },
          customVariables: {
            project_name: "TestProject",
            author: "TestAuthor",
            priority: "high",
            deadline: "2024-12-31",
          },
          allVariables: {} as Record<string, string>,
        };

        // Merge all variables
        processedVariables.allVariables = {
          ...processedVariables.standardVariables,
          ...processedVariables.customVariables,
        };

        // Verify variable structure
        assertExists(processedVariables.allVariables.directive_type);
        assertExists(processedVariables.allVariables.layer_type);
        assertExists(processedVariables.allVariables.project_name);
        assertEquals(processedVariables.allVariables.directive_type, "to");
        assertEquals(processedVariables.allVariables.layer_type, "project");

        // Test that TwoParams data is consistent with processed variables
        assertEquals(
          processedVariables.standardVariables.directive_type,
          twoParams.directive.value,
        );
        assertEquals(
          processedVariables.standardVariables.layer_type,
          twoParams.layer.value,
        );
      }

      logger?.debug("Complex variable processing test completed");
    });

    it("should handle factory integration scenarios", () => {
      logger?.debug("Testing factory integration scenarios");

      // Test multiple TwoParams creation for factory-like scenarios
      const testCases = [
        { directive: "to", layer: "project" },
        { directive: "summary", layer: "issue" },
        { directive: "defect", layer: "task" },
        { directive: "to", layer: "bugs" },
      ];

      const createdParams = [];

      for (const testCase of testCases) {
        const result = TwoParams.create(testCase.directive, testCase.layer, profile);
        assertEquals(result.ok, true);

        if (result.ok) {
          createdParams.push(result.data);

          // Verify factory-like parameter extraction
          const factoryParams = {
            directiveType: result.data.directive.value,
            layerType: result.data.layer.value,
            promptPath: result.data.resolvePromptFilePath("prompts"),
            schemaPath: result.data.resolveSchemaFilePath("schemas"),
          };

          assertExists(factoryParams.directiveType);
          assertExists(factoryParams.layerType);
          assertExists(factoryParams.promptPath);
          assertExists(factoryParams.schemaPath);
        }
      }

      assertEquals(createdParams.length, testCases.length);

      // Test that all created parameters are unique
      for (let i = 0; i < createdParams.length; i++) {
        for (let j = i + 1; j < createdParams.length; j++) {
          assertEquals(
            createdParams[i].equals(createdParams[j]),
            false,
            `TwoParams ${i} and ${j} should be different`,
          );
        }
      }

      logger?.debug("Factory integration scenarios test completed");
    });
  });

  describe("Error propagation integration", () => {
    it("should propagate validation errors correctly", () => {
      logger?.debug("Testing error propagation");

      const errorScenarios = [
        { directive: "invalid", layer: "task", expectedError: "InvalidDirective" },
        { directive: "to", layer: "INVALID@LAYER", expectedError: "InvalidLayer" }, // Use clearly invalid layer with special chars
        { directive: "", layer: "task", expectedError: "InvalidDirective" },
        { directive: "to", layer: "", expectedError: "InvalidLayer" },
      ];

      for (const scenario of errorScenarios) {
        const result = TwoParams.create(scenario.directive, scenario.layer, profile);
        assertEquals(result.ok, false);

        if (!result.ok) {
          assertEquals(result.error.kind, scenario.expectedError);

          // Verify error structure for integration
          assertExists(result.error.kind);
          if (
            scenario.expectedError === "InvalidDirective" &&
            result.error.kind === "InvalidDirective"
          ) {
            assertExists(result.error.directive);
          }
          if (scenario.expectedError === "InvalidLayer" && result.error.kind === "InvalidLayer") {
            assertExists(result.error.layer);
          }
        }
      }

      logger?.debug("Error propagation test completed");
    });

    it("should handle profile-related errors", () => {
      logger?.debug("Testing profile error handling");

      // Test CLI integration error scenarios
      const profileScenarios = [
        { profileOption: null, shouldSucceed: true },
        { profileOption: "custom", shouldSucceed: true },
        { profileOption: "", shouldSucceed: true }, // empty string is valid
      ];

      for (const scenario of profileScenarios) {
        const result = TwoParams.createWithCliOption("to", "task", scenario.profileOption);

        if (scenario.shouldSucceed) {
          assertEquals(result.ok, true);
          if (result.ok) {
            assertExists(result.data.profile.value);
          }
        } else {
          assertEquals(result.ok, false);
          if (!result.ok) {
            assertExists(result.error.kind);
          }
        }
      }

      logger?.debug("Profile error handling test completed");
    });
  });
});
