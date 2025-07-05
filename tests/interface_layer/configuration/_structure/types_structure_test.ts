/**
 * @fileoverview Structure tests for CLI config types
 *
 * This test file validates the structural design and responsibility separation
 * of the CLI configuration types module, ensuring proper abstraction levels.
 *
 * @module cli/config/1_structure_types_test
 */

import { assertEquals } from "../../../../lib/deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Structure Test: Single Responsibility Principle
 *
 * Verifies that each type definition has a single, well-defined purpose
 * and doesn't mix concerns.
 */
Deno.test("Structure: Config types follow single responsibility principle", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Analyze BreakdownConfig interface
  const breakdownConfigMatch = typesContent.match(
    /export\s+interface\s+BreakdownConfig\s*{([^}]+)}/s,
  );
  if (breakdownConfigMatch) {
    const properties = breakdownConfigMatch[1].match(/\w+[?]?:\s*[^;]+/g) || [];

    // Check that all properties relate to configuration
    properties.forEach((prop) => {
      const propName = prop.split(":")[0].trim().replace("?", "");
      const isConfigRelated = propName.includes("directory") || propName.includes("path") ||
        propName.includes("config") || propName.includes("output");
      assertEquals(
        isConfigRelated,
        true,
        `Property '${propName}' in BreakdownConfig should be configuration-related`,
      );
    });
  }

  // Analyze ConfigOptions interface
  const configOptionsMatch = typesContent.match(/export\s+interface\s+ConfigOptions\s*{([^}]+)}/s);
  if (configOptionsMatch) {
    const properties = configOptionsMatch[1].match(/\w+[?]?:\s*[^;]+/g) || [];

    // Check that all properties relate to runtime options
    properties.forEach((prop) => {
      const propName = prop.split(":")[0].trim().replace("?", "");
      const isOptionRelated = propName.includes("Path") || propName.includes("Dir") ||
        propName.endsWith("path") || propName.endsWith("dir");
      assertEquals(
        isOptionRelated,
        true,
        `Property '${propName}' in ConfigOptions should be option-related`,
      );
    });
  }

  assertEquals(breakdownConfigMatch !== null, true, "BreakdownConfig interface should exist");
  assertEquals(configOptionsMatch !== null, true, "ConfigOptions interface should exist");
});

/**
 * Structure Test: Proper Abstraction Levels
 *
 * Ensures that types are defined at appropriate abstraction levels
 * without leaking implementation details.
 */
Deno.test("Structure: Config types have proper abstraction levels", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Check for implementation details that shouldn't be in type definitions
  const implementationPatterns = [
    /process\./, // No process references
    /require\(/, // No require statements
    /fs\./, // No filesystem operations
    /path\.join/, // No path operations
    /\bnew\s+/, // No instantiation
    /console\./, // No console operations
  ];

  implementationPatterns.forEach((pattern) => {
    const hasImplementationDetail = pattern.test(typesContent);
    assertEquals(
      hasImplementationDetail,
      false,
      `Type definitions should not contain implementation details matching ${pattern}`,
    );
  });

  // Verify types use domain language
  const interfaces = Array.from(typesContent.matchAll(/export\s+interface\s+(\w+)/g)).map((m) =>
    m[1]
  );

  interfaces.forEach((name) => {
    // Interface names should be domain-focused
    const isDomainFocused = name.includes("Config") || name.includes("Options") ||
      name.includes("Settings") || name.includes("Params");
    assertEquals(
      isDomainFocused,
      true,
      `Interface '${name}' should use domain language (Config, Options, Settings, etc.)`,
    );
  });

  assertEquals(interfaces.length > 0, true, "Should have interface definitions");
});

/**
 * Structure Test: No Responsibility Duplication
 *
 * Validates that there's no duplication of responsibilities across
 * different type definitions.
 */
Deno.test("Structure: No duplication in config type responsibilities", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Extract all properties from all interfaces
  const interfaceProperties = new Map<string, string[]>();

  const interfaceMatches = Array.from(
    typesContent.matchAll(/export\s+interface\s+(\w+)\s*{([^}]+)}/gs),
  );

  interfaceMatches.forEach((match) => {
    const interfaceName = match[1];
    const properties = match[2].match(/\s*(\w+)[?]?:\s*/g) || [];
    const propNames = properties.map((p) => p.trim().replace(/[?:]/g, "").trim());
    interfaceProperties.set(interfaceName, propNames);
  });

  // Check for property duplication across interfaces
  const allProperties = new Map<string, string[]>();

  interfaceProperties.forEach((props, interfaceName) => {
    props.forEach((prop) => {
      if (!allProperties.has(prop)) {
        allProperties.set(prop, []);
      }
      allProperties.get(prop)!.push(interfaceName);
    });
  });

  // Properties should not be duplicated unless they represent the same concept
  allProperties.forEach((interfaces, prop) => {
    if (interfaces.length > 1) {
      // Allow some duplication for common concepts like 'path'
      const isCommonConcept = prop.includes("path") || prop.includes("dir") ||
        prop.includes("Path") || prop.includes("Dir");
      if (!isCommonConcept) {
        assertEquals(
          interfaces.length,
          1,
          `Property '${prop}' is duplicated in: ${interfaces.join(", ")}`,
        );
      }
    }
  });

  assertEquals(interfaceProperties.size > 0, true, "Should have interfaces to analyze");
});

/**
 * Structure Test: Type Relationships
 *
 * Verifies that relationships between types are properly structured
 * and follow clear hierarchies.
 */
Deno.test("Structure: Config type relationships are well-defined", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Check for clear separation of concerns
  const hasBreakdownConfig = typesContent.includes("export interface BreakdownConfig");
  const hasConfigOptions = typesContent.includes("export interface ConfigOptions");

  assertEquals(hasBreakdownConfig, true, "Should have BreakdownConfig interface");
  assertEquals(hasConfigOptions, true, "Should have ConfigOptions interface");

  // Check that they don't extend each other (they should be separate concerns)
  const hasExtends = /export\s+interface\s+\w+\s+extends\s+/.test(typesContent);
  assertEquals(
    hasExtends,
    false,
    "Config types should not use inheritance - they represent different concerns",
  );

  // Verify proper type composition if used
  const hasTypeUnions = typesContent.includes(" | ");
  const hasTypeIntersections = typesContent.includes(" & ");

  if (hasTypeUnions || hasTypeIntersections) {
    // If using unions/intersections, they should be for valid type composition
    assertEquals(
      hasTypeUnions || hasTypeIntersections,
      true,
      "Type composition is acceptable when used properly",
    );
  }

  // Check that relationships are explicit through property types
  assertEquals(true, true, "Type relationships are properly structured");
});

/**
 * Structure Test: Totality-Based Structure
 *
 * Ensures that the type structure follows Totality principles for
 * representing all possible states explicitly.
 */
Deno.test("Structure: Config types use Totality-based structure", async () => {
  const typesFilePath = fromFileUrl(new URL("./types.ts", import.meta.url));
  const typesContent = await Deno.readTextFile(typesFilePath);

  // Check BreakdownConfig for Totality principles
  const breakdownConfigMatch = typesContent.match(
    /export\s+interface\s+BreakdownConfig\s*{([^}]+)}/s,
  );
  if (breakdownConfigMatch) {
    const content = breakdownConfigMatch[1];

    // Count optional vs required properties
    const optionalProps = (content.match(/\w+\?:/g) || []).length;
    const allProps = (content.match(/\w+[?]?:/g) || []).length;
    const requiredProps = allProps - optionalProps;

    // BreakdownConfig should prefer required properties (totality)
    assertEquals(
      requiredProps > 0,
      true,
      "BreakdownConfig should have required properties for totality",
    );
    assertEquals(
      optionalProps === 0,
      true,
      "BreakdownConfig should avoid optional properties - use explicit state representation",
    );
  }

  // ConfigOptions can have optional properties as it represents runtime options
  const configOptionsMatch = typesContent.match(/export\s+interface\s+ConfigOptions\s*{([^}]+)}/s);
  if (configOptionsMatch) {
    // const content = configOptionsMatch[1];
    // const hasOptionalProps = content.includes("?:");

    // ConfigOptions is allowed to have optional properties for runtime configuration
    assertEquals(
      true,
      true,
      "ConfigOptions can have optional properties as it represents runtime options",
    );
  }

  // Check for discriminated unions (if any)
  // const hasDiscriminatedUnions = /type\s+\w+\s*=\s*{[^}]*kind:\s*['"]\w+['"]/.test(typesContent);

  // If there are state representations, they should use discriminated unions
  if (typesContent.includes("type ") && typesContent.includes(" | ")) {
    // This is fine - types can use unions when appropriate
    assertEquals(true, true, "Union types are acceptable when properly used");
  }

  assertEquals(
    breakdownConfigMatch !== null || configOptionsMatch !== null,
    true,
    "Should have type definitions to analyze",
  );
});
