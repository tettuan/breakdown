/**
 * @fileoverview Structure tests for prompt_manager_adapter module
 *
 * Tests class structure and responsibility separation:
 * - Single Responsibility Principle
 * - Method cohesion
 * - Proper encapsulation
 * - Clear separation of concerns
 *
 * @module
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.211.0/assert/mod.ts";
import { PromptManagerAdapter, PromptManagerAdapterConfig } from "./prompt_manager_adapter.ts";
import { PromptPath, PromptVariables } from "../types/prompt_types.ts";

/**
 * Test: PromptManagerAdapter has single responsibility
 */
Deno.test("PromptManagerAdapter - follows single responsibility principle", () => {
  // The adapter should only be responsible for converting between
  // abstract types and BreakdownPrompt API

  const adapter = new PromptManagerAdapter();

  // Check that public methods are related to prompt generation
  const publicMethods = [
    "generatePrompt",
    "generatePromptWithProfile",
    "validateTemplate",
  ];

  for (const method of publicMethods) {
    assertExists(
      (adapter as any)[method],
      `Should have ${method} method`,
    );
    assertEquals(
      typeof (adapter as any)[method],
      "function",
      `${method} should be a function`,
    );
  }
});

/**
 * Test: Configuration is properly encapsulated
 */
Deno.test("PromptManagerAdapter - encapsulates configuration", () => {
  const config: PromptManagerAdapterConfig = {
    debug: true,
    templateDir: "/custom/templates",
  };

  const adapter = new PromptManagerAdapter(config);

  // Configuration should not be directly accessible
  // Note: In TypeScript, private fields are accessible at runtime,
  // but type system prevents access at compile time
  const adapterAny = adapter as any;

  // Check that we have the expected private fields
  assertExists(adapterAny.promptManager, "Should have promptManager field");
  assertExists(adapterAny.debug !== undefined, "Should have debug field");

  // Configuration object itself should not be stored
  assertEquals(
    adapterAny.config,
    undefined,
    "Should not expose config object directly",
  );
});

/**
 * Test: Methods have clear, focused responsibilities
 */
Deno.test("PromptManagerAdapter - methods have focused responsibilities", async () => {
  const adapter = new PromptManagerAdapter();

  // Mock implementations for testing
  const mockPath = {
    toString: () => "/test/path",
    equals: () => true,
  } as unknown as PromptPath;

  const mockVariables: PromptVariables = {
    toRecord: () => ({ test: "value" }),
  };

  // generatePrompt should only generate prompts
  const generatePromptType = adapter.generatePrompt.constructor.name;
  assertEquals(generatePromptType, "AsyncFunction");

  // generatePromptWithProfile should handle profile-specific generation
  const profileMethodType = adapter.generatePromptWithProfile.constructor.name;
  assertEquals(profileMethodType, "AsyncFunction");

  // validateTemplate should only validate
  const validateType = adapter.validateTemplate.constructor.name;
  assertEquals(validateType, "AsyncFunction");
});

/**
 * Test: Private methods handle implementation details
 */
Deno.test("PromptManagerAdapter - private methods encapsulate details", async () => {
  // Read the source to verify private method structure
  const currentDir = new URL(".", import.meta.url).pathname;
  const filePath = currentDir + "prompt_manager_adapter.ts";
  const moduleContent = await Deno.readTextFile(filePath);

  // Extract private method names
  const privateMethodMatches = moduleContent.matchAll(
    /private\s+(\w+)\s*\(/g,
  );
  const privateMethods = Array.from(privateMethodMatches).map((m) => m[1]);

  // Should have private methods for internal operations
  const expectedPrivateMethods = [
    "resolveTemplatePath", // Path resolution logic
    "validateVariables", // Variable validation
    "isValidVariableName", // Variable name validation
    "handleError", // Error handling logic
  ];

  for (const expected of expectedPrivateMethods) {
    assertEquals(
      privateMethods.includes(expected),
      true,
      `Should have private method: ${expected}`,
    );
  }
});

/**
 * Test: Error handling is centralized
 */
Deno.test("PromptManagerAdapter - centralizes error handling", async () => {
  const currentDir = new URL(".", import.meta.url).pathname;
  const filePath = currentDir + "prompt_manager_adapter.ts";
  const moduleContent = await Deno.readTextFile(filePath);

  // Should have a dedicated error handling method
  assertEquals(
    moduleContent.includes("private handleError"),
    true,
    "Should have handleError method",
  );

  // All catch blocks should use the centralized handler
  const catchBlocks = moduleContent.matchAll(/catch\s*\([^)]+\)\s*{([^}]+)}/g);

  for (const [, catchContent] of catchBlocks) {
    assertEquals(
      catchContent.includes("this.handleError") ||
        catchContent.includes("resultError"),
      true,
      "Catch blocks should use centralized error handling",
    );
  }
});

/**
 * Test: Validation logic is properly separated
 */
Deno.test("PromptManagerAdapter - separates validation concerns", async () => {
  const currentDir = new URL(".", import.meta.url).pathname;
  const filePath = currentDir + "prompt_manager_adapter.ts";
  const moduleContent = await Deno.readTextFile(filePath);

  // Should have separate validation methods
  assertEquals(
    moduleContent.includes("validateVariables"),
    true,
    "Should have validateVariables method",
  );

  assertEquals(
    moduleContent.includes("isValidVariableName"),
    true,
    "Should have isValidVariableName method",
  );

  // Validation should return Result types
  const validateVariablesMatch = moduleContent.match(
    /private\s+validateVariables[\s\S]*?\):\s*Result</,
  );

  assertExists(
    validateVariablesMatch,
    "validateVariables should return Result type",
  );
});

/**
 * Test: Profile support is cleanly separated
 */
Deno.test("PromptManagerAdapter - profile support is well-organized", () => {
  const adapter = new PromptManagerAdapter();

  // Profile method should be separate from main generation
  assertExists(adapter.generatePromptWithProfile);
  assertExists(adapter.generatePrompt);

  // Methods should have different signatures
  assertEquals(
    adapter.generatePromptWithProfile.length,
    3, // profile, template, variables
    "Profile method should accept 3 parameters",
  );
  assertEquals(
    adapter.generatePrompt.length,
    2, // template, variables
    "Standard method should accept 2 parameters",
  );
});

/**
 * Test: Adapter doesn't mix concerns
 */
Deno.test("PromptManagerAdapter - maintains clear boundaries", async () => {
  const currentDir = new URL(".", import.meta.url).pathname;
  const filePath = currentDir + "prompt_manager_adapter.ts";
  const moduleContent = await Deno.readTextFile(filePath);

  // Should not contain business logic unrelated to adaptation
  assertEquals(
    moduleContent.includes("writeFileSync") ||
      moduleContent.includes("readFileSync"),
    false,
    "Should not handle file I/O directly",
  );

  assertEquals(
    moduleContent.includes("process."),
    false,
    "Should not access process directly",
  );

  assertEquals(
    moduleContent.includes("console.log") &&
      !moduleContent.includes("console.debug"),
    false,
    "Should not use console.log (only debug if enabled)",
  );
});

/**
 * Test: Public API is minimal and focused
 */
Deno.test("PromptManagerAdapter - has minimal public API", () => {
  const adapter = new PromptManagerAdapter();

  // Check specific public methods exist
  const expectedPublicMethods = [
    "generatePrompt",
    "generatePromptWithProfile",
    "validateTemplate",
  ];

  for (const method of expectedPublicMethods) {
    assertExists(
      (adapter as any)[method],
      `Should have public method: ${method}`,
    );
    assertEquals(
      typeof (adapter as any)[method],
      "function",
      `${method} should be a function`,
    );
  }

  // Verify that certain methods should be private (not directly accessible via TypeScript)
  // Note: Private methods are still accessible at runtime in JavaScript
  // This test verifies the intent of encapsulation
  const shouldBePrivateMethods = [
    "resolveTemplatePath",
    "validateVariables",
    "isValidVariableName",
    "handleError",
  ];

  // We can verify these exist but they should be marked as private in the source
  for (const method of shouldBePrivateMethods) {
    // The methods exist at runtime
    assertExists(
      (adapter as any)[method],
      `Private method ${method} should exist at runtime`,
    );
  }
});
