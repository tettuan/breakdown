/**
 * @fileoverview Architecture tests for TwoParamsHandler
 *
 * Tests dependency constraints, layer violations, and design principles
 * for the two_params_handler module following DDD principles.
 */

import { assertEquals } from "jsr:@std/assert@1";

/**
 * Architecture constraint tests for TwoParamsHandler
 *
 * Ensures:
 * 1. Proper dependency direction (handler -> processors/validators/generators)
 * 2. No circular dependencies
 * 3. Separation of concerns
 * 4. Clean architecture layers
 */
Deno.test("TwoParamsHandler - architecture constraints", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Test 1: Check imports follow dependency rules
  const allowedImportPatterns = [
    /\.\.\/processors\//, // Can import processors
    /\.\.\/generators\//, // Can import generators
    /\.\.\/validators\//, // Can import validators
    /\$lib\/types\//, // Can import types
    /\$lib\/config\//, // Can import config
  ];

  const importMatches = moduleContent.matchAll(/from\s+["']([^"']+)["']/g);
  const actualImports = Array.from(importMatches).map((match) => match[1]);

  for (const imp of actualImports) {
    const isAllowed = allowedImportPatterns.some((pattern) => pattern.test(imp));
    assertEquals(
      isAllowed,
      true,
      `Unauthorized import detected: ${imp}. Handler should only import from allowed layers.`,
    );
  }

  // Test 2: No direct infrastructure access
  const forbiddenPatterns = [
    /Deno\.readFile/,
    /Deno\.writeFile/,
    /Deno\.stdin/,
    /Deno\.stdout/,
    /fetch/,
    /new URL\(/, // Except for test files
  ];

  for (const pattern of forbiddenPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Direct infrastructure access detected: ${pattern}. Handler should delegate to processors.`,
    );
  }

  // Test 3: Proper error handling with Result type
  assertEquals(
    moduleContent.includes("Result<"),
    true,
    "Handler should use Result type for error handling",
  );

  assertEquals(
    moduleContent.includes("throw new"),
    false,
    "Handler should not throw exceptions, use Result type instead",
  );
});

/**
 * Test orchestration pattern - Internal class encapsulation
 */
Deno.test("TwoParamsHandler - orchestration pattern", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Check for internal orchestrator class
  assertEquals(
    moduleContent.includes("class TwoParamsOrchestrator"),
    true,
    "Handler should use internal orchestrator pattern",
  );

  // Orchestrator should not be exported
  assertEquals(
    moduleContent.includes("export class TwoParamsOrchestrator"),
    false,
    "Orchestrator should be internal, not exported",
  );

  // Main handler function should be exported
  assertEquals(
    /export\s+(async\s+)?function\s+twoParamsHandler/.test(moduleContent),
    true,
    "Handler should export main function",
  );
});

/**
 * Test separation of concerns - Each component has single responsibility
 */
Deno.test("TwoParamsHandler - separation of concerns", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Handler should delegate to specific components
  const componentPatterns = [
    /validator/i, // Should have validator
    /stdinProcessor/i, // Should have stdin processor
    /variableProcessor/i, // Should have variable processor
    /promptGenerator/i, // Should have prompt generator
  ];

  for (const pattern of componentPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      true,
      `Missing component: ${pattern}. Handler should delegate to specialized components.`,
    );
  }

  // Handler should not implement business logic directly
  const businessLogicPatterns = [
    /validateDemonstrativeType/,
    /validateLayerType/,
    /readStdin/,
    /generatePrompt/,
  ];

  // Check these patterns don't appear as direct implementations
  for (const pattern of businessLogicPatterns) {
    const matches = moduleContent.match(pattern);
    if (matches) {
      // Should only appear as method calls, not definitions
      const lineWithMatch = moduleContent.split("\n").find((line) => line.includes(matches[0]));
      const isMethodCall = lineWithMatch && lineWithMatch.includes(".");
      assertEquals(
        isMethodCall,
        true,
        `Direct business logic implementation detected: ${pattern}. Should delegate to components.`,
      );
    }
  }
});

/**
 * Test error type design - Comprehensive error handling
 */
Deno.test("TwoParamsHandler - error type design", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Check error type definition
  assertEquals(
    moduleContent.includes("export type TwoParamsHandlerError"),
    true,
    "Handler should export error type",
  );

  // Error type should be discriminated union
  const errorTypeMatch = moduleContent.match(/export type TwoParamsHandlerError[\s\S]*?;/);
  if (errorTypeMatch) {
    const errorType = errorTypeMatch[0];

    // Should use discriminated union with 'kind' property
    assertEquals(
      errorType.includes("kind:"),
      true,
      "Error type should use discriminated union with 'kind' property",
    );

    // Should cover all major error cases
    const expectedErrors = [
      "InvalidParameterCount",
      "InvalidDemonstrativeType",
      "InvalidLayerType",
      "StdinReadError",
      "PromptGenerationError",
    ];

    for (const error of expectedErrors) {
      assertEquals(
        errorType.includes(error),
        true,
        `Error type should include ${error} case`,
      );
    }
  }
});

/**
 * Test dependency injection readiness
 */
Deno.test("TwoParamsHandler - dependency injection", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Components should be initialized in constructor or setup
  const constructorMatch = moduleContent.match(/constructor\s*\([^)]*\)\s*{[\s\S]*?^  }/m);
  if (constructorMatch) {
    const constructorBody = constructorMatch[0];

    // Should initialize all components
    assertEquals(
      constructorBody.includes("new TwoParamsValidator"),
      true,
      "Should initialize validator in constructor",
    );

    assertEquals(
      constructorBody.includes("new TwoParamsStdinProcessor"),
      true,
      "Should initialize stdin processor in constructor",
    );
  }
});

/**
 * Test clean architecture boundaries
 */
Deno.test("TwoParamsHandler - clean architecture", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./two_params_handler.ts", import.meta.url),
  );

  // Should not import from parent directories (except types/config)
  const parentImports = Array.from(moduleContent.matchAll(/from\s+["']\.\.\/\.\.\//g));
  for (const imp of parentImports) {
    const fullImport = moduleContent.substring(imp.index!, imp.index! + 100);
    const isAllowed = fullImport.includes("$lib/types") ||
      fullImport.includes("$lib/config");

    assertEquals(
      isAllowed,
      true,
      `Handler importing from parent directories: ${fullImport}. Violates clean architecture.`,
    );
  }

  // Should not have tight coupling with specific implementations
  assertEquals(
    moduleContent.includes("implements"),
    false,
    "Handler should not implement interfaces directly, use composition",
  );
});
