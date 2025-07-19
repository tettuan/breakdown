/**
 * @fileoverview TypeFactory Behavior Tests - 動作検証
 *
 * TypeFactoryの動作仕様を検証するテスト。
 * 正常系・異常系の動作、エラーハンドリング、境界値テストを実施。
 *
 * @module types/1_behavior_type_factory_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { TypeFactory, TypePatternProvider } from "./type_factory.ts";
import { TwoParamsDirectivePattern } from "./mod.ts";

/**
 * テスト用のパターンオブジェクト作成ヘルパー
 */
function createMockPattern(
  pattern: string,
): { test(value: string): boolean; getPattern(): string } {
  const regex = new RegExp(pattern);
  return {
    test: (value: string) => regex.test(value),
    getPattern: () => pattern,
  };
}

/**
 * テスト用のモックパターンプロバイダー
 */
class MockPatternProvider implements TypePatternProvider {
  constructor(
    private directivePattern: { test(value: string): boolean; getPattern(): string } | null,
    private layerPattern: { test(value: string): boolean; getPattern(): string } | null,
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
    if (this.directivePattern) {
      const pattern = this.directivePattern.getPattern();
      const match = pattern.match(/^\^?\(([^)]+)\)\$?$/);
      if (match) {
        return match[1].split("|");
      }
      return ["to", "summary", "defect"]; // Default when pattern exists but can't be parsed
    }
    return []; // Empty array when pattern is null
  }

  getValidLayerTypes(): readonly string[] {
    if (this.layerPattern) {
      const pattern = this.layerPattern.getPattern();
      const match = pattern.match(/^\^?\(([^)]+)\)\$?$/);
      if (match) {
        return match[1].split("|");
      }
      return ["project", "issue", "task"]; // Default when pattern exists but can't be parsed
    }
    return []; // Empty array when pattern is null
  }
}

Deno.test("TypeFactory Behavior - createDirectiveType success cases", () => {
  const directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  const provider = new MockPatternProvider(
    directivePattern,
    null,
  );
  const factory = new TypeFactory(provider);

  // 正常系：有効な値での構築
  const testCases = ["to", "summary", "defect"];

  for (const value of testCases) {
    const result = factory.createDirectiveType(value);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.data);
      assertEquals(result.data.value, value);
      assertEquals(result.data.value, value);
    }
  }
});

Deno.test("TypeFactory Behavior - createDirectiveType error cases", () => {
  // ケース1: パターンが見つからない
  const nullProvider = new MockPatternProvider(null, null);
  const factory1 = new TypeFactory(nullProvider);

  const result1 = factory1.createDirectiveType("any");
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "PatternValidationFailed");
    if (result1.error.kind === "PatternValidationFailed") {
      assertEquals(result1.error.value, "any");
      assertEquals(result1.error.pattern, "directive_type_pattern");
      assertEquals(result1.error.operation, "type_creation");
    }
  }

  // ケース2: バリデーション失敗
  const strictProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to|summary)$"),
    null,
  );
  const factory2 = new TypeFactory(strictProvider);

  const result2 = factory2.createDirectiveType("invalid");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "PatternValidationFailed");
    if (result2.error.kind === "PatternValidationFailed") {
      assertEquals(result2.error.value, "invalid");
      assertEquals(result2.error.pattern, "directive_type_pattern");
      assertEquals(result2.error.operation, "type_creation");
    }
  }
});

Deno.test("TypeFactory Behavior - createLayerType success cases", () => {
  const provider = new MockPatternProvider(
    null,
    createMockPattern("^(project|issue|task|bugs)$"),
  );
  const factory = new TypeFactory(provider);

  // 正常系：有効な値での構築
  const testCases = ["project", "issue", "task", "bugs"];

  for (const value of testCases) {
    const result = factory.createLayerType(value);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.data);
      assertEquals(result.data.value, value);
      assertEquals(result.data.toString(), value);
    }
  }
});

Deno.test("TypeFactory Behavior - createLayerType error cases", () => {
  // ケース1: パターンが見つからない
  const nullProvider = new MockPatternProvider(null, null);
  const factory1 = new TypeFactory(nullProvider);

  const result1 = factory1.createLayerType("any");
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "PatternValidationFailed");
    if (result1.error.kind === "PatternValidationFailed") {
      assertEquals(result1.error.value, "any");
      assertEquals(result1.error.pattern, "layer_type_pattern");
      assertEquals(result1.error.operation, "type_creation");
    }
  }

  // ケース2: バリデーション失敗
  const strictProvider = new MockPatternProvider(
    null,
    createMockPattern("^(project|issue)$"),
  );
  const factory2 = new TypeFactory(strictProvider);

  const result2 = factory2.createLayerType("task");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "PatternValidationFailed");
    if (result2.error.kind === "PatternValidationFailed") {
      assertEquals(result2.error.value, "task");
      assertEquals(result2.error.pattern, "layer_type_pattern");
      assertEquals(result2.error.operation, "type_creation");
    }
  }
});

Deno.test("TypeFactory Behavior - createBothTypes success and error propagation", () => {
  const provider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to|summary)$"),
    createMockPattern("^(project|issue)$"),
  );
  const factory = new TypeFactory(provider);

  // 正常系：両方とも有効
  const result1 = factory.createBothTypes("to", "project");
  assertEquals(result1.ok, true);
  if (result1.ok) {
    assertEquals(result1.data.directive.value, "to");
    assertEquals(result1.data.layer.value, "project");
  }

  // エラー系1：DirectiveTypeが無効
  const result2 = factory.createBothTypes("invalid", "project");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "PatternValidationFailed");
    if (result2.error.kind === "PatternValidationFailed") {
      assertEquals(result2.error.value, "invalid");
    }
  }

  // エラー系2：LayerTypeが無効
  const result3 = factory.createBothTypes("to", "invalid");
  assertEquals(result3.ok, false);
  if (!result3.ok) {
    assertEquals(result3.error.kind, "PatternValidationFailed");
    if (result3.error.kind === "PatternValidationFailed") {
      assertEquals(result3.error.value, "invalid");
    }
  }

  // エラー系3：両方とも無効（DirectiveTypeのエラーが先に返される）
  const result4 = factory.createBothTypes("invalid1", "invalid2");
  assertEquals(result4.ok, false);
  if (!result4.ok) {
    assertEquals(result4.error.kind, "PatternValidationFailed");
    if (result4.error.kind === "PatternValidationFailed") {
      assertEquals(result4.error.value, "invalid1");
    }
  }
});

Deno.test("TypeFactory Behavior - validateBothValues behavior", () => {
  // ケース1：両方のパターンが存在
  const fullProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to|summary)$"),
    createMockPattern("^(project|issue)$"),
  );
  const factory1 = new TypeFactory(fullProvider);

  assertEquals(factory1.validateBothValues("to", "project"), true);
  assertEquals(factory1.validateBothValues("summary", "issue"), true);
  assertEquals(factory1.validateBothValues("invalid", "project"), false);
  assertEquals(factory1.validateBothValues("to", "invalid"), false);
  assertEquals(factory1.validateBothValues("invalid", "invalid"), false);

  // ケース2：DirectivePatternが存在しない
  const noDirectiveProvider = new MockPatternProvider(
    null,
    createMockPattern("^(project|issue)$"),
  );
  const factory2 = new TypeFactory(noDirectiveProvider);

  assertEquals(factory2.validateBothValues("to", "project"), false);

  // ケース3：LayerPatternが存在しない
  const noLayerProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to|summary)$"),
    null,
  );
  const factory3 = new TypeFactory(noLayerProvider);

  assertEquals(factory3.validateBothValues("to", "project"), false);

  // ケース4：両方とも存在しない
  const nullProvider = new MockPatternProvider(null, null);
  const factory4 = new TypeFactory(nullProvider);

  assertEquals(factory4.validateBothValues("to", "project"), false);
});

Deno.test("TypeFactory Behavior - getPatternAvailability behavior", () => {
  // ケース1：両方のパターンが利用可能
  const fullProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create(".*"),
    createMockPattern(".*"),
  );
  const factory1 = new TypeFactory(fullProvider);
  const availability1 = factory1.getPatternAvailability();

  assertEquals(availability1.directive, true);
  assertEquals(availability1.layer, true);
  assertEquals(availability1.both, true);

  // ケース2：DirectivePatternのみ利用可能
  const directiveOnlyProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create(".*"),
    null,
  );
  const factory2 = new TypeFactory(directiveOnlyProvider);
  const availability2 = factory2.getPatternAvailability();

  assertEquals(availability2.directive, true);
  assertEquals(availability2.layer, false);
  assertEquals(availability2.both, false);

  // ケース3：LayerPatternのみ利用可能
  const layerOnlyProvider = new MockPatternProvider(
    null,
    createMockPattern(".*"),
  );
  const factory3 = new TypeFactory(layerOnlyProvider);
  const availability3 = factory3.getPatternAvailability();

  assertEquals(availability3.directive, false);
  assertEquals(availability3.layer, true);
  assertEquals(availability3.both, false);

  // ケース4：どちらも利用不可
  const nullProvider = new MockPatternProvider(null, null);
  const factory4 = new TypeFactory(nullProvider);
  const availability4 = factory4.getPatternAvailability();

  assertEquals(availability4.directive, false);
  assertEquals(availability4.layer, false);
  assertEquals(availability4.both, false);
});

Deno.test("TypeFactory Behavior - debug method behavior", () => {
  const provider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to)$"),
    createMockPattern("^(project)$"),
  );
  const factory = new TypeFactory(provider);

  const debug = factory.debug();

  assertEquals(debug.patternProvider, "MockPatternProvider");
  assertExists(debug.availability);
  assertEquals(debug.availability.directive, true);
  assertEquals(debug.availability.layer, true);
  assertEquals(debug.availability.both, true);
});

Deno.test("TypeFactory Behavior - edge cases and boundary values", () => {
  const provider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^[a-z]+$"),
    createMockPattern("^[a-z]+$"),
  );
  const factory = new TypeFactory(provider);

  // 空文字列
  const emptyResult = factory.createDirectiveType("");
  assertEquals(emptyResult.ok, false);

  // 特殊文字
  const specialChars = ["@", "#", "$", "%", "^", "&", "*", "(", ")"];
  for (const char of specialChars) {
    const result = factory.createDirectiveType(char);
    assertEquals(result.ok, false);
  }

  // 大文字（パターンは小文字のみ）
  const upperResult = factory.createDirectiveType("TO");
  assertEquals(upperResult.ok, false);

  // 数字を含む
  const withNumberResult = factory.createDirectiveType("to123");
  assertEquals(withNumberResult.ok, false);

  // スペースを含む
  const withSpaceResult = factory.createDirectiveType("to project");
  assertEquals(withSpaceResult.ok, false);
});

Deno.test("TypeFactory Behavior - complex pattern validation", () => {
  // 複雑なパターンでの動作確認
  const complexProvider = new MockPatternProvider(
    TwoParamsDirectivePattern.create("^(to|summary|defect)$"),
    createMockPattern("^(project|issue|task|bugs)$"),
  );
  const factory = new TypeFactory(complexProvider);

  // 正常系の組み合わせ
  const validCombinations = [
    ["to", "project"],
    ["summary", "issue"],
    ["defect", "task"],
    ["to", "bugs"],
    ["summary", "project"],
    ["defect", "issue"],
  ];

  for (const [directive, layer] of validCombinations) {
    const result = factory.createBothTypes(directive, layer);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, directive);
      assertEquals(result.data.layer.value, layer);
    }
  }

  // 無効な組み合わせ
  const invalidCombinations = [
    ["convert", "project"], // 無効なdirective
    ["to", "module"], // 無効なlayer
    ["", ""], // 空文字列
  ];

  for (const [directive, layer] of invalidCombinations) {
    const result = factory.createBothTypes(directive, layer);
    assertEquals(result.ok, false);
  }
});
