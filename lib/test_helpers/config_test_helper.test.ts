/**
 * @fileoverview Tests for config_test_helper.ts
 * 
 * Tests the configuration helper functions that load DirectiveType and LayerType
 * values from default-user.yml instead of using hardcoded values.
 */

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { 
  getDirectiveTypes,
  getLayerTypes,
  getDirectiveAndLayerTypes,
  isValidDirectiveType,
  isValidLayerType,
} from "./config_test_helper.ts";

Deno.test("getDirectiveTypes should load DirectiveType values from default config", async () => {
  const directiveTypes = await getDirectiveTypes();
  
  // Verify we get an array of strings
  assertEquals(Array.isArray(directiveTypes), true);
  assertEquals(directiveTypes.length > 0, true);
  
  // Check expected DirectiveType values based on default-user.yml
  const expectedTypes = ["to", "summary", "defect", "find", "analyze", "extract"];
  for (const expectedType of expectedTypes) {
    assertEquals(
      directiveTypes.includes(expectedType), 
      true,
      `Expected DirectiveType "${expectedType}" not found in: ${directiveTypes.join(", ")}`
    );
  }
});

Deno.test("getLayerTypes should load LayerType values from default config", async () => {
  const layerTypes = await getLayerTypes();
  
  // Verify we get an array of strings
  assertEquals(Array.isArray(layerTypes), true);
  assertEquals(layerTypes.length > 0, true);
  
  // Check expected LayerType values based on default-user.yml
  const expectedTypes = ["project", "issue", "task", "component", "module"];
  for (const expectedType of expectedTypes) {
    assertEquals(
      layerTypes.includes(expectedType), 
      true,
      `Expected LayerType "${expectedType}" not found in: ${layerTypes.join(", ")}`
    );
  }
});

Deno.test("getDirectiveAndLayerTypes should load both type arrays", async () => {
  const result = await getDirectiveAndLayerTypes();
  
  // Verify structure
  assertEquals(typeof result, "object");
  assertEquals(Array.isArray(result.directiveTypes), true);
  assertEquals(Array.isArray(result.layerTypes), true);
  
  // Verify content
  assertEquals(result.directiveTypes.length > 0, true);
  assertEquals(result.layerTypes.length > 0, true);
  
  // Verify some expected values exist
  assertEquals(result.directiveTypes.includes("to"), true);
  assertEquals(result.directiveTypes.includes("summary"), true);
  assertEquals(result.layerTypes.includes("project"), true);
  assertEquals(result.layerTypes.includes("task"), true);
});

Deno.test("isValidDirectiveType should validate DirectiveType values", async () => {
  // Test valid DirectiveType values
  assertEquals(await isValidDirectiveType("to"), true);
  assertEquals(await isValidDirectiveType("summary"), true);
  assertEquals(await isValidDirectiveType("defect"), true);
  
  // Test invalid DirectiveType values  
  assertEquals(await isValidDirectiveType("invalid"), false);
  assertEquals(await isValidDirectiveType("notfound"), false);
  assertEquals(await isValidDirectiveType(""), false);
});

Deno.test("isValidLayerType should validate LayerType values", async () => {
  // Test valid LayerType values
  assertEquals(await isValidLayerType("project"), true);
  assertEquals(await isValidLayerType("task"), true);
  assertEquals(await isValidLayerType("issue"), true);
  
  // Test invalid LayerType values
  assertEquals(await isValidLayerType("invalid"), false);
  assertEquals(await isValidLayerType("notfound"), false);
  assertEquals(await isValidLayerType(""), false);
});

Deno.test("functions should handle invalid config file paths", async () => {
  const invalidPath = "nonexistent/config.yml";
  
  await assertRejects(
    async () => await getDirectiveTypes(invalidPath),
    Error,
    "Failed to load config"
  );
  
  await assertRejects(
    async () => await getLayerTypes(invalidPath),
    Error,
    "Failed to load config"
  );
  
  await assertRejects(
    async () => await getDirectiveAndLayerTypes(invalidPath),
    Error,
    "Failed to load config"
  );
});

Deno.test("functions should handle malformed config files", async () => {
  // Create temporary malformed config file
  const tempConfigPath = "tmp_malformed_config.yml";
  
  try {
    await Deno.writeTextFile(tempConfigPath, "invalid: yaml: content: [");
    
    await assertRejects(
      async () => await getDirectiveTypes(tempConfigPath),
      Error,
      "Failed to load config"
    );
    
  } finally {
    // Clean up temporary file
    try {
      await Deno.remove(tempConfigPath);
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("functions should handle config files missing required sections", async () => {
  // Create temporary config without required params section
  const tempConfigPath = "tmp_incomplete_config.yml";
  
  try {
    await Deno.writeTextFile(tempConfigPath, "otherSection: value\n");
    
    await assertRejects(
      async () => await getDirectiveTypes(tempConfigPath),
      Error,
      "DirectiveType pattern not found"
    );
    
    await assertRejects(
      async () => await getLayerTypes(tempConfigPath),  
      Error,
      "LayerType pattern not found"
    );
    
  } finally {
    // Clean up temporary file
    try {
      await Deno.remove(tempConfigPath);
    } catch {
      // Ignore cleanup errors
    }
  }
});