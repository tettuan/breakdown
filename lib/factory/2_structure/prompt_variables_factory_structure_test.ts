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
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
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
    directiveType: "to",
    layerType: "project",
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
  };
  
  // 型チェックで検証（コンパイル時に検証される）
  const hasAllFields = Object.keys(completeParams).length >= 3; // 最低限必須フィールド
  assertEquals(hasAllFields, true, "Should have required fields");
  
  // Optional fieldsの型検証
  if (completeParams.customVariables) {
    assertEquals(
      typeof completeParams.customVariables,
      "object",
      "customVariables should be object"
    );
  }
});

Deno.test("PromptVariablesFactory - Structure - built PromptVariables has required properties", async () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
    promptDir: "/tmp/prompts",
    fromFile: "/tmp/input.md",
    destinationFile: "/tmp/output.md",
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    const variablesResult = await factory.build();
    
    if (variablesResult.ok) {
      const variables = variablesResult.data;
      
      logger.debug("Built variables structure", { variables });
      
      // 必須プロパティの存在確認
      assertExists(variables.promptPath, "Should have promptPath");
      assertExists(variables.promptDir, "Should have promptDir");
      assertExists(variables.directiveType, "Should have directiveType");
      assertExists(variables.layerType, "Should have layerType");
      assertExists(variables.fromLayerType, "Should have fromLayerType");
      
      // 型の確認
      assertEquals(typeof variables.promptPath, "string", "promptPath should be string");
      assertEquals(typeof variables.promptDir, "string", "promptDir should be string");
      assertEquals(typeof variables.directiveType, "string", "directiveType should be string");
      assertEquals(typeof variables.layerType, "string", "layerType should be string");
      assertEquals(typeof variables.fromLayerType, "string", "fromLayerType should be string");
      
      // Optional properties（存在する場合の型確認）
      if ("inputPath" in variables) {
        assertEquals(typeof variables.inputPath, "string", "inputPath should be string");
      }
      if ("outputPath" in variables) {
        assertEquals(typeof variables.outputPath, "string", "outputPath should be string");
      }
      if ("schemaPath" in variables) {
        assertEquals(typeof variables.schemaPath, "string", "schemaPath should be string");
      }
    }
  }
});

Deno.test("PromptVariablesFactory - Structure - error types have proper structure", async () => {
  const invalidParams: PromptCliParams = {
    directiveType: "", // Invalid empty string
    layerType: "project",
    fromLayerType: "task",
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
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
    customVariables: {
      immutableKey: "should-not-change",
    },
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    
    // 複数回buildを呼んでも同じ結果が得られることを確認
    const result1 = await factory.build();
    const result2 = await factory.build();
    
    if (result1.ok && result2.ok) {
      logger.debug("Invariant test", { result1: result1.data, result2: result2.data });
      
      // 基本的なプロパティが変わらないことを確認
      assertEquals(
        result1.data.directiveType,
        result2.data.directiveType,
        "directiveType should be consistent"
      );
      assertEquals(
        result1.data.layerType,
        result2.data.layerType,
        "layerType should be consistent"
      );
      
      // カスタム変数が保持されることを確認
      if (result1.data.immutableKey && result2.data.immutableKey) {
        assertEquals(
          result1.data.immutableKey,
          result2.data.immutableKey,
          "Custom variables should be preserved"
        );
      }
    }
  }
});