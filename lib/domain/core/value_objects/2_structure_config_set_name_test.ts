/**
 * @fileoverview Structure tests for ConfigSetName Value Object
 *
 * This test suite validates the structural properties and value object
 * semantics of the ConfigSetName implementation:
 * - Immutability enforcement
 * - Value equality semantics
 * - Utility methods behavior
 * - String representations
 * - Transformation methods
 * - Serialization support
 */

import { assertEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";
import { ConfigSetName, ConfigSetNameCollection } from "./config_set_name.ts";

// ============================================================================
// Immutability Tests
// ============================================================================

Deno.test("2_structure: instances are completely immutable", () => {
  const result = ConfigSetName.create("valid-config");
  assertEquals(result.ok, true);

  if (result.ok) {
    const config = result.data;

    // Object should be frozen
    assertEquals(Object.isFrozen(config), true);

    // Attempting to modify should fail or have no effect
    const originalValue = config.value;
    try {
      (config as unknown as { _value: string })._value = "modified";
      (config as unknown as { value: string }).value = "modified";
      (config as unknown as { newProp: string }).newProp = "added";
    } catch (e) {
      // In strict mode, this would throw TypeError
      assertEquals(e instanceof TypeError, true);
    }

    // Value should remain unchanged
    assertEquals(config.value, originalValue);
    assertEquals((config as unknown as { newProp?: string }).newProp, undefined);
  }
});

Deno.test("2_structure: collection instances are immutable", () => {
  const result = ConfigSetNameCollection.create(["config1", "config2"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Collection should be frozen
    assertEquals(Object.isFrozen(collection), true);

    // Internal array should also be frozen
    const names = collection.getNames();
    assertEquals(Object.isFrozen(names), true);

    // Returned ConfigSetName instances should be frozen
    const configs = collection.getConfigSetNames();
    assertEquals(Object.isFrozen(configs), true);
    configs.forEach((config) => {
      assertEquals(Object.isFrozen(config), true);
    });
  }
});

// ============================================================================
// Value Equality Tests
// ============================================================================

Deno.test("2_structure: value equality based on content not reference", () => {
  const result1 = ConfigSetName.create("same-config");
  const result2 = ConfigSetName.create("same-config");
  const result3 = ConfigSetName.create("different-config");

  assertEquals(result1.ok, true);
  assertEquals(result2.ok, true);
  assertEquals(result3.ok, true);

  if (result1.ok && result2.ok && result3.ok) {
    const config1 = result1.data;
    const config2 = result2.data;
    const config3 = result3.data;

    // Different instances
    assertNotStrictEquals(config1, config2);

    // But equal values
    assertEquals(config1.equals(config2), true);
    assertEquals(config2.equals(config1), true);

    // Different values are not equal
    assertEquals(config1.equals(config3), false);
    assertEquals(config3.equals(config1), false);

    // Reflexivity: equals itself
    assertEquals(config1.equals(config1), true);
    assertEquals(config2.equals(config2), true);
    assertEquals(config3.equals(config3), true);
  }
});

Deno.test("2_structure: case-sensitive and case-insensitive equality", () => {
  const lowerResult = ConfigSetName.create("my-config");
  const upperResult = ConfigSetName.create("MY-CONFIG");
  const mixedResult = ConfigSetName.create("My-Config");

  assertEquals(lowerResult.ok, true);
  assertEquals(upperResult.ok, true);
  assertEquals(mixedResult.ok, true);

  if (lowerResult.ok && upperResult.ok && mixedResult.ok) {
    const lower = lowerResult.data;
    const upper = upperResult.data;
    const mixed = mixedResult.data;

    // Case-sensitive equality
    assertEquals(lower.equals(upper), false);
    assertEquals(lower.equals(mixed), false);
    assertEquals(upper.equals(mixed), false);

    // Case-insensitive equality
    assertEquals(lower.equalsIgnoreCase(upper), true);
    assertEquals(lower.equalsIgnoreCase(mixed), true);
    assertEquals(upper.equalsIgnoreCase(mixed), true);

    // Symmetry
    assertEquals(upper.equalsIgnoreCase(lower), true);
    assertEquals(mixed.equalsIgnoreCase(lower), true);
    assertEquals(mixed.equalsIgnoreCase(upper), true);
  }
});

// ============================================================================
// Utility Method Tests
// ============================================================================

Deno.test("2_structure: length calculation", () => {
  const testCases = [
    { name: "a", length: 1 },
    { name: "myconf", length: 6 },
    { name: "my-config", length: 9 },
    { name: "very-long-configuration-name", length: 28 },
    { name: "a".repeat(64), length: 64 },
  ];

  testCases.forEach(({ name, length }) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getLength(), length);
    }
  });
});

Deno.test("2_structure: case checking methods", () => {
  const testCases = [
    { name: "lowercase", isLower: true },
    { name: "UPPERCASE", isLower: false },
    { name: "MixedCase", isLower: false },
    { name: "lower-case", isLower: true },
    { name: "lower_case", isLower: true },
    { name: "lower123", isLower: true },
    { name: "Lower123", isLower: false },
  ];

  testCases.forEach(({ name, isLower }) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.isLowerCase(), isLower);
    }
  });
});

Deno.test("2_structure: naming convention checks", () => {
  // Kebab-case tests
  const kebabTests = [
    { name: "kebab-case", isKebab: true },
    { name: "multi-word-name", isKebab: true },
    { name: "name123", isKebab: true },
    { name: "name-123", isKebab: true },
    { name: "123-name", isKebab: true },
    { name: "KEBAB-CASE", isKebab: false }, // Not lowercase
    { name: "snake_case", isKebab: false }, // Wrong separator
    { name: "MixedCase", isKebab: false }, // Not lowercase
    { name: "-start", isKebab: false }, // Starts with hyphen
    { name: "end-", isKebab: false }, // Ends with hyphen
    { name: "double--hyphen", isKebab: false }, // Double hyphen
  ];

  kebabTests.forEach(({ name, isKebab }) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(
        result.data.isKebabCase(),
        isKebab,
        `${name} should ${isKebab ? "be" : "not be"} kebab-case`,
      );
    }
  });

  // Snake_case tests
  const snakeTests = [
    { name: "snake_case", isSnake: true },
    { name: "multi_word_name", isSnake: true },
    { name: "name123", isSnake: true },
    { name: "name_123", isSnake: true },
    { name: "123_name", isSnake: true },
    { name: "SNAKE_CASE", isSnake: false }, // Not lowercase
    { name: "kebab-case", isSnake: false }, // Wrong separator
    { name: "MixedCase", isSnake: false }, // Not lowercase
    { name: "_start", isSnake: false }, // Starts with underscore
    { name: "end_", isSnake: false }, // Ends with underscore
    { name: "double__underscore", isSnake: false }, // Double underscore
  ];

  snakeTests.forEach(({ name, isSnake }) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(
        result.data.isSnakeCase(),
        isSnake,
        `${name} should ${isSnake ? "be" : "not be"} snake_case`,
      );
    }
  });
});

// ============================================================================
// Transformation Method Tests
// ============================================================================

Deno.test("2_structure: toLowerCase transformation", () => {
  const testCases = [
    { input: "UPPERCASE", expected: "uppercase" },
    { input: "MixedCase", expected: "mixedcase" },
    { input: "lowercase", expected: "lowercase" }, // Already lowercase
    { input: "MIXED-Case_123", expected: "mixed-case_123" },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const lowerResult = result.data.toLowerCase();
      assertEquals(lowerResult.ok, true);

      if (lowerResult.ok) {
        assertEquals(lowerResult.data.value, expected);

        // If already lowercase, should return same instance
        if (input === expected) {
          assertStrictEquals(lowerResult.data, result.data);
        } else {
          assertNotStrictEquals(lowerResult.data, result.data);
        }
      }
    }
  });
});

Deno.test("2_structure: withPrefix transformation", () => {
  const baseResult = ConfigSetName.create("mybase");
  assertEquals(baseResult.ok, true);

  if (baseResult.ok) {
    const base = baseResult.data;

    // Valid prefixes
    const prefixTests = [
      { prefix: "env", expected: "env-mybase" },
      { prefix: "ver", expected: "ver-mybase" },
      { prefix: "feature", expected: "feature-mybase" },
      { prefix: "v2", expected: "v2-mybase" },
    ];

    prefixTests.forEach(({ prefix, expected }) => {
      const result = base.withPrefix(prefix);
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.value, expected);
        assertNotStrictEquals(result.data, base); // New instance
      }
    });

    // Invalid prefixes
    const invalidPrefixes = ["", "   ", null as unknown as string, undefined as unknown as string];

    invalidPrefixes.forEach((prefix) => {
      const result = base.withPrefix(prefix);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "EmptyName");
      }
    });

    // Prefix with whitespace should be trimmed
    const spacedResult = base.withPrefix("  spaced  ");
    assertEquals(spacedResult.ok, true);
    if (spacedResult.ok) {
      assertEquals(spacedResult.data.value, "spaced-mybase");
    }
  }
});

Deno.test("2_structure: withSuffix transformation", () => {
  const baseResult = ConfigSetName.create("mybase");
  assertEquals(baseResult.ok, true);

  if (baseResult.ok) {
    const base = baseResult.data;

    // Valid suffixes
    const suffixTests = [
      { suffix: "backup", expected: "mybase-backup" },
      { suffix: "v2", expected: "mybase-v2" },
      { suffix: "version", expected: "mybase-version" },
      { suffix: "2023", expected: "mybase-2023" },
    ];

    suffixTests.forEach(({ suffix, expected }) => {
      const result = base.withSuffix(suffix);
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data.value, expected);
        assertNotStrictEquals(result.data, base); // New instance
      }
    });

    // Invalid suffixes
    const invalidSuffixes = ["", "   ", null as unknown as string, undefined as unknown as string];

    invalidSuffixes.forEach((suffix) => {
      const result = base.withSuffix(suffix);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "EmptyName");
      }
    });

    // Suffix with whitespace should be trimmed
    const spacedResult = base.withSuffix("  spaced  ");
    assertEquals(spacedResult.ok, true);
    if (spacedResult.ok) {
      assertEquals(spacedResult.data.value, "mybase-spaced");
    }
  }
});

Deno.test("2_structure: transformation methods preserve immutability", () => {
  const result = ConfigSetName.create("Original");
  assertEquals(result.ok, true);

  if (result.ok) {
    const original = result.data;
    const originalValue = original.value;

    // Transformations create new instances
    const lower = original.toLowerCase();
    const prefixed = original.withPrefix("pre");
    const suffixed = original.withSuffix("post");

    // Original remains unchanged
    assertEquals(original.value, originalValue);

    // All results are immutable
    if (lower.ok) assertEquals(Object.isFrozen(lower.data), true);
    if (prefixed.ok) assertEquals(Object.isFrozen(prefixed.data), true);
    if (suffixed.ok) assertEquals(Object.isFrozen(suffixed.data), true);
  }
});

// ============================================================================
// String Representation Tests
// ============================================================================

Deno.test("2_structure: value getter returns raw string", () => {
  const testCases = [
    "simple",
    "with-hyphens",
    "with_underscores",
    "MixedCase",
    "numbers123",
  ];

  testCases.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, name);
      assertEquals(typeof result.data.value, "string");
    }
  });
});

Deno.test("2_structure: toString provides debug representation", () => {
  const result = ConfigSetName.create("my-config");
  assertEquals(result.ok, true);

  if (result.ok) {
    const str = result.data.toString();
    assertEquals(typeof str, "string");
    assertEquals(str, "ConfigSetName(my-config)");

    // Should work in string concatenation
    const concatenated = `The config is: ${result.data}`;
    assertEquals(concatenated, "The config is: ConfigSetName(my-config)");
  }
});

Deno.test("2_structure: JSON serialization", () => {
  const result = ConfigSetName.create("json-config");
  assertEquals(result.ok, true);

  if (result.ok) {
    const config = result.data;

    // toJSON returns the raw value
    assertEquals(config.toJSON(), "json-config");

    // Works with JSON.stringify
    const jsonString = JSON.stringify(config);
    assertEquals(jsonString, '"json-config"');

    // Works in objects
    const obj = { config: config };
    const objJson = JSON.stringify(obj);
    assertEquals(objJson, '{"config":"json-config"}');

    // Works in arrays
    const arr = [config];
    const arrJson = JSON.stringify(arr);
    assertEquals(arrJson, '["json-config"]');
  }
});

Deno.test("2_structure: valueOf for primitive conversion", () => {
  const result = ConfigSetName.create("value-config");
  assertEquals(result.ok, true);

  if (result.ok) {
    const config = result.data;

    // valueOf returns the raw value
    assertEquals(config.valueOf(), "value-config");
    assertEquals(typeof config.valueOf(), "string");

    // Works with primitive operations
    // Note: TypeScript may require explicit conversion
    assertEquals(String(config), "ConfigSetName(value-config)"); // Uses toString
    assertEquals(config.valueOf(), "value-config"); // Uses valueOf
  }
});

// ============================================================================
// Collection Structure Tests
// ============================================================================

Deno.test("2_structure: collection maintains insertion order", () => {
  const names = ["zulu", "alpha", "mike", "bravo"];
  const result = ConfigSetNameCollection.create(names);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;
    const retrieved = collection.getNames();

    // Order is preserved
    assertEquals(retrieved[0], "zulu");
    assertEquals(retrieved[1], "alpha");
    assertEquals(retrieved[2], "mike");
    assertEquals(retrieved[3], "bravo");
  }
});

Deno.test("2_structure: collection contains method uses value equality", () => {
  const result = ConfigSetNameCollection.create(["config1", "config2", "config3"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Create new instance with same value
    const searchResult = ConfigSetName.create("config2");
    assertEquals(searchResult.ok, true);

    if (searchResult.ok) {
      // Should find by value, not reference
      assertEquals(collection.contains(searchResult.data), true);
    }

    // Case-insensitive search
    const upperResult = ConfigSetName.create("CONFIG2");
    assertEquals(upperResult.ok, true);

    if (upperResult.ok) {
      assertEquals(collection.contains(upperResult.data), false); // Case-sensitive
      assertEquals(collection.containsIgnoreCase(upperResult.data), true); // Case-insensitive
    }
  }
});

Deno.test("2_structure: collection returns immutable views", () => {
  const result = ConfigSetNameCollection.create(["config1", "config2"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Get names array
    const names = collection.getNames();
    assertEquals(Object.isFrozen(names), true);

    // Get ConfigSetName instances array
    const configs = collection.getConfigSetNames();
    assertEquals(Object.isFrozen(configs), true);

    // Modifying returned arrays should fail or have no effect
    try {
      (names as unknown as string[]).push("new-config");
      (configs as unknown as ConfigSetName[]).push(null as unknown as ConfigSetName);
    } catch (e) {
      // Expected in strict mode
      assertEquals(e instanceof TypeError, true);
    }

    // Collection remains unchanged
    assertEquals(collection.getCount(), 2);
  }
});
