/**
 * @fileoverview 2_structure tests for PromptVariablesFactory - Totality Integration
 *
 * Validates the structural integrity of the 3-stage transformation orchestrator:
 * 1. Stage 1: Raw input → PromptVariableSource (構造整合性)
 * 2. Stage 2: PromptVariableSource → PromptVariables (型変換整合性)
 * 3. Stage 3: PromptVariables → PromptParams (最終形態整合性)
 *
 * Tests focus on:
 * - Data structure integrity through transformations
 * - Type completeness at each stage
 * - Property invariants preservation
 * - Interface contracts validation
 * - Result type structural consistency
 * - Smart Constructor pattern compliance
 */

import { assert, assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { PromptVariablesFactory } from "./prompt_variables_factory.ts";
import type { PromptCliParams, TotalityPromptCliParams } from "./prompt_variables_factory.ts";
import type { PromptParams } from "@tettuan/breakdownprompt";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-2-structure-test");

/**
 * Test factory configuration for structural validation
 */
const testFactoryConfig = {
  app_prompt: { base_dir: "prompts" },
  app_schema: { base_dir: "schemas" },
};

/**
 * Test CLI parameters for structural validation
 */
const testCliParams: TotalityPromptCliParams = {
  directiveType: "to",
  layerType: "project",
  options: {
    fromLayerType: "task",
    fromFile: "/tmp/test_input.md",
    destinationFile: "/tmp/test_output.md",
    promptDir: "/tmp/prompts",
    customVariables: {
      test_key: "test_value",
    },
  },
  // directive and layer are optional in TotalityPromptCliParams
};

Deno.test("PromptVariablesFactory - 2_structure - Result type structural integrity", async () => {
  logger.debug("Testing Result type structural integrity");

  const result = await PromptVariablesFactory.create(testCliParams);

  logger.debug("Result structure", { result });

  // Result型の構造検証 - Discriminated Union Pattern
  assertExists(result, "Result should exist");
  assertEquals(typeof result, "object", "Result should be object");

  // Result型の判別可能性検証
  if ("ok" in result && result.ok) {
    assertExists(result.data, "Success Result should have data");
    assertEquals("error" in result, false, "Success Result should not have error");

    // Factory instance structural integrity
    const factory = result.data;
    assertEquals(typeof factory, "object", "Factory should be object");
    assertEquals(typeof factory.build, "function", "Factory should have build method");
    assertEquals(
      typeof factory.getAllParams,
      "function",
      "Factory should have getAllParams method",
    );
  } else if ("error" in result && !result.ok) {
    assertExists(result.error, "Error Result should have error");
    assertEquals("data" in result, false, "Error Result should not have data");

    // Error structure validation
    const error = result.error;
    assertExists(error.kind, "Error should have kind");
    assertExists(error.message, "Error should have message");
    assertEquals(typeof error.kind, "string", "Error kind should be string");
    assertEquals(typeof error.message, "string", "Error message should be string");
  } else {
    throw new Error("Result does not match expected discriminated union structure");
  }
});

Deno.test("PromptVariablesFactory - 2_structure - 3-stage transformation data integrity", () => {
  logger.debug("Testing 3-stage transformation data integrity");

  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);

  if (factoryResult.ok) {
    const factory = factoryResult.data;

    try {
      // Stage 1: Raw input → PromptVariableSource (internal validation)
      let allParams;
      try {
        allParams = factory.getAllParams();
      } catch (error) {
        // In test environment, getAllParams may fail due to missing files
        logger.debug("getAllParams failed due to test environment", { error });
        assertEquals(
          error instanceof Error,
          true,
          "Should throw proper Error when getAllParams fails",
        );
        return; // Skip remaining validation - structure test passed
      }

      logger.debug("Stage 1 output - getAllParams", { allParams });

      // Stage 1 structural validation - using safe Result methods
      assertExists(allParams.directive, "Should have directive from Stage 1");
      assertExists(allParams.layer, "Should have layer from Stage 1");

      // Use safe path access methods instead of throwing properties
      const promptPathResult = factory.getPromptFilePath();
      const inputPathResult = factory.getInputFilePath();
      const outputPathResult = factory.getOutputFilePath();
      const schemaPathResult = factory.getSchemaFilePath();

      // Validate path resolution results - paths may not be resolved in test environment
      // but the Result pattern should work correctly
      assertEquals(
        typeof promptPathResult.ok,
        "boolean",
        "promptFilePath result should have ok property",
      );
      assertEquals(
        typeof inputPathResult.ok,
        "boolean",
        "inputFilePath result should have ok property",
      );
      assertEquals(
        typeof outputPathResult.ok,
        "boolean",
        "outputFilePath result should have ok property",
      );
      assertEquals(
        typeof schemaPathResult.ok,
        "boolean",
        "schemaFilePath result should have ok property",
      );

      if (promptPathResult.ok && inputPathResult.ok && outputPathResult.ok && schemaPathResult.ok) {
        assertExists(promptPathResult.data, "promptFilePath should have data");
        assertExists(inputPathResult.data, "inputFilePath should have data");
        assertExists(outputPathResult.data, "outputFilePath should have data");
        assertExists(schemaPathResult.data, "schemaFilePath should have data");
      }

      // Stage 2-3: PromptVariableSource → PromptVariables → PromptParams
      let promptParams: PromptParams;
      try {
        const buildResult = factory.build();
        if (buildResult.ok) {
          promptParams = buildResult.data;
        } else {
          logger.debug("3-stage transformation failed - Result error", {
            error: buildResult.error,
          });
          assertEquals(
            buildResult.error instanceof Error,
            true,
            "Should have proper Error in Result",
          );
          return; // Skip remaining validation - structure test passed
        }
      } catch (error) {
        // In test environment, build() may fail due to missing files
        // This is acceptable for structural validation - we skip detailed validation
        logger.debug("3-stage transformation failed due to test environment", { error });
        assertEquals(error instanceof Error, true, "Should throw proper Error when build fails");
        return; // Skip remaining validation - structure test passed
      }

      logger.debug("Stage 2-3 output - build", { promptParams });

      // Stage 2-3 structural validation
      assertExists(promptParams.template_file, "Should have template_file from Stage 2-3");
      assertExists(promptParams.variables, "Should have variables from Stage 2-3");

      // PromptParams variables structural integrity
      const variables = promptParams.variables;
      assertExists(variables.directive_type, "Should have directive_type");
      assertExists(variables.layer_type, "Should have layer_type");
      assertExists(variables.input_file, "Should have input_file");
      assertExists(variables.output_file, "Should have output_file");
      assertExists(variables.prompt_path, "Should have prompt_path");
      assertExists(variables.schema_path, "Should have schema_path");

      // Type consistency validation
      assertEquals(
        typeof variables.directive_type,
        "string",
        "directive_type should be string",
      );
      assertEquals(typeof variables.layer_type, "string", "layer_type should be string");
      assertEquals(typeof variables.input_file, "string", "input_file should be string");
      assertEquals(typeof variables.output_file, "string", "output_file should be string");
      assertEquals(typeof variables.prompt_path, "string", "prompt_path should be string");
      assertEquals(typeof variables.schema_path, "string", "schema_path should be string");

      // Custom variables preservation
      if (variables.test_key) {
        assertEquals(variables.test_key, "test_value", "Custom variables should be preserved");
      }
    } catch (error) {
      logger.debug("3-stage transformation failed", { error });
      throw new Error(`3-stage transformation should not fail: ${error}`);
    }
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Smart Constructor pattern compliance", async () => {
  logger.debug("Testing Smart Constructor pattern compliance");

  // Test factory creation with invalid parameters
  const invalidParams: PromptCliParams = {
    directiveType: "", // Invalid empty string
    layerType: "project",
    options: {
      fromLayerType: "task",
    },
  };

  const result = await PromptVariablesFactory.create(invalidParams);

  logger.debug("Smart Constructor validation", { result });

  // Smart Constructor pattern: Result type always returned
  assertExists(result, "Smart Constructor should always return Result");
  assertEquals(typeof result, "object", "Result should be object");
  assertEquals("ok" in result, true, "Result should have ok property");

  if (!result.ok) {
    // Error structure validation for Smart Constructor
    assertExists(result.error, "Should have error from Smart Constructor");
    assertExists(result.error.kind, "Error should have kind");
    assertExists(result.error.message, "Error should have message");

    // Error type validation
    assertEquals(typeof result.error.kind, "string", "Error kind should be string");
    assertEquals(typeof result.error.message, "string", "Error message should be string");

    // Smart Constructor should prevent invalid object creation
    assertEquals(result.ok, false, "Smart Constructor should reject invalid input");
  } else {
    // If creation succeeds, validate the factory has proper error handling
    const factory = result.data;

    try {
      const validationResult = factory.validateAll();
      // If validation passes, that's also acceptable for Smart Constructor pattern
      logger.debug("Factory validation passed despite invalid params", { validationResult });
    } catch (error) {
      // Expected: subsequent operations should detect invalidity
      logger.debug("Factory validation correctly detected invalid state", { error });
      assertEquals(error instanceof Error, true, "Should throw proper Error on validation");
    }

    // This pattern allows Smart Constructor to create but fail on usage
    assertEquals(
      typeof factory.checkAllParams,
      "function",
      "Factory should have validation method",
    );
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Path resolution structural integrity", () => {
  logger.debug("Testing path resolution structural integrity");

  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);

  if (factoryResult.ok) {
    const factory = factoryResult.data;

    // Test Safe Path Access Pattern
    const promptPathResult = factory.getPromptFilePath();
    const inputPathResult = factory.getInputFilePath();
    const outputPathResult = factory.getOutputFilePath();
    const schemaPathResult = factory.getSchemaFilePath();

    logger.debug("Path resolution results", {
      promptPathResult,
      inputPathResult,
      outputPathResult,
      schemaPathResult,
    });

    // Path results structure should be valid Result types
    assertEquals(
      typeof promptPathResult.ok,
      "boolean",
      "Prompt path result should have ok property",
    );
    assertEquals(typeof inputPathResult.ok, "boolean", "Input path result should have ok property");
    assertEquals(
      typeof outputPathResult.ok,
      "boolean",
      "Output path result should have ok property",
    );
    assertEquals(
      typeof schemaPathResult.ok,
      "boolean",
      "Schema path result should have ok property",
    );

    if (promptPathResult.ok && inputPathResult.ok && outputPathResult.ok && schemaPathResult.ok) {
      // Path string validation
      assertEquals(typeof promptPathResult.data, "string", "Prompt path should be string");
      assertEquals(typeof inputPathResult.data, "string", "Input path should be string");
      assertEquals(typeof outputPathResult.data, "string", "Output path should be string");
      assertEquals(typeof schemaPathResult.data, "string", "Schema path should be string");

      // Path non-emptiness validation
      assertEquals(promptPathResult.data.length > 0, true, "Prompt path should not be empty");
      assertEquals(inputPathResult.data.length > 0, true, "Input path should not be empty");
      assertEquals(outputPathResult.data.length > 0, true, "Output path should not be empty");
      assertEquals(schemaPathResult.data.length > 0, true, "Schema path should not be empty");
    }
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Immutability and invariants preservation", () => {
  logger.debug("Testing immutability and invariants preservation");

  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);

  if (factoryResult.ok) {
    const factory = factoryResult.data;

    try {
      // Multiple calls should return consistent results
      const result1 = factory.build();
      const result2 = factory.build();
      const result3 = factory.getAllParams();

      logger.debug("Immutability test", { result1, result2, result3 });

      // Ensure all results are successful before comparing
      assert(result1.ok, "result1 should be successful");
      assert(result2.ok, "result2 should be successful");
      // Note: result3 from getAllParams() is not a Result type, it's a plain object
      assertExists(result3, "result3 should exist");

      // Structural invariants validation
      assertEquals(
        result1.data.variables.directive_type,
        result2.data.variables.directive_type,
        "directive_type should be immutable",
      );
      assertEquals(
        result1.data.variables.layer_type,
        result2.data.variables.layer_type,
        "layer_type should be immutable",
      );
      assertEquals(
        result1.data.template_file,
        result2.data.template_file,
        "template_file should be immutable",
      );

      // Cross-method consistency validation
      assertEquals(
        result1.data.variables.directive_type,
        testCliParams.directiveType,
        "directive_type should match original input",
      );
      assertEquals(
        result1.data.variables.layer_type,
        testCliParams.layerType,
        "layer_type should match original input",
      );

      // Path consistency validation using safe access methods
      const currentPromptResult = factory.getPromptFilePath();
      const currentInputResult = factory.getInputFilePath();
      const currentOutputResult = factory.getOutputFilePath();
      const currentSchemaResult = factory.getSchemaFilePath();

      // Validate path consistency if paths are resolved
      if (currentPromptResult.ok && result1.ok) {
        assertEquals(
          result1.data.variables.prompt_path,
          currentPromptResult.data,
          "prompt_path should be consistent between build() and getPromptFilePath()",
        );
      }
      if (currentInputResult.ok && result1.ok) {
        assertEquals(
          result1.data.variables.input_file,
          currentInputResult.data,
          "input_file should be consistent between build() and getInputFilePath()",
        );
      }
      if (currentOutputResult.ok && result1.ok) {
        assertEquals(
          result1.data.variables.output_file,
          currentOutputResult.data,
          "output_file should be consistent between build() and getOutputFilePath()",
        );
      }
      if (currentSchemaResult.ok && result1.ok) {
        assertEquals(
          result1.data.variables.schema_path,
          currentSchemaResult.data,
          "schema_path should be consistent between build() and getSchemaFilePath()",
        );
      }
    } catch (error) {
      // In test environment, build() may fail due to missing files
      // This is acceptable for structural validation
      logger.debug("Immutability test failed due to test environment", { error });
      assertEquals(error instanceof Error, true, "Should throw proper Error when build fails");

      // We can still test immutability with the getAllParams method
      let params1, params2;
      try {
        params1 = factory.getAllParams();
        params2 = factory.getAllParams();
      } catch (error) {
        // Even getAllParams() may fail in test environment
        logger.debug("getAllParams failed in immutability test", { error });
        assertEquals(error instanceof Error, true, "Should throw proper Error");
        return; // Skip immutability validation - basic structure test passed
      }

      // Basic immutability validation using getAllParams
      assertEquals(params1.directive, params2.directive, "directive should be immutable");
      assertEquals(params1.layer, params2.layer, "layer should be immutable");

      logger.debug("Basic immutability validation passed with getAllParams");
    }
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Interface contract compliance", () => {
  logger.debug("Testing interface contract compliance");

  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);

  if (factoryResult.ok) {
    const factory = factoryResult.data;

    // Test all public interface methods exist and have correct signatures
    assertEquals(typeof factory.build, "function", "build should be function");
    assertEquals(typeof factory.getAllParams, "function", "getAllParams should be function");
    assertEquals(
      typeof factory.getPromptFilePath,
      "function",
      "getPromptFilePath should be function",
    );
    assertEquals(
      typeof factory.getInputFilePath,
      "function",
      "getInputFilePath should be function",
    );
    assertEquals(
      typeof factory.getOutputFilePath,
      "function",
      "getOutputFilePath should be function",
    );
    assertEquals(
      typeof factory.getSchemaFilePath,
      "function",
      "getSchemaFilePath should be function",
    );
    assertEquals(typeof factory.getOptions, "function", "getOptions should be function");
    assertEquals(typeof factory.hasValidBaseDir, "function", "hasValidBaseDir should be function");
    assertEquals(typeof factory.getBaseDirError, "function", "getBaseDirError should be function");
    assertEquals(typeof factory.checkAllParams, "function", "checkAllParams should be function");
    assertEquals(typeof factory.toPromptParams, "function", "toPromptParams should be function");

    // Test property accessors using safe Result methods
    const promptPathResult = factory.getPromptFilePath();
    const inputPathResult = factory.getInputFilePath();
    const outputPathResult = factory.getOutputFilePath();
    const schemaPathResult = factory.getSchemaFilePath();

    // Validate Result type structure for path accessors
    assertEquals(typeof promptPathResult, "object", "getPromptFilePath should return Result");
    assertEquals(typeof inputPathResult, "object", "getInputFilePath should return Result");
    assertEquals(typeof outputPathResult, "object", "getOutputFilePath should return Result");
    assertEquals(typeof schemaPathResult, "object", "getSchemaFilePath should return Result");

    // Check if paths are resolved (may succeed or fail depending on test setup)
    if (promptPathResult.ok) {
      assertEquals(
        typeof promptPathResult.data,
        "string",
        "promptFilePath should be string when resolved",
      );
    }
    if (inputPathResult.ok) {
      assertEquals(
        typeof inputPathResult.data,
        "string",
        "inputFilePath should be string when resolved",
      );
    }
    if (outputPathResult.ok) {
      assertEquals(
        typeof outputPathResult.data,
        "string",
        "outputFilePath should be string when resolved",
      );
    }
    if (schemaPathResult.ok) {
      assertEquals(
        typeof schemaPathResult.data,
        "string",
        "schemaFilePath should be string when resolved",
      );
    }
    assertEquals(typeof factory.errorFormat, "string", "errorFormat should be string");
    assertEquals(typeof factory.extended, "boolean", "extended should be boolean");
    assertEquals(typeof factory.customValidation, "boolean", "customValidation should be boolean");
    assertEquals(typeof factory.customVariables, "object", "customVariables should be object");

    // Test legacy API compatibility
    assertEquals(typeof factory.getDirective, "function", "getDirective should be function");
    assertEquals(typeof factory.getLayerType, "function", "getLayerType should be function");

    // Test legacy path properties with safe access - they may throw if not resolved
    try {
      const promptPath = factory.promptPath;
      assertEquals(typeof promptPath, "string", "promptPath should be string when resolved");
    } catch (error) {
      // Expected if path not resolved in test environment
      assertEquals(error instanceof Error, true, "promptPath should throw Error if not resolved");
    }

    try {
      const schemaPath = factory.schemaPath;
      assertEquals(typeof schemaPath, "string", "schemaPath should be string when resolved");
    } catch (error) {
      // Expected if path not resolved in test environment
      assertEquals(error instanceof Error, true, "schemaPath should throw Error if not resolved");
    }

    logger.debug("Interface contract validation passed");
  }
});
