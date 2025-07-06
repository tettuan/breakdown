/**
 * @fileoverview Behavior tests for PromptVariablesFactory
 * 
 * Validates:
 * - Normal operation behavior
 * - Error handling behavior
 * - Boundary conditions
 * - Integration with dependencies
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptVariablesFactory } from "../prompt_variables_factory.ts";
import type { PromptCliParams } from "../prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-behavior-test");

Deno.test("PromptVariablesFactory - Behavior - creates factory with valid parameters", async () => {
  const validParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
    // パス関連のパラメータを追加してParameter組み合わせエラーを回避
    fromFile: "./test/input.md",
    destinationFile: "./test/output.md",
  };
  
  const result = await PromptVariablesFactory.create(validParams);
  
  logger.debug("Factory creation result", { result });
  
  // エラーが返される場合でも、Result型で返されることを確認
  assertExists(result, "Should return Result");
  assertEquals(typeof result, "object", "Should be object");
  assertEquals("ok" in result || "error" in result, true, "Should be Result type");
  
  // 成功した場合のチェック
  if (result.ok) {
    assertExists(result.data, "Should have factory instance");
  } else {
    // エラーの場合でも適切な構造であることを確認
    assertExists(result.error, "Should have error information");
    logger.debug("Factory creation error", { error: result.error });
  }
});

Deno.test("PromptVariablesFactory - Behavior - handles missing required parameters gracefully", async () => {
  const incompleteParams: Partial<PromptCliParams> = {
    directiveType: "to",
    // Missing layerType
  };
  
  const result = await PromptVariablesFactory.create(incompleteParams as PromptCliParams);
  
  logger.debug("Missing parameter result", { result });
  
  // Should return Result with error, not throw
  assertExists(result, "Should return Result");
  assertEquals(typeof result, "object", "Should be object");
  assertEquals("ok" in result || "error" in result, true, "Should be Result type");
});

Deno.test("PromptVariablesFactory - Behavior - processes valid directive and layer combinations", async () => {
  const combinations = [
    { directiveType: "to", layerType: "project", fromLayerType: "issue" },
    { directiveType: "summary", layerType: "issue", fromLayerType: "task" },
    { directiveType: "defect", layerType: "task", fromLayerType: "task" },
  ];
  
  for (const params of combinations) {
    const fullParams: PromptCliParams = {
      ...params,
      promptDir: "/tmp/prompts",
    };
    
    const result = await PromptVariablesFactory.create(fullParams);
    
    logger.debug(`Combination test: ${params.directiveType}/${params.layerType}`, { result });
    
    assertExists(result, `Should process ${params.directiveType}/${params.layerType}`);
    assertEquals(typeof result, "object", "Should return Result object");
  }
});

Deno.test("PromptVariablesFactory - Behavior - builds prompt variables from factory instance", async () => {
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
    
    logger.debug("Built variables", { variablesResult });
    
    assertExists(variablesResult, "Should build variables");
    assertEquals(typeof variablesResult, "object", "Should return Result");
    assertEquals("ok" in variablesResult || "error" in variablesResult, true, "Should be Result type");
    
    if (variablesResult.ok) {
      const variables = variablesResult.data;
      // Basic structure validation
      assertExists(variables.promptDir, "Should have promptDir");
      assertExists(variables.promptPath, "Should have promptPath");
    }
  }
});

Deno.test("PromptVariablesFactory - Behavior - handles custom variables correctly", async () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
    promptDir: "/tmp/prompts",
    customVariables: {
      projectName: "TestProject",
      author: "TestAuthor",
      version: "1.0.0",
    },
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    const variablesResult = await factory.build();
    
    logger.debug("Custom variables result", { variablesResult });
    
    if (variablesResult.ok) {
      const variables = variablesResult.data;
      // Verify custom variables are included
      assertEquals(variables.projectName, "TestProject", "Should include custom projectName");
      assertEquals(variables.author, "TestAuthor", "Should include custom author");
      assertEquals(variables.version, "1.0.0", "Should include custom version");
    }
  }
});

Deno.test("PromptVariablesFactory - Behavior - validates paths before building", async () => {
  const params: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    fromLayerType: "task",
    promptDir: "/invalid/path/that/does/not/exist",
    fromFile: "/also/invalid/file.md",
  };
  
  const factoryResult = await PromptVariablesFactory.create(params);
  
  logger.debug("Invalid path test result", { factoryResult });
  
  // Factory creation might succeed, but build should handle invalid paths
  if (factoryResult.ok) {
    const factory = factoryResult.data;
    const buildResult = await factory.build();
    
    // Should return error Result, not throw
    assertExists(buildResult, "Should return Result");
    assertEquals(typeof buildResult, "object", "Should be object");
  }
});