/**
 * @fileoverview 0_architecture tests for ConfigPrefixDetector
 * Testing architectural constraints and design patterns compliance
 *
 * Architecture tests verify:
 * - Utility class pattern enforcement (static-only)
 * - Domain boundary constraints
 * - Result type constraints (null-safe returns)
 * - Totality pattern compliance
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("0_architecture: Utility class pattern - prevents instantiation", () => {
  // ARCHITECTURE CONSTRAINT: ConfigPrefixDetector is a utility class
  // Should not be instantiable - only static methods allowed

  // @ts-expect-error - Verifying private constructor constraint
  const _attemptDirectConstruction = () => new ConfigPrefixDetector();

  // Verify static method exists as the only access pattern
  assertEquals(typeof ConfigPrefixDetector.detect, "function");
  assertExists(ConfigPrefixDetector.detect);
});

Deno.test("0_architecture: Utility class pattern - no instance methods exposed", () => {
  // ARCHITECTURE CONSTRAINT: Only static methods should exist
  // No instance-level functionality should be available

  const prototype = ConfigPrefixDetector.prototype;
  const ownProps = Object.getOwnPropertyNames(prototype);

  // Should only have constructor (which is private)
  assertEquals(ownProps.length, 1);
  assertEquals(ownProps[0], "constructor");
});

Deno.test("0_architecture: Domain boundary constraint - no exceptions across boundary", () => {
  // ARCHITECTURE CONSTRAINT: Domain boundaries must not leak exceptions
  // All edge cases must be handled gracefully with null returns

  const boundaryViolationTests = [
    { desc: "null args", args: null },
    { desc: "undefined args", args: undefined },
    { desc: "empty array", args: [] },
    { desc: "non-array args", args: "not-an-array" },
    { desc: "array with nulls", args: [null, null] },
    { desc: "array with undefined", args: [undefined, "--config", "value"] },
    { desc: "array with non-strings", args: [123, true, {}] },
    { desc: "deeply nested structure", args: [[["--config"], ["value"]]] },
  ];

  for (const { desc, args } of boundaryViolationTests) {
    // Should never throw - all errors must be handled gracefully
    const result = ConfigPrefixDetector.detect(args as unknown as string[]);

    // Should return null for invalid inputs, not throw
    assertEquals(
      typeof result === "string" || result === null,
      true,
      `Failed for test case: ${desc} - got ${typeof result}`,
    );
  }
});

Deno.test("0_architecture: Null-safe return pattern - consistent return types", () => {
  // ARCHITECTURE CONSTRAINT: Method must return string | null consistently
  // No undefined, no exceptions, no other types

  const testCases = [
    // Valid cases should return string
    { args: ["--config=test"], expectedType: "string" },
    { args: ["-c=test"], expectedType: "string" },
    { args: ["--config", "test"], expectedType: "string" },
    { args: ["-c", "test"], expectedType: "string" },

    // Invalid cases should return null
    { args: [], expectedType: "null" },
    { args: ["--help"], expectedType: "null" },
    { args: ["--config"], expectedType: "null" },
    { args: ["-c"], expectedType: "null" },
    { args: ["--config", "--verbose"], expectedType: "null" },
  ];

  for (const { args, expectedType } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    const actualType = result === null ? "null" : typeof result;

    assertEquals(
      actualType,
      expectedType,
      `Args ${JSON.stringify(args)} should return ${expectedType}`,
    );
  }
});

Deno.test("0_architecture: Totality pattern - exhaustive argument format handling", () => {
  // ARCHITECTURE CONSTRAINT: All documented argument formats must be handled
  // Totality pattern requires handling all possible valid input formats

  const supportedFormats = [
    // Equals syntax - long form
    { args: ["--config=production"], expected: "production" },
    { args: ["--config="], expected: "" }, // Empty value is valid
    { args: ["--config=with-dash"], expected: "with-dash" },
    { args: ["--config=with spaces"], expected: "with spaces" },

    // Equals syntax - short form
    { args: ["-c=production"], expected: "production" },
    { args: ["-c="], expected: "" },
    { args: ["-c=with-dash"], expected: "with-dash" },

    // Space-separated - long form
    { args: ["--config", "production"], expected: "production" },
    { args: ["--config", "with-dash"], expected: "with-dash" },
    { args: ["--config", ""], expected: "" }, // Empty value

    // Space-separated - short form
    { args: ["-c", "production"], expected: "production" },
    { args: ["-c", "with-dash"], expected: "with-dash" },

    // Mixed with other arguments
    { args: ["--verbose", "--config=test", "--help"], expected: "test" },
    { args: ["-v", "-c", "test", "-h"], expected: "test" },
    { args: ["cmd", "--config", "prod", "arg"], expected: "prod" },
  ];

  for (const { args, expected } of supportedFormats) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed to handle format: ${JSON.stringify(args)}`);
  }
});

Deno.test("0_architecture: Immutability constraint - input array not modified", () => {
  // ARCHITECTURE CONSTRAINT: Pure function - must not mutate input
  // Detector must not modify the input array in any way

  const originalArgs = ["--verbose", "--config", "test", "--help"];
  const argsCopy = [...originalArgs];

  const result = ConfigPrefixDetector.detect(originalArgs);

  // Verify no mutations occurred
  assertEquals(originalArgs.length, argsCopy.length);
  for (let i = 0; i < originalArgs.length; i++) {
    assertEquals(originalArgs[i], argsCopy[i], `Argument at index ${i} was mutated`);
  }

  // Verify correct result despite no mutations
  assertEquals(result, "test");
});

Deno.test("0_architecture: Single responsibility - only detects config prefix", () => {
  // ARCHITECTURE CONSTRAINT: Class has single responsibility
  // Should only detect config prefix, not validate or transform it

  // Should detect but not validate content
  const invalidPaths = [
    "--config=/invalid/path/../../etc/passwd",
    "-c=C:\\Windows\\System32",
    "--config=",
    "-c=!!!invalid!!!",
  ];

  for (const arg of invalidPaths) {
    const result = ConfigPrefixDetector.detect([arg]);
    // Should return the value as-is, not validate it
    assertExists(result);
    assertEquals(typeof result, "string");
  }
});

Deno.test("0_architecture: Deterministic behavior - same input produces same output", () => {
  // ARCHITECTURE CONSTRAINT: Pure function with deterministic behavior
  // Same input must always produce same output

  const testArgs = ["--verbose", "--config=test", "--debug"];

  // Run multiple times
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(ConfigPrefixDetector.detect(testArgs));
  }

  // All results should be identical
  const firstResult = results[0];
  for (const result of results) {
    assertEquals(result, firstResult, "Non-deterministic behavior detected");
  }
});

Deno.test("0_architecture: Static analysis safety - no shared mutable state", () => {
  // ARCHITECTURE CONSTRAINT: No shared mutable state between calls
  // Static methods must not rely on any shared state

  // Call with different configs
  const result1 = ConfigPrefixDetector.detect(["--config=first"]);
  const result2 = ConfigPrefixDetector.detect(["--config=second"]);
  const result3 = ConfigPrefixDetector.detect(["--config=first"]);

  // Results should be independent
  assertEquals(result1, "first");
  assertEquals(result2, "second");
  assertEquals(result3, "first");

  // Calling with no config shouldn't affect subsequent calls
  const noConfig = ConfigPrefixDetector.detect(["--help"]);
  assertEquals(noConfig, null);

  const afterNoConfig = ConfigPrefixDetector.detect(["--config=test"]);
  assertEquals(afterNoConfig, "test");
});
