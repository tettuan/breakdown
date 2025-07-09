/**
 * @fileoverview Structure tests for WorkspaceName Value Object
 *
 * This test suite validates the structural properties and value object
 * semantics of the WorkspaceName implementation:
 * - Immutability enforcement
 * - Value equality semantics
 * - Utility methods behavior
 * - String representations
 * - Transformation methods
 * - Filesystem integration
 * - Serialization support
 */

import { assertEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";
import { WorkspaceName, WorkspaceNameCollection } from "./workspace_name.ts";

// ============================================================================
// Immutability Tests
// ============================================================================

Deno.test("2_structure: instances are completely immutable", () => {
  const result = WorkspaceName.create("test-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // Object should be frozen
    assertEquals(Object.isFrozen(workspace), true);

    // Attempting to modify should fail or have no effect
    const originalValue = workspace.value;
    try {
      (workspace as any)._value = "modified";
      (workspace as any).value = "modified";
      (workspace as any).newProp = "added";
    } catch (e) {
      // In strict mode, this would throw TypeError
      assertEquals(e instanceof TypeError, true);
    }

    // Value should remain unchanged
    assertEquals(workspace.value, originalValue);
    assertEquals((workspace as any).newProp, undefined);
  }
});

Deno.test("2_structure: collection instances are immutable", () => {
  const result = WorkspaceNameCollection.create(["workspace1", "workspace2"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Collection should be frozen
    assertEquals(Object.isFrozen(collection), true);

    // Internal array should also be frozen
    const names = collection.getNames();
    assertEquals(Object.isFrozen(names), true);

    // Returned WorkspaceName instances should be frozen
    const workspaces = collection.getWorkspaceNames();
    assertEquals(Object.isFrozen(workspaces), true);
    workspaces.forEach((workspace) => {
      assertEquals(Object.isFrozen(workspace), true);
    });
  }
});

// ============================================================================
// Value Equality Tests
// ============================================================================

Deno.test("2_structure: value equality based on content not reference", () => {
  const result1 = WorkspaceName.create("same-workspace");
  const result2 = WorkspaceName.create("same-workspace");
  const result3 = WorkspaceName.create("different-workspace");

  assertEquals(result1.ok, true);
  assertEquals(result2.ok, true);
  assertEquals(result3.ok, true);

  if (result1.ok && result2.ok && result3.ok) {
    const workspace1 = result1.data;
    const workspace2 = result2.data;
    const workspace3 = result3.data;

    // Different instances
    assertNotStrictEquals(workspace1, workspace2);

    // But equal values
    assertEquals(workspace1.equals(workspace2), true);
    assertEquals(workspace2.equals(workspace1), true);

    // Different values are not equal
    assertEquals(workspace1.equals(workspace3), false);
    assertEquals(workspace3.equals(workspace1), false);

    // Reflexivity: equals itself
    assertEquals(workspace1.equals(workspace1), true);
    assertEquals(workspace2.equals(workspace2), true);
    assertEquals(workspace3.equals(workspace3), true);
  }
});

Deno.test("2_structure: case-sensitive and case-insensitive equality", () => {
  const lowerResult = WorkspaceName.create("my-workspace");
  const upperResult = WorkspaceName.create("MY-WORKSPACE");
  const mixedResult = WorkspaceName.create("My-Workspace");

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
    { name: "workspace", length: 9 },
    { name: "my-workspace", length: 12 },
    { name: "very-long-workspace-name", length: 24 },
    { name: "a".repeat(255), length: 255 },
  ];

  testCases.forEach(({ name, length }) => {
    const result = WorkspaceName.create(name);
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
    const result = WorkspaceName.create(name);
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
    const result = WorkspaceName.create(name);
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
    const result = WorkspaceName.create(name);
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
// Production Suitability Tests
// ============================================================================

Deno.test("2_structure: production suitability assessment", () => {
  const productionSuitable = [
    { name: "client-workspace", suitable: true },
    { name: "production-app", suitable: true },
    { name: "stable-version", suitable: true },
    { name: "main-workspace", suitable: true },
    { name: "project-alpha", suitable: true },
  ];

  const notProductionSuitable = [
    { name: "temp-workspace", suitable: false },
    { name: "test-env", suitable: false },
    { name: "debug-mode", suitable: false },
    { name: "dev-environment", suitable: false },
    { name: "tmp-data", suitable: false },
    { name: "ab", suitable: false }, // Too short
    { name: "x", suitable: false }, // Too short
  ];

  [...productionSuitable, ...notProductionSuitable].forEach(({ name, suitable }) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(
        result.data.isSuitableForProduction(),
        suitable,
        `${name} production suitability should be ${suitable}`,
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
    const result = WorkspaceName.create(input);
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

Deno.test("2_structure: toSafeName transformation", () => {
  const testCases = [
    { input: "already-safe", expected: "already-safe" },
    { input: "safe_name_123", expected: "safe_name_123" },
    { input: "AlreadySafe", expected: "AlreadySafe" },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const safeResult = result.data.toSafeName();
      assertEquals(safeResult.ok, true);

      if (safeResult.ok) {
        assertEquals(safeResult.data.value, expected);

        // Creates new instance even if already safe (consistent behavior)
        assertNotStrictEquals(safeResult.data, result.data);
      }
    }
  });
});

Deno.test("2_structure: withPrefix transformation", () => {
  const baseResult = WorkspaceName.create("workspace");
  assertEquals(baseResult.ok, true);

  if (baseResult.ok) {
    const base = baseResult.data;

    // Valid prefixes
    const prefixTests = [
      { prefix: "env", expected: "env-workspace" },
      { prefix: "test", expected: "test-workspace" },
      { prefix: "feature", expected: "feature-workspace" },
      { prefix: "v2", expected: "v2-workspace" },
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
    const invalidPrefixes = ["", "   ", null as any, undefined as any];

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
      assertEquals(spacedResult.data.value, "spaced-workspace");
    }
  }
});

Deno.test("2_structure: withSuffix transformation", () => {
  const baseResult = WorkspaceName.create("workspace");
  assertEquals(baseResult.ok, true);

  if (baseResult.ok) {
    const base = baseResult.data;

    // Valid suffixes
    const suffixTests = [
      { suffix: "backup", expected: "workspace-backup" },
      { suffix: "v2", expected: "workspace-v2" },
      { suffix: "dev", expected: "workspace-dev" },
      { suffix: "2023", expected: "workspace-2023" },
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
    const invalidSuffixes = ["", "   ", null as any, undefined as any];

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
      assertEquals(spacedResult.data.value, "workspace-spaced");
    }
  }
});

Deno.test("2_structure: transformation methods preserve immutability", () => {
  const result = WorkspaceName.create("Original");
  assertEquals(result.ok, true);

  if (result.ok) {
    const original = result.data;
    const originalValue = original.value;

    // Transformations create new instances
    const lower = original.toLowerCase();
    const safe = original.toSafeName();
    const prefixed = original.withPrefix("pre");
    const suffixed = original.withSuffix("post");

    // Original remains unchanged
    assertEquals(original.value, originalValue);

    // All results are immutable
    if (lower.ok) assertEquals(Object.isFrozen(lower.data), true);
    if (safe.ok) assertEquals(Object.isFrozen(safe.data), true);
    if (prefixed.ok) assertEquals(Object.isFrozen(prefixed.data), true);
    if (suffixed.ok) assertEquals(Object.isFrozen(suffixed.data), true);
  }
});

// ============================================================================
// Filesystem Integration Tests
// ============================================================================

Deno.test("2_structure: directory path generation", () => {
  const result = WorkspaceName.create("my-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // Without base path
    assertEquals(workspace.toDirectoryPath(), "my-workspace");

    // With various base paths
    assertEquals(workspace.toDirectoryPath("/home/user"), "/home/user/my-workspace");
    assertEquals(workspace.toDirectoryPath("./projects"), "./projects/my-workspace");
    assertEquals(workspace.toDirectoryPath("C:\\Users\\dev"), "C:\\Users\\dev/my-workspace");
    assertEquals(workspace.toDirectoryPath("relative/path"), "relative/path/my-workspace");

    // Empty base path should work like no base path
    assertEquals(workspace.toDirectoryPath(""), "my-workspace");
  }
});

Deno.test("2_structure: filesystem safety validation", () => {
  const safeNames = [
    "simple",
    "with-hyphens",
    "with_underscores",
    "MixedCase123",
    "complex-name_with-123_parts",
  ];

  safeNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true);

    if (result.ok) {
      const workspace = result.data;

      // Should be usable as directory path
      const dirPath = workspace.toDirectoryPath("/base");
      assertEquals(dirPath, `/base/${name}`);

      // Should be filesystem-safe already
      const safeResult = workspace.toSafeName();
      assertEquals(safeResult.ok, true);
      if (safeResult.ok) {
        assertEquals(safeResult.data.value, name);
      }
    }
  });
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
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, name);
      assertEquals(typeof result.data.value, "string");
    }
  });
});

Deno.test("2_structure: toString provides debug representation", () => {
  const result = WorkspaceName.create("my-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const str = result.data.toString();
    assertEquals(typeof str, "string");
    assertEquals(str, "WorkspaceName(my-workspace)");

    // Should work in string concatenation
    const concatenated = `The workspace is: ${result.data}`;
    assertEquals(concatenated, "The workspace is: WorkspaceName(my-workspace)");
  }
});

Deno.test("2_structure: JSON serialization", () => {
  const result = WorkspaceName.create("json-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // toJSON returns the raw value
    assertEquals(workspace.toJSON(), "json-workspace");

    // Works with JSON.stringify
    const jsonString = JSON.stringify(workspace);
    assertEquals(jsonString, '"json-workspace"');

    // Works in objects
    const obj = { workspace: workspace };
    const objJson = JSON.stringify(obj);
    assertEquals(objJson, '{"workspace":"json-workspace"}');

    // Works in arrays
    const arr = [workspace];
    const arrJson = JSON.stringify(arr);
    assertEquals(arrJson, '["json-workspace"]');
  }
});

Deno.test("2_structure: valueOf for primitive conversion", () => {
  const result = WorkspaceName.create("value-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // valueOf returns the raw value
    assertEquals(workspace.valueOf(), "value-workspace");
    assertEquals(typeof workspace.valueOf(), "string");

    // Works with primitive operations
    assertEquals(String(workspace), "WorkspaceName(value-workspace)"); // Uses toString
    assertEquals(workspace.valueOf(), "value-workspace"); // Uses valueOf
  }
});

// ============================================================================
// Collection Structure Tests
// ============================================================================

Deno.test("2_structure: collection maintains insertion order", () => {
  const names = ["zulu", "alpha", "mike", "bravo"];
  const result = WorkspaceNameCollection.create(names);
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
  const result = WorkspaceNameCollection.create(["workspace1", "workspace2", "workspace3"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Create new instance with same value
    const searchResult = WorkspaceName.create("workspace2");
    assertEquals(searchResult.ok, true);

    if (searchResult.ok) {
      // Should find by value, not reference
      assertEquals(collection.contains(searchResult.data), true);
    }

    // Test not found
    const notFoundResult = WorkspaceName.create("workspace4");
    assertEquals(notFoundResult.ok, true);

    if (notFoundResult.ok) {
      assertEquals(collection.contains(notFoundResult.data), false);
    }
  }
});

Deno.test("2_structure: collection production filtering creates new instance", () => {
  const mixedNames = ["production-app", "temp-workspace", "client-project", "test-env"];
  const result = WorkspaceNameCollection.create(mixedNames);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;
    const filtered = collection.filterProductionSuitable();

    // Should be a new instance
    assertNotStrictEquals(filtered, collection);

    // Should be immutable
    assertEquals(Object.isFrozen(filtered), true);

    // Should contain only production-suitable names
    const filteredNames = filtered.getNames();
    assertEquals(filteredNames.includes("production-app"), true);
    assertEquals(filteredNames.includes("client-project"), true);
    assertEquals(filteredNames.includes("temp-workspace"), false);
    assertEquals(filteredNames.includes("test-env"), false);

    // Original collection unchanged
    assertEquals(collection.getCount(), 4);
    assertEquals(filtered.getCount(), 2);
  }
});

Deno.test("2_structure: collection returns immutable views", () => {
  const result = WorkspaceNameCollection.create(["workspace1", "workspace2"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const collection = result.data;

    // Get names array
    const names = collection.getNames();
    assertEquals(Object.isFrozen(names), true);

    // Get WorkspaceName instances array
    const workspaces = collection.getWorkspaceNames();
    assertEquals(Object.isFrozen(workspaces), true);

    // Modifying returned arrays should fail or have no effect
    try {
      (names as any).push("new-workspace");
      (workspaces as any).push(null);
    } catch (e) {
      // Expected in strict mode
      assertEquals(e instanceof TypeError, true);
    }

    // Collection remains unchanged
    assertEquals(collection.getCount(), 2);
  }
});

Deno.test("2_structure: collection empty state", () => {
  const result = WorkspaceNameCollection.create([]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const empty = result.data;

    // Basic properties
    assertEquals(empty.isEmpty(), true);
    assertEquals(empty.getCount(), 0);

    // Returns empty but frozen arrays
    const names = empty.getNames();
    assertEquals(names.length, 0);
    assertEquals(Object.isFrozen(names), true);

    const workspaces = empty.getWorkspaceNames();
    assertEquals(workspaces.length, 0);
    assertEquals(Object.isFrozen(workspaces), true);

    // Production filtering should return empty collection
    const filtered = empty.filterProductionSuitable();
    assertEquals(filtered.isEmpty(), true);
    assertEquals(filtered.getCount(), 0);
  }
});
