/**
 * @fileoverview Unit tests for InputFilePathResolver Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 */

import { assertEquals, assertExists } from "@std/assert";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validLegacyParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    fromFile: "input.md",
  },
};

const validTotalityParams: TwoParams_Result = {
  directive: { value: "to" },
  layer: { value: "project" },
  options: {
    fromFile: "input.md",
  },
} as any;

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new InputFilePathResolver(validConfig, validLegacyParams);
  
  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof InputFilePathResolver.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = InputFilePathResolver.create(validConfig, validLegacyParams);
  
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.constructor.name, "InputFilePathResolver");
  } else {
    assertExists(result.error);
    assertExists(result.error.kind);
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown", () => {
  // Architecture constraint: must not throw exceptions
  const testCases = [
    { config: null, params: validLegacyParams },
    { config: validConfig, params: null },
    { config: [], params: validLegacyParams },
    { config: validConfig, params: [] },
    { config: "invalid", params: validLegacyParams },
    { config: validConfig, params: "invalid" },
  ];

  for (const { config, params } of testCases) {
    // Should not throw
    const result = InputFilePathResolver.create(
      config as any,
      params as any
    );
    assertEquals(result.ok, false);
    assertExists(result.error);
  }
});

Deno.test("1_behavior: validates config parameter", () => {
  // Test null config
  const nullResult = InputFilePathResolver.create(null as any, validLegacyParams);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "ConfigurationError");
    assertEquals(nullResult.error.message, "Configuration must be a non-null object");
  }

  // Test array config
  const arrayResult = InputFilePathResolver.create([] as any, validLegacyParams);
  assertEquals(arrayResult.ok, false);
  if (!arrayResult.ok) {
    assertEquals(arrayResult.error.kind, "ConfigurationError");
    assertEquals(arrayResult.error.message, "Configuration must be a non-null object");
  }

  // Test non-object config
  const stringResult = InputFilePathResolver.create("config" as any, validLegacyParams);
  assertEquals(stringResult.ok, false);
  if (!stringResult.ok) {
    assertEquals(stringResult.error.kind, "ConfigurationError");
    assertEquals(stringResult.error.message, "Configuration must be a non-null object");
  }
});

Deno.test("1_behavior: validates CLI parameters", () => {
  // Test null params
  const nullResult = InputFilePathResolver.create(validConfig, null as any);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "ConfigurationError");
    assertEquals(nullResult.error.message, "CLI parameters must be a non-null object");
  }

  // Test array params
  const arrayResult = InputFilePathResolver.create(validConfig, [] as any);
  assertEquals(arrayResult.ok, false);
  if (!arrayResult.ok) {
    assertEquals(arrayResult.error.kind, "ConfigurationError");
    assertEquals(arrayResult.error.message, "CLI parameters must be a non-null object");
  }

  // Test invalid structure
  const invalidStructResult = InputFilePathResolver.create(validConfig, { invalid: true } as any);
  assertEquals(invalidStructResult.ok, false);
  if (!invalidStructResult.ok) {
    assertEquals(invalidStructResult.error.kind, "ConfigurationError");
    assertEquals(
      invalidStructResult.error.message,
      "CLI parameters must have either Totality structure (directive.value, layer.value) or legacy structure (demonstrativeType, layerType)"
    );
  }
});

Deno.test("1_behavior: accepts valid legacy parameters", () => {
  const result = InputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    
    // Verify the resolver can get path
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
  }
});

Deno.test("1_behavior: accepts valid Totality parameters", () => {
  const result = InputFilePathResolver.create(validConfig, validTotalityParams);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    
    // Verify the resolver can get path
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
  }
});

Deno.test("1_behavior: handles missing optional fields", () => {
  const minimalLegacyParams: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  const result = InputFilePathResolver.create(validConfig, minimalLegacyParams);
  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      assertEquals(pathResult.data.value, "");
      assertEquals(pathResult.data.type, "filename");
      assertEquals(pathResult.data.exists, false);
    }
  }
});

Deno.test("2_structure: preserves immutability of inputs", () => {
  const mutableConfig = { ...validConfig };
  const mutableParams = { ...validLegacyParams };

  const result = InputFilePathResolver.create(mutableConfig, mutableParams);
  assertEquals(result.ok, true);

  // Modify original objects
  mutableConfig.working_dir = "modified";
  mutableParams.demonstrativeType = "modified";
  mutableParams.options!.fromFile = "modified.md";

  if (result.ok) {
    // Get path should still use original values
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // The path resolution should use the original fromFile value
      assertEquals(pathResult.data.metadata.originalPath, "input.md");
    }
  }
});

Deno.test("2_structure: validates Totality parameter structure", () => {
  const invalidTotalityParams = {
    directive: "to", // Should be object with value property
    layer: { value: "project" },
  };

  const result = InputFilePathResolver.create(validConfig, invalidTotalityParams as any);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ConfigurationError");
  }
});

Deno.test("2_structure: validates legacy parameter structure", () => {
  const invalidLegacyParams = {
    demonstrativeType: 123, // Should be string
    layerType: "project",
  };

  const result = InputFilePathResolver.create(validConfig, invalidLegacyParams as any);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ConfigurationError");
  }
});

Deno.test("2_structure: Result type structure integrity", () => {
  // Test success case
  const successResult = InputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(successResult.ok, true);
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);
  }

  // Test error case
  const errorResult = InputFilePathResolver.create(null as any, validLegacyParams);
  assertEquals(errorResult.ok, false);
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertExists(errorResult.error.kind);
    assertEquals("data" in errorResult, false);
  }
});