/**
 * @fileoverview Architecture tests for Entry Point Design Pattern
 *
 * This test suite verifies that the application follows proper entry point patterns:
 * - Clear main function as application entry point
 * - Proper module export structure
 * - import.meta.main pattern implementation
 * - CLI and library usage separation
 * - Totality principle compliance (all operations return Result types)
 *
 * @module lib/cli/0_architecture_entry_point_test
 */

import { assertEquals, assertExists } from "../../tests/deps.ts";
import { runBreakdown } from "../../cli/breakdown.ts";

Deno.test("Entry Point Architecture - main function exists and is properly structured", () => {
  // Test that main function is accessible through runBreakdown export
  assertExists(runBreakdown, "runBreakdown should be exported as main entry point");
  assertEquals(typeof runBreakdown, "function", "runBreakdown should be a function");
});

Deno.test("Entry Point Architecture - mod.ts provides correct entry point", async () => {
  // Test that mod.ts properly exports the entry point
  const modExports = await import("../../mod.ts");

  assertExists(modExports.runBreakdown, "mod.ts should export runBreakdown");
  assertEquals(typeof modExports.runBreakdown, "function", "runBreakdown should be a function");
});

Deno.test("Entry Point Architecture - CLI entry point follows import.meta.main pattern", async () => {
  // Test that breakdown.ts implements import.meta.main pattern correctly
  const breakdownModule = await import("../../cli/breakdown.ts");

  // Verify runBreakdown is exported for library usage
  assertExists(
    breakdownModule.runBreakdown,
    "breakdown.ts should export runBreakdown for library usage",
  );

  // The import.meta.main check is handled at runtime, so we can't test it directly
  // but we can verify the function exists and is properly typed
  assertEquals(
    typeof breakdownModule.runBreakdown,
    "function",
    "runBreakdown should be a function",
  );
});

Deno.test("Entry Point Architecture - main function accepts proper arguments", () => {
  // Test that runBreakdown accepts string array arguments (CLI args)
  const argTypes = runBreakdown.length;

  // runBreakdown should accept optional args parameter
  assertEquals(argTypes <= 1, true, "runBreakdown should accept 0 or 1 parameters (optional args)");
});

Deno.test("Entry Point Architecture - entry point provides async interface", async () => {
  // Test that the main entry point is async and returns Result type (Totality principle)
  const resultPromise = runBreakdown([]);

  assertExists(resultPromise, "runBreakdown should return a value");
  assertEquals(resultPromise instanceof Promise, true, "runBreakdown should return a Promise");

  // Verify it returns a Result type following Totality principle
  const result = await resultPromise;
  assertExists(result, "runBreakdown should return a Result");
  assertEquals(typeof result, "object", "Result should be an object");
  assertEquals("ok" in result, true, "Result should have 'ok' property (Result type)");
});

Deno.test("Entry Point Architecture - entry point separation (CLI vs Library)", async () => {
  // Test that there's a clear separation between CLI and library usage

  // CLI usage - through mod.ts
  const cliModule = await import("../../mod.ts");
  assertExists(cliModule.runBreakdown, "CLI module should export runBreakdown");

  // Library usage - direct import
  const libraryModule = await import("../../cli/breakdown.ts");
  assertExists(libraryModule.runBreakdown, "Library module should export runBreakdown");

  // Both should be the same function
  assertEquals(
    cliModule.runBreakdown,
    libraryModule.runBreakdown,
    "CLI and library exports should reference the same function",
  );
});

Deno.test("Entry Point Architecture - proper error handling in main", async () => {
  // Test that the main entry point handles errors gracefully using Result type (Totality principle)
  const result = await runBreakdown(["--invalid-flag-that-does-not-exist"]);

  // Following Totality principle, errors should be returned as Result, not thrown
  assertExists(result, "runBreakdown should return a Result");
  assertEquals(typeof result, "object", "Result should be an object");
  assertEquals("ok" in result, true, "Result should have 'ok' property");

  // The function should handle unknown flags gracefully
  // It may either succeed (ignoring unknown flag) or return an error Result
  if (!result.ok) {
    assertExists(result.error, "Error Result should have error property");
    assertEquals("kind" in result.error, true, "Error should have 'kind' property");
  }
});

Deno.test("Entry Point Architecture - main function provides help interface", async () => {
  // Test that help functionality is accessible and returns Result (Totality principle)
  const result = await runBreakdown(["--help"]);

  // Help should return a successful Result
  assertExists(result, "runBreakdown should return a Result");
  assertEquals(typeof result, "object", "Result should be an object");
  assertEquals(result.ok, true, "Help should return successful Result");
});

Deno.test("Entry Point Architecture - version information accessible", async () => {
  // Test that version information is accessible and returns Result (Totality principle)
  const result = await runBreakdown(["--version"]);

  // Version should return a successful Result
  assertExists(result, "runBreakdown should return a Result");
  assertEquals(typeof result, "object", "Result should be an object");
  assertEquals(result.ok, true, "Version should return successful Result");
});

Deno.test("Entry Point Architecture - consistent interface patterns", () => {
  // Test that entry point follows consistent interface patterns

  // Function should be named consistently
  assertEquals(runBreakdown.name, "runBreakdown", "Function should have consistent naming");

  // Should be async function
  const isAsync = runBreakdown.constructor.name === "AsyncFunction" ||
    runBreakdown.toString().includes("async");
  assertEquals(isAsync, true, "Entry point should be async function");
});
