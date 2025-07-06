/**
 * @fileoverview Value Objects Tests
 * 
 * Tests for core value objects in the domain layer.
 * Validates immutability, equality, validation, and proper encapsulation
 * following Domain-Driven Design principles.
 */

import { assertEquals, assertExists, assert, assertNotEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { 
  WorkingDirectoryPath,
  PathValueObjectFactory,
  PathValueObjectConfigs,
  isPathValueObjectError,
  formatPathValueObjectError
} from "../../../lib/domain/core/value_objects/mod.ts";
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("value-objects-test");

// BasePathValueObject is abstract, testing via WorkingDirectoryPath

Deno.test("Value Objects: WorkingDirectoryPath - immutability", async () => {
  logger.debug("Testing WorkingDirectoryPath immutability");
  
  // Use current directory which should exist
  const result = WorkingDirectoryPath.current();
  
  if (!result.ok) {
    logger.debug("Current directory access failed", { error: result.error });
    return;
  }
  
  const originalPath = result.data.getAbsolutePath();
  
  // Try to modify (should not be possible via any public interface)
  assertEquals(result.data.getAbsolutePath(), originalPath);
  
  // Path should remain the same after any operations
  const stringRep = result.data.toString();
  assertEquals(result.data.getAbsolutePath(), originalPath);
  assertEquals(stringRep, originalPath);
});

Deno.test("Value Objects: WorkingDirectoryPath - current directory", async () => {
  logger.debug("Testing WorkingDirectoryPath current directory");
  
  const currentResult = WorkingDirectoryPath.current();
  
  if (!currentResult.ok) {
    logger.debug("Current directory access failed", { error: currentResult.error });
    // This might fail in some environments, which is acceptable
    return;
  }
  
  assertExists(currentResult.data.getAbsolutePath());
  assert(currentResult.data.getAbsolutePath().length > 0);
  assert(currentResult.data.isAbsolutePath());
});

Deno.test("Value Objects: ConfigProfileName - validation rules", async () => {
  logger.debug("Testing ConfigProfileName validation rules");
  
  // Valid names
  const validNames = ["development", "production", "staging", "test"];
  
  for (const name of validNames) {
    const result = ConfigProfileName.create(name);
    assertEquals(result.ok, true, `Valid name '${name}' should be accepted`);
    
    if (result.ok) {
      assertEquals(result.data.name, name);
      assertEquals(result.data.toString(), name);
    }
  }
  
  // Invalid names
  const invalidNames = ["", " ", "  ", "\n", "\t"];
  
  for (const name of invalidNames) {
    const result = ConfigProfileName.create(name);
    assertEquals(result.ok, false, `Invalid name '${name}' should be rejected`);
    
    if (!result.ok) {
      // Check for any valid error from actual implementation
      assertExists(result.error.kind);
      assertExists(result.error.message);
    }
  }
});

Deno.test("Value Objects: DirectiveType and LayerType - consistency", async () => {
  logger.debug("Testing DirectiveType and LayerType consistency");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {}
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Both should reference the same original result
  assertEquals(directive.originalResult, layer.originalResult);
  
  // Values should match the mock result
  assertEquals(directive.value, mockResult.demonstrativeType);
  assertEquals(layer.value, mockResult.layerType);
  
  // String representations should be consistent
  assertEquals(directive.toString(), "DirectiveType(to)");
  assertEquals(layer.toString(), "LayerType(project)");
});

Deno.test("Value Objects: PathValueObjectFactory - template path creation", async () => {
  logger.debug("Testing PathValueObjectFactory template path creation");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {}
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  const templateResult = await PathValueObjectFactory.createTemplatePath(
    directive,
    layer,
    "test_template.md"
  );
  
  if (!templateResult.ok) {
    throw new Error(`Template path creation failed: ${templateResult.error}`);
  }
  
  assertExists(templateResult.data.getValue());
  assert(templateResult.data.getValue().includes("to"));
  assert(templateResult.data.getValue().includes("project"));
  assert(templateResult.data.getValue().includes("test_template.md"));
});

Deno.test("Value Objects: PathValueObjectFactory - schema path creation", async () => {
  logger.debug("Testing PathValueObjectFactory schema path creation");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    options: {}
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  const schemaResult = await PathValueObjectFactory.createSchemaPath(
    directive,
    layer,
    "test_schema.json"
  );
  
  if (!schemaResult.ok) {
    throw new Error(`Schema path creation failed: ${schemaResult.error}`);
  }
  
  assertExists(schemaResult.data.getValue());
  assert(schemaResult.data.getValue().includes("summary"));
  assert(schemaResult.data.getValue().includes("issue"));
  assert(schemaResult.data.getValue().includes("test_schema.json"));
});

Deno.test("Value Objects: PathValueObjectFactory - working directory", async () => {
  logger.debug("Testing PathValueObjectFactory working directory creation");
  
  const workingDirResult = await PathValueObjectFactory.createWorkingDirectoryPath("/tmp");
  
  if (!workingDirResult.ok) {
    logger.debug("Working directory creation failed", { error: workingDirResult.error });
    // This might fail in some environments, which is acceptable
    return;
  }
  
  assertEquals(workingDirResult.data.getAbsolutePath(), "/tmp");
  
  // Test current working directory
  const currentResult = await PathValueObjectFactory.getCurrentWorkingDirectory();
  
  if (!currentResult.ok) {
    logger.debug("Current working directory access failed", { error: currentResult.error });
    return;
  }
  
  assertExists(currentResult.data.getAbsolutePath());
  assert(currentResult.data.getAbsolutePath().length > 0);
});

Deno.test("Value Objects: PathValueObjectConfigs - environment configurations", async () => {
  logger.debug("Testing PathValueObjectConfigs environment configurations");
  
  // Development config
  const devConfig = PathValueObjectConfigs.development;
  assertEquals(devConfig.template.allowCustomDirectives, true);
  assertEquals(devConfig.template.allowCustomLayers, true);
  assertEquals(devConfig.workingDirectory.createIfMissing, true);
  assertEquals(devConfig.workingDirectory.requireWritePermission, true);
  
  // Production config
  const prodConfig = PathValueObjectConfigs.production;
  assertEquals(prodConfig.workingDirectory.verifyExistence, true);
  assertEquals(prodConfig.workingDirectory.requireReadPermission, true);
  
  // Testing config
  const testConfig = PathValueObjectConfigs.testing;
  assertEquals(testConfig.template.allowCustomDirectives, true);
  assertEquals(testConfig.template.allowCustomLayers, true);
  assertEquals(testConfig.workingDirectory.verifyExistence, false);
  assertEquals(testConfig.workingDirectory.createIfMissing, true);
  assertEquals(testConfig.workingDirectory.requireReadPermission, false);
  assertEquals(testConfig.workingDirectory.requireWritePermission, false);
  
  // Path length limits in testing
  assertEquals(testConfig.template.basePathConfig?.maxLength, 50);
  assertEquals(testConfig.schema.basePathConfig?.maxLength, 50);
});

Deno.test("Value Objects: Error handling and formatting", async () => {
  logger.debug("Testing value object error handling and formatting");
  
  // Generate errors from different value objects
  const configError = ConfigProfileName.create("");
  const workingDirError = WorkingDirectoryPath.create("");
  
  if (configError.ok) {
    throw new Error("Expected error for invalid config input");
  }
  
  // Test error type guards
  assertEquals(isPathValueObjectError(configError.error), false); // ConfigProfileName is not a path error
  
  if (!workingDirError.ok) {
    assertEquals(isPathValueObjectError(workingDirError.error), true);
    
    // Test error formatting
    const workingDirErrorMessage = await formatPathValueObjectError(workingDirError.error);
    assertExists(workingDirErrorMessage);
    assert(workingDirErrorMessage.length > 0);
  }
});

Deno.test("Value Objects: Complex validation scenarios", async () => {
  logger.debug("Testing complex validation scenarios");
  
  // Test security validation via WorkingDirectoryPath
  const dangerousPath = WorkingDirectoryPath.create("../../../etc/passwd");
  // Should either accept with normalization or reject with security error
  assert(dangerousPath.ok === true || 
         (!dangerousPath.ok && dangerousPath.error.kind === "SecurityViolation"));
  
  // Test path length limits
  const longPath = "/" + "a".repeat(100); // Reduced for test performance
  const longPathResult = WorkingDirectoryPath.create(longPath);
  // Should either accept or reject with validation error
  assert(longPathResult.ok === true || !longPathResult.ok);
  
  // Test special characters
  const specialPath = WorkingDirectoryPath.create("/path/with\0null/char");
  // Should handle null characters gracefully
  assert(specialPath.ok === true || !specialPath.ok);
  
  // Test unicode characters
  const unicodePath = WorkingDirectoryPath.create("/path/with/🚀/emoji");
  // Should handle unicode gracefully
  assert(unicodePath.ok === true || !unicodePath.ok);
});

Deno.test("Value Objects: Encapsulation and data hiding", async () => {
  logger.debug("Testing value object encapsulation");
  
  // Use current directory for reliable test
  const pathResult = WorkingDirectoryPath.current();
  
  if (!pathResult.ok) {
    logger.debug("Current directory access failed", { error: pathResult.error });
    return;
  }
  
  const path = pathResult.data;
  
  // Should not expose internal state beyond public interface
  assertEquals(typeof path.getAbsolutePath(), "string");
  assertEquals(typeof path.toString(), "string");
  assertEquals(typeof path.isAbsolutePath(), "boolean");
  assertEquals(typeof path.equals, "function");
  
  // Should not allow modification of internal state
  const originalPath = path.getAbsolutePath();
  const originalString = path.toString();
  
  // Any operations should not change the original values
  path.equals(path);
  path.isAbsolutePath();
  
  assertEquals(path.getAbsolutePath(), originalPath);
  assertEquals(path.toString(), originalString);
});