/**
 * @fileoverview Tests for WorkspaceName Value Object
 *
 * This test suite validates the WorkspaceName implementation following
 * the test strategy described in @docs/tests/testing.ja.md:
 * - 0_architecture tests for Smart Constructor pattern and DDD principles
 * - 1_behavior tests for domain logic validation and business rules
 * - 2_structure tests for immutability and value object semantics
 */

import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import {
  createWorkspaceName,
  formatWorkspaceNameError,
  isContainsWhitespaceError,
  isEmptyNameError,
  isInvalidCharactersError,
  isInvalidFormatError,
  isPathTraversalAttemptError,
  isReservedNameError,
  isStartsWithDotError,
  isTooLongError,
  WorkspaceName,
  WorkspaceNameCollection,
  type WorkspaceNameError,
} from "./workspace_name.ts";

// ============================================================================
// 0_architecture: Smart Constructor Pattern and DDD Tests
// ============================================================================

Deno.test("0_architecture: Smart Constructor enforces private constructor", () => {
  // Constructor should be private - cannot instantiate directly
  // This validates the Smart Constructor pattern implementation

  const validResult = WorkspaceName.create("valid-name");
  assertEquals(validResult.ok, true);

  // The only way to create instances should be through the static create method
  // TypeScript compiler should prevent direct constructor access
  // We can verify that create method returns proper Result type
  assertEquals(typeof validResult, "object");
  assertEquals("ok" in validResult, true);
  if (validResult.ok) {
    assertEquals(typeof validResult.data, "object");
    assertEquals(validResult.data.constructor.name, "WorkspaceName");
  }
});

Deno.test("0_architecture: Result type pattern for error handling", () => {
  // All creation should return Result<T, E> - no exceptions thrown

  const invalidResult = WorkspaceName.create("");
  assertEquals(invalidResult.ok, false);

  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EmptyName");
  }

  const validResult = WorkspaceName.create("valid-name");
  assertEquals(validResult.ok, true);
});

Deno.test("0_architecture: Discriminated Union error types", () => {
  // Each error should have a unique 'kind' discriminator

  const errorCases = [
    { input: "", expectedKind: "EmptyName" },
    { input: "with spaces", expectedKind: "ContainsWhitespace" },
    { input: "../traversal", expectedKind: "PathTraversalAttempt" },
    { input: "a".repeat(300), expectedKind: "TooLong" },
    { input: ".hidden", expectedKind: "StartsWithDot" },
    { input: "CON", expectedKind: "ReservedName" },
    { input: "with/slash", expectedKind: "PathTraversalAttempt" },
    { input: "invalid\u0000char", expectedKind: "InvalidCharacters" },
  ] as const;

  errorCases.forEach(({ input, expectedKind }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);

    if (!result.ok) {
      assertEquals(result.error.kind, expectedKind);
    }
  });
});

Deno.test("0_architecture: Type guards for error discrimination", () => {
  // Type guards should correctly identify error types

  const emptyResult = WorkspaceName.create("");
  if (!emptyResult.ok) {
    assertEquals(isEmptyNameError(emptyResult.error), true);
    assertEquals(isInvalidFormatError(emptyResult.error), false);
  }

  const whitespaceResult = WorkspaceName.create("with spaces");
  if (!whitespaceResult.ok) {
    assertEquals(isContainsWhitespaceError(whitespaceResult.error), true);
    assertEquals(isEmptyNameError(whitespaceResult.error), false);
  }

  const traversalResult = WorkspaceName.create("../attack");
  if (!traversalResult.ok) {
    assertEquals(isPathTraversalAttemptError(traversalResult.error), true);
    assertEquals(isTooLongError(traversalResult.error), false);
  }

  const reservedResult = WorkspaceName.create("CON");
  if (!reservedResult.ok) {
    assertEquals(isReservedNameError(reservedResult.error), true);
    assertEquals(isStartsWithDotError(reservedResult.error), false);
  }
});

// ============================================================================
// 1_behavior: Domain Logic Validation Tests
// ============================================================================

Deno.test("1_behavior: empty name validation", () => {
  const emptyTestCases = [
    { input: null as any, description: "null input" },
    { input: undefined as any, description: "undefined input" },
    { input: "", description: "empty string" },
    { input: "   ", description: "whitespace only" },
  ];

  emptyTestCases.forEach(({ input, description }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject ${description}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyName" as const);
    }
  });

  // Non-string inputs should produce InvalidFormat error
  const nonStringTestCases = [
    { input: 123 as any, description: "number input" },
    { input: {} as any, description: "object input" },
    { input: [] as any, description: "array input" },
  ];

  nonStringTestCases.forEach(({ input, description }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject ${description}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat" as const);
    }
  });
});

Deno.test("1_behavior: valid filesystem-safe names", () => {
  const validNames = [
    "simple",
    "with-hyphens",
    "with_underscores",
    "MixedCase",
    "numbers123",
    "123numbers",
    "a",
    "complex-name_with-123_parts",
    "ALLCAPS",
    "lowercase",
    "Pascal_Case-Mixed_123",
  ];

  validNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should accept valid name: ${name}`);

    if (result.ok) {
      assertEquals(result.data.value, name);
    }
  });
});

Deno.test("1_behavior: whitespace rejection for CLI compatibility", () => {
  const namesWithWhitespace = [
    "with spaces",
    "leading space",
    " leading space",
    "trailing space ",
    "multiple  spaces",
    "tab\there",
    "new\nline",
    "carriage\rreturn",
    "form\ffeed",
    "vertical\vtab",
  ];

  namesWithWhitespace.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject whitespace: "${name}"`);

    if (!result.ok) {
      assertEquals(result.error.kind, "ContainsWhitespace");
      if (result.error.kind === "ContainsWhitespace") {
        assertEquals(Array.isArray(result.error.whitespacePositions), true);
        assertEquals(result.error.whitespacePositions.length > 0, true);
      }
    }
  });
});

Deno.test("1_behavior: length validation for filesystem compatibility", () => {
  const validLengths = [
    "a",
    "ab",
    "a".repeat(255), // Maximum length
  ];

  const tooLong = "a".repeat(256);

  validLengths.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should accept length ${name.length}: ${name.slice(0, 10)}...`);
  });

  const longResult = WorkspaceName.create(tooLong);
  assertEquals(longResult.ok, false, "Should reject too long names");

  if (!longResult.ok) {
    assertEquals(longResult.error.kind, "TooLong");
    if (longResult.error.kind === "TooLong") {
      assertEquals(longResult.error.maxLength, 255);
      assertEquals(longResult.error.actualLength, 256);
    }
  }
});

Deno.test("1_behavior: dot prefix rejection (hidden files)", () => {
  const dotNames = [
    ".hidden",
    ".git",
    ".vscode",
    ".env",
    ".single-letter",
  ];

  dotNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject dot prefix: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithDot");
    }
  });

  // Test path traversal separately (higher priority than StartsWithDot)
  const traversalResult = WorkspaceName.create("..double-dot");
  assertEquals(traversalResult.ok, false);
  if (!traversalResult.ok) {
    assertEquals(traversalResult.error.kind, "PathTraversalAttempt");
  }
});

Deno.test("1_behavior: path traversal attack prevention", () => {
  // Path traversal patterns (high priority)
  const pathTraversalNames = [
    "../parent",
    "..\\windows-parent",
    "normal../attack",
    "attack/../normal",
    "../../etc",
    "path/separator",
    "path\\backslash",
  ];

  pathTraversalNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject path traversal: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "PathTraversalAttempt");
      if (result.error.kind === "PathTraversalAttempt") {
        assertEquals(Array.isArray(result.error.suspiciousPatterns), true);
        assertEquals(result.error.suspiciousPatterns.length > 0, true);
      }
    }
  });
});

Deno.test("1_behavior: forbidden characters for cross-platform compatibility", () => {
  const forbiddenChars = ["<", ">", ":", '"', "|", "?", "*", "\0"];

  forbiddenChars.forEach((char) => {
    const name = `test${char}name`;
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject forbidden character: ${char}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidCharacters");
      if (result.error.kind === "InvalidCharacters") {
        assertEquals(result.error.invalidChars.includes(char), true);
      }
    }
  });
});

Deno.test("1_behavior: reserved names rejection (filesystem safety)", () => {
  const reservedNames = [
    // Windows reserved names
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT9",
    // Unix/Linux system directories
    "bin",
    "boot",
    "dev",
    "etc",
    "home",
    "lib",
    "lib64",
    "mnt",
    "opt",
    "proc",
    "root",
    "run",
    "sbin",
    "srv",
    "sys",
    "tmp",
    "usr",
    "var",
    // Common application directories
    "node_modules",
    "target",
    "build",
    "dist",
    // Case variations
    "con",
    "Con",
    "prn",
    "Prn",
  ];

  reservedNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject reserved name: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
      if (result.error.kind === "ReservedName") {
        assertEquals(Array.isArray(result.error.reserved), true);
      }
    }
  });
});

Deno.test("1_behavior: whitespace trimming", () => {
  const testCases = [
    { input: " trimmed ", expected: "trimmed" }, // Should trim and accept
    { input: "\tno-spaces\t", expected: "no-spaces" },
    { input: "\n\rclean-name\n\r", expected: "clean-name" },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = WorkspaceName.create(input);

    assertEquals(result.ok, true, `Should trim and accept: "${input}"`);
    if (result.ok && expected) {
      assertEquals(result.data.value, expected);
    }
  });
});

// ============================================================================
// 1_behavior: Factory Methods Tests
// ============================================================================

Deno.test("1_behavior: factory methods - defaultWorkspace", () => {
  const result = WorkspaceName.defaultWorkspace();
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.value, "default-workspace");
  }
});

Deno.test("1_behavior: factory methods - withTimestamp", () => {
  const withoutPrefix = WorkspaceName.withTimestamp();
  assertEquals(withoutPrefix.ok, true);

  if (withoutPrefix.ok) {
    assertEquals(withoutPrefix.data.value.startsWith("workspace-"), true);
    // Should contain timestamp-like pattern (YYYY-MM-DD_HH-MM-SS)
    const timestampPattern = /workspace-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;
    assertEquals(timestampPattern.test(withoutPrefix.data.value), true);
  }

  const withPrefix = WorkspaceName.withTimestamp("project");
  assertEquals(withPrefix.ok, true);

  if (withPrefix.ok) {
    assertEquals(withPrefix.data.value.startsWith("project-"), true);
  }
});

Deno.test("1_behavior: factory methods - forProject", () => {
  const validProject = WorkspaceName.forProject("MyProject");
  assertEquals(validProject.ok, true);

  if (validProject.ok) {
    assertEquals(validProject.data.value, "MyProject");
  }

  const projectWithSpaces = WorkspaceName.forProject("My Project Name");
  assertEquals(projectWithSpaces.ok, true);

  if (projectWithSpaces.ok) {
    assertEquals(projectWithSpaces.data.value, "My-Project-Name");
  }

  const projectWithSpecialChars = WorkspaceName.forProject("Project@#$%");
  assertEquals(projectWithSpecialChars.ok, true);

  if (projectWithSpecialChars.ok) {
    assertEquals(projectWithSpecialChars.data.value, "Project----");
  }

  const withSuffix = WorkspaceName.forProject("MyProject", "dev");
  assertEquals(withSuffix.ok, true);

  if (withSuffix.ok) {
    assertEquals(withSuffix.data.value, "MyProject-dev");
  }

  const emptyProject = WorkspaceName.forProject("");
  assertEquals(emptyProject.ok, false);

  if (!emptyProject.ok) {
    assertEquals(emptyProject.error.kind, "EmptyName");
  }

  const onlySpecialChars = WorkspaceName.forProject("@#$%");
  assertEquals(onlySpecialChars.ok, false);

  if (!onlySpecialChars.ok) {
    assertEquals(onlySpecialChars.error.kind, "InvalidFormat");
  }
});

Deno.test("1_behavior: factory methods - temporary", () => {
  const withoutPurpose = WorkspaceName.temporary();
  assertEquals(withoutPurpose.ok, true);

  if (withoutPurpose.ok) {
    assertEquals(withoutPurpose.data.value.startsWith("temp-"), true);
    // Should end with random 6-character suffix
    const tempPattern = /^temp-[a-z0-9]{6}$/;
    assertEquals(tempPattern.test(withoutPurpose.data.value), true);
  }

  const withPurpose = WorkspaceName.temporary("testing");
  assertEquals(withPurpose.ok, true);

  if (withPurpose.ok) {
    assertEquals(withPurpose.data.value.startsWith("temp-testing-"), true);
    const purposePattern = /^temp-testing-[a-z0-9]{6}$/;
    assertEquals(purposePattern.test(withPurpose.data.value), true);
  }
});

// ============================================================================
// 2_structure: Immutability and Value Object Tests
// ============================================================================

Deno.test("2_structure: immutability of created instances", () => {
  const result = WorkspaceName.create("test-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // Object should be frozen
    assertEquals(Object.isFrozen(workspace), true);

    // Should not be able to modify internal state
    try {
      (workspace as any)._value = "modified";
      assertEquals(workspace.value, "test-workspace", "Internal value should not change");
    } catch (error) {
      // Expected in strict mode
      assertEquals(error instanceof TypeError, true);
    }
  }
});

Deno.test("2_structure: value equality semantics", () => {
  const workspace1Result = WorkspaceName.create("same-name");
  const workspace2Result = WorkspaceName.create("same-name");
  const workspace3Result = WorkspaceName.create("different-name");

  assertEquals(workspace1Result.ok, true);
  assertEquals(workspace2Result.ok, true);
  assertEquals(workspace3Result.ok, true);

  if (workspace1Result.ok && workspace2Result.ok && workspace3Result.ok) {
    const workspace1 = workspace1Result.data;
    const workspace2 = workspace2Result.data;
    const workspace3 = workspace3Result.data;

    // Equal values should be equal
    assertEquals(workspace1.equals(workspace2), true);
    assertEquals(workspace2.equals(workspace1), true);

    // Different values should not be equal
    assertEquals(workspace1.equals(workspace3), false);
    assertEquals(workspace3.equals(workspace1), false);

    // Should equal itself
    assertEquals(workspace1.equals(workspace1), true);
  }
});

Deno.test("2_structure: case-sensitive and case-insensitive equality", () => {
  const lowerResult = WorkspaceName.create("lowercase");
  const upperResult = WorkspaceName.create("LOWERCASE");

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
  const result = WorkspaceName.create("Test-Workspace_123");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // Length
    assertEquals(workspace.getLength(), 18);

    // Case checks
    assertEquals(workspace.isLowerCase(), false);

    const lowerResult = WorkspaceName.create("lower-case");
    if (lowerResult.ok) {
      assertEquals(lowerResult.data.isLowerCase(), true);
    }

    // Naming convention checks
    const kebabResult = WorkspaceName.create("kebab-case-name");
    if (kebabResult.ok) {
      assertEquals(kebabResult.data.isKebabCase(), true);
    }

    const snakeResult = WorkspaceName.create("snake_case_name");
    if (snakeResult.ok) {
      assertEquals(snakeResult.data.isSnakeCase(), true);
    }
  }
});

Deno.test("2_structure: production suitability check", () => {
  const prodSuitableCases = [
    { name: "my-project", suitable: true },
    { name: "production-workspace", suitable: true },
    { name: "client-app", suitable: true },
  ];

  const nonProdCases = [
    { name: "temp-workspace", suitable: false },
    { name: "test-env", suitable: false },
    { name: "debug-mode", suitable: false },
    { name: "dev-setup", suitable: false },
    { name: "ab", suitable: false }, // Too short
  ];

  [...prodSuitableCases, ...nonProdCases].forEach(({ name, suitable }) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should create: ${name}`);

    if (result.ok) {
      assertEquals(
        result.data.isSuitableForProduction(),
        suitable,
        `${name} production suitability should be ${suitable}`,
      );
    }
  });
});

Deno.test("2_structure: safe name conversion", () => {
  const problematicResult = WorkspaceName.create("name-with_valid-chars");
  assertEquals(problematicResult.ok, true);

  if (problematicResult.ok) {
    const safeResult = problematicResult.data.toSafeName();
    assertEquals(safeResult.ok, true);

    if (safeResult.ok) {
      // Should remain the same since it's already safe
      assertEquals(safeResult.data.value, "name-with_valid-chars");
    }
  }

  // Test toSafeName with valid workspace name containing special characters
  const validNameResult = WorkspaceName.create("test-name_123");
  assertEquals(validNameResult.ok, true);

  if (validNameResult.ok) {
    const safeConversionResult = validNameResult.data.toSafeName();
    assertEquals(safeConversionResult.ok, true);

    if (safeConversionResult.ok) {
      // Should remain the same since it's already filesystem-safe
      assertEquals(safeConversionResult.data.value, "test-name_123");
    }
  }
});

Deno.test("2_structure: case conversion methods", () => {
  const mixedResult = WorkspaceName.create("Mixed-Case_Name");
  assertEquals(mixedResult.ok, true);

  if (mixedResult.ok) {
    const mixed = mixedResult.data;

    const lowerResult = mixed.toLowerCase();
    assertEquals(lowerResult.ok, true);

    if (lowerResult.ok) {
      assertEquals(lowerResult.data.value, "mixed-case_name");
    }

    // Converting already lowercase should return same instance
    const alreadyLowerResult = WorkspaceName.create("already-lower");
    if (alreadyLowerResult.ok) {
      const sameResult = alreadyLowerResult.data.toLowerCase();
      if (sameResult.ok) {
        assertEquals(sameResult.data, alreadyLowerResult.data);
      }
    }
  }
});

Deno.test("2_structure: prefix and suffix methods", () => {
  const baseResult = WorkspaceName.create("base");
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
    const suffixedResult = base.withSuffix("workspace");
    assertEquals(suffixedResult.ok, true);

    if (suffixedResult.ok) {
      assertEquals(suffixedResult.data.value, "base-workspace");
    }

    // Empty prefix/suffix should fail
    const emptyPrefixResult = base.withPrefix("");
    assertEquals(emptyPrefixResult.ok, false);

    const emptySuffixResult = base.withSuffix("");
    assertEquals(emptySuffixResult.ok, false);
  }
});

Deno.test("2_structure: directory path generation", () => {
  const result = WorkspaceName.create("my-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // Without base path
    assertEquals(workspace.toDirectoryPath(), "my-workspace");

    // With base path
    assertEquals(workspace.toDirectoryPath("/home/user"), "/home/user/my-workspace");
    assertEquals(workspace.toDirectoryPath("./projects"), "./projects/my-workspace");
  }
});

Deno.test("2_structure: string representations", () => {
  const result = WorkspaceName.create("test-workspace");
  assertEquals(result.ok, true);

  if (result.ok) {
    const workspace = result.data;

    // value getter
    assertEquals(workspace.value, "test-workspace");

    // toString() method
    assertEquals(workspace.toString(), "WorkspaceName(test-workspace)");

    // JSON serialization
    assertEquals(workspace.toJSON(), "test-workspace");

    // valueOf for primitive conversion
    assertEquals(workspace.valueOf(), "test-workspace");

    // String concatenation
    assertEquals(`Workspace: ${workspace}`, "Workspace: WorkspaceName(test-workspace)");
  }
});

// ============================================================================
// Error Message Quality and Utility Tests
// ============================================================================

Deno.test("error_formatting: formatWorkspaceNameError produces readable messages", () => {
  const errorCases = [
    {
      input: "",
      shouldContain: ["empty", "cannot be empty"],
    },
    {
      input: "with spaces",
      shouldContain: ["whitespace", "positions"],
    },
    {
      input: "../attack",
      shouldContain: ["suspicious", "path patterns"],
    },
    {
      input: "a".repeat(300),
      shouldContain: ["too long", "255"],
    },
    {
      input: ".hidden",
      shouldContain: ["dot", "hidden"],
    },
    {
      input: "CON",
      shouldContain: ["reserved", "CON"],
    },
    {
      input: "with<invalid>",
      shouldContain: ["invalid characters", "<", ">"],
    },
  ];

  errorCases.forEach(({ input, shouldContain }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);

    if (!result.ok) {
      const message = formatWorkspaceNameError(result.error);
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

Deno.test("deprecated_utility: createWorkspaceName throws on error", () => {
  // Valid name should work
  const validWorkspace = createWorkspaceName("valid-name");
  assertEquals(validWorkspace.value, "valid-name");

  // Invalid name should throw
  let threwError = false;
  try {
    createWorkspaceName("");
  } catch (caughtError) {
    threwError = true;
    assertEquals(caughtError instanceof Error, true);
    assertEquals((caughtError as Error).message.includes("empty"), true);
  }
  assertEquals(threwError, true, "Should throw for invalid names");
});

// ============================================================================
// Collection Utilities Tests
// ============================================================================

Deno.test("collection: WorkspaceNameCollection creation and operations", () => {
  const validNames = ["workspace1", "workspace2", "workspace3"];
  const collectionResult = WorkspaceNameCollection.create(validNames);
  assertEquals(collectionResult.ok, true);

  if (collectionResult.ok) {
    const collection = collectionResult.data;

    // Basic properties
    assertEquals(collection.getCount(), 3);
    assertEquals(collection.isEmpty(), false);

    // Get names
    const names = collection.getNames();
    assertEquals(names, validNames);

    // Get WorkspaceName instances
    const workspaceNames = collection.getWorkspaceNames();
    assertEquals(workspaceNames.length, 3);
    assertEquals(workspaceNames[0].value, "workspace1");
  }
});

Deno.test("collection: WorkspaceNameCollection contains method", () => {
  const validNames = ["workspace1", "workspace2", "workspace3"];
  const collectionResult = WorkspaceNameCollection.create(validNames);
  const searchResult = WorkspaceName.create("workspace1");
  const notFoundResult = WorkspaceName.create("workspace4");

  assertEquals(collectionResult.ok, true);
  assertEquals(searchResult.ok, true);
  assertEquals(notFoundResult.ok, true);

  if (collectionResult.ok && searchResult.ok && notFoundResult.ok) {
    const collection = collectionResult.data;
    const search = searchResult.data;
    const notFound = notFoundResult.data;

    assertEquals(collection.contains(search), true);
    assertEquals(collection.contains(notFound), false);
  }
});

Deno.test("collection: WorkspaceNameCollection production filtering", () => {
  const mixedNames = ["production-app", "temp-workspace", "client-project", "test-env"];
  const collectionResult = WorkspaceNameCollection.create(mixedNames);
  assertEquals(collectionResult.ok, true);

  if (collectionResult.ok) {
    const collection = collectionResult.data;
    const productionOnly = collection.filterProductionSuitable();

    const prodNames = productionOnly.getNames();
    assertEquals(prodNames.includes("production-app"), true);
    assertEquals(prodNames.includes("client-project"), true);
    assertEquals(prodNames.includes("temp-workspace"), false);
    assertEquals(prodNames.includes("test-env"), false);
  }
});

Deno.test("collection: WorkspaceNameCollection error propagation", () => {
  const invalidNames = ["valid1", "", "valid2"]; // Contains empty name
  const collectionResult = WorkspaceNameCollection.create(invalidNames);
  assertEquals(collectionResult.ok, false);

  if (!collectionResult.ok) {
    assertEquals(collectionResult.error.kind, "EmptyName");
  }
});

Deno.test("collection: empty WorkspaceNameCollection", () => {
  const emptyResult = WorkspaceNameCollection.create([]);
  assertEquals(emptyResult.ok, true);

  if (emptyResult.ok) {
    const empty = emptyResult.data;
    assertEquals(empty.isEmpty(), true);
    assertEquals(empty.getCount(), 0);
    assertEquals(empty.getNames().length, 0);
  }
});
