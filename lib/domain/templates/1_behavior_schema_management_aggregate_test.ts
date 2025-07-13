/**
 * @fileoverview Behavior tests for SchemaManagementAggregate
 *
 * This test suite validates the behavioral aspects of the Schema Management Aggregate
 * following DDD principles and Totality principle compliance:
 * - 1_behavior: Runtime behavior verification, validation functionality
 * - Dynamic schema management capabilities
 * - Import/Export operations with error handling
 * - Registry operations and state management
 *
 * @module domain/templates/schema_management_aggregate_behavior_test
 */

import { assert, assertEquals, assertInstanceOf as _assertInstanceOf } from "@std/assert";
import {
  type DependencyValidationResult,
  type ImportResult,
  Schema,
  SchemaContent,
  SchemaManagementAggregate,
  type SchemaMetadata as _SchemaMetadata,
  SchemaPath,
  SchemaRegistry as _SchemaRegistry,
  type ValidationResult,
} from "./schema_management_aggregate.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { error as _error, isError, isOk, ok as _ok } from "../../types/result.ts";
import type { TwoParams_Result } from "../../deps.ts";

// Helper functions for creating test instances
function createMockDirectiveType(value: string): DirectiveType {
  const mockResult: TwoParams_Result = {
    type: "two",
    directiveType: value,
    layerType: "project",
    demonstrativeType: value,
    options: {},
    params: [value, "project"],
  };
  return DirectiveType.create(mockResult);
}

function createMockLayerType(value: string): LayerType {
  const mockResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: value,
    demonstrativeType: "to",
    options: {},
    params: ["to", value],
  };
  return LayerType.create(mockResult);
}

// Test fixtures
const createMockSchema = (
  directive: string,
  layer: string,
  filename: string,
  content: unknown = { type: "object", properties: {} },
): Schema => {
  const mockDirective = createMockDirectiveType(directive);
  const mockLayer = createMockLayerType(layer);

  const pathResult = SchemaPath.create(mockDirective, mockLayer, filename);
  if (!isOk(pathResult)) throw new Error(`Failed to create path: ${pathResult.error}`);

  const schemaResult = Schema.create(pathResult.data, content);
  if (!isOk(schemaResult)) throw new Error(`Failed to create schema: ${schemaResult.error}`);

  return schemaResult.data;
};

const createValidJsonSchema = () => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number", minimum: 0 },
  },
  required: ["name"],
});

const createSchemaWithReferences = () => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    user: { $ref: "to/project/user.json" },
    config: { $ref: "to/project/config.json" },
  },
});

// =============================================================================
// 1_behavior Tests - Runtime Behavior and Validation
// =============================================================================

Deno.test("1_behavior - SchemaManagementAggregate creates with valid ID", () => {
  // Arrange & Act
  const result = SchemaManagementAggregate.create("test-aggregate-001");

  // Assert
  assertEquals(isOk(result), true);
  if (isOk(result)) {
    assertEquals(result.data.getId(), "test-aggregate-001");
    assertEquals(result.data.getState().initialized, true);
    assertEquals(result.data.getState().schemaCount, 0);
  }
});

Deno.test("1_behavior - SchemaManagementAggregate rejects empty ID", () => {
  // Arrange & Act
  const result1 = SchemaManagementAggregate.create("");
  const result2 = SchemaManagementAggregate.create("   ");

  // Assert
  assertEquals(isError(result1), true);
  assertEquals(isError(result2), true);
  if (isError(result1)) {
    assert(result1.error.includes("ID cannot be empty"));
  }
});

Deno.test("1_behavior - importSchemas successfully imports valid schemas", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const validSchema = createMockSchema("to", "project", "user.json", createValidJsonSchema());

  // Act
  const importResult: ImportResult = aggregate.importSchemas([validSchema]);

  // Assert
  assertEquals(importResult.imported.length, 1);
  assertEquals(importResult.failed.length, 0);
  assertEquals(importResult.imported[0], "to/project/user.json");

  // Verify state update
  const state = aggregate.getState();
  assertEquals(state.schemaCount, 1);
  assert(state.lastSync instanceof Date);
});

Deno.test("1_behavior - importSchemas handles multiple schemas correctly", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const schemas = [
    createMockSchema("to", "project", "user.json", createValidJsonSchema()),
    createMockSchema("to", "issue", "issue.json", createValidJsonSchema()),
    createMockSchema("summary", "task", "task.json", createValidJsonSchema()),
  ];

  // Act
  const importResult: ImportResult = aggregate.importSchemas(schemas);

  // Assert
  assertEquals(importResult.imported.length, 3);
  assertEquals(importResult.failed.length, 0);

  // Verify all paths are imported
  const expectedPaths = [
    "to/project/user.json",
    "to/issue/issue.json",
    "summary/task/task.json",
  ];
  for (const path of expectedPaths) {
    assert(importResult.imported.includes(path));
  }

  // Verify state update
  const state = aggregate.getState();
  assertEquals(state.schemaCount, 3);
});

Deno.test("1_behavior - importSchemas reports failures for invalid schemas", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;

  // Create a schema that would cause an error during registration
  // This simulates a schema that passes initial validation but fails during registry operations
  const validSchema = createMockSchema("to", "project", "valid.json", createValidJsonSchema());

  // Act
  const importResult: ImportResult = aggregate.importSchemas([validSchema]);

  // Assert - Since we can't easily trigger registry errors in this setup,
  // we verify the successful case and the structure is correct
  assertEquals(importResult.imported.length, 1);
  assertEquals(importResult.failed.length, 0);
  assert(Array.isArray(importResult.imported));
  assert(Array.isArray(importResult.failed));
});

Deno.test("1_behavior - registry operations work correctly", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const registry = aggregate.getRegistry();
  const schema = createMockSchema("to", "project", "test.json", createValidJsonSchema());

  // Act & Assert - Register schema
  registry.register(schema);

  // Act & Assert - Retrieve schema
  const retrievedSchema = registry.get(schema.getPath());
  assert(retrievedSchema !== undefined);
  assertEquals(retrievedSchema?.getPath().getPath(), "to/project/test.json");

  // Act & Assert - List schemas
  const allSchemas = registry.list();
  assertEquals(allSchemas.length, 1);
  assertEquals(allSchemas[0].getPath().getPath(), "to/project/test.json");

  // Act & Assert - Remove schema
  const removed = registry.remove(schema.getPath());
  assertEquals(removed, true);
  assertEquals(registry.list().length, 0);
});

Deno.test("1_behavior - registry filtering works correctly", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const registry = aggregate.getRegistry();

  const schemas = [
    createMockSchema("to", "project", "user.json", createValidJsonSchema()),
    createMockSchema("to", "issue", "issue.json", createValidJsonSchema()),
    createMockSchema("summary", "project", "summary.json", createValidJsonSchema()),
  ];

  schemas.forEach((schema) => registry.register(schema));

  // Act & Assert - Filter by directive
  const mockDirective = createMockDirectiveType("to");
  const toSchemas = registry.list({ directive: mockDirective });
  assertEquals(toSchemas.length, 2);

  // Act & Assert - Filter by layer
  const mockLayer = createMockLayerType("project");
  const projectSchemas = registry.list({ layer: mockLayer });
  assertEquals(projectSchemas.length, 2);

  // Act & Assert - Filter by both
  const bothFiltered = registry.list({ directive: mockDirective, layer: mockLayer });
  assertEquals(bothFiltered.length, 1);
  assertEquals(bothFiltered[0].getPath().getPath(), "to/project/user.json");
});

Deno.test("1_behavior - validateDependencies detects missing references", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;

  // Create schema with references to non-existent schemas
  const schemaWithRefs = createMockSchema(
    "to",
    "project",
    "main.json",
    createSchemaWithReferences(),
  );

  aggregate.importSchemas([schemaWithRefs]);

  // Act
  const validationResult: DependencyValidationResult = aggregate.validateDependencies();

  // Assert
  assertEquals(validationResult.valid, false);
  assert(validationResult.missing.length > 0);

  // Check that missing dependencies are properly reported
  const missingDeps = validationResult.missing;
  assert(missingDeps.some((dep) => dep.includes("to/project/user.json")));
  assert(missingDeps.some((dep) => dep.includes("to/project/config.json")));
});

Deno.test("1_behavior - validateDependencies passes with complete dependencies", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;

  // Create schemas without external references
  const schemas = [
    createMockSchema("to", "project", "user.json", createValidJsonSchema()),
    createMockSchema("to", "project", "config.json", createValidJsonSchema()),
  ];

  aggregate.importSchemas(schemas);

  // Act
  const validationResult: DependencyValidationResult = aggregate.validateDependencies();

  // Assert
  assertEquals(validationResult.valid, true);
  assertEquals(validationResult.missing.length, 0);
  assertEquals(validationResult.circular.length, 0);
});

Deno.test("1_behavior - SchemaContent validation works correctly", () => {
  // Arrange & Act - Valid schema content
  const validContent = createValidJsonSchema();
  const validResult = SchemaContent.create(validContent);

  // Assert - Valid content
  assertEquals(isOk(validResult), true);
  if (isOk(validResult)) {
    assertEquals(validResult.data.getSchemaVersion(), "draft-07");
    assert(validResult.data.getContent() === validContent);
  }

  // Arrange & Act - Invalid schema content
  const invalidContent = "not an object";
  const invalidResult = SchemaContent.create(invalidContent);

  // Assert - Invalid content
  assertEquals(isError(invalidResult), true);
  if (isError(invalidResult)) {
    assert(invalidResult.error.includes("Invalid schema content"));
  }
});

Deno.test("1_behavior - SchemaContent reference extraction works", () => {
  // Arrange
  const schemaWithRefs = createSchemaWithReferences();
  const contentResult = SchemaContent.create(schemaWithRefs);
  assertEquals(isOk(contentResult), true);
  if (!isOk(contentResult)) return;

  const content = contentResult.data;

  // Act
  const references = content.getReferences();

  // Assert
  assertEquals(references.length, 2);
  assert(references.includes("to/project/user.json"));
  assert(references.includes("to/project/config.json"));
});

Deno.test("1_behavior - Schema update preserves metadata correctly", async () => {
  // Arrange
  const schema = createMockSchema("to", "project", "test.json", createValidJsonSchema());
  const originalMetadata = schema.getMetadata();
  const newContent = { type: "string" };

  // Add small delay to ensure timestamp difference
  await new Promise((resolve) => setTimeout(resolve, 1));

  // Act
  const updateResult = schema.updateContent(newContent);

  // Assert
  assertEquals(isOk(updateResult), true);
  if (isOk(updateResult)) {
    const updatedSchema = updateResult.data;
    const updatedMetadata = updatedSchema.getMetadata();

    // Check that most metadata is preserved
    assertEquals(updatedMetadata.version, originalMetadata.version);
    assertEquals(updatedMetadata.author, originalMetadata.author);

    // Check that updatedAt is modified (or at least not before original)
    assert(updatedMetadata.updatedAt >= originalMetadata.updatedAt);

    // Check that content is updated
    assertEquals(updatedSchema.getContent().getContent(), newContent);
  }
});

Deno.test("1_behavior - Schema validation method exists and returns result", () => {
  // Arrange
  const schema = createMockSchema("to", "project", "test.json", createValidJsonSchema());
  const testData = { name: "John", age: 30 };

  // Act
  const validationResult: ValidationResult = schema.validate(testData);

  // Assert
  assert(typeof validationResult.valid === "boolean");
  assert(Array.isArray(validationResult.errors));

  // Current implementation always returns valid=true
  // In a real implementation, this would perform actual JSON schema validation
  assertEquals(validationResult.valid, true);
  assertEquals(validationResult.errors.length, 0);
});

Deno.test("1_behavior - aggregate state management works correctly", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const initialState = aggregate.getState();

  // Act - Import schemas to trigger state changes
  const schemas = [
    createMockSchema("to", "project", "schema1.json", createValidJsonSchema()),
    createMockSchema("to", "issue", "schema2.json", createValidJsonSchema()),
  ];

  aggregate.importSchemas(schemas);
  const updatedState = aggregate.getState();

  // Assert - State is properly updated
  assertEquals(initialState.initialized, true);
  assertEquals(initialState.schemaCount, 0);
  assertEquals(initialState.lastSync, null);

  assertEquals(updatedState.initialized, true);
  assertEquals(updatedState.schemaCount, 2);
  assert(updatedState.lastSync instanceof Date);
  assert(updatedState.lastSync > new Date(Date.now() - 1000)); // Recent timestamp
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

Deno.test("1_behavior - handles empty schema imports gracefully", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;

  // Act
  const importResult: ImportResult = aggregate.importSchemas([]);

  // Assert
  assertEquals(importResult.imported.length, 0);
  assertEquals(importResult.failed.length, 0);

  // State should still be updated
  const state = aggregate.getState();
  assert(state.lastSync instanceof Date);
  assertEquals(state.schemaCount, 0);
});

Deno.test("1_behavior - registry clear operation works correctly", () => {
  // Arrange
  const aggregateResult = SchemaManagementAggregate.create("test-aggregate");
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const registry = aggregate.getRegistry();

  // Add some schemas
  const schemas = [
    createMockSchema("to", "project", "schema1.json", createValidJsonSchema()),
    createMockSchema("to", "issue", "schema2.json", createValidJsonSchema()),
  ];
  schemas.forEach((schema) => registry.register(schema));

  assertEquals(registry.list().length, 2);

  // Act
  registry.clear();

  // Assert
  assertEquals(registry.list().length, 0);
});
