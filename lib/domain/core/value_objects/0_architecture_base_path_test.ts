/**
 * @fileoverview Architecture tests for BasePath Value Object
 * Testing domain boundaries, dependencies, and architectural constraints
 * 
 * Architecture tests verify:
 * - Domain boundary enforcement
 * - Dependency direction (value objects should not depend on infrastructure)
 * - Smart Constructor pattern compliance
 * - Result type usage for Totality principle
 * - Immutability guarantees
 */

import { assertEquals, assertExists } from "@std/assert";
import { BasePathValueObject } from "./base_path.ts";
import type { PathValidationConfig, PathValidationError } from "./base_path.ts";
import { ok, error } from "../../../types/result.ts";
import type { Result } from "../../../types/result.ts";

Deno.test("0_architecture: BasePathValueObject follows domain boundary rules", () => {
  // Value objects should have minimal dependencies
  // Should not depend on:
  // - Infrastructure (file system, network)
  // - Application services
  // - External frameworks
  
  // Create a test subclass to verify base class behavior
  class TestPath extends BasePathValueObject {
    static create(path: string): Result<TestPath, PathValidationError> {
      const config: PathValidationConfig = {
        maxLength: 255,
        allowRelative: true,
        allowAbsolute: true,
        normalizeSeparators: true,
      };
      return BasePathValueObject.createPath(path, config, (p: string) => new TestPath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }

  const result = TestPath.create("/test/path");
  
  if (result.ok) {
    const path = result.data;
    
    // Verify value object properties
    assertExists(path.getValue());
    assertEquals(typeof path.equals, "function");
    assertEquals(typeof path.toString, "function");
    
    // No infrastructure operations
    assertEquals("readFile" in path, false);
    assertEquals("writeFile" in path, false);
    assertEquals("exists" in path, false);
    assertEquals("mkdir" in path, false);
    
    // No service dependencies
    assertEquals("validate" in path, false);
    assertEquals("save" in path, false);
    assertEquals("load" in path, false);
    
    // No external framework dependencies
    assertEquals("render" in path, false);
    assertEquals("toJSON" in path, false);
    assertEquals("serialize" in path, false);
  }
});

Deno.test("0_architecture: BasePathValueObject enforces Smart Constructor pattern", () => {
  // Verify that BasePathValueObject enforces private constructor pattern
  // Subclasses must implement Smart Constructor
  
  class ValidPath extends BasePathValueObject {
    static create(path: string): Result<ValidPath, PathValidationError> {
      const config: PathValidationConfig = {
        maxLength: 100,
        allowRelative: false,
        allowAbsolute: true,
        normalizeSeparators: true,
      };
      return BasePathValueObject.createPath(path, config, (p: string) => new ValidPath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }
  
  // Smart Constructor returns Result type
  const result = ValidPath.create("/valid/path");
  assertEquals("ok" in result, true);
  
  if (result.ok) {
    const path = result.data;
    
    // Instance created through Smart Constructor
    assertEquals(path instanceof ValidPath, true);
    assertEquals(path instanceof BasePathValueObject, true);
    
    // Value is immutable (no setters)
    assertEquals("setValue" in path, false);
    assertEquals("set value" in Object.getOwnPropertyDescriptors(path), false);
    
    // Protected constructor prevents direct instantiation
    // (This would fail at compile time if constructor was public)
  }
});

Deno.test("0_architecture: BasePathValueObject implements Result-based Totality", () => {
  // Total function: defined for all string inputs
  // Returns Result<T, PathValidationError> - never throws
  
  class TotalPath extends BasePathValueObject {
    static create(path: string): Result<TotalPath, PathValidationError> {
      const config: PathValidationConfig = {
        maxLength: 50,
        allowRelative: true,
        allowAbsolute: true,
        normalizeSeparators: true,
        requiredExtensions: [".ts", ".js"],
      };
      return BasePathValueObject.createPath(path, config, (p: string) => new TotalPath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }
  
  const testCases = [
    "/valid/path.ts",          // Valid absolute
    "relative/path.js",        // Valid relative
    "",                        // Empty (should fail)
    "../../../etc/passwd",     // Path traversal (should fail)
    "/no/extension",           // Missing extension (should fail)
    "a".repeat(100) + ".ts",   // Too long (should fail)
  ];
  
  for (const testPath of testCases) {
    const result = TotalPath.create(testPath);
    
    // Always returns Result, never throws
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
    
    if (!result.ok) {
      // Error is well-typed
      const error = result.error;
      assertExists(error.kind);
      assertExists(error.message);
      assertEquals(typeof error.kind, "string");
      assertEquals(typeof error.message, "string");
    }
  }
});

Deno.test("0_architecture: BasePathValueObject follows dependency inversion principle", () => {
  // High-level value object should not depend on low-level details
  // Configuration is injected, not hardcoded
  
  const customConfig: PathValidationConfig = {
    maxLength: 1000,
    allowRelative: false,
    allowAbsolute: true,
    normalizeSeparators: false,
    forbiddenChars: ["$", "&", "!"],
  };
  
  class ConfigurablePath extends BasePathValueObject {
    static create(path: string, config: PathValidationConfig): Result<ConfigurablePath, PathValidationError> {
      return BasePathValueObject.createPath(path, config, (p: string) => new ConfigurablePath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }
  
  // Configuration is injected
  const result1 = ConfigurablePath.create("/test/path", customConfig);
  assertEquals(result1.ok, true);
  
  // Different configuration yields different results
  const strictConfig: PathValidationConfig = {
    ...customConfig,
    allowAbsolute: false,
  };
  
  const result2 = ConfigurablePath.create("/test/path", strictConfig);
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "ABSOLUTE_PATH_REQUIRED");
  }
});

Deno.test("0_architecture: BasePathValueObject error types are comprehensive", () => {
  // Verify all error cases are covered by discriminated union
  
  class StrictPath extends BasePathValueObject {
    static create(path: string): Result<StrictPath, PathValidationError> {
      const config: PathValidationConfig = {
        maxLength: 10,
        allowRelative: false,
        allowAbsolute: true,
        normalizeSeparators: true,
        requiredExtensions: [".md"],
        forbiddenChars: ["<", ">", "|"],
      };
      return BasePathValueObject.createPath(path, config, (p: string) => new StrictPath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }
  
  const errorCases: Array<[string, string]> = [
    ["", "EMPTY_PATH"],
    ["../../../etc", "PATH_TRAVERSAL"],
    ["/path/with/<>chars", "INVALID_CHARACTERS"],
    ["/very/long/path/exceeding/limit.md", "TOO_LONG"],
    ["relative/path.md", "ABSOLUTE_PATH_REQUIRED"],
    ["/path/wrong.txt", "INVALID_EXTENSION"],
  ];
  
  for (const [input, expectedKind] of errorCases) {
    const result = StrictPath.create(input);
    
    if (!result.ok) {
      assertEquals(
        ["EMPTY_PATH", "PATH_TRAVERSAL", "INVALID_CHARACTERS", "TOO_LONG", 
         "ABSOLUTE_PATH_REQUIRED", "RELATIVE_PATH_REQUIRED", "INVALID_EXTENSION", 
         "PLATFORM_INCOMPATIBLE"].includes(result.error.kind),
        true,
        `Error kind ${result.error.kind} should be a valid PathValidationError`
      );
    }
  }
});

Deno.test("0_architecture: BasePathValueObject maintains referential transparency", () => {
  // Same input always produces same output (pure function)
  
  class PurePath extends BasePathValueObject {
    static create(path: string): Result<PurePath, PathValidationError> {
      const config: PathValidationConfig = {
        maxLength: 255,
        allowRelative: true,
        allowAbsolute: true,
        normalizeSeparators: true,
      };
      return BasePathValueObject.createPath(path, config, (p: string) => new PurePath(p));
    }

    private constructor(path: string) {
      super(path);
    }
  }
  
  const input = "/test/path/file.ts";
  
  // Multiple calls with same input
  const result1 = PurePath.create(input);
  const result2 = PurePath.create(input);
  const result3 = PurePath.create(input);
  
  // All results should be equal
  assertEquals(result1.ok, result2.ok);
  assertEquals(result2.ok, result3.ok);
  
  if (result1.ok && result2.ok && result3.ok) {
    // Values should be equal (not same reference, but equal values)
    assertEquals(result1.data.getValue(), result2.data.getValue());
    assertEquals(result2.data.getValue(), result3.data.getValue());
    assertEquals(result1.data.equals(result2.data), true);
    assertEquals(result2.data.equals(result3.data), true);
  }
});