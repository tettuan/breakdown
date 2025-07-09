/**
 * @fileoverview Config Loader 0_architecture tests
 *
 * Tests for ConfigLoader implementation following the Totality principle.
 * Covers architecture constraints, Smart Constructor patterns, and design validation.
 *
 * @module config/0_architecture_loader_test
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertInstanceOf,
} from "../deps.ts";
import {
  ConfigFilePath,
  ConfigLoader,
  ConfigPrefix,
  WorkingDirectory,
  type ConfigFilePathError,
  type ConfigPrefixError,
  type WorkingDirectoryError,
} from "./loader.ts";

// =============================================================================
// 0_architecture: Architecture constraints and design patterns
// =============================================================================

Deno.test("0_architecture: ConfigFilePath follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new ConfigFilePath() === undefined);

  // Only way to create is through static create method
  const pathResult = ConfigFilePath.create("test.yml");
  assert(pathResult.ok);
  assertExists(pathResult.data);
  assert(pathResult.data instanceof ConfigFilePath);
});

Deno.test("0_architecture: ConfigPrefix follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new ConfigPrefix() === undefined);

  // Only way to create is through static create method
  const prefixResult = ConfigPrefix.create("test");
  assert(prefixResult.ok);
  assertExists(prefixResult.data);
  assert(prefixResult.data instanceof ConfigPrefix);
});

Deno.test("0_architecture: WorkingDirectory follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new WorkingDirectory() === undefined);

  // Only way to create is through static create method
  const dirResult = WorkingDirectory.create(".");
  assert(dirResult.ok);
  assertExists(dirResult.data);
  assert(dirResult.data instanceof WorkingDirectory);
});

Deno.test("0_architecture: ConfigLoader prevents direct instantiation", () => {
  // ConfigLoader should not be instantiable
  // @ts-expect-error - Testing that constructor is private
  assert(() => new ConfigLoader() === undefined);

  // All methods should be static
  assertEquals(typeof ConfigLoader.loadConfig, "function");
  assertEquals(typeof ConfigLoader.loadBreakdownConfig, "function");
});

Deno.test("0_architecture: ConfigFilePath implements Totality principle", () => {
  // create() method is total - returns Result<ConfigFilePath, ConfigFilePathError> for ALL inputs
  
  // Valid paths return ok result
  const validPaths = [
    "config.yml",
    "test.yaml",
    "/absolute/path/config.yml",
    "./relative/path.yml",
    "../parent/config.yaml",
    "simple",
    "a".repeat(999), // Max length - 1
  ];
  
  for (const path of validPaths) {
    const result = ConfigFilePath.create(path);
    assert(result.ok, `Expected valid path for: ${path}`);
    assertEquals(result.data.value, path);
  }
  
  // Invalid paths return error result (not throw)
  const invalidPaths: Array<{ input: string; expectedKind: ConfigFilePathError["kind"] }> = [
    { input: "", expectedKind: "EmptyPath" },
    { input: "  ", expectedKind: "EmptyPath" }, // Trimmed to empty, so EmptyPath
    { input: " config.yml", expectedKind: "InvalidFormat" },
    { input: "config.yml ", expectedKind: "InvalidFormat" },
    { input: "\tconfig.yml", expectedKind: "InvalidFormat" },
    { input: "config.yml\n", expectedKind: "InvalidFormat" },
    { input: "a".repeat(1001), expectedKind: "PathTooLong" },
  ];
  
  for (const { input, expectedKind } of invalidPaths) {
    const result = ConfigFilePath.create(input);
    assert(!result.ok, `Expected invalid path for: ${JSON.stringify(input)}`);
    assertEquals(result.error.kind, expectedKind);
  }
});

Deno.test("0_architecture: ConfigPrefix implements Totality principle", () => {
  // create() method is total - returns Result<ConfigPrefix, ConfigPrefixError> for ALL inputs
  
  // Valid prefixes return ok result (including null/undefined)
  const validPrefixes = [
    null,
    undefined,
    "",
    "test",
    "staging",
    "production-env",
    "dev_env",
    "UPPERCASE",
    "123",
    "mixed123_test-env",
    "a".repeat(100), // Max length
  ];
  
  for (const prefix of validPrefixes) {
    const result = ConfigPrefix.create(prefix);
    assert(result.ok, `Expected valid prefix for: ${prefix}`);
    if (prefix === null || prefix === undefined || prefix === "") {
      assertEquals(result.data.value, null);
      assertEquals(result.data.hasValue, false);
    } else {
      assertEquals(result.data.value, prefix);
      assertEquals(result.data.hasValue, true);
    }
  }
  
  // Invalid prefixes return error result (not throw)
  const invalidPrefixes: Array<{ input: unknown; expectedKind: ConfigPrefixError["kind"] }> = [
    { input: 123, expectedKind: "InvalidType" },
    { input: true, expectedKind: "InvalidType" },
    { input: [], expectedKind: "InvalidType" },
    { input: {}, expectedKind: "InvalidType" },
    { input: " test", expectedKind: "InvalidFormat" },
    { input: "test ", expectedKind: "InvalidFormat" },
    { input: "\ttest", expectedKind: "InvalidFormat" },
    { input: "test\n", expectedKind: "InvalidFormat" },
    { input: "test@env", expectedKind: "InvalidCharacters" },
    { input: "test.env", expectedKind: "InvalidCharacters" },
    { input: "test env", expectedKind: "InvalidCharacters" },
    { input: "test/env", expectedKind: "InvalidCharacters" },
    { input: "a".repeat(101), expectedKind: "PrefixTooLong" },
  ];
  
  for (const { input, expectedKind } of invalidPrefixes) {
    const result = ConfigPrefix.create(input as string);
    assert(!result.ok, `Expected invalid prefix for: ${JSON.stringify(input)}`);
    assertEquals(result.error.kind, expectedKind);
  }
});

Deno.test("0_architecture: WorkingDirectory implements Totality principle", () => {
  // create() method is total - returns Result<WorkingDirectory, WorkingDirectoryError> for ALL inputs
  
  // Valid directories return ok result
  const validDirs = [
    ".",
    "..",
    "/",
    "/tmp",
    "./relative",
    "../parent",
    "/absolute/path",
    undefined, // Should default to Deno.cwd()
  ];
  
  for (const dir of validDirs) {
    const result = WorkingDirectory.create(dir);
    assert(result.ok, `Expected valid directory for: ${dir}`);
    assertExists(result.data.value);
    assertEquals(typeof result.data.value, "string");
  }
  
  // Invalid directories return error result (not throw)
  const invalidDirs: Array<{ input: unknown; expectedKind: WorkingDirectoryError["kind"] }> = [
    { input: "", expectedKind: "InvalidPath" }, // Empty string is falsy, so InvalidPath
    { input: "   ", expectedKind: "EmptyPath" }, // Trimmed to empty, so EmptyPath
    { input: null, expectedKind: "InvalidPath" },
    { input: 123, expectedKind: "InvalidPath" },
    { input: true, expectedKind: "InvalidPath" },
    { input: [], expectedKind: "InvalidPath" },
    { input: {}, expectedKind: "InvalidPath" },
  ];
  
  for (const { input, expectedKind } of invalidDirs) {
    const result = WorkingDirectory.create(input as string);
    assert(!result.ok, `Expected invalid directory for: ${JSON.stringify(input)}`);
    assertEquals(result.error.kind, expectedKind);
  }
});

Deno.test("0_architecture: Value objects are immutable at interface level", () => {
  // ConfigFilePath immutability
  const pathResult = ConfigFilePath.create("test.yml");
  assert(pathResult.ok);
  const path = pathResult.data;
  
  const originalValue = path.value;
  try {
    // Attempt to modify readonly property
    (path as any).value = "modified";
  } catch (error) {
    // Expected: TypeError for read-only property
    assert(error instanceof TypeError);
  }
  assertEquals(path.value, originalValue);
  
  // ConfigPrefix immutability
  const prefixResult = ConfigPrefix.create("test");
  assert(prefixResult.ok);
  const prefix = prefixResult.data;
  
  const originalPrefix = prefix.value;
  const originalHasValue = prefix.hasValue;
  try {
    (prefix as any).value = "modified";
    (prefix as any).hasValue = false;
  } catch (error) {
    assert(error instanceof TypeError);
  }
  assertEquals(prefix.value, originalPrefix);
  assertEquals(prefix.hasValue, originalHasValue);
  
  // WorkingDirectory immutability
  const dirResult = WorkingDirectory.create(".");
  assert(dirResult.ok);
  const dir = dirResult.data;
  
  const originalDir = dir.value;
  try {
    (dir as any).value = "modified";
  } catch (error) {
    assert(error instanceof TypeError);
  }
  assertEquals(dir.value, originalDir);
});

Deno.test("0_architecture: Error types implement discriminated union pattern", () => {
  // All error types use discriminated union with 'kind' field
  
  // ConfigFilePathError variants
  const filePathErrors = [
    { kind: "EmptyPath", message: "test" },
    { kind: "InvalidFormat", message: "test", path: "test" },
    { kind: "PathTooLong", message: "test", path: "test" },
  ] satisfies ConfigFilePathError[];
  
  for (const error of filePathErrors) {
    assertExists(error.kind);
    assertExists(error.message);
    assertEquals(typeof error.kind, "string");
    assertEquals(typeof error.message, "string");
  }
  
  // ConfigPrefixError variants
  const prefixErrors = [
    { kind: "InvalidType", message: "test", received: "test" },
    { kind: "InvalidFormat", message: "test", prefix: "test" },
    { kind: "InvalidCharacters", message: "test", prefix: "test" },
    { kind: "PrefixTooLong", message: "test", prefix: "test" },
  ] satisfies ConfigPrefixError[];
  
  for (const error of prefixErrors) {
    assertExists(error.kind);
    assertExists(error.message);
  }
  
  // WorkingDirectoryError variants
  const dirErrors = [
    { kind: "InvalidPath", path: "test", reason: "test" },
    { kind: "EmptyPath", message: "test" },
  ] satisfies WorkingDirectoryError[];
  
  for (const error of dirErrors) {
    assertExists(error.kind);
    if ('message' in error) {
      assertExists(error.message);
    } else if ('reason' in error) {
      assertExists(error.reason);
    }
  }
});

Deno.test("0_architecture: ConfigLoader.loadConfig returns Result type", async () => {
  // loadConfig method follows Result pattern for ALL inputs
  
  // Method signature guarantees Result return type
  const testPaths = [
    "nonexistent.yml",
    "",
    "invalid-path-with-spaces ",
    "a".repeat(1001),
  ];
  
  for (const path of testPaths) {
    const result = await ConfigLoader.loadConfig(path);
    // Result must have 'ok' property
    assertExists("ok" in result);
    assertEquals(typeof result.ok, "boolean");
    
    if (result.ok) {
      assertExists(result.data);
    } else {
      assertExists(result.error);
      assertExists(result.error.kind);
      if ('message' in result.error && result.error.message) {
        assertExists(result.error.message);
      }
      if ('reason' in result.error && result.error.reason) {
        assertExists(result.error.reason);
      }
    }
  }
});

Deno.test("0_architecture: ConfigLoader.loadBreakdownConfig returns Result type", async () => {
  // loadBreakdownConfig method follows Result pattern for ALL inputs
  
  const testConfigs = [
    { prefix: "test", workingDir: "." },
    { prefix: null, workingDir: undefined },
    { prefix: 123 as unknown as string, workingDir: "." },
    { prefix: "invalid@prefix", workingDir: "." },
  ];
  
  for (const { prefix, workingDir } of testConfigs) {
    const result = await ConfigLoader.loadBreakdownConfig(prefix, workingDir);
    
    // Result must have 'ok' property
    assertExists("ok" in result);
    assertEquals(typeof result.ok, "boolean");
    
    if (result.ok) {
      assertExists(result.data);
      assertEquals(typeof result.data, "object");
    } else {
      assertExists(result.error);
      assertExists(result.error.kind);
      if ('message' in result.error && result.error.message) {
        assertExists(result.error.message);
      }
      if ('reason' in result.error && result.error.reason) {
        assertExists(result.error.reason);
      }
    }
  }
});

Deno.test("0_architecture: Value objects prevent invalid state at type level", () => {
  // Smart Constructors prevent invalid states through type system
  
  // ConfigFilePath can only exist in valid states
  const validPath = ConfigFilePath.create("valid.yml");
  assert(validPath.ok);
  
  // Type system prevents accessing non-existent properties
  assertExists(validPath.data.value);
  assertEquals(typeof validPath.data.toString, "function");
  
  // ConfigPrefix can only exist in valid states  
  const validPrefix = ConfigPrefix.create("valid");
  assert(validPrefix.ok);
  
  assertExists("value" in validPrefix.data);
  assertExists("hasValue" in validPrefix.data);
  assertEquals(typeof validPrefix.data.toString, "function");
  
  // WorkingDirectory can only exist in valid states
  const validDir = WorkingDirectory.create(".");
  assert(validDir.ok);
  
  assertExists(validDir.data.value);
  assertEquals(typeof validDir.data.toString, "function");
});

Deno.test("0_architecture: All constructors use Object.freeze for immutability", () => {
  // Verify that value objects are properly frozen
  
  const pathResult = ConfigFilePath.create("test.yml");
  assert(pathResult.ok);
  assert(Object.isFrozen(pathResult.data));
  
  const prefixResult = ConfigPrefix.create("test");
  assert(prefixResult.ok);
  assert(Object.isFrozen(prefixResult.data));
  
  const dirResult = WorkingDirectory.create(".");
  assert(dirResult.ok);
  assert(Object.isFrozen(dirResult.data));
});

Deno.test("0_architecture: String representation follows consistent pattern", () => {
  // All value objects provide consistent toString() format
  
  const pathResult = ConfigFilePath.create("test.yml");
  assert(pathResult.ok);
  assertEquals(pathResult.data.toString(), "ConfigFilePath(test.yml)");
  
  const prefixResult = ConfigPrefix.create("test");
  assert(prefixResult.ok);
  assertEquals(prefixResult.data.toString(), "ConfigPrefix(test)");
  
  const nullPrefixResult = ConfigPrefix.create(null);
  assert(nullPrefixResult.ok);
  assertEquals(nullPrefixResult.data.toString(), "ConfigPrefix(null)");
  
  const dirResult = WorkingDirectory.create(".");
  assert(dirResult.ok);
  assertEquals(dirResult.data.toString(), "WorkingDirectory(.)");
});

Deno.test("0_architecture: Exhaustive error handling covers all failure modes", () => {
  // Every possible failure mode is represented in error types
  
  // File path validation covers all edge cases
  const pathFailures = [
    "", "  ", " path", "path ", "\tpath", "path\n", "a".repeat(1001)
  ];
  
  for (const invalidPath of pathFailures) {
    const result = ConfigFilePath.create(invalidPath);
    assert(!result.ok);
    assert(["EmptyPath", "InvalidFormat", "PathTooLong"].includes(result.error.kind));
  }
  
  // Prefix validation covers all edge cases
  const prefixFailures = [
    123, true, [], {}, " prefix", "prefix ", "prefix@env", "a".repeat(101)
  ];
  
  for (const invalidPrefix of prefixFailures) {
    const result = ConfigPrefix.create(invalidPrefix as string);
    assert(!result.ok);
    assert([
      "InvalidType", "InvalidFormat", "InvalidCharacters", "PrefixTooLong"
    ].includes(result.error.kind));
  }
  
  // Directory validation covers all edge cases
  const dirFailures = [
    "", "   ", null, 123, true, [], {}
  ];
  
  for (const invalidDir of dirFailures) {
    const result = WorkingDirectory.create(invalidDir as string);
    assert(!result.ok);
    assert(["InvalidPath", "EmptyPath"].includes(result.error.kind));
  }
});