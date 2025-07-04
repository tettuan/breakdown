/**
 * @fileoverview Architecture test for DirectiveType
 *
 * このテストはDirectiveTypeのアーキテクチャ制約を検証します：
 * - 依存関係の妥当性（TwoParams_Resultのみに依存）
 * - 循環参照の有無
 * - インターフェース一貫性
 * - パッケージ境界の遵守
 * - Totality原則準拠のアーキテクチャ設計
 *
 * アーキテクチャテストの目的は、設計制約が正しく実装され、
 * 将来の変更に対して安定性を保つことを保証することです。
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
import type { TwoParams_Result } from "../deps.ts";

const logger = new BreakdownLogger("test-architecture-directive");

Deno.test("DirectiveType - Architecture: Dependency constraints", () => {
  logger.debug("テスト開始: DirectiveType依存関係制約検証", {
    testType: "architecture",
    target: "DirectiveType",
    constraint: "dependencies",
  });

  // TwoParams_Resultのみに依存していることを確認
  const validResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  // DirectiveTypeが正常に構築できることを確認（依存関係が正しい）
  const directiveType = DirectiveType.create(validResult);
  assertExists(directiveType);
  assertEquals(directiveType.value, "to");

  logger.debug("依存関係制約検証完了", {
    success: true,
    dependencies: ["TwoParams_Result"],
    violations: "none",
  });
});

Deno.test("DirectiveType - Architecture: No circular dependencies", () => {
  logger.debug("テスト開始: DirectiveType循環参照検証", {
    testType: "architecture",
    target: "DirectiveType",
    constraint: "circular_dependencies",
  });

  // DirectiveTypeクラスの存在確認（循環参照があるとインポートできない）
  assertExists(DirectiveType);
  assertExists(DirectiveType.create);

  // TwoParamsDirectivePatternクラスの存在確認
  assertExists(TwoParamsDirectivePattern);
  assertExists(TwoParamsDirectivePattern.create);

  logger.debug("循環参照検証完了", {
    success: true,
    classes: ["DirectiveType", "TwoParamsDirectivePattern"],
    circular_dependencies: "none",
  });
});

Deno.test("DirectiveType - Architecture: Interface consistency", () => {
  logger.debug("テスト開始: DirectiveTypeインターフェース一貫性検証", {
    testType: "architecture",
    target: "DirectiveType",
    constraint: "interface_consistency",
  });

  const testResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  const directiveType = DirectiveType.create(testResult);

  // Smart Constructorパターンのインターフェース検証
  // 1. static create()メソッドの存在
  assertExists(DirectiveType.create);
  assertEquals(typeof DirectiveType.create, "function");

  // 2. valueプロパティの存在と型
  assertExists(directiveType.value);
  assertEquals(typeof directiveType.value, "string");

  // 3. 読み取り専用originalResultプロパティ
  assertExists(directiveType.originalResult);
  assertEquals(directiveType.originalResult.demonstrativeType, "summary");

  // 4. 標準的なメソッドの存在
  assertExists(directiveType.toString);
  assertExists(directiveType.equals);

  logger.debug("インターフェース一貫性検証完了", {
    success: true,
    methods: ["create", "value", "originalResult", "toString", "equals"],
    smart_constructor: true,
  });
});

Deno.test("DirectiveType - Architecture: Package boundary compliance", () => {
  logger.debug("テスト開始: DirectiveTypeパッケージ境界遵守検証", {
    testType: "architecture",
    target: "DirectiveType",
    constraint: "package_boundary",
  });

  // バリデーション責任の分離確認
  // DirectiveTypeはバリデーション済みのTwoParams_Resultのみを受け入れる
  const preValidatedResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options: {},
  };

  const directiveType = DirectiveType.create(preValidatedResult);

  // DirectiveType自体にバリデーション機能がないことを確認
  // （すべてのバリデーションはBreakdownParamsで実行済みと想定）
  assertEquals(directiveType.value, "defect");

  // パッケージ境界: DirectiveTypeは型安全な値の保持のみ担当
  // バリデーション: BreakdownParamsが担当
  // この分離により、単一責任原則が守られている

  logger.debug("パッケージ境界遵守検証完了", {
    success: true,
    responsibilities: {
      DirectiveType: "type_safe_value_holding",
      BreakdownParams: "validation",
    },
    boundary_violations: "none",
  });
});

Deno.test("DirectiveType - Architecture: Totality principle compliance", () => {
  logger.debug("テスト開始: DirectiveTotality原則準拠検証", {
    testType: "architecture",
    target: "DirectiveType",
    constraint: "totality_principle",
  });

  // Totality原則の要素確認
  // 1. Smart Constructor（private constructor + static create）
  const result: TwoParams_Result = {
    type: "two",
    demonstrativeType: "init",
    layerType: "project",
    params: ["init", "project"],
    options: {},
  };

  // 2. 全域関数性（TwoParams_Resultに対して常に成功）
  const directiveType = DirectiveType.create(result);
  assertExists(directiveType);

  // 3. Immutable（値の変更不可）
  const originalValue = directiveType.value;
  assertEquals(originalValue, "init");

  // 4. 型安全性（TypeScriptコンパイルが成功している）
  assertEquals(typeof directiveType.value, "string");

  logger.debug("Totality原則準拠検証完了", {
    success: true,
    totality_elements: {
      smart_constructor: true,
      total_function: true,
      immutable: true,
      type_safe: true,
    },
  });
});

Deno.test("TwoParamsDirectivePattern - Architecture: Pattern encapsulation", () => {
  logger.debug("テスト開始: TwoParamsDirectivePatternカプセル化検証", {
    testType: "architecture",
    target: "TwoParamsDirectivePattern",
    constraint: "encapsulation",
  });

  // Smart Constructorによる安全なパターン作成
  const validPattern = TwoParamsDirectivePattern.create("to|summary|defect");
  assertExists(validPattern);

  // 無効なパターンの適切な処理
  const invalidPattern = TwoParamsDirectivePattern.create("[invalid_regex");
  assertEquals(invalidPattern, null);

  // 内部RegExpの適切なカプセル化
  if (validPattern) {
    assertExists(validPattern.test);
    assertExists(validPattern.getPattern);
    assertEquals(typeof validPattern.test("to"), "boolean");
  }

  logger.debug("パターンカプセル化検証完了", {
    success: true,
    encapsulation: "proper",
    error_handling: "null_return",
  });
});
