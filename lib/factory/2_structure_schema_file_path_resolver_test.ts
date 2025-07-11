/**
 * @fileoverview Structure tests for SchemaFilePathResolver
 *
 * Tests the structural correctness and data integrity including:
 * - Data structure validation
 * - Type relationships and conversions
 * - Configuration merging and defaults
 * - Error structure completeness
 * - Interface contracts
 *
 * @module factory/2_structure_schema_file_path_resolver_test
 */

import { assert, assertEquals, assertExists, assertObjectMatch } from "../deps.ts";
import {
  formatSchemaError,
  formatSchemaFilePathError,
  isConfigurationError,
  isFileSystemError,
  isInvalidParametersError,
  isSchemaNotFoundError,
  type SchemaFilePathError,
  SchemaFilePathResolver,
  SchemaPath,
} from "./schema_file_path_resolver.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import type { TwoParams_Result } from "../deps.ts";

Deno.test("SchemaFilePathResolver Structure - Configuration structure preserved", () => {
  const testConfigs = [
    // Minimal config
    {},
    // Config with schema settings
    { app_schema: { base_dir: "/schema/path" } },
    // Config with additional properties
    {
      app_schema: { base_dir: "/schema/path" },
      app_prompt: { base_dir: "/prompt/path" },
      custom: { value: 42 },
    },
  ];

  for (const config of testConfigs) {
    const params = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const result = SchemaFilePathResolver.create(config, params);
    assert(result.ok, `Should create resolver with config: ${JSON.stringify(config)}`);
  }
});

Deno.test("SchemaFilePathResolver Structure - Parameter structures support both formats", () => {
  const config = { app_schema: { base_dir: "/test" } };

  // Legacy PromptCliParams structure
  const legacyParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromFile: "input.txt",
      destinationFile: "output.md",
    },
  };

  const legacyResult = SchemaFilePathResolver.create(config, legacyParams);
  assert(legacyResult.ok);

  // New TwoParams_Result structure
  const newParams: TwoParams_Result = {
    type: "two",
    params: ["summary", "issue"],
    demonstrativeType: "summary",
    layerType: "issue",
    options: {},
  };

  const newResult = SchemaFilePathResolver.create(config, newParams);
  assert(newResult.ok);

  // Mixed structure (params array takes precedence)
  const mixedParams = {
    type: "two" as const,
    params: ["defect", "task"],
    demonstrativeType: "ignored",
    layerType: "ignored",
    options: {},
  };

  const mixedResult = SchemaFilePathResolver.create(config, mixedParams);
  assert(mixedResult.ok);
});

Deno.test("SchemaFilePathResolver Structure - SchemaPath value object structure", () => {
  const testCases = [
    {
      path: "/absolute/path/to/schema.md",
      metadata: {
        baseDir: "/absolute/path",
        demonstrativeType: "to",
        layerType: "project",
        fileName: "schema.md",
      },
    },
  ];

  // Add Windows path test only on Windows
  if (Deno.build.os === "windows") {
    testCases.push({
      path: "C:\\Windows\\Path\\schema.md",
      metadata: {
        baseDir: "C:\\Windows\\Path",
        demonstrativeType: "summary",
        layerType: "issue",
        fileName: "schema.md",
      },
    });
  }

  for (const testCase of testCases) {
    const result = SchemaPath.create(testCase.path, testCase.metadata);
    assert(result.ok);
    if (result.ok) {
      const schemaPath = result.data;

      // Verify structure
      assertEquals(schemaPath.value, testCase.path);
      assertObjectMatch(schemaPath.metadata, testCase.metadata);

      // Verify description format
      const expectedDesc =
        `Schema: ${testCase.metadata.demonstrativeType}/${testCase.metadata.layerType}/${testCase.metadata.fileName}`;
      assertEquals(schemaPath.getDescription(), expectedDesc);
    }
  }
});

Deno.test("SchemaFilePathResolver Structure - Error type discrimination structure", () => {
  // Verify each error type has correct structure
  const schemaNotFound: SchemaFilePathError = {
    kind: "SchemaNotFound",
    message: "Schema not found",
    path: "/test/path",
  };

  assert(isSchemaNotFoundError(schemaNotFound));
  assertEquals(schemaNotFound.path, "/test/path");

  const invalidParams: SchemaFilePathError = {
    kind: "InvalidParameters",
    message: "Invalid parameters",
    demonstrativeType: "invalid",
    layerType: "type",
  };

  assert(isInvalidParametersError(invalidParams));
  assertEquals(invalidParams.demonstrativeType, "invalid");
  assertEquals(invalidParams.layerType, "type");

  const configError: SchemaFilePathError = {
    kind: "ConfigurationError",
    message: "Config error",
    setting: "base_dir",
  };

  assert(isConfigurationError(configError));
  assertEquals(configError.setting, "base_dir");

  const fsError: SchemaFilePathError = {
    kind: "FileSystemError",
    message: "FS error",
    operation: "read",
    originalError: new Error("Original"),
  };

  assert(isFileSystemError(fsError));
  assertEquals(fsError.operation, "read");
  assertExists(fsError.originalError);
});

Deno.test("SchemaFilePathResolver Structure - PathResolutionError to SchemaFilePathError mapping", () => {
  const mappings: Array<{
    input: PathResolutionError;
    expectedKind: SchemaFilePathError["kind"];
    checkProperties?: (error: SchemaFilePathError) => void;
  }> = [
    {
      input: { kind: "InvalidConfiguration", details: "Invalid config" },
      expectedKind: "ConfigurationError",
      checkProperties: (error) => {
        if (error.kind === "ConfigurationError") {
          assertEquals(error.message, "Invalid config");
          assertEquals(error.setting, "schema_config");
        }
      },
    },
    {
      input: { kind: "BaseDirectoryNotFound", path: "/missing" },
      expectedKind: "SchemaNotFound",
      checkProperties: (error) => {
        if (error.kind === "SchemaNotFound") {
          assert(error.message.includes("/missing"));
          assertEquals(error.path, "/missing");
        }
      },
    },
    {
      input: { kind: "InvalidParameterCombination", demonstrativeType: "bad", layerType: "params" },
      expectedKind: "InvalidParameters",
      checkProperties: (error) => {
        if (error.kind === "InvalidParameters") {
          assertEquals(error.demonstrativeType, "bad");
          assertEquals(error.layerType, "params");
        }
      },
    },
    {
      input: { kind: "TemplateNotFound", attempted: ["/path1", "/path2"] },
      expectedKind: "SchemaNotFound",
      checkProperties: (error) => {
        if (error.kind === "SchemaNotFound") {
          assertEquals(error.path, "/path1");
        }
      },
    },
    {
      input: { kind: "InvalidStrategy", strategy: "wrong" },
      expectedKind: "ConfigurationError",
      checkProperties: (error) => {
        if (error.kind === "ConfigurationError") {
          assert(error.message.includes("wrong"));
          assertEquals(error.setting, "path_strategy");
        }
      },
    },
    {
      input: { kind: "EmptyBaseDir" },
      expectedKind: "ConfigurationError",
      checkProperties: (error) => {
        if (error.kind === "ConfigurationError") {
          assertEquals(error.setting, "base_directory");
        }
      },
    },
    {
      input: { kind: "InvalidPath", path: "/invalid", reason: "not absolute" },
      expectedKind: "SchemaNotFound",
      checkProperties: (error) => {
        if (error.kind === "SchemaNotFound") {
          assertEquals(error.path, "/invalid");
          assert(error.message.includes("not absolute"));
        }
      },
    },
    {
      input: { kind: "NoValidFallback", attempts: ["/try1", "/try2", "/try3"] },
      expectedKind: "SchemaNotFound",
      checkProperties: (error) => {
        if (error.kind === "SchemaNotFound") {
          assertEquals(error.path, "/try1");
          assert(error.message.includes("/try1, /try2, /try3"));
        }
      },
    },
    {
      input: { kind: "ValidationFailed", rule: "must-exist", path: "/validate" },
      expectedKind: "SchemaNotFound",
      checkProperties: (error) => {
        if (error.kind === "SchemaNotFound") {
          assertEquals(error.path, "/validate");
        }
      },
    },
  ];

  const config = { app_schema: { base_dir: "/test" } };
  const params = { demonstrativeType: "to", layerType: "project", options: {} };

  const result = SchemaFilePathResolver.create(config, params);
  assert(result.ok);
  if (result.ok) {
    const resolver = result.data;

    for (const mapping of mappings) {
      // Access private method through type casting (for testing only)
      const converted = (resolver as unknown as {
        convertToSchemaFilePathError: (input: unknown) => { kind: string };
      }).convertToSchemaFilePathError(mapping.input);
      assertEquals(converted.kind, mapping.expectedKind);

      if (mapping.checkProperties) {
        // deno-lint-ignore no-explicit-any
        mapping.checkProperties(converted as any);
      }
    }
  }
});

Deno.test("SchemaFilePathResolver Structure - Result type usage patterns", () => {
  const config = { app_schema: { base_dir: "/test" } };
  const params = { demonstrativeType: "to", layerType: "project", options: {} };

  // Test Result pattern in create method
  const createResult = SchemaFilePathResolver.create(config, params);
  if (createResult.ok) {
    assertExists(createResult.data);
    assert(createResult.data instanceof SchemaFilePathResolver);
  } else {
    assertExists(createResult.error);
    assert("kind" in createResult.error);
  }

  // Test Result pattern in getPath method
  if (createResult.ok) {
    const pathResult = createResult.data.getPath();
    if (pathResult.ok) {
      assertExists(pathResult.data);
      assert(pathResult.data instanceof SchemaPath);
    } else {
      assertExists(pathResult.error);
      assert("kind" in pathResult.error);
    }
  }

  // Test Result pattern in SchemaPath.create
  const schemaPathResult = SchemaPath.create("/test/path", {
    baseDir: "/test",
    demonstrativeType: "to",
    layerType: "project",
    fileName: "base.schema.md",
  });
  if (schemaPathResult.ok) {
    assertExists(schemaPathResult.data);
    assert(schemaPathResult.data instanceof SchemaPath);
  } else {
    assertExists(schemaPathResult.error);
    assert(schemaPathResult.error instanceof Error);
  }
});

Deno.test("SchemaFilePathResolver Structure - Path construction structure", () => {
  const config = { app_schema: { base_dir: "/base/schema" } };
  const params = {
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };

  const result = SchemaFilePathResolver.create(config, params);
  assert(result.ok);
  if (result.ok) {
    const resolver = result.data;

    // Test path structure components
    const baseDir = resolver.resolveBaseDir();
    const fileName = resolver.buildFileName();
    const fullPath = resolver.buildSchemaPath(baseDir, fileName);

    // Verify path structure
    assert(fullPath.startsWith(baseDir));
    assert(fullPath.includes(params.demonstrativeType));
    assert(fullPath.includes(params.layerType));
    assert(fullPath.endsWith(fileName));

    // Verify path format: baseDir/demonstrativeType/layerType/fileName
    const expectedPath = `${baseDir}/${params.demonstrativeType}/${params.layerType}/${fileName}`;
    assertEquals(fullPath, expectedPath);
  }
});

Deno.test("SchemaFilePathResolver Structure - Options structure preservation", () => {
  const config = { app_schema: { base_dir: "/test" } };
  const optionsVariants = [
    {},
    { fromFile: "input.txt" },
    { destinationFile: "output.md", adaptation: "custom" },
    {
      fromFile: "in.txt",
      destinationFile: "out.md",
      promptDir: "/prompts",
      customVariables: { key1: "value1", key2: "value2" },
    },
  ];

  for (const options of optionsVariants) {
    const params = {
      demonstrativeType: "to",
      layerType: "project",
      options,
    };

    const result = SchemaFilePathResolver.create(config, params);
    assert(result.ok, `Should handle options: ${JSON.stringify(options)}`);
  }
});

Deno.test("SchemaFilePathResolver Structure - Error formatting completeness", () => {
  // Test all PathResolutionError kinds format correctly
  const pathErrors: PathResolutionError[] = [
    { kind: "InvalidConfiguration", details: "Bad config" },
    { kind: "BaseDirectoryNotFound", path: "/not/found" },
    { kind: "InvalidParameterCombination", demonstrativeType: "bad", layerType: "combo" },
    { kind: "TemplateNotFound", attempted: ["/try1"], fallback: "fallback" },
    { kind: "InvalidStrategy", strategy: "unknown" },
    { kind: "EmptyBaseDir" },
    { kind: "InvalidPath", path: "/bad/path", reason: "invalid" },
    { kind: "NoValidFallback", attempts: ["/a", "/b"] },
    { kind: "ValidationFailed", rule: "must-exist", path: "/test" },
  ];

  for (const error of pathErrors) {
    const formatted = formatSchemaError(error);
    assert(formatted.length > 0, `Should format ${error.kind}`);
    assert(!formatted.includes("Unknown"), `Should have specific message for ${error.kind}`);
  }

  // Test all SchemaFilePathError kinds format correctly
  const schemaErrors: SchemaFilePathError[] = [
    { kind: "SchemaNotFound", message: "Not found", path: "/schema" },
    { kind: "InvalidParameters", message: "Bad params", demonstrativeType: "x", layerType: "y" },
    { kind: "ConfigurationError", message: "Config issue", setting: "setting" },
    { kind: "FileSystemError", message: "FS issue", operation: "read" },
  ];

  for (const error of schemaErrors) {
    const formatted = formatSchemaFilePathError(error);
    assert(formatted.length > 0, `Should format ${error.kind}`);

    // Verify format includes key information
    switch (error.kind) {
      case "SchemaNotFound":
        assert(formatted.includes(error.path));
        break;
      case "InvalidParameters":
        assert(formatted.includes(error.demonstrativeType));
        assert(formatted.includes(error.layerType));
        break;
      case "ConfigurationError":
        assert(formatted.includes(error.setting));
        assert(formatted.includes(error.message));
        break;
      case "FileSystemError":
        assert(formatted.includes(error.operation));
        assert(formatted.includes(error.message));
        break;
    }
  }
});
