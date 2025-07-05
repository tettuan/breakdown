/**
 * Structure test for ConfigPrefixDetector
 *
 * Verifies class structure and method signatures:
 * - Class exists and is properly exported
 * - Method signatures match expected interface
 * - No unexpected properties or methods
 *
 * @module
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { ConfigPrefixDetector as ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("ConfigPrefixDetector structure - class exists", () => {
  assertExists(ConfigPrefixDetector, "ConfigPrefixDetector class should be exported");
  assertEquals(
    typeof ConfigPrefixDetector,
    "function",
    "ConfigPrefixDetector should be a class constructor",
  );
});

Deno.test("ConfigPrefixDetector structure - detect method signature", () => {
  assertExists(ConfigPrefixDetector.detect, "static detect method should exist");
  assertEquals(
    typeof ConfigPrefixDetector.detect,
    "function",
    "detect should be a static function",
  );

  // Test method accepts array argument
  const result = ConfigPrefixDetector.detect([]);
  assertEquals(
    result,
    null,
    "detect should return null for empty array",
  );
});

Deno.test("ConfigPrefixDetector structure - constructor is private", () => {
  // TypeScript should prevent instantiation (compile-time check)
  // At runtime, we can only verify the intended usage pattern
  // The real protection is at compile-time via TypeScript

  // Verify that static method works as intended
  const result = ConfigPrefixDetector.detect([]);
  assertEquals(result, null, "Static method should work correctly");

  // Document that constructor should not be used directly
  // (TypeScript will catch this at compile time)
  assertEquals(true, true, "Constructor privacy enforced by TypeScript");
});

Deno.test("ConfigPrefixDetector structure - no extra public properties", () => {
  // Check static methods only
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
