/**
 * @fileoverview 1_behavior tests for ConfigPrefixDetector
 * Testing functional behavior and business logic
 *
 * Behavior tests verify:
 * - Correct detection of all supported config formats
 * - Proper handling of edge cases
 * - Expected null returns for invalid inputs
 * - Argument parsing correctness
 */

import { assertEquals } from "@std/assert";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("behavior-config-prefix-detector");

Deno.test("1_behavior: detects --config=value format", () => {
  logger.debug("Testing --config=value format detection");

  const testCases = [
    { args: ["--config=production"], expected: "production" },
    { args: ["--config=dev"], expected: "dev" },
    { args: ["--config=test-env"], expected: "test-env" },
    { args: ["--config="], expected: "" }, // Empty value is valid
    { args: ["--config=with spaces"], expected: "with spaces" },
    { args: ["--config=with=equals"], expected: "with=equals" },
    { args: ["--config=123"], expected: "123" },
    { args: ["--config=@special"], expected: "@special" },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: detects -c=value format", () => {
  logger.debug("Testing -c=value format detection");

  const testCases = [
    { args: ["-c=production"], expected: "production" },
    { args: ["-c=dev"], expected: "dev" },
    { args: ["-c=test-env"], expected: "test-env" },
    { args: ["-c="], expected: "" },
    { args: ["-c=with spaces"], expected: "with spaces" },
    { args: ["-c=with=equals"], expected: "with=equals" },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: detects --config value format", () => {
  logger.debug("Testing --config value space-separated format");

  const testCases = [
    { args: ["--config", "production"], expected: "production" },
    { args: ["--config", "dev"], expected: "dev" },
    { args: ["--config", "test-env"], expected: "test-env" },
    { args: ["--config", ""], expected: "" }, // Empty string as value
    { args: ["--config", "123"], expected: "123" },
    { args: ["--config", "@special"], expected: "@special" },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: detects -c value format", () => {
  logger.debug("Testing -c value space-separated format");

  const testCases = [
    { args: ["-c", "production"], expected: "production" },
    { args: ["-c", "dev"], expected: "dev" },
    { args: ["-c", "test-env"], expected: "test-env" },
    { args: ["-c", ""], expected: "" },
    { args: ["-c", "with-dashes"], expected: "with-dashes" },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: returns null when no config specified", () => {
  logger.debug("Testing null return for no config");

  const testCases = [
    { args: [] },
    { args: ["--help"] },
    { args: ["--version"] },
    { args: ["--verbose", "--debug"] },
    { args: ["command", "subcommand"] },
    { args: ["-v", "-h", "-d"] },
  ];

  for (const { args } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, null, `Should return null for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: returns null for config flag without value", () => {
  logger.debug("Testing null return for incomplete config flags");

  const testCases = [
    { args: ["--config"] }, // No value following
    { args: ["-c"] }, // No value following
    { args: ["--config", "--verbose"] }, // Next arg is a flag
    { args: ["-c", "--help"] }, // Next arg is a flag
    { args: ["--config", "-v"] }, // Next arg is a flag
    { args: ["-c", "-h"] }, // Next arg is a flag
    { args: ["something", "--config"] }, // Config at end
    { args: ["something", "-c"] }, // Short form at end
  ];

  for (const { args } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, null, `Should return null for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: handles config in mixed argument positions", () => {
  logger.debug("Testing config detection in various positions");

  const testCases = [
    {
      args: ["--verbose", "--config=test", "--help"],
      expected: "test",
    },
    {
      args: ["--config=test", "--verbose", "--help"],
      expected: "test",
    },
    {
      args: ["command", "subcommand", "-c=prod"],
      expected: "prod",
    },
    {
      args: ["-v", "-d", "--config", "staging", "-h"],
      expected: "staging",
    },
    {
      args: ["--before", "-c", "dev", "--after"],
      expected: "dev",
    },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: prioritizes first config occurrence", () => {
  logger.debug("Testing first-match priority behavior");

  const testCases = [
    {
      args: ["--config=first", "--config=second"],
      expected: "first",
    },
    {
      args: ["-c=first", "-c=second"],
      expected: "first",
    },
    {
      args: ["--config", "first", "--config", "second"],
      expected: "first",
    },
    {
      args: ["-c", "first", "-c", "second"],
      expected: "first",
    },
    {
      args: ["--config=equals", "--config", "space"],
      expected: "equals",
    },
    {
      args: ["-c", "space", "-c=equals"],
      expected: "space",
    },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed priority test for args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: handles special characters in config values", () => {
  logger.debug("Testing special character handling");

  const testCases = [
    { args: ["--config=path/to/config"], expected: "path/to/config" },
    { args: ["--config=config.yml"], expected: "config.yml" },
    { args: ["--config=config@2024"], expected: "config@2024" },
    { args: ["--config=test:dev"], expected: "test:dev" },
    { args: ["--config=test;prod"], expected: "test;prod" },
    { args: ["--config=test,dev"], expected: "test,dev" },
    { args: ["--config=test|prod"], expected: "test|prod" },
    { args: ["-c=../config"], expected: "../config" },
    { args: ["-c=./config"], expected: "./config" },
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Failed for special chars in args: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: handles edge cases gracefully", () => {
  logger.debug("Testing edge case handling");

  // Test with very long config names
  const longConfigName = "a".repeat(1000);
  assertEquals(
    ConfigPrefixDetector.detect(["--config=" + longConfigName]),
    longConfigName,
  );

  // Test with unicode characters
  assertEquals(
    ConfigPrefixDetector.detect(["--config=测试配置"]),
    "测试配置",
  );

  // Test with emoji
  assertEquals(
    ConfigPrefixDetector.detect(["--config=🚀dev"]),
    "🚀dev",
  );

  // Test with empty args array
  assertEquals(
    ConfigPrefixDetector.detect([]),
    null,
  );

  // Test with args containing only empty strings
  assertEquals(
    ConfigPrefixDetector.detect(["", "", ""]),
    null,
  );
});

Deno.test("1_behavior: distinguishes between config flags and similar arguments", () => {
  logger.debug("Testing similar argument discrimination");

  const testCases = [
    { args: ["--configuration=test"], expected: null }, // Not --config
    { args: ["--conf=test"], expected: null }, // Not --config
    { args: ["-config=test"], expected: null }, // Single dash with full word
    { args: ["--c=test"], expected: null }, // Not short form
    { args: ["-co=test"], expected: null }, // Not -c
    { args: ["config=test"], expected: null }, // No dashes
    { args: ["c=test"], expected: null }, // No dash
  ];

  for (const { args, expected } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, expected, `Should not detect config in: ${JSON.stringify(args)}`);
  }
});

Deno.test("1_behavior: handles malformed input gracefully", () => {
  logger.debug("Testing malformed input handling");

  // Should not crash with various malformed inputs
  assertEquals(ConfigPrefixDetector.detect(null as unknown as string[]), null);
  assertEquals(ConfigPrefixDetector.detect(undefined as unknown as string[]), null);
  assertEquals(ConfigPrefixDetector.detect("string" as unknown as string[]), null);
  assertEquals(ConfigPrefixDetector.detect(123 as unknown as string[]), null);
  assertEquals(ConfigPrefixDetector.detect({} as unknown as string[]), null);
  assertEquals(ConfigPrefixDetector.detect([null, undefined, 123] as unknown as string[]), null);

  // Array with non-string elements should be handled
  const mixedArray = ["--config", 123] as unknown as string[];
  assertEquals(ConfigPrefixDetector.detect(mixedArray), null);
});
