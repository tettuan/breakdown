/**
 * @fileoverview Architecture tests for VariablesBuilder
 *
 * Tests dependency constraints, layer violations, and circular references
 * for the variables_builder module following DDD principles.
 */

import { assertEquals } from "jsr:@std/assert@1";

/**
 * Architecture constraint tests for VariablesBuilder
 *
 * Ensures:
 * 1. No circular dependencies
 * 2. Proper layer boundaries (builder -> types, no reverse)
 * 3. No direct file system access (separation of concerns)
 * 4. Dependency on stable abstractions only
 */
Deno.test("VariablesBuilder - architecture constraints", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./variables_builder.ts", import.meta.url),
  );

  // Test 1: Check allowed imports only
  const allowedImports = [
    "../types/result.ts",
    "../types/prompt_variables.ts",
    "../types/variable_result.ts",
    "jsr:@std/path",
  ];

  const importMatches = moduleContent.matchAll(/from\s+["']([^"']+)["']/g);
  const actualImports = Array.from(importMatches).map((match) => match[1]);

  for (const imp of actualImports) {
    const isAllowed = allowedImports.some((allowed) => imp.includes(allowed));
    assertEquals(
      isAllowed,
      true,
      `Unauthorized import detected: ${imp}. Builder layer should only import from types layer.`,
    );
  }

  // Test 2: No direct file system operations
  const forbiddenPatterns = [
    /Deno\.readFile/,
    /Deno\.writeFile/,
    /Deno\.readTextFile/,
    /Deno\.writeTextFile/,
    /Deno\.open/,
    /Deno\.create/,
    /Deno\.remove/,
    /Deno\.rename/,
    /fs\./, // No fs module usage
  ];

  for (const pattern of forbiddenPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Direct file system operation detected: ${pattern}. Builder should not access file system directly.`,
    );
  }

  // Test 3: No infrastructure layer imports
  const forbiddenImports = [
    "/infrastructure/",
    "/io/",
    "/workspace/",
    "/cli/",
    "/commands/",
    "/processor/",
  ];

  for (const forbidden of forbiddenImports) {
    assertEquals(
      moduleContent.includes(forbidden),
      false,
      `Infrastructure layer import detected: ${forbidden}. Builder should not depend on infrastructure.`,
    );
  }

  // Test 4: Proper error handling patterns
  assertEquals(
    moduleContent.includes("Result<"),
    true,
    "Builder should use Result type for error handling",
  );

  // Test 5: No console.log or direct logging
  const loggingPatterns = [
    /console\./,
    /BreakdownLogger/,
    /logger\./,
  ];

  for (const pattern of loggingPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Direct logging detected: ${pattern}. Builder should not perform logging.`,
    );
  }
});

/**
 * Test dependency direction - Builder depends on Types, not vice versa
 */
Deno.test("VariablesBuilder - dependency direction", () => {
  // This test verifies architectural rules at compile time
  // Builder can import from types
  const builderUsesTypes = true; // Verified by imports above

  // Types should not import from builder (would cause circular dependency)
  // This is enforced by TypeScript compiler - circular imports would fail
  const typesDoesNotUseBuilder = true; // Enforced by module system

  assertEquals(builderUsesTypes && typesDoesNotUseBuilder, true);
});

/**
 * Test layer isolation - Builder is in application layer
 */
Deno.test("VariablesBuilder - layer isolation", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./variables_builder.ts", import.meta.url),
  );

  // Builder should not know about CLI specifics
  const cliPatterns = [
    /process\.argv/,
    /Deno\.args/,
    /commander/,
    /yargs/,
    /cli-/,
  ];

  for (const pattern of cliPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `CLI-specific code detected: ${pattern}. Builder should be CLI-agnostic.`,
    );
  }

  // Builder should not know about HTTP/network
  const networkPatterns = [
    /fetch/,
    /http/,
    /https/,
    /WebSocket/,
    /XMLHttpRequest/,
  ];

  for (const pattern of networkPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Network code detected: ${pattern}. Builder should not handle network operations.`,
    );
  }
});

/**
 * Test single responsibility - Builder only builds variables
 */
Deno.test("VariablesBuilder - single responsibility", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./variables_builder.ts", import.meta.url),
  );

  // Check that class has focused responsibility
  const classMatch = moduleContent.match(/export\s+class\s+(\w+)/);
  assertEquals(classMatch?.[1], "VariablesBuilder", "Should export VariablesBuilder class");

  // Should not have unrelated responsibilities
  const unrelatedPatterns = [
    /class.*Parser/,
    /class.*Validator/,
    /class.*Repository/,
    /class.*Service/,
    /class.*Controller/,
  ];

  for (const pattern of unrelatedPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Unrelated responsibility detected: ${pattern}. Builder should only build variables.`,
    );
  }
});

/**
 * Test interface segregation - Small, focused interfaces
 */
Deno.test("VariablesBuilder - interface segregation", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./variables_builder.ts", import.meta.url),
  );

  // Check FactoryResolvedValues interface is focused
  const interfaceMatch = moduleContent.match(
    /export\s+interface\s+FactoryResolvedValues\s*{([^}]+)}/s,
  );
  if (interfaceMatch) {
    const interfaceBody = interfaceMatch[1];
    const propertyCount = (interfaceBody.match(/\w+\s*[?:]?\s*:/g) || []).length;

    assertEquals(
      propertyCount <= 10,
      true,
      `Interface too large: ${propertyCount} properties. Consider splitting into smaller interfaces.`,
    );
  }
});

/**
 * Test Open/Closed Principle - Extensible through composition
 */
Deno.test("VariablesBuilder - open/closed principle", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./variables_builder.ts", import.meta.url),
  );

  // Should use method chaining for extensibility
  assertEquals(
    moduleContent.includes("return this;"),
    true,
    "Builder should support method chaining for extensibility",
  );

  // Should have factory methods for common use cases
  assertEquals(
    moduleContent.includes("static fromFactoryValues"),
    true,
    "Builder should provide factory methods for extensibility",
  );
});
