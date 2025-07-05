/**
 * @fileoverview Architecture tests for ConfigProfileName
 *
 * Tests architectural constraints and dependencies:
 * - Smart Constructor pattern enforcement
 * - Dependency structure verification
 * - Interface consistency validation
 * - Type safety architecture verification
 *
 * @module types/config_profile_name_architecture_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigProfileName } from "../../../../lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("config-profile-name-architecture");

Deno.test("Architecture: Smart Constructor pattern enforcement", () => {
  logger.debug("Testing Smart Constructor pattern enforcement");

  // Verify constructor is private (cannot be called directly)
  // TypeScript compile-time check: new ConfigProfileName("test") should fail

  // Verify only static create method is available for instantiation
  assertExists(ConfigProfileName.create, "Static create method must exist");
  assertEquals(typeof ConfigProfileName.create, "function", "create must be a function");

  // Verify create method returns ConfigProfileName instance
  const instance = ConfigProfileName.create("test");
  assertExists(instance, "create method must return an instance");
  assertEquals(
    instance.constructor.name,
    "ConfigProfileName",
    "Must return ConfigProfileName instance",
  );

  logger.debug("Smart Constructor pattern verification completed");
});

Deno.test("Architecture: Totality principle compliance", () => {
  logger.debug("Testing Totality principle compliance");

  // Verify all possible inputs result in valid ConfigProfileName instances
  const testInputs = [
    "valid",
    "",
    null,
    "INVALID",
    "123",
    "a".repeat(51), // Too long
    "test-profile",
    "test_profile",
    undefined as unknown,
    123 as unknown,
    {} as unknown,
  ];

  for (const input of testInputs) {
    const result = ConfigProfileName.create(input as string | null);

    // Every result must be a ConfigProfileName instance
    assertExists(result, `Input ${input} must return an instance`);
    assertEquals(
      result.constructor.name,
      "ConfigProfileName",
      "Must always return ConfigProfileName",
    );

    // Value must be either string or null (never undefined)
    assertEquals(
      typeof result.value === "string" || result.value === null,
      true,
      `Value must be string or null for input: ${input}`,
    );
  }

  logger.debug("Totality principle compliance verified");
});

Deno.test("Architecture: Dependency structure verification", () => {
  logger.debug("Testing dependency structure");

  // Verify ConfigProfileName has no runtime dependencies on other domain types
  // This ensures clean architecture separation
  const instance = ConfigProfileName.create("test");

  // Should only have _value property (private field)
  const properties = Object.getOwnPropertyNames(instance);
  assertEquals(properties.length, 1, "Should only have _value property");
  assertEquals(properties[0], "_value", "Should only have _value property");

  // Value getter should be readonly (no setter)
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), "value");
  assertExists(descriptor, "Value property descriptor must exist");
  if (descriptor) {
    assertExists(descriptor.get, "Should have getter");
    assertEquals(descriptor.set, undefined, "Should not have setter");
  }

  logger.debug("Dependency structure verification completed");
});

Deno.test("Architecture: Type safety boundaries", () => {
  logger.debug("Testing type safety boundaries");

  // Verify pattern-based validation boundaries
  const validPatterns = [
    "a",
    "test",
    "test-profile",
    "test_profile",
    "test123",
    "a".repeat(50), // Max length
  ];

  const invalidPatterns = [
    "",
    "Test", // Uppercase
    "test@profile", // Invalid character
    "test.profile", // Invalid character
    "test profile", // Space
    "a".repeat(51), // Too long
  ];

  // All valid patterns should create instances with non-null values
  for (const pattern of validPatterns) {
    const result = ConfigProfileName.create(pattern);
    assertEquals(
      typeof result.value,
      "string",
      `Valid pattern ${pattern} should have string value`,
    );
    assertEquals(result.value, pattern, `Valid pattern ${pattern} should preserve value`);
  }

  // All invalid patterns should create instances with null values
  for (const pattern of invalidPatterns) {
    const result = ConfigProfileName.create(pattern);
    assertEquals(result.value, null, `Invalid pattern ${pattern} should have null value`);
  }

  logger.debug("Type safety boundaries verification completed");
});

Deno.test("Architecture: Interface consistency validation", () => {
  logger.debug("Testing interface consistency");

  // Verify consistent behavior across all creation scenarios
  const scenarios = [
    { input: "production", expectValid: true },
    { input: "staging", expectValid: true },
    { input: "development", expectValid: true },
    { input: "test-env", expectValid: true },
    { input: "test_env", expectValid: true },
    { input: "", expectValid: false },
    { input: null, expectValid: false },
    { input: "PRODUCTION", expectValid: false },
    { input: "test.env", expectValid: false },
  ];

  for (const scenario of scenarios) {
    const result = ConfigProfileName.create(scenario.input);

    // Consistent interface structure
    assertExists(result, "Must return instance");
    assertEquals(
      typeof result.value,
      scenario.expectValid ? "string" : "object",
      `Scenario ${scenario.input}: value type consistency`,
    );

    if (scenario.expectValid) {
      assertEquals(result.value, scenario.input, "Valid input should preserve value");
    } else {
      assertEquals(result.value, null, "Invalid input should result in null value");
    }
  }

  logger.debug("Interface consistency validation completed");
});

Deno.test("Architecture: Immutability enforcement", () => {
  logger.debug("Testing immutability enforcement");

  const instance = ConfigProfileName.create("test-profile");
  const originalValue = instance.value;

  // Verify value property is readonly
  try {
    // This should fail in strict mode or be ignored
    (instance as unknown as { value: string }).value = "modified";
  } catch {
    // Expected to fail
  }

  // Value should remain unchanged
  assertEquals(instance.value, originalValue, "Value should be immutable");

  // Verify no additional properties can be added
  try {
    (instance as unknown as { newProperty: string }).newProperty = "test";
  } catch {
    // Expected to fail in strict mode
  }

  // Should not have new properties
  const properties = Object.getOwnPropertyNames(instance);
  assertEquals(properties.length, 1, "Should not allow new properties");

  logger.debug("Immutability enforcement verification completed");
});

Deno.test("Architecture: Validation pattern isolation", () => {
  logger.debug("Testing validation pattern isolation");

  // Verify pattern validation is properly encapsulated
  // Pattern should not be accessible from outside
  assertEquals(
    (ConfigProfileName as unknown as { PROFILE_NAME_PATTERN: RegExp }).PROFILE_NAME_PATTERN,
    undefined,
    "Pattern should be private",
  );

  // Verify validation logic consistency
  const edgeCases = [
    { input: "a", expected: true },
    { input: "z", expected: true },
    { input: "0", expected: true },
    { input: "9", expected: true },
    { input: "-", expected: true },
    { input: "_", expected: true },
    { input: "A", expected: false },
    { input: "Z", expected: false },
    { input: "!", expected: false },
    { input: "@", expected: false },
    { input: " ", expected: false },
    { input: ".", expected: false },
  ];

  for (const testCase of edgeCases) {
    const result = ConfigProfileName.create(testCase.input);
    const isValid = result.value !== null;
    assertEquals(
      isValid,
      testCase.expected,
      `Character ${testCase.input} validation consistency`,
    );
  }

  logger.debug("Validation pattern isolation verification completed");
});
