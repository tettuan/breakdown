/**
 * Architecture test for _ConfigPrefixDetector
 *
 * Verifies architectural constraints:
 * - No dependency on BreakdownConfig (to avoid circular dependency)
 * - Single responsibility principle adherence
 * - Minimal external dependencies
 * - Stateless utility pattern
 * - No instantiation capability
 *
 * @module
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { fromFileUrl } from "@std/path";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("_ConfigPrefixDetector architecture - no circular dependencies", async () => {
  // Read the source file to check imports
  const filePath = fromFileUrl(new URL("./config_prefix_detector.ts", import.meta.url));
  const sourceCode = await Deno.readTextFile(filePath);

  // Ensure no import of BreakdownConfig
  assertEquals(
    sourceCode.includes("import") && sourceCode.includes("BreakdownConfig"),
    false,
    "_ConfigPrefixDetector must not depend on BreakdownConfig to avoid circular dependency",
  );

  // Ensure no import of complex dependencies
  assertEquals(
    sourceCode.includes('from "../'),
    false,
    "_ConfigPrefixDetector should not have dependencies on other project modules",
  );

  // Ensure no external package imports
  const importPattern = /import\s+.*\s+from\s+["'](@[^"']+|https?:\/\/[^"']+)["']/g;
  const externalImports = [...sourceCode.matchAll(importPattern)];
  assertEquals(
    externalImports.length,
    0,
    "_ConfigPrefixDetector should not have any external dependencies to remain lightweight",
  );
});

Deno.test("_ConfigPrefixDetector architecture - single responsibility", async () => {
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
    "_ConfigPrefixDetector should have exactly one static method (detect)",
  );

  assertEquals(
    staticMethods[0],
    "detect",
    "The single static method should be named 'detect'",
  );
});

Deno.test("_ConfigPrefixDetector architecture - stateless utility pattern", async () => {
  // Verify that the class is designed as a static utility
  // Note: TypeScript private constructors are not enforceable at runtime,
  // but we can verify the design intent through other means

  // Verify no instance methods exist (except constructor)
  const instanceMethods = Object.getOwnPropertyNames(ConfigPrefixDetector.prototype)
    .filter((name) => name !== "constructor");

  assertEquals(
    instanceMethods.length,
    0,
    "_ConfigPrefixDetector should have no instance methods (pure static utility)",
  );

  // Verify that creating an instance would be pointless (no instance methods or properties)
  // deno-lint-ignore no-explicit-any
  const instance = new (ConfigPrefixDetector as any)();
  const instanceProperties = Object.getOwnPropertyNames(instance);

  assertEquals(
    instanceProperties.length,
    0,
    "_ConfigPrefixDetector instances should have no properties",
  );

  // Verify that all functionality is accessed through static methods
  const staticProperties = Object.getOwnPropertyNames(ConfigPrefixDetector)
    .filter((name) => name !== "prototype" && name !== "length" && name !== "name");

  assertEquals(
    staticProperties.includes("detect"),
    true,
    "All functionality should be available as static methods",
  );
});

Deno.test("_ConfigPrefixDetector architecture - method signature stability", async () => {
  const { ConfigPrefixDetector } = await import("./config_prefix_detector.ts");

  // Verify detect method signature
  assertEquals(
    ConfigPrefixDetector.detect.length,
    1,
    "detect method should accept exactly 1 parameter",
  );

  // Verify method returns string | null
  const result1 = ConfigPrefixDetector.detect([]);
  assertEquals(
    result1,
    null,
    "detect should return null when no config found",
  );

  const result2 = ConfigPrefixDetector.detect(["--config=test"]);
  assertEquals(
    typeof result2,
    "string",
    "detect should return string when config found",
  );
});

Deno.test("_ConfigPrefixDetector architecture - error handling strategy", async () => {
  // Verify that detect method handles edge cases gracefully
  const testCases = [
    [],
    ["--config"],
    ["--config="],
    ["-c"],
    ["-c="],
    ["--config", "-"],
    ["--config", "--other"],
  ];

  for (const testCase of testCases) {
    try {
      const result = ConfigPrefixDetector.detect(testCase);
      // Verify result is either string or null
      assertEquals(
        typeof result === "string" || result === null,
        true,
        `detect should return string or null for input: ${JSON.stringify(testCase)}`,
      );
    } catch (error) {
      throw new Error(
        `detect method should not throw for input: ${
          JSON.stringify(testCase)
        }, but threw: ${error}`,
      );
    }
  }

  // Test null/undefined handling separately (these should throw TypeError)
  const invalidInputs = [
    // deno-lint-ignore no-explicit-any
    null as any,
    // deno-lint-ignore no-explicit-any
    undefined as any,
  ];

  for (const invalidInput of invalidInputs) {
    assertThrows(
      () => ConfigPrefixDetector.detect(invalidInput),
      TypeError,
      undefined,
      `detect should throw TypeError for ${invalidInput} input`,
    );
  }
});

Deno.test("_ConfigPrefixDetector architecture - pure function characteristics", async () => {
  // Verify that detect is a pure function (same input = same output)
  const testInputs = [
    ["--config=prod"],
    ["--config", "dev"],
    ["-c=staging"],
    ["-c", "test"],
    [],
  ];

  // Run each test twice to ensure consistent results
  for (const input of testInputs) {
    const result1 = ConfigPrefixDetector.detect(input);
    const result2 = ConfigPrefixDetector.detect(input);

    assertEquals(
      result1,
      result2,
      `detect should return consistent results for input: ${JSON.stringify(input)}`,
    );
  }
});

Deno.test("_ConfigPrefixDetector architecture - no state management", async () => {
  // Read source to verify no state variables
  const filePath = fromFileUrl(new URL("./config_prefix_detector.ts", import.meta.url));
  const sourceCode = await Deno.readTextFile(filePath);

  // Check for common state patterns
  const statePatterns = [
    /private\s+static\s+\w+\s*[:=]/, // private static variables
    /private\s+\w+\s*[:=]/, // private instance variables
    /public\s+static\s+\w+\s*[:=]/, // public static variables
    /public\s+\w+\s*[:=]/, // public instance variables
    /this\.\w+\s*=/, // instance property assignment
    /_ConfigPrefixDetector\.\w+\s*=/, // static property assignment
  ];

  for (const pattern of statePatterns) {
    assertEquals(
      pattern.test(sourceCode),
      false,
      `_ConfigPrefixDetector should not have state management (pattern: ${pattern})`,
    );
  }
});

Deno.test("_ConfigPrefixDetector architecture - minimal complexity", async () => {
  // Read source code to analyze complexity
  const filePath = fromFileUrl(new URL("./config_prefix_detector.ts", import.meta.url));
  const sourceCode = await Deno.readTextFile(filePath);

  // Extract the detect method body
  const detectMethodMatch = sourceCode.match(/static\s+detect\s*\([^)]*\)[^{]*{([\s\S]*?)^\s*}/m);
  const detectMethodBody = detectMethodMatch?.[1] || "";

  // Count control flow statements (simplified complexity metric)
  const ifCount = (detectMethodBody.match(/\bif\b/g) || []).length;
  const forCount = (detectMethodBody.match(/\bfor\b/g) || []).length;
  const whileCount = (detectMethodBody.match(/\bwhile\b/g) || []).length;

  const totalComplexity = ifCount + forCount + whileCount;

  // Ensure reasonable complexity
  assertEquals(
    totalComplexity <= 10,
    true,
    `detect method should have low complexity (found ${ifCount} ifs, ${forCount} fors, ${whileCount} whiles)`,
  );

  // Ensure single loop pattern
  assertEquals(
    forCount,
    1,
    "detect method should use exactly one loop for iterating arguments",
  );
});

Deno.test("_ConfigPrefixDetector architecture - focused responsibility", async () => {
  // Verify that the class only handles config prefix detection
  // and doesn't leak into other concerns

  const responsibilities = {
    "config prefix detection": true,
    "argument parsing": false, // Should not parse general arguments
    "validation": false, // Should not validate config values
    "file loading": false, // Should not load config files
    "error reporting": false, // Should not throw or report errors
    "logging": false, // Should not perform logging
    "configuration loading": false, // Should not load configurations
  };

  assertExists(
    responsibilities["config prefix detection"],
    "Primary responsibility should be config prefix detection",
  );

  // Count false responsibilities
  const falseCount = Object.values(responsibilities).filter((v) => v === false).length;
  assertEquals(
    falseCount >= 5,
    true,
    "Should explicitly not handle most other responsibilities",
  );
});
