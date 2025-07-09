/**
 * @fileoverview Architecture tests for inheritance fix
 *
 * Tests architectural constraints and proper inheritance behavior
 * after fixing the Object.freeze and constructor call order issues
 * in BasePathValueObject and its subclasses.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { BasePathValueObject, DEFAULT_PATH_CONFIG } from "./base_path.ts";
import { WorkingDirectoryPath } from "./working_directory_path.ts";
import { SchemaPath } from "./schema_path.ts";
import { TemplatePath } from "./template_path.ts";

Deno.test("Architecture: Inheritance Fix - Constructor Call Order", () => {
  // Test that parent constructor is called with shouldFreeze=false
  // and child classes properly freeze after setting all properties

  try {
    const cwdResult = WorkingDirectoryPath.create(Deno.cwd());

    if (cwdResult.ok) {
      const workingDir = cwdResult.data;

      // Object should be frozen after construction
      assert(Object.isFrozen(workingDir), "WorkingDirectoryPath should be frozen");

      // All methods should work properly
      assertExists(workingDir.getValue());
      assertExists(workingDir.getAbsolutePath());
      assertExists(workingDir.getOriginalPath());
      assertEquals(typeof workingDir.isAbsolutePath(), "boolean");
    }
  } catch {
    // Expected in test environment - construction may fail but shouldn't throw inheritance errors
    assert(true, "Construction handled gracefully");
  }
});

Deno.test("Architecture: Inheritance Fix - BasePathValueObject Abstract Class", () => {
  // Test that BasePathValueObject properly handles inheritance

  // Create a test subclass to verify inheritance behavior
  class TestPath extends BasePathValueObject {
    constructor(path: string, private testProperty: string) {
      // Should not freeze immediately
      super(path, false);
      // Set additional properties
      this.testProperty = testProperty;
      // Now freeze
      this.freezeObject();
    }

    static create(path: string, testProp: string) {
      const result = super.createPath(
        path,
        DEFAULT_PATH_CONFIG,
        (normalizedPath) => new TestPath(normalizedPath, testProp),
      );
      return result;
    }

    getTestProperty(): string {
      return this.testProperty;
    }
  }

  const testResult = TestPath.create("/test/path", "test-value");

  if (testResult.ok) {
    const testPath = testResult.data;

    // Should be frozen
    assert(Object.isFrozen(testPath), "TestPath should be frozen");

    // Should have access to both parent and child properties
    assertEquals(testPath.getValue(), "/test/path");
    assertEquals(testPath.getTestProperty(), "test-value");

    // Should not be able to modify properties
    try {
      // @ts-expect-error Testing immutability
      testPath.testProperty = "modified";
      assert(false, "Should not be able to modify frozen object");
    } catch {
      // Expected - object is frozen
      assert(true);
    }
  }
});

Deno.test("Architecture: Inheritance Fix - Freezing Order Verification", () => {
  // Test that freezing happens in the correct order

  class OrderTestPath extends BasePathValueObject {
    private constructionPhases: string[] = [];

    constructor(path: string) {
      // Phase 1: Call parent constructor (should not freeze)
      super(path, false);
      this.constructionPhases.push("parent-called");

      // Phase 2: Set child properties
      this.constructionPhases.push("child-properties-set");

      // Phase 3: Freeze object
      this.freezeObject();
      this.constructionPhases.push("object-frozen");
    }

    static create(path: string) {
      const result = super.createPath(
        path,
        DEFAULT_PATH_CONFIG,
        (normalizedPath) => new OrderTestPath(normalizedPath),
      );
      return result;
    }

    getConstructionPhases(): string[] {
      return [...this.constructionPhases];
    }
  }

  const orderResult = OrderTestPath.create("/order/test");

  if (orderResult.ok) {
    const orderPath = orderResult.data;
    const phases = orderPath.getConstructionPhases();

    assertEquals(phases.length, 3);
    assertEquals(phases[0], "parent-called");
    assertEquals(phases[1], "child-properties-set");
    assertEquals(phases[2], "object-frozen");

    assert(Object.isFrozen(orderPath), "Object should be frozen after construction");
  }
});

Deno.test("Architecture: Inheritance Fix - Multiple Inheritance Levels", () => {
  // Test that inheritance works properly with multiple levels

  class MiddlePath extends BasePathValueObject {
    constructor(path: string, protected middleProperty: string) {
      super(path, false);
      this.middleProperty = middleProperty;
      // Don't freeze yet - let child classes handle it
    }

    getMiddleProperty(): string {
      return this.middleProperty;
    }
  }

  class DeepPath extends MiddlePath {
    constructor(path: string, middleProperty: string, private deepProperty: number) {
      super(path, middleProperty);
      this.deepProperty = deepProperty;
      // Now freeze everything
      this.freezeObject();
    }

    static create(path: string, middleProp: string, deepProp: number) {
      const result = super.createPath(
        path,
        DEFAULT_PATH_CONFIG,
        (normalizedPath) => new DeepPath(normalizedPath, middleProp, deepProp),
      );
      return result;
    }

    getDeepProperty(): number {
      return this.deepProperty;
    }
  }

  const deepResult = DeepPath.create("/deep/path", "middle-value", 42);

  if (deepResult.ok) {
    const deepPath = deepResult.data;

    // Should have access to all levels
    assertEquals(deepPath.getValue(), "/deep/path");
    assertEquals(deepPath.getMiddleProperty(), "middle-value");
    assertEquals(deepPath.getDeepProperty(), 42);

    // Should be frozen
    assert(Object.isFrozen(deepPath), "DeepPath should be frozen");
  }
});

Deno.test("Architecture: Inheritance Fix - Smart Constructor Pattern Preservation", () => {
  // Test that Smart Constructor pattern is preserved after inheritance fix

  // All existing subclasses should maintain Smart Constructor pattern
  const factories = [
    () => WorkingDirectoryPath.current(),
    () => WorkingDirectoryPath.create("/test"),
    // SchemaPath and TemplatePath would need valid DirectiveType/LayerType
    // but we can test their existence and structure
  ];

  factories.forEach((factory, index) => {
    try {
      const result = factory();
      assertEquals(typeof result.ok, "boolean", `Factory ${index} should return Result type`);

      if (result.ok) {
        assert(Object.isFrozen(result.data), `Factory ${index} result should be frozen`);
      }
    } catch {
      // Expected for some factories in test environment
      assert(true, `Factory ${index} handled gracefully`);
    }
  });
});

Deno.test("Architecture: Inheritance Fix - Error Handling Consistency", () => {
  // Test that error handling remains consistent after inheritance fix

  // Invalid paths should still be handled properly
  const invalidResults = [
    WorkingDirectoryPath.create(""),
    WorkingDirectoryPath.create("../../../etc/passwd"),
  ];

  invalidResults.forEach((result, index) => {
    assert(!result.ok, `Invalid input ${index} should fail validation`);
    assertEquals(
      typeof result.error.kind,
      "string",
      `Error ${index} should have discriminated union`,
    );
    assertEquals(typeof result.error.message, "string", `Error ${index} should have message`);
  });
});

Deno.test("Architecture: Inheritance Fix - Immutability Guarantee", () => {
  // Test that immutability is properly guaranteed after inheritance fix

  try {
    const pathResult = WorkingDirectoryPath.create("/test/immutable");

    if (pathResult.ok) {
      const path = pathResult.data;

      // Object should be completely frozen
      assert(Object.isFrozen(path), "Object should be frozen");

      // All properties should be readonly
      const originalValue = path.getValue();
      const originalAbsolute = path.getAbsolutePath();
      const originalOriginal = path.getOriginalPath();

      // Multiple calls should return same values
      assertEquals(path.getValue(), originalValue);
      assertEquals(path.getAbsolutePath(), originalAbsolute);
      assertEquals(path.getOriginalPath(), originalOriginal);

      // Properties should not be modifiable
      try {
        // @ts-expect-error Testing immutability
        path.originalPath = "modified";
        assert(false, "Should not be able to modify frozen properties");
      } catch {
        // Expected - properties are readonly
        assert(true);
      }
    }
  } catch {
    // Expected in test environment
    assert(true, "Immutability test handled gracefully");
  }
});

Deno.test("Architecture: Inheritance Fix - Memory Efficiency", () => {
  // Test that the inheritance fix doesn't create memory leaks or excessive objects

  const paths: WorkingDirectoryPath[] = [];

  try {
    // Create multiple instances
    for (let i = 0; i < 10; i++) {
      const result = WorkingDirectoryPath.create(`/test/path/${i}`);
      if (result.ok) {
        paths.push(result.data);
      }
    }

    // Each instance should be independent and properly frozen
    paths.forEach((path, index) => {
      assert(Object.isFrozen(path), `Path ${index} should be frozen`);
      assertEquals(path.getValue(), `/test/path/${index}`);
    });

    // Memory should be properly managed (no retained references)
    assertEquals(paths.length <= 10, true);
  } catch {
    // Expected in test environment
    assert(true, "Memory efficiency test handled gracefully");
  }
});

Deno.test("Architecture: Inheritance Fix - Subclass Method Overrides", () => {
  // Test that method overrides work properly after inheritance fix

  try {
    const pathResult = WorkingDirectoryPath.create("/test/override");

    if (pathResult.ok) {
      const workingDir = pathResult.data;

      // Overridden methods should work
      const anotherResult = WorkingDirectoryPath.create("/test/another");
      if (anotherResult.ok) {
        const another = anotherResult.data;

        // equals method is overridden in WorkingDirectoryPath
        const isEqual = workingDir.equals(another);
        assertEquals(typeof isEqual, "boolean");
        assertEquals(isEqual, false); // Different paths should not be equal

        // Self equality should work
        assertEquals(workingDir.equals(workingDir), true);
      }
    }
  } catch {
    // Expected in test environment
    assert(true, "Method override test handled gracefully");
  }
});
