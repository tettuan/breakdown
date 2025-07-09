/**
 * @fileoverview Architecture tests for PromptVariablesFactory with Totality focus
 * Testing domain boundaries, dependencies, and architectural constraints
 *
 * Architecture tests verify:
 * - Factory pattern implementation
 * - Dependency direction (factory -> domain services, not vice versa)
 * - Result type usage for error handling
 * - Separation of concerns
 * - Clean architecture principles
 */

import { assertEquals, assertExists } from "@std/assert";

/**
 * Architecture constraint tests for PromptVariablesFactory
 *
 * Ensures:
 * 1. Factory orchestrates but doesn't implement business logic
 * 2. Proper dependency on domain services
 * 3. Result-based error handling
 * 4. Clean separation between factory and resolvers
 */
Deno.test("0_architecture: PromptVariablesFactory follows factory pattern", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Test 1: Factory imports domain services, not implements them
  const expectedImports = [
    "PromptVariableTransformer",
    "PromptTemplatePathResolver",
    "InputFilePathResolver",
    "OutputFilePathResolver",
    "SchemaFilePathResolver",
  ];

  for (const expectedImport of expectedImports) {
    assertEquals(
      moduleContent.includes(expectedImport),
      true,
      `Factory should import ${expectedImport} for orchestration`,
    );
  }

  // Test 2: Factory should not contain complex business logic
  const forbiddenPatterns = [
    /function\s+validate[A-Z]\w+/, // No validation functions
    /function\s+transform[A-Z]\w+/, // No transformation functions
    /function\s+parse[A-Z]\w+/, // No parsing functions
    /class\s+\w+Validator/, // No validator classes
    /class\s+\w+Parser/, // No parser classes
  ];

  for (const pattern of forbiddenPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Business logic detected: ${pattern}. Factory should orchestrate, not implement.`,
    );
  }

  // Test 3: Uses Result type for error handling
  assertEquals(
    moduleContent.includes("Result<"),
    true,
    "Factory should use Result type for error handling",
  );

  assertEquals(
    moduleContent.includes("import { Result"),
    true,
    "Factory should import Result type",
  );
});

/**
 * Test dependency direction - Factory depends on domain and types
 */
Deno.test("0_architecture: PromptVariablesFactory dependency hierarchy", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Allowed import patterns for factory layer
  const allowedImportPatterns = [
    /\.\.\/types\//, // Can import types
    /\.\.\/domain\//, // Can import domain services
    /\.\//, // Can import from same directory (other factories/resolvers)
    /@tettuan\//, // Can import external packages
  ];

  const importMatches = moduleContent.matchAll(/from\s+["']([^"']+)["']/g);
  const imports = Array.from(importMatches).map((m) => m[1]);

  for (const imp of imports) {
    const isAllowed = allowedImportPatterns.some((pattern) => pattern.test(imp));
    assertEquals(
      isAllowed,
      true,
      `Unauthorized import: ${imp}. Factory should only depend on types, domain, and peer factories.`,
    );
  }

  // Should not import from infrastructure or application layers
  const forbiddenImports = [
    "../cli/",
    "../io/",
    "../workspace/",
    "../infrastructure/",
    "../application/",
  ];

  for (const forbidden of forbiddenImports) {
    assertEquals(
      moduleContent.includes(forbidden),
      false,
      `Layer violation: Import from ${forbidden}. Factory should not depend on higher layers.`,
    );
  }
});

/**
 * Test separation of concerns - Each resolver has single responsibility
 */
Deno.test("0_architecture: PromptVariablesFactory maintains separation of concerns", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Factory should delegate to specific resolvers
  const resolverUsage = [
    "PromptTemplatePathResolver",
    "InputFilePathResolver",
    "OutputFilePathResolver",
    "SchemaFilePathResolver",
  ];

  for (const resolver of resolverUsage) {
    const usagePattern = new RegExp(`new\\s+${resolver}|${resolver}\\.`);
    assertEquals(
      usagePattern.test(moduleContent),
      true,
      `Factory should use ${resolver} for path resolution`,
    );
  }

  // Factory class should be focused
  assertEquals(
    moduleContent.includes("class PromptVariablesFactory"),
    true,
    "Should export PromptVariablesFactory class",
  );

  // Should have transformer as dependency
  assertEquals(
    moduleContent.includes("transformer"),
    true,
    "Factory should have transformer as dependency",
  );

  // Should focus on orchestration, not implementation
  assertEquals(
    moduleContent.includes("PromptVariableTransformer"),
    true,
    "Factory should use PromptVariableTransformer for business logic",
  );
});

/**
 * Test error handling architecture
 */
Deno.test("0_architecture: PromptVariablesFactory error handling design", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Should import error types
  assertEquals(
    moduleContent.includes("PromptVariablesFactoryErrors"),
    true,
    "Factory should use typed errors",
  );

  // Should handle errors with Result type
  assertEquals(
    moduleContent.includes("ok("),
    true,
    "Factory should use ok() for success results",
  );

  assertEquals(
    moduleContent.includes("error(") || moduleContent.includes("resultError("),
    true,
    "Factory should use error() for failure results",
  );

  // Should not throw exceptions
  assertEquals(
    /throw\s+new\s+\w+Error/.test(moduleContent),
    false,
    "Factory should not throw exceptions, use Result type instead",
  );
});

/**
 * Test interface design - Clean public API
 */
Deno.test("0_architecture: PromptVariablesFactory interface design", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Check exported interfaces
  const interfaceMatches = moduleContent.matchAll(/export\s+interface\s+(\w+)/g);
  const interfaces = Array.from(interfaceMatches).map((m) => m[1]);

  // Should export clear interfaces
  const expectedInterfaces = ["PromptCliOptions", "PromptCliParams"];
  for (const expected of expectedInterfaces) {
    assertEquals(
      interfaces.includes(expected),
      true,
      `Factory should export ${expected} interface`,
    );
  }

  // Interfaces should be focused (not too large)
  for (const interfaceName of interfaces) {
    const interfaceMatch = moduleContent.match(
      new RegExp(`interface\\s+${interfaceName}\\s*{([^}]+)}`, "s"),
    );
    if (interfaceMatch) {
      const propertyCount = (interfaceMatch[1].match(/\w+\s*[?:]?\s*:/g) || []).length;
      assertEquals(
        propertyCount <= 15,
        true,
        `Interface ${interfaceName} has too many properties (${propertyCount}). Consider splitting.`,
      );
    }
  }
});

/**
 * Test abstraction level - Factory should work at high level
 */
Deno.test("0_architecture: PromptVariablesFactory abstraction level", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_variables_factory.ts", import.meta.url),
  );

  // Should not have low-level operations
  const lowLevelPatterns = [
    /\.split\(/, // String manipulation
    /\.replace\(/, // String replacement
    /\.slice\(/, // Array/string slicing
    /\.charAt\(/, // Character access
    /\.charCodeAt\(/, // Character code access
    /parseInt\(/, // Number parsing
    /parseFloat\(/, // Float parsing
  ];

  // Count low-level operations (some are acceptable)
  let lowLevelCount = 0;
  for (const pattern of lowLevelPatterns) {
    const matches = moduleContent.match(pattern) || [];
    lowLevelCount += matches.length;
  }

  assertEquals(
    lowLevelCount < 10,
    true,
    `Too many low-level operations (${lowLevelCount}). Factory should delegate to services.`,
  );

  // Should work with domain objects
  const domainObjectPatterns = [
    "DirectiveType",
    "LayerType",
    "PromptVariableSource",
    "PathResolutionOption",
  ];

  for (const domainObject of domainObjectPatterns) {
    assertEquals(
      moduleContent.includes(domainObject),
      true,
      `Factory should work with ${domainObject} domain object`,
    );
  }
});
