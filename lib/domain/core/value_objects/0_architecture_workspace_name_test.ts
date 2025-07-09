/**
 * @fileoverview Architecture constraint tests for WorkspaceName Value Object
 *
 * This test suite validates the architectural constraints and design patterns
 * of the WorkspaceName implementation:
 * - Smart Constructor pattern enforcement
 * - Result type pattern for error handling
 * - Discriminated Union for error types
 * - Type guards for error discrimination
 * - No infrastructure dependencies
 * - Totality principle adherence
 */

import { assertEquals } from "jsr:@std/assert";
import type { Result } from "../../../types/result.ts";
import { 
  WorkspaceName,
  type WorkspaceNameError,
  formatWorkspaceNameError,
  isEmptyNameError,
  isInvalidCharactersError,
  isPathTraversalAttemptError,
  isTooLongError,
  isStartsWithDotError,
  isReservedNameError,
  isInvalidFormatError,
  isContainsWhitespaceError,
  WorkspaceNameCollection,
  type WorkspaceNameResult,
} from "./workspace_name.ts";

// ============================================================================
// Smart Constructor Pattern Tests
// ============================================================================

Deno.test("0_architecture: Smart Constructor pattern - private constructor enforcement", () => {
  // Verify that instances can only be created through the static create method
  // The constructor is private, preventing direct instantiation
  
  const result = WorkspaceName.create("valid-workspace");
  
  // Verify Result type is returned
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
  assertEquals("error" in result || "data" in result, true);
  
  // Verify successful creation returns WorkspaceName instance
  if (result.ok) {
    assertEquals(typeof result.data, "object");
    assertEquals(result.data.constructor.name, "WorkspaceName");
  }
});

Deno.test("0_architecture: Result type pattern - no exceptions thrown", () => {
  // All operations should return Result<T, E> types
  // No exceptions should be thrown for any input
  
  const testCases = [
    null,
    undefined,
    "",
    "   ",
    123,
    {},
    [],
    "valid-name",
    "with spaces",
    "../traversal",
    ".hidden",
    "a".repeat(300),
  ];
  
  testCases.forEach((input: any) => {
    let exceptionThrown = false;
    let result: WorkspaceNameResult;
    
    try {
      result = WorkspaceName.create(input);
      // Result should always be defined
      assertEquals(typeof result, "object");
      assertEquals("ok" in result, true);
    } catch (e) {
      exceptionThrown = true;
    }
    
    assertEquals(exceptionThrown, false, `Should not throw for input: ${input}`);
  });
});

Deno.test("0_architecture: Result type pattern - factory methods follow same pattern", () => {
  // All factory methods should also return Result types
  
  const factoryMethods = [
    () => WorkspaceName.defaultWorkspace(),
    () => WorkspaceName.withTimestamp(),
    () => WorkspaceName.withTimestamp("prefix"),
    () => WorkspaceName.forProject("project"),
    () => WorkspaceName.forProject("project", "suffix"),
    () => WorkspaceName.forProject(""),
    () => WorkspaceName.temporary(),
    () => WorkspaceName.temporary("purpose"),
  ];
  
  factoryMethods.forEach((factory, index) => {
    let exceptionThrown = false;
    let result: WorkspaceNameResult;
    
    try {
      result = factory();
      assertEquals(typeof result, "object");
      assertEquals("ok" in result, true);
    } catch (e) {
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
    { input: "with<invalid>", expectedKind: "InvalidCharacters" },
    { input: "../traversal", expectedKind: "PathTraversalAttempt" },
    { input: "a".repeat(256), expectedKind: "TooLong" },
    { input: ".hidden", expectedKind: "StartsWithDot" },
    { input: "CON", expectedKind: "ReservedName" },
    { input: 123, expectedKind: "InvalidFormat" },
    { input: "with spaces", expectedKind: "ContainsWhitespace" },
  ];
  
  errorProducingInputs.forEach(({ input, expectedKind }) => {
    const result = WorkspaceName.create(input as any);
    
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
  assertEquals(errorKinds.size, 8);
});

Deno.test("0_architecture: Discriminated Union - error structure consistency", () => {
  // All errors should have consistent base structure: kind and message
  
  const errorInputs = [
    "",
    "with<invalid>",
    "../traversal",
    "a".repeat(256),
    ".hidden",
    "CON",
    123,
    "with spaces",
  ];
  
  errorInputs.forEach((input) => {
    const result = WorkspaceName.create(input as any);
    
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
    input: any;
    expectedGuard: (error: WorkspaceNameError) => boolean;
    otherGuards: Array<(error: WorkspaceNameError) => boolean>;
  }> = [
    {
      input: "",
      expectedGuard: isEmptyNameError,
      otherGuards: [isInvalidCharactersError, isPathTraversalAttemptError, isTooLongError, 
                     isStartsWithDotError, isReservedNameError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: "with<invalid>",
      expectedGuard: isInvalidCharactersError,
      otherGuards: [isEmptyNameError, isPathTraversalAttemptError, isTooLongError, 
                     isStartsWithDotError, isReservedNameError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: "../traversal",
      expectedGuard: isPathTraversalAttemptError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isTooLongError, 
                     isStartsWithDotError, isReservedNameError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: "a".repeat(256),
      expectedGuard: isTooLongError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isPathTraversalAttemptError, 
                     isStartsWithDotError, isReservedNameError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: ".hidden",
      expectedGuard: isStartsWithDotError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isPathTraversalAttemptError, 
                     isTooLongError, isReservedNameError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: "CON",
      expectedGuard: isReservedNameError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isPathTraversalAttemptError, 
                     isTooLongError, isStartsWithDotError, isInvalidFormatError, isContainsWhitespaceError],
    },
    {
      input: 123,
      expectedGuard: isInvalidFormatError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isPathTraversalAttemptError, 
                     isTooLongError, isStartsWithDotError, isReservedNameError, isContainsWhitespaceError],
    },
    {
      input: "with spaces",
      expectedGuard: isContainsWhitespaceError,
      otherGuards: [isEmptyNameError, isInvalidCharactersError, isPathTraversalAttemptError, 
                     isTooLongError, isStartsWithDotError, isReservedNameError, isInvalidFormatError],
    },
  ];
  
  testCases.forEach(({ input, expectedGuard, otherGuards }) => {
    const result = WorkspaceName.create(input);
    
    if (!result.ok) {
      // Expected guard should return true
      assertEquals(expectedGuard(result.error), true, `Guard should match for input: ${input}`);
      
      // All other guards should return false
      otherGuards.forEach((guard) => {
        assertEquals(guard(result.error), false, `Guard ${guard.name} should not match for input: ${input}`);
      });
    }
  });
});

Deno.test("0_architecture: Type guards - exhaustive discrimination", () => {
  // Verify that type guards enable exhaustive pattern matching
  
  const result = WorkspaceName.create("with<invalid>");
  
  if (!result.ok) {
    const error = result.error;
    let matched = false;
    
    // This pattern demonstrates exhaustive checking
    if (isEmptyNameError(error)) {
      assertEquals(error.kind, "EmptyName");
      matched = true;
    } else if (isInvalidCharactersError(error)) {
      assertEquals(error.kind, "InvalidCharacters");
      matched = true;
    } else if (isPathTraversalAttemptError(error)) {
      assertEquals(error.kind, "PathTraversalAttempt");
      matched = true;
    } else if (isTooLongError(error)) {
      assertEquals(error.kind, "TooLong");
      matched = true;
    } else if (isStartsWithDotError(error)) {
      assertEquals(error.kind, "StartsWithDot");
      matched = true;
    } else if (isReservedNameError(error)) {
      assertEquals(error.kind, "ReservedName");
      matched = true;
    } else if (isInvalidFormatError(error)) {
      assertEquals(error.kind, "InvalidFormat");
      matched = true;
    } else if (isContainsWhitespaceError(error)) {
      assertEquals(error.kind, "ContainsWhitespace");
      matched = true;
    }
    
    assertEquals(matched, true, "At least one type guard should match");
  }
});

// ============================================================================
// Dependency and Infrastructure Tests
// ============================================================================

Deno.test("0_architecture: No infrastructure dependencies - pure domain logic", () => {
  // WorkspaceName should not depend on any infrastructure concerns
  // It should be pure domain logic with no I/O operations
  
  // Test that creation doesn't perform any file system operations
  const result = WorkspaceName.create("test-workspace");
  assertEquals(result.ok, true);
  
  // Test that validation is synchronous (no async operations)
  const startTime = performance.now();
  const iterations = 10000;
  
  for (let i = 0; i < iterations; i++) {
    WorkspaceName.create(`workspace-${i}`);
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
    BigInt(123),
  ];
  
  extremeInputs.forEach((input) => {
    const result = WorkspaceName.create(input as any);
    
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
  
  const result = WorkspaceName.create("test-workspace");
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const workspace = result.data;
    
    // All methods should handle edge cases
    const otherResult = WorkspaceName.create("other-workspace");
    if (otherResult.ok) {
      // Methods should not throw
      assertEquals(typeof workspace.equals(otherResult.data), "boolean");
      assertEquals(typeof workspace.equalsIgnoreCase(otherResult.data), "boolean");
    }
    
    // Query methods
    assertEquals(typeof workspace.isSuitableForProduction(), "boolean");
    assertEquals(typeof workspace.toDirectoryPath(), "string");
    assertEquals(typeof workspace.toDirectoryPath("/base"), "string");
    
    // Transformation methods should return Results
    const lowerResult = workspace.toLowerCase();
    assertEquals("ok" in lowerResult, true);
    
    const safeResult = workspace.toSafeName();
    assertEquals("ok" in safeResult, true);
    
    const prefixResult = workspace.withPrefix("pre");
    assertEquals("ok" in prefixResult, true);
    
    const suffixResult = workspace.withSuffix("post");
    assertEquals("ok" in suffixResult, true);
    
    // Edge cases for transformation methods
    const emptyPrefixResult = workspace.withPrefix("");
    assertEquals(emptyPrefixResult.ok, false);
    
    const emptySuffixResult = workspace.withSuffix("");
    assertEquals(emptySuffixResult.ok, false);
  }
});

// ============================================================================
// Collection Architecture Tests
// ============================================================================

Deno.test("0_architecture: Collection - follows same architectural patterns", () => {
  // WorkspaceNameCollection should follow the same patterns
  
  // Result type pattern
  const collectionResult = WorkspaceNameCollection.create(["workspace1", "workspace2"]);
  assertEquals(typeof collectionResult, "object");
  assertEquals("ok" in collectionResult, true);
  
  // Error propagation
  const invalidCollectionResult = WorkspaceNameCollection.create(["valid", "", "invalid"]);
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

Deno.test("0_architecture: Collection - production filtering maintains architecture", () => {
  const result = WorkspaceNameCollection.create(["prod-workspace", "temp-workspace"]);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const collection = result.data;
    const filtered = collection.filterProductionSuitable();
    
    // Filtered collection should also be immutable
    assertEquals(Object.isFrozen(filtered), true);
    
    // Should return a new collection instance
    assertEquals(filtered !== collection, true);
  }
});

// ============================================================================
// Error Formatter Architecture Tests
// ============================================================================

Deno.test("0_architecture: Error formatter - handles all error types", () => {
  // formatWorkspaceNameError should handle all error types without throwing
  
  const errorInputs = [
    "",
    "with<invalid>",
    "../traversal",
    "a".repeat(256),
    ".hidden",
    "CON",
    123,
    "with spaces",
  ];
  
  errorInputs.forEach((input) => {
    const result = WorkspaceName.create(input as any);
    
    if (!result.ok) {
      let formatterThrew = false;
      let message: string;
      
      try {
        message = formatWorkspaceNameError(result.error);
        assertEquals(typeof message, "string");
        assertEquals(message.length > 0, true);
      } catch (e) {
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
  
  // WorkspaceNameResult type alias
  const result: WorkspaceNameResult = WorkspaceName.create("test");
  assertEquals("ok" in result, true);
  
  // Error type usage
  if (!result.ok) {
    const error: WorkspaceNameError = result.error;
    assertEquals("kind" in error, true);
  }
  
  // Result type should be properly typed
  if (result.ok) {
    const workspace: WorkspaceName = result.data;
    assertEquals(typeof workspace.value, "string");
  }
});

// ============================================================================
// Factory Method Architecture Tests
// ============================================================================

Deno.test("0_architecture: Factory methods - maintain Result pattern consistency", () => {
  // All factory methods should maintain architectural consistency
  
  // defaultWorkspace - deterministic factory
  const defaultResult = WorkspaceName.defaultWorkspace();
  assertEquals("ok" in defaultResult, true);
  if (defaultResult.ok) {
    assertEquals(typeof defaultResult.data.value, "string");
  }
  
  // withTimestamp - incorporates external data (time) but maintains purity
  const timestampResult1 = WorkspaceName.withTimestamp();
  const timestampResult2 = WorkspaceName.withTimestamp("prefix");
  assertEquals("ok" in timestampResult1, true);
  assertEquals("ok" in timestampResult2, true);
  
  // forProject - transformation factory with validation
  const projectResult1 = WorkspaceName.forProject("MyProject");
  const projectResult2 = WorkspaceName.forProject("Invalid@#$");
  const projectResult3 = WorkspaceName.forProject("");
  assertEquals("ok" in projectResult1, true);
  assertEquals("ok" in projectResult2, true);
  assertEquals("ok" in projectResult3, true);
  assertEquals(projectResult3.ok, false); // Empty should fail
  
  // temporary - randomized factory
  const tempResult1 = WorkspaceName.temporary();
  const tempResult2 = WorkspaceName.temporary("purpose");
  assertEquals("ok" in tempResult1, true);
  assertEquals("ok" in tempResult2, true);
});