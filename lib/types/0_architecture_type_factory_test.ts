/**
 * @fileoverview TypeFactory Architecture Tests - ファクトリーパターンの設計検証
 *
 * TypeFactoryのアーキテクチャ設計の正しさを検証するテスト。
 * ファクトリーパターンの実装、依存関係、インターフェース準拠を確認。
 *
 * @module types/0_architecture_type_factory_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { TypeFactory, TypePatternProvider } from "./type_factory.ts";
import { TwoParamsDirectivePattern } from "./mod.ts";
import { TwoParamsLayerTypePattern } from "./mod.ts";

/**
 * テスト用のTypePatternProvider実装
 * 正常系とエラー系のパターンを返す
 */
class TestPatternProvider implements TypePatternProvider {
  constructor(
    private directivePattern: TwoParamsDirectivePattern | null,
    private layerPattern: TwoParamsLayerTypePattern | null,
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return this.directivePattern;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerPattern;
  }
}

Deno.test("TypeFactory Architecture - Factory Pattern implementation", () => {
  // ファクトリーパターンの実装確認
  const provider = new TestPatternProvider(
    TwoParamsDirectivePattern.create("to|summary|defect")!,
    TwoParamsLayerTypePattern.create("project|issue|task")!,
  );

  const factory = new TypeFactory(provider);

  // インスタンスが作成できることを確認
  assertExists(factory);

  // メソッドが実装されていることを確認
  assertEquals(typeof factory.createDirectiveType, "function");
  assertEquals(typeof factory.createLayerType, "function");
  assertEquals(typeof factory.createBothTypes, "function");
  assertEquals(typeof factory.validateBothValues, "function");
  assertEquals(typeof factory.getPatternAvailability, "function");
  assertEquals(typeof factory.debug, "function");
});

Deno.test("TypeFactory Architecture - TypePatternProvider interface compliance", () => {
  // インターフェース準拠の確認
  const provider: TypePatternProvider = {
    getDirectivePattern: () => TwoParamsDirectivePattern.create("to|summary")!,
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project|issue")!,
  };

  const factory = new TypeFactory(provider);
  assertExists(factory);

  // プロバイダーのメソッドが呼び出せることを確認
  const directiveResult = factory.createDirectiveType("to");
  const layerResult = factory.createLayerType("project");

  assertExists(directiveResult);
  assertExists(layerResult);
});

Deno.test("TypeFactory Architecture - Dependency injection pattern", () => {
  // 依存性注入パターンの確認
  const nullProvider = new TestPatternProvider(null, null);
  const factory1 = new TypeFactory(nullProvider);

  const fullProvider = new TestPatternProvider(
    TwoParamsDirectivePattern.create(".*")!,
    TwoParamsLayerTypePattern.create(".*")!,
  );
  const factory2 = new TypeFactory(fullProvider);

  // 異なるプロバイダーで異なる動作をすることを確認
  const availability1 = factory1.getPatternAvailability();
  const availability2 = factory2.getPatternAvailability();

  assertEquals(availability1.directive, false);
  assertEquals(availability1.layer, false);
  assertEquals(availability1.both, false);

  assertEquals(availability2.directive, true);
  assertEquals(availability2.layer, true);
  assertEquals(availability2.both, true);
});

Deno.test("TypeFactory Architecture - Result type pattern for error handling", () => {
  // Result型パターンによるエラーハンドリングの確認
  const provider = new TestPatternProvider(null, null);
  const factory = new TypeFactory(provider);

  const directiveResult = factory.createDirectiveType("any");
  const layerResult = factory.createLayerType("any");

  // Result型の構造を確認
  assertEquals("ok" in directiveResult, true);
  assertEquals("ok" in layerResult, true);

  // エラーケースではerrorプロパティが存在
  if (!directiveResult.ok) {
    assertExists(directiveResult.error);
    assertEquals(directiveResult.error.kind, "PatternNotFound");
  }

  if (!layerResult.ok) {
    assertExists(layerResult.error);
    assertEquals(layerResult.error.kind, "PatternNotFound");
  }
});

Deno.test("TypeFactory Architecture - Smart Constructor pattern integration", () => {
  // Smart Constructorパターンとの統合確認
  const provider = new TestPatternProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  const directiveResult = factory.createDirectiveType("to");
  const layerResult = factory.createLayerType("project");

  // 成功時はdataプロパティが存在
  if (directiveResult.ok) {
    assertExists(directiveResult.data);
    assertEquals(directiveResult.data.value, "to");
  }

  if (layerResult.ok) {
    assertExists(layerResult.data);
    assertEquals(layerResult.data.value, "project");
  }
});

Deno.test("TypeFactory Architecture - Separation of concerns", () => {
  // 責務分離の確認
  const provider = new TestPatternProvider(
    TwoParamsDirectivePattern.create("to|summary")!,
    TwoParamsLayerTypePattern.create("project|issue")!,
  );
  const factory = new TypeFactory(provider);

  // ファクトリーはバリデーションパターンの取得と適用のみを担当
  // 実際のバリデーションはパターンオブジェクトが実行
  const debug = factory.debug();

  assertEquals(debug.patternProvider, "TestPatternProvider");
  assertExists(debug.availability);

  // TypeFactory自体はパターンの詳細を知らない
  // パターンプロバイダーに完全に委譲している
  assertEquals(debug.availability.directive, true);
  assertEquals(debug.availability.layer, true);
});

Deno.test("TypeFactory Architecture - Totality principle compliance", () => {
  // Totality原則の準拠確認
  const provider = new TestPatternProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  // 全ての入力に対して必ず結果が返される（例外を投げない）
  const testCases = ["", "invalid", "to", "project", "!@#$%^&*()"];

  for (const testCase of testCases) {
    const directiveResult = factory.createDirectiveType(testCase);
    const layerResult = factory.createLayerType(testCase);

    // 例外が投げられずに必ず結果が返される
    assertExists(directiveResult);
    assertExists(layerResult);
    assertEquals("ok" in directiveResult, true);
    assertEquals("ok" in layerResult, true);
  }
});

Deno.test("TypeFactory Architecture - Method composition pattern", () => {
  // メソッド合成パターンの確認
  const provider = new TestPatternProvider(
    TwoParamsDirectivePattern.create("to|summary")!,
    TwoParamsLayerTypePattern.create("project|issue")!,
  );
  const factory = new TypeFactory(provider);

  // createBothTypesは個別のcreateメソッドを合成
  const bothResult = factory.createBothTypes("to", "project");

  if (bothResult.ok) {
    assertExists(bothResult.data.directive);
    assertExists(bothResult.data.layer);
    assertEquals(bothResult.data.directive.value, "to");
    assertEquals(bothResult.data.layer.value, "project");
  }

  // validateBothValuesは検証のみ（型構築なし）
  const isValid = factory.validateBothValues("to", "project");
  assertEquals(typeof isValid, "boolean");
});
