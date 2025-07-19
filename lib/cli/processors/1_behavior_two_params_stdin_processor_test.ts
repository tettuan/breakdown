/**
 * @fileoverview Behavior tests for TwoParamsStdinProcessor
 *
 * Testing focus areas:
 * 1. STDIN reading behavior with various options
 * 2. File reading functionality and error handling
 * 3. Option parsing and decision logic
 * 4. Timeout and resource management behavior
 * 5. Error handling and Result type behavior
 *
 * @module lib/cli/processors/1_behavior_two_params_stdin_processor_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type InputProcessorError as _InputProcessorError,
  TwoParamsStdinProcessor,
} from "./two_params_stdin_processor.ts";
import type { Result as _Result } from "$lib/types/result.ts";
import { isError, isOk } from "$lib/types/result.ts";

// =============================================================================
// 1_behavior: Option Parsing Behavior Tests
// =============================================================================

Deno.test("1_behavior: process skips stdin when skipStdin is true", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await processor.process(config, options);

  // Should return empty string when skipStdin is true
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process attempts stdin when from is dash", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { from: "-" };

  const result = await processor.process(config, options);

  // Should attempt to read stdin, but in test environment may return empty or error
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals(typeof result.data, "string");
  } else {
    assertEquals(result.error.kind, "StdinReadError");
  }
});

Deno.test("1_behavior: process attempts stdin when fromFile is dash", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { fromFile: "-" };

  const result = await processor.process(config, options);

  // Should attempt to read stdin, similar to from: "-"
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals(typeof result.data, "string");
  } else {
    assertEquals(result.error.kind, "StdinReadError");
  }
});

Deno.test("1_behavior: process skips stdin when from is not dash", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { from: "some_file.txt" };

  const result = await processor.process(config, options);

  // Should attempt to read file, not stdin
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  // Since file likely doesn't exist, should return empty string for missing files
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process skips stdin when fromFile is not dash", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { fromFile: "another_file.txt" };

  const result = await processor.process(config, options);

  // Should attempt to read file, not stdin
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  // Since file likely doesn't exist, should return empty string for missing files
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process returns empty when no stdin flags set", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { someOtherOption: "value" };

  const result = await processor.process(config, options);

  // Should return empty string when no stdin/file flags are set
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

// =============================================================================
// 1_behavior: File Reading Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles missing file gracefully", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { from: "/nonexistent/file/path.txt" };

  const result = await processor.process(config, options);

  // Should return empty string for missing files (graceful handling)
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process handles fromFile with missing file", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { fromFile: "/nonexistent/directory/test.md" };

  const result = await processor.process(config, options);

  // Should return empty string for missing files
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

// Note: We can't easily test actual file reading in a unit test without
// creating temporary files, but we test the file path resolution logic

// =============================================================================
// 1_behavior: Default Timeout Convenience Method Tests
// =============================================================================

Deno.test("1_behavior: processWithDefaultTimeout uses default config", async () => {
  const processor = new TwoParamsStdinProcessor();
  const options = { skipStdin: true };

  const result = await processor.processWithDefaultTimeout(options);

  // Should work with default timeout configuration
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: processWithDefaultTimeout handles stdin flags", async () => {
  const processor = new TwoParamsStdinProcessor();
  const options = { from: "-" };

  const result = await processor.processWithDefaultTimeout(options);

  // Should attempt stdin reading with default timeout
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals(typeof result.data, "string");
  } else {
    assertEquals(result.error.kind, "StdinReadError");
  }
});

Deno.test("1_behavior: processWithDefaultTimeout handles file paths", async () => {
  const processor = new TwoParamsStdinProcessor();
  const options = { fromFile: "/tmp/nonexistent.txt" };

  const result = await processor.processWithDefaultTimeout(options);

  // Should handle file paths with default config
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

// =============================================================================
// 1_behavior: Error Handling Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles invalid permissions gracefully", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  // Attempt to read a directory as a file (should cause error)
  const options = { from: "/etc" };

  const result = await processor.process(config, options);

  // Should handle permission/directory errors
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (!result.ok) {
    assertEquals(result.error.kind, "FileReadError");
    assertExists(result.error.message);
    assertEquals(typeof result.error.message, "string");
  }
});

// =============================================================================
// 1_behavior: Result Type Behavior Tests
// =============================================================================

Deno.test("1_behavior: process returns proper Result structure on success", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await processor.process(config, options);

  // Verify Result<string, InputProcessorError> structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals("data" in result, true);
    assertEquals("error" in result, false);
    assertEquals(typeof result.data, "string");
  }
});

Deno.test("1_behavior: process returns proper error structure on stdin failure", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 100 }; // Very short timeout to force timeout
  const options = { from: "-" }; // Force stdin attempt

  const result = await processor.process(config, options);

  // Verify error Result structure (may succeed or fail depending on test environment)
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);

  if (!result.ok) {
    assertEquals("error" in result, true);
    assertEquals("data" in result, false);
    assertEquals(typeof result.error, "object");
    assertEquals(result.error.kind, "StdinReadError");
    assertEquals(typeof result.error.message, "string");
  }
});

// =============================================================================
// 1_behavior: Type Guard Behavior Tests
// =============================================================================

Deno.test("1_behavior: Result type guards work correctly for success", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await processor.process(config, options);

  // Test type guards
  assertEquals(isOk(result), true);
  assertEquals(isError(result), false);

  if (isOk(result)) {
    assertEquals(typeof result.data, "string");
  }
});

Deno.test("1_behavior: Result type guards work correctly for file errors", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  // Try to read a directory as file to force error
  const options = { from: "/dev" };

  const result = await processor.process(config, options);

  // Test type guards (may succeed or fail depending on system)
  if (isError(result)) {
    assertEquals(result.error.kind, "FileReadError");
    assertEquals(typeof result.error.message, "string");
  } else if (isOk(result)) {
    assertEquals(typeof result.data, "string");
  }
});

// =============================================================================
// 1_behavior: Option Combinations Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles conflicting options correctly", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = {
    from: "-", // Should read stdin
    fromFile: "test.txt", // But also has file
    skipStdin: false,
  };

  const result = await processor.process(config, options);

  // First option (from) should take precedence
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
});

Deno.test("1_behavior: process prioritizes file over stdin", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = {
    from: "priority_file.txt", // File should take priority
    fromFile: "-", // Even if fromFile says stdin
  };

  const result = await processor.process(config, options);

  // Should attempt file read, not stdin
  assertEquals(result.ok, true);
  if (result.ok) {
    // File doesn't exist, so should return empty string
    assertEquals(result.data, "");
  }
});

// =============================================================================
// 1_behavior: Multiple Sequential Calls Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles multiple sequential calls", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };

  const testCases = [
    { skipStdin: true },
    { from: "nonexistent1.txt" },
    { fromFile: "nonexistent2.txt" },
    { skipStdin: true },
  ];

  for (const options of testCases) {
    const result = await processor.process(config, options);
    assertEquals(result.ok, true, `Failed for options: ${JSON.stringify(options)}`);
    if (result.ok) {
      assertEquals(typeof result.data, "string");
    }
  }
});

Deno.test("1_behavior: processor maintains state isolation between calls", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };

  // Make calls with different configurations
  const results = await Promise.all([
    processor.process(config, { skipStdin: true }),
    processor.process(config, { from: "file1.txt" }),
    processor.process(config, { fromFile: "file2.txt" }),
  ]);

  // All calls should succeed independently
  for (const result of results) {
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(typeof result.data, "string");
    }
  }
});

// =============================================================================
// 1_behavior: Configuration Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles various timeout configurations", async () => {
  const processor = new TwoParamsStdinProcessor();

  const configVariations = [
    { timeout: 1000 },
    { timeout: 10000 },
    { stdin: { timeout_ms: 3000 } },
    {}, // Empty config
  ];

  const options = { skipStdin: true };

  for (const config of configVariations) {
    const result = await processor.process(config, options);
    assertEquals(result.ok, true, `Failed for config: ${JSON.stringify(config)}`);
    if (result.ok) {
      assertEquals(result.data, "");
    }
  }
});

Deno.test("1_behavior: process handles empty and null configurations", async () => {
  const processor = new TwoParamsStdinProcessor();
  const options = { skipStdin: true };

  // Test with various config values
  const configs = [
    {},
    { stdin: {} },
    { timeout: 0 },
    { stdin: { timeout_ms: 1000 } },
  ];

  for (const config of configs) {
    const result = await processor.process(config, options);
    assertEquals(result.ok, true, `Failed for config: ${JSON.stringify(config)}`);
    if (result.ok) {
      assertEquals(result.data, "");
    }
  }
});

// =============================================================================
// 1_behavior: Edge Cases Behavior Tests
// =============================================================================

Deno.test("1_behavior: process handles empty options object", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = {};

  const result = await processor.process(config, options);

  // Should return empty string when no options are provided
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process handles null and undefined option values", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = {
    from: null,
    fromFile: undefined,
    skipStdin: null,
  };

  const result = await processor.process(config, options);

  // Should handle null/undefined gracefully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});

Deno.test("1_behavior: process handles boolean and numeric option values", async () => {
  const processor = new TwoParamsStdinProcessor();
  const config = { timeout: 5000 };
  const options = {
    from: true, // Non-string value
    fromFile: 123, // Numeric value
    skipStdin: true,
  };

  const result = await processor.process(config, options);

  // Should handle type conversion gracefully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "");
  }
});
