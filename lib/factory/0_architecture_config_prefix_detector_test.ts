/**
 * Architecture test for ConfigPrefixDetector
 *
 * Verifies architectural constraints:
 * - No dependency on BreakdownConfig (to avoid circular dependency)
 * - Single responsibility principle adherence
 * - Minimal external dependencies
 *
 * @module
 */

import { assertEquals } from "@std/assert";

Deno.test("ConfigPrefixDetector architecture - no circular dependencies", async () => {
  // Read the source file to check imports
  const sourceCode = await Deno.readTextFile("./lib/factory/config_prefix_detector.ts");

  // Ensure no import of BreakdownConfig
  assertEquals(
    sourceCode.includes("import") && sourceCode.includes("BreakdownConfig"),
    false,
    "ConfigPrefixDetector must not depend on BreakdownConfig to avoid circular dependency",
  );

  // Ensure no import of complex dependencies
  assertEquals(
    sourceCode.includes('from "../'),
    false,
    "ConfigPrefixDetector should not have dependencies on other project modules",
  );
});

Deno.test("ConfigPrefixDetector architecture - single responsibility", async () => {
  const { ConfigPrefixDetector } = await import("./config_prefix_detector.ts");

  // Check that class has minimal static interface
  const staticMethods = Object.getOwnPropertyNames(ConfigPrefixDetector)
    .filter((name) => 
      name !== "prototype" && 
      name !== "length" && 
      name !== "name" &&
      typeof ConfigPrefixDetector[name as keyof typeof ConfigPrefixDetector] === "function"
    );

  assertEquals(
    staticMethods.length,
    1,
    "ConfigPrefixDetector should have exactly one static method (detect)",
  );

  assertEquals(
    staticMethods[0],
    "detect",
    "The single static method should be named 'detect'",
  );
});
