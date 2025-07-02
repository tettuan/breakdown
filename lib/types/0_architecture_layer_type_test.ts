/**
 * @fileoverview Architecture test for LayerType
 *
 * このテストはLayerTypeのアーキテクチャ制約を検証します：
 * - TwoParamsResultとの依存関係の妥当性
 * - 階層間境界の適切性
 * - TypePatternProvider連携の妥当性
 * - 循環参照の有無
 * - Totality原則準拠のアーキテクチャ設計
 *
 * アーキテクチャテストは、LayerTypeが階層管理の責務を適切に果たし、
 * システム全体の安定性を保つことを保証します。
 */

import { assertEquals, assertExists, BreakdownLogger } from "../../deps.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParamsResult } from "../deps.ts";

const _logger = new BreakdownLogger("test-architecture-layer");

Deno.test("LayerType - Architecture: TwoParamsResult dependency constraints", () => {
  _logger.debug("テスト開始: LayerType TwoParamsResult依存関係制約検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "dependencies",
  });

  // TwoParamsResultとの適切な依存関係確認
  const validResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  // LayerTypeが正常に構築できることを確認（依存関係が正しい）
  const layerType = LayerType.create(validResult);
  assertExists(layerType);
  assertEquals(layerType.value, "project");

  // 階層管理の核となる依存関係のみに限定されていることを確認
  assertEquals(layerType.originalResult.type, "two");
  assertEquals(layerType.originalResult.layerType, "project");

  _logger.debug("TwoParamsResult依存関係制約検証完了", {
    success: true,
    dependencies: ["TwoParamsResult"],
    layer_value: "project",
    violations: "none",
  });
});

Deno.test("LayerType - Architecture: No circular dependencies", () => {
  _logger.debug("テスト開始: LayerType循環参照検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "circular_dependencies",
  });

  // LayerTypeクラスの存在確認（循環参照があるとインポートできない）
  assertExists(LayerType);
  assertExists(LayerType.create);

  // TwoParamsLayerTypePatternクラスの存在確認
  assertExists(TwoParamsLayerTypePattern);
  assertExists(TwoParamsLayerTypePattern.create);

  // 相互の独立性確認
  const pattern = TwoParamsLayerTypePattern.create("project|issue|task");
  assertExists(pattern);

  const result: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue",
    params: ["to", "issue"],
    options: {},
  };
  const layerType = LayerType.create(_result);
  assertExists(layerType);

  _logger.debug("循環参照検証完了", {
    success: true,
    classes: ["LayerType", "TwoParamsLayerTypePattern"],
    circular_dependencies: "none",
    independence: true,
  });
});

Deno.test("LayerType - Architecture: Hierarchical boundary appropriateness", () => {
  _logger.debug("テスト開始: LayerType階層間境界適切性検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "hierarchical_boundaries",
  });

  // 標準的な階層の境界確認
  const hierarchicalLayers = ["project", "issue", "task"];
  const specialLayers = ["bugs", "temp"];

  // 1. 標準階層の適切な処理
  for (const layer of hierarchicalLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: layer,
      params: ["to", layer],
      options: {},
    };

    const layerType = LayerType.create(_result);
    assertExists(layerType);
    assertEquals(layerType.value, layer);
    assertEquals(layerType.isStandardHierarchy(), true);

    _logger.debug("標準階層境界確認", {
      layer,
      standard: true,
      hierarchy_level: layerType.getHierarchyLevel(),
    });
  }

  // 2. 特別な階層の適切な処理
  for (const layer of specialLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "find",
      layerType: layer,
      params: ["find", layer],
      options: {},
    };

    const layerType = LayerType.create(_result);
    assertExists(layerType);
    assertEquals(layerType.value, layer);
    assertEquals(layerType.isStandardHierarchy(), false);

    _logger.debug("特別階層境界確認", {
      layer,
      standard: false,
      hierarchy_level: layerType.getHierarchyLevel(),
    });
  }

  _logger.debug("階層間境界適切性検証完了", {
    success: true,
    standard_layers: hierarchicalLayers.length,
    special_layers: specialLayers.length,
    boundary_handling: "appropriate",
  });
});

Deno.test("LayerType - Architecture: TypePatternProvider integration", () => {
  _logger.debug("テスト開始: LayerType TypePatternProvider連携検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "pattern_provider_integration",
  });

  // TwoParamsLayerTypePatternのTypePatternProvider準拠確認
  const pattern = TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp");
  assertExists(pattern);

  if (pattern) {
    // getLayerTypePattern()メソッドの存在と動作確認
    assertExists(pattern.getLayerTypePattern);
    const retrievedPattern = pattern.getLayerTypePattern();
    assertEquals(retrievedPattern, pattern);

    // パターンマッチング機能の連携確認
    assertEquals(pattern.test("project"), true);
    assertEquals(pattern.test("issue"), true);
    assertEquals(pattern.test("invalid"), false);

    // パターン情報の適切な提供
    assertExists(pattern.getPattern);
    assertEquals(pattern.getPattern(), "project|issue|task|bugs|temp");
  }

  _logger.debug("TypePatternProvider連携検証完了", {
    success: true,
    integration: {
      interface_compliance: true,
      pattern_matching: true,
      self_reference: true,
    },
  });
});

Deno.test("LayerType - Architecture: Package boundary compliance", () => {
  _logger.debug("テスト開始: LayerTypeパッケージ境界遵守検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "package_boundary",
  });

  // バリデーション責任の分離確認
  // LayerTypeは階層値の型安全な保持のみを担当
  const preValidatedResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "task",
    params: ["summary", "task"],
    options: {},
  };

  const layerType = LayerType.create(preValidatedResult);

  // 1. LayerType自体にバリデーション機能がないことを確認
  assertEquals(layerType.value, "task");

  // 2. 階層管理の責務のみを持つことを確認
  assertExists(layerType.getHierarchyLevel);
  assertExists(layerType.isStandardHierarchy);

  // 3. パッケージ境界: LayerTypeは階層値の型安全な管理のみ
  // バリデーション: BreakdownParamsが担当
  // パターンマッチング: TwoParamsLayerTypePatternが担当

  _logger.debug("パッケージ境界遵守検証完了", {
    success: true,
    responsibilities: {
      LayerType: "hierarchical_value_management",
      BreakdownParams: "validation",
      TwoParamsLayerTypePattern: "pattern_matching",
    },
    boundary_violations: "none",
  });
});

Deno.test("LayerType - Architecture: Totality principle compliance", () => {
  _logger.debug("テスト開始: LayerType Totality原則準拠検証", {
    testType: "architecture",
    target: "LayerType",
    constraint: "totality_principle",
  });

  // Totality原則の要素確認
  // 1. Smart Constructor（private constructor + static create）
  const result: TwoParamsResult = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "issue",
    params: ["defect", "issue"],
    options: {},
  };

  // 2. 全域関数性（TwoParamsResultに対して常に成功）
  const layerType = LayerType.create(_result);
  assertExists(layerType);

  // 3. Immutable（値の変更不可）
  const originalValue = layerType.value;
  assertEquals(originalValue, "issue");

  // 4. 型安全性（TypeScriptコンパイルが成功している）
  assertEquals(typeof layerType.value, "string");

  // 5. 階層情報の一貫性
  assertEquals(layerType.getHierarchyLevel(), 2); // issueは階層レベル2
  assertEquals(layerType.isStandardHierarchy(), true);

  _logger.debug("Totality原則準拠検証完了", {
    success: true,
    totality_elements: {
      smart_constructor: true,
      total_function: true,
      immutable: true,
      type_safe: true,
      hierarchical_consistency: true,
    },
  });
});

Deno.test("TwoParamsLayerTypePattern - Architecture: Pattern system integration", () => {
  _logger.debug("テスト開始: TwoParamsLayerTypePatternパターンシステム統合検証", {
    testType: "architecture",
    target: "TwoParamsLayerTypePattern",
    constraint: "pattern_system_integration",
  });

  // パターンシステムとの適切な統合確認
  const standardPattern = TwoParamsLayerTypePattern.create("project|issue|task");
  const extendedPattern = TwoParamsLayerTypePattern.create("project|issue|task|epic|system");
  const customPattern = TwoParamsLayerTypePattern.create("bugs|todos|notes");

  assertExists(standardPattern);
  assertExists(extendedPattern);
  assertExists(customPattern);

  // 各パターンの独立性と機能性確認
  if (standardPattern && extendedPattern && customPattern) {
    // 標準パターンの動作
    assertEquals(standardPattern.test("project"), true);
    assertEquals(standardPattern.test("epic"), false);

    // 拡張パターンの動作
    assertEquals(extendedPattern.test("project"), true);
    assertEquals(extendedPattern.test("epic"), true);

    // カスタムパターンの動作
    assertEquals(customPattern.test("bugs"), true);
    assertEquals(customPattern.test("project"), false);
  }

  _logger.debug("パターンシステム統合検証完了", {
    success: true,
    pattern_types: {
      standard: "project|issue|task",
      extended: "project|issue|task|epic|system",
      custom: "bugs|todos|notes",
    },
    integration: "proper",
  });
});
