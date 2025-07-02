/**
 * @fileoverview Unit tests for StdinVariableFactory
 *
 * 単体テストは以下を検証します：
 * - 機能の動作検証
 * - 正常系・異常系のテストケース
 * - エッジケースの処理
 * - 実際のユースケースでの動作確認
 *
 * StdinVariableFactoryの全機能が仕様通りに動作することを確認します。
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import {
  defaultStdinVariableFactory,
  StdinFactoryInput,
  StdinVariableFactory,
  StdinVariableFactoryError,
} from "./stdin_variable_factory.ts";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new BreakdownLogger("stdin-variable-_factory-test");

/**
 * 【単体テスト】create()メソッドの正常系テスト
 */
Deno.test("Unit: create() - 正常系テスト", () => {
  _logger.debug("create() 正常系テスト開始");

  const _factory = new StdinVariableFactory();

  // 最小限の有効入力
  const minimalInput: StdinFactoryInput = {
    inputText: "Hello, World!",
  };

  const _result = _factory.create(minimalInput);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const record = _result.data.toRecord();
    assertEquals(record.input_text, "Hello, World!");
    assertEquals(_result.data.name.getValue(), "input_text");
    assertEquals(_result.data.value, "Hello, World!");
  }

  _logger.debug("create() 正常系テスト完了", { success: _result.ok });
});

/**
 * 【単体テスト】create()メソッドの完全入力テスト
 */
Deno.test("Unit: create() - 完全入力テスト", () => {
  _logger.debug("create() 完全入力テスト開始");

  const _factory = new StdinVariableFactory();

  const completeInput: StdinFactoryInput = {
    inputText: "Complete input text",
    source: "cli",
    context: "Test context information",
  };

  const _result = _factory.create(completeInput);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const record = _result.data.toRecord();
    assertEquals(record.input_text, "Complete input text");
  }

  _logger.debug("create() 完全入力テスト完了", { success: _result.ok });
});

/**
 * 【単体テスト】create()メソッドの異常系テスト - NoStdinData
 */
Deno.test("Unit: create() - NoStdinData エラーテスト", () => {
  _logger.debug("create() NoStdinData エラーテスト開始");

  const _factory = new StdinVariableFactory();

  // 空の入力
  const emptyInput: StdinFactoryInput = {};
  const result1 = _factory.create(emptyInput);

  assertEquals(result1.ok, false);
  if (!_result1.ok) {
    assertEquals(result1.error.kind, "NoStdinData");
    if (result1.error.kind === "NoStdinData") {
      assertExists(result1.error.context);
      assertEquals(result1.error.context, "No stdin data provided in factory input");
    }
  }

  // inputText が undefined
  const undefinedInput: StdinFactoryInput = {
    inputText: undefined,
    source: "cli",
  };
  const result2 = _factory.create(undefinedInput);

  assertEquals(result2.ok, false);
  if (!_result2.ok) {
    assertEquals(result2.error.kind, "NoStdinData");
  }

  _logger.debug("create() NoStdinData エラーテスト完了");
});

/**
 * 【単体テスト】create()メソッドの異常系テスト - InvalidStdinSource
 */
Deno.test("Unit: create() - InvalidStdinSource エラーテスト", () => {
  _logger.debug("create() InvalidStdinSource エラーテスト開始");

  const _factory = new StdinVariableFactory();

  const invalidSourceInput: StdinFactoryInput = {
    inputText: "Valid text",
    source: "invalid" as unknown,
  };

  const _result = _factory.create(invalidSourceInput);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidStdinSource");
    assertEquals((_result.error as unknown).source, "invalid");
  }

  _logger.debug("create() InvalidStdinSource エラーテスト完了");
});

/**
 * 【単体テスト】create()メソッドの異常系テスト - VariableError伝播
 */
Deno.test("Unit: create() - VariableError 伝播テスト", () => {
  _logger.debug("create() VariableError 伝播テスト開始");

  const _factory = new StdinVariableFactory();

  // 空文字列はStdinVariable.createでエラーになる
  const emptyTextInput: StdinFactoryInput = {
    inputText: "",
    source: "cli",
  };

  const _result = _factory.create(emptyTextInput);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    // StdinVariable.createから返されるVariableErrorが伝播していることを確認
    assertExists(_result.error.kind);
    // 具体的なエラー種別はStdinVariableの実装に依存
  }

  _logger.debug("create() VariableError 伝播テスト完了");
});

/**
 * 【単体テスト】createFromText()メソッドのテスト
 */
Deno.test("Unit: createFromText() - 機能テスト", () => {
  _logger.debug("createFromText() 機能テスト開始");

  const _factory = new StdinVariableFactory();

  // デフォルトsource
  const result1 = _factory.createFromText("Test text");
  assertEquals(result1.ok, true);
  if (result1.ok) {
    assertEquals(result1.data.value, "Test text");
  }

  // 明示的source指定
  const result2 = _factory.createFromText("Pipe text", "pipe");
  assertEquals(result2.ok, true);
  if (result2.ok) {
    assertEquals(result2.data.value, "Pipe text");
  }

  // エラーケース
  const result3 = _factory.createFromText("");
  assertEquals(result3.ok, false);

  _logger.debug("createFromText() 機能テスト完了");
});

/**
 * 【単体テスト】createBatch()メソッドの正常系テスト
 */
Deno.test("Unit: createBatch() - 正常系テスト", () => {
  _logger.debug("createBatch() 正常系テスト開始");

  const _factory = new StdinVariableFactory();

  const inputs: StdinFactoryInput[] = [
    { inputText: "Input 1", source: "cli" },
    { inputText: "Input 2", source: "pipe" },
    { inputText: "Input 3", source: "file" },
  ];

  const _result = _factory.createBatch(inputs);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 3);
    assertEquals(_result.data[0].value, "Input 1");
    assertEquals(_result.data[1].value, "Input 2");
    assertEquals(_result.data[2].value, "Input 3");
  }

  _logger.debug("createBatch() 正常系テスト完了", { count: inputs.length });
});

/**
 * 【単体テスト】createBatch()メソッドの異常系テスト
 */
Deno.test("Unit: createBatch() - 異常系テスト", () => {
  _logger.debug("createBatch() 異常系テスト開始");

  const _factory = new StdinVariableFactory();

  const inputs: StdinFactoryInput[] = [
    { inputText: "Valid input 1", source: "cli" },
    { inputText: "", source: "pipe" }, // エラーになる
    { inputText: "Valid input 3", source: "file" },
    { inputText: "Valid input 4", source: "invalid" as unknown }, // エラーになる
  ];

  const _result = _factory.createBatch(inputs);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(Array.isArray(_result.error), true);
    assertEquals(_result.error.length, 2); // 2つのエラー
  }

  // 空配列のテスト
  const emptyResult = _factory.createBatch([]);
  assertEquals(emptyResult.ok, true);
  if (emptyResult.ok) {
    assertEquals(emptyResult.data.length, 0);
  }

  _logger.debug("createBatch() 異常系テスト完了");
});

/**
 * 【単体テスト】validate()メソッドのテスト
 */
Deno.test("Unit: validate() - バリデーション機能テスト", () => {
  _logger.debug("validate() バリデーション機能テスト開始");

  const _factory = new StdinVariableFactory();

  // 有効入力のバリデーション
  const validInput: StdinFactoryInput = {
    inputText: "Valid input",
    source: "cli",
  };

  const validResult = _factory.validate(validInput);
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertEquals(validResult.data, undefined);
  }

  // 無効入力のバリデーション
  const invalidInput: StdinFactoryInput = {};

  const invalidResult = _factory.validate(invalidInput);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "NoStdinData");
  }

  _logger.debug("validate() バリデーション機能テスト完了");
});

/**
 * 【単体テスト】エッジケースのテスト
 */
Deno.test("Unit: エッジケース - 特殊文字・長いテキスト", () => {
  _logger.debug("エッジケース テスト開始");

  const _factory = new StdinVariableFactory();

  // 特殊文字を含むテキスト
  const specialCharsInput: StdinFactoryInput = {
    inputText: "Hello\nWorld\t🚀\n改行\tタブ\"引用符'アポストロフィ",
    source: "cli",
  };

  const specialResult = _factory.create(specialCharsInput);
  assertEquals(specialResult.ok, true);
  if (specialResult.ok) {
    assert(specialResult.data.value.includes("🚀"));
    assert(specialResult.data.value.includes("改行"));
  }

  // 非常に長いテキスト
  const longText = "A".repeat(10000);
  const longInput: StdinFactoryInput = {
    inputText: longText,
    source: "file",
  };

  const longResult = _factory.create(longInput);
  assertEquals(longResult.ok, true);
  if (longResult.ok) {
    assertEquals(longResult.data.value.length, 10000);
  }

  // 空白のみのテキスト
  const whitespaceInput: StdinFactoryInput = {
    inputText: "   \n\t   ",
    source: "cli",
  };

  const whitespaceResult = _factory.create(whitespaceInput);
  assertEquals(whitespaceResult.ok, false);
  if (!whitespaceResult.ok) {
    // StdinVariable.createから返されるVariableErrorが伝播していることを確認
    assertExists(whitespaceResult.error.kind);
  }

  _logger.debug("エッジケース テスト完了");
});

/**
 * 【単体テスト】source値の全パターンテスト
 */
Deno.test("Unit: source値 - 全パターンテスト", () => {
  _logger.debug("source値 全パターンテスト開始");

  const _factory = new StdinVariableFactory();
  const testText = "Test input";

  // 有効なsource値のテスト
  const validSources: Array<"cli" | "pipe" | "file"> = ["cli", "pipe", "file"];

  for (const source of validSources) {
    const input: StdinFactoryInput = {
      inputText: testText,
      source: source,
    };

    const _result = _factory.create(input);
    assertEquals(_result.ok, true, `source: ${source} で成功すべき`);
    if (_result.ok) {
      assertEquals(_result.data.value, testText);
    }
  }

  // source省略のテスト
  const noSourceInput: StdinFactoryInput = {
    inputText: testText,
  };

  const noSourceResult = _factory.create(noSourceInput);
  assertEquals(noSourceResult.ok, true);
  if (noSourceResult.ok) {
    assertEquals(noSourceResult.data.value, testText);
  }

  _logger.debug("source値 全パターンテスト完了");
});

/**
 * 【単体テスト】defaultStdinVariableFactoryのテスト
 */
Deno.test("Unit: defaultStdinVariableFactory - デフォルトインスタンス機能テスト", () => {
  _logger.debug("defaultStdinVariableFactory 機能テスト開始");

  // デフォルトインスタンスの基本機能確認
  const _result = defaultStdinVariableFactory.create({
    inputText: "Default factory test",
    source: "cli",
  });

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.value, "Default factory test");
    assertEquals(_result.data.name.getValue(), "input_text");
  }

  // 他のメソッドも正常に動作することを確認
  const fromTextResult = defaultStdinVariableFactory.createFromText("From text test");
  assertEquals(fromTextResult.ok, true);

  const validateResult = defaultStdinVariableFactory.validate({
    inputText: "Validate test",
  });
  assertEquals(validateResult.ok, true);

  _logger.debug("defaultStdinVariableFactory 機能テスト完了");
});

/**
 * 【単体テスト】実用的なユースケーステスト
 */
Deno.test("Unit: 実用ユースケース - CLIパイプライン処理", () => {
  _logger.debug("実用ユースケース テスト開始");

  const _factory = new StdinVariableFactory();

  // CLI入力の処理
  const cliInput: StdinFactoryInput = {
    inputText: "echo 'Hello, World!' | breakdown process",
    source: "cli",
    context: "CLI command execution",
  };

  const cliResult = _factory.create(cliInput);
  assertEquals(cliResult.ok, true);

  // パイプ入力の処理
  const pipeInput: StdinFactoryInput = {
    inputText: "File content from stdin pipe",
    source: "pipe",
    context: "Piped from another command",
  };

  const pipeResult = _factory.create(pipeInput);
  assertEquals(pipeResult.ok, true);

  // ファイルからの入力処理
  const fileInput: StdinFactoryInput = {
    inputText: "Content read from file and passed as stdin",
    source: "file",
    context: "File redirection to stdin",
  };

  const fileResult = _factory.create(fileInput);
  assertEquals(fileResult.ok, true);

  // 複数入力のバッチ処理（実際のワークフロー）
  const batchInputs = [cliInput, pipeInput, fileInput];
  const batchResult = _factory.createBatch(batchInputs);

  assertEquals(batchResult.ok, true);
  if (batchResult.ok) {
    assertEquals(batchResult.data.length, 3);

    // 各結果が適切なRecord形式になることを確認
    for (const variable of batchResult.data) {
      const record = variable.toRecord();
      assertExists(record.input_text);
      assertEquals(typeof record.input_text, "string");
    }
  }

  _logger.debug("実用ユースケース テスト完了");
});
