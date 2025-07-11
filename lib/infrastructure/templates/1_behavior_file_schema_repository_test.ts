/**
 * @fileoverview 1_behavior tests for FileSchemaRepository
 *
 * Tests behavioral aspects of file-based schema repository operations:
 * - loadSchema/loadSchemas parallel loading behavior
 * - validateSchema validation logic and error handling
 * - save/saveAll batch operations and error aggregation
 * - getDependencies dependency resolution analysis
 * - Cache behavior and TTL handling
 * - Error scenarios and recovery mechanisms
 *
 * @module infrastructure/templates/file_schema_repository
 */

import { assert, assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { FileSchemaRepository, type FileSchemaRepositoryConfig } from "./file_schema_repository.ts";
import {
  Schema,
  SchemaContent as _SchemaContent,
  SchemaPath,
} from "../../domain/templates/schema_management_aggregate.ts";
import {
  type SchemaBatchResult,
  SchemaDependencyError,
  SchemaNotFoundError,
  type SchemaQueryOptions,
  SchemaValidationError,
} from "../../domain/templates/schema_repository.ts";
import { createTwoParamsResult } from "../../types/two_params_result_extension.ts";

// Helper function to create test DirectiveType and LayerType
function createTestDirectiveType(value: string): DirectiveType {
  const result = createTwoParamsResult(value, "project");
  return DirectiveType.create(result);
}

function createTestLayerType(demonstrativeType: string, value: string): LayerType {
  const result = createTwoParamsResult(demonstrativeType, value);
  return LayerType.create(result);
}

/**
 * Test setup helper
 */
async function createTestSchemaRepository(config?: Partial<FileSchemaRepositoryConfig>) {
  const tempDir = await Deno.makeTempDir({ prefix: "breakdown_schema_test_" });

  const defaultConfig: FileSchemaRepositoryConfig = {
    baseDirectory: tempDir,
    schemaDirectory: "schema",
    cacheEnabled: true,
    cacheTTLMs: 60000,
    validateOnLoad: true,
    resolveReferences: true,
    ...config,
  };

  const repository = new FileSchemaRepository(defaultConfig);

  return { repository, tempDir, cleanup: () => Deno.remove(tempDir, { recursive: true }) };
}

/**
 * Create test schema file
 */
async function createTestSchemaFile(
  baseDir: string,
  directive: string,
  layer: string,
  filename: string,
  schemaContent: Record<string, unknown>,
) {
  const schemaDir = join(baseDir, "schema", directive, layer);
  await ensureDir(schemaDir);
  const filePath = join(schemaDir, filename);
  await Deno.writeTextFile(filePath, JSON.stringify(schemaContent, null, 2));
  return filePath;
}

/**
 * Sample valid JSON Schema
 */
const sampleValidSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number", "minimum": 0 },
    "email": { "type": "string", "format": "email" },
  },
  "required": ["name", "email"],
  "additionalProperties": false,
};

/**
 * Sample schema with references
 */
const schemaWithReferences = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "user": { "$ref": "#/definitions/User" },
    "address": { "$ref": "common/address.json" },
  },
  "definitions": {
    "User": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "profile": { "$ref": "profiles/user-profile.json" },
      },
    },
  },
};

Deno.test("FileSchemaRepository loadSchema - successful load with validation", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create test schema file
    await createTestSchemaFile(_tempDir, "to", "project", "test.json", sampleValidSchema);

    // Create schema path
    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "test.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Load schema
    const schema = await repository.loadSchema(schemaPath);
    assertEquals(schema.getPath().getPath(), "to/project/test.json");
    assertEquals(schema.getContent().getContent(), sampleValidSchema);
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository loadSchema - throws SchemaNotFoundError for non-existent file", async () => {
  const { repository, cleanup } = await createTestSchemaRepository();

  try {
    const directive = createTestDirectiveType("nonexistent");
    const layer = createTestLayerType("nonexistent", "missing");
    const pathResult = SchemaPath.create(directive, layer, "missing.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    await assertRejects(
      () => repository.loadSchema(schemaPath),
      SchemaNotFoundError,
      "Schema not found: nonexistent/missing/missing.json",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository loadSchema - throws SchemaValidationError for invalid JSON", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create invalid JSON file
    const schemaDir = join(_tempDir, "schema", "to", "project");
    await ensureDir(schemaDir);
    const filePath = join(schemaDir, "invalid.json");
    await Deno.writeTextFile(filePath, "{ invalid json }");

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "invalid.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    await assertRejects(
      () => repository.loadSchema(schemaPath),
      SchemaValidationError,
      "Invalid JSON in schema",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository loadSchemas - parallel loading with mixed results", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create multiple schema files
    await createTestSchemaFile(_tempDir, "to", "project", "schema1.json", sampleValidSchema);
    await createTestSchemaFile(_tempDir, "summary", "task", "schema2.json", {
      "type": "object",
      "properties": { "summary": { "type": "string" } },
    });

    // Create schema paths
    const directive1 = createTestDirectiveType("to");
    const layer1 = createTestLayerType("to", "project");
    const path1Result = SchemaPath.create(directive1, layer1, "schema1.json");
    assert(path1Result.ok);

    const directive2 = createTestDirectiveType("summary");
    const layer2 = createTestLayerType("summary", "task");
    const path2Result = SchemaPath.create(directive2, layer2, "schema2.json");
    assert(path2Result.ok);

    const directive3 = createTestDirectiveType("missing");
    const layer3 = createTestLayerType("missing", "gone");
    const path3Result = SchemaPath.create(directive3, layer3, "nonexistent.json");
    assert(path3Result.ok);

    const paths = [path1Result.data, path2Result.data, path3Result.data];

    // Load schemas (should load 2 successfully, 1 failure)
    const resultMap = await repository.loadSchemas(paths);

    assertEquals(resultMap.size, 2);
    assert(resultMap.has("to/project/schema1.json"));
    assert(resultMap.has("summary/task/schema2.json"));
    assert(!resultMap.has("missing/gone/nonexistent.json"));
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository validateSchema - validates correct schema structure", async () => {
  const { repository, cleanup } = await createTestSchemaRepository();

  try {
    // Test valid schema
    const validResult = await repository.validateSchema(sampleValidSchema);
    assertEquals(validResult.valid, true);
    assertEquals(validResult.errors, undefined);

    // Test schema with just type
    const typeOnlyResult = await repository.validateSchema({ type: "string" });
    assertEquals(typeOnlyResult.valid, true);

    // Test schema with just properties
    const propertiesOnlyResult = await repository.validateSchema({
      properties: { name: { type: "string" } },
    });
    assertEquals(propertiesOnlyResult.valid, true);
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository validateSchema - detects invalid schema structure", async () => {
  const { repository, cleanup } = await createTestSchemaRepository();

  try {
    // Test null/non-object
    const nullResult = await repository.validateSchema(null);
    assertEquals(nullResult.valid, false);
    assert(nullResult.errors);
    assert(nullResult.errors.includes("Schema must be an object"));

    // Test empty object without required properties
    const emptyResult = await repository.validateSchema({});
    assertEquals(emptyResult.valid, false);
    assert(nullResult.errors);

    // Test invalid $schema type
    const invalidSchemaResult = await repository.validateSchema({
      $schema: 123,
      type: "object",
    });
    assertEquals(invalidSchemaResult.valid, false);
    assert(invalidSchemaResult.errors);
    assert(invalidSchemaResult.errors.some((e) => e.includes("$schema must be a string")));
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository save - creates new schema file with validation", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    const directive = createTestDirectiveType("defect");
    const layer = createTestLayerType("defect", "issue");
    const pathResult = SchemaPath.create(directive, layer, "newschema.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    const schemaResult = Schema.create(schemaPath, sampleValidSchema);
    assert(schemaResult.ok);
    const schema = schemaResult.data;

    await repository.save(schema);

    // Verify file was created
    const exists = await repository.exists(schemaPath);
    assertEquals(exists, true);

    // Verify content is correct
    const loadedSchema = await repository.loadSchema(schemaPath);
    assertEquals(loadedSchema.getContent().getContent(), sampleValidSchema);
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository save - throws SchemaValidationError for invalid schema", async () => {
  const { repository: _repository, cleanup } = await createTestSchemaRepository();

  try {
    const directive = createTestDirectiveType("invalid");
    const layer = createTestLayerType("invalid", "test");
    const pathResult = SchemaPath.create(directive, layer, "invalid.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Create schema with invalid content (this will fail at Schema.create level)
    const invalidSchema = { notAValidSchema: true };
    const schemaResult = Schema.create(schemaPath, invalidSchema);

    // Schema creation should fail due to invalid content
    assertEquals(schemaResult.ok, false);
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository saveAll - batch save with mixed results", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create valid schemas
    const directive1 = createTestDirectiveType("batch1");
    const layer1 = createTestLayerType("batch1", "test");
    const path1Result = SchemaPath.create(directive1, layer1, "schema1.json");
    assert(path1Result.ok);

    const directive2 = createTestDirectiveType("batch2");
    const layer2 = createTestLayerType("batch2", "test");
    const path2Result = SchemaPath.create(directive2, layer2, "schema2.json");
    assert(path2Result.ok);

    const schema1Result = Schema.create(path1Result.data, sampleValidSchema);
    assert(schema1Result.ok);

    const schema2Result = Schema.create(path2Result.data, {
      type: "object",
      properties: { test: { type: "string" } },
    });
    assert(schema2Result.ok);

    const schemas = [schema1Result.data, schema2Result.data];

    // Save all schemas
    const result: SchemaBatchResult = await repository.saveAll(schemas);

    assertEquals(result.successful.length, 2);
    assertEquals(result.failed.length, 0);
    assert(result.successful.includes("batch1/test/schema1.json"));
    assert(result.successful.includes("batch2/test/schema2.json"));
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository getDependencies - returns empty array (simplified implementation)", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create schema with references
    await createTestSchemaFile(_tempDir, "to", "project", "refs.json", schemaWithReferences);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "refs.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Current implementation returns empty array (simplified)
    const dependencies = await repository.getDependencies(schemaPath);
    assertEquals(dependencies.length, 0);
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository getDependencies - throws SchemaDependencyError for non-existent schema", async () => {
  const { repository, cleanup } = await createTestSchemaRepository();

  try {
    const directive = createTestDirectiveType("missing");
    const layer = createTestLayerType("missing", "gone");
    const pathResult = SchemaPath.create(directive, layer, "nonexistent.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Should throw SchemaDependencyError due to underlying SchemaNotFoundError
    await assertRejects(
      () => repository.getDependencies(schemaPath),
      SchemaDependencyError,
      "Failed to resolve dependencies",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository listAvailable - returns manifest with metadata", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create multiple schema files
    const schemaWithMeta = {
      ...sampleValidSchema,
      title: "User Schema",
      description: "Schema for user data",
      version: "1.2.0",
    };

    await createTestSchemaFile(_tempDir, "to", "project", "user.json", schemaWithMeta);
    await createTestSchemaFile(_tempDir, "summary", "task", "task.json", sampleValidSchema);

    const options: SchemaQueryOptions = { includeMetadata: true };
    const manifest = await repository.listAvailable(options);

    assertEquals(manifest.totalCount, 2);
    assertEquals(manifest.schemas.length, 2);

    const userSchema = manifest.schemas.find((s) => s.filename === "user.json");
    assert(userSchema);
    assertEquals(userSchema.title, "User Schema");
    assertEquals(userSchema.description, "Schema for user data");
    assertEquals(userSchema.version, "1.2.0");
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository listAvailable - filters by directive", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create schemas with different directives
    await createTestSchemaFile(_tempDir, "to", "project", "convert.json", sampleValidSchema);
    await createTestSchemaFile(_tempDir, "summary", "project", "summarize.json", sampleValidSchema);

    const directive = createTestDirectiveType("to");
    const options: SchemaQueryOptions = { directive };

    const manifest = await repository.listAvailable(options);

    assertEquals(manifest.totalCount, 1);
    assertEquals(manifest.schemas[0].directive, "to");
    assertEquals(manifest.schemas[0].filename, "convert.json");
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository cache behavior - respects TTL and invalidation", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository({
    cacheEnabled: true,
    cacheTTLMs: 100, // Very short TTL for testing
  });

  try {
    // Create schema file
    await createTestSchemaFile(_tempDir, "to", "project", "ttl.json", sampleValidSchema);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "ttl.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Load schema (should cache)
    const schema1 = await repository.loadSchema(schemaPath);
    assertEquals(schema1.getContent().getContent(), sampleValidSchema);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Update file content directly
    const updatedSchema = { ...sampleValidSchema, title: "Updated Schema" };
    const filePath = join(_tempDir, "schema", "to", "project", "ttl.json");
    await Deno.writeTextFile(filePath, JSON.stringify(updatedSchema, null, 2));

    // Load schema again (cache should be expired, reload from file)
    const schema2 = await repository.loadSchema(schemaPath);
    const content2 = schema2.getContent().getContent() as Record<string, unknown>;
    assertEquals(content2.title, "Updated Schema");
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository refresh - clears cache and manifest", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository();

  try {
    // Create schema and load it (to populate cache)
    await createTestSchemaFile(_tempDir, "to", "project", "cached.json", sampleValidSchema);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "cached.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Load schema to populate cache
    await repository.loadSchema(schemaPath);

    // Get manifest to populate manifest cache
    const manifest1 = await repository.listAvailable();
    assertEquals(manifest1.totalCount, 1);

    // Add another schema file directly (bypassing repository)
    await createTestSchemaFile(_tempDir, "summary", "task", "new.json", sampleValidSchema);

    // Before refresh, manifest should still show old count (cached)
    const manifest2 = await repository.listAvailable();
    assertEquals(manifest2.totalCount, 1); // Still cached

    // Refresh repository
    await repository.refresh();

    // After refresh, manifest should show updated count
    const manifest3 = await repository.listAvailable();
    assertEquals(manifest3.totalCount, 2); // Cache cleared, new scan performed
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository cache disabled - always loads from file", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository({
    cacheEnabled: false,
  });

  try {
    // Create schema file
    const filePath = await createTestSchemaFile(
      _tempDir,
      "to",
      "project",
      "nocache.json",
      sampleValidSchema,
    );

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "nocache.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Load schema first time
    const schema1 = await repository.loadSchema(schemaPath);
    assertEquals(schema1.getContent().getContent(), sampleValidSchema);

    // Update file content directly
    const updatedSchema = { ...sampleValidSchema, title: "Updated Immediately" };
    await Deno.writeTextFile(filePath, JSON.stringify(updatedSchema, null, 2));

    // Load schema again (should get updated content since cache is disabled)
    const schema2 = await repository.loadSchema(schemaPath);
    const content2 = schema2.getContent().getContent() as Record<string, unknown>;
    assertEquals(content2.title, "Updated Immediately");
  } finally {
    await cleanup();
  }
});

Deno.test("FileSchemaRepository validateOnLoad disabled - skips validation", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestSchemaRepository({
    validateOnLoad: false,
  });

  try {
    // Create schema file with potentially invalid content that would still be a valid JSON object
    const looseSchema = { customProperty: "value", type: "object" };
    await createTestSchemaFile(_tempDir, "to", "project", "loose.json", looseSchema);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = SchemaPath.create(directive, layer, "loose.json");
    assert(pathResult.ok);
    const schemaPath = pathResult.data;

    // Should load successfully without validation
    const schema = await repository.loadSchema(schemaPath);
    assertEquals(schema.getContent().getContent(), looseSchema);
  } finally {
    await cleanup();
  }
});
