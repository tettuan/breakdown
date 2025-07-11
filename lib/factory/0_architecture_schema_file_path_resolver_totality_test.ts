/**
 * @fileoverview Architecture tests for SchemaFilePathResolverTotality
 *
 * Tests verify:
 * - Smart constructor validation
 * - Result type usage throughout
 * - No partial functions
 * - Discriminated union handling
 * - Exhaustive error cases
 * - Schema-specific validations
 */

import { assertEquals, assertExists } from "@std/assert";
import { SchemaFilePathResolverTotality } from "./schema_file_path_resolver_totality.ts";

Deno.test("SchemaFilePathResolverTotality - Smart Constructor validates inputs", () => {
  // Test invalid config
  const invalidConfigs = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const config of invalidConfigs) {
    const result = SchemaFilePathResolverTotality.create(
      config as unknown as { working_dir: string; resource_dir: string },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidConfiguration");
    }
  }

  // Test invalid cliParams
  const validConfig = { app_schema: { base_dir: "schema" } };
  const invalidParams = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const params of invalidParams) {
    const result = SchemaFilePathResolverTotality.create(
      validConfig,
      params as unknown as {
        demonstrativeType: string;
        layerType: string;
        options: Record<string, unknown>;
      },
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidConfiguration");
    }
  }
});

Deno.test("SchemaFilePathResolverTotality - validates required parameters", () => {
  const config = { app_schema: { base_dir: "schema" } };

  // Missing demonstrativeType
  const result1 = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "", layerType: "project", options: {} },
  );
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "InvalidParameterCombination");
  }

  // Missing layerType
  const result2 = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "", options: {} },
  );
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidParameterCombination");
  }

  // Valid parameters
  const result3 = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );
  assertEquals(result3.ok, true);
});

Deno.test("SchemaFilePathResolverTotality - normalizes config to discriminated union", () => {
  // WithSchemaConfig
  const result1 = SchemaFilePathResolverTotality.create(
    { app_schema: { base_dir: "custom/schema" } },
    { demonstrativeType: "to", layerType: "project", options: {} },
  );
  assertEquals(result1.ok, true);

  // NoSchemaConfig (uses default)
  const result2 = SchemaFilePathResolverTotality.create(
    {},
    { demonstrativeType: "to", layerType: "project", options: {} },
  );
  assertEquals(result2.ok, true);

  // Invalid schema config (non-string base_dir) - should use default
  const result3 = SchemaFilePathResolverTotality.create(
    { app_schema: { base_dir: 123 } },
    { demonstrativeType: "to", layerType: "project", options: {} },
  );
  assertEquals(result3.ok, true);
});

Deno.test("SchemaFilePathResolverTotality - buildFileName returns standard name", () => {
  const config = { app_schema: { base_dir: "." } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "base.schema.md");
  }
});

Deno.test("SchemaFilePathResolverTotality - buildSchemaPath constructs correct paths", () => {
  const config = { app_schema: { base_dir: "schema" } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const path = resolver.buildSchemaPath("/base", "base.schema.md");
    assertEquals(path, "/base/to/project/base.schema.md");
  }
});

Deno.test("SchemaFilePathResolverTotality - handles TwoParams_Result structure", () => {
  const config = { app_schema: { base_dir: "." } };

  const twoParams = {
    type: "two" as const,
    params: ["summary", "issue"],
    demonstrativeType: "", // Will be extracted from params
    layerType: "", // Will be extracted from params
    options: {},
  };

  const resolverResult = SchemaFilePathResolverTotality.create(config, twoParams);

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const path = resolver.buildSchemaPath("/base", "base.schema.md");
    assertEquals(path, "/base/summary/issue/base.schema.md");
  }
});

Deno.test("SchemaFilePathResolverTotality - getPossiblePaths returns all fallback paths", () => {
  const config = { app_schema: { base_dir: "." } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathsResult = resolver.getPossiblePaths();

    assertEquals(pathsResult.ok, true);
    if (pathsResult.ok) {
      const paths = pathsResult.data;
      assertEquals(paths.length, 3);
      // Should include main path and fallbacks
      assertEquals(paths[0].endsWith("/to/project/base.schema.md"), true);
      assertEquals(paths[1].endsWith("/to/base.schema.md"), true);
      assertEquals(paths[2].endsWith("/base.schema.md"), true);
    }
  }
});

Deno.test("SchemaFilePathResolverTotality - validateSchemaContent checks structure", () => {
  const config = { app_schema: { base_dir: "." } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Valid schema content
    const valid1 = resolver.validateSchemaContent("# Schema\n\nContent here");
    assertEquals(valid1.ok, true);

    const valid2 = resolver.validateSchemaContent("## Schema Definition\n\nContent");
    assertEquals(valid2.ok, true);

    // Invalid schema content
    const invalid1 = resolver.validateSchemaContent("");
    assertEquals(invalid1.ok, false);
    if (!invalid1.ok) {
      assertEquals(invalid1.error.kind, "SchemaValidationFailed");
    }

    const invalid2 = resolver.validateSchemaContent("Just some text without schema header");
    assertEquals(invalid2.ok, false);
    if (!invalid2.ok) {
      assertEquals(invalid2.error.kind, "SchemaValidationFailed");
    }
  }
});

Deno.test("SchemaFilePathResolverTotality - SchemaPath value object validates", () => {
  const config = { app_schema: { base_dir: "." } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    // Path resolution will fail if file doesn't exist, but we can test the error
    const pathResult = resolver.getPath();

    // Since the file likely doesn't exist in test environment, expect TemplateNotFound
    if (!pathResult.ok && pathResult.error.kind === "TemplateNotFound") {
      // Error message should be helpful
      assertExists(pathResult.error.attempted);
      assertEquals(pathResult.error.attempted.length > 0, true);
    }
  }
});

Deno.test("SchemaFilePathResolverTotality - handles path with null character", () => {
  const config = { app_schema: { base_dir: "/path/with\0null" } };

  const resolverResult = SchemaFilePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, false);
    if (!pathResult.ok) {
      assertEquals(pathResult.error.kind, "InvalidPath");
    }
  }
});
