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

import { assertEquals, assertExists } from "@std/assert";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("ConfigPrefixDetector structure - class exists", () => {
  assertExists(ConfigPrefixDetector, "ConfigPrefixDetector class should be exported");
  assertEquals(
    typeof ConfigPrefixDetector,
    "function",
    "ConfigPrefixDetector should be a class constructor",
  );
});

Deno.test("ConfigPrefixDetector structure - detect method signature", () => {
  const detector = new ConfigPrefixDetector();

  assertExists(detector.detect, "detect method should exist");
  assertEquals(
    typeof detector.detect,
    "function",
    "detect should be a function",
  );

  // Test method accepts array argument
  const result = detector.detect([]);
  assertEquals(
    result,
    undefined,
    "detect should return undefined for empty array",
  );
});

Deno.test("ConfigPrefixDetector structure - no extra public properties", () => {
  const detector = new ConfigPrefixDetector();
  const instance = Object.getOwnPropertyNames(detector);

  assertEquals(
    instance.length,
    0,
    "ConfigPrefixDetector instance should have no public properties",
  );
});
