/**
 * @fileoverview Basic Integration Test for DirectiveType and LayerType
 * 
 * DirectiveTypeとLayerTypeの統合テスト。
 * Worker52とWorker57の実装に基づいて、基本的な統合シナリオを検証する。
 * 
 * @module tests/integration/directive_layer_types/basic_integration
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// DirectiveType と LayerType の実装をインポート
import { DirectiveType, TwoParamsDirectivePattern } from "../../../../lib/types/directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../../../../lib/types/layer_type.ts";
import { createTwoParamsResult } from "../../../../lib/types/two_params_result_extension.ts";
import type { TwoParams_Result } from "../../../../lib/types/two_params_result_extension.ts";

const logger = new BreakdownLogger("integration:directive_layer");

/**
 * Scenario 1: Normal Flow - DirectiveType と LayerType の基本的な統合
 * 
 * TwoParams_Result から DirectiveType と LayerType を生成し、
 * 基本的な相互作用を検証する。
 */
Deno.test("DirectiveType and LayerType Integration: Normal Flow - Basic Creation", () => {
  logger.debug("Starting normal flow integration test", {
    directive: "to",
    layer: "project",
    testType: "basic_creation"
  });

  // 1. TwoParams_Result の準備（BreakdownParams でバリデーション済みを想定）
  const twoParamsResult: TwoParams_Result = createTwoParamsResult("to", "project");
  
  // 2. DirectiveType の生成
  const directiveType = DirectiveType.create(twoParamsResult);
  assertEquals(directiveType.value, "to");
  assertEquals(directiveType.getValue(), "to"); // 後方互換メソッド
  
  // 3. LayerType の生成
  const layerType = LayerType.create(twoParamsResult);
  assertEquals(layerType.value, "project");
  assertEquals(layerType.getValue(), "project"); // 後方互換メソッド
  
  // 4. 型の相互作用の確認
  assertEquals(directiveType.equals(DirectiveType.create(twoParamsResult)), true);
  assertEquals(layerType.equals(LayerType.create(twoParamsResult)), true);
  
  // 5. パス生成の統合テスト
  const promptPath = directiveType.getPromptPath(layerType);
  assertEquals(promptPath, "prompts/to/project/f_project.md");
  
  const schemaPath = directiveType.getSchemaPath(layerType);
  assertEquals(schemaPath, "schema/to/project/base.schema.md");
  
  logger.debug("Normal flow integration test completed", {
    success: true,
    directiveValue: directiveType.value,
    layerValue: layerType.value,
    promptPath,
    schemaPath
  });
});

/**
 * Scenario 2: Pattern-based Validation Integration
 * 
 * DirectiveType と LayerType のパターンベースバリデーションの統合を検証する。
 */
Deno.test("DirectiveType and LayerType Integration: Pattern Validation", () => {
  logger.debug("Starting pattern validation integration test");

  // 1. パターンの作成
  const directivePattern = TwoParamsDirectivePattern.createOrError("^(to|summary|defect)$");
  assertEquals(directivePattern.ok, true);
  
  const layerPattern = TwoParamsLayerTypePattern.createOrError("^(project|issue|task)$");
  assertEquals(layerPattern.ok, true);
  
  if (!directivePattern.ok || !layerPattern.ok) return;
  
  // 2. 有効なパターンでの統合テスト
  const validResult = createTwoParamsResult("summary", "issue");
  
  const directiveResult = DirectiveType.createOrError(validResult, directivePattern.data);
  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertEquals(directiveResult.data.validatedByPattern, true);
  }
  
  const layerResult = LayerType.createOrError(validResult, layerPattern.data);
  assertEquals(layerResult.ok, true);
  if (layerResult.ok) {
    assertEquals(layerResult.data.validatedByPattern?.getPattern(), "^(project|issue|task)$");
  }
  
  // 3. 無効なパターンでのエラー確認
  const invalidResult = createTwoParamsResult("invalid_directive", "invalid_layer");
  
  const invalidDirectiveResult = DirectiveType.createOrError(invalidResult, directivePattern.data);
  assertEquals(invalidDirectiveResult.ok, false);
  if (!invalidDirectiveResult.ok) {
    if (invalidDirectiveResult.error.kind === "InvalidInput") {
      assertStringIncludes(invalidDirectiveResult.error.reason, "does not match required pattern");
    }
  }
  
  const invalidLayerResult = LayerType.createOrError(invalidResult, layerPattern.data);
  assertEquals(invalidLayerResult.ok, false);
  if (!invalidLayerResult.ok) {
    if (invalidLayerResult.error.kind === "InvalidInput") {
      assertStringIncludes(invalidLayerResult.error.reason, "does not match required pattern");
    }
  }
  
  logger.debug("Pattern validation integration test completed", {
    success: true,
    validPattern: true,
    invalidPattern: true
  });
});

/**
 * Scenario 3: Cross-type Validation Integration
 * 
 * DirectiveType と LayerType の相互バリデーションを検証する。
 */
Deno.test("DirectiveType and LayerType Integration: Cross-type Validation", () => {
  logger.debug("Starting cross-type validation integration test");

  // 1. 有効な組み合わせのテスト
  const validCombinations = [
    { directive: "to", layer: "project" },
    { directive: "summary", layer: "issue" },
    { directive: "defect", layer: "task" },
    { directive: "to", layer: "task" }
  ];
  
  for (const combo of validCombinations) {
    const result = createTwoParamsResult(combo.directive, combo.layer);
    
    const directiveType = DirectiveType.create(result);
    const layerType = LayerType.create(result);
    
    // LayerType の DirectiveType に対する妥当性確認
    const isValid = layerType.isValidForDirective(combo.directive);
    assertEquals(isValid, true, `${combo.layer} should be valid for ${combo.directive}`);
    
    const validationResult = layerType.isValidForDirectiveOrError(combo.directive);
    assertEquals(validationResult.ok, true);
    
    logger.debug("Valid combination tested", {
      directive: combo.directive,
      layer: combo.layer,
      isValid
    });
  }
  
  // 2. 無効な組み合わせのテスト（カスタムルールを使用）
  const customRules = {
    "defect": ["issue", "task"], // project は除外
    "analysis": ["project"] // issue, task は除外
  };
  
  const invalidCombinations = [
    { directive: "defect", layer: "project" }, // defect は project で無効
    { directive: "analysis", layer: "issue" }, // analysis は issue で無効
    { directive: "analysis", layer: "task" } // analysis は task で無効
  ];
  
  for (const combo of invalidCombinations) {
    const result = createTwoParamsResult(combo.directive, combo.layer);
    
    const layerType = LayerType.create(result);
    
    const isValid = layerType.isValidForDirective(combo.directive, customRules);
    assertEquals(isValid, false, `${combo.layer} should be invalid for ${combo.directive} with custom rules`);
    
    const validationResult = layerType.isValidForDirectiveOrError(combo.directive, customRules);
    assertEquals(validationResult.ok, false);
    if (!validationResult.ok) {
      if (validationResult.error.kind === "ValidationFailed") {
        assertStringIncludes(validationResult.error.errors[0], "is not valid for DirectiveType");
      }
    }
    
    logger.debug("Invalid combination tested", {
      directive: combo.directive,
      layer: combo.layer,
      isValid,
      errorMessage: validationResult.ok ? "" : 
        validationResult.error.kind === "ValidationFailed" 
          ? validationResult.error.errors[0] 
          : validationResult.error.kind === "InvalidInput" 
            ? validationResult.error.reason 
            : "Unknown error"
    });
  }
  
  logger.debug("Cross-type validation integration test completed", {
    success: true,
    validCombinations: validCombinations.length,
    invalidCombinations: invalidCombinations.length
  });
});

/**
 * Scenario 4: Resource Path Integration
 * 
 * DirectiveType と LayerType を使ったリソースパス解決の統合を検証する。
 */
Deno.test("DirectiveType and LayerType Integration: Resource Path Resolution", () => {
  logger.debug("Starting resource path integration test");

  const testCases = [
    {
      directive: "to",
      layer: "project",
      expectedPromptPath: "prompts/to/project/f_project.md",
      expectedSchemaPath: "schema/to/project/base.schema.md"
    },
    {
      directive: "summary",
      layer: "issue",
      expectedPromptPath: "prompts/summary/issue/f_issue.md",
      expectedSchemaPath: "schema/summary/issue/base.schema.md"
    },
    {
      directive: "defect",
      layer: "task",
      expectedPromptPath: "prompts/defect/task/f_task.md",
      expectedSchemaPath: "schema/defect/task/base.schema.md"
    }
  ];
  
  for (const testCase of testCases) {
    const result = createTwoParamsResult(testCase.directive, testCase.layer);
    
    const directiveType = DirectiveType.create(result);
    const layerType = LayerType.create(result);
    
    // 1. DirectiveType からのパス生成
    const promptPath = directiveType.getPromptPath(layerType);
    assertEquals(promptPath, testCase.expectedPromptPath);
    
    const schemaPath = directiveType.getSchemaPath(layerType);
    assertEquals(schemaPath, testCase.expectedSchemaPath);
    
    // 2. LayerType からのパス生成（互換性テスト）
    const templatePath = layerType.resolvePromptTemplatePath(testCase.directive);
    assertStringIncludes(templatePath, testCase.directive);
    assertStringIncludes(templatePath, testCase.layer);
    
    // 3. 出力パス解決の統合テスト
    const outputPath = directiveType.resolveOutputPath("test-input.md", layerType);
    assertStringIncludes(outputPath, `output/${testCase.directive}/${testCase.layer}`);
    assertStringIncludes(outputPath, "test-input.md");
    
    // 4. リソースパス有効性の確認
    assertEquals(directiveType.isValidForResourcePath(), true);
    
    logger.debug("Resource path tested", {
      directive: testCase.directive,
      layer: testCase.layer,
      promptPath,
      schemaPath,
      outputPath
    });
  }
  
  logger.debug("Resource path integration test completed", {
    success: true,
    testCasesCount: testCases.length
  });
});

/**
 * Scenario 5: Error Propagation Integration
 * 
 * エラーハンドリングの統合テストを実行する。
 */
Deno.test("DirectiveType and LayerType Integration: Error Propagation", () => {
  logger.debug("Starting error propagation integration test");

  // 1. 無効な TwoParams_Result でのエラー伝播
  const invalidResults = [
    {
      name: "missing_type",
      result: Object.assign(createTwoParamsResult("to", "project"), { type: undefined }) as any,
      expectedError: "must have type 'two'"
    },
    {
      name: "missing_demonstrativeType", 
      result: Object.assign(createTwoParamsResult("", "project"), { demonstrativeType: undefined }) as any,
      expectedError: "demonstrativeType"
    },
    {
      name: "missing_layerType",
      result: Object.assign(createTwoParamsResult("to", ""), { layerType: undefined }) as any,
      expectedError: "layerType"
    }
  ];
  
  for (const testCase of invalidResults) {
    // DirectiveType のエラー伝播
    const directiveResult = DirectiveType.createOrError(testCase.result);
    assertEquals(directiveResult.ok, false);
    if (!directiveResult.ok) {
      const errorMessage = directiveResult.error.kind === "InvalidInput" 
        ? directiveResult.error.reason 
        : directiveResult.error.kind === "MissingRequiredField" 
          ? directiveResult.error.field 
          : "unknown";
      assertStringIncludes(errorMessage, testCase.expectedError);
    }
    
    // LayerType のエラー伝播
    const layerResult = LayerType.createOrError(testCase.result);
    assertEquals(layerResult.ok, false);
    if (!layerResult.ok) {
      const errorMessage = layerResult.error.kind === "InvalidInput" 
        ? layerResult.error.reason 
        : layerResult.error.kind === "MissingRequiredField" 
          ? layerResult.error.field 
          : "unknown";
      assertStringIncludes(errorMessage, testCase.expectedError);
    }
    
    logger.debug("Error propagation tested", {
      testCase: testCase.name,
      directiveError: directiveResult.ok ? "" : 
        directiveResult.error.kind === "InvalidInput" 
          ? directiveResult.error.reason 
          : directiveResult.error.kind === "MissingRequiredField" 
            ? directiveResult.error.field 
            : "unknown",
      layerError: layerResult.ok ? "" : 
        layerResult.error.kind === "InvalidInput" 
          ? layerResult.error.reason 
          : layerResult.error.kind === "MissingRequiredField" 
            ? layerResult.error.field 
            : "unknown"
    });
  }
  
  // 2. パターンマッチングエラーの統合テスト
  const strictPattern = TwoParamsDirectivePattern.createOrError("^(to|summary)$");
  assertEquals(strictPattern.ok, true);
  
  if (strictPattern.ok) {
    const incompatibleResult = createTwoParamsResult("defect", "project");
    
    const patternErrorResult = DirectiveType.createOrError(incompatibleResult, strictPattern.data);
    assertEquals(patternErrorResult.ok, false);
    if (!patternErrorResult.ok) {
      if (patternErrorResult.error.kind === "InvalidInput") {
        assertStringIncludes(patternErrorResult.error.reason, "does not match required pattern");
      }
    }
  }
  
  logger.debug("Error propagation integration test completed", {
    success: true,
    invalidResultsCount: invalidResults.length,
    patternErrorTested: true
  });
});

/**
 * Scenario 6: Performance and Concurrent Access
 * 
 * 複数の DirectiveType と LayerType を同時に作成・操作する性能テスト。
 */
Deno.test("DirectiveType and LayerType Integration: Performance and Concurrency", async () => {
  logger.debug("Starting performance and concurrency integration test");

  const combinations = [
    { directive: "to", layer: "project" },
    { directive: "to", layer: "issue" },
    { directive: "to", layer: "task" },
    { directive: "summary", layer: "project" },
    { directive: "summary", layer: "issue" },
    { directive: "summary", layer: "task" },
    { directive: "defect", layer: "issue" },
    { directive: "defect", layer: "task" }
  ];
  
  // 1. 並行処理でのインスタンス生成
  const startTime = performance.now();
  
  const promises = combinations.map(async (combo, index) => {
    const result = createTwoParamsResult(combo.directive, combo.layer);
    
    const directiveType = DirectiveType.create(result);
    const layerType = LayerType.create(result);
    
    // パス生成の並行実行
    const promptPath = directiveType.getPromptPath(layerType);
    const schemaPath = directiveType.getSchemaPath(layerType);
    const outputPath = directiveType.resolveOutputPath(`input-${index}.md`, layerType);
    
    return {
      index,
      combo,
      directiveType,
      layerType,
      paths: { promptPath, schemaPath, outputPath }
    };
  });
  
  const results = await Promise.all(promises);
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // 2. 結果の検証
  assertEquals(results.length, combinations.length);
  
  for (const result of results) {
    assertEquals(result.directiveType.value, result.combo.directive);
    assertEquals(result.layerType.value, result.combo.layer);
    assertStringIncludes(result.paths.promptPath, result.combo.directive);
    assertStringIncludes(result.paths.promptPath, result.combo.layer);
  }
  
  // 3. 性能の確認（100ms未満を期待）
  const timePerCombination = totalTime / combinations.length;
  assertEquals(timePerCombination < 100, true, `Processing time per combination should be < 100ms, got ${timePerCombination}ms`);
  
  logger.debug("Performance and concurrency integration test completed", {
    success: true,
    combinationsCount: combinations.length,
    totalTimeMs: totalTime,
    timePerCombinationMs: timePerCombination,
    performanceOk: timePerCombination < 100
  });
});