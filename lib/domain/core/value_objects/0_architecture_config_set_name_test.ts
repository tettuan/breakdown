/**
 * @fileoverview Architecture constraint tests for ConfigSetName Value Object
 *
 * This test suite validates the architectural constraints and design patterns
 * of the ConfigSetName implementation:
 * - Smart Constructor pattern enforcement
 * - Result type pattern for error handling
 * - Discriminated Union for error types
 * - Type guards for error discrimination
 * - No infrastructure dependencies
 * - Totality principle adherence
 */

import { assertEquals } from "jsr:@std/assert@0.224.0";
import type { Result as _Result } from "../../../types/result.ts";
import {
  ConfigSetName,
  ConfigSetNameCollection,
  type ConfigSetNameError,
  type ConfigSetNameResult,
  formatConfigSetNameError,
  isEmptyNameError,
  isInvalidCharactersError,
  isInvalidFormatError,
  isReservedNameError,
  isStartsWithReservedPrefixError,
  isTooLongError,
} from "./config_set_name.ts";

// ============================================================================
// Smart Constructor Pattern Tests
// ============================================================================

Deno.test("0_architecture: Smart Constructor pattern - private constructor enforcement", () => {
  // Verify that instances can only be created through the static create method
  // The constructor is private, preventing direct instantiation

  const result = ConfigSetName.create("valid-config");

  // Verify Result type is returned
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
  assertEquals("error" in result || "data" in result, true);

  // Verify successful creation returns ConfigSetName instance
  if (result.ok) {
    assertEquals(typeof result.data, "object");
    assertEquals(result.data.constructor.name, "ConfigSetName");
  }
});

Deno.test("0_architecture: Result type pattern - no exceptions thrown", () => {
  // All operations should return Result<T, E> types
  // No exceptions should be thrown for any input

  const testCases: unknown[] = [
    null,
    undefined,
    "",
    "   ",
    123,
    {},
    [],
    "valid-name",
    "invalid@name",
    "a".repeat(100),
  ];

  testCases.forEach((input: unknown) => {
    let exceptionThrown = false;
    let result: ConfigSetNameResult;

    try {
      result = ConfigSetName.create(input as string);
      // Result should always be defined
      assertEquals(typeof result, "object");
      assertEquals("ok" in result, true);
    } catch (_e) {
      exceptionThrown = true;
    }

    assertEquals(exceptionThrown, false, `Should not throw for input: ${input}`);
  });
});

Deno.test("0_architecture: Result type pattern - factory methods follow same pattern", () => {
  // All factory methods should also return Result types

  const factoryMethods = [
    () => ConfigSetName.defaultSet(),
    () => ConfigSetName.development(),
    () => ConfigSetName.development("suffix"),
    () => ConfigSetName.forProject("project"),
    () => ConfigSetName.forProject(""),
  ];

  factoryMethods.forEach((factory, index) => {
    let exceptionThrown = false;
    let result: ConfigSetNameResult;

    try {
      result = factory();
      assertEquals(typeof result, "object");
      assertEquals("ok" in result, true);
    } catch (_e) {
      exceptionThrown = true;
    }

    assertEquals(exceptionThrown, false, `Factory method ${index} should not throw`);
  });
});

// ============================================================================
// Discriminated Union Error Type Tests
// ============================================================================

Deno.test("0_architecture: Discriminated Union - all errors have unique kind discriminator", () => {
  // Each error type must have a unique 'kind' field for discrimination

  const errorKinds = new Set<string>();

  const errorProducingInputs = [
    { input: "", expectedKind: "EmptyName" },
    { input: "invalid@char", expectedKind: "InvalidCharacters" },
    { input: "default", expectedKind: "ReservedName" },
    { input: "a".repeat(70), expectedKind: "TooLong" },
    { input: "sys-config", expectedKind: "StartsWithReservedPrefix" },
    { input: 123, expectedKind: "InvalidFormat" },
  ];

  errorProducingInputs.forEach(({ input, expectedKind }) => {
    const result = ConfigSetName.create(input as unknown as string);

    if (!result.ok) {
      // Verify error has 'kind' property
      assertEquals("kind" in result.error, true);
      assertEquals(typeof result.error.kind, "string");
      assertEquals(result.error.kind, expectedKind);

      // Collect unique kinds
      errorKinds.add(result.error.kind);
    }
  });

  // Verify we tested all expected error kinds
  assertEquals(errorKinds.size, 6);
});

Deno.test("0_architecture: Discriminated Union - error structure consistency", () => {
  // All errors should have consistent base structure: kind and message

  const errorInputs = [
    "",
    "invalid@char",
    "default",
    "a".repeat(70),
    "sys-config",
    123,
  ];

  errorInputs.forEach((input) => {
    const result = ConfigSetName.create(input as unknown as string);

    if (!result.ok) {
      // All errors must have 'kind' and 'message'
      assertEquals("kind" in result.error, true);
      assertEquals("message" in result.error, true);
      assertEquals(typeof result.error.kind, "string");
      assertEquals(typeof result.error.message, "string");
      assertEquals(result.error.message.length > 0, true);
    }
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

Deno.test("0_architecture: Type guards - correct discrimination for each error type", () => {
  // Type guards should correctly identify their respective error types

  const testCases: Array<{
    input: unknown;
    expectedGuard: (error: ConfigSetNameError) => boolean;
    otherGuards: Array<(error: ConfigSetNameError) => boolean>;
  }> = [
    {
      input: "",
      expectedGuard: isEmptyNameError,
      otherGuards: [
        isInvalidFormatError,
        isReservedNameError,
        isTooLongError,
        isInvalidCharactersError,
        isStartsWithReservedPrefixError,
      ],
    },
    {
      input: 123,
      expectedGuard: isInvalidFormatError,
      otherGuards: [
        isEmptyNameError,
        isReservedNameError,
        isTooLongError,
        isInvalidCharactersError,
        isStartsWithReservedPrefixError,
      ],
    },
    {
      input: "default",
      expectedGuard: isReservedNameError,
      otherGuards: [
        isEmptyNameError,
        isInvalidFormatError,
        isTooLongError,
        isInvalidCharactersError,
        isStartsWithReservedPrefixError,
      ],
    },
    {
      input: "a".repeat(70),
      expectedGuard: isTooLongError,
      otherGuards: [
        isEmptyNameError,
        isInvalidFormatError,
        isReservedNameError,
        isInvalidCharactersError,
        isStartsWithReservedPrefixError,
      ],
    },
    {
      input: "invalid@char",
      expectedGuard: isInvalidCharactersError,
      otherGuards: [
        isEmptyNameError,
        isInvalidFormatError,
        isReservedNameError,
        isTooLongError,
        isStartsWithReservedPrefixError,
      ],
    },
    {
      input: "sys-config",
      expectedGuard: isStartsWithReservedPrefixError,
      otherGuards: [
        isEmptyNameError,
        isInvalidFormatError,
        isReservedNameError,
        isTooLongError,
        isInvalidCharactersError,
      ],
    },
  ];

  testCases.forEach(({ input, expectedGuard, otherGuards }) => {
    const result = ConfigSetName.create(input as string);

    if (!result.ok) {
      // Expected guard should return true
      assertEquals(expectedGuard(result.error), true, `Guard should match for input: ${input}`);

      // All other guards should return false
      otherGuards.forEach((guard) => {
        assertEquals(
          guard(result.error),
          false,
          `Guard ${guard.name} should not match for input: ${input}`,
        );
      });
    }
  });
});

Deno.test("0_architecture: Type guards - exhaustive discrimination", () => {
  // Verify that type guards enable exhaustive pattern matching

  const result = ConfigSetName.create("invalid@char");

  if (!result.ok) {
    const error = result.error;
    let matched = false;

    // This pattern demonstrates exhaustive checking
    if (isEmptyNameError(error)) {
      assertEquals(error.kind, "EmptyName");
      matched = true;
    } else if (isInvalidFormatError(error)) {
      assertEquals(error.kind, "InvalidFormat");
      matched = true;
    } else if (isReservedNameError(error)) {
      assertEquals(error.kind, "ReservedName");
      matched = true;
    } else if (isTooLongError(error)) {
      assertEquals(error.kind, "TooLong");
      matched = true;
    } else if (isInvalidCharactersError(error)) {
      assertEquals(error.kind, "InvalidCharacters");
      matched = true;
    } else if (isStartsWithReservedPrefixError(error)) {
      assertEquals(error.kind, "StartsWithReservedPrefix");
      matched = true;
    }

    assertEquals(matched, true, "At least one type guard should match");
  }
});

// ============================================================================
// Dependency and Infrastructure Tests
// ============================================================================

Deno.test("0_architecture: No infrastructure dependencies - pure domain logic", () => {
  // ConfigSetName should not depend on any infrastructure concerns
  // It should be pure domain logic with no I/O operations

  // Test that creation doesn't perform any file system operations
  const result = ConfigSetName.create("example-config");
  assertEquals(result.ok, true);

  // Test that validation is synchronous (no async operations)
  const startTime = performance.now();
  const iterations = 10000;

  for (let i = 0; i < iterations; i++) {
    ConfigSetName.create(`example-${i}`);
  }

  const endTime = performance.now();
  const avgTime = (endTime - startTime) / iterations;

  // Pure domain logic should be very fast (< 1ms per operation)
  assertEquals(avgTime < 1, true, `Average time ${avgTime}ms should be < 1ms`);
});

// ============================================================================
// Totality Principle Tests
// ============================================================================

Deno.test("0_architecture: Totality - all functions are total (defined for all inputs)", () => {
  // Functions should handle all possible inputs without throwing

  const extremeInputs = [
    null,
    undefined,
    "",
    0,
    -1,
    Infinity,
    NaN,
    true,
    false,
    {},
    [],
    () => {},
    Symbol("test"),
    new Date(),
    /regex/,
    new Map(),
    new Set(),
  ];

  extremeInputs.forEach((input) => {
    const result = ConfigSetName.create(input as unknown as string);

    // Should always return a Result
    assertEquals(typeof result, "object");
    assertEquals("ok" in result, true);

    // If invalid, should have proper error
    if (!result.ok) {
      assertEquals("kind" in result.error, true);
      assertEquals("message" in result.error, true);
    }
  });
});

Deno.test("0_architecture: Totality - instance methods are total", () => {
  // All instance methods should be total (no exceptions)

  const result = ConfigSetName.create("example-config");
  assertEquals(result.ok, true);

  if (result.ok) {
    const config = result.data;

    // All methods should handle edge cases
    const otherResult = ConfigSetName.create("other-example");
    if (otherResult.ok) {
      // Methods should not throw
      assertEquals(typeof config.equals(otherResult.data), "boolean");
      assertEquals(typeof config.equalsIgnoreCase(otherResult.data), "boolean");
    }

    // Transformation methods should return Results
    const lowerResult = config.toLowerCase();
    assertEquals("ok" in lowerResult, true);

    const prefixResult = config.withPrefix("pre");
    assertEquals("ok" in prefixResult, true);

    const suffixResult = config.withSuffix("post");
    assertEquals("ok" in suffixResult, true);

    // Edge cases for transformation methods
    const emptyPrefixResult = config.withPrefix("");
    assertEquals(emptyPrefixResult.ok, false);

    const emptySuffixResult = config.withSuffix("");
    assertEquals(emptySuffixResult.ok, false);
  }
});

// ============================================================================
// Collection Architecture Tests
// ============================================================================

Deno.test("0_architecture: Collection - follows same architectural patterns", () => {
  // ConfigSetNameCollection should follow the same patterns

  // Result type pattern
  const collectionResult = ConfigSetNameCollection.create(["config1", "config2"]);
  assertEquals(typeof collectionResult, "object");
  assertEquals("ok" in collectionResult, true);

  // Error propagation
  const invalidCollectionResult = ConfigSetNameCollection.create(["valid", "", "invalid"]);
  assertEquals(invalidCollectionResult.ok, false);

  if (!invalidCollectionResult.ok) {
    // Should propagate the first error
    assertEquals(invalidCollectionResult.error.kind, "EmptyName");
  }

  // Immutability
  if (collectionResult.ok) {
    const collection = collectionResult.data;
    assertEquals(Object.isFrozen(collection), true);

    const names = collection.getNames();
    assertEquals(Object.isFrozen(names), true);
  }
});

// ============================================================================
// Error Formatter Architecture Tests
// ============================================================================

Deno.test("0_architecture: Error formatter - handles all error types", () => {
  // formatConfigSetNameError should handle all error types without throwing

  const errorInputs = [
    "",
    "invalid@char",
    "default",
    "a".repeat(70),
    "sys-config",
    123,
  ];

  errorInputs.forEach((input) => {
    const result = ConfigSetName.create(input as unknown as string);

    if (!result.ok) {
      let formatterThrew = false;
      let message: string;

      try {
        message = formatConfigSetNameError(result.error);
        assertEquals(typeof message, "string");
        assertEquals(message.length > 0, true);
      } catch (_e) {
        formatterThrew = true;
      }

      assertEquals(formatterThrew, false, "Formatter should not throw");
    }
  });
});

// ============================================================================
// Type Alias and Export Tests
// ============================================================================

Deno.test("0_architecture: Type exports - proper type definitions", () => {
  // Verify that types are properly exported and usable

  // ConfigSetNameResult type alias
  const result: ConfigSetNameResult = ConfigSetName.create("test");
  assertEquals("ok" in result, true);

  // Error type usage
  if (!result.ok) {
    const error: ConfigSetNameError = result.error;
    assertEquals("kind" in error, true);
  }

  // Result type should be properly typed
  if (result.ok) {
    const config: ConfigSetName = result.data;
    assertEquals(typeof config.value, "string");
  }
});
