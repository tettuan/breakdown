/**
 * @fileoverview Tests for ConfigSetName Value Object
 *
 * This test suite validates the ConfigSetName implementation following
 * the test strategy described in @docs/tests/testing.ja.md:
 * - 0_architecture tests for Smart Constructor pattern and DDD principles
 * - 1_behavior tests for domain logic validation and business rules
 * - 2_structure tests for immutability and value object semantics
 */

import { assertEquals, assertStrictEquals as _assertStrictEquals } from "jsr:@std/assert@0.224.0";
import {
  ConfigSetName,
  ConfigSetNameCollection,
  type ConfigSetNameError as _ConfigSetNameError,
  formatConfigSetNameError,
  isEmptyNameError,
  isInvalidCharactersError,
  isInvalidFormatError,
  isReservedNameError,
  isStartsWithReservedPrefixError as _isStartsWithReservedPrefixError,
  isTooLongError,
} from "./config_set_name.ts";

// ============================================================================
// 0_architecture: Smart Constructor Pattern and DDD Tests
// ============================================================================

Deno.test("0_architecture: Smart Constructor enforces private constructor", () => {
  // Constructor should be private - cannot instantiate directly
  // This validates the Smart Constructor pattern implementation

  const validResult = ConfigSetName.create("valid-name");
  assertEquals(validResult.ok, true);

  // The only way to create instances should be through the static create method
  // TypeScript compiler should prevent direct constructor access
  // We can verify that create method returns proper Result type
  assertEquals(typeof validResult, "object");
  assertEquals("ok" in validResult, true);
  if (validResult.ok) {
    assertEquals(typeof validResult.data, "object");
    assertEquals(validResult.data.constructor.name, "ConfigSetName");
  }
});

Deno.test("0_architecture: Result type pattern for error handling", () => {
  // All creation should return Result<T, E> - no exceptions thrown

  const invalidResult = ConfigSetName.create("");
  assertEquals(invalidResult.ok, false);

  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EmptyName");
  }

  const validResult = ConfigSetName.create("valid-name");
  assertEquals(validResult.ok, true);
});

Deno.test("0_architecture: Discriminated Union error types", () => {
  // Each error should have a unique 'kind' discriminator

  const errorCases = [
    { input: "", expectedKind: "EmptyName" },
    { input: "invalid/format", expectedKind: "InvalidCharacters" },
    { input: "default", expectedKind: "ReservedName" },
    { input: "a".repeat(70), expectedKind: "TooLong" },
    { input: "sys-prefix", expectedKind: "StartsWithReservedPrefix" },
  ] as const;

  errorCases.forEach(({ input, expectedKind }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);

    if (!result.ok) {
      assertEquals(result.error.kind, expectedKind);
    }
  });
});

Deno.test("0_architecture: Type guards for error discrimination", () => {
  // Type guards should correctly identify error types

  const emptyResult = ConfigSetName.create("");
  if (!emptyResult.ok) {
    assertEquals(isEmptyNameError(emptyResult.error), true);
    assertEquals(isInvalidFormatError(emptyResult.error), false);
  }

  const invalidResult = ConfigSetName.create("invalid@char");
  if (!invalidResult.ok) {
    assertEquals(isInvalidCharactersError(invalidResult.error), true);
    assertEquals(isEmptyNameError(invalidResult.error), false);
  }

  const reservedResult = ConfigSetName.create("default");
  if (!reservedResult.ok) {
    assertEquals(isReservedNameError(reservedResult.error), true);
    assertEquals(isTooLongError(reservedResult.error), false);
  }
});

// ============================================================================
// 1_behavior: Domain Logic Validation Tests
// ============================================================================

Deno.test("1_behavior: empty name validation", () => {
  const emptyTestCases = [
    { input: null as unknown as string, description: "null input" },
    { input: undefined as unknown as string, description: "undefined input" },
    { input: "", description: "empty string" },
    { input: "   ", description: "whitespace only" },
  ];

  emptyTestCases.forEach(({ input, description }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject ${description}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyName" as const);
    }
  });

  // Non-string inputs should produce InvalidFormat error
  const nonStringTestCases = [
    { input: 123 as unknown as string, description: "number input" },
    { input: {} as unknown as string, description: "object input" },
    { input: [] as unknown as string, description: "array input" },
  ];

  nonStringTestCases.forEach(({ input, description }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject ${description}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat" as const);
    }
  });
});

Deno.test("1_behavior: valid format - alphanumeric, hyphens, underscores", () => {
  const validNames = [
    "simple",
    "with-hyphens",
    "with_underscores",
    "Mixed-Case_123",
    "numbers123",
    "123numbers",
    "a",
    "a1",
    "complex-name_with-123_parts",
  ];

  validNames.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true, `Should accept valid name: ${name}`);

    if (result.ok) {
      assertEquals(result.data.value, name);
    }
  });
});

Deno.test("1_behavior: invalid characters rejection", () => {
  const invalidNames = [
    "with spaces",
    "with@symbols",
    "with!exclamation",
    "with.dots",
    "with/slashes",
    "with\\backslashes",
    "with$dollar",
    "with%percent",
    "with&ampersand",
    "with*asterisk",
    "with(parentheses)",
    "with[brackets]",
    "with{braces}",
    "with:colon",
    "with;semicolon",
    'with"quotes',
    "with'apostrophe",
    "with<greater>",
    "with=equals",
    "with+plus",
    "with?question",
    "with|pipe",
    "with~tilde",
    "with`backtick",
  ];

  invalidNames.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject invalid characters: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidCharacters");
      if (result.error.kind === "InvalidCharacters") {
        assertEquals(typeof result.error.invalidChars, "object");
        assertEquals(Array.isArray(result.error.invalidChars), true);
      }
    }
  });
});

Deno.test("1_behavior: length validation", () => {
  const validLengths = [
    "a",
    "ab",
    "a".repeat(64), // Maximum length
  ];

  const tooLong = "a".repeat(65);

  validLengths.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true, `Should accept length ${name.length}: ${name}`);
  });

  const longResult = ConfigSetName.create(tooLong);
  assertEquals(longResult.ok, false, "Should reject too long names");

  if (!longResult.ok) {
    assertEquals(longResult.error.kind, "TooLong");
    if (longResult.error.kind === "TooLong") {
      assertEquals(longResult.error.maxLength, 64);
      assertEquals(longResult.error.actualLength, 65);
    }
  }
});

Deno.test("1_behavior: reserved names rejection", () => {
  const reservedNames = [
    "default",
    "system",
    "global",
    "local",
    "temp",
    "tmp",
    "cache",
    "config",
    "configuration",
    "settings",
    "app",
    "application",
    "user",
    "profile",
    "env",
    "environment",
    "dev",
    "development",
    "prod",
    "production",
    "test",
    "testing",
    "stage",
    "staging",
    // Case insensitive
    "DEFAULT",
    "System",
    "GLOBAL",
    "Config",
    "APPLICATION",
  ];

  reservedNames.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject reserved name: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
      if (result.error.kind === "ReservedName") {
        assertEquals(typeof result.error.reserved, "object");
        assertEquals(Array.isArray(result.error.reserved), true);
      }
    }
  });
});

Deno.test("1_behavior: reserved prefix rejection", () => {
  const reservedPrefixes = [
    "sys-anything",
    "system-name",
    "app-config",
    "tmp-data",
    "temp-file",
    "test-name",
    // Case insensitive
    "SYS-name",
    "System-config",
    "APP-setting",
    "TMP-cache",
  ];

  reservedPrefixes.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject reserved prefix: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithReservedPrefix");
      if (result.error.kind === "StartsWithReservedPrefix") {
        assertEquals(typeof result.error.prefix, "string");
      }
    }
  });
});

Deno.test("1_behavior: whitespace trimming", () => {
  const testCases = [
    { input: " trimmed ", expected: "trimmed" },
    { input: "\tleading-tab", expected: "leading-tab" },
    { input: "trailing-space ", expected: "trailing-space" },
    { input: "\n\r mixed-whitespace \t\n", expected: "mixed-whitespace" },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, true, `Should trim and accept: "${input}"`);

    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });
});

// ============================================================================
// 1_behavior: Factory Methods Tests
// ============================================================================

Deno.test("1_behavior: factory methods - defaultSet", () => {
  const result = ConfigSetName.defaultSet();
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.value, "main");
  }
});

Deno.test("1_behavior: factory methods - development", () => {
  const withoutSuffix = ConfigSetName.development();
  assertEquals(withoutSuffix.ok, true);

  if (withoutSuffix.ok) {
    assertEquals(withoutSuffix.data.value, "development-main");
  }

  const withSuffix = ConfigSetName.development("api");
  assertEquals(withSuffix.ok, true);

  if (withSuffix.ok) {
    assertEquals(withSuffix.data.value, "dev-api");
  }
});

Deno.test("1_behavior: factory methods - forProject", () => {
  const validProject = ConfigSetName.forProject("MyProject");
  assertEquals(validProject.ok, true);

  if (validProject.ok) {
    assertEquals(validProject.data.value, "project-myproject");
  }

  const projectWithSpaces = ConfigSetName.forProject("My Project Name");
  assertEquals(projectWithSpaces.ok, true);

  if (projectWithSpaces.ok) {
    assertEquals(projectWithSpaces.data.value, "project-my-project-name");
  }

  const emptyProject = ConfigSetName.forProject("");
  assertEquals(emptyProject.ok, false);

  if (!emptyProject.ok) {
    assertEquals(emptyProject.error.kind, "EmptyName");
  }
});

// ============================================================================
// 2_structure: Immutability and Value Object Tests
// ============================================================================

Deno.test("2_structure: immutability of created instances", () => {
  const result = ConfigSetName.create("valid-config");
  if (!result.ok) {
    throw new Error(`Failed to create ConfigSetName: ${JSON.stringify(result.error)}`);
  }

  const config = result.data;

  // Object should be frozen (immutable)
  assertEquals(Object.isFrozen(config), true);

  // Should not be able to modify internal state
  const originalValue = config.value;
  try {
    (config as unknown as { _value: string })._value = "modified";
    // Internal value should remain unchanged due to immutability
    assertEquals(config.value, originalValue, "Internal value should not change");
  } catch (error) {
    // Expected in strict mode - TypeError should be thrown
    assertEquals(error instanceof TypeError, true);
  }
});

Deno.test("2_structure: value equality semantics", () => {
  const config1Result = ConfigSetName.create("same-name");
  const config2Result = ConfigSetName.create("same-name");
  const config3Result = ConfigSetName.create("different-name");

  assertEquals(config1Result.ok, true);
  assertEquals(config2Result.ok, true);
  assertEquals(config3Result.ok, true);

  if (config1Result.ok && config2Result.ok && config3Result.ok) {
    const config1 = config1Result.data;
    const config2 = config2Result.data;
    const config3 = config3Result.data;

    // Equal values should be equal
    assertEquals(config1.equals(config2), true);
    assertEquals(config2.equals(config1), true);

    // Different values should not be equal
    assertEquals(config1.equals(config3), false);
    assertEquals(config3.equals(config1), false);

    // Should equal itself
    assertEquals(config1.equals(config1), true);
  }
});

Deno.test("2_structure: case-sensitive and case-insensitive equality", () => {
  const lowerResult = ConfigSetName.create("lowercase");
  const upperResult = ConfigSetName.create("LOWERCASE");

  assertEquals(lowerResult.ok, true);
  assertEquals(upperResult.ok, true);

  if (lowerResult.ok && upperResult.ok) {
    const lower = lowerResult.data;
    const upper = upperResult.data;

    // Case-sensitive should be different
    assertEquals(lower.equals(upper), false);

    // Case-insensitive should be equal
    assertEquals(lower.equalsIgnoreCase(upper), true);
  }
});

Deno.test("2_structure: utility methods", () => {
  const result = ConfigSetName.create("Valid-Config_123");
  if (!result.ok) {
    throw new Error(`Failed to create ConfigSetName: ${JSON.stringify(result.error)}`);
  }

  const config = result.data;

  // Length
  assertEquals(config.getLength(), 16);

  // Case checks
  assertEquals(config.isLowerCase(), false);

  const lowerResult = ConfigSetName.create("lower-case");
  if (lowerResult.ok) {
    assertEquals(lowerResult.data.isLowerCase(), true);
  }

  // Naming convention checks
  const kebabResult = ConfigSetName.create("kebab-case-name");
  if (kebabResult.ok) {
    assertEquals(kebabResult.data.isKebabCase(), true);
  }

  const snakeResult = ConfigSetName.create("snake_case_name");
  if (snakeResult.ok) {
    assertEquals(snakeResult.data.isSnakeCase(), true);
  }
});

Deno.test("2_structure: case conversion methods", () => {
  const mixedResult = ConfigSetName.create("Mixed-Case_Name");
  assertEquals(mixedResult.ok, true);

  if (mixedResult.ok) {
    const mixed = mixedResult.data;

    const lowerResult = mixed.toLowerCase();
    assertEquals(lowerResult.ok, true);

    if (lowerResult.ok) {
      assertEquals(lowerResult.data.value, "mixed-case_name");
    }

    // Converting already lowercase should return same instance
    const alreadyLowerResult = ConfigSetName.create("already-lower");
    if (alreadyLowerResult.ok) {
      const sameResult = alreadyLowerResult.data.toLowerCase();
      if (sameResult.ok) {
        assertEquals(sameResult.data, alreadyLowerResult.data);
      }
    }
  }
});

Deno.test("2_structure: prefix and suffix methods", () => {
  const baseResult = ConfigSetName.create("base");
  assertEquals(baseResult.ok, true);

  if (baseResult.ok) {
    const base = baseResult.data;

    // Prefix
    const prefixedResult = base.withPrefix("env");
    assertEquals(prefixedResult.ok, true);

    if (prefixedResult.ok) {
      assertEquals(prefixedResult.data.value, "env-base");
    }

    // Suffix
    const suffixedResult = base.withSuffix("config");
    assertEquals(suffixedResult.ok, true);

    if (suffixedResult.ok) {
      assertEquals(suffixedResult.data.value, "base-config");
    }

    // Empty prefix/suffix should fail
    const emptyPrefixResult = base.withPrefix("");
    assertEquals(emptyPrefixResult.ok, false);

    const emptySuffixResult = base.withSuffix("");
    assertEquals(emptySuffixResult.ok, false);
  }
});

Deno.test("2_structure: string representations", () => {
  const result = ConfigSetName.create("valid-config");
  if (!result.ok) {
    throw new Error(`Failed to create ConfigSetName: ${JSON.stringify(result.error)}`);
  }

  const config = result.data;

  // value getter
  assertEquals(config.value, "valid-config");

  // toString() method
  assertEquals(config.toString(), "ConfigSetName(valid-config)");

  // JSON serialization
  assertEquals(config.toJSON(), "valid-config");

  // valueOf for primitive conversion
  assertEquals(config.valueOf(), "valid-config");

  // String concatenation
  assertEquals(`Config: ${config}`, "Config: ConfigSetName(valid-config)");
});

// ============================================================================
// Error Message Quality and Utility Tests
// ============================================================================

Deno.test("error_formatting: formatConfigSetNameError produces readable messages", () => {
  const errorCases = [
    {
      input: "",
      shouldContain: ["empty", "cannot be empty"],
    },
    {
      input: "invalid@char",
      shouldContain: ["invalid characters", "@"],
    },
    {
      input: "default",
      shouldContain: ["reserved", "default"],
    },
    {
      input: "a".repeat(70),
      shouldContain: ["too long", "64"],
    },
    {
      input: "sys-prefix",
      shouldContain: ["reserved prefix", "sys-"],
    },
  ];

  errorCases.forEach(({ input, shouldContain }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);

    if (!result.ok) {
      const message = formatConfigSetNameError(result.error);
      assertEquals(typeof message, "string");
      assertEquals(message.length > 0, true);

      shouldContain.forEach((substring) => {
        assertEquals(
          message.toLowerCase().includes(substring.toLowerCase()),
          true,
          `Error message should contain "${substring}": ${message}`,
        );
      });
    }
  });
});

// Deno.test("deprecated_utility: createConfigSetName throws on error", () => {
//   // Valid name should work
//   const validConfig = createConfigSetName("valid-name");
//   assertEquals(validConfig.value, "valid-name");
//
//   // Invalid name should throw
//   let threwError = false;
//   try {
//     createConfigSetName("");
//   } catch (caughtError) {
//     threwError = true;
//     assertEquals(caughtError instanceof Error, true);
//     assertEquals((caughtError as Error).message.includes("empty"), true);
//   }
//   assertEquals(threwError, true, "Should throw for invalid names");
// });

// ============================================================================
// Collection Utilities Tests
// ============================================================================

Deno.test("collection: ConfigSetNameCollection creation and operations", () => {
  const validNames = ["config1", "config2", "config3"];
  const collectionResult = ConfigSetNameCollection.create(validNames);
  assertEquals(collectionResult.ok, true);

  if (collectionResult.ok) {
    const collection = collectionResult.data;

    // Basic properties
    assertEquals(collection.getCount(), 3);
    assertEquals(collection.isEmpty(), false);

    // Get names
    const names = collection.getNames();
    assertEquals(names, validNames);

    // Get ConfigSetName instances
    const configNames = collection.getConfigSetNames();
    assertEquals(configNames.length, 3);
    assertEquals(configNames[0].value, "config1");
  }
});

Deno.test("collection: ConfigSetNameCollection contains methods", () => {
  const validNames = ["config1", "config2", "config3"];
  const collectionResult = ConfigSetNameCollection.create(validNames);
  const searchResult = ConfigSetName.create("config1");
  const notFoundResult = ConfigSetName.create("config4");
  const caseResult = ConfigSetName.create("CONFIG1");

  assertEquals(collectionResult.ok, true);
  assertEquals(searchResult.ok, true);
  assertEquals(notFoundResult.ok, true);
  assertEquals(caseResult.ok, true);

  if (collectionResult.ok && searchResult.ok && notFoundResult.ok && caseResult.ok) {
    const collection = collectionResult.data;
    const search = searchResult.data;
    const notFound = notFoundResult.data;
    const caseSearch = caseResult.data;

    // Contains (case-sensitive)
    assertEquals(collection.contains(search), true);
    assertEquals(collection.contains(notFound), false);
    assertEquals(collection.contains(caseSearch), false);

    // Contains (case-insensitive)
    assertEquals(collection.containsIgnoreCase(search), true);
    assertEquals(collection.containsIgnoreCase(notFound), false);
    assertEquals(collection.containsIgnoreCase(caseSearch), true);
  }
});

Deno.test("collection: ConfigSetNameCollection error propagation", () => {
  const invalidNames = ["valid1", "", "valid2"]; // Contains empty name
  const collectionResult = ConfigSetNameCollection.create(invalidNames);
  assertEquals(collectionResult.ok, false);

  if (!collectionResult.ok) {
    assertEquals(collectionResult.error.kind, "EmptyName");
  }
});

Deno.test("collection: empty ConfigSetNameCollection", () => {
  const emptyResult = ConfigSetNameCollection.create([]);
  assertEquals(emptyResult.ok, true);

  if (emptyResult.ok) {
    const empty = emptyResult.data;
    assertEquals(empty.isEmpty(), true);
    assertEquals(empty.getCount(), 0);
    assertEquals(empty.getNames().length, 0);
  }
});
