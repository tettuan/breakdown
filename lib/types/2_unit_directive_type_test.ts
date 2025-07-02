/**
 * @fileoverview Unit test for DirectiveType
 *
 * このテストはDirectiveTypeの機能動作を検証します：
 * - create()メソッドの正常動作
 * - valueプロパティの正確な取得
 * - toString(), equals()メソッドの機能
 * - TwoParamsDirectivePatternの機能
 * - 実際のユースケースでの動作確認
 *
 * 単体テストの目的は、各機能が仕様通りに動作し、
 * 期待される結果を返すことを保証することです。
 */

import { assertEquals, assertExists, BreakdownLogger } from "../../deps.ts";
import { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
import type { TwoParamsResult } from "../deps.ts";

const _logger = new BreakdownLogger("test-unit-directive");

Deno.test("DirectiveType - Unit: create() method functionality", () => {
  _logger.debug("テスト開始: DirectiveType create()メソッド機能テスト", {
    testType: "unit",
    target: "DirectiveType.create",
    functionality: "creation",
  });

  // 1. 標準的なdemonstrativeTypeでの作成
  const standardTypes = ["to", "summary", "defect", "init", "find"];
  const layerTypes = ["project", "issue", "task", "bugs", "temp"];

  for (const demonstrativeType of standardTypes) {
    for (const layerType of layerTypes) {
      const result: TwoParamsResult = {
        type: "two",
        demonstrativeType,
        layerType,
        params: [demonstrativeType, layerType],
        options: {},
      };

      const directiveType = DirectiveType.create(_result);
      assertExists(directiveType);
      assertEquals(directiveType.value, demonstrativeType);

      _logger.debug("DirectiveType作成成功", {
        demonstrativeType,
        layerType,
        created: true,
      });
    }
  }

  _logger.debug("create()メソッド機能テスト完了", {
    success: true,
    tested_combinations: standardTypes.length * layerTypes.length,
  });
});

Deno.test("DirectiveType - Unit: value property accuracy", () => {
  _logger.debug("テスト開始: DirectiveType valueプロパティ精度テスト", {
    testType: "unit",
    target: "DirectiveType.value",
    functionality: "value_access",
  });

  // 1. 各種demonstrativeTypeでの値取得精度確認
  const testCases = [
    { demonstrativeType: "to", expected: "to" },
    { demonstrativeType: "summary", expected: "summary" },
    { demonstrativeType: "defect", expected: "defect" },
    { demonstrativeType: "init", expected: "init" },
    { demonstrativeType: "find", expected: "find" },
    { demonstrativeType: "analyze", expected: "analyze" }, // カスタム値
    { demonstrativeType: "transform", expected: "transform" }, // カスタム値
  ];

  for (const testCase of testCases) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: testCase.demonstrativeType,
      layerType: "project",
      params: [testCase.demonstrativeType, "project"],
      options: {},
    };

    const directiveType = DirectiveType.create(_result);
    assertEquals(directiveType.value, testCase.expected);

    // 2. getValue()メソッド（互換性用）の動作確認
    assertEquals(directiveType.getValue(), testCase.expected);

    _logger.debug("値取得精度確認", {
      input: testCase.demonstrativeType,
      output: directiveType.value,
      match: true,
    });
  }

  _logger.debug("valueプロパティ精度テスト完了", {
    success: true,
    test_cases: testCases.length,
  });
});

Deno.test("DirectiveType - Unit: toString() method functionality", () => {
  _logger.debug("テスト開始: DirectiveType toString()メソッド機能テスト", {
    testType: "unit",
    target: "DirectiveType.toString",
    functionality: "string_representation",
  });

  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  const directiveType = DirectiveType.create(testResult);
  const stringRepresentation = directiveType.toString();

  // 1. 期待される形式での文字列表現
  assertEquals(stringRepresentation, "DirectiveType(summary)");

  // 2. 文字列表現に値が含まれていることを確認
  assertEquals(stringRepresentation.includes("summary"), true);
  assertEquals(stringRepresentation.includes("DirectiveType"), true);

  // 3. 複数回呼び出しでも同じ結果を返すことを確認
  assertEquals(directiveType.toString(), stringRepresentation);

  _logger.debug("toString()メソッド機能テスト完了", {
    success: true,
    format: "DirectiveType(value)",
    consistency: true,
  });
});

Deno.test("DirectiveType - Unit: equals() method functionality", () => {
  _logger.debug("テスト開始: DirectiveType equals()メソッド機能テスト", {
    testType: "unit",
    target: "DirectiveType.equals",
    functionality: "equality_comparison",
  });

  // 1. 同じ値での等価性確認
  const result1: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const result2: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue", // layerTypeが異なってもdemonstrativeTypeが同じなら等価
    params: ["to", "issue"],
    options: {},
  };

  const directive1 = DirectiveType.create(result1);
  const directive2 = DirectiveType.create(result2);

  assertEquals(directive1.equals(directive2), true);

  // 2. 異なる値での非等価性確認
  const result3: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "project",
    params: ["summary", "project"],
    options: {},
  };

  const directive3 = DirectiveType.create(result3);
  assertEquals(directive1.equals(directive3), false);

  // 3. 自己との等価性確認
  assertEquals(directive1.equals(directive1), true);

  _logger.debug("equals()メソッド機能テスト完了", {
    success: true,
    same_value_equality: true,
    different_value_inequality: true,
    self_equality: true,
  });
});

Deno.test("DirectiveType - Unit: originalResult property access", () => {
  _logger.debug("テスト開始: DirectiveType originalResultプロパティアクセステスト", {
    testType: "unit",
    target: "DirectiveType.originalResult",
    functionality: "original_data_access",
  });

  const options = { debug: true, verbose: false };
  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options,
  };

  const directiveType = DirectiveType.create(testResult);
  const originalResult = directiveType.originalResult;

  // 1. 元のTwoParamsResultのすべてのプロパティが保持されている
  assertEquals(originalResult.type, "two");
  assertEquals(originalResult.demonstrativeType, "defect");
  assertEquals(originalResult.layerType, "task");
  assertEquals(originalResult.options, options);

  // 2. 読み取り専用でアクセス可能
  assertExists(originalResult);
  assertEquals(typeof originalResult, "object");

  _logger.debug("originalResultプロパティアクセステスト完了", {
    success: true,
    data_preservation: true,
    readonly_access: true,
  });
});

Deno.test("TwoParamsDirectivePattern - Unit: create() method functionality", () => {
  _logger.debug("テスト開始: TwoParamsDirectivePattern create()メソッド機能テスト", {
    testType: "unit",
    target: "TwoParamsDirectivePattern.create",
    functionality: "pattern_creation",
  });

  // 1. 有効なパターンでの作成
  const validPatterns = [
    "to|summary|defect",
    "analyze|transform|convert",
    "^(init|find|search)$",
    ".*",
    "\\w+",
  ];

  for (const patternString of validPatterns) {
    const pattern = TwoParamsDirectivePattern.create(patternString);
    assertExists(pattern);
    assertEquals(pattern?.getPattern(), patternString);

    _logger.debug("有効パターン作成成功", {
      pattern: patternString,
      created: true,
    });
  }

  // 2. 無効なパターンでの適切な失敗
  const invalidPatterns = [
    "[unclosed",
    "(?invalid_group",
    "*invalid_quantifier",
  ];

  for (const patternString of invalidPatterns) {
    const pattern = TwoParamsDirectivePattern.create(patternString);
    assertEquals(pattern, null);

    _logger.debug("無効パターン適切に拒否", {
      pattern: patternString,
      rejected: true,
    });
  }

  _logger.debug("create()メソッド機能テスト完了", {
    success: true,
    valid_patterns: validPatterns.length,
    invalid_patterns: invalidPatterns.length,
  });
});

Deno.test("TwoParamsDirectivePattern - Unit: test() method functionality", () => {
  _logger.debug("テスト開始: TwoParamsDirectivePattern test()メソッド機能テスト", {
    testType: "unit",
    target: "TwoParamsDirectivePattern.test",
    functionality: "pattern_matching",
  });

  const pattern = TwoParamsDirectivePattern.create("to|summary|defect");
  assertExists(pattern);

  if (pattern) {
    // 1. マッチするパターンのテスト
    const matchingValues = ["to", "summary", "defect"];
    for (const value of matchingValues) {
      assertEquals(pattern.test(value), true);
      _logger.debug("パターンマッチ成功", { value, matched: true });
    }

    // 2. マッチしないパターンのテスト
    const nonMatchingValues = ["init", "find", "analyze", "transform"];
    for (const value of nonMatchingValues) {
      assertEquals(pattern.test(value), false);
      _logger.debug("パターン非マッチ確認", { value, matched: false });
    }
  }

  _logger.debug("test()メソッド機能テスト完了", {
    success: true,
    pattern_matching: "accurate",
  });
});

Deno.test("DirectiveType - Unit: Real-world usage scenarios", () => {
  _logger.debug("テスト開始: DirectiveType実世界ユースケーステスト", {
    testType: "unit",
    target: "DirectiveType",
    functionality: "real_world_usage",
  });

  // 1. 標準的なBreakdownワークフロー
  const breakdownScenarios = [
    { demonstrativeType: "to", layerType: "project", description: "プロジェクト変換" },
    { demonstrativeType: "summary", layerType: "issue", description: "イシュー要約" },
    { demonstrativeType: "defect", layerType: "task", description: "タスク欠陥分析" },
  ];

  for (const scenario of breakdownScenarios) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: scenario.demonstrativeType,
      layerType: scenario.layerType,
      params: [scenario.demonstrativeType, scenario.layerType],
      options: {},
    };

    const directiveType = DirectiveType.create(_result);
    assertEquals(directiveType.value, scenario.demonstrativeType);

    _logger.debug("Breakdownシナリオ確認", {
      scenario: scenario.description,
      directive: scenario.demonstrativeType,
      layer: scenario.layerType,
      success: true,
    });
  }

  // 2. カスタム設定での拡張ユースケース
  const customScenarios = [
    { demonstrativeType: "analyze", layerType: "system", description: "システム分析" },
    { demonstrativeType: "transform", layerType: "component", description: "コンポーネント変換" },
  ];

  for (const scenario of customScenarios) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: scenario.demonstrativeType,
      layerType: scenario.layerType,
      params: [scenario.demonstrativeType, scenario.layerType],
      options: { custom: true },
    };

    const directiveType = DirectiveType.create(_result);
    assertEquals(directiveType.value, scenario.demonstrativeType);

    _logger.debug("カスタムシナリオ確認", {
      scenario: scenario.description,
      directive: scenario.demonstrativeType,
      custom: true,
      success: true,
    });
  }

  _logger.debug("実世界ユースケーステスト完了", {
    success: true,
    standard_scenarios: breakdownScenarios.length,
    custom_scenarios: customScenarios.length,
  });
});
