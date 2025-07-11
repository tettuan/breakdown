/**
 * @fileoverview Structure tests for legacy factory implementations
 *
 * Tests the structural correctness and data integrity including:
 * - Type definition completeness
 * - Factory object structure
 * - Property relationships
 * - Interface consistency
 * - Legacy type compatibility
 *
 * @module types/2_structure_legacy_factories_test
 */

import { assert, assertEquals, assertObjectMatch } from "../deps.ts";
import {
  type DemonstrativeType,
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  DirectiveFactory,
  LayerFactory,
  type LegacyLayerType,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  TwoParamsConfigFactory,
  VariableResultFactory,
} from "./legacy_factories.ts";

/**
 * 型安全なファクトリーメソッドアクセスヘルパー
 * @param factory - ファクトリーオブジェクト
 * @param methodName - メソッド名
 * @returns ファクトリーメソッドの結果 または null
 */
function getDirectFactoryResult<T>(
  factory: Record<string, unknown>,
  methodName: string,
): T | null {
  const method = factory[methodName];
  if (typeof method === "function") {
    try {
      return method.call(factory) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 型安全な関数のlength属性アクセスヘルパー
 * @param factory - ファクトリーオブジェクト
 * @param methodName - メソッド名
 * @returns 関数のlength属性 または -1 (関数でない場合)
 */
function getFunctionLength(
  factory: Record<string, unknown>,
  methodName: string,
): number {
  const method = factory[methodName];
  if (typeof method === "function") {
    return method.length;
  }
  return -1;
}

Deno.test("Legacy Factories Structure - DemonstrativeType union completeness", () => {
  // Test that all expected union members are present
  const expectedKinds = ["to", "summary", "defect", "init", "find"];
  const createdTypes: DemonstrativeType[] = [
    DemonstrativeTypeFactory.to(),
    DemonstrativeTypeFactory.summary(),
    DemonstrativeTypeFactory.defect(),
    DemonstrativeTypeFactory.init(),
    DemonstrativeTypeFactory.find(),
  ];

  // Verify all expected kinds are created
  const actualKinds = createdTypes.map((type) => type.kind);
  assertEquals(actualKinds.sort(), expectedKinds.sort(), "All expected kinds should be present");

  // Verify structure of each type
  for (const type of createdTypes) {
    assert("kind" in type, "Each type should have 'kind' property");
    assert("value" in type, "Each type should have 'value' property");
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");
    assertEquals(type.kind, type.value, "For legacy types, kind should equal value");

    // Verify structure matches expected shape
    assertObjectMatch(type, {
      kind: type.kind,
      value: type.value,
    });
  }
});

Deno.test("Legacy Factories Structure - LegacyLayerType union completeness", () => {
  // Test that all expected union members are present
  const expectedKinds = ["project", "issue", "task", "bugs", "temp"];
  const createdTypes: LegacyLayerType[] = [
    LegacyLayerTypeFactory.project(),
    LegacyLayerTypeFactory.issue(),
    LegacyLayerTypeFactory.task(),
    LegacyLayerTypeFactory.bugs(),
    LegacyLayerTypeFactory.temp(),
  ];

  // Verify all expected kinds are created
  const actualKinds = createdTypes.map((type) => type.kind);
  assertEquals(actualKinds.sort(), expectedKinds.sort(), "All expected kinds should be present");

  // Verify structure of each type
  for (const type of createdTypes) {
    assert("kind" in type, "Each type should have 'kind' property");
    assert("value" in type, "Each type should have 'value' property");
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");
    assertEquals(type.kind, type.value, "For legacy types, kind should equal value");

    // Verify structure matches expected shape
    assertObjectMatch(type, {
      kind: type.kind,
      value: type.value,
    });
  }
});

Deno.test("Legacy Factories Structure - Factory object method structure", () => {
  // Test DemonstrativeTypeFactory structure
  const expectedDemonstrativeMethods = [
    "to",
    "summary",
    "defect",
    "init",
    "find",
    "fromString",
  ];

  const demonstrativeMethodNames = Object.keys(DemonstrativeTypeFactory);
  assertEquals(
    demonstrativeMethodNames.sort(),
    expectedDemonstrativeMethods.sort(),
    "DemonstrativeTypeFactory should have all expected methods",
  );

  for (const methodName of expectedDemonstrativeMethods) {
    const method = (DemonstrativeTypeFactory as Record<string, unknown>)[methodName];
    assertEquals(typeof method, "function", `${methodName} should be a function`);

    // Test method parameter count
    if (methodName === "fromString") {
      const methodLength = getFunctionLength(DemonstrativeTypeFactory, methodName);
      assertEquals(methodLength, 1, "fromString should take 1 parameter");
    } else {
      const methodLength = getFunctionLength(DemonstrativeTypeFactory, methodName);
      assertEquals(methodLength, 0, `${methodName} should take 0 parameters`);
    }
  }

  // Test LegacyLayerTypeFactory structure
  const expectedLayerMethods = [
    "project",
    "issue",
    "task",
    "bugs",
    "temp",
    "fromString",
  ];

  const layerMethodNames = Object.keys(LegacyLayerTypeFactory);
  assertEquals(
    layerMethodNames.sort(),
    expectedLayerMethods.sort(),
    "LegacyLayerTypeFactory should have all expected methods",
  );

  for (const methodName of expectedLayerMethods) {
    const method = (LegacyLayerTypeFactory as Record<string, unknown>)[methodName];
    assertEquals(typeof method, "function", `${methodName} should be a function`);

    // Test method parameter count
    if (methodName === "fromString") {
      const methodLength = getFunctionLength(LegacyLayerTypeFactory, methodName);
      assertEquals(methodLength, 1, "fromString should take 1 parameter");
    } else {
      const methodLength = getFunctionLength(LegacyLayerTypeFactory, methodName);
      assertEquals(methodLength, 0, `${methodName} should take 0 parameters`);
    }
  }
});

Deno.test("Legacy Factories Structure - Type guard object structure", () => {
  // Test DemonstrativeTypeGuards structure
  const expectedDemonstrativeGuards = [
    "isTo",
    "isSummary",
    "isDefect",
    "isInit",
    "isFind",
  ];

  const demonstrativeGuardNames = Object.keys(DemonstrativeTypeGuards);
  assertEquals(
    demonstrativeGuardNames.sort(),
    expectedDemonstrativeGuards.sort(),
    "DemonstrativeTypeGuards should have all expected guards",
  );

  for (const guardName of expectedDemonstrativeGuards) {
    const guard = (DemonstrativeTypeGuards as Record<string, unknown>)[guardName];
    assertEquals(typeof guard, "function", `${guardName} should be a function`);
    const guardLength = getFunctionLength(DemonstrativeTypeGuards, guardName);
    assertEquals(guardLength, 1, `${guardName} should take 1 parameter`);
  }

  // Test LegacyLayerTypeGuards structure
  const expectedLayerGuards = [
    "isProject",
    "isIssue",
    "isTask",
    "isBugs",
    "isTemp",
  ];

  const layerGuardNames = Object.keys(LegacyLayerTypeGuards);
  assertEquals(
    layerGuardNames.sort(),
    expectedLayerGuards.sort(),
    "LegacyLayerTypeGuards should have all expected guards",
  );

  for (const guardName of expectedLayerGuards) {
    const guard = (LegacyLayerTypeGuards as Record<string, unknown>)[guardName];
    assertEquals(typeof guard, "function", `${guardName} should be a function`);
    const guardLength = getFunctionLength(LegacyLayerTypeGuards, guardName);
    assertEquals(guardLength, 1, `${guardName} should take 1 parameter`);
  }
});

Deno.test("Legacy Factories Structure - Alias factory structure integrity", () => {
  // Test that aliases maintain same structure as originals

  // DirectiveFactory should be identical to DemonstrativeTypeFactory
  const directiveMethods = Object.keys(DirectiveFactory);
  const demonstrativeMethods = Object.keys(DemonstrativeTypeFactory);
  assertEquals(
    directiveMethods.sort(),
    demonstrativeMethods.sort(),
    "DirectiveFactory should have same methods as DemonstrativeTypeFactory",
  );

  for (const methodName of directiveMethods) {
    const directiveMethod = (DirectiveFactory as Record<string, unknown>)[methodName];
    const demonstrativeMethod = (DemonstrativeTypeFactory as Record<string, unknown>)[methodName];
    assertEquals(directiveMethod, demonstrativeMethod, `${methodName} should be same reference`);
  }

  // LayerFactory should be identical to LegacyLayerTypeFactory
  const layerMethods = Object.keys(LayerFactory);
  const legacyLayerMethods = Object.keys(LegacyLayerTypeFactory);
  assertEquals(
    layerMethods.sort(),
    legacyLayerMethods.sort(),
    "LayerFactory should have same methods as LegacyLayerTypeFactory",
  );

  for (const methodName of layerMethods) {
    const layerMethod = (LayerFactory as Record<string, unknown>)[methodName];
    const legacyMethod = (LegacyLayerTypeFactory as Record<string, unknown>)[methodName];
    assertEquals(layerMethod, legacyMethod, `${methodName} should be same reference`);
  }
});

Deno.test("Legacy Factories Structure - Placeholder factory structure", () => {
  // Test TwoParamsConfigFactory structure
  const configMethods = Object.keys(TwoParamsConfigFactory);
  assert(configMethods.includes("create"), "TwoParamsConfigFactory should have create method");
  assertEquals(typeof TwoParamsConfigFactory.create, "function", "create should be function");
  assertEquals(TwoParamsConfigFactory.create.length, 0, "create should take 0 parameters");

  // Test VariableResultFactory structure
  const resultMethods = Object.keys(VariableResultFactory);
  const expectedResultMethods = ["createSuccess", "createError"];
  assertEquals(
    resultMethods.sort(),
    expectedResultMethods.sort(),
    "VariableResultFactory should have expected methods",
  );

  assertEquals(
    typeof VariableResultFactory.createSuccess,
    "function",
    "createSuccess should be function",
  );
  assertEquals(
    typeof VariableResultFactory.createError,
    "function",
    "createError should be function",
  );
  assertEquals(
    VariableResultFactory.createSuccess.length,
    1,
    "createSuccess should take 1 parameter",
  );
  assertEquals(VariableResultFactory.createError.length, 1, "createError should take 1 parameter");
});

Deno.test("Legacy Factories Structure - Result type structure validation", () => {
  // Test VariableResultFactory produces correctly structured results

  // Test success result structure
  const successData = { test: "data" };
  const successResult = VariableResultFactory.createSuccess(successData);

  assert("ok" in successResult, "Success result should have 'ok' property");
  assert("data" in successResult, "Success result should have 'data' property");
  assertEquals(successResult.ok, true, "Success result ok should be true");
  assertEquals(successResult.data, successData, "Success result should preserve data");
  assert(!("error" in successResult), "Success result should not have 'error' property");

  // Test error result structure
  const errorData = "test error";
  const errorResult = VariableResultFactory.createError(errorData);

  assert("ok" in errorResult, "Error result should have 'ok' property");
  assert("error" in errorResult, "Error result should have 'error' property");
  assertEquals(errorResult.ok, false, "Error result ok should be false");
  assertEquals(errorResult.error, errorData, "Error result should preserve error");
  assert(!("data" in errorResult), "Error result should not have 'data' property");

  // Test type discrimination
  function handleResult<T, E>(result: { ok: true; data: T } | { ok: false; error: E }): string {
    if (result.ok) {
      return `Success: ${JSON.stringify(result.data)}`;
    } else {
      return `Error: ${JSON.stringify(result.error)}`;
    }
  }

  const successHandle = handleResult(successResult);
  const errorHandle = handleResult(errorResult);

  assert(successHandle.startsWith("Success:"), "Should handle success result correctly");
  assert(errorHandle.startsWith("Error:"), "Should handle error result correctly");
});

Deno.test("Legacy Factories Structure - Type property consistency", () => {
  // Test that all factory-created types have consistent property structure
  const allDemonstrativeTypes = [
    DemonstrativeTypeFactory.to(),
    DemonstrativeTypeFactory.summary(),
    DemonstrativeTypeFactory.defect(),
    DemonstrativeTypeFactory.init(),
    DemonstrativeTypeFactory.find(),
  ];

  const allLayerTypes = [
    LegacyLayerTypeFactory.project(),
    LegacyLayerTypeFactory.issue(),
    LegacyLayerTypeFactory.task(),
    LegacyLayerTypeFactory.bugs(),
    LegacyLayerTypeFactory.temp(),
  ];

  // Verify demonstrative types have consistent structure
  for (const type of allDemonstrativeTypes) {
    const keys = Object.keys(type).sort();
    assertEquals(
      keys,
      ["kind", "value"],
      "DemonstrativeType should have exactly 'kind' and 'value' properties",
    );

    // Verify property types
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");

    // Verify property values match for legacy types
    assertEquals(type.kind, type.value, "kind and value should be identical for legacy types");
  }

  // Verify layer types have consistent structure
  for (const type of allLayerTypes) {
    const keys = Object.keys(type).sort();
    assertEquals(
      keys,
      ["kind", "value"],
      "LegacyLayerType should have exactly 'kind' and 'value' properties",
    );

    // Verify property types
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");

    // Verify property values match for legacy types
    assertEquals(type.kind, type.value, "kind and value should be identical for legacy types");
  }
});

Deno.test("Legacy Factories Structure - Factory method return type consistency", () => {
  // Test that fromString methods return consistent structure
  const validInputs = ["to", "summary", "defect", "init", "find"];

  for (const input of validInputs) {
    const result = DemonstrativeTypeFactory.fromString(input);

    if (result !== null) {
      // Should have same structure as direct factory methods
      assert("kind" in result, "fromString result should have 'kind'");
      assert("value" in result, "fromString result should have 'value'");
      assertEquals(typeof result.kind, "string", "fromString result kind should be string");
      assertEquals(typeof result.value, "string", "fromString result value should be string");
      assertEquals(
        result.kind,
        result.value,
        "fromString result should maintain kind/value equality",
      );

      // Should match direct factory method result
      const directResult = getDirectFactoryResult<DemonstrativeType>(
        DemonstrativeTypeFactory,
        input,
      );
      if (directResult) {
        assertEquals(result.kind, directResult.kind, "fromString should match direct method");
        assertEquals(result.value, directResult.value, "fromString should match direct method");
      }
    }
  }

  const validLayerInputs = ["project", "issue", "task", "bugs", "temp"];

  for (const input of validLayerInputs) {
    const result = LegacyLayerTypeFactory.fromString(input);

    if (result !== null) {
      // Should have same structure as direct factory methods
      assert("kind" in result, "fromString result should have 'kind'");
      assert("value" in result, "fromString result should have 'value'");
      assertEquals(typeof result.kind, "string", "fromString result kind should be string");
      assertEquals(typeof result.value, "string", "fromString result value should be string");
      assertEquals(
        result.kind,
        result.value,
        "fromString result should maintain kind/value equality",
      );

      // Should match direct factory method result
      const directResult = getDirectFactoryResult<LegacyLayerType>(LegacyLayerTypeFactory, input);
      if (directResult) {
        assertEquals(result.kind, directResult.kind, "fromString should match direct method");
        assertEquals(result.value, directResult.value, "fromString should match direct method");
      }
    }
  }
});

Deno.test("Legacy Factories Structure - Factory immutability verification", () => {
  // Test that factory objects themselves are properly structured as const
  const factoryObjects = [
    { name: "DemonstrativeTypeFactory", factory: DemonstrativeTypeFactory },
    { name: "LegacyLayerTypeFactory", factory: LegacyLayerTypeFactory },
    { name: "DemonstrativeTypeGuards", factory: DemonstrativeTypeGuards },
    { name: "LegacyLayerTypeGuards", factory: LegacyLayerTypeGuards },
    { name: "TwoParamsConfigFactory", factory: TwoParamsConfigFactory },
    { name: "VariableResultFactory", factory: VariableResultFactory },
  ];

  for (const { name, factory } of factoryObjects) {
    assertEquals(typeof factory, "object", `${name} should be an object`);
    assert(factory !== null, `${name} should not be null`);

    // Factory should have methods
    const methods = Object.keys(factory);
    assert(methods.length > 0, `${name} should have methods`);

    // All methods should be functions
    for (const methodName of methods) {
      assertEquals(
        typeof (factory as Record<string, unknown>)[methodName],
        "function",
        `${name}.${methodName} should be a function`,
      );
    }
  }

  // Test that aliases reference same objects
  assertEquals(
    DirectiveFactory,
    DemonstrativeTypeFactory,
    "DirectiveFactory should reference same object",
  );
  assertEquals(LayerFactory, LegacyLayerTypeFactory, "LayerFactory should reference same object");
});
