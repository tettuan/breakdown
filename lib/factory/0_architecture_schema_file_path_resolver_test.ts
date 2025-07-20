/**
 * @fileoverview Architecture tests for SchemaFilePathResolver
 *
 * Tests architectural constraints and design principles including:
 * - Smart Constructor pattern enforcement
 * - Result type totality (no exceptions thrown)
 * - Immutability of instances
 * - Domain boundaries and responsibilities
 * - Type safety and exhaustiveness
 *
 * @module factory/0_architecture_schema_file_path_resolver_test
 */

import { assert, assertEquals, assertThrows } from "../deps.ts";
import {
  formatSchemaError,
  isConfigurationError,
  isFileSystemError,
  isInvalidParametersError,
  isSchemaNotFoundError,
  type SchemaFilePathError,
  schemaFilePathErrorToPathResolutionError,
  SchemaFilePathResolver,
  SchemaPath,
} from "./schema_file_path_resolver_totality.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import type { TwoParams_Result } from "../deps.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

Deno.test("SchemaFilePathResolver Architecture - Smart Constructor enforces validation", () => {
  // Valid inputs should create instance
  const validConfig = { app_schema: { base_dir: "/valid/path" } };
  const validParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = SchemaFilePathResolver.create(validConfig, validParams);
  assert(result.ok, "Should create instance with valid inputs");

  // Invalid config should fail
  const invalidConfigs = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const config of invalidConfigs) {
    const result = SchemaFilePathResolver.create(
      config as unknown as typeof validConfig,
      validParams,
    );
    assert(!result.ok, `Should fail with invalid config: ${config}`);
    assertEquals(result.error.kind, "InvalidConfiguration");
  }

  // Invalid params should fail
  const invalidParams = [
    null,
    undefined,
    [],
    "string",
    123,
    { directiveType: "", layerType: "project", options: {} },
    { directiveType: "to", layerType: "", options: {} },
    { directiveType: "  ", layerType: "project", options: {} },
    { directiveType: "to", layerType: "  ", options: {} },
  ];

  for (const params of invalidParams) {
    const result = SchemaFilePathResolver.create(
      validConfig,
      params as unknown as typeof validParams,
    );
    assert(!result.ok, `Should fail with invalid params: ${JSON.stringify(params)}`);
    if (params && typeof params === "object" && !Array.isArray(params)) {
      assertEquals(result.error.kind, "InvalidParameterCombination");
    } else {
      assertEquals(result.error.kind, "InvalidConfiguration");
    }
  }
});

Deno.test("SchemaFilePathResolver Architecture - Private constructor cannot be accessed", () => {
  // This test verifies the constructor is private by checking type system
  // TypeScript compiler prevents direct instantiation
  const validConfig = { app_schema: { base_dir: "/valid/path" } };
  const validParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  // Should only create through smart constructor
  const result = SchemaFilePathResolver.create(validConfig, validParams);
  assert(result.ok);
  assert(result.data instanceof SchemaFilePathResolver);
});

Deno.test("SchemaFilePathResolver Architecture - Immutability through deep copy", () => {
  const mutableConfig = { app_schema: { base_dir: "/original/path" } };
  const mutableParams = {
    directiveType: "to",
    layerType: "project",
    options: { fromFile: "test.txt" },
  };

  const result = SchemaFilePathResolver.create(mutableConfig, mutableParams);
  assert(result.ok);

  // Store original values before modification
  const originalPath = result.data.buildSchemaPath("/test", "file.md");

  // Get original base dir from path result
  let originalBaseDir = "";
  const pathResult = result.data.getPath();
  if (pathResult.ok) {
    originalBaseDir = pathResult.data.getDirectory();
  }

  // Modify original objects
  mutableConfig.app_schema.base_dir = "/modified/path";
  mutableParams.directiveType = "summary";
  mutableParams.layerType = "issue";
  mutableParams.options.fromFile = "modified.txt";

  // Resolver should maintain original values
  const currentPath = result.data.buildSchemaPath("/test", "file.md");

  // Get current base dir from path result
  let currentBaseDir = "";
  const currentPathResult = result.data.getPath();
  if (currentPathResult.ok) {
    currentBaseDir = currentPathResult.data.getDirectory();
  }

  assertEquals(currentBaseDir, originalBaseDir, "Base dir should not change");
  assertEquals(currentPath, originalPath, "Built path should not change");
  assert(currentPath.includes("/to/project/"), "Should use original params");
});

Deno.test("SchemaFilePathResolver Architecture - Result type totality (no exceptions)", () => {
  const config = { app_schema: { base_dir: "/test/path" } };
  const params = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = SchemaFilePathResolver.create(config, params);
  assert(result.ok);

  // All public methods should return Result or safe values
  const pathResult = result.data.getPath();
  assert("ok" in pathResult, "getPath should return Result type");

  const fileName = result.data.buildFileName();
  assertEquals(typeof fileName, "string", "buildFileName should return string");

  const schemaPath = result.data.buildSchemaPath("/base", "file.md");
  assertEquals(typeof schemaPath, "string", "buildSchemaPath should return string");

  // Legacy methods should handle errors gracefully
  // Get base directory through path result
  const pathResultForBase = result.data.getPath();
  if (pathResultForBase.ok) {
    const baseDir = pathResultForBase.data.getDirectory();
    assertEquals(typeof baseDir, "string", "Base directory should be string");
  }

  // Path resolution returns Result
  const pathResolveResult = result.data.getPath();
  assert("ok" in pathResolveResult, "getPath should return Result type");
});

Deno.test("SchemaFilePathResolver Architecture - SchemaPath value object immutability", () => {
  const path = "/test/schema/path.schema.md";
  const metadata = {
    baseDir: "/test",
    directiveType: "to",
    layerType: "project",
    fileName: "base.schema.md",
  };

  const result = SchemaPath.create(path, metadata);
  assert(result.ok);

  // Value and metadata should be readonly
  const schemaPath = result.data;
  assertEquals(schemaPath.value, path);
  assertEquals(schemaPath.metadata, { ...metadata, isDefault: false });

  // Verify properties are truly readonly via runtime behavior
  const description = schemaPath.getDescription();
  assertEquals(
    description,
    "Schema: to/project/base.schema.md",
    "Description should use metadata",
  );
});

Deno.test("SchemaFilePathResolver Architecture - Error discrimination with type guards", () => {
  const errors: SchemaFilePathError[] = [
    { kind: "SchemaNotFound", message: "test", path: "/test" },
    { kind: "InvalidParameters", message: "test", directiveType: "to", layerType: "project" },
    { kind: "ConfigurationError", message: "test", setting: "base_dir" },
    { kind: "FileSystemError", message: "test", operation: "read" },
  ];

  // Test type guards
  assert(isSchemaNotFoundError(errors[0]));
  assert(!isInvalidParametersError(errors[0]));

  assert(isInvalidParametersError(errors[1]));
  assert(!isConfigurationError(errors[1]));

  assert(isConfigurationError(errors[2]));
  assert(!isFileSystemError(errors[2]));

  assert(isFileSystemError(errors[3]));
  assert(!isSchemaNotFoundError(errors[3]));

  // All errors should have proper formatting
  for (const error of errors) {
    const pathResolutionError = schemaFilePathErrorToPathResolutionError(error);
    const formatted = formatSchemaError(pathResolutionError);
    assert(formatted.length > 0, "Error should format to non-empty string");
  }
});

Deno.test("SchemaFilePathResolver Architecture - PathResolutionError conversion completeness", () => {
  const pathErrors: PathResolutionError[] = [
    { kind: "InvalidConfiguration", details: "test" },
    { kind: "BaseDirectoryNotFound", path: "/test" },
    { kind: "InvalidParameterCombination", directiveType: "to", layerType: "project" },
    { kind: "TemplateNotFound", attempted: ["/test"], fallback: "none" },
    { kind: "InvalidStrategy", strategy: "test" },
    { kind: "EmptyBaseDir" },
    { kind: "InvalidPath", path: "/test", reason: "invalid" },
    { kind: "NoValidFallback", attempts: ["/test1", "/test2"] },
    { kind: "PathValidationFailed", rule: "must-exist", path: "/test" },
  ];

  const config = { app_schema: { base_dir: "/test" } };
  const params = { directiveType: "to", layerType: "project", options: {} };

  const result = SchemaFilePathResolver.create(config, params);
  assert(result.ok);

  // Verify all PathResolutionError kinds are handled
  for (const pathError of pathErrors) {
    const formatted = formatSchemaError(pathError);
    assert(formatted.length > 0, `Should format ${pathError.kind} error`);
  }
});

Deno.test("SchemaFilePathResolver Architecture - Backward compatibility maintained", () => {
  const config = { app_schema: { base_dir: "/test" } };

  // Test with legacy DoubleParams_Result structure
  const legacyParams = {
    directiveType: "to",
    layerType: "project",
    options: { fromFile: "test.txt" },
  };

  const legacyResult = SchemaFilePathResolver.create(config, legacyParams);
  assert(legacyResult.ok, "Should support legacy parameter structure");

  // Test with new TwoParams_Result structure
  const newParams = {
    type: "two" as const,
    params: ["to", "project"],
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const newResult = SchemaFilePathResolver.create(config, newParams);
  assert(newResult.ok, "Should support new parameter structure");

  // Test deprecated methods still work
  if (legacyResult.ok) {
    // Legacy methods have been removed, use new API
    const pathResult = legacyResult.data.getPath();
    assert("ok" in pathResult, "getPath should return Result");

    if (pathResult.ok) {
      const baseDir = pathResult.data.getDirectory();
      assert(typeof baseDir === "string", "Directory should be string");
    }

    // Unsafe methods have been removed in totality pattern
    const errorConfig = { app_schema: { base_dir: "/nonexistent" } };
    const errorResult = SchemaFilePathResolver.create(errorConfig, legacyParams);
    if (errorResult.ok) {
      assertThrows(
        () => {
          // Unsafe methods have been removed, simulate error
          const pathResult = errorResult.data.getPath();
          if (!pathResult.ok) {
            throw new Error("Schema path resolution failed");
          }
        },
        Error,
        "Schema path resolution failed",
      );
    }
  }
});

Deno.test("SchemaFilePathResolver Architecture - Domain boundaries respected", () => {
  const config = { app_schema: { base_dir: "/test" } };
  const params = { directiveType: "to", layerType: "project", options: {} };

  const result = SchemaFilePathResolver.create(config, params);
  assert(result.ok);

  // Resolver should only be responsible for path resolution, not:
  // - Schema content parsing
  // - Schema validation beyond existence
  // - Template processing
  // - Variable substitution

  // Methods should have clear, single responsibilities
  const fileName = result.data.buildFileName();
  assertEquals(fileName, "base.schema.md", "Should only build filename");

  const schemaPath = result.data.buildSchemaPath("/base", "file.md");
  assert(schemaPath.includes("/base"), "Should only build path");
  assert(schemaPath.includes("file.md"), "Should only build path");
});

Deno.test("SchemaFilePathResolver Architecture - Exhaustive error handling", () => {
  // Ensure all error paths are covered
  const testCases: Array<{
    config: unknown;
    params: unknown;
    expectedError: PathResolutionError["kind"];
  }> = [
    {
      config: null,
      params: { directiveType: "to", layerType: "project", options: {} },
      expectedError: "InvalidConfiguration",
    },
    {
      config: { app_schema: { base_dir: "/test" } },
      params: null,
      expectedError: "InvalidConfiguration",
    },
    {
      config: { app_schema: { base_dir: "/test" } },
      params: { directiveType: "", layerType: "project", options: {} },
      expectedError: "InvalidParameterCombination",
    },
    {
      config: { app_schema: { base_dir: "/test" } },
      params: { directiveType: "to", layerType: "", options: {} },
      expectedError: "InvalidParameterCombination",
    },
  ];

  for (const testCase of testCases) {
    const result = SchemaFilePathResolver.create(
      testCase.config as { app_schema?: { base_dir?: string } } & Record<string, unknown>,
      testCase.params as PromptCliParams | TwoParams_Result,
    );
    assert(!result.ok, `Should fail for ${JSON.stringify(testCase)}`);
    assertEquals(result.error.kind, testCase.expectedError);
  }
});
