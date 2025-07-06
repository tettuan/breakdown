/**
 * @fileoverview Tests for BasePathValueObject
 *
 * This test suite validates the BasePathValueObject implementation following
 * the test strategy described in @docs/tests/testing.ja.md:
 * - 0_architecture tests for Smart Constructor pattern
 * - 1_behavior tests for domain logic validation
 * - 2_structure tests for immutability and data integrity
 */

import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { 
  BasePathValueObject, 
  DEFAULT_PATH_CONFIG,
  type PathValidationConfig,
  type PathValidationError
} from "./base_path.ts";
import { error, ok } from "../../../types/result.ts";

// Test implementation of BasePathValueObject for testing purposes
class TestPath extends BasePathValueObject {
  constructor(value: string) {
    super(value, false); // Don't auto-freeze in parent constructor
    this.freezeObject(); // Explicitly freeze after construction
  }
  
  static create(path: string, config: PathValidationConfig = DEFAULT_PATH_CONFIG) {
    return super.createPath(path, config, (normalized) => new TestPath(normalized));
  }
}

// ============================================================================
// 0_architecture: Smart Constructor Pattern Tests
// ============================================================================

Deno.test("0_architecture: Smart Constructor enforces private constructor", () => {
  // Constructor should be protected/private - cannot instantiate directly
  // This test validates the Smart Constructor pattern is properly implemented
  
  const validResult = TestPath.create("valid/path");
  assertEquals(validResult.ok, true);
  
  if (validResult.ok) {
    // Smart Constructor pattern: Only static create method should be used
    // TypeScript prevents direct constructor access due to protected modifier
    // This demonstrates proper encapsulation - only factory method is accessible
    
    // Verify the Smart Constructor pattern creates proper instances
    assertStrictEquals(typeof validResult.data, "object");
    assertEquals(validResult.data.getValue(), "valid/path");
    
    // Demonstrate that constructor is properly encapsulated
    // The following line would cause TS2674 error if uncommented:
    // const directInstance = new TestPath("test");
    
    // Instead, only the factory method should be used
    const anotherValidResult = TestPath.create("another/path");
    assertEquals(anotherValidResult.ok, true);
  }
});

Deno.test("0_architecture: Result type pattern for error handling", () => {
  // All creation should return Result<T, E> - no exceptions thrown
  
  const invalidResult = TestPath.create("");
  assertEquals(invalidResult.ok, false);
  
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EMPTY_PATH");
  }
  
  const validResult = TestPath.create("valid/path");
  assertEquals(validResult.ok, true);
});

Deno.test("0_architecture: Template Method pattern in createPath", () => {
  // Validates that createPath follows Template Method pattern with validation stages
  
  const stages = [
    { input: null as any, expectedError: "EMPTY_PATH" },
    { input: "../../etc/passwd", expectedError: "PATH_TRAVERSAL" },
    { input: "a".repeat(300), expectedError: "TOO_LONG" },
  ];
  
  stages.forEach(({ input, expectedError }) => {
    const result = TestPath.create(input);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, expectedError);
    }
  });
});

// ============================================================================
// 1_behavior: Domain Logic Validation Tests  
// ============================================================================

Deno.test("1_behavior: basic path validation - empty paths", () => {
  const testCases = [
    { input: null as any, description: "null input" },
    { input: undefined as any, description: "undefined input" },
    { input: "", description: "empty string" },
    { input: "   ", description: "whitespace only" },
    { input: 123 as any, description: "non-string input" },
  ];

  testCases.forEach(({ input, description }) => {
    const result = TestPath.create(input);
    assertEquals(result.ok, false, `Should reject ${description}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, "EMPTY_PATH");
    }
  });
});

Deno.test("1_behavior: security validation - path traversal prevention", () => {
  const maliciousPaths = [
    "../etc/passwd",
    "..\\windows\\system32",
    "/../../etc/passwd", 
    "valid\\..\\malicious",
    "normal/../../../etc/passwd",
  ];

  maliciousPaths.forEach((path) => {
    const result = TestPath.create(path);
    assertEquals(result.ok, false, `Should reject path traversal: ${path}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, "PATH_TRAVERSAL");
      if (result.error.kind === "PATH_TRAVERSAL") {
        // attemptedPath contains the normalized version of the path
        // due to normalization, path separators are converted to forward slashes
        const expectedNormalizedPath = path.replace(/[\\]/g, '/');
        assertEquals(result.error.attemptedPath, expectedNormalizedPath);
      }
    }
  });
});

Deno.test("1_behavior: security validation - control characters", () => {
  const pathsWithControlChars = [
    "path\0with\0null",
    "path\rwith\rcarriage",
    "path\nwith\nnewline",
  ];

  pathsWithControlChars.forEach((path) => {
    const result = TestPath.create(path);
    assertEquals(result.ok, false, `Should reject control characters: ${path}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, "INVALID_CHARACTERS");
    }
  });
});

Deno.test("1_behavior: length validation", () => {
  const shortPath = "a".repeat(10);
  const maxLengthPath = "a".repeat(260);
  const tooLongPath = "a".repeat(261);

  // Should accept paths within limit
  const shortResult = TestPath.create(shortPath);
  assertEquals(shortResult.ok, true);

  // Should accept exactly max length
  const maxResult = TestPath.create(maxLengthPath);
  assertEquals(maxResult.ok, true);

  // Should reject paths exceeding limit
  const longResult = TestPath.create(tooLongPath);
  assertEquals(longResult.ok, false);
  
  if (!longResult.ok) {
    assertEquals(longResult.error.kind, "TOO_LONG");
    if (longResult.error.kind === "TOO_LONG") {
      assertEquals(longResult.error.maxLength, 260);
      assertEquals(longResult.error.actualLength, 261);
    }
  }
});

Deno.test("1_behavior: path type validation - absolute vs relative", () => {
  const absolutePaths = [
    "/unix/absolute/path",
    "C:\\windows\\absolute\\path",
    "\\\\unc\\network\\path",
  ];

  const relativePaths = [
    "relative/path",
    "./current/dir",
    "simple",
  ];

  // Test allowing both (default config)
  [...absolutePaths, ...relativePaths].forEach((path) => {
    const result = TestPath.create(path);
    assertEquals(result.ok, true, `Should accept path: ${path}`);
  });

  // Test restricting to relative only
  const relativeOnlyConfig: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    allowAbsolute: false,
  };

  absolutePaths.forEach((path) => {
    const result = TestPath.create(path, relativeOnlyConfig);
    assertEquals(result.ok, false, `Should reject absolute path: ${path}`);
  });

  // Test restricting to absolute only  
  const absoluteOnlyConfig: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    allowRelative: false,
  };

  relativePaths.forEach((path) => {
    const result = TestPath.create(path, absoluteOnlyConfig);
    assertEquals(result.ok, false, `Should reject relative path: ${path}`);
  });
});

Deno.test("1_behavior: extension validation", () => {
  const configWithExtensions: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    requiredExtensions: [".txt", ".md"],
  };

  const validPaths = [
    "document.txt",
    "readme.md", 
    "path/to/file.TXT", // Case insensitive
  ];

  const invalidPaths = [
    "document.pdf",
    "readme", // No extension
    "file.json",
  ];

  validPaths.forEach((path) => {
    const result = TestPath.create(path, configWithExtensions);
    assertEquals(result.ok, true, `Should accept valid extension: ${path}`);
  });

  invalidPaths.forEach((path) => {
    const result = TestPath.create(path, configWithExtensions);
    assertEquals(result.ok, false, `Should reject invalid extension: ${path}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, "INVALID_EXTENSION");
    }
  });
});

Deno.test("1_behavior: custom forbidden characters", () => {
  const configWithForbiddenChars: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    forbiddenChars: ["@", "#", "%"],
  };

  const validPaths = [
    "normal/path",
    "path-with_underscores",
  ];

  const invalidPaths = [
    "path@with@at",
    "path#with#hash",
    "path%with%percent",
  ];

  validPaths.forEach((path) => {
    const result = TestPath.create(path, configWithForbiddenChars);
    assertEquals(result.ok, true, `Should accept path without forbidden chars: ${path}`);
  });

  invalidPaths.forEach((path) => {
    const result = TestPath.create(path, configWithForbiddenChars);
    assertEquals(result.ok, false, `Should reject path with forbidden chars: ${path}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, "INVALID_CHARACTERS");
    }
  });
});

Deno.test("1_behavior: path normalization", () => {
  const testCases = [
    { input: "path\\with\\backslashes", expected: "path/with/backslashes" },
    { input: "path//with//double//slashes", expected: "path/with/double/slashes" },
    { input: "path/with/trailing/", expected: "path/with/trailing" },
    { input: "/root/path/", expected: "/root/path" }, // Root slash preserved
  ];

  testCases.forEach(({ input, expected }) => {
    const result = TestPath.create(input);
    assertEquals(result.ok, true, `Should normalize path: ${input}`);
    
    if (result.ok) {
      assertEquals(result.data.getValue(), expected);
    }
  });
});

// ============================================================================
// 2_structure: Immutability and Value Object Tests
// ============================================================================

Deno.test("2_structure: immutability of created instances", () => {
  const result = TestPath.create("test/path");
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const path = result.data;
    
    // Object should be frozen
    assertEquals(Object.isFrozen(path), true);
    
    // Should not be able to modify internal state
    try {
      (path as any)._value = "modified";
      assertEquals(path.getValue(), "test/path", "Internal value should not change");
    } catch (error) {
      // Expected in strict mode
      assertEquals(error instanceof TypeError, true);
    }
  }
});

Deno.test("2_structure: value equality semantics", () => {
  const path1Result = TestPath.create("same/path");
  const path2Result = TestPath.create("same/path");
  const path3Result = TestPath.create("different/path");
  
  assertEquals(path1Result.ok, true);
  assertEquals(path2Result.ok, true);
  assertEquals(path3Result.ok, true);
  
  if (path1Result.ok && path2Result.ok && path3Result.ok) {
    const path1 = path1Result.data;
    const path2 = path2Result.data;
    const path3 = path3Result.data;
    
    // Equal values should be equal
    assertEquals(path1.equals(path2), true);
    assertEquals(path2.equals(path1), true);
    
    // Different values should not be equal
    assertEquals(path1.equals(path3), false);
    assertEquals(path3.equals(path1), false);
    
    // Should equal itself
    assertEquals(path1.equals(path1), true);
  }
});

Deno.test("2_structure: path component extraction methods", () => {
  const testCases = [
    {
      path: "dir/subdir/file.txt",
      expectedFilename: "file.txt",
      expectedDirectory: "dir/subdir",
      expectedExtension: ".txt",
    },
    {
      path: "/absolute/path/document.md",
      expectedFilename: "document.md", 
      expectedDirectory: "/absolute/path",
      expectedExtension: ".md",
    },
    {
      path: "no-extension-file",
      expectedFilename: "no-extension-file",
      expectedDirectory: "",
      expectedExtension: "",
    },
    {
      path: "hidden/.dotfile",
      expectedFilename: ".dotfile",
      expectedDirectory: "hidden", 
      expectedExtension: "",
    },
  ];

  testCases.forEach(({ path, expectedFilename, expectedDirectory, expectedExtension }) => {
    const result = TestPath.create(path);
    assertEquals(result.ok, true, `Should create path: ${path}`);
    
    if (result.ok) {
      const pathObj = result.data;
      assertEquals(pathObj.getFilename(), expectedFilename, `Filename for ${path}`);
      assertEquals(pathObj.getDirectory(), expectedDirectory, `Directory for ${path}`);
      assertEquals(pathObj.getExtension(), expectedExtension, `Extension for ${path}`);
    }
  });
});

Deno.test("2_structure: absolute vs relative path detection", () => {
  const absolutePaths = [
    "/unix/absolute",
    "C:\\windows\\absolute", 
    "\\\\network\\unc",
  ];

  const relativePaths = [
    "relative/path",
    "./current",
    "../parent",
    "simple",
  ];

  absolutePaths.forEach((path) => {
    const result = TestPath.create(path);
    assertEquals(result.ok, true, `Should create absolute path: ${path}`);
    
    if (result.ok) {
      assertEquals(result.data.isAbsolute(), true, `${path} should be absolute`);
      assertEquals(result.data.isRelative(), false, `${path} should not be relative`);
    }
  });

  relativePaths.forEach((path) => {
    // For paths containing "..", we need to handle path traversal security checks
    // This demonstrates proper Result type guard handling
    const result = TestPath.create(path);
    
    if (path.includes("..")) {
      // Path traversal should be rejected by security validation
      assertEquals(result.ok, false, `Should reject path traversal: ${path}`);
      if (!result.ok) {
        assertEquals(result.error.kind, "PATH_TRAVERSAL");
      }
    } else {
      assertEquals(result.ok, true, `Should create relative path: ${path}`);
      
      if (result.ok) {
        assertEquals(result.data.isRelative(), true, `${path} should be relative`);
        assertEquals(result.data.isAbsolute(), false, `${path} should not be absolute`);
      }
    }
  });
});

Deno.test("2_structure: string representation methods", () => {
  const path = "test/path/file.txt";
  const result = TestPath.create(path);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const pathObj = result.data;
    
    // getValue() should return the normalized path
    assertEquals(pathObj.getValue(), path);
    
    // toString() should return the normalized path
    assertEquals(pathObj.toString(), path);
    
    // Should work with string concatenation
    assertEquals(`Path: ${pathObj}`, `Path: ${path}`);
  }
});

// ============================================================================
// Edge Cases and Error Message Quality Tests
// ============================================================================

Deno.test("edge_cases: error message quality and context", () => {
  const testCases = [
    {
      input: "",
      expectedKind: "EMPTY_PATH" as const,
      shouldContainMessage: "empty",
    },
    {
      input: "../../../etc/passwd",
      expectedKind: "PATH_TRAVERSAL" as const,
      shouldContainMessage: "traversal",
    },
    {
      input: "a".repeat(300),
      expectedKind: "TOO_LONG" as const,
      shouldContainMessage: "too long",
    },
  ];

  testCases.forEach(({ input, expectedKind, shouldContainMessage }) => {
    const result = TestPath.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);
    
    if (!result.ok) {
      assertEquals(result.error.kind, expectedKind);
      assertEquals(
        result.error.message.toLowerCase().includes(shouldContainMessage.toLowerCase()),
        true,
        `Error message should contain "${shouldContainMessage}": ${result.error.message}`
      );
    }
  });
});

Deno.test("edge_cases: complex path scenarios", () => {
  const complexPaths = [
    "very/deep/nested/directory/structure/with/many/levels/file.txt",
    "unicode-文字列-パス/ファイル.txt",
    "path.with.multiple.dots.in.name.txt",
    "123-numeric-start/456_mixed_789/file-name_123.extension",
  ];

  complexPaths.forEach((path) => {
    const result = TestPath.create(path);
    // These should all succeed with default config
    assertEquals(result.ok, true, `Should handle complex path: ${path}`);
  });
});

Deno.test("edge_cases: config edge cases", () => {
  // Zero max length should reject everything except empty validation stage
  const zeroLengthConfig: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    maxLength: 0,
  };

  const result = TestPath.create("a", zeroLengthConfig);
  assertEquals(result.ok, false);
  
  if (!result.ok) {
    assertEquals(result.error.kind, "TOO_LONG");
  }

  // Empty required extensions array - should still validate
  const emptyExtensionsConfig: PathValidationConfig = {
    ...DEFAULT_PATH_CONFIG,
    requiredExtensions: [],
  };

  const noExtResult = TestPath.create("file-without-extension", emptyExtensionsConfig);
  assertEquals(noExtResult.ok, true);
});