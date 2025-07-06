/**
 * @fileoverview Unit tests for OutputFilePathResolver Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "@std/assert";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";
import type { OutputFilePathError, ResolvedOutputPath } from "./output_file_path_resolver.ts";

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validLegacyParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    destinationFile: "output.md",
  },
};

const validTwoParams: TwoParams_Result = {
  type: "two",
  params: ["to", "project"],
  demonstrativeType: "to",
  layerType: "project",
  options: {
    destinationFile: "output.md",
  },
};

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new OutputFilePathResolver(validConfig, validLegacyParams);
  
  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof OutputFilePathResolver.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type with proper structure", () => {
  // Architecture constraint: must return Result type for error handling
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.constructor.name, "OutputFilePathResolver");
    // Verify instance has expected methods
    assertEquals(typeof result.data.getPath, "function");
    assertEquals(typeof result.data.getDestinationFile, "function");
  } else {
    assertExists(result.error);
    assertExists(result.error.kind);
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown for any input", () => {
  // Architecture constraint: must not throw exceptions (Totality principle)
  const testCases = [
    { config: null, params: validLegacyParams },
    { config: undefined, params: validLegacyParams },
    { config: validConfig, params: null },
    { config: validConfig, params: undefined },
    { config: [], params: validLegacyParams },
    { config: validConfig, params: [] },
    { config: "invalid", params: validLegacyParams },
    { config: validConfig, params: "invalid" },
    { config: 123, params: validLegacyParams },
    { config: validConfig, params: 123 },
    { config: true, params: validLegacyParams },
    { config: validConfig, params: false },
  ];

  for (const { config, params } of testCases) {
    // Should not throw - all errors handled via Result type
    const result = OutputFilePathResolver.create(
      config as any,
      params as any
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertExists(result.error);
      assertEquals(result.error.kind, "ConfigurationError");
    }
  }
});

Deno.test("0_architecture: getPath method returns Result type", () => {
  // Architecture constraint: getPath must return Result for error handling
  const resolverResult = OutputFilePathResolver.create(validConfig, validLegacyParams);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    
    assertExists(pathResult);
    assertEquals(typeof pathResult.ok, "boolean");
    
    if (pathResult.ok) {
      assertExists(pathResult.data);
      assertExists(pathResult.data.value);
      assertExists(pathResult.data.type);
      assertExists(pathResult.data.isGenerated);
      assertExists(pathResult.data.directoryExists);
      assertExists(pathResult.data.metadata);
    } else {
      assertExists(pathResult.error);
      assertExists(pathResult.error.kind);
    }
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests
// =============================================================================

Deno.test("1_behavior: validates config parameter structure", () => {
  // Test null config
  const nullResult = OutputFilePathResolver.create(null as any, validLegacyParams);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "ConfigurationError");
    if (nullResult.error.kind === "ConfigurationError") {
      assertEquals(nullResult.error.message, "Configuration must be a non-null object");
    }
  }

  // Test undefined config
  const undefinedResult = OutputFilePathResolver.create(undefined as any, validLegacyParams);
  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "ConfigurationError");
    if (undefinedResult.error.kind === "ConfigurationError") {
      assertEquals(undefinedResult.error.message, "Configuration must be a non-null object");
    }
  }

  // Test array config
  const arrayResult = OutputFilePathResolver.create([] as any, validLegacyParams);
  assertEquals(arrayResult.ok, false);
  if (!arrayResult.ok) {
    assertEquals(arrayResult.error.kind, "ConfigurationError");
    if (arrayResult.error.kind === "ConfigurationError") {
      assertEquals(arrayResult.error.message, "Configuration must be a non-null object");
    }
  }

  // Test non-object config
  const stringResult = OutputFilePathResolver.create("config" as any, validLegacyParams);
  assertEquals(stringResult.ok, false);
  if (!stringResult.ok) {
    assertEquals(stringResult.error.kind, "ConfigurationError");
  }

  // Test number config
  const numberResult = OutputFilePathResolver.create(123 as any, validLegacyParams);
  assertEquals(numberResult.ok, false);
  if (!numberResult.ok) {
    assertEquals(numberResult.error.kind, "ConfigurationError");
  }
});

Deno.test("1_behavior: validates cliParams parameter structure", () => {
  // Test null params
  const nullResult = OutputFilePathResolver.create(validConfig, null as any);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "ConfigurationError");
    if (nullResult.error.kind === "ConfigurationError") {
      assertEquals(nullResult.error.message, "CLI parameters must be a non-null object");
    }
  }

  // Test undefined params
  const undefinedResult = OutputFilePathResolver.create(validConfig, undefined as any);
  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "ConfigurationError");
  }

  // Test array params
  const arrayResult = OutputFilePathResolver.create(validConfig, [] as any);
  assertEquals(arrayResult.ok, false);
  if (!arrayResult.ok) {
    assertEquals(arrayResult.error.kind, "ConfigurationError");
  }

  // Test invalid params structure
  const invalidResult = OutputFilePathResolver.create(validConfig, { invalid: true } as any);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "ConfigurationError");
    if (invalidResult.error.kind === "ConfigurationError") {
      assertEquals(
        invalidResult.error.message.includes("must have either TwoParams structure or legacy structure"),
        true
      );
    }
  }
});

Deno.test("1_behavior: accepts valid legacy parameter structure", () => {
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const resolver = result.data;
    assertEquals(resolver.getDestinationFile(), "output.md");
  }
});

Deno.test("1_behavior: accepts valid TwoParams structure", () => {
  const result = OutputFilePathResolver.create(validConfig, validTwoParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const resolver = result.data;
    assertEquals(resolver.getDestinationFile(), "output.md");
  }
});

Deno.test("1_behavior: validates required properties in legacy params", () => {
  // Missing demonstrativeType
  const missingDemonstrative = {
    layerType: "project",
    options: {},
  };
  const result1 = OutputFilePathResolver.create(validConfig, missingDemonstrative as any);
  assertEquals(result1.ok, false);

  // Missing layerType
  const missingLayer = {
    demonstrativeType: "to",
    options: {},
  };
  const result2 = OutputFilePathResolver.create(validConfig, missingLayer as any);
  assertEquals(result2.ok, false);

  // Non-string demonstrativeType
  const nonStringDemo = {
    demonstrativeType: 123,
    layerType: "project",
    options: {},
  };
  const result3 = OutputFilePathResolver.create(validConfig, nonStringDemo as any);
  assertEquals(result3.ok, false);

  // Non-string layerType
  const nonStringLayer = {
    demonstrativeType: "to",
    layerType: true,
    options: {},
  };
  const result4 = OutputFilePathResolver.create(validConfig, nonStringLayer as any);
  assertEquals(result4.ok, false);
});

Deno.test("1_behavior: validates TwoParams specific structure", () => {
  // Invalid type value - but has valid legacy props, so should be accepted as legacy
  const invalidType = {
    type: "three", // Should be "two"
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };
  const result1 = OutputFilePathResolver.create(validConfig, invalidType as any);
  assertEquals(result1.ok, true); // Accepted as legacy structure

  // Missing type property but has other TwoParams properties
  const missingType = {
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };
  // Should be accepted as legacy structure
  const result2 = OutputFilePathResolver.create(validConfig, missingType as any);
  assertEquals(result2.ok, true);

  // Truly invalid structure - missing required props
  const invalidStructure = {
    type: "three",
    params: ["to", "project"],
    // Missing demonstrativeType and layerType
    options: {},
  };
  const result3 = OutputFilePathResolver.create(validConfig, invalidStructure as any);
  assertEquals(result3.ok, false);
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: creates immutable instance with deep copied config", () => {
  const mutableConfig = {
    working_dir: ".agent/breakdown",
    resource_dir: ".agent/resources",
    nested: {
      value: "original",
    },
  };

  const result = OutputFilePathResolver.create(mutableConfig, validLegacyParams);
  
  if (result.ok) {
    // Modify original config
    mutableConfig.working_dir = "modified";
    mutableConfig.nested.value = "modified";
    
    // Instance should not be affected
    const pathResult = result.data.getPath();
    // The resolver should still work with original values
    assertEquals(pathResult.ok, true);
  }
});

Deno.test("2_structure: creates immutable instance with deep copied params", () => {
  const mutableParams: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      destinationFile: "output.md",
    },
  };

  const result = OutputFilePathResolver.create(validConfig, mutableParams);
  
  if (result.ok) {
    // Modify original params
    mutableParams.demonstrativeType = "summary";
    mutableParams.layerType = "task";
    mutableParams.options.destinationFile = "modified.md";
    
    // Instance should return original value
    assertEquals(result.data.getDestinationFile(), "output.md");
  }
});

Deno.test("2_structure: properly handles TwoParams deep copy", () => {
  const mutableTwoParams: TwoParams_Result = {
    type: "two",
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {
      destinationFile: "output.md",
    },
  };

  const result = OutputFilePathResolver.create(validConfig, mutableTwoParams);
  
  if (result.ok) {
    // Modify original params
    mutableTwoParams.params[0] = "summary";
    mutableTwoParams.demonstrativeType = "summary";
    mutableTwoParams.options.destinationFile = "modified.md";
    
    // Instance should return original value
    assertEquals(result.data.getDestinationFile(), "output.md");
  }
});

Deno.test("2_structure: error types have correct structure", () => {
  // Test ConfigurationError structure
  const configErrorResult = OutputFilePathResolver.create(null as any, validLegacyParams);
  if (!configErrorResult.ok) {
    assertEquals(configErrorResult.error.kind, "ConfigurationError");
    if (configErrorResult.error.kind === "ConfigurationError") {
      assertExists(configErrorResult.error.message);
      assertEquals(typeof configErrorResult.error.message, "string");
    }
  }

  // Test parameter validation error
  const paramErrorResult = OutputFilePathResolver.create(validConfig, {} as any);
  if (!paramErrorResult.ok) {
    assertEquals(paramErrorResult.error.kind, "ConfigurationError");
    if (paramErrorResult.error.kind === "ConfigurationError") {
      assertExists(paramErrorResult.error.message);
    }
  }
});

Deno.test("2_structure: ResolvedOutputPath has correct structure", () => {
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  
  if (result.ok) {
    const pathResult = result.data.getPath();
    
    if (pathResult.ok) {
      const resolved = pathResult.data;
      
      // Check all required properties
      assertExists(resolved.value);
      assertEquals(typeof resolved.value, "string");
      
      assertExists(resolved.type);
      assertEquals(
        ["auto-generated", "absolute", "relative", "filename"].includes(resolved.type),
        true
      );
      
      assertExists(resolved.isGenerated);
      assertEquals(typeof resolved.isGenerated, "boolean");
      
      assertExists(resolved.directoryExists);
      assertEquals(typeof resolved.directoryExists, "boolean");
      
      assertExists(resolved.metadata);
      assertEquals(typeof resolved.metadata, "object");
      
      // Check metadata structure
      if (resolved.metadata.originalPath) {
        assertEquals(typeof resolved.metadata.originalPath, "string");
      }
      assertExists(resolved.metadata.resolvedFrom);
      assertEquals(
        ["cli", "config", "auto"].includes(resolved.metadata.resolvedFrom),
        true
      );
      
      if (resolved.metadata.layerType) {
        assertEquals(typeof resolved.metadata.layerType, "string");
      }
    }
  }
});

Deno.test("2_structure: handles empty options object", () => {
  const paramsWithEmptyOptions: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolver.create(validConfig, paramsWithEmptyOptions);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    assertEquals(result.data.getDestinationFile(), undefined);
  }
});

Deno.test("2_structure: handles missing options object in legacy params", () => {
  const paramsWithoutOptions = {
    demonstrativeType: "to",
    layerType: "project",
  } as PromptCliParams;

  const result = OutputFilePathResolver.create(validConfig, paramsWithoutOptions);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    assertEquals(result.data.getDestinationFile(), undefined);
  }
});

Deno.test("2_structure: Result type follows discriminated union pattern", () => {
  const successResult = OutputFilePathResolver.create(validConfig, validLegacyParams);
  const errorResult = OutputFilePathResolver.create(null as any, validLegacyParams);
  
  // Success case
  if (successResult.ok) {
    // TypeScript knows data exists
    assertExists(successResult.data);
    // Runtime check: error property should not exist
    assertEquals("error" in successResult, false);
  }
  
  // Error case
  if (!errorResult.ok) {
    // TypeScript knows error exists
    assertExists(errorResult.error);
    // Runtime check: data property should not exist
    assertEquals("data" in errorResult, false);
  }
});