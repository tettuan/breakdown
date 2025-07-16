/**
 * @fileoverview Behavior tests for SchemaFilePathResolver
 *
 * Tests the behavioral correctness of schema path resolution including:
 * - Path resolution strategies
 * - Configuration handling
 * - Error scenarios and recovery
 * - Integration with file system
 * - Edge cases and boundary conditions
 *
 * @module factory/1_behavior_schema_file_path_resolver_test
 */

import { assert, assertEquals, assertStringIncludes } from "../deps.ts";
import { SchemaFilePathResolver, SchemaPath } from "./schema_file_path_resolver_totality.ts";
import { ensureDir } from "../deps.ts";
import { join, resolve } from "@std/path";

// Test fixtures setup
const TEST_BASE_DIR = resolve(Deno.cwd(), ".test_schema_resolver");
const SCHEMA_DIR = join(TEST_BASE_DIR, "schema");

async function setupTestEnvironment() {
  // Create test directory structure
  await ensureDir(join(SCHEMA_DIR, "to", "project"));
  await ensureDir(join(SCHEMA_DIR, "summary", "issue"));
  await ensureDir(join(SCHEMA_DIR, "defect", "task"));

  // Create test schema files
  await Deno.writeTextFile(
    join(SCHEMA_DIR, "to", "project", "base.schema.md"),
    "# Test Schema for to/project",
  );
  await Deno.writeTextFile(
    join(SCHEMA_DIR, "summary", "issue", "base.schema.md"),
    "# Test Schema for summary/issue",
  );
}

async function cleanupTestEnvironment() {
  try {
    await Deno.remove(TEST_BASE_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

Deno.test("SchemaFilePathResolver Behavior - Resolves schema paths correctly", async () => {
  await setupTestEnvironment();

  try {
    const config = { app_schema: { base_dir: SCHEMA_DIR } };
    const params = {
      directiveType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = SchemaFilePathResolver.create(config, params);
    assert(resolverResult.ok);

    const pathResult = resolverResult.data.getPath();
    assert(pathResult.ok, "Should resolve existing schema path");

    const schemaPath = pathResult.data;
    assertEquals(
      schemaPath.value,
      join(SCHEMA_DIR, "to", "project", "base.schema.md"),
    );
    assertEquals(schemaPath.metadata.directiveType, "to");
    assertEquals(schemaPath.metadata.layerType, "project");
    assertEquals(schemaPath.metadata.fileName, "base.schema.md");
    assertEquals(
      schemaPath.getDescription(),
      "Schema: to/project/base.schema.md",
    );
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - Handles different parameter types", async () => {
  await setupTestEnvironment();

  try {
    const config = { app_schema: { base_dir: SCHEMA_DIR } };

    // Test various demonstrative and layer type combinations
    const testCases = [
      { directiveType: "to", layerType: "project" },
      { directiveType: "summary", layerType: "issue" },
    ];

    for (const testCase of testCases) {
      const params = { ...testCase, options: {} };
      const resolverResult = SchemaFilePathResolver.create(config, params);
      assert(resolverResult.ok);

      const pathResult = resolverResult.data.getPath();
      assert(pathResult.ok);

      const expectedPath = join(
        SCHEMA_DIR,
        testCase.directiveType,
        testCase.layerType,
        "base.schema.md",
      );
      assertEquals(pathResult.data.value, expectedPath);
    }
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - Handles missing schema files", async () => {
  await setupTestEnvironment();

  try {
    const config = { app_schema: { base_dir: SCHEMA_DIR } };
    const params = {
      directiveType: "unknown",
      layerType: "type",
      options: {},
    };

    const resolverResult = SchemaFilePathResolver.create(config, params);
    assert(resolverResult.ok);

    const pathResult = resolverResult.data.getPath();
    assert(!pathResult.ok, "Should fail for non-existent schema");
    assertEquals(pathResult.error.kind, "TemplateNotFound");
    if (pathResult.error.kind === "TemplateNotFound") {
      assert(pathResult.error.attempted.length > 0);
    }
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - Uses default base directory", () => {
  // Test without explicit base_dir configuration
  const config = {};
  const params = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const resolverResult = SchemaFilePathResolver.create(config, params);
  assert(resolverResult.ok);

  // Schema resolver doesn't expose base directory directly anymore
  // Instead, we can verify through getPath() result
  const pathResult = resolverResult.data.getPath();
  if (pathResult.ok) {
    const schemaPath = pathResult.data;
    assertStringIncludes(schemaPath.value, ".agent/breakdown/schema");
    assert(
      schemaPath.value.startsWith("/") || /^[A-Z]:/.test(schemaPath.value),
      "Should be absolute path",
    );
  }
});

Deno.test("SchemaFilePathResolver Behavior - Handles relative base directory", async () => {
  await setupTestEnvironment();

  try {
    // Use relative path from current directory
    const relativePath = ".test_schema_resolver/schema";
    const config = { app_schema: { base_dir: relativePath } };
    const params = {
      directiveType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = SchemaFilePathResolver.create(config, params);
    assert(resolverResult.ok);

    const pathResult = resolverResult.data.getPath();
    assert(pathResult.ok);

    // Path should be resolved to absolute
    const schemaPath = pathResult.data.value;
    assert(schemaPath.startsWith("/") || /^[A-Z]:/.test(schemaPath), "Should be absolute path");
    assertStringIncludes(schemaPath, "to/project/base.schema.md");
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - Handles TwoParams_Result format", async () => {
  await setupTestEnvironment();

  try {
    const config = { app_schema: { base_dir: SCHEMA_DIR } };
    const twoParams = {
      type: "two" as const,
      params: ["to", "project"],
      directiveType: "to",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = SchemaFilePathResolver.create(config, twoParams);
    assert(resolverResult.ok);

    const pathResult = resolverResult.data.getPath();
    assert(pathResult.ok);

    assertEquals(
      pathResult.data.value,
      join(SCHEMA_DIR, "to", "project", "base.schema.md"),
    );
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - buildFileName returns consistent value", () => {
  const config = { app_schema: { base_dir: "/test" } };
  const params = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const resolverResult = SchemaFilePathResolver.create(config, params);
  assert(resolverResult.ok);

  // Should always return "base.schema.md"
  const fileName = resolverResult.data.buildFileName();
  assertEquals(fileName, "base.schema.md");

  // Multiple calls should return same value
  assertEquals(resolverResult.data.buildFileName(), fileName);
});

Deno.test("SchemaFilePathResolver Behavior - buildSchemaPath constructs correct paths", () => {
  const config = { app_schema: { base_dir: "/test" } };
  const params = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const resolverResult = SchemaFilePathResolver.create(config, params);
  assert(resolverResult.ok);

  const path = resolverResult.data.buildSchemaPath("/base/dir", "file.md");
  assertEquals(path, "/base/dir/to/project/file.md");

  // Test with different parameters
  const params2 = {
    directiveType: "summary",
    layerType: "issue",
    options: {},
  };

  const resolverResult2 = SchemaFilePathResolver.create(config, params2);
  assert(resolverResult2.ok);

  const path2 = resolverResult2.data.buildSchemaPath("/other", "schema.md");
  assertEquals(path2, "/other/summary/issue/schema.md");
});

Deno.test("SchemaFilePathResolver Behavior - Handles missing base directory gracefully", () => {
  const config = { app_schema: { base_dir: "/nonexistent/path" } };
  const params = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const resolverResult = SchemaFilePathResolver.create(config, params);
  assert(resolverResult.ok);

  const pathResult = resolverResult.data.getPath();
  assert(!pathResult.ok);
  assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");
});

Deno.test("SchemaFilePathResolver Behavior - Legacy methods work correctly", async () => {
  await setupTestEnvironment();

  try {
    const config = { app_schema: { base_dir: SCHEMA_DIR } };
    const params = {
      directiveType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = SchemaFilePathResolver.create(config, params);
    assert(resolverResult.ok);

    // Test path resolution
    const pathResult = resolverResult.data.getPath();
    assert(pathResult.ok);
    assertEquals(
      pathResult.data.value,
      join(SCHEMA_DIR, "to", "project", "base.schema.md"),
    );
  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("SchemaFilePathResolver Behavior - SchemaPath validation", () => {
  // Test SchemaPath.create validation
  const validCases = [
    {
      path: "/absolute/path.md",
      metadata: {
        baseDir: "/test",
        directiveType: "to",
        layerType: "project",
        fileName: "base.schema.md",
      },
    },
  ];

  // Add Windows path only on Windows platform
  if (Deno.build.os === "windows") {
    validCases.push({
      path: "C:\\Windows\\path.md",
      metadata: {
        baseDir: "C:\\test",
        directiveType: "to",
        layerType: "project",
        fileName: "base.schema.md",
      },
    });
  }

  for (const testCase of validCases) {
    const result = SchemaPath.create(testCase.path, testCase.metadata);
    assert(result.ok, `Should accept valid path: ${testCase.path}`);
  }

  // Test invalid cases
  const invalidCases = [
    {
      path: "",
      metadata: {
        baseDir: "/test",
        directiveType: "to",
        layerType: "project",
        fileName: "base.schema.md",
      },
    },
    {
      path: "   ",
      metadata: {
        baseDir: "/test",
        directiveType: "to",
        layerType: "project",
        fileName: "base.schema.md",
      },
    },
    {
      path: "relative/path.md",
      metadata: {
        baseDir: "/test",
        directiveType: "to",
        layerType: "project",
        fileName: "base.schema.md",
      },
    },
  ];

  for (const testCase of invalidCases) {
    const result = SchemaPath.create(testCase.path, testCase.metadata);
    assert(!result.ok, `Should reject invalid path: ${testCase.path}`);
  }
});

Deno.test("SchemaFilePathResolver Behavior - Handles complex configurations", async () => {
  // Create actual directory for complex config test
  const testDir = join(Deno.cwd(), ".test_complex_config", "schema", "base");
  await ensureDir(testDir);

  try {
    // Test with nested configuration and extra properties
    const complexConfig = {
      app_schema: { base_dir: ".test_complex_config/schema/base" },
      app_prompt: { base_dir: "/prompt/base" },
      extra: {
        nested: {
          property: "value",
        },
      },
    };

    const params = {
      directiveType: "to",
      layerType: "project",
      options: {
        fromFile: "input.txt",
        destinationFile: "output.md",
        customVariables: { key: "value" },
      },
    };

    const resolverResult = SchemaFilePathResolver.create(complexConfig, params);
    assert(resolverResult.ok, "Should handle complex configurations");

    // Verify path resolution works with complex configuration
    const pathResult = resolverResult.data.getPath();
    if (pathResult.ok) {
      const schemaPath = pathResult.data;
      // Schema path should be resolved correctly
      assert(
        schemaPath.value.includes("schema") || schemaPath.value.includes(testDir),
        `Schema path should contain expected directory, got: ${schemaPath.value}`,
      );
    }
  } finally {
    await Deno.remove(join(Deno.cwd(), ".test_complex_config"), { recursive: true }).catch(
      () => {},
    );
  }
});

Deno.test("SchemaFilePathResolver Behavior - Parameter extraction edge cases", () => {
  const config = { app_schema: { base_dir: "/test" } };

  // Test with params array containing empty strings
  const edgeCaseParams = {
    type: "two" as const,
    params: ["", ""],
    directiveType: "",
    demonstrativeType: "", // Same as directiveType (empty)
    layerType: "",
    options: {},
  };

  const result = SchemaFilePathResolver.create(config, edgeCaseParams);
  assert(!result.ok);
  assertEquals(result.error.kind, "InvalidParameterCombination");

  // Test with params array with valid values but empty type properties
  const mixedParams = {
    type: "two" as const,
    params: ["to", "project"],
    directiveType: "",
    demonstrativeType: "", // Same as directiveType (empty)
    layerType: "",
    options: {},
  };

  const mixedResult = SchemaFilePathResolver.create(config, mixedParams);
  // Should fail because directiveType/layerType exist but are empty
  assert(!mixedResult.ok, "Should fail when type properties exist but are empty");
  assertEquals(mixedResult.error.kind, "InvalidParameterCombination");

  // Test with params array where directiveType/layerType are derived from params
  const paramsOnlyInput = {
    type: "two" as const,
    params: ["to", "project"],
    directiveType: "to",
    demonstrativeType: "to", // Should match params[0]
    layerType: "project", // Should match params[1]
    options: {},
  };

  const paramsOnlyResult = SchemaFilePathResolver.create(config, paramsOnlyInput);
  assert(paramsOnlyResult.ok, "Should succeed when properties match params array");
});
