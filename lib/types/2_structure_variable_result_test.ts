/**
 * Tests for variable_result.ts following Totality principle
 * 
 * This test suite validates the Result pattern implementation for variable operations
 * using comprehensive testing across architecture, behavior, and structure dimensions.
 */

import { assertEquals, assertStrictEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  type VariableError,
  type VariableResult,
  createSuccess,
  createError,
  createInvalidNameError,
  createEmptyValueError,
  createValidationFailedError,
  type ExtendedTwoParams_Result,
} from "./variable_result.ts";

// =============================================================================
// 0_architecture: Result型パターン、Smart Constructor、型安全性テスト
// =============================================================================

Deno.test("0_architecture: Result型の基本構造", () => {
  // Result型は正確に2つの状態を持つ（success か error）
  const successResult: VariableResult<string> = { ok: true, data: "test" };
  const errorResult: VariableResult<string> = { 
    ok: false, 
    error: { kind: "EmptyValue", variableName: "test", reason: "required" }
  };
  
  // Discriminated unionによる型安全性
  if (successResult.ok) {
    assertEquals(successResult.data, "test");
  }
  
  if (!errorResult.ok) {
    assertEquals(errorResult.error.kind, "EmptyValue");
  }
});

Deno.test("0_architecture: VariableError discriminated union", () => {
  // 3つの異なるエラー種別の型安全性を検証
  const invalidNameError: VariableError = {
    kind: "InvalidName",
    name: "invalid",
    validNames: ["valid1", "valid2"]
  };
  
  const emptyValueError: VariableError = {
    kind: "EmptyValue",
    variableName: "test",
    reason: "cannot be empty"
  };
  
  const validationFailedError: VariableError = {
    kind: "ValidationFailed",
    value: "invalid_value",
    constraint: "must match pattern"
  };
  
  // 型の判別が正しく機能することを確認
  assertEquals(invalidNameError.kind, "InvalidName");
  assertEquals(emptyValueError.kind, "EmptyValue");
  assertEquals(validationFailedError.kind, "ValidationFailed");
});

Deno.test("0_architecture: Smart Constructor pattern", () => {
  // createSuccess, createErrorは正しい形のResult型を生成する
  const success = createSuccess("data");
  const error = createError({ kind: "EmptyValue", variableName: "test", reason: "empty" });
  
  // 生成されたオブジェクトがResult型の制約を満たす
  assertEquals(success.ok, true);
  assertEquals(error.ok, false);
  
  // 型安全性の確認
  if (success.ok) {
    assertEquals(success.data, "data");
  }
  
  if (!error.ok) {
    assertEquals(error.error.kind, "EmptyValue");
  }
});

Deno.test("0_architecture: 網羅的なエラーハンドリング", () => {
  // 全てのエラー種別を処理する関数（defaultケース不要）
  function handleError(error: VariableError): string {
    switch (error.kind) {
      case "InvalidName":
        return `Invalid name: ${error.name}`;
      case "EmptyValue":
        return `Empty value for: ${error.variableName}`;
      case "ValidationFailed":
        return `Validation failed: ${error.value}`;
      // default不要（TypeScriptが網羅性をチェック）
    }
  }
  
  const errors: VariableError[] = [
    { kind: "InvalidName", name: "bad", validNames: ["good"] },
    { kind: "EmptyValue", variableName: "test", reason: "required" },
    { kind: "ValidationFailed", value: "bad", constraint: "pattern" }
  ];
  
  // 全てのエラーが適切に処理される
  errors.forEach(error => {
    const message = handleError(error);
    assertEquals(typeof message, "string");
    assertEquals(message.length > 0, true);
  });
});

// =============================================================================
// 1_behavior: createSuccess、createError、ヘルパー関数の動作テスト
// =============================================================================

Deno.test("1_behavior: createSuccess基本動作", () => {
  // 様々な型のデータでsuccessを作成
  const stringSuccess = createSuccess("test string");
  const numberSuccess = createSuccess(42);
  const objectSuccess = createSuccess({ key: "value" });
  const arraySuccess = createSuccess([1, 2, 3]);
  
  assertEquals(stringSuccess.ok, true);
  assertEquals(numberSuccess.ok, true);
  assertEquals(objectSuccess.ok, true);
  assertEquals(arraySuccess.ok, true);
  
  // データが正確に保持される
  if (stringSuccess.ok) assertEquals(stringSuccess.data, "test string");
  if (numberSuccess.ok) assertEquals(numberSuccess.data, 42);
  if (objectSuccess.ok) assertEquals(objectSuccess.data, { key: "value" });
  if (arraySuccess.ok) assertEquals(arraySuccess.data, [1, 2, 3]);
});

Deno.test("1_behavior: createError基本動作", () => {
  // 各種エラーでerrorを作成
  const errors: VariableError[] = [
    { kind: "InvalidName", name: "bad", validNames: ["good"] },
    { kind: "EmptyValue", variableName: "test", reason: "required" },
    { kind: "ValidationFailed", value: "bad", constraint: "pattern" }
  ];
  
  errors.forEach(errorData => {
    const result = createError<string>(errorData);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, errorData);
    }
  });
});

Deno.test("1_behavior: createInvalidNameError", () => {
  const validNames = ["directive1", "directive2", "directive3"] as const;
  const invalidName = "invalid_directive";
  
  const result = createInvalidNameError<string>(invalidName, validNames);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidName");
    if (result.error.kind === "InvalidName") {
      assertEquals(result.error.name, invalidName);
      assertEquals(result.error.validNames, validNames);
    }
  }
});

Deno.test("1_behavior: createEmptyValueError", () => {
  const variableName = "layer_type";
  const reason = "layer_type cannot be empty";
  
  const result = createEmptyValueError<string>(variableName, reason);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyValue");
    if (result.error.kind === "EmptyValue") {
      assertEquals(result.error.variableName, variableName);
      assertEquals(result.error.reason, reason);
    }
  }
});

Deno.test("1_behavior: createValidationFailedError", () => {
  const value = "invalid@pattern";
  const constraint = "must match [a-zA-Z_]+";
  
  const result = createValidationFailedError<string>(value, constraint);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ValidationFailed");
    if (result.error.kind === "ValidationFailed") {
      assertEquals(result.error.value, value);
      assertEquals(result.error.constraint, constraint);
    }
  }
});

Deno.test("1_behavior: ヘルパー関数のチェーン使用", () => {
  // 複数のヘルパー関数を組み合わせた実用的なパターン
  function validateVariable(name: string, value: string): VariableResult<string> {
    const validNames = ["directive_type", "layer_type"];
    
    if (!validNames.includes(name)) {
      return createInvalidNameError(name, validNames);
    }
    
    if (value.trim() === "") {
      return createEmptyValueError(name, "value cannot be empty");
    }
    
    if (!/^[a-zA-Z_]+$/.test(value)) {
      return createValidationFailedError(value, "must contain only letters and underscores");
    }
    
    return createSuccess(value);
  }
  
  // 正常ケース
  const validResult = validateVariable("directive_type", "to_summary");
  assertEquals(validResult.ok, true);
  
  // 無効な名前
  const invalidNameResult = validateVariable("invalid_name", "value");
  assertEquals(invalidNameResult.ok, false);
  if (!invalidNameResult.ok) {
    assertEquals(invalidNameResult.error.kind, "InvalidName");
  }
  
  // 空の値
  const emptyValueResult = validateVariable("directive_type", "  ");
  assertEquals(emptyValueResult.ok, false);
  if (!emptyValueResult.ok) {
    assertEquals(emptyValueResult.error.kind, "EmptyValue");
  }
  
  // バリデーション失敗
  const validationFailedResult = validateVariable("directive_type", "invalid-chars");
  assertEquals(validationFailedResult.ok, false);
  if (!validationFailedResult.ok) {
    assertEquals(validationFailedResult.error.kind, "ValidationFailed");
  }
});

// =============================================================================
// 2_structure: VariableError、型定義、データ構造テスト
// =============================================================================

Deno.test("2_structure: VariableError構造の完全性", () => {
  // InvalidNameエラーの構造
  const invalidNameError: VariableError = {
    kind: "InvalidName",
    name: "invalid",
    validNames: ["valid1", "valid2", "valid3"]
  };
  
  assertEquals(typeof invalidNameError.kind, "string");
  assertEquals(typeof invalidNameError.name, "string");
  assertEquals(Array.isArray(invalidNameError.validNames), true);
  assertEquals(invalidNameError.validNames.length > 0, true);
  
  // EmptyValueエラーの構造
  const emptyValueError: VariableError = {
    kind: "EmptyValue",
    variableName: "test_var",
    reason: "value is required"
  };
  
  assertEquals(typeof emptyValueError.kind, "string");
  assertEquals(typeof emptyValueError.variableName, "string");
  assertEquals(typeof emptyValueError.reason, "string");
  
  // ValidationFailedエラーの構造
  const validationFailedError: VariableError = {
    kind: "ValidationFailed",
    value: "bad_value",
    constraint: "must match pattern"
  };
  
  assertEquals(typeof validationFailedError.kind, "string");
  assertEquals(typeof validationFailedError.value, "string");
  assertEquals(typeof validationFailedError.constraint, "string");
});

Deno.test("2_structure: VariableResult型の構造", () => {
  // Success result structure
  const successResult: VariableResult<{ id: number; name: string }> = {
    ok: true,
    data: { id: 1, name: "test" }
  };
  
  assertEquals(typeof successResult.ok, "boolean");
  assertEquals(successResult.ok, true);
  assertEquals(typeof successResult.data, "object");
  assertEquals(successResult.data.id, 1);
  assertEquals(successResult.data.name, "test");
  
  // Error result structure
  const errorResult: VariableResult<string> = {
    ok: false,
    error: { kind: "EmptyValue", variableName: "test", reason: "empty" }
  };
  
  assertEquals(typeof errorResult.ok, "boolean");
  assertEquals(errorResult.ok, false);
  assertEquals(typeof errorResult.error, "object");
  assertEquals(errorResult.error.kind, "EmptyValue");
});

Deno.test("2_structure: ExtendedTwoParams_Result構造（deprecated）", () => {
  // deprecated型の構造が正しく定義されていることを確認
  const extendedResult: ExtendedTwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: { verbose: true, output: "stdout" }
  };
  
  assertEquals(extendedResult.type, "two");
  assertEquals(typeof extendedResult.demonstrativeType, "string");
  assertEquals(typeof extendedResult.layerType, "string");
  assertEquals(Array.isArray(extendedResult.params), true);
  assertEquals(extendedResult.params.length, 2);
  assertEquals(typeof extendedResult.options, "object");
});

Deno.test("2_structure: readonlyプロパティの不変性", () => {
  // validNamesがreadonlyであることの確認
  const validNames: readonly string[] = ["valid1", "valid2"];
  const error: VariableError = {
    kind: "InvalidName",
    name: "invalid",
    validNames
  };
  
  // readonlyなので変更できない（型レベルでの制約）
  // error.validNames.push("new_valid"); // TypeScriptエラーになる
  
  assertEquals(error.validNames.length, 2);
  assertEquals(error.validNames[0], "valid1");
  assertEquals(error.validNames[1], "valid2");
});

Deno.test("2_structure: 型の厳密性とnull安全性", () => {
  // undefinedやnullが入らないことの確認
  interface TestData {
    required: string;
    optional?: string;
  }
  
  const validData: TestData = { required: "test" };
  const result = createSuccess(validData);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.required, "test");
    assertEquals(result.data.optional, undefined);
  }
  
  // エラーオブジェクトのプロパティがnullでないことの確認
  const error = createInvalidNameError<TestData>("invalid", ["valid"]);
  assertEquals(error.ok, false);
  if (!error.ok && error.error.kind === "InvalidName") {
    assertEquals(typeof error.error.name, "string");
    assertEquals(error.error.name.length > 0, true);
    assertEquals(Array.isArray(error.error.validNames), true);
    assertEquals(error.error.validNames.length > 0, true);
  }
});

Deno.test("2_structure: ジェネリック型パラメータの動作", () => {
  // 異なる型でのResult型の動作確認
  
  // Primitive types
  const stringResult = createSuccess("test");
  const numberResult = createSuccess(42);
  const booleanResult = createSuccess(true);
  
  // Complex types
  interface ComplexType {
    nested: {
      array: number[];
      optional?: string;
    };
  }
  
  const complexData: ComplexType = {
    nested: {
      array: [1, 2, 3],
      optional: "value"
    }
  };
  
  const complexResult = createSuccess(complexData);
  
  // 型が正しく保持されている
  assertEquals(stringResult.ok, true);
  assertEquals(numberResult.ok, true);
  assertEquals(booleanResult.ok, true);
  assertEquals(complexResult.ok, true);
  
  if (complexResult.ok) {
    assertEquals(complexResult.data.nested.array.length, 3);
    assertEquals(complexResult.data.nested.optional, "value");
  }
});

Deno.test("2_structure: エラー情報の完全性", () => {
  // エラーオブジェクトが十分な情報を含んでいることの確認
  
  const errors = [
    createInvalidNameError("bad_name", ["good_name1", "good_name2"]),
    createEmptyValueError("variable_name", "detailed reason for emptiness"),
    createValidationFailedError("invalid_value", "detailed constraint description")
  ];
  
  errors.forEach(errorResult => {
    assertEquals(errorResult.ok, false);
    if (!errorResult.ok) {
      // kindは常に存在
      assertEquals(typeof errorResult.error.kind, "string");
      assertEquals(errorResult.error.kind.length > 0, true);
      
      // エラー種別に応じた追加情報の存在確認
      switch (errorResult.error.kind) {
        case "InvalidName":
          assertEquals(typeof errorResult.error.name, "string");
          assertEquals(Array.isArray(errorResult.error.validNames), true);
          assertEquals(errorResult.error.validNames.length > 0, true);
          break;
        case "EmptyValue":
          assertEquals(typeof errorResult.error.variableName, "string");
          assertEquals(typeof errorResult.error.reason, "string");
          assertEquals(errorResult.error.variableName.length > 0, true);
          assertEquals(errorResult.error.reason.length > 0, true);
          break;
        case "ValidationFailed":
          assertEquals(typeof errorResult.error.value, "string");
          assertEquals(typeof errorResult.error.constraint, "string");
          assertEquals(errorResult.error.constraint.length > 0, true);
          break;
      }
    }
  });
});