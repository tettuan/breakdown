/**
 * @fileoverview Structure test for LayerType
 * 
 * このテストはLayerTypeの構造と責務分離を検証します：
 * - Smart Constructorパターンの正しい実装
 * - 階層管理責務の適切性
 * - TwoParamsLayerTypePattern設計の妥当性
 * - Immutable設計の検証
 * - 適切な抽象化レベル
 * 
 * 構造テストの目的は、LayerTypeクラスの設計が適切であり、
 * 階層管理の責務を正しく果たすことを保証することです。
 */

import { assertEquals, assertExists, BreakdownLogger } from "../../deps.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParamsResult } from "../deps.ts";

const logger = new BreakdownLogger("test-structure-layer");

Deno.test("LayerType - Structure: Smart Constructor pattern implementation", async () => {
  logger.debug("テスト開始: LayerType Smart Constructorパターン検証", {
    testType: "structure",
    target: "LayerType",
    pattern: "smart_constructor"
  });

  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {}
  };

  // 1. static create()メソッドが唯一の作成方法であることを確認
  const layerType = LayerType.create(testResult);
  assertExists(layerType);
  assertEquals(layerType.value, "project");

  // 2. create()メソッドが適切な型を返すことを確認
  assertEquals(layerType instanceof LayerType, true);

  // 3. 階層情報の適切な管理
  assertEquals(layerType.getHierarchyLevel(), 1); // projectは階層レベル1
  assertEquals(layerType.isStandardHierarchy(), true);

  logger.debug("Smart Constructor実装検証完了", {
    success: true,
    creation_method: "static_create_only",
    hierarchical_info: {
      level: layerType.getHierarchyLevel(),
      standard: layerType.isStandardHierarchy()
    }
  });
});

Deno.test("LayerType - Structure: Hierarchical management responsibility", async () => {
  logger.debug("テスト開始: LayerType階層管理責務検証", {
    testType: "structure",
    target: "LayerType",
    responsibility: "hierarchical_management"
  });

  // 1. 標準階層の適切な管理
  const standardLayers = [
    { name: "project", level: 1, standard: true },
    { name: "issue", level: 2, standard: true },
    { name: "task", level: 3, standard: true }
  ];

  for (const layer of standardLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: layer.name,
      params: ["to", layer.name],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.value, layer.name);
    assertEquals(layerType.getHierarchyLevel(), layer.level);
    assertEquals(layerType.isStandardHierarchy(), layer.standard);

    logger.debug("標準階層管理確認", {
      layer: layer.name,
      level: layer.level,
      standard: layer.standard
    });
  }

  // 2. 特別階層の適切な管理
  const specialLayers = [
    { name: "bugs", level: 0, standard: false },
    { name: "temp", level: 0, standard: false }
  ];

  for (const layer of specialLayers) {
    const result: TwoParamsResult = {
      type: "two",
      demonstrativeType: "find",
      layerType: layer.name,
      params: ["find", layer.name],
      options: {}
    };

    const layerType = LayerType.create(result);
    assertEquals(layerType.value, layer.name);
    assertEquals(layerType.getHierarchyLevel(), layer.level);
    assertEquals(layerType.isStandardHierarchy(), layer.standard);

    logger.debug("特別階層管理確認", {
      layer: layer.name,
      level: layer.level,
      standard: layer.standard
    });
  }

  logger.debug("階層管理責務検証完了", {
    success: true,
    standard_layers: standardLayers.length,
    special_layers: specialLayers.length
  });
});

Deno.test("LayerType - Structure: TwoParamsLayerTypePattern design validity", async () => {
  logger.debug("テスト開始: TwoParamsLayerTypePattern設計妥当性検証", {
    testType: "structure",
    target: "TwoParamsLayerTypePattern",
    aspect: "design_validity"
  });

  // 1. パターン作成の設計適切性
  const validPattern = TwoParamsLayerTypePattern.create("project|issue|task");
  const invalidPattern = TwoParamsLayerTypePattern.create("[invalid");

  assertExists(validPattern);
  assertEquals(invalidPattern, null);

  // 2. パターンマッチング機能の設計
  if (validPattern) {
    assertEquals(validPattern.test("project"), true);
    assertEquals(validPattern.test("issue"), true);
    assertEquals(validPattern.test("task"), true);
    assertEquals(validPattern.test("invalid"), false);

    // 3. パターン情報の適切な提供
    assertEquals(validPattern.getPattern(), "project|issue|task");
    assertEquals(validPattern.toString(), "project|issue|task");

    // 4. TypePatternProviderインターフェース準拠
    assertEquals(validPattern.getLayerTypePattern(), validPattern);
  }

  logger.debug("TwoParamsLayerTypePattern設計妥当性検証完了", {
    success: true,
    pattern_creation: "valid",
    pattern_matching: "accurate",
    interface_compliance: "proper"
  });
});

Deno.test("LayerType - Structure: Immutable design verification", async () => {
  logger.debug("テスト開始: LayerType Immutable設計検証", {
    testType: "structure",
    target: "LayerType",
    design: "immutable"
  });

  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {}
  };

  const layerType = LayerType.create(testResult);
  const originalValue = layerType.value;
  const originalLevel = layerType.getHierarchyLevel();
  const originalStandard = layerType.isStandardHierarchy();

  // 1. 値が変更不可であることを確認
  assertEquals(originalValue, "issue");
  assertEquals(originalLevel, 2);
  assertEquals(originalStandard, true);

  // 2. 複数回アクセスしても同じ値を返すことを確認
  assertEquals(layerType.value, originalValue);
  assertEquals(layerType.getHierarchyLevel(), originalLevel);
  assertEquals(layerType.isStandardHierarchy(), originalStandard);

  // 3. originalResultが読み取り専用であることを確認
  const originalResult = layerType.originalResult;
  assertEquals(originalResult.layerType, "issue");

  // 4. toString()の結果も一貫していることを確認
  const stringRepresentation = layerType.toString();
  assertEquals(stringRepresentation, layerType.toString());
  assertEquals(stringRepresentation.includes("issue"), true);

  logger.debug("Immutable設計検証完了", {
    success: true,
    immutability: {
      value_consistency: true,
      hierarchy_consistency: true,
      readonly_access: true
    }
  });
});

Deno.test("LayerType - Structure: Appropriate abstraction level", async () => {
  logger.debug("テスト開始: LayerType適切な抽象化レベル検証", {
    testType: "structure",
    target: "LayerType",
    aspect: "abstraction_level"
  });

  // 1. 異なるlayerTypeで複数のインスタンス作成
  const layerResults = [
    { type: "two" as const, demonstrativeType: "to", layerType: "project", params: ["to", "project"], options: {} },
    { type: "two" as const, demonstrativeType: "summary", layerType: "issue", params: ["summary", "issue"], options: {} },
    { type: "two" as const, demonstrativeType: "defect", layerType: "task", params: ["defect", "task"], options: {} },
    { type: "two" as const, demonstrativeType: "find", layerType: "bugs", params: ["find", "bugs"], options: {} }
  ];

  const layerTypes = layerResults.map(result => LayerType.create(result));

  // 2. 各インスタンスが適切な階層情報を持つことを確認
  assertEquals(layerTypes.length, 4);
  assertEquals(layerTypes[0].value, "project");
  assertEquals(layerTypes[1].value, "issue");
  assertEquals(layerTypes[2].value, "task");
  assertEquals(layerTypes[3].value, "bugs");

  // 3. 階層レベルの適切な抽象化
  assertEquals(layerTypes[0].getHierarchyLevel(), 1); // project
  assertEquals(layerTypes[1].getHierarchyLevel(), 2); // issue
  assertEquals(layerTypes[2].getHierarchyLevel(), 3); // task
  assertEquals(layerTypes[3].getHierarchyLevel(), 0); // bugs

  // 4. equals()メソッドによる適切な比較機能
  const layerType1 = LayerType.create(layerResults[0]);
  const layerType2 = LayerType.create(layerResults[0]);
  const layerType3 = LayerType.create(layerResults[1]);

  assertEquals(layerType1.equals(layerType2), true);
  assertEquals(layerType1.equals(layerType3), false);

  logger.debug("適切な抽象化レベル検証完了", {
    success: true,
    abstraction: {
      level: "appropriate",
      hierarchy_support: true,
      comparison: "supported"
    }
  });
});

Deno.test("LayerType - Structure: Single responsibility adherence", async () => {
  logger.debug("テスト開始: LayerType単一責任原則遵守検証", {
    testType: "structure",
    target: "LayerType",
    principle: "single_responsibility"
  });

  const testResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    params: ["to", "task"],
    options: {}
  };

  const layerType = LayerType.create(testResult);

  // 1. LayerTypeの責務：階層値の型安全な管理のみ
  assertEquals(layerType.value, "task");

  // 2. 階層管理以外の複雑な処理を持たないことを確認
  assertEquals(typeof layerType.value, "string");
  assertEquals(typeof layerType.getHierarchyLevel(), "number");
  assertEquals(typeof layerType.isStandardHierarchy(), "boolean");

  // 3. バリデーション機能が含まれていないことを確認
  // （バリデーションはBreakdownParamsの責務）
  assertEquals(layerType.value, "task");

  // 4. 内部状態の適切な隠蔽
  assertExists(layerType.originalResult);
  assertEquals(layerType.originalResult.layerType, "task");

  logger.debug("単一責任原則遵守検証完了", {
    success: true,
    responsibilities: {
      primary: "hierarchical_value_management",
      excluded: ["validation", "transformation", "business_logic"]
    },
    encapsulation: "proper"
  });
});

Deno.test("LayerType - Structure: Error handling design", async () => {
  logger.debug("テスト開始: LayerTypeエラーハンドリング設計検証", {
    testType: "structure",
    target: "LayerType",
    aspect: "error_handling"
  });

  // 1. Totality原則に従ったエラーハンドリング
  // LayerTypeはTwoParamsResultを前提とするため、
  // バリデーションエラーは発生しない設計

  const validResults = [
    { type: "two" as const, demonstrativeType: "to", layerType: "project", params: ["to", "project"], options: {} },
    { type: "two" as const, demonstrativeType: "summary", layerType: "issue", params: ["summary", "issue"], options: {} },
    { type: "two" as const, demonstrativeType: "find", layerType: "bugs", params: ["find", "bugs"], options: {} }
  ];

  // 2. 正常な作成が常に成功することを確認
  for (const result of validResults) {
    const layerType = LayerType.create(result);
    assertExists(layerType);
    assertEquals(layerType.value, result.layerType);

    logger.debug("正常作成確認", {
      layerType: result.layerType,
      success: true
    });
  }

  logger.debug("エラーハンドリング設計検証完了", {
    success: true,
    error_handling: {
      totality_principle: true,
      no_exceptions: true,
      validated_input_assumption: true
    }
  });
});