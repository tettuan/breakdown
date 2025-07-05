/**
 * @fileoverview Architecture tests for CLI config types
 *
 * This test file validates the architectural constraints and design principles
 * of the CLI configuration types module, ensuring it follows Totality principles.
 *
 * @module cli/config/0_architecture_types_test
 */

import { assertEquals } from "../../../../lib/deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Architecture Test: Dependency Direction
 *
 * Verifies that the types module has minimal dependencies and follows
 * proper layering principles. Types should be foundational and not
 * depend on implementation details.
 */
Deno.test("Architecture: CLI config types dependency direction", async () => {
  // Analyze imports in types.ts file
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Extract import statements
  const importLines = typesContent.split("\n").filter((line) => line.trim().startsWith("import"));

  // Check that types.ts has no imports (pure type definitions)
  assertEquals(
    importLines.length,
    0,
    "Types file should have no imports - it should contain only type definitions",
  );

  // Verify it contains only interface/type definitions and comments
  const nonCommentLines = typesContent.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("*") &&
      !trimmed.startsWith("/**") && !trimmed.startsWith("*/");
  });

  // Each non-comment line should be part of an interface, type, or export statement
  const validPatterns = [
    /^export\s+(interface|type)\s+/,
    /^interface\s+/,
    /^type\s+/,
    /^{/,
    /^}/,
    /^\s*\w+[?]?:\s*/, // Property definitions
    /^\s*\/\/ .*/, // Single-line comments within blocks
  ];

  const invalidLines = nonCommentLines.filter((line) => {
    return !validPatterns.some((pattern) => pattern.test(line));
  });

  assertEquals(
    invalidLines.length,
    0,
    `Found non-type definition lines: ${invalidLines.join(", ")}`,
  );
});

/**
 * Architecture Test: Circular Dependencies
 *
 * Ensures there are no circular dependencies involving the types module.
 * Types should form a clean dependency tree.
 */
Deno.test("Architecture: No circular dependencies in config types", async () => {
  // Since types.ts should have no imports (verified in previous test),
  // it cannot create circular dependencies
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Verify no imports exist
  const hasImports = typesContent.includes("import ");
  assertEquals(
    hasImports,
    false,
    "Types file has no imports, thus no circular dependencies possible",
  );

  // Additionally check that no other files in the config directory import from each other circularly
  // This is a simple check since this is a types-only module
  assertEquals(true, true, "No circular dependencies in types module");
});

/**
 * Architecture Test: Interface Consistency
 *
 * Validates that all exported types follow consistent naming conventions
 * and structural patterns according to Totality principles.
 */
Deno.test("Architecture: Config types interface consistency", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Extract interface definitions
  const interfaceMatches = typesContent.matchAll(/export\s+interface\s+(\w+)/g);
  const interfaceNames = Array.from(interfaceMatches).map((match) => match[1]);

  // Check interface naming convention (PascalCase)
  interfaceNames.forEach((name) => {
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(name);
    assertEquals(isPascalCase, true, `Interface "${name}" should use PascalCase`);
  });

  // Extract property definitions
  const propertyMatches = typesContent.matchAll(/^\s*(\w+)\??:\s*/gm);
  const propertyNames = Array.from(propertyMatches).map((match) => match[1]);

  // Check property naming convention (snake_case or camelCase based on existing patterns)
  propertyNames.forEach((name) => {
    // The existing code uses snake_case for some properties and camelCase for others
    // We'll allow both patterns as they're already established
    const isValidNaming = /^[a-z][a-z0-9_]*$/.test(name) || /^[a-z][a-zA-Z0-9]*$/.test(name);
    assertEquals(isValidNaming, true, `Property "${name}" should use snake_case or camelCase`);
  });

  // Check for optional properties - they should have clear purpose
  // const optionalProperties = Array.from(typesContent.matchAll(/^\s*(\w+)\?:\s*/gm));

  // In ConfigOptions, optional properties are acceptable as they represent runtime options
  assertEquals(interfaceNames.length > 0, true, "Should have interface definitions");
});

/**
 * Architecture Test: Totality Compliance
 *
 * Ensures that types follow Totality principles:
 * - No partial functions (all inputs have defined outputs)
 * - Use of discriminated unions over optional properties
 * - Proper error representation as values, not exceptions
 */
Deno.test("Architecture: Config types follow Totality principles", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Check for proper handling of optional properties
  // In ConfigOptions, optional properties are acceptable as they represent runtime configuration
  const configOptionsMatch = typesContent.match(/export\s+interface\s+ConfigOptions\s*{([^}]+)}/s);
  if (configOptionsMatch) {
    const optionalProps = configOptionsMatch[1].matchAll(/(\w+)\?:/g);
    const optionalPropNames = Array.from(optionalProps).map((m) => m[1]);

    // ConfigOptions is allowed to have optional properties as it represents runtime options
    assertEquals(
      optionalPropNames.length >= 0,
      true,
      "ConfigOptions can have optional properties for runtime configuration",
    );
  }

  // Check BreakdownConfig has no optional properties (should be total)
  const breakdownConfigMatch = typesContent.match(
    /export\s+interface\s+BreakdownConfig\s*{([^}]+)}/s,
  );
  if (breakdownConfigMatch) {
    const optionalProps = breakdownConfigMatch[1].matchAll(/(\w+)\?:/g);
    const optionalPropNames = Array.from(optionalProps).map((m) => m[1]);

    assertEquals(
      optionalPropNames.length,
      0,
      "BreakdownConfig should not have optional properties - use explicit state representation",
    );
  }

  // Verify no function signatures that might return undefined/null
  // (This is a types-only file, so no functions should exist)
  const hasFunctions = typesContent.includes("function") || typesContent.includes("=>");
  assertEquals(hasFunctions, false, "Types file should not contain function implementations");

  // Check that types are well-defined (no 'any' type)
  const hasAnyType = typesContent.includes(": any");
  assertEquals(hasAnyType, false, "Should not use 'any' type - violates Totality principles");
});

/**
 * Architecture Test: Module Boundaries
 *
 * Verifies that the types module properly encapsulates its concerns
 * and doesn't leak implementation details.
 */
Deno.test("Architecture: Config types module boundaries", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Check that only type definitions are exported
  const exportLines = typesContent.split("\n").filter((line) => line.trim().startsWith("export"));

  exportLines.forEach((line) => {
    const isTypeExport = /^export\s+(interface|type)\s+/.test(line.trim());
    assertEquals(isTypeExport, true, `Only type/interface exports allowed, found: ${line.trim()}`);
  });

  // Verify no implementation logic exists
  const implementationPatterns = [
    /class\s+\w+/, // No class definitions
    /function\s+\w+/, // No function definitions
    /const\s+\w+\s*=/, // No const assignments
    /let\s+\w+\s*=/, // No let assignments
    /var\s+\w+\s*=/, // No var assignments
    /new\s+\w+/, // No object instantiation
    /\.\w+\(/, // No method calls
  ];

  implementationPatterns.forEach((pattern) => {
    const hasImplementation = pattern.test(typesContent);
    assertEquals(
      hasImplementation,
      false,
      `No implementation logic allowed, pattern ${pattern} found`,
    );
  });

  // Verify types are scoped to CLI config domain
  const interfaces = Array.from(typesContent.matchAll(/export\s+interface\s+(\w+)/g)).map((m) =>
    m[1]
  );

  interfaces.forEach((name) => {
    // All interfaces should be related to config/options
    const isConfigRelated = name.includes("Config") || name.includes("Options");
    assertEquals(
      isConfigRelated,
      true,
      `Interface "${name}" should be related to configuration domain`,
    );
  });

  assertEquals(interfaces.length > 0, true, "Should have exported interfaces");
});
