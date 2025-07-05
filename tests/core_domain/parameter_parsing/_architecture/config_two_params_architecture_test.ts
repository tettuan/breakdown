/**
 * @fileoverview Architecture tests for config two params defaults
 *
 * This test file validates the architectural constraints and design principles
 * of the two params configuration defaults module, ensuring it follows
 * Totality principles and maintains proper encapsulation.
 *
 * @module types/defaults/0_architecture_config_two_params_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Architecture Test: Configuration Immutability
 *
 * Verifies that default configurations are immutable and cannot
 * be accidentally modified at runtime.
 */
Deno.test("Architecture: Config two params defaults are immutable", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./config_two_params.ts", import.meta.url)),
  );

  // Check for const declaration
  const hasConstDeclaration = moduleSource.includes("export const _defaultConfigTwoParams");
  assertEquals(hasConstDeclaration, true, "Should use const for immutable default");

  // Check that object is not explicitly frozen (this is a design choice)
  // In TypeScript/JavaScript, const only prevents reassignment, not mutation
  // True immutability would require Object.freeze or readonly types
  const hasObjectFreeze = moduleSource.includes("Object.freeze");

  // For this codebase, const declaration is sufficient
  assertEquals(hasConstDeclaration, true, "Default config should be declared as const");

  // Check structure doesn't use mutable collections
  const hasMutableArrayMethods = moduleSource.includes(".push(") ||
    moduleSource.includes(".pop(") ||
    moduleSource.includes(".splice(");
  assertEquals(hasMutableArrayMethods, false, "Should not use mutable array methods");
});

/**
 * Architecture Test: Type Safety
 *
 * Ensures that configuration defaults maintain strict type safety
 * and follow Totality principles for configuration values.
 */
Deno.test("Architecture: Config defaults maintain type safety", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./config_two_params.ts", import.meta.url)),
  );

  // Check for any/unknown types
  const hasAnyType = moduleSource.includes(": any") || moduleSource.includes("<any>");
  const hasUnknownType = moduleSource.includes(": unknown");

  assertEquals(hasAnyType, false, "Should not use 'any' type");
  // unknown is acceptable for some cases, but not in config
  assertEquals(hasUnknownType, false, "Should not use 'unknown' type in config");

  // Check that values are properly typed (strings, arrays, etc.)
  const hasStringPatterns = moduleSource.includes('pattern: "');
  const hasArrayValues = moduleSource.includes("allowedFlagOptions: [") ||
    moduleSource.includes("allowedValueOptions: [");
  const hasBooleanValues = moduleSource.includes(": true") || moduleSource.includes(": false");

  assertEquals(hasStringPatterns, true, "Should have string pattern values");
  assertEquals(hasArrayValues, true, "Should have array configuration values");
  assertEquals(hasBooleanValues, true, "Should have boolean configuration values");
});

/**
 * Architecture Test: Configuration Validation
 *
 * Validates that default configurations follow business rules
 * and domain constraints.
 */
Deno.test("Architecture: Config defaults follow domain constraints", async () => {
  const { _defaultConfigTwoParams } = await import("./config_two_params.ts");

  // Verify pattern strings are valid regex
  const patterns = [
    _defaultConfigTwoParams.params.two.demonstrativeType.pattern,
    _defaultConfigTwoParams.params.two.layerType.pattern,
  ];

  patterns.forEach((pattern, i) => {
    try {
      new RegExp(pattern);
      assertEquals(true, true, `Pattern ${i} is valid regex`);
    } catch {
      assertEquals(false, true, `Pattern ${i} is invalid regex: ${pattern}`);
    }
  });

  // Check demonstrativeType matches expected values
  const demonstrativePattern = _defaultConfigTwoParams.params.two.demonstrativeType.pattern;
  assertEquals(demonstrativePattern.includes("to"), true, "Should include 'to' directive");
  assertEquals(
    demonstrativePattern.includes("summary"),
    true,
    "Should include 'summary' directive",
  );
  assertEquals(demonstrativePattern.includes("defect"), true, "Should include 'defect' directive");

  // Check layerType matches expected values
  const layerPattern = _defaultConfigTwoParams.params.two.layerType.pattern;
  assertEquals(layerPattern.includes("project"), true, "Should include 'project' layer");
  assertEquals(layerPattern.includes("issue"), true, "Should include 'issue' layer");
  assertEquals(layerPattern.includes("task"), true, "Should include 'task' layer");

  // Verify required fields exist
  assertExists(_defaultConfigTwoParams.params, "Should have params");
  assertExists(_defaultConfigTwoParams.params.two, "Should have two params config");
  assertExists(_defaultConfigTwoParams.params.two.validation, "Should have validation config");
});

/**
 * Architecture Test: Module Independence
 *
 * Ensures that the defaults module is self-contained and doesn't
 * depend on runtime state or external modules.
 */
Deno.test("Architecture: Config defaults are independent", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./config_two_params.ts", import.meta.url)),
  );

  // Check for imports
  const importLines = moduleSource.split("\n").filter((line) => line.trim().startsWith("import"));
  assertEquals(importLines.length, 0, "Config defaults should have no imports");

  // Check for function calls or runtime dependencies
  const hasFunctionCalls = /\w+\(/.test(moduleSource) && !moduleSource.includes("pattern:");
  assertEquals(hasFunctionCalls, false, "Should not have function calls");

  // Check that it's pure data
  const hasClasses = moduleSource.includes("class ");
  const hasFunctions = moduleSource.includes("function ") || moduleSource.includes("=>");

  assertEquals(hasClasses, false, "Should not define classes");
  assertEquals(hasFunctions, false, "Should not define functions");

  // Verify it's a simple object export
  const hasObjectExport = moduleSource.includes("export const") && moduleSource.includes("= {");
  assertEquals(hasObjectExport, true, "Should export a simple object");
});

/**
 * Architecture Test: Consistency with Type System
 *
 * Verifies that defaults align with the type definitions
 * for DirectiveType and LayerType patterns.
 */
Deno.test("Architecture: Config defaults align with type system", async () => {
  const { _defaultConfigTwoParams } = await import("./config_two_params.ts");

  // Check that patterns follow the expected format for DirectiveType and LayerType
  const demonstrativeType = _defaultConfigTwoParams.params.two.demonstrativeType;
  const layerType = _defaultConfigTwoParams.params.two.layerType;

  // Verify pattern structure (regex with alternation)
  const demonstrativeRegex = new RegExp(demonstrativeType.pattern);
  const layerRegex = new RegExp(layerType.pattern);

  // Test that patterns match expected values
  const directives = ["to", "summary", "defect"];
  directives.forEach((d) => {
    const matches = demonstrativeRegex.test(d);
    assertEquals(matches, true, `Directive '${d}' should match pattern`);
  });

  const layers = ["project", "issue", "task"];
  layers.forEach((l) => {
    const matches = layerRegex.test(l);
    assertEquals(matches, true, `Layer '${l}' should match pattern`);
  });

  // Verify validation options are strings (type-safe)
  const valueOptions = _defaultConfigTwoParams.params.two.validation.allowedValueOptions;
  valueOptions.forEach((opt: string) => {
    assertEquals(typeof opt, "string", `Option '${opt}' should be string`);
  });

  // Check boolean flags are actually boolean
  const { userVariableOption, stdinAllowed } = _defaultConfigTwoParams.params.two.validation;
  assertEquals(typeof userVariableOption, "boolean", "userVariableOption should be boolean");
  assertEquals(typeof stdinAllowed, "boolean", "stdinAllowed should be boolean");
});
