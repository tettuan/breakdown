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

  // Check that class has minimal public interface
  const detector = new ConfigPrefixDetector();
  const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(detector))
    .filter((name) =>
      name !== "constructor" && typeof detector[name as keyof typeof detector] === "function"
    );

  assertEquals(
    publicMethods.length,
    1,
    "ConfigPrefixDetector should have exactly one public method (detect)",
  );

  assertEquals(
    publicMethods[0],
    "detect",
    "The single public method should be named 'detect'",
  );
});
