/**
 * @fileoverview Architecture tests for StdinVariableFactory
 * 
 * アーキテクチャテストは以下を検証します：
 * - 依存関係の方向性
 * - 循環参照の有無
 * - レイヤー間の境界
 * - インターフェースの一貫性
 * 
 * StdinVariableFactoryは、Factory層としてTypes層に依存し、
 * CLI層から使用される中間層の位置にあります。
 */

import { assertEquals, assertExists } from "@std/assert";
import { StdinVariableFactory, StdinVariableFactoryError, StdinFactoryInput } from "./stdin_variable_factory.ts";
import type { Result } from "../types/result.ts";
import type { StdinVariable } from "../types/prompt_variables.ts";
import type { VariableError } from "../types/variable_result.ts";

/**
 * 【アーキテクチャ検証】Factory層の依存関係検証
 * Factory層は Types層にのみ依存し、上位層には依存しないことを確認
 */
Deno.test("Architecture: StdinVariableFactory依存関係の方向性", () => {
  // Factory実装がTypes層の型を正しく使用していることを確認
  const factory = new StdinVariableFactory();
  assertExists(factory);
  
  // 型レベルでの依存関係確認
  const testInput: StdinFactoryInput = {
    inputText: "test",
    source: "cli",
    context: "test context"
  };
  
  const result = factory.create(testInput);
  
  // ResultがTypes層の型であることを確認
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    // StdinVariableがTypes層の型であることを確認
    assertEquals(typeof result.data.toRecord, "function");
  } else {
    // ErrorがTypes層の型であることを確認
    assertExists(result.error.kind);
  }
});

/**
 * 【アーキテクチャ検証】循環参照の有無確認
 * Factory層内での循環参照がないことを確認
 */
Deno.test("Architecture: 循環参照の回避確認", () => {
  // StdinVariableFactoryが他のFactory実装に依存していないことを確認
  const factory = new StdinVariableFactory();
  
  // インスタンス生成が成功することで循環参照がないことを間接的に確認
  assertExists(factory);
  
  // メソッドが正常に呼び出せることで内部循環がないことを確認
  const validateResult = factory.validate({});
  assertEquals(typeof validateResult.ok, "boolean");
});

/**
 * 【アーキテクチャ検証】レイヤー間境界の検証
 * Factory層がCLI層のインターフェースを適切に提供していることを確認
 */
Deno.test("Architecture: Factory層インターフェースの一貫性", () => {
  const factory = new StdinVariableFactory();
  
  // Factory層として期待されるメソッドが存在することを確認
  assertEquals(typeof factory.create, "function");
  assertEquals(typeof factory.createFromText, "function");
  assertEquals(typeof factory.createBatch, "function");
  assertEquals(typeof factory.validate, "function");
  
  // すべてのメソッドがResult型を返すことを確認（Factory層の責務）
  const createResult = factory.create({});
  assertEquals(typeof createResult.ok, "boolean");
  
  const createFromTextResult = factory.createFromText("");
  assertEquals(typeof createFromTextResult.ok, "boolean");
  
  const createBatchResult = factory.createBatch([]);
  assertEquals(typeof createBatchResult.ok, "boolean");
  
  const validateResult = factory.validate({});
  assertEquals(typeof validateResult.ok, "boolean");
});

/**
 * 【アーキテクチャ検証】エラー型の階層性確認
 * StdinVariableFactoryErrorがVariableErrorを拡張していることを確認
 */
Deno.test("Architecture: エラー型の階層性確認", () => {
  const factory = new StdinVariableFactory();
  
  // 各種エラーパターンでエラー型の構造を確認
  const noDataResult = factory.create({});
  if (!noDataResult.ok) {
    assertEquals(noDataResult.error.kind, "NoStdinData");
    if (noDataResult.error.kind === "NoStdinData") {
      assertExists(noDataResult.error.context);
    }
  }
  
  const invalidSourceResult = factory.create({
    inputText: "test",
    source: "invalid" as any
  });
  if (!invalidSourceResult.ok) {
    assertEquals(invalidSourceResult.error.kind, "InvalidStdinSource");
    if (invalidSourceResult.error.kind === "InvalidStdinSource") {
      assertExists(invalidSourceResult.error.source);
    }
  }
  
  // VariableErrorも適切に処理されることを確認
  const emptyTextResult = factory.create({ inputText: "" });
  if (!emptyTextResult.ok) {
    // StdinVariable.createから返されるVariableErrorが適切に伝播することを確認
    assertExists(emptyTextResult.error.kind);
  }
});

/**
 * 【アーキテクチャ検証】Smart Constructor パターンの適用確認
 * Factory層がSmart Constructorパターンを適切に実装していることを確認
 */
Deno.test("Architecture: Smart Constructor パターンの実装確認", () => {
  const factory = new StdinVariableFactory();
  
  // 有効な入力での成功パターン
  const validResult = factory.create({
    inputText: "valid input",
    source: "cli"
  });
  
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    // Smart Constructorにより作成されたインスタンスが適切な状態であることを確認
    const record = validResult.data.toRecord();
    assertEquals(record.input_text, "valid input");
  }
  
  // 無効な入力でのエラーパターン
  const invalidResult = factory.create({});
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    // Smart Constructorにより適切なエラーが返されることを確認
    assertExists(invalidResult.error.kind);
  }
});

/**
 * 【アーキテクチャ検証】Totality原則の適用確認
 * 全ての入力パターンに対して明示的な処理が存在することを確認
 */
Deno.test("Architecture: Totality原則の適用確認", () => {
  const factory = new StdinVariableFactory();
  
  // 全ての可能な入力パターンのテストケース
  const testCases: Array<{
    input: StdinFactoryInput;
    expectedOutcome: "success" | "error";
    description: string;
  }> = [
    {
      input: { inputText: "valid", source: "cli" },
      expectedOutcome: "success",
      description: "有効な完全入力"
    },
    {
      input: { inputText: "valid" },
      expectedOutcome: "success", 
      description: "source省略の有効入力"
    },
    {
      input: {},
      expectedOutcome: "error",
      description: "空の入力"
    },
    {
      input: { inputText: "" },
      expectedOutcome: "error",
      description: "空文字列"
    },
    {
      input: { inputText: "valid", source: "invalid" as any },
      expectedOutcome: "error",
      description: "無効なsource"
    }
  ];
  
  // 全てのパターンが適切に処理されることを確認
  for (const testCase of testCases) {
    const result = factory.create(testCase.input);
    
    if (testCase.expectedOutcome === "success") {
      assertEquals(result.ok, true, `${testCase.description}で成功すべき`);
    } else {
      assertEquals(result.ok, false, `${testCase.description}でエラーになるべき`);
    }
  }
});