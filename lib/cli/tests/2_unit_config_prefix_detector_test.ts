/**
 * ConfigPrefixDetector Test Suite
 * 
 * TDD approach for testing config prefix detection functionality.
 * Tests both space-separated and equals format for --config/-c options.
 * 
 * @module
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import { ConfigPrefixDetector } from "../config_prefix_detector.ts";

// Test Suite - Phase 1: Basic Detection Tests
Deno.test("ConfigPrefixDetector - Basic Space-Separated Format", async (t) => {
  await t.step("detects --config with space separator", () => {
    const detector = new ConfigPrefixDetector(["--config", "production"]);
    assertEquals(detector.detectPrefix(), "production");
  });

  await t.step("detects -c with space separator", () => {
    const detector = new ConfigPrefixDetector(["-c", "staging"]);
    assertEquals(detector.detectPrefix(), "staging");
  });

  await t.step("returns undefined when no config option", () => {
    const detector = new ConfigPrefixDetector(["--help"]);
    assertEquals(detector.detectPrefix(), undefined);
  });

  await t.step("returns undefined when config has no value", () => {
    const detector = new ConfigPrefixDetector(["--config"]);
    assertEquals(detector.detectPrefix(), undefined);
  });
});

Deno.test("ConfigPrefixDetector - Basic Equals Format", async (t) => {
  await t.step("detects --config=value format", () => {
    const detector = new ConfigPrefixDetector(["--config=development"]);
    assertEquals(detector.detectPrefix(), "development");
  });

  await t.step("detects -c=value format", () => {
    const detector = new ConfigPrefixDetector(["-c=test"]);
    assertEquals(detector.detectPrefix(), "test");
  });

  await t.step("handles empty value with equals", () => {
    const detector = new ConfigPrefixDetector(["--config="]);
    assertEquals(detector.detectPrefix(), "");
  });

  await t.step("handles complex values with equals", () => {
    const detector = new ConfigPrefixDetector(["--config=prod-v2.1"]);
    assertEquals(detector.detectPrefix(), "prod-v2.1");
  });
});

Deno.test("ConfigPrefixDetector - hasConfig Method", async (t) => {
  await t.step("returns true when --config exists", () => {
    const detector = new ConfigPrefixDetector(["--config", "test"]);
    assertEquals(detector.hasConfig(), true);
  });

  await t.step("returns true when -c exists", () => {
    const detector = new ConfigPrefixDetector(["-c=prod"]);
    assertEquals(detector.hasConfig(), true);
  });

  await t.step("returns false when no config option", () => {
    const detector = new ConfigPrefixDetector(["--help", "--version"]);
    assertEquals(detector.hasConfig(), false);
  });

  await t.step("returns true even without value", () => {
    const detector = new ConfigPrefixDetector(["--config"]);
    assertEquals(detector.hasConfig(), true);
  });
});

Deno.test("ConfigPrefixDetector - getConfigIndex Method", async (t) => {
  await t.step("returns index of --config option", () => {
    const detector = new ConfigPrefixDetector(["cmd", "--config", "test"]);
    assertEquals(detector.getConfigIndex(), 1);
  });

  await t.step("returns index of -c option", () => {
    const detector = new ConfigPrefixDetector(["cmd", "arg", "-c=prod"]);
    assertEquals(detector.getConfigIndex(), 2);
  });

  await t.step("returns -1 when no config option", () => {
    const detector = new ConfigPrefixDetector(["cmd", "--help"]);
    assertEquals(detector.getConfigIndex(), -1);
  });

  await t.step("returns first occurrence when multiple configs", () => {
    const detector = new ConfigPrefixDetector(["--config=first", "-c=second"]);
    assertEquals(detector.getConfigIndex(), 0);
  });
});

// Test Suite - Phase 2: Edge Cases and Complex Scenarios
Deno.test("ConfigPrefixDetector - Edge Cases", async (t) => {
  await t.step("handles config at end of arguments", () => {
    const detector = new ConfigPrefixDetector(["cmd", "arg", "--config"]);
    assertEquals(detector.detectPrefix(), undefined);
    assertEquals(detector.hasConfig(), true);
  });

  await t.step("ignores option-like values", () => {
    const detector = new ConfigPrefixDetector(["--config", "--another-option"]);
    assertEquals(detector.detectPrefix(), undefined);
  });

  await t.step("handles multiple equals signs", () => {
    const detector = new ConfigPrefixDetector(["--config=key=value"]);
    assertEquals(detector.detectPrefix(), "key=value");
  });

  await t.step("handles paths as values", () => {
    const detector = new ConfigPrefixDetector(["--config", "./config/app.yml"]);
    assertEquals(detector.detectPrefix(), "./config/app.yml");
  });
});

Deno.test("ConfigPrefixDetector - Integration Scenarios", async (t) => {
  await t.step("works with find bugs command", () => {
    const detector = new ConfigPrefixDetector([
      "find", "bugs", "--config=production", "--from=src/"
    ]);
    assertEquals(detector.detectPrefix(), "production");
    assertEquals(detector.hasConfig(), true);
    assertEquals(detector.getConfigIndex(), 2);
  });

  await t.step("works with mixed options", () => {
    const detector = new ConfigPrefixDetector([
      "--help", "-c", "test", "--version"
    ]);
    assertEquals(detector.detectPrefix(), "test");
    assertEquals(detector.hasConfig(), true);
    assertEquals(detector.getConfigIndex(), 1);
  });

  await t.step("prioritizes first config option", () => {
    const detector = new ConfigPrefixDetector([
      "--config", "first", "--config=second", "-c=third"
    ]);
    assertEquals(detector.detectPrefix(), "first");
    assertEquals(detector.getConfigIndex(), 0);
  });

  await t.step("handles complex real-world scenario", () => {
    const detector = new ConfigPrefixDetector([
      "breakdown", "find", "bugs", 
      "--from=/src/app", 
      "--config=./configs/find-bugs.yml",
      "--destination=report.md",
      "--extended"
    ]);
    assertEquals(detector.detectPrefix(), "./configs/find-bugs.yml");
    assertEquals(detector.hasConfig(), true);
    assertEquals(detector.getConfigIndex(), 4);
  });
});

// Test Suite - Phase 3: Validation and Error Handling
Deno.test("ConfigPrefixDetector - Special Characters and Unicode", async (t) => {
  await t.step("handles special characters in prefix", () => {
    const detector = new ConfigPrefixDetector(["--config=@prod!test#"]);
    assertEquals(detector.detectPrefix(), "@prod!test#");
  });

  await t.step("handles unicode characters", () => {
    const detector = new ConfigPrefixDetector(["-c=設定ファイル"]);
    assertEquals(detector.detectPrefix(), "設定ファイル");
  });

  await t.step("handles whitespace in values", () => {
    const detector = new ConfigPrefixDetector(["--config", "my config file"]);
    assertEquals(detector.detectPrefix(), "my config file");
  });

  await t.step("handles empty array", () => {
    const detector = new ConfigPrefixDetector([]);
    assertEquals(detector.detectPrefix(), undefined);
    assertEquals(detector.hasConfig(), false);
    assertEquals(detector.getConfigIndex(), -1);
  });
});

// Helper test data for developer reference
export const TEST_CASES = {
  basic: [
    { args: ["--config", "test"], expected: "test" },
    { args: ["-c", "prod"], expected: "prod" },
    { args: ["--config=dev"], expected: "dev" },
    { args: ["-c=stage"], expected: "stage" },
  ],
  edge: [
    { args: ["--config"], expected: undefined },
    { args: ["-c"], expected: undefined },
    { args: ["--config="], expected: "" },
    { args: ["--config", "--help"], expected: undefined },
  ],
  complex: [
    { args: ["find", "bugs", "--config=test"], expected: "test" },
    { args: ["--config=first", "-c=second"], expected: "first" },
    { args: ["--config=path/to/config.yml"], expected: "path/to/config.yml" },
  ],
};

/**
 * Test helper function for developer 2
 * Validates detector behavior against expected results
 */
export function validateDetector(
  detector: ConfigPrefixDetector, 
  expectedPrefix: string | undefined,
  expectedHasConfig: boolean
): void {
  assertEquals(detector.detectPrefix(), expectedPrefix);
  assertEquals(detector.hasConfig(), expectedHasConfig);
  if (expectedHasConfig && expectedPrefix !== undefined) {
    assertNotEquals(detector.getConfigIndex(), -1);
  }
}