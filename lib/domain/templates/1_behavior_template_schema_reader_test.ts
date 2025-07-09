/**
 * @fileoverview Behavior tests for TemplateSchemaReader
 * Tests the schema reading service behavior, filesystem operations, error handling, and Result type validation
 */

import { assertEquals, assert, assertRejects } from "../../deps.ts";
import { 
  TemplateSchemaReader, 
  createTemplateSchemaReader,
  type SchemaReadOptions,
  type SchemaReadResult,
  type SchemaBatchReadResult,
} from "./template_schema_reader.ts";
import type { 
  SchemaRepository, 
  SchemaManifestEntry, 
  SchemaManifest,
  SchemaQueryOptions,
  SchemaBatchResult
} from "./schema_repository.ts";
import { Schema, SchemaPath, SchemaContent } from "./schema_management_aggregate.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";

// Mock types for testing
class MockDirectiveType {
  constructor(private value: string) {}
  getValue(): string { return this.value; }
}

class MockLayerType {
  constructor(private value: string) {}
  getValue(): string { return this.value; }
}

// Mock SchemaRepository for testing
class MockSchemaRepository implements SchemaRepository {
  private schemas = new Map<string, Schema>();
  private dependencies = new Map<string, SchemaPath[]>();
  private mockValidationResult?: { valid: boolean; errors?: string[] };

  constructor() {
    this.setupMockData();
  }

  private setupMockData() {
    // Setup test schemas
    const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
    const mockLayer = new MockLayerType("project") as unknown as LayerType;
    
    const validSchemaContent = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        name: { type: "string" },
        version: { type: "string" }
      },
      required: ["name"]
    };

    const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
    if (pathResult.ok) {
      const contentResult = SchemaContent.create(validSchemaContent);
      if (contentResult.ok) {
        const schemaResult = Schema.create(pathResult.data, contentResult.data.getContent());
        if (schemaResult.ok) {
          this.schemas.set("to/project/valid.json", schemaResult.data);
        }
      }
    }

    // Setup dependencies
    const depPath = SchemaPath.create(mockDirective, mockLayer, "dependency.json");
    if (depPath.ok) {
      this.dependencies.set("to/project/valid.json", [depPath.data]);
    }
  }

  async loadSchema(path: SchemaPath): Promise<Schema> {
    const pathStr = path.getPath();
    const schema = this.schemas.get(pathStr);
    
    if (!schema) {
      throw new Error(`Schema not found: ${pathStr}`);
    }
    
    return schema;
  }

  async loadSchemas(paths: SchemaPath[]): Promise<Map<string, Schema>> {
    const result = new Map<string, Schema>();
    for (const path of paths) {
      try {
        const schema = await this.loadSchema(path);
        result.set(path.getPath(), schema);
      } catch {
        // Skip failed schemas
      }
    }
    return result;
  }

  async exists(path: SchemaPath): Promise<boolean> {
    return this.schemas.has(path.getPath());
  }

  async validateSchema(content: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    if (this.mockValidationResult) {
      return this.mockValidationResult;
    }

    if (!content || typeof content !== "object") {
      return { valid: false, errors: ["Invalid schema content"] };
    }
    
    const schema = content as Record<string, unknown>;
    if (!schema.$schema || !schema.type) {
      return { valid: false, errors: ["Missing required schema properties"] };
    }
    
    return { valid: true };
  }

  async getDependencies(path: SchemaPath): Promise<SchemaPath[]> {
    return this.dependencies.get(path.getPath()) || [];
  }

  async listAvailable(options?: SchemaQueryOptions): Promise<SchemaManifest> {
    const entries: SchemaManifestEntry[] = [
      {
        path: "to/project/valid.json",
        directive: "to",
        layer: "project",
        filename: "valid.json",
        title: "Valid Schema",
        version: "1.0.0"
      },
      {
        path: "to/task/simple.json",
        directive: "to",
        layer: "task",
        filename: "simple.json",
        title: "Simple Schema"
      }
    ];

    return {
      schemas: entries,
      generatedAt: new Date(),
      totalCount: entries.length
    };
  }

  async save(schema: Schema): Promise<void> {
    this.schemas.set(schema.getPath().getPath(), schema);
  }

  async saveAll(schemas: Schema[]): Promise<SchemaBatchResult> {
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const schema of schemas) {
      try {
        await this.save(schema);
        successful.push(schema.getPath().getPath());
      } catch (error) {
        failed.push({
          path: schema.getPath().getPath(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { successful, failed };
  }

  async delete(path: SchemaPath): Promise<void> {
    this.schemas.delete(path.getPath());
  }

  async deleteAll(paths: SchemaPath[]): Promise<SchemaBatchResult> {
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const path of paths) {
      try {
        await this.delete(path);
        successful.push(path.getPath());
      } catch (error) {
        failed.push({
          path: path.getPath(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { successful, failed };
  }

  async refresh(): Promise<void> {
    // Mock implementation - no actual refresh needed
  }

  // Test helper methods
  addMockSchema(pathStr: string, schema: Schema) {
    this.schemas.set(pathStr, schema);
  }

  addMockDependency(pathStr: string, deps: SchemaPath[]) {
    this.dependencies.set(pathStr, deps);
  }

  setValidationResult(valid: boolean, errors?: string[]) {
    this.mockValidationResult = { valid, errors };
  }
}

// Helper function to create mock schema
const createMockSchema = (directive: string, layer: string, filename: string, content?: unknown): Schema => {
  const mockDirective = new MockDirectiveType(directive) as unknown as DirectiveType;
  const mockLayer = new MockLayerType(layer) as unknown as LayerType;
  
  const defaultContent = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {}
  };

  const pathResult = SchemaPath.create(mockDirective, mockLayer, filename);
  if (!pathResult.ok) throw new Error(`Failed to create path: ${pathResult.error}`);
  
  const contentResult = SchemaContent.create(content || defaultContent);
  if (!contentResult.ok) throw new Error(`Failed to create content: ${contentResult.error}`);
  
  const schemaResult = Schema.create(pathResult.data, contentResult.data.getContent());
  if (!schemaResult.ok) throw new Error(`Failed to create schema: ${schemaResult.error}`);
  
  return schemaResult.data;
};

Deno.test("TemplateSchemaReader - Read single schema with basic options", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const result = await reader.readSchema(pathResult.data);

  assertEquals(typeof result, "object");
  assertEquals(typeof result.schema, "object");
  assertEquals(Array.isArray(result.dependencies), true);
  assertEquals(typeof result.metadata, "object");
  assertEquals(typeof result.metadata.readAt, "object");
  assertEquals(typeof result.metadata.validationPassed, "boolean");
  assertEquals(typeof result.metadata.dependencyCount, "number");
});

Deno.test("TemplateSchemaReader - Read schema with validation enabled", async () => {
  const mockRepo = new MockSchemaRepository();
  mockRepo.setValidationResult(true);
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const options: SchemaReadOptions = { validateContent: true };
  const result = await reader.readSchema(pathResult.data, options);

  assertEquals(result.metadata.validationPassed, true);
});

Deno.test("TemplateSchemaReader - Read schema with dependency resolution", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  // Add dependency schema
  const depSchema = createMockSchema("to", "project", "dependency.json");
  mockRepo.addMockSchema("to/project/dependency.json", depSchema);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const options: SchemaReadOptions = { resolveDependencies: true };
  const result = await reader.readSchema(pathResult.data, options);

  assertEquals(result.dependencies.length, 1);
  assertEquals(result.metadata.dependencyCount, 1);
});

Deno.test("TemplateSchemaReader - Read schema with all options enabled", async () => {
  const mockRepo = new MockSchemaRepository();
  mockRepo.setValidationResult(true);
  const reader = new TemplateSchemaReader(mockRepo);

  // Add dependency schema
  const depSchema = createMockSchema("to", "project", "dependency.json");
  mockRepo.addMockSchema("to/project/dependency.json", depSchema);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const options: SchemaReadOptions = { 
    validateContent: true, 
    resolveDependencies: true,
    includeMetadata: true 
  };
  const result = await reader.readSchema(pathResult.data, options);

  assertEquals(result.metadata.validationPassed, true);
  assertEquals(result.dependencies.length, 1);
  assertEquals(result.metadata.dependencyCount, 1);
});

Deno.test("TemplateSchemaReader - Read multiple schemas successfully", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  // Add additional schema
  const schema2 = createMockSchema("to", "task", "simple.json");
  mockRepo.addMockSchema("to/task/simple.json", schema2);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer1 = new MockLayerType("project") as unknown as LayerType;
  const mockLayer2 = new MockLayerType("task") as unknown as LayerType;
  
  const path1Result = SchemaPath.create(mockDirective, mockLayer1, "valid.json");
  const path2Result = SchemaPath.create(mockDirective, mockLayer2, "simple.json");
  
  assert(path1Result.ok && path2Result.ok);
  const paths = [path1Result.data, path2Result.data];
  
  const result = await reader.readSchemas(paths);

  assertEquals(result.successful.length, 2);
  assertEquals(result.failed.length, 0);
});

Deno.test("TemplateSchemaReader - Read multiple schemas with failures", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer1 = new MockLayerType("project") as unknown as LayerType;
  const mockLayer2 = new MockLayerType("task") as unknown as LayerType;
  
  const path1Result = SchemaPath.create(mockDirective, mockLayer1, "valid.json");
  const path2Result = SchemaPath.create(mockDirective, mockLayer2, "nonexistent.json");
  
  assert(path1Result.ok && path2Result.ok);
  const paths = [path1Result.data, path2Result.data];
  
  const result = await reader.readSchemas(paths);

  assertEquals(result.successful.length, 1);
  assertEquals(result.failed.length, 1);
  assertEquals(result.failed[0].path.getPath(), "to/task/nonexistent.json");
  assertEquals(typeof result.failed[0].error, "string");
});

Deno.test("TemplateSchemaReader - Read schemas by type", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  
  const result = await reader.readSchemasByType(mockDirective, mockLayer);

  assertEquals(typeof result, "object");
  assertEquals(Array.isArray(result.successful), true);
  assertEquals(Array.isArray(result.failed), true);
});

Deno.test("TemplateSchemaReader - Check schema readability for existing schema", async () => {
  const mockRepo = new MockSchemaRepository();
  mockRepo.setValidationResult(true);
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const isReadable = await reader.isSchemaReadable(pathResult.data);

  assertEquals(isReadable, true);
});

Deno.test("TemplateSchemaReader - Check schema readability for non-existing schema", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "nonexistent.json");
  
  assert(pathResult.ok);
  const isReadable = await reader.isSchemaReadable(pathResult.data);

  assertEquals(isReadable, false);
});

Deno.test("TemplateSchemaReader - Check schema readability for invalid schema", async () => {
  const mockRepo = new MockSchemaRepository();
  mockRepo.setValidationResult(false, ["Invalid schema"]);
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const isReadable = await reader.isSchemaReadable(pathResult.data);

  assertEquals(isReadable, false);
});

Deno.test("TemplateSchemaReader - Get schema tree (recursive dependencies)", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  // Add dependency schema
  const depSchema = createMockSchema("to", "project", "dependency.json");
  mockRepo.addMockSchema("to/project/dependency.json", depSchema);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const result = await reader.getSchemaTree(pathResult.data);

  assertEquals(typeof result, "object");
  assertEquals(typeof result.schema, "object");
  assertEquals(Array.isArray(result.dependencies), true);
});

Deno.test("TemplateSchemaReader - Detect circular dependency", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  // Create circular dependency
  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  
  const path1Result = SchemaPath.create(mockDirective, mockLayer, "schema1.json");
  const path2Result = SchemaPath.create(mockDirective, mockLayer, "schema2.json");
  
  assert(path1Result.ok && path2Result.ok);
  
  const schema1 = createMockSchema("to", "project", "schema1.json");
  const schema2 = createMockSchema("to", "project", "schema2.json");
  
  mockRepo.addMockSchema("to/project/schema1.json", schema1);
  mockRepo.addMockSchema("to/project/schema2.json", schema2);
  
  // Create circular dependency: schema1 -> schema2 -> schema1
  mockRepo.addMockDependency("to/project/schema1.json", [path2Result.data]);
  mockRepo.addMockDependency("to/project/schema2.json", [path1Result.data]);

  await assertRejects(
    async () => await reader.getSchemaTree(path1Result.data),
    Error,
    "Circular dependency detected"
  );
});

Deno.test("TemplateSchemaReader - Handle missing dependency gracefully", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  
  // Dependencies exist in config but not as actual schemas (will fail loading)
  const options: SchemaReadOptions = { resolveDependencies: true };
  const result = await reader.readSchema(pathResult.data, options);

  // Should complete successfully even with missing dependencies
  assertEquals(typeof result, "object");
  assertEquals(typeof result.schema, "object");
  // Dependencies array should be empty due to loading failures
  assertEquals(result.dependencies.length, 0);
});

Deno.test("TemplateSchemaReader - Factory function creates valid instance", () => {
  const mockRepo = new MockSchemaRepository();
  const reader = createTemplateSchemaReader(mockRepo);

  assertEquals(reader instanceof TemplateSchemaReader, true);
});

Deno.test("TemplateSchemaReader - Error handling for invalid schema path", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("invalid") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("invalid") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "invalid.json");
  
  assert(pathResult.ok);

  await assertRejects(
    async () => await reader.readSchema(pathResult.data),
    Error,
    "Schema not found"
  );
});

Deno.test("TemplateSchemaReader - Metadata contains correct information", async () => {
  const mockRepo = new MockSchemaRepository();
  const reader = new TemplateSchemaReader(mockRepo);

  const mockDirective = new MockDirectiveType("to") as unknown as DirectiveType;
  const mockLayer = new MockLayerType("project") as unknown as LayerType;
  const pathResult = SchemaPath.create(mockDirective, mockLayer, "valid.json");
  
  assert(pathResult.ok);
  const beforeRead = new Date();
  const result = await reader.readSchema(pathResult.data);
  const afterRead = new Date();

  assertEquals(result.metadata.readAt instanceof Date, true);
  assertEquals(result.metadata.readAt.getTime() >= beforeRead.getTime(), true);
  assertEquals(result.metadata.readAt.getTime() <= afterRead.getTime(), true);
  assertEquals(typeof result.metadata.validationPassed, "boolean");
  assertEquals(typeof result.metadata.dependencyCount, "number");
  assertEquals(result.metadata.dependencyCount >= 0, true);
});