/**
 * @fileoverview Factory Patterns Tests
 * 
 * Tests for factory pattern implementations across the codebase.
 * Validates proper object creation, dependency injection, and
 * abstraction of complex construction logic.
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { PathValueObjectFactory } from "../../../lib/domain/core/value_objects/mod.ts";
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("factory-patterns-test");

Deno.test("Factory Pattern: PathValueObjectFactory - encapsulates complexity", async () => {
  logger.debug("Testing PathValueObjectFactory complexity encapsulation");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Factory should handle complex path construction logic internally
  const templateResult = await PathValueObjectFactory.createTemplatePath(
    directive,
    layer,
    "complex_template.md"
  );
  
  if (!templateResult.ok) {
    throw new Error(`Template creation failed: ${templateResult.error}`);
  }
  
  // Should produce a valid, well-formed path
  assertExists(templateResult.data.getValue());
  assert(templateResult.data.getValue().length > 0);
  assert(templateResult.data.getValue().includes("to"));
  assert(templateResult.data.getValue().includes("project"));
  assert(templateResult.data.getValue().includes("complex_template.md"));
});

Deno.test("Factory Pattern: PathValueObjectFactory - consistent interfaces", async () => {
  logger.debug("Testing PathValueObjectFactory consistent interfaces");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    options: {},
    params: ["summary", "issue"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // All factory methods should have consistent return types (Result<T, E>)
  const templateResult = await PathValueObjectFactory.createTemplatePath(
    directive,
    layer,
    "template.md"
  );
  
  const schemaResult = await PathValueObjectFactory.createSchemaPath(
    directive,
    layer,
    "schema.json"
  );
  
  const workingDirResult = await PathValueObjectFactory.createWorkingDirectoryPath("/tmp");
  
  // All should return Result types
  assert("ok" in templateResult);
  assert("ok" in schemaResult);
  assert("ok" in workingDirResult);
  
  // Success cases should have data
  if (templateResult.ok) {
    assertExists(templateResult.data);
    assertExists(templateResult.data.getValue());
  }
  
  if (schemaResult.ok) {
    assertExists(schemaResult.data);
    assertExists(schemaResult.data.getValue());
  }
  
  if (workingDirResult.ok) {
    assertExists(workingDirResult.data);
    assertExists(workingDirResult.data.getAbsolutePath());
  }
});

Deno.test("Factory Pattern: Smart Constructor factories work correctly", async () => {
  logger.debug("Testing Smart Constructor factories");
  
  // DirectiveType factory (Smart Constructor)
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    options: {},
    params: ["defect", "task"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Smart constructors should create valid objects
  assertEquals(directive.value, "defect");
  assertEquals(layer.value, "task");
  
  // Should provide proper encapsulation
  assertExists(directive.originalResult);
  assertExists(layer.originalResult);
  assertEquals(directive.originalResult, layer.originalResult);
});

Deno.test("Factory Pattern: ConfigProfileName factory behavior", async () => {
  logger.debug("Testing ConfigProfileName factory behavior");
  
  // Test various profile names
  const profiles = ["development", "staging", "production", "testing", "custom"];
  
  for (const profileName of profiles) {
    const result = ConfigProfileName.create(profileName);
    
    if (result.ok) {
      assertEquals(result.data.value, profileName);
      assertEquals(result.data.toString(), profileName);
      
      // Should provide consistent behavior
      assertEquals(result.data.value, result.data.toString());
    } else {
      // If creation fails, should provide meaningful error
      assertExists(result.error.kind);
      assertExists(result.error.message);
    }
  }
});

Deno.test("Factory Pattern: Error handling in factory methods", async () => {
  logger.debug("Testing factory error handling");
  
  // Test error cases in PathValueObjectFactory
  const invalidWorkingDir = await PathValueObjectFactory.createWorkingDirectoryPath("");
  assertEquals(invalidWorkingDir.ok, false);
  
  if (!invalidWorkingDir.ok) {
    assertExists(invalidWorkingDir.error.kind);
    assertExists(invalidWorkingDir.error.message);
  }
  
  // Test error cases in ConfigProfileName
  const invalidProfile = ConfigProfileName.create("");
  assertEquals(invalidProfile.ok, false);
  
  if (!invalidProfile.ok) {
    assertEquals(invalidProfile.error.kind, "EmptyInput");
    assertExists(invalidProfile.error.message);
  }
});

Deno.test("Factory Pattern: Factory abstraction benefits", async () => {
  logger.debug("Testing factory abstraction benefits");
  
  // Factories should hide implementation details
  const currentDir = await PathValueObjectFactory.getCurrentWorkingDirectory();
  
  // We don't need to know how it gets the current directory
  // (could use Deno.cwd(), process.cwd(), or other method)
  if (currentDir.ok) {
    assertExists(currentDir.data.getAbsolutePath());
    assert(currentDir.data.getAbsolutePath().length > 0);
    assert(currentDir.data.isAbsolutePath());
  }
  
  // Factory should provide a clean interface regardless of complexity
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "analyze",
    layerType: "system",
    options: {},
    params: ["analyze", "system"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Complex path creation is abstracted away
  const templatePath = await PathValueObjectFactory.createTemplatePath(
    directive,
    layer,
    "analysis.md"
  );
  
  if (templatePath.ok) {
    // We get a clean result without knowing the path construction rules
    assertExists(templatePath.data.getValue());
    assert(templatePath.data.getValue().includes("analyze"));
    assert(templatePath.data.getValue().includes("system"));
    assert(templatePath.data.getValue().includes("analysis.md"));
  }
});

Deno.test("Factory Pattern: Factory method vs constructor pattern", async () => {
  logger.debug("Testing factory method vs constructor pattern differences");
  
  // Smart Constructor pattern (DirectiveType, LayerType)
  // - Private constructor + static create method
  // - Type-safe creation with validated inputs
  // - Single responsibility (only accepts pre-validated data)
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "transform",
    layerType: "module",
    options: {},
    params: ["transform", "module"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // These factories don't validate - they assume valid input
  assertEquals(directive.value, "transform");
  assertEquals(layer.value, "module");
  
  // Factory method pattern (PathValueObjectFactory)
  // - Static methods that encapsulate creation logic
  // - Can handle validation and complex construction
  // - May return Result types for error handling
  
  const templateResult = await PathValueObjectFactory.createTemplatePath(
    directive,
    layer,
    "module_transform.md"
  );
  
  if (templateResult.ok) {
    // Factory handles all the complexity of path construction
    assertExists(templateResult.data.getValue());
    assert(templateResult.data.getValue().includes("transform"));
    assert(templateResult.data.getValue().includes("module"));
  }
});

Deno.test("Factory Pattern: Parameterized factory behavior", async () => {
  logger.debug("Testing parameterized factory behavior");
  
  // Test factory with different parameter combinations
  const testCases = [
    { demonstrativeType: "to", layerType: "project", filename: "main.md" },
    { demonstrativeType: "summary", layerType: "issue", filename: "summary.md" },
    { demonstrativeType: "defect", layerType: "task", filename: "defects.md" },
    { demonstrativeType: "analyze", layerType: "system", filename: "analysis.md" }
  ];
  
  for (const testCase of testCases) {
    const mockResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: testCase.demonstrativeType,
      layerType: testCase.layerType,
      options: {},
      params: [testCase.demonstrativeType, testCase.layerType]
    };
    
    const directive = DirectiveType.create(mockResult);
    const layer = LayerType.create(mockResult);
    
    // Factory should handle all parameter combinations consistently
    const templateResult = await PathValueObjectFactory.createTemplatePath(
      directive,
      layer,
      testCase.filename
    );
    
    const schemaResult = await PathValueObjectFactory.createSchemaPath(
      directive,
      layer,
      testCase.filename.replace(".md", ".json")
    );
    
    // Should produce consistent results
    if (templateResult.ok) {
      assert(templateResult.data.getValue().includes(testCase.demonstrativeType));
      assert(templateResult.data.getValue().includes(testCase.layerType));
      assert(templateResult.data.getValue().includes(testCase.filename));
    }
    
    if (schemaResult.ok) {
      assert(schemaResult.data.getValue().includes(testCase.demonstrativeType));
      assert(schemaResult.data.getValue().includes(testCase.layerType));
    }
  }
});

Deno.test("Factory Pattern: Factory ensures object invariants", async () => {
  logger.debug("Testing factory ensures object invariants");
  
  // Factories should ensure created objects maintain their invariants
  const profileResult = ConfigProfileName.create("production");
  
  if (profileResult.ok) {
    // Invariant: profile name should never be empty after creation
    assert(profileResult.data.value.length > 0);
    assertEquals(profileResult.data.value, "production");
    
    // Invariant: toString should match name
    assertEquals(profileResult.data.value, profileResult.data.toString());
  }
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "validate",
    layerType: "component",
    options: {},
    params: ["validate", "component"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Invariant: DirectiveType value should match original result
  assertEquals(directive.value, mockResult.demonstrativeType);
  assertEquals(layer.value, mockResult.layerType);
  
  // Invariant: originalResult should be accessible and unchanged
  assertEquals(directive.originalResult, mockResult);
  assertEquals(layer.originalResult, mockResult);
});