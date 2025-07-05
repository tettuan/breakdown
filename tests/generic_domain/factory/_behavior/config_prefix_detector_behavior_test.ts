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

import { assertEquals } from "../../../lib/deps.ts";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("ConfigPrefixDetector - detects --config=value format", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["--config=test"]),
    "test",
    "Should extract value from --config=value",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["--config=prod"]),
    "prod",
    "Should extract value from --config=prod",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["--config="]),
    "",
    "Should return empty string for --config= without value",
  );
});

Deno.test("ConfigPrefixDetector - detects -c=value format", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["-c=test"]),
    "test",
    "Should extract value from -c=value",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["-c=dev"]),
    "dev",
    "Should extract value from -c=dev",
  );
});

Deno.test("ConfigPrefixDetector - detects --config value format", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["--config", "test"]),
    "test",
    "Should extract value from space-separated --config",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["--config", "production"]),
    "production",
    "Should extract value from space-separated --config",
  );
});

Deno.test("ConfigPrefixDetector - detects -c value format", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["-c", "test"]),
    "test",
    "Should extract value from space-separated -c",
  );
});

Deno.test("ConfigPrefixDetector - ignores values starting with dash", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["--config", "--other"]),
    null,
    "Should not treat --other as config value",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["-c", "-x"]),
    null,
    "Should not treat -x as config value",
  );
});

Deno.test("ConfigPrefixDetector - returns null when no config found", () => {
  assertEquals(
    ConfigPrefixDetector.detect([]),
    null,
    "Should return null for empty args",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["init", "--verbose"]),
    null,
    "Should return null when no config option",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["--other=value"]),
    null,
    "Should return null for non-config options",
  );
});

Deno.test("ConfigPrefixDetector - handles edge cases", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["--config"]),
    null,
    "Should return null for --config without value at end",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["-c"]),
    null,
    "Should return null for -c without value at end",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["something", "--config=test", "other"]),
    "test",
    "Should find config in middle of args",
  );
});

Deno.test("ConfigPrefixDetector - returns first config found", () => {
  assertEquals(
    ConfigPrefixDetector.detect(["--config=first", "--config=second"]),
    "first",
    "Should return first config value when multiple exist",
  );

  assertEquals(
    ConfigPrefixDetector.detect(["-c=first", "--config=second"]),
    "first",
    "Should return first config value regardless of format",
  );
});
