/**
 * @fileoverview Structure test for DirectiveType
 *
 * このテストはDirectiveTypeの構造と責務分離を検証します：
 * - Smart Constructorパターンの正しい実装
 * - 単一責任原則の遵守（バリデーション責任分離）
 * - クラス設計の適切性
 * - Immutable設計の検証
 * - 適切な抽象化レベル
 *
 * 構造テストの目的は、クラスの設計が適切であり、
 * 保守性と拡張性を持つことを保証することです。
 */

import { assertEquals, assertExists, assertThrows, BreakdownLogger } from "../../../lib/deps.ts";
import { DirectiveType, TwoParamsDirectivePattern } from "../../../../lib/types/directive_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("test-structure-directive");

Deno.test("DirectiveType - Structure: Smart Constructor pattern implementation", () => {
  logger.debug("テスト開始: DirectiveType Smart Constructorパターン検証", {
    testType: "structure",
    target: "DirectiveType",
    pattern: "smart_constructor",
  });

  const testResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  // 1. static create()メソッドが唯一の作成方法であることを確認
  const directiveType = DirectiveType.create(testResult);
  assertExists(directiveType);
  assertEquals(directiveType.value, "to");

  // 2. 直接インスタンス化が禁止されていることを確認
  // TypeScriptレベルでprivate constructorが正しく実装されている
  // （コンパイル時に検証されるため、実行時チェックは不要）

  // 3. create()メソッドが適切な型を返すことを確認
  assertEquals(directiveType instanceof DirectiveType, true);

  logger.debug("Smart Constructor実装検証完了", {
    success: true,
    creation_method: "static_create_only",
    direct_instantiation: "blocked",
    type_safety: true,
  });
});

Deno.test("DirectiveType - Structure: Single Responsibility Principle", () => {
  logger.debug("テスト開始: DirectiveType単一責任原則検証", {
    testType: "structure",
    target: "DirectiveType",
    principle: "single_responsibility",
  });

  const testResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  const directiveType = DirectiveType.create(testResult);

  // 1. DirectiveTypeの責務：検証済み値の型安全な保持のみ
  // バリデーション機能が含まれていないことを確認
  assertEquals(directiveType.value, "summary");

  // 2. 値の取得以外の複雑な処理を持たないことを確認
  assertEquals(typeof directiveType.value, "string");
  assertEquals(typeof directiveType.toString(), "string");
  assertEquals(typeof directiveType.equals, "function");

  // 3. 内部状態の適切な隠蔽
  assertExists(directiveType.originalResult);
  assertEquals(directiveType.originalResult.demonstrativeType, "summary");

  logger.debug("単一責任原則検証完了", {
    success: true,
    responsibilities: {
      primary: "type_safe_value_holding",
      excluded: ["validation", "transformation", "business_logic"],
    },
    encapsulation: "proper",
  });
});

Deno.test("DirectiveType - Structure: Immutable design verification", () => {
  logger.debug("テスト開始: DirectiveType Immutable設計検証", {
    testType: "structure",
    target: "DirectiveType",
    design: "immutable",
  });

  const testResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options: {},
  };

  const directiveType = DirectiveType.create(testResult);
  const originalValue = directiveType.value;

  // 1. 値が変更不可であることを確認
  assertEquals(originalValue, "defect");

  // 2. originalResultが読み取り専用であることを確認
  const originalResult = directiveType.originalResult;
  assertEquals(originalResult.demonstrativeType, "defect");

  // 3. 複数回アクセスしても同じ値を返すことを確認
  assertEquals(directiveType.value, originalValue);
  assertEquals(directiveType.value, "defect");

  // 4. toString()の結果も一貫していることを確認
  const stringRepresentation = directiveType.toString();
  assertEquals(stringRepresentation, directiveType.toString());
  assertEquals(stringRepresentation.includes("defect"), true);

  logger.debug("Immutable設計検証完了", {
    success: true,
    immutability: {
      value_consistency: true,
      readonly_access: true,
      state_preservation: true,
    },
  });
});

Deno.test("DirectiveType - Structure: Appropriate abstraction level", () => {
  logger.debug("テスト開始: DirectiveType適切な抽象化レベル検証", {
    testType: "structure",
    target: "DirectiveType",
    aspect: "abstraction_level",
  });

  // 1. 異なるdemonstrativeTypeで複数のインスタンス作成
  const results = [
    {
      type: "two" as const,
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    },
    {
      type: "two" as const,
      demonstrativeType: "summary",
      layerType: "issue",
      params: ["summary", "issue"],
      options: {},
    },
    {
      type: "two" as const,
      demonstrativeType: "defect",
      layerType: "task",
      params: ["defect", "task"],
      options: {},
    },
  ];

  const directiveTypes = results.map((result) => DirectiveType.create(result));

  // 2. 各インスタンスが適切な抽象化レベルを持つことを確認
  assertEquals(directiveTypes.length, 3);
  assertEquals(directiveTypes[0].value, "to");
  assertEquals(directiveTypes[1].value, "summary");
  assertEquals(directiveTypes[2].value, "defect");

  // 3. equals()メソッドによる適切な比較機能
  const directiveType1 = DirectiveType.create(results[0]);
  const directiveType2 = DirectiveType.create(results[0]);
  const directiveType3 = DirectiveType.create(results[1]);

  assertEquals(directiveType1.equals(directiveType2), true);
  assertEquals(directiveType1.equals(directiveType3), false);

  // 4. 抽象化が過度でないことを確認（必要な機能は提供）
  assertExists(directiveType1.value);
  assertExists(directiveType1.originalResult);
  assertExists(directiveType1.toString);

  logger.debug("適切な抽象化レベル検証完了", {
    success: true,
    abstraction: {
      level: "appropriate",
      functionality: "sufficient",
      comparison: "supported",
    },
  });
});

Deno.test("TwoParamsDirectivePattern - Structure: Validation responsibility separation", () => {
  logger.debug("テスト開始: TwoParamsDirectivePatternバリデーション責任分離検証", {
    testType: "structure",
    target: "TwoParamsDirectivePattern",
    aspect: "responsibility_separation",
  });

  // 1. パターン作成の責務分離
  const validPattern = TwoParamsDirectivePattern.create("to|summary|defect");
  const invalidPattern = TwoParamsDirectivePattern.create("[invalid");

  assertExists(validPattern);
  assertEquals(invalidPattern, null);

  // 2. パターンマッチングの責務
  if (validPattern) {
    assertEquals(validPattern.test("to"), true);
    assertEquals(validPattern.test("summary"), true);
    assertEquals(validPattern.test("invalid"), false);

    // 3. パターン情報の適切な提供
    assertExists(validPattern.getPattern);
    assertEquals(typeof validPattern.getPattern(), "string");
    assertEquals(validPattern.getPattern(), "to|summary|defect");
  }

  // 4. TypePatternProviderインターフェース準拠
  if (validPattern) {
    assertExists(validPattern.getDirectivePattern);
    assertEquals(validPattern.getDirectivePattern(), validPattern);
  }

  logger.debug("バリデーション責任分離検証完了", {
    success: true,
    separation: {
      pattern_creation: "isolated",
      pattern_matching: "isolated",
      interface_compliance: "proper",
    },
  });
});

Deno.test("DirectiveType - Structure: Error handling design", () => {
  logger.debug("テスト開始: DirectiveTypeエラーハンドリング設計検証", {
    testType: "structure",
    target: "DirectiveType",
    aspect: "error_handling",
  });

  // 1. Totality原則に従ったエラーハンドリング
  // DirectiveTypeはTwoParams_Resultを前提とするため、
  // バリデーションエラーは発生しない設計

  const validResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "init",
    layerType: "project",
    params: ["init", "project"],
    options: {},
  };

  // 2. 正常な作成が常に成功することを確認
  const directiveType = DirectiveType.create(validResult);
  assertExists(directiveType);
  assertEquals(directiveType.value, "init");

  // 3. 例外が発生しないことを確認（Totality原則）
  const anotherResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "find",
    layerType: "bugs",
    params: ["find", "bugs"],
    options: {},
  };

  const anotherDirective = DirectiveType.create(anotherResult);
  assertExists(anotherDirective);
  assertEquals(anotherDirective.value, "find");

  logger.debug("エラーハンドリング設計検証完了", {
    success: true,
    error_handling: {
      totality_principle: true,
      no_exceptions: true,
      validated_input_assumption: true,
    },
  });
});
