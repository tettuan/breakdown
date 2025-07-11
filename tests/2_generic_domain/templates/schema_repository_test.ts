/**
 * @fileoverview Schema Repository Integration Tests
 * Testing schema repository coordination and integration scenarios
 *
 * Integration tests verify:
 * - Schema repository and schema aggregate collaboration
 * - Schema loading and validation workflows
 * - Schema dep  // Create and save schema
  const schema = createMockSchema(
    schemaPath,
    { type: "object", properties: { title: { type: "string" } } },
    createMockMetadata(createMockMetadata({ title: "Project Schema", description: "Base project schema", version: "1.0.0" })),
  );y resolution
 * - Error handling across repository boundaries
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type {
  SchemaBatchResult,
  SchemaDependencyError as _SchemaDependencyError,
  SchemaManifest,
  SchemaNotFoundError as _SchemaNotFoundError,
  SchemaQueryOptions,
  SchemaRepository,
  SchemaValidationError as _SchemaValidationError,
} from "../../../lib/domain/templates/schema_repository.ts";
import {
  Schema,
  SchemaContent as _SchemaContent,
  type SchemaMetadata,
  SchemaPath,
  type ValidationResult as _ValidationResult,
} from "../../../lib/domain/templates/schema_management_aggregate.ts";
import type { DirectiveType, LayerType } from "../../../lib/types/mod.ts";

const logger = new BreakdownLogger("schema-repository-integration");

// Mock SchemaRepository implementation for testing
class TestSchemaRepository implements SchemaRepository {
  private schemas = new Map<string, Schema>();
  private manifest: SchemaManifest;

  constructor() {
    this.manifest = {
      schemas: [],
      generatedAt: new Date(),
      totalCount: 0,
    };
  }

  loadSchema(path: SchemaPath): Promise<Schema> {
    logger.debug("Loading schema", { path: path.getPath() });
    const key = path.getPath();
    const schema = this.schemas.get(key);
    if (!schema) {
      throw new Error(`Schema not found: ${key}`);
    }
    return Promise.resolve(schema);
  }

  async loadSchemas(paths: SchemaPath[]): Promise<Map<string, Schema>> {
    logger.debug("Loading multiple schemas", { pathCount: paths.length });
    const result = new Map<string, Schema>();
    for (const path of paths) {
      try {
        const schema = await this.loadSchema(path);
        result.set(path.getPath(), schema);
      } catch (error) {
        logger.debug("Failed to load schema", {
          path: path.getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return result;
  }

  exists(path: SchemaPath): Promise<boolean> {
    const key = path.getPath();
    return Promise.resolve(this.schemas.has(key));
  }

  listAvailable(options?: SchemaQueryOptions): Promise<SchemaManifest> {
    logger.debug("Listing available schemas", { options });
    let filteredSchemas = this.manifest.schemas;

    if (options?.directive) {
      filteredSchemas = filteredSchemas.filter((s) =>
        s.directive === options.directive!.getValue()
      );
    }

    if (options?.layer) {
      filteredSchemas = filteredSchemas.filter((s) => s.layer === options.layer!.getValue());
    }

    return Promise.resolve({
      schemas: filteredSchemas,
      generatedAt: new Date(),
      totalCount: filteredSchemas.length,
    });
  }

  save(schema: Schema): Promise<void> {
    logger.debug("Saving schema", { path: schema.getPath().getPath() });
    const key = schema.getPath().getPath();
    this.schemas.set(key, schema);

    // Update manifest
    const existing = this.manifest.schemas.findIndex((s) => s.path === key);
    const manifestEntry = {
      path: key,
      directive: schema.getPath().getDirective().getValue(),
      layer: schema.getPath().getLayer().getValue(),
      filename: schema.getPath().getFilename(),
      title: schema.getMetadata().title,
      description: schema.getMetadata().description,
      version: schema.getMetadata().version,
    };

    if (existing >= 0) {
      this.manifest.schemas[existing] = manifestEntry;
    } else {
      this.manifest.schemas.push(manifestEntry);
      this.manifest.totalCount++;
    }
    return Promise.resolve();
  }

  async saveAll(schemas: Schema[]): Promise<SchemaBatchResult> {
    logger.debug("Saving multiple schemas", { schemaCount: schemas.length });
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const schema of schemas) {
      try {
        await this.save(schema);
        successful.push(schema.getPath().getPath());
      } catch (error) {
        failed.push({
          path: schema.getPath().getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { successful, failed };
  }

  delete(path: SchemaPath): Promise<void> {
    logger.debug("Deleting schema", { path: path.getPath() });
    const key = path.getPath();
    if (!this.schemas.has(key)) {
      throw new Error(`Schema not found: ${key}`);
    }
    this.schemas.delete(key);

    // Update manifest
    this.manifest.schemas = this.manifest.schemas.filter((s) => s.path !== key);
    this.manifest.totalCount--;
    return Promise.resolve();
  }

  async deleteAll(paths: SchemaPath[]): Promise<SchemaBatchResult> {
    logger.debug("Deleting multiple schemas", { pathCount: paths.length });
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const path of paths) {
      try {
        await this.delete(path);
        successful.push(path.getPath());
      } catch (error) {
        failed.push({
          path: path.getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { successful, failed };
  }

  async getDependencies(path: SchemaPath): Promise<SchemaPath[]> {
    logger.debug("Getting schema dependencies", { path: path.getPath() });
    const _schema = await this.loadSchema(path);
    // Mock dependency extraction - in real implementation would parse schema content
    return [];
  }

  validateSchema(content: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    logger.debug("Validating schema content", { hasContent: !!content });

    if (!content || typeof content !== "object") {
      return Promise.resolve({
        valid: false,
        errors: ["Schema content must be an object"],
      });
    }

    // Mock validation - in real implementation would use JSON Schema validator
    const schemaObj = content as Record<string, unknown>;
    const errors: string[] = [];

    if (!schemaObj.type) {
      errors.push("Schema must have a 'type' property");
    }

    if (!schemaObj.properties && schemaObj.type === "object") {
      errors.push("Object schemas must have 'properties'");
    }

    return Promise.resolve({
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  refresh(): Promise<void> {
    logger.debug("Refreshing schema repository");
    this.manifest.generatedAt = new Date();
    return Promise.resolve();
  }

  // Test helper methods
  addMockSchema(schema: Schema): void {
    const key = schema.getPath().getPath();
    this.schemas.set(key, schema);
  }
}

// Helper function to create proper SchemaMetadata
function createMockMetadata(partial: Partial<SchemaMetadata> = {}): SchemaMetadata {
  return {
    title: partial.title,
    description: partial.description,
    version: partial.version || "1.0.0",
    author: partial.author || "test-author",
    tags: partial.tags,
    createdAt: partial.createdAt || new Date(),
    updatedAt: partial.updatedAt || new Date(),
  };
}

// Helper functions to create mock objects
function createMockSchemaPath(
  directive: DirectiveType,
  layer: LayerType,
  filename: string,
): SchemaPath {
  const result = SchemaPath.create(directive, layer, filename + ".json"); // Ensure .json extension
  if (!result.ok) {
    throw new Error(`Failed to create SchemaPath: ${result.error}`);
  }
  return result.data;
}

// Helper function to create Schema objects for testing
function createMockSchema(
  path: SchemaPath,
  content: Record<string, unknown>,
  metadata: Partial<SchemaMetadata> = {},
): Schema {
  const result = Schema.create(path, content, metadata);
  if (!result.ok) {
    throw new Error(`Failed to create Schema: ${result.error}`);
  }
  return result.data;
}

// Mock DirectiveType and LayerType
const createMockDirective = (value: string): DirectiveType => ({
  getValue: () => value,
} as DirectiveType);

const createMockLayer = (value: string): LayerType => ({
  getValue: () => value,
} as LayerType);

Deno.test("Schema Repository Integration: basic schema lifecycle", async () => {
  logger.debug("Testing basic schema lifecycle");

  const repository = new TestSchemaRepository();
  const directive = createMockDirective("to");
  const layer = createMockLayer("project");
  const schemaPath = createMockSchemaPath(directive, layer, "base.schema.md");

  // Initially schema should not exist
  const exists = await repository.exists(schemaPath);
  assertEquals(exists, false);

  // Create and save schema
  const schema = createMockSchema(
    schemaPath,
    { type: "object", properties: { title: { type: "string" } } },
    createMockMetadata({
      title: "Project Schema",
      description: "Base project schema",
      version: "1.0.0",
    }),
  );

  await repository.save(schema);

  // Schema should now exist
  const existsAfterSave = await repository.exists(schemaPath);
  assertEquals(existsAfterSave, true);

  // Load and verify schema
  const loadedSchema = await repository.loadSchema(schemaPath);
  assertExists(loadedSchema);
  assertEquals(loadedSchema.getPath().getPath(), schemaPath.getPath());
  assertEquals(loadedSchema.getMetadata().title, "Project Schema");
});

Deno.test("Schema Repository Integration: batch operations", async () => {
  logger.debug("Testing batch operations");

  const repository = new TestSchemaRepository();

  // Create multiple schemas
  const schemas = [
    createMockSchema(
      createMockSchemaPath(createMockDirective("to"), createMockLayer("project"), "schema1.md"),
      { type: "object" },
      createMockMetadata({ version: "1.0.0" }),
    ),
    createMockSchema(
      createMockSchemaPath(createMockDirective("to"), createMockLayer("issue"), "schema2.md"),
      { type: "object" },
      createMockMetadata({ version: "1.0.0" }),
    ),
    createMockSchema(
      createMockSchemaPath(createMockDirective("summary"), createMockLayer("task"), "schema3.md"),
      { type: "object" },
      createMockMetadata({ version: "1.0.0" }),
    ),
  ];

  // Save all schemas
  const saveResult = await repository.saveAll(schemas);
  assertEquals(saveResult.successful.length, 3);
  assertEquals(saveResult.failed.length, 0);

  // Load multiple schemas
  const paths = schemas.map((s) => s.getPath());
  const loadedSchemas = await repository.loadSchemas(paths);
  assertEquals(loadedSchemas.size, 3);

  // Verify each schema was loaded correctly
  for (const schema of schemas) {
    const loaded = loadedSchemas.get(schema.getPath().getPath());
    assertExists(loaded);
    assertEquals(loaded.getPath().getPath(), schema.getPath().getPath());
  }
});

Deno.test("Schema Repository Integration: query and manifest", async () => {
  logger.debug("Testing query and manifest operations");

  const repository = new TestSchemaRepository();

  // Setup test data
  const schemas = [
    createMockSchema(
      createMockSchemaPath(createMockDirective("to"), createMockLayer("project"), "to_project.md"),
      { type: "object" },
      createMockMetadata({ title: "To Project", version: "1.0.0" }),
    ),
    createMockSchema(
      createMockSchemaPath(createMockDirective("to"), createMockLayer("issue"), "to_issue.md"),
      { type: "object" },
      createMockMetadata({ title: "To Issue", version: "1.0.0" }),
    ),
    createMockSchema(
      createMockSchemaPath(
        createMockDirective("summary"),
        createMockLayer("project"),
        "summary_project.md",
      ),
      { type: "object" },
      createMockMetadata({ title: "Summary Project", version: "1.0.0" }),
    ),
  ];

  await repository.saveAll(schemas);

  // Query all schemas
  const allSchemas = await repository.listAvailable();
  assertEquals(allSchemas.totalCount, 3);
  assertEquals(allSchemas.schemas.length, 3);

  // Query by directive
  const toDirectiveSchemas = await repository.listAvailable({
    directive: createMockDirective("to"),
  });
  assertEquals(toDirectiveSchemas.totalCount, 2);
  assertEquals(toDirectiveSchemas.schemas.every((s) => s.directive === "to"), true);

  // Query by layer
  const projectLayerSchemas = await repository.listAvailable({
    layer: createMockLayer("project"),
  });
  assertEquals(projectLayerSchemas.totalCount, 2);
  assertEquals(projectLayerSchemas.schemas.every((s) => s.layer === "project"), true);

  // Query by both directive and layer
  const specificSchemas = await repository.listAvailable({
    directive: createMockDirective("to"),
    layer: createMockLayer("project"),
  });
  assertEquals(specificSchemas.totalCount, 1);
  assertEquals(specificSchemas.schemas[0].directive, "to");
  assertEquals(specificSchemas.schemas[0].layer, "project");
});

Deno.test("Schema Repository Integration: validation workflow", async () => {
  logger.debug("Testing validation workflow");

  const repository = new TestSchemaRepository();

  // Test valid schema content
  const validContent = {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
    },
    required: ["title"],
  };

  const validResult = await repository.validateSchema(validContent);
  assertEquals(validResult.valid, true);
  assertEquals(validResult.errors, undefined);

  // Test invalid schema content
  const invalidContent = {
    // Missing 'type' property
    properties: {
      title: { type: "string" },
    },
  };

  const invalidResult = await repository.validateSchema(invalidContent);
  assertEquals(invalidResult.valid, false);
  assertExists(invalidResult.errors);
  assertEquals(invalidResult.errors.length > 0, true);
  assertEquals(invalidResult.errors.some((e) => e.includes("type")), true);

  // Test completely invalid content
  const completelyInvalidResult = await repository.validateSchema(null);
  assertEquals(completelyInvalidResult.valid, false);
  assertExists(completelyInvalidResult.errors);
  assertEquals(completelyInvalidResult.errors.some((e) => e.includes("object")), true);
});

Deno.test("Schema Repository Integration: error handling", async () => {
  logger.debug("Testing error handling scenarios");

  const repository = new TestSchemaRepository();
  const nonExistentPath = createMockSchemaPath(
    createMockDirective("nonexistent"),
    createMockLayer("layer"),
    "missing.md",
  );

  // Test loading non-existent schema
  try {
    await repository.loadSchema(nonExistentPath);
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    assertEquals(errorMessage.includes("Schema not found"), true);
  }

  // Test deleting non-existent schema
  try {
    await repository.delete(nonExistentPath);
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    assertEquals(errorMessage.includes("Schema not found"), true);
  }

  // Test batch operations with mixed success/failure
  const schemas = [
    createMockSchema(
      createMockSchemaPath(createMockDirective("valid"), createMockLayer("schema"), "valid.md"),
      { type: "object" },
      createMockMetadata({ version: "1.0.0" }),
    ),
  ];

  // First save should succeed
  const firstSaveResult = await repository.saveAll(schemas);
  assertEquals(firstSaveResult.successful.length, 1);
  assertEquals(firstSaveResult.failed.length, 0);

  // Test batch load with missing schemas
  const mixedPaths = [
    schemas[0].getPath(),
    nonExistentPath,
  ];

  const loadResult = await repository.loadSchemas(mixedPaths);
  assertEquals(loadResult.size, 1); // Only one schema should be loaded
  assertEquals(loadResult.has(schemas[0].getPath().getPath()), true);
  assertEquals(loadResult.has(nonExistentPath.getPath()), false);
});

Deno.test("Schema Repository Integration: dependency resolution", async () => {
  logger.debug("Testing dependency resolution");

  const repository = new TestSchemaRepository();

  // Create schema with potential dependencies
  const baseSchema = createMockSchema(
    createMockSchemaPath(createMockDirective("to"), createMockLayer("project"), "base.md"),
    {
      type: "object",
      properties: {
        extends: { $ref: "#/definitions/base" },
      },
    },
    createMockMetadata({ version: "1.0.0" }),
  );

  await repository.save(baseSchema);

  // Get dependencies (mock implementation returns empty array)
  const dependencies = await repository.getDependencies(baseSchema.getPath());
  assertEquals(Array.isArray(dependencies), true);

  // In a real implementation, this would parse the schema content
  // and return actual dependency paths
});

Deno.test("Schema Repository Integration: refresh and cache management", async () => {
  logger.debug("Testing refresh and cache management");

  const repository = new TestSchemaRepository();

  // Get initial manifest
  const initialManifest = await repository.listAvailable();
  const initialTime = initialManifest.generatedAt;

  // Wait a bit to ensure time difference
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Refresh repository
  await repository.refresh();

  // Get manifest after refresh
  const refreshedManifest = await repository.listAvailable();
  const refreshedTime = refreshedManifest.generatedAt;

  // Verify refresh updated the timestamp
  assertEquals(refreshedTime > initialTime, true);
});
