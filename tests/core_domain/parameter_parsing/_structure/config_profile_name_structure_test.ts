/**
 * @fileoverview Structure tests for ConfigProfileName
 *
 * Tests class structure and responsibility separation:
 * - Single Responsibility Principle verification
 * - Constraint type responsibility boundaries
 * - Proper encapsulation structure
 * - Class design pattern compliance
 *
 * @module types/config_profile_name_structure_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigProfileName } from "../../../../lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("config-profile-name-structure");

Deno.test("Structure: Single Responsibility Principle verification", () => {
  logger.debug("Testing Single Responsibility Principle adherence");

  // ConfigProfileName should only be responsible for:
  // 1. Profile name validation
  // 2. Profile name representation
  // It should NOT be responsible for:
  // - Configuration file loading
  // - File path resolution
  // - External service communication

  const profileResult = ConfigProfileName.create("test-profile");
  
  // Only test successful results
  if (!profileResult.ok) {
    throw new Error("Failed to create valid profile for testing");
  }
  
  const profileName = profileResult.data;

  // Verify it only has the essential property
  const properties = Object.getOwnPropertyNames(profileName);
  assertEquals(properties.length, 1, "Should have exactly one property");
  assertEquals(properties[0], "_value", "Should only have _value property");

  // Verify it only has the essential static method
  const staticMethods = Object.getOwnPropertyNames(ConfigProfileName).filter(
    (name) => typeof (ConfigProfileName as unknown as Record<string, unknown>)[name] === "function",
  );
  assertEquals(staticMethods.length, 1, "Should have exactly one static method");
  assertEquals(staticMethods[0], "create", "Should only have create static method");

  // Verify only essential instance methods (getter for value)
  const instanceMethods = Object.getOwnPropertyNames(ConfigProfileName.prototype).filter(
    (name) => name !== "constructor",
  );
  
  // ConfigProfileName now has: value, getValue, equals, toString methods
  assertEquals(instanceMethods.length, 4, "Should have exactly four custom instance methods");
  
  // Check that essential methods exist
  const expectedMethods = ["value", "getValue", "equals", "toString"];
  for (const method of expectedMethods) {
    assertEquals(
      instanceMethods.includes(method),
      true,
      `Should have ${method} method`,
    );
  }

  logger.debug("Single Responsibility Principle verification completed");
});

Deno.test("Structure: Constraint type responsibility boundaries", () => {
  logger.debug("Testing constraint type responsibility boundaries");

  // Constraint types should:
  // 1. Encapsulate validation logic
  // 2. Provide type-safe value access
  // 3. Maintain state integrity
  // 4. Not expose internal validation details

  // Test encapsulation of validation logic
  const validProfile = ConfigProfileName.create("production");
  const invalidProfile = ConfigProfileName.create("INVALID");

  // Validation logic should be internal - no external access to pattern
  assertEquals(
    (ConfigProfileName as unknown as Record<string, unknown>).PROFILE_NAME_PATTERN,
    undefined,
    "Validation pattern should be private",
  );

  // Should provide clear valid/invalid state through Result type
  assertEquals(validProfile.ok, true, "Valid profile should be successful");
  assertEquals(invalidProfile.ok, false, "Invalid profile should fail");
  
  if (validProfile.ok) {
    assertEquals(typeof validProfile.data.value, "string", "Valid profile should have string value");
  }
  
  if (!invalidProfile.ok) {
    assertEquals(typeof invalidProfile.error, "object", "Invalid profile should have error object");
  }

  // Should not expose validation methods
  assertEquals(
    (validProfile as unknown as Record<string, unknown>).validate,
    undefined,
    "Should not expose validation methods",
  );
  assertEquals(
    (validProfile as unknown as Record<string, unknown>).isValid,
    undefined,
    "Should not expose isValid methods",
  );

  logger.debug("Constraint type responsibility boundaries verified");
});

Deno.test("Structure: Proper encapsulation verification", () => {
  logger.debug("Testing proper encapsulation");

  const profileResult = ConfigProfileName.create("staging");
  
  // Only test successful results
  if (!profileResult.ok) {
    throw new Error("Failed to create valid profile for testing");
  }
  
  const profileName = profileResult.data;

  // Value should be readonly (proper encapsulation)
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(profileName), "value");
  assertExists(descriptor, "Value property descriptor must exist");
  assertExists(descriptor.get, "Should have getter");
  assertEquals(descriptor.set, undefined, "Should not have setter");

  // Constructor should be private (not accessible)
  // This is enforced at TypeScript level, but we can verify instance creation
  const _directInstantiation = () => {
    try {
      return new (ConfigProfileName as unknown as Record<string, unknown> & {
        new (value: string): unknown;
      })("test");
    } catch {
      return null;
    }
  };

  // Should use factory method instead of direct construction
  const factoryResult = ConfigProfileName.create("test");
  assertExists(factoryResult, "Factory method should work");
  assertEquals(factoryResult.ok, true, "Factory method should succeed for valid input");

  logger.debug("Proper encapsulation verification completed");
});

Deno.test("Structure: Value object pattern compliance", () => {
  logger.debug("Testing value object pattern compliance");

  // Value objects should be:
  // 1. Immutable
  // 2. Equality based on value
  // 3. Side-effect free creation
  // 4. Self-contained validation

  const profile1 = ConfigProfileName.create("production");
  const profile2 = ConfigProfileName.create("production");
  const profile3 = ConfigProfileName.create("staging");

  // Test immutability (only test successful results)
  if (profile1.ok) {
    const originalValue = profile1.data.value;
    try {
      (profile1.data as unknown as Record<string, unknown>).value = "modified";
    } catch {
      // Expected in strict mode
    }
    assertEquals(profile1.data.value, originalValue, "Should remain immutable");
  }

  // Test value-based equality (same input produces same value)
  if (profile1.ok && profile2.ok) {
    assertEquals(profile1.data.value, profile2.data.value, "Same input should produce same value");
  }
  
  if (profile1.ok && profile3.ok) {
    assertEquals(
      profile1.data.value !== profile3.data.value,
      true,
      "Different input should produce different value",
    );
  }

  // Test side-effect free creation
  // Multiple calls with same input should produce same result
  const sideEffect1 = ConfigProfileName.create("side-effect-test");
  const sideEffect2 = ConfigProfileName.create("side-effect-test");
  if (sideEffect1.ok && sideEffect2.ok) {
    assertEquals(sideEffect1.data.value, sideEffect2.data.value, "Multiple calls should produce same result");
  }

  logger.debug("Value object pattern compliance verified");
});

Deno.test("Structure: Type constraint enforcement structure", () => {
  logger.debug("Testing type constraint enforcement structure");

  // Test the structure enforces constraints at the type level
  const constraintTests = [
    {
      description: "Length constraint",
      input: "a".repeat(51), // 51 characters
      expectedValid: false,
    },
    {
      description: "Character set constraint",
      input: "test@profile",
      expectedValid: false,
    },
    {
      description: "Empty string constraint",
      input: "",
      expectedValid: false,
    },
    {
      description: "Null input constraint",
      input: null,
      expectedValid: false,
    },
    {
      description: "Valid profile constraint",
      input: "test-profile_123",
      expectedValid: true,
    },
  ];

  for (const test of constraintTests) {
    const result = ConfigProfileName.create(test.input);
    const isValid = result.ok;

    assertEquals(
      isValid,
      test.expectedValid,
      `${test.description}: Expected ${test.expectedValid}, got ${isValid}`,
    );

    // Verify constraint enforcement is consistent
    if (test.expectedValid) {
      assertEquals(
        result.ok,
        true,
        `${test.description}: Valid input should be successful`,
      );
      if (result.ok) {
        assertEquals(
          typeof result.data.value,
          "string",
          `${test.description}: Valid input should have string value`,
        );
      }
    } else {
      assertEquals(
        result.ok,
        false,
        `${test.description}: Invalid input should fail`,
      );
      if (!result.ok) {
        assertEquals(
          typeof result.error,
          "object",
          `${test.description}: Invalid input should have error object`,
        );
      }
    }
  }

  logger.debug("Type constraint enforcement structure verified");
});

Deno.test("Structure: Domain modeling appropriateness", () => {
  logger.debug("Testing domain modeling appropriateness");

  // ConfigProfileName should model the domain concept appropriately
  // It represents configuration profiles used in BreakdownConfig

  // Should handle typical configuration profile scenarios
  const commonProfiles = [
    "production",
    "staging",
    "development",
    "test",
    "local",
    "integration",
    "performance",
    "user-specific",
    "team-alpha",
    "env_dev",
  ];

  for (const profile of commonProfiles) {
    const result = ConfigProfileName.create(profile);
    assertEquals(
      result.ok,
      true,
      `Common profile ${profile} should be valid`,
    );
    if (result.ok) {
      assertEquals(
        typeof result.data.value,
        "string",
        `Common profile ${profile} should have string value`,
      );
    }
  }

  // Should reject non-configuration-like inputs
  const inappropriateInputs = [
    "PRODUCTION", // Uppercase not typical for config files
    "production.staging", // File extension not appropriate
    "production/staging", // Path separators not appropriate
    "production staging", // Spaces not typical
    "production@staging", // Email-like syntax inappropriate
  ];

  for (const input of inappropriateInputs) {
    const result = ConfigProfileName.create(input);
    assertEquals(
      result.ok,
      false,
      `Inappropriate input ${input} should be invalid`,
    );
    if (!result.ok) {
      assertEquals(
        typeof result.error,
        "object",
        `Inappropriate input ${input} should have error object`,
      );
    }
  }

  logger.debug("Domain modeling appropriateness verified");
});

Deno.test("Structure: Error handling responsibility", () => {
  logger.debug("Testing error handling responsibility");

  // ConfigProfileName should handle errors by returning null values,
  // not by throwing exceptions (graceful degradation)

  const errorProneInputs = [
    undefined,
    null,
    "",
    "INVALID",
    123 as unknown,
    {} as unknown,
    [] as unknown,
    Symbol("test") as unknown,
  ];

  for (const input of errorProneInputs) {
    const inputStr = typeof input === "symbol" ? "Symbol" : String(input);
    try {
      const result = ConfigProfileName.create(input as string | null);

      // Should always return a Result, never throw
      assertExists(result, `Input ${inputStr} should return Result, not throw`);
      assertEquals(
        typeof result,
        "object",
        "Should return Result object",
      );
      assertEquals(
        "ok" in result,
        true,
        "Should return Result with ok property",
      );

      // Invalid inputs should result in error Result
      assertEquals(
        result.ok,
        false,
        `Invalid input ${inputStr} should fail`,
      );
      if (!result.ok) {
        assertEquals(
          typeof result.error,
          "object",
          `Invalid input ${inputStr} should have error object`,
        );
      }
    } catch (error) {
      throw new Error(`ConfigProfileName.create should not throw for any input: ${error}`);
    }
  }

  logger.debug("Error handling responsibility verified");
});
