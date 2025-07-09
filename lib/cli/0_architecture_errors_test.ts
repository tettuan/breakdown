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
    new URL("./errors.ts", import.meta.url)
  );

  // Test 1: No imports (self-contained module)
  const importStatements = moduleContent.match(/import\s+.*from/g) || [];
  assertEquals(
    importStatements.length,
    0,
    "Error module should be self-contained with no imports"
  );

  // Test 2: Proper error class hierarchy
  assertEquals(
    moduleContent.includes("extends Error"),
    true,
    "CliError should extend built-in Error class"
  );

  // Test 3: No business logic in error class
  const forbiddenPatterns = [
    /async\s+/,              // No async methods
    /await\s+/,              // No await
    /Deno\./,                // No Deno APIs
    /fetch/,                 // No network calls
    /readFile/,              // No file operations
    /if\s*\([^)]*&&[^)]*\)/, // No complex conditionals
    /for\s*\(/,              // No loops
    /while\s*\(/             // No loops
  ];

  for (const pattern of forbiddenPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Business logic detected: ${pattern}. Error classes should only define error structure.`
    );
  }

  // Test 4: Enum values are CONSTANT_CASE
  const enumMatch = moduleContent.match(/export\s+enum\s+CliErrorCode\s*{([^}]+)}/s);
  if (enumMatch) {
    const enumBody = enumMatch[1];
    const enumValues = enumBody.match(/\w+\s*=/g) || [];
    
    for (const value of enumValues) {
      const name = value.replace(/\s*=/, '');
      assertEquals(
        name === name.toUpperCase(),
        true,
        `Enum value ${name} should be in CONSTANT_CASE`
      );
    }
  }
});

/**
 * Test single responsibility - Errors only define error types
 */
Deno.test("CliError - single responsibility", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url)
  );

  // Should only export error-related items
  const exportMatches = moduleContent.matchAll(/export\s+(enum|class|interface|type|const)\s+(\w+)/g);
  const exports = Array.from(exportMatches).map(match => ({
    type: match[1],
    name: match[2]
  }));

  for (const exp of exports) {
    const isErrorRelated = 
      exp.name.includes('Error') || 
      exp.name.includes('Code') ||
      exp.name.includes('Exception');
    
    assertEquals(
      isErrorRelated,
      true,
      `Export ${exp.name} doesn't appear to be error-related. Errors module should only export error types.`
    );
  }

  // Should not have utility functions
  const functionPatterns = [
    /export\s+function/,
    /export\s+async\s+function/,
    /export\s+const\s+\w+\s*=\s*\(/  // Arrow functions
  ];

  for (const pattern of functionPatterns) {
    assertEquals(
      pattern.test(moduleContent),
      false,
      `Utility function detected: ${pattern}. Error module should only define error types.`
    );
  }
});

/**
 * Test layer boundaries - CLI errors should not reference other layers
 */
Deno.test("CliError - layer boundaries", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url)
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
    "config"
  ];

  for (const ref of forbiddenReferences) {
    // Check in comments and code (case-insensitive for comments)
    const pattern = new RegExp(ref, 'i');
    const matches = moduleContent.match(pattern) || [];
    
    // Allow in comments but not in code
    for (const match of matches) {
      const lineWithMatch = moduleContent.split('\n').find(line => line.includes(match));
      const isComment = lineWithMatch && (lineWithMatch.trim().startsWith('//') || lineWithMatch.trim().startsWith('*'));
      
      if (!isComment) {
        assertEquals(
          false,
          true,
          `Layer violation: Reference to '${ref}' found. CLI errors should not reference other layers.`
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
    new URL("./errors.ts", import.meta.url)
  );

  // Verify no setters are defined
  const setterPattern = /set\s+\w+\s*\(/;
  assertEquals(
    setterPattern.test(moduleContent),
    false,
    "Error class should not have setters for immutability"
  );

  // Verify no methods that mutate state
  const mutatorPatterns = [
    /\bmutate/i,
    /\bupdate/i,
    /\bmodify/i,
    /\bchange/i
  ];

  for (const pattern of mutatorPatterns) {
    // Check if pattern exists in method names (not in comments)
    const lines = moduleContent.split('\n');
    for (const line of lines) {
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        if (pattern.test(line) && /\s*\(/.test(line)) {
          assertEquals(
            false,
            true,
            `Potential mutator method detected: ${line.trim()}`
          );
        }
      }
    }
  }

  // Verify error class follows immutable pattern
  assertEquals(
    moduleContent.includes("extends Error"),
    true,
    "CliError should extend Error for immutability pattern"
  );
});

/**
 * Test error code completeness - All codes should have descriptive names
 */
Deno.test("CliError - error code completeness", async () => {
  const moduleContent = await Deno.readTextFile(
    new URL("./errors.ts", import.meta.url)
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
        `Enum ${name} should have matching string value for consistency`
      );

      // Names should be descriptive
      assertEquals(
        name.length >= 5,
        true,
        `Error code ${name} should have a descriptive name (at least 5 characters)`
      );

      // Should use underscores for word separation
      if (name.length > 10) {
        assertEquals(
          name.includes('_'),
          true,
          `Long error code ${name} should use underscores for readability`
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
    new URL("./errors.ts", import.meta.url)
  );

  // Check super() call format
  const superCallMatch = moduleContent.match(/super\s*\(([^)]+)\)/);
  if (superCallMatch) {
    const superArgument = superCallMatch[1];
    
    // Should include error code in message
    assertEquals(
      superArgument.includes('code'),
      true,
      "Error message should include the error code"
    );

    // Should use template literal or string concatenation
    assertEquals(
      superArgument.includes('`') || superArgument.includes('+'),
      true,
      "Error message should be constructed dynamically"
    );
  }
});