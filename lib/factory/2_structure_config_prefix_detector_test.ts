/**
 * @fileoverview 2_structure tests for ConfigPrefixDetector
 * Testing structural integrity and design consistency
 * 
 * Structure tests verify:
 * - Class cohesion and responsibility separation
 * - Method signatures and return type consistency
 * - No duplication of responsibilities
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "@std/assert";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-config-prefix-detector");

Deno.test("2_structure: class has single responsibility", () => {
  logger.debug("Testing single responsibility principle");
  
  // ConfigPrefixDetector should only be responsible for detecting config prefix
  // It should not:
  // - Validate the config value
  // - Load configuration files
  // - Parse configuration content
  // - Manage configuration state
  
  // Verify only detection method exists
  const staticMethods = Object.getOwnPropertyNames(ConfigPrefixDetector)
    .filter(name => typeof (ConfigPrefixDetector as any)[name] === "function")
    .filter(name => !["length", "name", "prototype"].includes(name));
  
  assertEquals(staticMethods.length, 1);
  assertEquals(staticMethods[0], "detect");
});

Deno.test("2_structure: method signature consistency", () => {
  logger.debug("Testing method signature consistency");
  
  // Verify detect method signature
  assertEquals(typeof ConfigPrefixDetector.detect, "function");
  assertEquals(ConfigPrefixDetector.detect.length, 1); // Takes 1 parameter
  
  // Verify return type consistency
  const testCases = [
    { args: ["--config=test"], desc: "valid config" },
    { args: [], desc: "empty args" },
    { args: null as any, desc: "null args" },
    { args: ["invalid"], desc: "no config" },
  ];
  
  for (const { args, desc } of testCases) {
    const result = ConfigPrefixDetector.detect(args);
    const isValidReturn = result === null || typeof result === "string";
    assertEquals(isValidReturn, true, 
      `Invalid return type for ${desc}: ${typeof result}`);
  }
});

Deno.test("2_structure: no internal state or side effects", () => {
  logger.debug("Testing statelessness and purity");
  
  // Multiple calls should be independent
  const result1 = ConfigPrefixDetector.detect(["--config=test1"]);
  const result2 = ConfigPrefixDetector.detect(["--config=test2"]);
  const result3 = ConfigPrefixDetector.detect(["--config=test1"]);
  
  assertEquals(result1, "test1");
  assertEquals(result2, "test2");
  assertEquals(result3, "test1");
  
  // No properties should exist on the class (stateless)
  const ownProps = Object.getOwnPropertyNames(ConfigPrefixDetector);
  const nonFunctionProps = ownProps.filter(
    prop => typeof (ConfigPrefixDetector as any)[prop] !== "function"
  );
  
  // Only standard class properties should exist
  const expectedProps = ["length", "name", "prototype"];
  for (const prop of nonFunctionProps) {
    assertEquals(expectedProps.includes(prop), true,
      `Unexpected property found: ${prop}`);
  }
});

Deno.test("2_structure: proper abstraction level", () => {
  logger.debug("Testing abstraction level");
  
  // The detector should work at the right level of abstraction
  // It should handle string arrays (command line args level)
  // Not lower level (byte arrays) or higher level (parsed config objects)
  
  // Correct abstraction - string arrays
  const correctLevel1 = ConfigPrefixDetector.detect(["--config=test"]);
  assertEquals(correctLevel1, "test");
  
  const correctLevel2 = ConfigPrefixDetector.detect([]);
  assertEquals(correctLevel2, null);
  
  // Should gracefully handle wrong abstraction levels
  const wrongLevel1 = ConfigPrefixDetector.detect("--config=test" as any);
  assertEquals(wrongLevel1, null);
  
  const wrongLevel2 = ConfigPrefixDetector.detect({ config: "test" } as any);
  assertEquals(wrongLevel2, null);
});

Deno.test("2_structure: cohesive functionality", () => {
  logger.debug("Testing functional cohesion");
  
  // All supported formats should be detected by the same method
  // This demonstrates high cohesion - related functionality stays together
  
  const formats = [
    { args: ["--config=value"], format: "long equals" },
    { args: ["-c=value"], format: "short equals" },
    { args: ["--config", "value"], format: "long space" },
    { args: ["-c", "value"], format: "short space" },
  ];
  
  for (const { args, format } of formats) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, "value", 
      `Failed to detect ${format} format`);
  }
});

Deno.test("2_structure: clear separation from configuration loading", () => {
  logger.debug("Testing separation of concerns");
  
  // ConfigPrefixDetector should ONLY detect the prefix
  // It should NOT attempt to:
  // 1. Validate if the config file exists
  // 2. Load the configuration
  // 3. Parse configuration content
  
  // Test that it returns values without validation
  const nonExistentConfig = ConfigPrefixDetector.detect(["--config=/definitely/not/real/path.yml"]);
  assertEquals(nonExistentConfig, "/definitely/not/real/path.yml");
  
  const invalidName = ConfigPrefixDetector.detect(["--config=|||invalid|||"]);
  assertEquals(invalidName, "|||invalid|||");
  
  const emptyName = ConfigPrefixDetector.detect(["--config="]);
  assertEquals(emptyName, "");
});

Deno.test("2_structure: consistent null handling pattern", () => {
  logger.debug("Testing null handling consistency");
  
  // All "not found" cases should return null consistently
  const notFoundCases = [
    { args: [], desc: "empty array" },
    { args: ["--help"], desc: "no config flag" },
    { args: ["--config"], desc: "config without value" },
    { args: ["-c"], desc: "short form without value" },
    { args: ["--config", "--other"], desc: "config followed by flag" },
    { args: null as any, desc: "null input" },
    { args: undefined as any, desc: "undefined input" },
  ];
  
  for (const { args, desc } of notFoundCases) {
    const result = ConfigPrefixDetector.detect(args);
    assertEquals(result, null, 
      `Should return null for ${desc}`);
  }
});

Deno.test("2_structure: appropriate error handling strategy", () => {
  logger.debug("Testing error handling approach");
  
  // ConfigPrefixDetector uses null return instead of exceptions
  // This is appropriate for its use case as an early-stage detector
  
  // Should never throw, even with bad inputs
  const badInputs = [
    null,
    undefined,
    123,
    "string",
    {},
    { length: 0 },
    [null, undefined, false],
    [[["nested"]]],
  ];
  
  for (const badInput of badInputs) {
    // Should not throw
    const result = ConfigPrefixDetector.detect(badInput as any);
    // Should return null for all invalid inputs
    assertEquals(result, null);
  }
});

Deno.test("2_structure: minimalist API surface", () => {
  logger.debug("Testing API minimalism");
  
  // The class should expose minimal API surface
  // Only what's necessary for its single responsibility
  
  // Should not expose internal helpers or utilities
  const classKeys = Object.keys(ConfigPrefixDetector);
  assertEquals(classKeys.length, 0); // No enumerable properties
  
  // Should not have instance methods (utility class)
  const proto = ConfigPrefixDetector.prototype;
  const protoMethods = Object.getOwnPropertyNames(proto)
    .filter(name => name !== "constructor");
  assertEquals(protoMethods.length, 0);
  
  // Should only have the detect static method
  assertEquals(typeof ConfigPrefixDetector.detect, "function");
  assertEquals(typeof (ConfigPrefixDetector as any).parse, "undefined");
  assertEquals(typeof (ConfigPrefixDetector as any).validate, "undefined");
  assertEquals(typeof (ConfigPrefixDetector as any).load, "undefined");
});

Deno.test("2_structure: follows utility class pattern", () => {
  logger.debug("Testing utility class pattern compliance");
  
  // Utility classes should:
  // 1. Have only static methods
  // 2. Have private constructor
  // 3. Not maintain state
  // 4. Provide pure functions
  
  // Verify constructor is marked private in TypeScript
  // Note: At runtime, JavaScript allows instantiation, but TypeScript prevents it
  // This is a compile-time constraint, not a runtime constraint
  
  // The important thing is that the class follows utility pattern:
  // - Only static methods
  // - No instance state
  // - Pure functions
  
  // Verify only static methods exist (no instance methods beyond constructor)
  const instanceMethods = Object.getOwnPropertyNames(ConfigPrefixDetector.prototype)
    .filter(name => name !== "constructor");
  assertEquals(instanceMethods.length, 0);
  
  // Verify pure function behavior (same input = same output)
  const args = ["--config=test"];
  const result1 = ConfigPrefixDetector.detect(args);
  const result2 = ConfigPrefixDetector.detect(args);
  assertEquals(result1, result2);
});

Deno.test("2_structure: clear input/output contract", () => {
  logger.debug("Testing I/O contract clarity");
  
  // Input: string[] (command line arguments)
  // Output: string | null (config name or null if not found)
  
  // Valid inputs produce string or null
  assertEquals(typeof ConfigPrefixDetector.detect(["--config=test"]), "string");
  assertEquals(ConfigPrefixDetector.detect([]), null);
  
  // Invalid inputs produce null (defensive programming)
  assertEquals(ConfigPrefixDetector.detect(null as any), null);
  assertEquals(ConfigPrefixDetector.detect("invalid" as any), null);
  
  // The contract is simple and predictable
  const result = ConfigPrefixDetector.detect(["--config=example"]);
  if (result !== null) {
    // If not null, it's always a string
    assertEquals(typeof result, "string");
    assertEquals(result, "example");
  }
});