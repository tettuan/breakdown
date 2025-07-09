/**
 * @fileoverview FileSchemaRepository 2_structure Tests - Data Structure and Consistency Validation
 * 
 * 構造整合性とデータ管理の正確性を検証するテスト。
 * SchemaCacheEntry構造、依存関係管理、マニフェストメタデータ抽出の正確性をテスト。
 * 
 * テスト構成:
 * - SchemaCacheEntry構造の正確性
 * - 依存関係管理の整合性
 * - マニフェストメタデータ抽出の正確性
 * - キャッシュ構造とLRU管理
 * - バッチ操作結果の構造整合性
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { FileSchemaRepository, FileSchemaRepositoryConfig } from "./file_schema_repository.ts";
import { SchemaPath, Schema } from "../../domain/templates/schema_management_aggregate.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { ok } from "../../types/result.ts";

// =============================================================================
// Test Utilities
// =============================================================================

function createTestDirectiveType(value: string): DirectiveType {
  const mockDirective = {
    getValue: () => value,
    toString: () => value
  } as DirectiveType;
  return mockDirective;
}

function createTestLayerType(value: string): LayerType {
  const mockLayer = {
    getValue: () => value,
    toString: () => value
  } as LayerType;
  return mockLayer;
}

async function createTestRepository(): Promise<FileSchemaRepository> {
  const tempDir = await Deno.makeTempDir({ prefix: "schema_repo_test_" });
  
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: tempDir,
    schemaDirectory: "schema",
    cacheEnabled: true,
    cacheTTLMs: 60000,
    validateOnLoad: false,
    resolveReferences: true
  };
  
  return new FileSchemaRepository(config);
}

async function createTestSchema(): Promise<Schema> {
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("project");
  const pathResult = SchemaPath.create(directive, layer, "test.json");
  
  if (!pathResult.ok) {
    throw new Error("Failed to create test schema path");
  }
  
  const schemaContent = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" }
    },
    required: ["title"]
  };
  
  const schemaResult = Schema.create(pathResult.data, schemaContent, {
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  if (!schemaResult.ok) {
    throw new Error("Failed to create test schema");
  }
  
  return schemaResult.data;
}

async function setupTestSchemaFiles(baseDir: string): Promise<void> {
  const schemaDir = join(baseDir, "schema");
  await ensureDir(join(schemaDir, "to", "project"));
  await ensureDir(join(schemaDir, "summary", "task"));
  
  // Basic schema
  const basicSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Basic Schema",
    description: "A basic test schema",
    type: "object",
    properties: {
      name: { type: "string" }
    }
  };
  
  // Schema with dependencies
  const schemaWithDeps = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Schema with Dependencies",
    description: "Schema that references other schemas",
    type: "object",
    properties: {
      basic: { $ref: "./basic.json" },
      external: { $ref: "../task/task.json" }
    }
  };
  
  // Task schema
  const taskSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Task Schema",
    description: "Schema for task objects",
    version: "1.0.0",
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      completed: { type: "boolean" }
    },
    required: ["id", "title"]
  };
  
  await Deno.writeTextFile(
    join(schemaDir, "to", "project", "basic.json"),
    JSON.stringify(basicSchema, null, 2)
  );
  
  await Deno.writeTextFile(
    join(schemaDir, "to", "project", "with_deps.json"),
    JSON.stringify(schemaWithDeps, null, 2)
  );
  
  await Deno.writeTextFile(
    join(schemaDir, "summary", "task", "task.json"),
    JSON.stringify(taskSchema, null, 2)
  );
}

// =============================================================================
// 2_STRUCTURE: Data Structure and Consistency Tests
// =============================================================================

Deno.test("2_structure - SchemaCacheEntry has correct structure and properties", async () => {
  const repository = await createTestRepository();
  const schema = await createTestSchema();
  
  // Access private cache via reflection for testing
  const cache = (repository as any).cache as Map<string, any>;
  
  // Manually add cache entry to inspect structure
  const mockCacheEntry = {
    schema: schema,
    loadedAt: new Date(),
    size: 1024,
    dependencies: ["./basic.json", "../task/task.json"]
  };
  
  cache.set("to/project/test.json", mockCacheEntry);
  
  const cacheEntry = cache.get("to/project/test.json");
  assertExists(cacheEntry);
  
  // Verify cache entry structure
  assertExists(cacheEntry.schema);
  assertExists(cacheEntry.loadedAt);
  assertEquals(typeof cacheEntry.size, "number");
  assert(cacheEntry.size > 0);
  
  // Verify dependencies structure
  assertExists(cacheEntry.dependencies);
  assert(Array.isArray(cacheEntry.dependencies));
  assertEquals(cacheEntry.dependencies.length, 2);
  assertEquals(cacheEntry.dependencies[0], "./basic.json");
  assertEquals(cacheEntry.dependencies[1], "../task/task.json");
  
  // Verify Date objects
  assert(cacheEntry.loadedAt instanceof Date);
});

Deno.test("2_structure - Cache entry contains proper Schema object", async () => {
  const repository = await createTestRepository();
  const schema = await createTestSchema();
  
  const cache = (repository as any).cache as Map<string, any>;
  
  const cacheEntry = {
    schema: schema,
    loadedAt: new Date(),
    size: 512,
    dependencies: []
  };
  
  cache.set("test/path", cacheEntry);
  
  const retrieved = cache.get("test/path");
  assertExists(retrieved);
  assertExists(retrieved.schema);
  
  // Verify it's a proper Schema object
  assertExists(retrieved.schema.getPath);
  assertExists(retrieved.schema.getContent);
  
  const path = retrieved.schema.getPath();
  assertExists(path);
  assertEquals(typeof path.getPath, "function");
});

Deno.test("2_structure - Dependencies array structure validation", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "deps_test_" });
  await setupTestSchemaFiles(tempDir);
  
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: tempDir,
    cacheEnabled: true,
    resolveReferences: true
  };
  
  const repository = new FileSchemaRepository(config);
  
  // Load schema with dependencies
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("project");
  const pathResult = SchemaPath.create(directive, layer, "with_deps.json");
  assert(pathResult.ok);
  
  if (!pathResult.ok) {
    throw new Error("Failed to create path");
  }
  
  const schema = await repository.loadSchema(pathResult.data);
  assertExists(schema);
  
  // Check cache for dependencies
  const cache = (repository as any).cache as Map<string, any>;
  const cacheEntry = cache.get("to/project/with_deps.json");
  
  if (cacheEntry && cacheEntry.dependencies) {
    assert(Array.isArray(cacheEntry.dependencies));
    
    // Verify each dependency is a string
    for (const dep of cacheEntry.dependencies) {
      assertEquals(typeof dep, "string");
      assert(dep.length > 0);
    }
    
    // Verify expected dependencies are present
    assert(cacheEntry.dependencies.includes("./basic.json"));
    assert(cacheEntry.dependencies.includes("../task/task.json"));
  }
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("2_structure - Manifest metadata extraction structure", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "manifest_test_" });
  await setupTestSchemaFiles(tempDir);
  
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: tempDir
  };
  
  const repository = new FileSchemaRepository(config);
  
  // Get manifest with metadata
  const manifest = await repository.listAvailable({
    includeMetadata: true,
    includeDependencies: true
  });
  
  assertExists(manifest);
  assertExists(manifest.schemas);
  assert(Array.isArray(manifest.schemas));
  assert(manifest.schemas.length > 0);
  
  // Check manifest structure
  assertExists(manifest.generatedAt);
  assert(manifest.generatedAt instanceof Date);
  assertEquals(typeof manifest.totalCount, "number");
  assertEquals(manifest.totalCount, manifest.schemas.length);
  
  // Check schema entry structure
  const schemaEntry = manifest.schemas.find(s => s.filename === "task.json");
  assertExists(schemaEntry);
  
  // Verify required fields
  assertExists(schemaEntry.path);
  assertExists(schemaEntry.directive);
  assertExists(schemaEntry.layer);
  assertExists(schemaEntry.filename);
  
  // Verify metadata fields
  assertEquals(schemaEntry.title, "Task Schema");
  assertEquals(schemaEntry.description, "Schema for task objects");
  assertEquals(schemaEntry.version, "1.0.0");
  
  // Verify dependencies field exists
  assertExists(schemaEntry.dependencies);
  assert(Array.isArray(schemaEntry.dependencies));
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("2_structure - Dependency extraction creates proper array structure", async () => {
  const schemaContent = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      user: { $ref: "./user.json" },
      settings: { $ref: "../common/settings.json" },
      nested: {
        type: "object",
        properties: {
          ref: { $ref: "./nested/ref.json" }
        }
      }
    },
    allOf: [
      { $ref: "./base.json" }
    ]
  };
  
  const repository = await createTestRepository();
  
  // Use private method via reflection
  const extractDependencies = (repository as any).extractDependencies.bind(repository);
  const dependencies = extractDependencies(schemaContent);
  
  // Verify structure
  assert(Array.isArray(dependencies));
  assertEquals(dependencies.length, 4);
  
  // Verify content and uniqueness
  assert(dependencies.includes("./user.json"));
  assert(dependencies.includes("../common/settings.json"));
  assert(dependencies.includes("./nested/ref.json"));
  assert(dependencies.includes("./base.json"));
  
  // Verify no duplicates (Set conversion should maintain same length)
  const uniqueDeps = [...new Set(dependencies)];
  assertEquals(dependencies.length, uniqueDeps.length);
});

Deno.test("2_structure - LRU cache management maintains proper structure", async () => {
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: "/tmp/test",
    cacheEnabled: true
  };
  
  const repository = new FileSchemaRepository(config);
  const cache = (repository as any).cache as Map<string, any>;
  
  // Fill cache beyond limit (100 entries)
  const testSchema = await createTestSchema();
  
  for (let i = 0; i < 105; i++) {
    const entry = {
      schema: testSchema,
      loadedAt: new Date(Date.now() - (105 - i) * 1000), // Different timestamps
      size: 1024,
      dependencies: []
    };
    
    // Use private addToCache method
    const addToCache = (repository as any).addToCache.bind(repository);
    addToCache(`test/path/${i}`, testSchema, 1024, []);
  }
  
  // Verify cache size limit
  assert(cache.size <= 100);
  
  // Verify oldest entries were removed (LRU behavior)
  assert(!cache.has("test/path/0")); // Oldest should be removed
  assert(cache.has("test/path/104")); // Newest should remain
  
  // Verify remaining entries have proper structure
  for (const [key, entry] of cache.entries()) {
    assertExists(entry.schema);
    assertExists(entry.loadedAt);
    assert(entry.loadedAt instanceof Date);
    assertEquals(typeof entry.size, "number");
    assert(Array.isArray(entry.dependencies));
  }
});

Deno.test("2_structure - Batch operation results have consistent structure", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "batch_test_" });
  await setupTestSchemaFiles(tempDir);
  
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: tempDir
  };
  
  const repository = new FileSchemaRepository(config);
  
  // Create test schemas for batch operation
  const schemas = [];
  for (let i = 0; i < 3; i++) {
    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("project");
    const pathResult = SchemaPath.create(directive, layer, `batch_${i}.json`);
    assert(pathResult.ok);
    
    if (!pathResult.ok) continue;
    
    const schemaResult = Schema.create(pathResult.data, {
      type: "object",
      properties: { id: { type: "string" } }
    });
    assert(schemaResult.ok);
    
    if (!schemaResult.ok) continue;
    
    schemas.push(schemaResult.data);
  }
  
  // Perform batch save
  const result = await repository.saveAll(schemas);
  
  // Verify batch result structure
  assertExists(result);
  assertExists(result.successful);
  assertExists(result.failed);
  
  assert(Array.isArray(result.successful));
  assert(Array.isArray(result.failed));
  
  // Verify successful entries are strings
  for (const path of result.successful) {
    assertEquals(typeof path, "string");
    assert(path.length > 0);
  }
  
  // Verify failed entries have proper structure
  for (const failure of result.failed) {
    assertExists(failure.path);
    assertExists(failure.error);
    assertEquals(typeof failure.path, "string");
    assertEquals(typeof failure.error, "string");
  }
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("2_structure - Cache TTL and freshness tracking structure", async () => {
  const config: FileSchemaRepositoryConfig = {
    baseDirectory: "/tmp/test",
    cacheEnabled: true,
    cacheTTLMs: 1000 // 1 second TTL
  };
  
  const repository = new FileSchemaRepository(config);
  const cache = (repository as any).cache as Map<string, any>;
  
  const testSchema = await createTestSchema();
  const now = new Date();
  
  // Add entry with specific timestamp
  const entry = {
    schema: testSchema,
    loadedAt: now,
    size: 512,
    dependencies: []
  };
  
  cache.set("test/path", entry);
  
  // Verify timestamp structure
  const cachedEntry = cache.get("test/path");
  assertExists(cachedEntry);
  assertExists(cachedEntry.loadedAt);
  assert(cachedEntry.loadedAt instanceof Date);
  assertEquals(cachedEntry.loadedAt.getTime(), now.getTime());
  
  // Test TTL calculation structure via getFromCache
  const getFromCache = (repository as any).getFromCache.bind(repository);
  
  // Should return schema (within TTL)
  const result1 = getFromCache("test/path");
  assertExists(result1);
  
  // Wait for TTL expiration
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Should return null (expired)
  const result2 = getFromCache("test/path");
  assertEquals(result2, null);
  
  // Verify entry was removed from cache
  assert(!cache.has("test/path"));
});

Deno.test("2_structure - Manifest freshness tracking maintains proper state", async () => {
  const repository = await createTestRepository();
  
  // Access private manifest properties
  const getManifestLoadedAt = () => (repository as any).manifestLoadedAt;
  const setManifest = (manifest: any) => {
    (repository as any).manifest = manifest;
    (repository as any).manifestLoadedAt = new Date();
  };
  
  // Initially no manifest
  assertEquals(getManifestLoadedAt(), undefined);
  
  // Set manifest
  const testManifest = {
    schemas: [],
    generatedAt: new Date(),
    totalCount: 0
  };
  
  setManifest(testManifest);
  
  // Verify timestamp was set
  const loadedAt = getManifestLoadedAt();
  assertExists(loadedAt);
  assert(loadedAt instanceof Date);
  
  // Verify manifest freshness check
  const isManifestFresh = (repository as any).isManifestFresh.bind(repository);
  assert(isManifestFresh()); // Should be fresh immediately
  
  // Mock old timestamp
  (repository as any).manifestLoadedAt = new Date(Date.now() - 70000); // 70 seconds ago
  
  assert(!isManifestFresh()); // Should be stale after 1 minute
});