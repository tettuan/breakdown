/**
 * @fileoverview Structure tests for StdinVariableFactory
 *
 * 構造テストは以下を検証します：
 * - 単一責任の原則の遵守
 * - 責務の重複の有無
 * - 適切な抽象化レベル
 * - クラス間の関係性
 *
 * StdinVariableFactoryの構造的な責務分離と
 * 各メソッドの責任範囲が適切であることを確認します。
 */

import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import {
  defaultStdinVariableFactory,
  StdinFactoryInput,
  StdinVariableFactory,
  StdinVariableFactoryError,
} from "./stdin_variable_factory.ts";

/**
 * 【構造検証】単一責任の原則の遵守確認
 * StdinVariableFactoryが「StdinVariable作成」という単一の責任のみを持つことを確認
 */
Deno.test("Structure: 単一責任の原則 - StdinVariable作成責務のみ", () => {
  const _factory = new StdinVariableFactory();

  // Factory が持つべき責務のみを持つことを確認
  const factoryMethods = Object.getOwnPropertyNames(StdinVariableFactory.prototype);
  const expectedMethods = [
    "constructor",
    "create",
    "createFromText",
    "createBatch",
    "validate",
  ];

  // 期待されるメソッドのみが存在することを確認
  for (const method of expectedMethods) {
    assertEquals(factoryMethods.includes(method), true, `必須メソッド ${method} が存在すべき`);
  }

  // 責務範囲外のメソッドが存在しないことを確認
  const unexpectedMethods = factoryMethods.filter((method) => !expectedMethods.includes(method));
  assertEquals(
    unexpectedMethods.length,
    0,
    `不要なメソッド ${unexpectedMethods.join(", ")} が存在している`,
  );
});

/**
 * 【構造検証】責務の重複回避確認
 * 各メソッドが異なる責務を持ち、重複がないことを確認
 */
Deno.test("Structure: 責務の重複回避 - メソッド間の明確な分離", () => {
  const _factory = new StdinVariableFactory();

  // create(): 基本的な作成責務
  const createResult = _factory.create({ inputText: "test" });
  assertExists(createResult);

  // createFromText(): テキストからの直接作成責務
  const createFromTextResult = _factory.createFromText("test");
  assertExists(createFromTextResult);

  // createBatch(): バッチ処理責務
  const createBatchResult = _factory.createBatch([{ inputText: "test" }]);
  assertExists(createBatchResult);

  // validate(): バリデーション専用責務
  const validateResult = _factory.validate({ inputText: "test" });
  assertExists(validateResult);

  // 各メソッドが異なる入力形式を受け入れることで責務が分離されていることを確認
  assertEquals(typeof _factory.create, "function");
  assertEquals(typeof _factory.createFromText, "function");
  assertEquals(typeof _factory.createBatch, "function");
  assertEquals(typeof _factory.validate, "function");
});

/**
 * 【構造検証】適切な抽象化レベルの確認
 * Factory層として適切な抽象化レベルを維持していることを確認
 */
Deno.test("Structure: 適切な抽象化レベル - Factory層の責務範囲", () => {
  const _factory = new StdinVariableFactory();

  // 低レベル操作（Types層の直接操作）を隠蔽していることを確認
  const input: StdinFactoryInput = {
    inputText: "test input",
    source: "cli",
    context: "test context",
  };

  const result = _factory.create(input);

  // Factory層の抽象化により、利用者は内部実装を知る必要がないことを確認
  if (result.ok) {
    // 結果がStdinVariableとして適切に抽象化されていることを確認
    const record = result.data.toRecord();
    assertEquals(record.input_text, "test input");

    // Factory層が適切にTypes層を隠蔽していることを確認
    assertExists(result.data.name);
    assertExists(result.data.value);
  }

  // エラー処理も適切に抽象化されていることを確認
  const errorResult = _factory.create({});
  if (!errorResult.ok) {
    assertExists(errorResult.error.kind);
    // Factory層のエラーとして適切に抽象化されていることを確認
  }
});

/**
 * 【構造検証】入力バリデーションの構造確認
 * 入力検証が適切な段階で行われていることを確認
 */
Deno.test("Structure: 入力バリデーション構造 - 段階的検証", () => {
  const _factory = new StdinVariableFactory();

  // 第1段階: Factory層でのnull/undefined検証
  const noInputResult = _factory.create({});
  assertEquals(noInputResult.ok, false);
  if (!noInputResult.ok) {
    assertEquals(noInputResult.error.kind, "NoStdinData");
  }

  // 第2段階: Factory層での形式検証
  const invalidSourceResult = _factory.create({
    inputText: "test",
    source: "invalid" as any,
  });
  assertEquals(invalidSourceResult.ok, false);
  if (!invalidSourceResult.ok) {
    assertEquals(invalidSourceResult.error.kind, "InvalidStdinSource");
  }

  // 第3段階: Types層への移譲と結果の処理
  const emptyTextResult = _factory.create({ inputText: "" });
  assertEquals(emptyTextResult.ok, false);
  // この段階のエラーはStdinVariable.createから返される

  // 段階的検証により適切なエラー分類がされていることを確認
  if (!noInputResult.ok && !invalidSourceResult.ok) {
    assertNotEquals(noInputResult.error, invalidSourceResult.error);
  }
  if (!noInputResult.ok && !emptyTextResult.ok) {
    // Debug: log the actual error objects to understand why they're equal
    console.log("noInputResult.error:", JSON.stringify(noInputResult.error));
    console.log("emptyTextResult.error:", JSON.stringify(emptyTextResult.error));
    assertNotEquals(noInputResult.error, emptyTextResult.error);
  }
});

/**
 * 【構造検証】バッチ処理の構造確認
 * バッチ処理が単一処理の適切な集約であることを確認
 */
Deno.test("Structure: バッチ処理構造 - 単一処理の集約", () => {
  const _factory = new StdinVariableFactory();

  const inputs: StdinFactoryInput[] = [
    { inputText: "input1", source: "cli" },
    { inputText: "input2", source: "pipe" },
    { inputText: "", source: "file" }, // この入力はエラーになる
    { inputText: "input4", source: "cli" },
  ];

  const batchResult = _factory.createBatch(inputs);

  // バッチ処理がエラーを含む場合のエラー集約確認
  assertEquals(batchResult.ok, false);
  if (!batchResult.ok) {
    assertEquals(Array.isArray(batchResult.error), true);
    assertEquals(batchResult.error.length, 1); // 1つのエラー入力
  }

  // 成功のみのバッチ処理確認
  const validInputs: StdinFactoryInput[] = [
    { inputText: "input1", source: "cli" },
    { inputText: "input2", source: "pipe" },
  ];

  const validBatchResult = _factory.createBatch(validInputs);
  assertEquals(validBatchResult.ok, true);
  if (validBatchResult.ok) {
    assertEquals(validBatchResult.data.length, 2);
  }
});

/**
 * 【構造検証】便利メソッドの構造確認
 * createFromTextが基本メソッドの適切なラッパーであることを確認
 */
Deno.test("Structure: 便利メソッド構造 - 基本メソッドのラッパー", () => {
  const _factory = new StdinVariableFactory();

  const text = "test input";
  const source = "cli";

  // createFromTextの結果
  const fromTextResult = _factory.createFromText(text, source);

  // 同等のcreate呼び出しの結果
  const createResult = _factory.create({
    inputText: text,
    source: source,
    context: `Direct text input from ${source}`,
  });

  // 両方の結果が同等であることを確認
  assertEquals(fromTextResult.ok, createResult.ok);

  if (fromTextResult.ok && createResult.ok) {
    assertEquals(fromTextResult.data.toRecord(), createResult.data.toRecord());
  }

  if (!fromTextResult.ok && !createResult.ok) {
    assertEquals(fromTextResult.error.kind, createResult.error.kind);
  }
});

/**
 * 【構造検証】デフォルトインスタンスの構造確認
 * defaultStdinVariableFactoryが適切なシングルトンパターンであることを確認
 */
Deno.test("Structure: デフォルトインスタンス構造 - シングルトンパターン", () => {
  // デフォルトインスタンスが存在することを確認
  assertExists(defaultStdinVariableFactory);

  // デフォルトインスタンスがStdinVariableFactoryのインスタンスであることを確認
  assertEquals(defaultStdinVariableFactory instanceof StdinVariableFactory, true);

  // デフォルトインスタンスが期待されるメソッドを持つことを確認
  assertEquals(typeof defaultStdinVariableFactory.create, "function");
  assertEquals(typeof defaultStdinVariableFactory.createFromText, "function");
  assertEquals(typeof defaultStdinVariableFactory.createBatch, "function");
  assertEquals(typeof defaultStdinVariableFactory.validate, "function");

  // デフォルトインスタンスが正常に動作することを確認
  const result = defaultStdinVariableFactory.create({ inputText: "test" });
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
});

/**
 * 【構造検証】エラー型の構造確認
 * StdinVariableFactoryErrorが適切な構造を持つことを確認
 */
Deno.test("Structure: エラー型構造 - 階層的エラー定義", () => {
  const _factory = new StdinVariableFactory();

  // Factory固有エラーの構造確認
  const noDataResult = _factory.create({});
  if (!noDataResult.ok) {
    assertEquals(noDataResult.error.kind, "NoStdinData");
    if (noDataResult.error.kind === "NoStdinData") {
      assertExists(noDataResult.error.context);
      assertEquals(typeof noDataResult.error.context, "string");
    }
  }

  const invalidSourceResult = _factory.create({
    inputText: "test",
    source: "invalid" as any,
  });
  if (!invalidSourceResult.ok) {
    assertEquals(invalidSourceResult.error.kind, "InvalidStdinSource");
    assertExists((invalidSourceResult.error as any).source);
    assertEquals(typeof (invalidSourceResult.error as any).source, "string");
  }

  // Types層エラーの伝播構造確認
  const emptyTextResult = _factory.create({ inputText: "" });
  if (!emptyTextResult.ok) {
    // StdinVariable.createから返されるVariableErrorが適切に構造化されていることを確認
    assertExists(emptyTextResult.error.kind);
    // 具体的なエラー種別はVariableError由来
  }
});
