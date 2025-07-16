/**
 * @fileoverview Core Flow E2E Test - Tier 1 基本機能シナリオ
 * 
 * CLI引数解析からプロンプト生成まで全工程をカバーする基本的なE2Eテスト。
 * 最小限の正常系動作を検証し、全ドメインの統合動作を確認する。
 * 
 * @module tests/4_cross_domain/e2e/core_flow_e2e
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// 各ドメインのコンポーネントをインポート
import { DirectiveType } from "../../../lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../../lib/domain/core/value_objects/layer_type.ts";
import { createTwoParamsResult } from "../../../lib/types/two_params_result_extension.ts";

const logger = new BreakdownLogger("e2e:core_flow");

/**
 * S1.1: 基本コマンド実行シナリオ
 * 
 * `breakdown to project sample.md` に相当する処理フローを検証
 * 
 * 検証項目:
 * 1. CLI引数の解析（BreakdownParams模擬）
 * 2. DirectiveType, LayerType の生成
 * 3. パス解決（プロンプト・スキーマファイル）
 * 4. 変数生成と置換
 * 5. 最終プロンプト出力
 */
Deno.test("E2E Core Flow: S1.1 - Basic Command Execution (to project)", async () => {
  logger.debug("Starting basic command execution E2E test", {
    scenario: "S1.1",
    command: "breakdown to project sample.md",
    workflow: "full_pipeline"
  });

  // Phase 1: CLI引数解析シミュレーション
  const cliArgs = ["to", "project", "sample.md"];
  logger.debug("Phase 1: CLI argument parsing", { args: cliArgs });
  
  // BreakdownParams 相当の処理結果をシミュレート
  const twoParamsResult = createTwoParamsResult(cliArgs[0], cliArgs[1]);
  const inputFile = cliArgs[2];
  
  assertEquals(twoParamsResult.type, "two");
  assertEquals(twoParamsResult.directiveType, "to");
  assertEquals(twoParamsResult.layerType, "project");
  assertEquals(twoParamsResult.params, ["to", "project"]);

  // Phase 2: 型安全変換
  logger.debug("Phase 2: Type-safe conversion");
  
  const directiveType = DirectiveType.create(twoParamsResult);
  const layerTypeResult = LayerType.create(twoParamsResult);
  
  assertEquals(directiveType.value, "to");
  assertEquals(layerTypeResult.ok, true);
  if (!layerTypeResult.ok) throw new Error("LayerType creation failed");
  const layerType = layerTypeResult.data;
  assertEquals(layerType.value, "project");
  
  // 型の整合性確認
  assertEquals(directiveType.equals(DirectiveType.create(twoParamsResult)), true);
  const layerTypeResult2 = LayerType.create(twoParamsResult);
  assertEquals(layerTypeResult2.ok, true);
  if (!layerTypeResult2.ok) throw new Error("LayerType2 creation failed");
  assertEquals(layerType.equals(layerTypeResult2.data), true);

  // Phase 3: パス解決
  logger.debug("Phase 3: Path resolution");
  
  const promptPath = directiveType.getPromptPath(layerType);
  const schemaPath = directiveType.getSchemaPath(layerType);
  const outputPath = directiveType.resolveOutputPath(inputFile, layerType);
  
  assertEquals(promptPath, "prompts/to/project/f_project.md");
  assertEquals(schemaPath, "schema/to/project/base.schema.md");
  assertStringIncludes(outputPath, "output/to/project");
  assertStringIncludes(outputPath, "sample.md");

  // Phase 4: 変数生成シミュレーション
  logger.debug("Phase 4: Variable generation simulation");
  
  const promptVariables = {
    input: inputFile,
    output: outputPath,
    directive: directiveType.value,
    layer: layerType.value,
    timestamp: new Date().toISOString(),
    schema_path: schemaPath
  };
  
  // 必要な変数が全て生成されていることを確認
  assertEquals(typeof promptVariables.input, "string");
  assertEquals(typeof promptVariables.output, "string");
  assertEquals(typeof promptVariables.directive, "string");
  assertEquals(typeof promptVariables.layer, "string");
  assertEquals(typeof promptVariables.timestamp, "string");
  assertEquals(typeof promptVariables.schema_path, "string");

  // Phase 5: プロンプト生成シミュレーション
  logger.debug("Phase 5: Prompt generation simulation");
  
  // テンプレート文字列（実際のプロンプトテンプレートから読み込まれる想定）
  const templateContent = `
# Project Analysis Prompt

## Input
File: \${input}

## Task
Convert the project documentation to structured format.

## Output
Generate result to: \${output}

## Schema Reference
Use schema: \${schema_path}

## Processing Details
- Directive: \${directive}
- Layer: \${layer}
- Timestamp: \${timestamp}
`;

  // 変数置換の実行
  let finalPrompt = templateContent;
  for (const [key, value] of Object.entries(promptVariables)) {
    finalPrompt = finalPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  
  // 最終プロンプトの検証
  assertStringIncludes(finalPrompt, inputFile);
  assertStringIncludes(finalPrompt, outputPath);
  assertStringIncludes(finalPrompt, "to");
  assertStringIncludes(finalPrompt, "project");
  assertStringIncludes(finalPrompt, schemaPath);
  
  // テンプレート変数がすべて置換されていることを確認
  assertEquals(finalPrompt.includes("${"), false, "All template variables should be replaced");

  // Phase 6: 出力処理
  logger.debug("Phase 6: Output processing");
  
  const result = {
    success: true,
    prompt: finalPrompt,
    metadata: {
      directive: directiveType.value,
      layer: layerType.value,
      inputFile,
      outputPath,
      promptPath,
      schemaPath,
      variableCount: Object.keys(promptVariables).length,
      promptLength: finalPrompt.length
    }
  };
  
  assertEquals(result.success, true);
  assertEquals(result.metadata.directive, "to");
  assertEquals(result.metadata.layer, "project");
  assertEquals(result.metadata.variableCount, 6);
  assertEquals(result.metadata.promptLength > 0, true);

  logger.debug("E2E Core Flow test completed successfully", {
    scenario: "S1.1",
    success: true,
    phases: 6,
    metadata: result.metadata
  });
});

/**
 * S1.2: 異なる組み合わせシナリオ
 * 
 * 複数のDirectiveType-LayerType組み合わせでの処理フローを検証
 */
Deno.test("E2E Core Flow: S1.2 - Different Combinations", async () => {
  logger.debug("Starting different combinations E2E test", {
    scenario: "S1.2"
  });

  const testCombinations = [
    { 
      directive: "summary", 
      layer: "issue", 
      input: "bug-report.md",
      expectedPromptPath: "prompts/summary/issue/f_issue.md",
      expectedSchemaPath: "schema/summary/issue/base.schema.md"
    },
    { 
      directive: "defect", 
      layer: "task", 
      input: "error-analysis.md",
      expectedPromptPath: "prompts/defect/task/f_task.md",
      expectedSchemaPath: "schema/defect/task/base.schema.md"
    },
    {
      directive: "to",
      layer: "issue",
      input: "feature-request.md", 
      expectedPromptPath: "prompts/to/issue/f_issue.md",
      expectedSchemaPath: "schema/to/issue/base.schema.md"
    }
  ];

  for (const combo of testCombinations) {
    logger.debug("Testing combination", combo);
    
    // E2E処理の実行
    const twoParamsResult = createTwoParamsResult(combo.directive, combo.layer);
    const directiveType = DirectiveType.create(twoParamsResult);
    const layerType = LayerType.create(twoParamsResult);
    
    // パス解決の検証
    const promptPath = directiveType.getPromptPath(layerType);
    const schemaPath = directiveType.getSchemaPath(layerType);
    const outputPath = directiveType.resolveOutputPath(combo.input, layerType);
    
    assertEquals(promptPath, combo.expectedPromptPath);
    assertEquals(schemaPath, combo.expectedSchemaPath);
    
    // LayerTypeの組み合わせ妥当性確認
    const isValidCombination = layerType.isValidForDirective(combo.directive);
    assertEquals(isValidCombination, true, `${combo.layer} should be valid for ${combo.directive}`);
    
    // 出力パス構造の確認
    assertStringIncludes(outputPath, `output/${combo.directive}/${combo.layer}`);
    assertStringIncludes(outputPath, combo.input);
    
    logger.debug("Combination test completed", {
      directive: combo.directive,
      layer: combo.layer,
      promptPath,
      schemaPath,
      valid: isValidCombination
    });
  }

  logger.debug("Different combinations E2E test completed", {
    scenario: "S1.2",
    combinationsCount: testCombinations.length,
    allValid: true
  });
});

/**
 * S1.3: STDIN入力処理シミュレーション
 * 
 * `echo "content" | breakdown to project` 相当の処理を検証
 */
Deno.test("E2E Core Flow: S1.3 - STDIN Input Processing", async () => {
  logger.debug("Starting STDIN input processing E2E test", {
    scenario: "S1.3"
  });

  // STDIN入力をシミュレート
  const stdinContent = "# Project Overview\n\nThis is a sample project documentation.";
  const cliArgs = ["to", "project"]; // ファイル指定なし
  
  // Phase 1: STDIN検出とCLI引数解析
  const twoParamsResult = createTwoParamsResult(cliArgs[0], cliArgs[1]);
  const directiveType = DirectiveType.create(twoParamsResult);
  const layerType = LayerType.create(twoParamsResult);
  
  assertEquals(directiveType.value, "to");
  assertEquals(layerType.value, "project");
  
  // Phase 2: STDIN入力の処理
  const hasStdinInput = stdinContent.length > 0;
  assertEquals(hasStdinInput, true);
  
  // Phase 3: 変数生成（STDIN用）
  const outputPath = directiveType.resolveOutputPath("", layerType); // 空文字で自動生成
  
  const promptVariables = {
    input: "STDIN", // STDIN入力を示すマーカー
    input_content: stdinContent,
    output: outputPath,
    directive: directiveType.value,
    layer: layerType.value,
    timestamp: new Date().toISOString(),
    schema_path: directiveType.getSchemaPath(layerType)
  };
  
  // Phase 4: プロンプト生成（STDIN対応テンプレート）
  const stdinTemplate = `
# Project Analysis from STDIN

## Input Source
Source: \${input}

## Input Content
\${input_content}

## Task
Convert the input content to \${layer} level \${directive} format.

## Output
Generate result to: \${output}

## Processing timestamp
\${timestamp}
`;

  let finalPrompt = stdinTemplate;
  for (const [key, value] of Object.entries(promptVariables)) {
    finalPrompt = finalPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  
  // 検証
  assertStringIncludes(finalPrompt, "STDIN");
  assertStringIncludes(finalPrompt, stdinContent);
  assertStringIncludes(finalPrompt, outputPath);
  assertStringIncludes(finalPrompt, "project");
  assertStringIncludes(finalPrompt, "to");
  
  // 自動生成された出力パスの形式確認
  assertStringIncludes(outputPath, "output/to/project/");
  assertStringIncludes(outputPath, ".md");
  
  // STDIN処理の完了確認
  const result = {
    success: true,
    hasStdinInput: true,
    contentLength: stdinContent.length,
    promptGenerated: finalPrompt.length > 0,
    outputPathGenerated: outputPath.length > 0
  };
  
  assertEquals(result.success, true);
  assertEquals(result.hasStdinInput, true);
  assertEquals(result.contentLength > 0, true);
  assertEquals(result.promptGenerated, true);
  assertEquals(result.outputPathGenerated, true);

  logger.debug("STDIN input processing E2E test completed", {
    scenario: "S1.3",
    success: true,
    stdinContentLength: stdinContent.length,
    outputPath,
    promptLength: finalPrompt.length
  });
});

/**
 * S1.4: パフォーマンス基本測定
 * 
 * 基本的なE2E処理のパフォーマンス特性を測定
 */
Deno.test("E2E Core Flow: S1.4 - Basic Performance Measurement", async () => {
  logger.debug("Starting basic performance measurement", {
    scenario: "S1.4"
  });

  const testIterations = 10;
  const performanceMetrics = [];
  
  for (let i = 0; i < testIterations; i++) {
    const startTime = performance.now();
    
    // 完全なE2E処理を実行
    const twoParamsResult = createTwoParamsResult("to", "project");
    const directiveType = DirectiveType.create(twoParamsResult);
    const layerType = LayerType.create(twoParamsResult);
    
    const promptPath = directiveType.getPromptPath(layerType);
    const schemaPath = directiveType.getSchemaPath(layerType);
    const outputPath = directiveType.resolveOutputPath(`test-${i}.md`, layerType);
    
    const promptVariables = {
      input: `test-${i}.md`,
      output: outputPath,
      directive: directiveType.value,
      layer: layerType.value,
      timestamp: new Date().toISOString(),
      schema_path: schemaPath
    };
    
    // プロンプト生成
    const template = "Input: ${input}, Output: ${output}, Type: ${directive}-${layer}";
    let prompt = template;
    for (const [key, value] of Object.entries(promptVariables)) {
      prompt = prompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMetrics.push(duration);
    
    // 基本的な結果検証
    assertEquals(directiveType.value, "to");
    assertEquals(layerType.value, "project");
    assertEquals(prompt.includes("${"), false);
  }
  
  // パフォーマンス統計
  const avgDuration = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
  const maxDuration = Math.max(...performanceMetrics);
  const minDuration = Math.min(...performanceMetrics);
  
  // パフォーマンス要件の確認（10ms未満を期待）
  assertEquals(avgDuration < 10, true, `Average duration should be < 10ms, got ${avgDuration.toFixed(2)}ms`);
  assertEquals(maxDuration < 50, true, `Max duration should be < 50ms, got ${maxDuration.toFixed(2)}ms`);
  
  logger.debug("Basic performance measurement completed", {
    scenario: "S1.4",
    iterations: testIterations,
    avgDurationMs: avgDuration.toFixed(2),
    maxDurationMs: maxDuration.toFixed(2),
    minDurationMs: minDuration.toFixed(2),
    performanceOk: avgDuration < 10
  });
});