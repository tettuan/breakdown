/**
 * @fileoverview Unit test for LayerType
 * 
 * このテストはLayerTypeの機能動作を検証します：
 * - 階層値の正確な取得
 * - getHierarchyLevel()の動作
 * - isStandardHierarchy()の判定
 * - パターンマッチング機能
 * - 実際のユースケースでの動作確認
 * 
 * 単体テストの目的は、LayerTypeの各機能が仕様通りに動作し、
 * 期待される階層管理結果を返すことを保証することです。
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { BreakdownLogger } from "../../deps.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParamsResult } from "../deps.ts";

const logger = new BreakdownLogger("test-unit-layer");

Deno.test("LayerType - Unit: create() method functionality", async () => {
  logger.debug("テスト開始: LayerType create()メソッド機能テスト", {
    testType: "unit",
    target: "LayerType.create",
    functionality: "creation"
  });

  // 1. 標準的なlayerTypeでの作成
  const standardLayers = ["project", "issue", "task"];
  const demonstrativeTypes = ["to", "summary", "defect"];

  for (const layerType of standardLayers) {
    for (const demonstrativeType of demonstrativeTypes) {
      const result: TwoParamsResult = {
        type: "two",
        demonstrativeType,
        layerType,
        params: [demonstrativeType, layerType],
        options: {}
      };

      const layer = LayerType.create(result);
      assertExists(layer);
      assertEquals(layer.value, layerType);

      logger.debug("LayerType作成成功", {
        layerType,
        demonstrativeType,
        created: true
      });
    }
  }

  // 2. 特別なlayerTypeでの作成
  const specialLayers = ["bugs", "temp"];
  for (const layerType of specialLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "find",
      layerType,
      params: ["find", layerType],
      options: {}
    };

    const layer = LayerType.create(result);
    assertExists(layer);
    assertEquals(layer.value, layerType);

    logger.debug("特別LayerType作成成功", {
      layerType,
      special: true,
      created: true
    });
  }

  logger.debug("create()メソッド機能テスト完了", {
    success: true,
    standard_combinations: standardLayers.length * demonstrativeTypes.length,
    special_layers: specialLayers.length
  });
});

Deno.test("LayerType - Unit: value property accuracy", async () => {
  logger.debug("テスト開始: LayerType valueプロパティ精度テスト", {
    testType: "unit",
    target: "LayerType.value",
    functionality: "value_access"
  });

  // 1. 各種layerTypeでの値取得精度確認
  const testCases = [
    { layerType: "project", expected: "project" },
    { layerType: "issue", expected: "issue" },
    { layerType: "task", expected: "task" },
    { layerType: "bugs", expected: "bugs" },
    { layerType: "temp", expected: "temp" },
    { layerType: "epic", expected: "epic" }, // カスタム値
    { layerType: "system", expected: "system" } // カスタム値
  ];

  for (const testCase of testCases) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: testCase.layerType,
      params: ["to", testCase.layerType],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.value, testCase.expected);

    // 2. getValue()メソッド（互換性用）の動作確認
    assertEquals(layerType.getValue(), testCase.expected);

    logger.debug("値取得精度確認", {
      input: testCase.layerType,
      output: layerType.value,
      match: true
    });
  }

  logger.debug("valueプロパティ精度テスト完了", {
    success: true,
    test_cases: testCases.length
  });
});

Deno.test("LayerType - Unit: getHierarchyLevel() functionality", async () => {
  logger.debug("テスト開始: LayerType getHierarchyLevel()機能テスト", {
    testType: "unit",
    target: "LayerType.getHierarchyLevel",
    functionality: "hierarchy_level"
  });

  // 1. 標準階層レベルの確認
  const hierarchyTestCases = [
    { layerType: "project", expectedLevel: 1 },
    { layerType: "issue", expectedLevel: 2 },
    { layerType: "task", expectedLevel: 3 },
    { layerType: "bugs", expectedLevel: 0 },
    { layerType: "temp", expectedLevel: 0 }
  ];

  for (const testCase of hierarchyTestCases) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: testCase.layerType,
      params: ["to", testCase.layerType],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.getHierarchyLevel(), testCase.expectedLevel);

    logger.debug("階層レベル確認", {
      layerType: testCase.layerType,
      level: testCase.expectedLevel,
      accurate: true
    });
  }

  // 2. カスタム階層（未定義）の場合のデフォルト値確認
  const customResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "custom_layer",
    params: ["to", "custom_layer"],
    options: {}
  };

  const customLayerType = LayerType.create(customResult);
  assertEquals(customLayerType.getHierarchyLevel(), 0); // デフォルト値

  logger.debug("getHierarchyLevel()機能テスト完了", {
    success: true,
    standard_levels: hierarchyTestCases.length,
    default_handling: true
  });
});

Deno.test("LayerType - Unit: isStandardHierarchy() functionality", async () => {
  logger.debug("テスト開始: LayerType isStandardHierarchy()機能テスト", {
    testType: "unit",
    target: "LayerType.isStandardHierarchy",
    functionality: "standard_hierarchy_check"
  });

  // 1. 標準階層の判定確認
  const standardLayers = ["project", "issue", "task"];
  for (const layerTypeName of standardLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: layerTypeName,
      params: ["to", layerTypeName],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.isStandardHierarchy(), true);

    logger.debug("標準階層判定", {
      layerType: layerTypeName,
      standard: true,
      correct: true
    });
  }

  // 2. 非標準階層の判定確認
  const nonStandardLayers = ["bugs", "temp", "epic", "system", "custom"];
  for (const layerTypeName of nonStandardLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "find",
      layerType: layerTypeName,
      params: ["find", layerTypeName],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.isStandardHierarchy(), false);

    logger.debug("非標準階層判定", {
      layerType: layerTypeName,
      standard: false,
      correct: true
    });
  }

  logger.debug("isStandardHierarchy()機能テスト完了", {
    success: true,
    standard_layers: standardLayers.length,
    non_standard_layers: nonStandardLayers.length
  });
});

Deno.test("LayerType - Unit: toString() method functionality", async () => {
  logger.debug("テスト開始: LayerType toString()メソッド機能テスト", {
    testType: "unit",
    target: "LayerType.toString",
    functionality: "string_representation"
  });

  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {}
  };

  const layerType = LayerType.create(testResult);
  const stringRepresentation = layerType.toString();

  // 1. 期待される形式での文字列表現
  assertEquals(stringRepresentation, "LayerType(issue)");

  // 2. 文字列表現に値が含まれていることを確認
  assertEquals(stringRepresentation.includes("issue"), true);
  assertEquals(stringRepresentation.includes("LayerType"), true);

  // 3. 複数回呼び出しでも同じ結果を返すことを確認
  assertEquals(layerType.toString(), stringRepresentation);

  logger.debug("toString()メソッド機能テスト完了", {
    success: true,
    format: "LayerType(value)",
    consistency: true
  });
});

Deno.test("LayerType - Unit: equals() method functionality", async () => {
  logger.debug("テスト開始: LayerType equals()メソッド機能テスト", {
    testType: "unit",
    target: "LayerType.equals",
    functionality: "equality_comparison"
  });

  // 1. 同じ値での等価性確認
  const result1: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {}
  };

  const result2: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary", // demonstrativeTypeが異なってもlayerTypeが同じなら等価
    layerType: "project",
    params: ["summary", "project"],
    options: {}
  };

  const layer1 = LayerType.create(result1);
  const layer2 = LayerType.create(result2);

  assertEquals(layer1.equals(layer2), true);

  // 2. 異なる値での非等価性確認
  const result3: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue",
    params: ["to", "issue"],
    options: {}
  };

  const layer3 = LayerType.create(result3);
  assertEquals(layer1.equals(layer3), false);

  // 3. 自己との等価性確認
  assertEquals(layer1.equals(layer1), true);

  logger.debug("equals()メソッド機能テスト完了", {
    success: true,
    same_value_equality: true,
    different_value_inequality: true,
    self_equality: true
  });
});

Deno.test("LayerType - Unit: originalResult property access", async () => {
  logger.debug("テスト開始: LayerType originalResultプロパティアクセステスト", {
    testType: "unit",
    target: "LayerType.originalResult",
    functionality: "original_data_access"
  });

  const options = { hierarchy: true, custom: "value" };
  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options
  };

  const layerType = LayerType.create(testResult);
  const originalResult = layerType.originalResult;

  // 1. 元のTwoParamsResultのすべてのプロパティが保持されている
  assertEquals(originalResult.type, "two");
  assertEquals(originalResult.demonstrativeType, "defect");
  assertEquals(originalResult.layerType, "task");
  assertEquals(originalResult.options, options);

  // 2. 読み取り専用でアクセス可能
  assertExists(originalResult);
  assertEquals(typeof originalResult, "object");

  logger.debug("originalResultプロパティアクセステスト完了", {
    success: true,
    data_preservation: true,
    readonly_access: true
  });
});

Deno.test("TwoParamsLayerTypePattern - Unit: create() method functionality", async () => {
  logger.debug("テスト開始: TwoParamsLayerTypePattern create()メソッド機能テスト", {
    testType: "unit",
    target: "TwoParamsLayerTypePattern.create",
    functionality: "pattern_creation"
  });

  // 1. 有効なパターンでの作成
  const validPatterns = [
    "project|issue|task",
    "bugs|temp|notes",
    "^(epic|system|component)$",
    ".*",
    "\\w+"
  ];

  for (const patternString of validPatterns) {
    const pattern = TwoParamsLayerTypePattern.create(patternString);
    assertExists(pattern);
    assertEquals(pattern?.getPattern(), patternString);

    logger.debug("有効パターン作成成功", {
      pattern: patternString,
      created: true
    });
  }

  // 2. 無効なパターンでの適切な失敗
  const invalidPatterns = [
    "[unclosed",
    "(?invalid_group",
    "*invalid_quantifier"
  ];

  for (const patternString of invalidPatterns) {
    const pattern = TwoParamsLayerTypePattern.create(patternString);
    assertEquals(pattern, null);

    logger.debug("無効パターン適切に拒否", {
      pattern: patternString,
      rejected: true
    });
  }

  logger.debug("create()メソッド機能テスト完了", {
    success: true,
    valid_patterns: validPatterns.length,
    invalid_patterns: invalidPatterns.length
  });
});

Deno.test("TwoParamsLayerTypePattern - Unit: test() method functionality", async () => {
  logger.debug("テスト開始: TwoParamsLayerTypePattern test()メソッド機能テスト", {
    testType: "unit",
    target: "TwoParamsLayerTypePattern.test",
    functionality: "pattern_matching"
  });

  const pattern = TwoParamsLayerTypePattern.create("project|issue|task|bugs");
  assertExists(pattern);

  if (pattern) {
    // 1. マッチするパターンのテスト
    const matchingValues = ["project", "issue", "task", "bugs"];
    for (const value of matchingValues) {
      assertEquals(pattern.test(value), true);
      logger.debug("パターンマッチ成功", { value, matched: true });
    }

    // 2. マッチしないパターンのテスト
    const nonMatchingValues = ["temp", "epic", "system", "component"];
    for (const value of nonMatchingValues) {
      assertEquals(pattern.test(value), false);
      logger.debug("パターン非マッチ確認", { value, matched: false });
    }
  }

  logger.debug("test()メソッド機能テスト完了", {
    success: true,
    pattern_matching: "accurate"
  });
});

Deno.test("LayerType - Unit: Real-world hierarchical scenarios", async () => {
  logger.debug("テスト開始: LayerType実世界階層シナリオテスト", {
    testType: "unit",
    target: "LayerType",
    functionality: "real_world_hierarchy"
  });

  // 1. 標準的なBreakdown階層ワークフロー
  const hierarchicalScenarios = [
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      description: "プロジェクトレベル変換",
      level: 1,
      standard: true
    },
    { 
      demonstrativeType: "summary", 
      layerType: "issue", 
      description: "イシューレベル要約",
      level: 2,
      standard: true
    },
    { 
      demonstrativeType: "defect", 
      layerType: "task", 
      description: "タスクレベル欠陥分析",
      level: 3,
      standard: true
    }
  ];

  for (const scenario of hierarchicalScenarios) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: scenario.demonstrativeType,
      layerType: scenario.layerType,
      params: [scenario.demonstrativeType, scenario.layerType],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.value, scenario.layerType);
    assertEquals(layerType.getHierarchyLevel(), scenario.level);
    assertEquals(layerType.isStandardHierarchy(), scenario.standard);

    logger.debug("階層シナリオ確認", {
      scenario: scenario.description,
      layer: scenario.layerType,
      level: scenario.level,
      standard: scenario.standard,
      success: true
    });
  }

  // 2. 特別な用途での階層使用
  const specialScenarios = [
    { 
      demonstrativeType: "find", 
      layerType: "bugs", 
      description: "バグ検索",
      level: 0,
      standard: false
    },
    { 
      demonstrativeType: "init", 
      layerType: "temp", 
      description: "一時ファイル初期化",
      level: 0,
      standard: false
    }
  ];

  for (const scenario of specialScenarios) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: scenario.demonstrativeType,
      layerType: scenario.layerType,
      params: [scenario.demonstrativeType, scenario.layerType],
      options: { special: true }
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.value, scenario.layerType);
    assertEquals(layerType.getHierarchyLevel(), scenario.level);
    assertEquals(layerType.isStandardHierarchy(), scenario.standard);

    logger.debug("特別シナリオ確認", {
      scenario: scenario.description,
      layer: scenario.layerType,
      level: scenario.level,
      standard: scenario.standard,
      success: true
    });
  }

  logger.debug("実世界階層シナリオテスト完了", {
    success: true,
    hierarchical_scenarios: hierarchicalScenarios.length,
    special_scenarios: specialScenarios.length
  });
});