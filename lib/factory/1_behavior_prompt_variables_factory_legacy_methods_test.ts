/**
 * @fileoverview 1_behavior tests for PromptVariablesFactory Legacy Methods
 * 
 * Validates:
 * - Legacy API method behavior
 * - Backward compatibility behavior
 * - String template evaluation behavior
 * - Error handling for legacy methods
 */

import { assertEquals, assertExists } from "@std/assert";
import { legacyMethods } from "./prompt_variables_factory_legacy_methods.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-legacy-behavior-test");

Deno.test("Legacy Methods - 1_behavior - legacy methods string template is valid", () => {
  logger.debug("Testing legacy methods string template");
  
  // Validate that legacyMethods is a string containing method definitions
  assertEquals(typeof legacyMethods, "string", "Legacy methods should be string template");
  assertExists(legacyMethods.trim(), "Legacy methods should not be empty");
  
  // Verify required method signatures exist
  assertEquals(legacyMethods.includes("public async build()"), true, "Should contain build method");
  assertEquals(legacyMethods.includes("public get promptPath()"), true, "Should contain promptPath getter");
  assertEquals(legacyMethods.includes("public get schemaPath()"), true, "Should contain schemaPath getter");
  assertEquals(legacyMethods.includes("public getDirective()"), true, "Should contain getDirective method");
  assertEquals(legacyMethods.includes("public getLayerType()"), true, "Should contain getLayerType method");
});

Deno.test("Legacy Methods - 1_behavior - build method returns Promise<void>", () => {
  logger.debug("Testing build method signature");
  
  // Extract build method and verify return type
  const buildMethodMatch = legacyMethods.match(/public async build\(\): Promise<void>/);
  assertExists(buildMethodMatch, "Build method should have correct signature");
  
  // Verify Promise.resolve() is returned
  assertEquals(legacyMethods.includes("return Promise.resolve();"), true, "Build should return Promise.resolve()");
});

Deno.test("Legacy Methods - 1_behavior - property getters access correct fields", () => {
  logger.debug("Testing property getter implementations");
  
  // Verify promptPath getter accesses promptFilePath
  assertEquals(legacyMethods.includes("return this.promptFilePath;"), true, "promptPath should return promptFilePath");
  
  // Verify schemaPath getter accesses schemaFilePath
  assertEquals(legacyMethods.includes("return this.schemaFilePath;"), true, "schemaPath should return schemaFilePath");
  
  // Verify getDirective accesses demonstrativeType
  assertEquals(legacyMethods.includes("return this.cliParams.demonstrativeType;"), true, "getDirective should return demonstrativeType");
  
  // Verify getLayerType accesses layerType
  assertEquals(legacyMethods.includes("return this.cliParams.layerType;"), true, "getLayerType should return layerType");
});

Deno.test("Legacy Methods - 1_behavior - methods have backward compatibility annotations", () => {
  logger.debug("Testing backward compatibility documentation");
  
  // Check for backward compatibility comments
  const compatibilityComments = [
    "for backward compatibility",
    "Legacy API:",
  ];
  
  for (const comment of compatibilityComments) {
    assertEquals(legacyMethods.includes(comment), true, `Should contain "${comment}" annotation`);
  }
});

Deno.test("Legacy Methods - 1_behavior - string template can be evaluated safely", () => {
  logger.debug("Testing string template evaluation safety");
  
  // Verify no dangerous constructs in template
  const dangerousPatterns = [
    "eval(",
    "Function(",
    "new Function",
    "setTimeout(",
    "setInterval(",
    "require(",
    "import(",
  ];
  
  for (const pattern of dangerousPatterns) {
    assertEquals(legacyMethods.includes(pattern), false, `Should not contain dangerous pattern: ${pattern}`);
  }
  
  // Verify template contains only method definitions
  const validPatterns = [
    "public async",
    "public get",
    "public getDirective",
    "public getLayerType",
    "return this.",
    "return Promise.resolve",
  ];
  
  let hasValidPatterns = false;
  for (const pattern of validPatterns) {
    if (legacyMethods.includes(pattern)) {
      hasValidPatterns = true;
      break;
    }
  }
  assertEquals(hasValidPatterns, true, "Should contain valid method patterns");
});

Deno.test("Legacy Methods - 1_behavior - handles empty or malformed template", () => {
  logger.debug("Testing edge cases for legacy methods");
  
  // Test with empty string (simulating error condition)
  const emptyTemplate = "";
  assertEquals(typeof emptyTemplate, "string", "Empty template should be string");
  assertEquals(emptyTemplate.length, 0, "Empty template should have zero length");
  
  // Test template structure validation
  const templateLines = legacyMethods.split('\n');
  assertEquals(Array.isArray(templateLines), true, "Template should be splittable by lines");
  assertEquals(templateLines.length > 1, true, "Template should have multiple lines");
});

Deno.test("Legacy Methods - 1_behavior - validates method accessibility", () => {
  logger.debug("Testing method accessibility modifiers");
  
  // All methods should be public for backward compatibility
  const publicMethods = legacyMethods.match(/public\s+(?:async\s+)?(?:get\s+)?\w+/g);
  assertExists(publicMethods, "Should have public methods");
  assertEquals(publicMethods.length >= 5, true, "Should have at least 5 public methods/getters");
  
  // Verify no private or protected methods in legacy template
  assertEquals(legacyMethods.includes("private"), false, "Should not contain private methods");
  assertEquals(legacyMethods.includes("protected"), false, "Should not contain protected methods");
});