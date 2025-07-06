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

import { assertEquals, assertExists } from "@std/assert";
import { PromptVariablesFactory } from "./prompt_variables_factory.ts";
import type { PromptCliParams, TotalityPromptCliParams } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";
import type { PromptVariablesFactoryErrors } from "../types/prompt_variables_factory_error.ts";
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
  demonstrativeType: "to",
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
  directive: { value: "to" } as any,
  layer: { value: "project" } as any,
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
    assertEquals(typeof factory.getAllParams, "function", "Factory should have getAllParams method");
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

Deno.test("PromptVariablesFactory - 2_structure - 3-stage transformation data integrity", async () => {
  logger.debug("Testing 3-stage transformation data integrity");
  
  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    
    try {
      // Stage 1: Raw input → PromptVariableSource (internal validation)
      const allParams = factory.getAllParams();
      
      logger.debug("Stage 1 output - getAllParams", { allParams });
      
      // Stage 1 structural validation
      assertExists(allParams.directive, "Should have directive from Stage 1");
      assertExists(allParams.layer, "Should have layer from Stage 1");
      assertExists(allParams.promptFilePath, "Should have promptFilePath from Stage 1");
      assertExists(allParams.inputFilePath, "Should have inputFilePath from Stage 1");
      assertExists(allParams.outputFilePath, "Should have outputFilePath from Stage 1");
      assertExists(allParams.schemaFilePath, "Should have schemaFilePath from Stage 1");
      
      // Stage 2-3: PromptVariableSource → PromptVariables → PromptParams
      const promptParams = factory.build();
      
      logger.debug("Stage 2-3 output - build", { promptParams });
      
      // Stage 2-3 structural validation
      assertExists(promptParams.template_file, "Should have template_file from Stage 2-3");
      assertExists(promptParams.variables, "Should have variables from Stage 2-3");
      
      // PromptParams variables structural integrity
      const variables = promptParams.variables;
      assertExists(variables.demonstrative_type, "Should have demonstrative_type");
      assertExists(variables.layer_type, "Should have layer_type");
      assertExists(variables.input_file, "Should have input_file");
      assertExists(variables.output_file, "Should have output_file");
      assertExists(variables.prompt_path, "Should have prompt_path");
      assertExists(variables.schema_path, "Should have schema_path");
      
      // Type consistency validation
      assertEquals(typeof variables.demonstrative_type, "string", "demonstrative_type should be string");
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
    demonstrativeType: "",  // Invalid empty string
    layerType: "project",
    options: {
      fromLayerType: "task",
    },
  };
  
  const result = await PromptVariablesFactory.create(invalidParams);
  
  logger.debug("Smart Constructor validation", { result });
  
  if (!result.ok && result.error) {
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
    throw new Error("Smart Constructor should reject invalid parameters");
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Path resolution structural integrity", async () => {
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
      schemaPathResult 
    });
    
    // All path results should be successful
    assertEquals(promptPathResult.ok, true, "Prompt path should be resolved");
    assertEquals(inputPathResult.ok, true, "Input path should be resolved");
    assertEquals(outputPathResult.ok, true, "Output path should be resolved");
    assertEquals(schemaPathResult.ok, true, "Schema path should be resolved");
    
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

Deno.test("PromptVariablesFactory - 2_structure - Immutability and invariants preservation", async () => {
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
      
      // Structural invariants validation
      assertEquals(
        result1.variables.demonstrative_type,
        result2.variables.demonstrative_type,
        "demonstrative_type should be immutable"
      );
      assertEquals(
        result1.variables.layer_type,
        result2.variables.layer_type,
        "layer_type should be immutable"
      );
      assertEquals(
        result1.template_file,
        result2.template_file,
        "template_file should be immutable"
      );
      
      // Cross-method consistency validation
      assertEquals(
        result1.variables.demonstrative_type,
        testCliParams.demonstrativeType,
        "demonstrative_type should match original input"
      );
      assertEquals(
        result1.variables.layer_type,
        testCliParams.layerType,
        "layer_type should match original input"
      );
      
      // Path consistency validation
      assertEquals(
        result1.variables.prompt_path,
        result3.promptFilePath,
        "prompt_path should be consistent between build() and getAllParams()"
      );
      assertEquals(
        result1.variables.input_file,
        result3.inputFilePath,
        "input_file should be consistent between build() and getAllParams()"
      );
      assertEquals(
        result1.variables.output_file,
        result3.outputFilePath,
        "output_file should be consistent between build() and getAllParams()"
      );
      assertEquals(
        result1.variables.schema_path,
        result3.schemaFilePath,
        "schema_path should be consistent between build() and getAllParams()"
      );
    } catch (error) {
      logger.debug("Immutability test failed", { error });
      throw new Error(`Immutability validation should not fail: ${error}`);
    }
  }
});

Deno.test("PromptVariablesFactory - 2_structure - Interface contract compliance", async () => {
  logger.debug("Testing interface contract compliance");
  
  const factoryResult = PromptVariablesFactory.createWithConfig(testFactoryConfig, testCliParams);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    
    // Test all public interface methods exist and have correct signatures
    assertEquals(typeof factory.build, "function", "build should be function");
    assertEquals(typeof factory.getAllParams, "function", "getAllParams should be function");
    assertEquals(typeof factory.getPromptFilePath, "function", "getPromptFilePath should be function");
    assertEquals(typeof factory.getInputFilePath, "function", "getInputFilePath should be function");
    assertEquals(typeof factory.getOutputFilePath, "function", "getOutputFilePath should be function");
    assertEquals(typeof factory.getSchemaFilePath, "function", "getSchemaFilePath should be function");
    assertEquals(typeof factory.getOptions, "function", "getOptions should be function");
    assertEquals(typeof factory.hasValidBaseDir, "function", "hasValidBaseDir should be function");
    assertEquals(typeof factory.getBaseDirError, "function", "getBaseDirError should be function");
    assertEquals(typeof factory.validateAll, "function", "validateAll should be function");
    assertEquals(typeof factory.toPromptParams, "function", "toPromptParams should be function");
    
    // Test property accessors
    assertEquals(typeof factory.promptFilePath, "string", "promptFilePath should be string");
    assertEquals(typeof factory.inputFilePath, "string", "inputFilePath should be string");
    assertEquals(typeof factory.outputFilePath, "string", "outputFilePath should be string");
    assertEquals(typeof factory.schemaFilePath, "string", "schemaFilePath should be string");
    assertEquals(typeof factory.errorFormat, "string", "errorFormat should be string");
    assertEquals(typeof factory.extended, "boolean", "extended should be boolean");
    assertEquals(typeof factory.customValidation, "boolean", "customValidation should be boolean");
    assertEquals(typeof factory.customVariables, "object", "customVariables should be object");
    
    // Test legacy API compatibility
    assertEquals(typeof factory.getDirective, "function", "getDirective should be function");
    assertEquals(typeof factory.getLayerType, "function", "getLayerType should be function");
    assertEquals(typeof factory.promptPath, "string", "promptPath should be string");
    assertEquals(typeof factory.schemaPath, "string", "schemaPath should be string");
    
    logger.debug("Interface contract validation passed");
  }
});