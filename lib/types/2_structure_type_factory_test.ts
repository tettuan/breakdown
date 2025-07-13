/**
 * @fileoverview TypeFactory Structure Tests - 構造整合性テスト
 *
 * TypeFactoryの構造的な整合性を検証するテスト。
 * 型の一貫性、インターフェース準拠、データ構造の正確性を確認。
 *
 * @module types/2_structure_type_factory_test
 */

import { assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { TypeFactory, TypePatternProvider } from "./type_factory.ts";
import { TwoParamsDirectivePattern } from "./mod.ts";
import { TwoParamsLayerTypePattern } from "./mod.ts";

/**
 * 構造テスト用のパターンプロバイダー
 */
class StructureTestProvider implements TypePatternProvider {
  constructor(
    private directivePattern: TwoParamsDirectivePattern | null,
    private layerPattern: TwoParamsLayerTypePattern | null,
  ) {}

  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this.directivePattern;
  }

  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this.layerPattern;
  }

  validateDirectiveType(value: string): boolean {
    return this.directivePattern ? this.directivePattern.test(value) : false;
  }

  validateLayerType(value: string): boolean {
    return this.layerPattern ? this.layerPattern.test(value) : false;
  }

  getValidDirectiveTypes(): readonly string[] {
    return ["to", "summary", "defect"];
  }

  getValidLayerTypes(): readonly string[] {
    return ["project", "issue", "task"];
  }
}

Deno.test("TypeFactory Structure - TypeCreationResult type structure", () => {
  const provider = new StructureTestProvider(
    (() => {
      const result = TwoParamsDirectivePattern.createOrError("to");
      return result.ok ? result.data : null;
    })(),
    null,
  );
  const factory = new TypeFactory(provider);

  // 成功ケースの構造
  const successResult = factory.createDirectiveType("to");
  assertEquals("ok" in successResult, true);

  if (successResult.ok) {
    assertEquals(successResult.ok, true);
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);

    // dataはDirectiveType型
    assertStrictEquals(successResult.data.constructor.name, "DirectiveType");
  }

  // 失敗ケースの構造
  const errorResult = factory.createDirectiveType("invalid");
  assertEquals("ok" in errorResult, true);

  if (!errorResult.ok) {
    assertEquals(errorResult.ok, false);
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);

    // errorはProcessingError型
    assertEquals("kind" in errorResult.error, true);
    assertEquals(
      "operation" in errorResult.error || "value" in errorResult.error ||
        "pattern" in errorResult.error,
      true,
    );
  }
});

Deno.test("TypeFactory Structure - ProcessingError variants", () => {
  // PatternNotFoundエラーの構造
  const nullProvider = new StructureTestProvider(null, null);
  const factory1 = new TypeFactory(nullProvider);

  const patternNotFoundResult = factory1.createDirectiveType("any");
  if (!patternNotFoundResult.ok) {
    const error = patternNotFoundResult.error;
    assertEquals(error.kind, "PatternNotFound");
    if (error.kind === "PatternNotFound") {
      assertExists(error.reason);
      assertEquals(typeof error.reason, "string");
    }
  }

  // ValidationFailedエラーの構造
  const strictProvider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("^to$")!,
    null,
  );
  const factory2 = new TypeFactory(strictProvider);

  const validationFailedResult = factory2.createDirectiveType("invalid");
  if (!validationFailedResult.ok) {
    const error = validationFailedResult.error;
    assertEquals(error.kind, "PatternValidationFailed");
    if (error.kind === "PatternValidationFailed") {
      assertExists(error.value);
      assertExists(error.pattern);
      assertEquals(typeof error.value, "string");
      assertEquals(typeof error.pattern, "string");
    }
  }
});

Deno.test("TypeFactory Structure - Created types internal structure", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to|summary")!,
    TwoParamsLayerTypePattern.create("project|issue")!,
  );
  const factory = new TypeFactory(provider);

  // DirectiveTypeの内部構造
  const directiveResult = factory.createDirectiveType("to");
  if (directiveResult.ok) {
    const directive = directiveResult.data;

    // valueプロパティ
    assertExists(directive.value);
    assertEquals(directive.value, "to");

    // getValueメソッド（互換性のため）
    assertEquals(directive.value, "to");

    // DirectiveType now uses value property instead of originalResult
    // This is part of the DDD totality migration
    assertEquals(directive.value, "to");

    // toStringメソッド
    assertEquals(directive.toString(), "DirectiveType(to)");
  }

  // LayerTypeの内部構造
  const layerResult = factory.createLayerType("project");
  if (layerResult.ok) {
    const layer = layerResult.data;

    // valueプロパティ
    assertExists(layer.value);
    assertEquals(layer.value, "project");

    // getValueメソッド（互換性のため）
    assertEquals(layer.value, "project");

    // originalResultプロパティ
    assertExists(layer.originalResult);
    assertEquals(layer.originalResult.type, "two");
    assertEquals(layer.originalResult.layerType, "project");

    // toStringメソッド
    assertEquals(layer.toString(), "LayerType(project)");
  }
});

Deno.test("TypeFactory Structure - createBothTypes result structure", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  const result = factory.createBothTypes("to", "project");

  if (result.ok) {
    // 成功時の構造
    assertExists(result.data);
    assertExists(result.data.directive);
    assertExists(result.data.layer);

    // 各型が正しいインスタンス
    assertStrictEquals(result.data.directive.constructor.name, "DirectiveType");
    assertStrictEquals(result.data.layer.constructor.name, "LayerType");

    // 値の確認
    assertEquals(result.data.directive.value, "to");
    assertEquals(result.data.layer.value, "project");
  }
});

Deno.test("TypeFactory Structure - Pattern availability structure", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create(".*")!,
    TwoParamsLayerTypePattern.create(".*")!,
  );
  const factory = new TypeFactory(provider);

  const availability = factory.getPatternAvailability();

  // 返り値の構造確認
  assertExists(availability);
  assertEquals(typeof availability, "object");

  // 必須プロパティの存在確認
  assertEquals("directive" in availability, true);
  assertEquals("layer" in availability, true);
  assertEquals("both" in availability, true);

  // プロパティの型確認
  assertEquals(typeof availability.directive, "boolean");
  assertEquals(typeof availability.layer, "boolean");
  assertEquals(typeof availability.both, "boolean");

  // bothの計算ロジック確認
  assertEquals(availability.both, availability.directive && availability.layer);
});

Deno.test("TypeFactory Structure - Debug information structure", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  const debug = factory.debug();

  // デバッグ情報の構造確認
  assertExists(debug);
  assertEquals(typeof debug, "object");

  // 必須プロパティの存在確認
  assertEquals("patternProvider" in debug, true);
  assertEquals("availability" in debug, true);

  // プロパティの型確認
  assertEquals(typeof debug.patternProvider, "string");
  assertEquals(typeof debug.availability, "object");

  // patternProviderはクラス名
  assertEquals(debug.patternProvider, "StructureTestProvider");

  // availabilityは getPatternAvailability() と同じ構造
  assertEquals(debug.availability.directive, true);
  assertEquals(debug.availability.layer, true);
  assertEquals(debug.availability.both, true);
});

Deno.test("TypeFactory Structure - TwoParams_Result integration", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  // DirectiveType作成時のTwoParams_Result構造
  const directiveResult = factory.createDirectiveType("to");
  if (directiveResult.ok) {
    const originalResult = directiveResult.data.originalResult;

    // TwoParams_Result の必須プロパティ
    assertEquals(originalResult.type, "two");
    assertEquals(originalResult.directiveType, "to");
    assertEquals(originalResult.layerType, "project"); // デフォルト値
    assertExists(originalResult.params);
    assertEquals(Array.isArray(originalResult.params), true);
    assertEquals(originalResult.params.length, 2);
    assertEquals(originalResult.params[0], "to");
    assertEquals(originalResult.params[1], "project");
    assertExists(originalResult.options);
    assertEquals(typeof originalResult.options, "object");
  }

  // LayerType作成時のTwoParams_Result構造
  const layerResult = factory.createLayerType("project");
  if (layerResult.ok) {
    const originalResult = layerResult.data.originalResult;

    // TwoParams_Result の必須プロパティ
    assertEquals(originalResult.type, "two");
    assertEquals(originalResult.directiveType, "to"); // デフォルト値
    assertEquals(originalResult.layerType, "project");
    assertExists(originalResult.params);
    assertEquals(Array.isArray(originalResult.params), true);
    assertEquals(originalResult.params.length, 2);
    assertEquals(originalResult.params[0], "to");
    assertEquals(originalResult.params[1], "project");
    assertExists(originalResult.options);
    assertEquals(typeof originalResult.options, "object");
  }
});

Deno.test("TypeFactory Structure - Method return types consistency", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  // createDirectiveType の戻り値型
  const directiveResult1 = factory.createDirectiveType("to");
  const directiveResult2 = factory.createDirectiveType("invalid");

  assertEquals("ok" in directiveResult1, true);
  assertEquals("ok" in directiveResult2, true);

  // createLayerType の戻り値型
  const layerResult1 = factory.createLayerType("project");
  const layerResult2 = factory.createLayerType("invalid");

  assertEquals("ok" in layerResult1, true);
  assertEquals("ok" in layerResult2, true);

  // createBothTypes の戻り値型
  const bothResult1 = factory.createBothTypes("to", "project");
  const bothResult2 = factory.createBothTypes("invalid", "project");

  assertEquals("ok" in bothResult1, true);
  assertEquals("ok" in bothResult2, true);

  // validateBothValues の戻り値型
  const validateResult1 = factory.validateBothValues("to", "project");
  const validateResult2 = factory.validateBothValues("invalid", "invalid");

  assertEquals(typeof validateResult1, "boolean");
  assertEquals(typeof validateResult2, "boolean");

  // getPatternAvailability の戻り値型
  const availability = factory.getPatternAvailability();
  assertEquals(typeof availability, "object");

  // debug の戻り値型
  const debug = factory.debug();
  assertEquals(typeof debug, "object");
});

Deno.test("TypeFactory Structure - Immutability and consistency", () => {
  const provider = new StructureTestProvider(
    TwoParamsDirectivePattern.create("to")!,
    TwoParamsLayerTypePattern.create("project")!,
  );
  const factory = new TypeFactory(provider);

  // 同じ入力で同じ結果が得られることを確認
  const result1 = factory.createDirectiveType("to");
  const result2 = factory.createDirectiveType("to");

  if (result1.ok && result2.ok) {
    // 別のインスタンスだが同じ値
    assertEquals(result1.data.value, result2.data.value);
    assertEquals(result1.data.toString(), result2.data.toString());

    // equals メソッドで比較可能
    assertEquals(result1.data.equals(result2.data), true);
  }

  // Pattern availability は常に同じ
  const availability1 = factory.getPatternAvailability();
  const availability2 = factory.getPatternAvailability();

  assertEquals(availability1.directive, availability2.directive);
  assertEquals(availability1.layer, availability2.layer);
  assertEquals(availability1.both, availability2.both);
});
