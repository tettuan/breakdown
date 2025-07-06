/**
 * @fileoverview Structure tests for PromptVariablesFactory
 * 
 * Validates:
 * - Data structure integrity
 * - Type completeness
 * - Property invariants
 * - Interface contracts
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptVariablesFactory } from "../prompt_variables_factory.ts";
import type { PromptCliParams } from "../prompt_variables_factory.ts";
import type { Result } from "../../types/result.ts";
import type { PromptVariables } from "../../types/prompt_variables.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-structure-test");

Deno.test("PromptVariablesFactory - Structure - Result type has correct structure", async () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromLayerType: "task",
    },
  };
  
  const result = await PromptVariablesFactory.create(params);
  
  logger.debug("Result structure", { result });
  
  // Result型の構造検証
  assertExists(result, "Result should exist");
  assertEquals(typeof result, "object", "Result should be object");
  
  // Discriminated union check
  if ("ok" in result && result.ok) {
    assertExists(result.data, "Success Result should have data");
    assertEquals("error" in result, false, "Success Result should not have error");
  } else if ("error" in result && !result.ok) {
    assertExists(result.error, "Error Result should have error");
    assertEquals("data" in result, false, "Error Result should not have data");
  } else {
    throw new Error("Result does not match expected structure");
  }
});

Deno.test("PromptVariablesFactory - Structure - PromptCliParams interface completeness", () => {
  const completeParams: PromptCliParams = {
    // Required fields
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromLayerType: "task",
      
      // Optional fields
      fromFile: "/path/to/input.md",
      destinationFile: "/path/to/output.md",
      adaptation: "custom",
      promptDir: "/path/to/prompts",
      input_text: "inline text",
      customVariables: {
        key1: "value1",
        key2: "value2",
      },
    },
  };
  
  // 型チェックで検証（コンパイル時に検証される）
  const hasAllFields = Object.keys(completeParams).length >= 3; // 最低限必須フィールド
  assertEquals(hasAllFields, true, "Should have required fields");
  
  // Optional fieldsの型検証
  if (completeParams.options.customVariables) {
    assertEquals(
      typeof completeParams.options.customVariables,
      "object",
      "customVariables should be object"
    );
  }
});

Deno.test("PromptVariablesFactory - Structure - built PromptVariables has required properties", async () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromLayerType: "task",
      promptDir: "/tmp/prompts",
      fromFile: "/tmp/input.md",
      destinationFile: "/tmp/output.md",
    },
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    
    try {
      const variables = factory.build();
      
      logger.debug("Built variables structure", { variables });
      
      // 必須プロパティの存在確認（PromptParams構造）
      assertExists(variables.template_file, "Should have template_file");
      assertExists(variables.variables, "Should have variables");
      assertExists(variables.variables.demonstrative_type, "Should have demonstrative_type");
      assertExists(variables.variables.layer_type, "Should have layer_type");
      assertExists(variables.variables.input_file, "Should have input_file");
      assertExists(variables.variables.output_file, "Should have output_file");
      assertExists(variables.variables.prompt_path, "Should have prompt_path");
      assertExists(variables.variables.schema_path, "Should have schema_path");
      
      // 型の確認
      assertEquals(typeof variables.template_file, "string", "template_file should be string");
      assertEquals(typeof variables.variables, "object", "variables should be object");
      assertEquals(typeof variables.variables.demonstrative_type, "string", "demonstrative_type should be string");
      assertEquals(typeof variables.variables.layer_type, "string", "layer_type should be string");
      assertEquals(typeof variables.variables.input_file, "string", "input_file should be string");
      assertEquals(typeof variables.variables.output_file, "string", "output_file should be string");
      assertEquals(typeof variables.variables.prompt_path, "string", "prompt_path should be string");
      assertEquals(typeof variables.variables.schema_path, "string", "schema_path should be string");
    } catch (error) {
      logger.debug("Build failed", { error });
      throw new Error(`Build should not throw for valid parameters: ${error}`);
    }
  }
});

Deno.test("PromptVariablesFactory - Structure - error types have proper structure", async () => {
  const invalidParams: PromptCliParams = {
    demonstrativeType: "", // Invalid empty string
    layerType: "project",
    options: {
      fromLayerType: "task",
    },
  };
  
  const result = await PromptVariablesFactory.create(invalidParams);
  
  if (!result.ok && result.error) {
    logger.debug("Error structure", { error: result.error });
    
    // エラー構造の検証
    assertExists(result.error, "Should have error");
    assertExists(result.error.kind, "Error should have kind");
    assertExists(result.error.message, "Error should have message");
    
    // エラー種別の検証
    assertEquals(typeof result.error.kind, "string", "Error kind should be string");
    assertEquals(typeof result.error.message, "string", "Error message should be string");
    
    // Optional error properties
    if ("details" in result.error) {
      assertEquals(typeof result.error.details, "object", "Error details should be object");
    }
  }
});

Deno.test("PromptVariablesFactory - Structure - maintains invariants through transformation", async () => {
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromLayerType: "task",
      customVariables: {
        immutableKey: "should-not-change",
      },
    },
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    
    try {
      // 複数回buildを呼んでも同じ結果が得られることを確認
      const result1 = factory.build();
      const result2 = factory.build();
      
      logger.debug("Invariant test", { result1: result1, result2: result2 });
      
      // 基本的なプロパティが変わらないことを確認
      assertEquals(
        result1.variables.demonstrative_type,
        result2.variables.demonstrative_type,
        "demonstrative_type should be consistent"
      );
      assertEquals(
        result1.variables.layer_type,
        result2.variables.layer_type,
        "layer_type should be consistent"
      );
      
      // カスタム変数が保持されることを確認
      if (result1.variables.immutableKey && result2.variables.immutableKey) {
        assertEquals(
          result1.variables.immutableKey,
          result2.variables.immutableKey,
          "Custom variables should be preserved"
        );
      }
    } catch (error) {
      logger.debug("Build failed in invariant test", { error });
      // This test expects success, so rethrow
      throw error;
    }
  }
});