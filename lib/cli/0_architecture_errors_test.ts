/**
 * @fileoverview Architecture tests for CLI errors module
 *
 * Tests dependency constraints, layer violations, and design principles
 * for the errors.ts module in the CLI layer.
 */

import { assertEquals } from "jsr:@std/assert@1";

/**
 * Architecture constraint tests for CLI errors
 *
 * Ensures:
 * 1. No external dependencies (self-contained error definitions)
 * 2. Proper error hierarchy (extends Error)
 * 3. No business logic in error classes
 * 4. Clean enum design
 */
Deno.test("CliError - architecture constraints", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  // Test 1: Limited imports (only type imports from unified error system)
  const importStatements = moduleContent.match(/import\s+.*from/g) || [];
  const typeImports = importStatements.filter((stmt) => stmt.includes("type"));
  assertEquals(
    importStatements.length,
    typeImports.length,
    "Error module should only have type imports from unified error system",
  );

  // Test 2: Discriminated union error type
  assertEquals(
    moduleContent.includes("export type CliError"),
    true,
    "CliError should be a discriminated union type",
  );

  // Test 3: No business logic in error types and factory functions
  const forbiddenPatterns = [
    /async\s+/, // No async methods
    /await\s+/, // No await
    /Deno\./, // No Deno APIs
    /fetch/, // No network calls
    /readFile/, // No file operations
    /while\s*\(/, // No loops
  ];

  for (const pattern of forbiddenPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Business logic detected: ${pattern}. Error classes should only define error structure.`,
    );
  }

  // Test 4: Factory functions are properly exported
  const factoryMatch = moduleContent.match(/export\s+const\s+CliErrorFactory\s*=/s);
  assertEquals(
    factoryMatch !== null,
    true,
    "CliErrorFactory should be exported",
  );

  // Test 5: Type guard functions are properly exported
  const typeGuardMatch = moduleContent.match(/export\s+function\s+isCliError/s);
  assertEquals(
    typeGuardMatch !== null,
    true,
    "isCliError type guard should be exported",
  );
});

/**
 * Test single responsibility - Errors only define error types
 */
Deno.test("CliError - single responsibility", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  // Should only export error-related items
  const exportMatches = moduleContent.matchAll(
    /export\s+(enum|class|interface|type|const)\s+(\w+)/g,
  );
  const exports = Array.from(exportMatches).map((match) => ({
    type: match[1],
    name: match[2],
  }));

  for (const exp of exports) {
    const isErrorRelated = exp.name.includes("Error") ||
      exp.name.includes("Code") ||
      exp.name.includes("Exception");

    assertEquals(
      isErrorRelated,
      true,
      `Export ${exp.name} doesn't appear to be error-related. Errors module should only export error types.`,
    );
  }

  // Should only have error-related utility functions
  const forbiddenFunctionPatterns = [
    /export\s+async\s+function/,
    /export\s+function(?!.*(?:isCliError|extractCliErrorMessage))/,
  ];

  for (const pattern of forbiddenFunctionPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Non-error utility function detected: ${pattern}. Error module should only define error types and related utilities.`,
    );
  }

  // Should have required error utilities
  const requiredUtilities = [
    /export\s+function\s+isCliError/,
    /export\s+function\s+extractCliErrorMessage/,
  ];

  for (const pattern of requiredUtilities) {
    assertEquals(
      pattern.test(moduleContent),
      true,
      `Required error utility missing: ${pattern}. Error module should provide type guards and message extraction.`,
    );
  }
});

/**
 * Test layer boundaries - CLI errors should not reference other layers
 */
Deno.test("CliError - layer boundaries", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  // Should not reference domain or infrastructure layers
  const forbiddenReferences = [
    "domain",
    "repository",
    "service",
    "factory",
    "infrastructure",
    "database",
    "http",
    "file",
    "config",
  ];

  for (const ref of forbiddenReferences) {
    // Check in comments and code (case-insensitive for comments)
    const pattern = new RegExp(ref, "i");
    const matches = moduleContent.match(pattern) || [];

    // Allow in comments but not in code
    for (const match of matches) {
      const lineWithMatch = moduleContent.split("\n").find((line) => line.includes(match));
      const isComment = lineWithMatch &&
        (lineWithMatch.trim().startsWith("//") || lineWithMatch.trim().startsWith("*"));

      if (!isComment) {
        assertEquals(
          false,
          true,
          `Layer violation: Reference to '${ref}' found. CLI errors should not reference other layers.`,
        );
      }
    }
  }
});

/**
 * Test immutability - Error properties should be readonly
 */
Deno.test("CliError - immutability", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  // Verify no setters are defined
  const setterPattern = /set\s+\w+\s*\(/;
  assertEquals(
    setterPattern.test(moduleContent),
    false,
    "Error class should not have setters for immutability",
  );

  // Verify no methods that mutate state
  const mutatorPatterns = [
    /\bmutate/i,
    /\bupdate/i,
    /\bmodify/i,
    /\bchange/i,
  ];

  for (const pattern of mutatorPatterns) {
    // Check if pattern exists in method names (not in comments)
    const lines = moduleContent.split("\n");
    for (const line of lines) {
      if (!line.trim().startsWith("//") && !line.trim().startsWith("*")) {
        if (pattern.test(line) && /\s*\(/.test(line)) {
          assertEquals(
            false,
            true,
            `Potential mutator method detected: ${line.trim()}`,
          );
        }
      }
    }
  }

  // Verify error class follows immutable pattern
  assertEquals(
    moduleContent.includes("extends Error"),
    true,
    "CliError should extend Error for immutability pattern",
  );
});

/**
 * Test error code completeness - All codes should have descriptive names
 */
Deno.test("CliError - error code completeness", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  const enumMatch = moduleContent.match(/export\s+enum\s+CliErrorCode\s*{([^}]+)}/s);
  if (enumMatch) {
    const enumBody = enumMatch[1];
    const codeMatches = enumBody.matchAll(/(\w+)\s*=\s*"([^"]+)"/g);
    const codes = Array.from(codeMatches);

    for (const [, name, value] of codes) {
      // Enum name and value should match (common pattern for string enums)
      assertEquals(
        name,
        value,
        `Enum ${name} should have matching string value for consistency`,
      );

      // Names should be descriptive
      assertEquals(
        name.length >= 5,
        true,
        `Error code ${name} should have a descriptive name (at least 5 characters)`,
      );

      // Should use underscores for word separation
      if (name.length > 10) {
        assertEquals(
          name.includes("_"),
          true,
          `Long error code ${name} should use underscores for readability`,
        );
      }
    }
  }
});

/**
 * Test error message format - Consistent error message structure
 */
Deno.test("CliError - message format", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url),
  );

  // Check super() call format
  const superCallMatch = moduleContent.match(/super\s*\(([^)]+)\)/);
  if (superCallMatch) {
    const superArgument = superCallMatch[1];

    // Should include error code in message
    assertEquals(
      superArgument.includes("code"),
      true,
      "Error message should include the error code",
    );

    // Should use template literal or string concatenation
    assertEquals(
      superArgument.includes("`") || superArgument.includes("+"),
      true,
      "Error message should be constructed dynamically",
    );
  }
});
