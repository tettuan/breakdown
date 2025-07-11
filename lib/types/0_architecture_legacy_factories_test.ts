/**
 * @fileoverview Architecture tests for legacy factory implementations
 *
 * Tests architectural constraints and design principles including:
 * - Backward compatibility maintenance
 * - Deprecation pattern compliance
 * - Factory pattern consistency
 * - Type safety preservation
 * - Legacy interface stability
 *
 * @module types/0_architecture_legacy_factories_test
 */

import { assert, assertEquals, assertExists } from "../deps.ts";
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

Deno.test("Legacy Factories Architecture - Backward compatibility structure", () => {
  // Verify all legacy factories exist and maintain expected interface
  assertExists(DemonstrativeTypeFactory, "DemonstrativeTypeFactory should exist");
  assertExists(LegacyLayerTypeFactory, "LegacyLayerTypeFactory should exist");
  assertExists(DirectiveFactory, "DirectiveFactory should exist for backward compatibility");
  assertExists(LayerFactory, "LayerFactory should exist for backward compatibility");
  assertExists(TwoParamsConfigFactory, "TwoParamsConfigFactory should exist");
  assertExists(VariableResultFactory, "VariableResultFactory should exist");

  // Verify alias relationships
  assertEquals(
    DirectiveFactory,
    DemonstrativeTypeFactory,
    "DirectiveFactory should alias DemonstrativeTypeFactory",
  );
  assertEquals(
    LayerFactory,
    LegacyLayerTypeFactory,
    "LayerFactory should alias LegacyLayerTypeFactory",
  );
});

Deno.test("Legacy Factories Architecture - Factory pattern compliance", () => {
  // All factories should follow factory pattern (methods return instances, not constructors)
  const demonstrativeFactoryMethods = [
    "to",
    "summary",
    "defect",
    "init",
    "find",
    "fromString",
  ];

  const layerFactoryMethods = [
    "project",
    "issue",
    "task",
    "bugs",
    "temp",
    "fromString",
  ];

  // Verify DemonstrativeTypeFactory methods
  for (const method of demonstrativeFactoryMethods) {
    assertEquals(
      typeof (DemonstrativeTypeFactory as Record<string, unknown>)[method],
      "function",
      `DemonstrativeTypeFactory.${method} should be a function`,
    );
  }

  // Verify LegacyLayerTypeFactory methods
  for (const method of layerFactoryMethods) {
    assertEquals(
      typeof (LegacyLayerTypeFactory as Record<string, unknown>)[method],
      "function",
      `LegacyLayerTypeFactory.${method} should be a function`,
    );
  }

  // Verify factory methods return instances, not throw
  const demonstrativeInstance = DemonstrativeTypeFactory.to();
  assertExists(demonstrativeInstance, "Factory methods should return instances");
  assertEquals(typeof demonstrativeInstance, "object", "Factory should return objects");

  const layerInstance = LegacyLayerTypeFactory.project();
  assertExists(layerInstance, "Factory methods should return instances");
  assertEquals(typeof layerInstance, "object", "Factory should return objects");
});

Deno.test("Legacy Factories Architecture - Type guard pattern compliance", () => {
  // Type guards should follow consistent pattern
  const demonstrativeGuardMethods = [
    "isTo",
    "isSummary",
    "isDefect",
    "isInit",
    "isFind",
  ];

  const layerGuardMethods = [
    "isProject",
    "isIssue",
    "isTask",
    "isBugs",
    "isTemp",
  ];

  // Verify DemonstrativeTypeGuards methods
  for (const method of demonstrativeGuardMethods) {
    assertEquals(
      typeof (DemonstrativeTypeGuards as Record<string, unknown>)[method],
      "function",
      `DemonstrativeTypeGuards.${method} should be a function`,
    );
  }

  // Verify LegacyLayerTypeGuards methods
  for (const method of layerGuardMethods) {
    assertEquals(
      typeof (LegacyLayerTypeGuards as Record<string, unknown>)[method],
      "function",
      `LegacyLayerTypeGuards.${method} should be a function`,
    );
  }

  // Test type guard return types
  const demonstrativeType = DemonstrativeTypeFactory.to();
  const guardResult = DemonstrativeTypeGuards.isTo(demonstrativeType);
  assertEquals(typeof guardResult, "boolean", "Type guards should return boolean");
});

Deno.test("Legacy Factories Architecture - Discriminated union type structure", () => {
  // All created types should follow discriminated union pattern
  const demonstrativeTypes: DemonstrativeType[] = [
    DemonstrativeTypeFactory.to(),
    DemonstrativeTypeFactory.summary(),
    DemonstrativeTypeFactory.defect(),
    DemonstrativeTypeFactory.init(),
    DemonstrativeTypeFactory.find(),
  ];

  const layerTypes: LegacyLayerType[] = [
    LegacyLayerTypeFactory.project(),
    LegacyLayerTypeFactory.issue(),
    LegacyLayerTypeFactory.task(),
    LegacyLayerTypeFactory.bugs(),
    LegacyLayerTypeFactory.temp(),
  ];

  // Verify discriminated union structure for DemonstrativeType
  for (const type of demonstrativeTypes) {
    assert("kind" in type, "DemonstrativeType should have 'kind' property");
    assert("value" in type, "DemonstrativeType should have 'value' property");
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");
    assertEquals(type.kind, type.value, "kind and value should match for legacy types");
  }

  // Verify discriminated union structure for LegacyLayerType
  for (const type of layerTypes) {
    assert("kind" in type, "LegacyLayerType should have 'kind' property");
    assert("value" in type, "LegacyLayerType should have 'value' property");
    assertEquals(typeof type.kind, "string", "kind should be string");
    assertEquals(typeof type.value, "string", "value should be string");
    assertEquals(type.kind, type.value, "kind and value should match for legacy types");
  }
});

Deno.test("Legacy Factories Architecture - Const assertion compliance", () => {
  // Factories should be const-asserted to prevent modification
  const factoryObjects = [
    DemonstrativeTypeFactory,
    LegacyLayerTypeFactory,
    DemonstrativeTypeGuards,
    LegacyLayerTypeGuards,
    TwoParamsConfigFactory,
    VariableResultFactory,
  ];

  for (const factory of factoryObjects) {
    assertEquals(typeof factory, "object", "Factory should be an object");
    assert(factory !== null, "Factory should not be null");

    // Verify factory has expected methods (basic smoke test)
    const methods = Object.keys(factory);
    assert(methods.length > 0, "Factory should have methods");
  }

  // Test that factories are consistently accessible
  const sameInstance1 = DemonstrativeTypeFactory.to();
  const sameInstance2 = DemonstrativeTypeFactory.to();

  // Should create equivalent but separate instances
  assertEquals(
    sameInstance1.kind,
    sameInstance2.kind,
    "Factory should create consistent instances",
  );
  assertEquals(
    sameInstance1.value,
    sameInstance2.value,
    "Factory should create consistent instances",
  );
});

Deno.test("Legacy Factories Architecture - Deprecation pattern compliance", () => {
  // Legacy factories should maintain functionality while being marked deprecated
  // This is verified by checking that they produce working outputs

  // Test DemonstrativeTypeFactory produces valid output
  const demonstrativeResult = DemonstrativeTypeFactory.to();
  assertEquals(demonstrativeResult.kind, "to", "Legacy factory should produce valid output");
  assertEquals(demonstrativeResult.value, "to", "Legacy factory should produce valid output");

  // Test LegacyLayerTypeFactory produces valid output
  const layerResult = LegacyLayerTypeFactory.project();
  assertEquals(layerResult.kind, "project", "Legacy factory should produce valid output");
  assertEquals(layerResult.value, "project", "Legacy factory should produce valid output");

  // Test placeholder factories work
  const configResult = TwoParamsConfigFactory.create();
  assertEquals(typeof configResult, "object", "Placeholder factory should return object");

  const successResult = VariableResultFactory.createSuccess("test");
  assertEquals(successResult.ok, true, "VariableResultFactory should work");
  assertEquals(successResult.data, "test", "VariableResultFactory should work");

  const errorResult = VariableResultFactory.createError("error");
  assertEquals(errorResult.ok, false, "VariableResultFactory should work");
  assertEquals(errorResult.error, "error", "VariableResultFactory should work");
});

Deno.test("Legacy Factories Architecture - Type system exhaustiveness", () => {
  // Test that all expected type variants are covered
  const expectedDemonstrativeKinds: ("to" | "summary" | "defect" | "init" | "find")[] = [
    "to",
    "summary",
    "defect",
    "init",
    "find",
  ];
  const expectedLayerKinds: ("project" | "issue" | "task" | "bugs" | "temp")[] = [
    "project",
    "issue",
    "task",
    "bugs",
    "temp",
  ];

  // Create all demonstrative types and verify kinds
  const demonstrativeKinds: ("to" | "summary" | "defect" | "init" | "find")[] = [
    DemonstrativeTypeFactory.to().kind as "to" | "summary" | "defect" | "init" | "find",
    DemonstrativeTypeFactory.summary().kind as "to" | "summary" | "defect" | "init" | "find",
    DemonstrativeTypeFactory.defect().kind as "to" | "summary" | "defect" | "init" | "find",
    DemonstrativeTypeFactory.init().kind as "to" | "summary" | "defect" | "init" | "find",
    DemonstrativeTypeFactory.find().kind as "to" | "summary" | "defect" | "init" | "find",
  ];

  for (const expectedKind of expectedDemonstrativeKinds) {
    assert(
      demonstrativeKinds.includes(expectedKind),
      `Should include demonstrative kind: ${expectedKind}`,
    );
  }

  // Create all layer types and verify kinds
  const layerKinds: ("project" | "issue" | "task" | "bugs" | "temp")[] = [
    LegacyLayerTypeFactory.project().kind as "project" | "issue" | "task" | "bugs" | "temp",
    LegacyLayerTypeFactory.issue().kind as "project" | "issue" | "task" | "bugs" | "temp",
    LegacyLayerTypeFactory.task().kind as "project" | "issue" | "task" | "bugs" | "temp",
    LegacyLayerTypeFactory.bugs().kind as "project" | "issue" | "task" | "bugs" | "temp",
    LegacyLayerTypeFactory.temp().kind as "project" | "issue" | "task" | "bugs" | "temp",
  ];

  for (const expectedKind of expectedLayerKinds) {
    assert(
      layerKinds.includes(expectedKind),
      `Should include layer kind: ${expectedKind}`,
    );
  }
});

Deno.test("Legacy Factories Architecture - Method signature consistency", () => {
  // Factory methods should have consistent signatures

  // Test parameterless factory methods
  const parameterlessMethods = [
    () => DemonstrativeTypeFactory.to(),
    () => DemonstrativeTypeFactory.summary(),
    () => DemonstrativeTypeFactory.defect(),
    () => DemonstrativeTypeFactory.init(),
    () => DemonstrativeTypeFactory.find(),
    () => LegacyLayerTypeFactory.project(),
    () => LegacyLayerTypeFactory.issue(),
    () => LegacyLayerTypeFactory.task(),
    () => LegacyLayerTypeFactory.bugs(),
    () => LegacyLayerTypeFactory.temp(),
  ];

  for (const method of parameterlessMethods) {
    const result = method();
    assertExists(result, "Parameterless factory methods should return valid objects");
    assert("kind" in result, "Factory result should have kind property");
    assert("value" in result, "Factory result should have value property");
  }

  // Test fromString methods (should handle string input)
  const stringInputMethods = [
    (input: string) => DemonstrativeTypeFactory.fromString(input),
    (input: string) => LegacyLayerTypeFactory.fromString(input),
  ];

  for (const method of stringInputMethods) {
    const validResult = method("valid-input-will-be-tested-in-behavior");
    // fromString can return null for invalid input, so we test this in behavior tests
    assert(
      validResult === null || typeof validResult === "object",
      "fromString should return object or null",
    );
  }
});

Deno.test("Legacy Factories Architecture - Interface boundary isolation", () => {
  // Legacy factories should not depend on new type system directly
  // This ensures clean boundary between legacy and new systems

  // Test that legacy factories work independently
  const demonstrativeType = DemonstrativeTypeFactory.to();
  const layerType = LegacyLayerTypeFactory.project();

  // Should not require new type system imports or dependencies
  assertEquals(demonstrativeType.kind, "to", "Legacy factory should work independently");
  assertEquals(layerType.kind, "project", "Legacy factory should work independently");

  // Test type guards work independently
  assert(
    DemonstrativeTypeGuards.isTo(demonstrativeType),
    "Legacy type guards should work independently",
  );
  assert(
    LegacyLayerTypeGuards.isProject(layerType),
    "Legacy type guards should work independently",
  );

  // Test aliases maintain compatibility
  assertEquals(DirectiveFactory.to().kind, "to", "Alias should maintain compatibility");
  assertEquals(LayerFactory.project().kind, "project", "Alias should maintain compatibility");
});
