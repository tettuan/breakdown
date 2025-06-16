/**
 * Unit test for ConfigPrefixDetector
 *
 * Tests the functional behavior of config prefix detection:
 * - Various command line formats
 * - Edge cases
 * - Invalid inputs
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("ConfigPrefixDetector - detects --config=value format", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["--config=test"]),
    "test",
    "Should extract value from --config=value",
  );

  assertEquals(
    detector.detect(["--config=prod"]),
    "prod",
    "Should extract value from --config=prod",
  );

  assertEquals(
    detector.detect(["--config="]),
    "",
    "Should return empty string for --config= without value",
  );
});

Deno.test("ConfigPrefixDetector - detects -c=value format", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["-c=test"]),
    "test",
    "Should extract value from -c=value",
  );

  assertEquals(
    detector.detect(["-c=dev"]),
    "dev",
    "Should extract value from -c=dev",
  );
});

Deno.test("ConfigPrefixDetector - detects --config value format", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["--config", "test"]),
    "test",
    "Should extract value from space-separated --config",
  );

  assertEquals(
    detector.detect(["--config", "production"]),
    "production",
    "Should extract value from space-separated --config",
  );
});

Deno.test("ConfigPrefixDetector - detects -c value format", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["-c", "test"]),
    "test",
    "Should extract value from space-separated -c",
  );
});

Deno.test("ConfigPrefixDetector - ignores values starting with dash", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["--config", "--other"]),
    undefined,
    "Should not treat --other as config value",
  );

  assertEquals(
    detector.detect(["-c", "-x"]),
    undefined,
    "Should not treat -x as config value",
  );
});

Deno.test("ConfigPrefixDetector - returns undefined when no config found", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect([]),
    undefined,
    "Should return undefined for empty args",
  );

  assertEquals(
    detector.detect(["init", "--verbose"]),
    undefined,
    "Should return undefined when no config option",
  );

  assertEquals(
    detector.detect(["--other=value"]),
    undefined,
    "Should return undefined for non-config options",
  );
});

Deno.test("ConfigPrefixDetector - handles edge cases", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["--config"]),
    undefined,
    "Should return undefined for --config without value at end",
  );

  assertEquals(
    detector.detect(["-c"]),
    undefined,
    "Should return undefined for -c without value at end",
  );

  assertEquals(
    detector.detect(["something", "--config=test", "other"]),
    "test",
    "Should find config in middle of args",
  );
});

Deno.test("ConfigPrefixDetector - returns first config found", () => {
  const detector = new ConfigPrefixDetector();

  assertEquals(
    detector.detect(["--config=first", "--config=second"]),
    "first",
    "Should return first config value when multiple exist",
  );

  assertEquals(
    detector.detect(["-c=first", "--config=second"]),
    "first",
    "Should return first config value regardless of format",
  );
});
