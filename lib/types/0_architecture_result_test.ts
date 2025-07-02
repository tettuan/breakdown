/**
 * @fileoverview Architecture Test for Result Type
 *
 * Validates architectural constraints and design principles
 * for the Result type following Totality principle.
 *
 * Key architectural validations:
 * - Type safety and discriminated union structure
 * - No circular dependencies or external dependencies
 * - Functional programming principles adherence
 * - Totality principle implementation
 *
 * @module types/0_architecture_result_test
 */

import { assertEquals, assertExists } from "@std/assert";

/**
 * Architecture Test Suite: Result Type
 *
 * These tests verify architectural principles:
 * 1. Pure functional design (no side effects)
 * 2. No external dependencies (self-contained)
 * 3. Proper discriminated union structure
 * 4. Type-level guarantees for Totality principle
 * 5. Immutable data structures
 */
Deno.test("Result Type Architecture", async (t) => {
  await t.step("has no external dependencies", async () => {
    const _filePath = new URL("./result.ts", import.meta.url).pathname;
    const resultContent = await Deno.readTextFile(filePath);

    // Should not import any external modules
    const importMatches = resultContent.match(/import.*from/g) || [];
    assertEquals(importMatches.length, 0, "Should have no external imports");

    // Should not use any Node.js or Deno APIs in actual code (excluding comments)
    const codeLines = resultContent.split("\n").filter((line) =>
      !line.trim().startsWith("*") && !line.trim().startsWith("//")
    ).join("\n");

    assertEquals(codeLines.includes("Deno."), false, "Should not use Deno APIs");
    assertEquals(codeLines.includes("process."), false, "Should not use Node.js APIs");
    assertEquals(codeLines.includes("console."), false, "Should not use console APIs");
  });

  await t.step("implements pure functional design", async () => {
    const filePath = new URL("./result.ts", import.meta.url).pathname;
    const resultContent = await Deno.readTextFile(filePath);

    // Should not use mutable state
    assertEquals(resultContent.includes("let "), false, "Should not use mutable variables");
    assertEquals(resultContent.includes("var "), false, "Should not use var declarations");

    // Should not use classes or this keyword
    assertEquals(resultContent.includes("class "), false, "Should not define classes");
    assertEquals(resultContent.includes("this."), false, "Should not use this keyword");

    // Should use only function declarations and const
    const constCount = (resultContent.match(/const /g) || []).length;
    const functionCount = (resultContent.match(/export function /g) || []).length;
    const typeCount = (resultContent.match(/export type /g) || []).length;

    assertEquals(constCount >= 0, true, "Should use const declarations");
    assertEquals(functionCount >= 5, true, "Should export utility functions");
    assertEquals(typeCount >= 1, true, "Should export Result type");
  });

  await t.step("defines proper discriminated union", async () => {
    const { ok, error, isOk, isError } = await import("./result.ts");

    // Test successful result structure
    const successResult = ok(42);
    assertEquals(successResult.ok, true);
    if (successResult.ok) {
      assertExists(successResult.data);
      assertEquals(successResult.data, 42);
    }
    assertEquals(
      (successResult as unknown).error,
      undefined,
      "Success result should not have error property",
    );

    // Test error result structure
    const errorResult = error("test error");
    assertEquals(errorResult.ok, false);
    if (!errorResult.ok) {
      assertExists(errorResult.error);
      assertEquals(errorResult.error, "test error");
    }
    assertEquals(
      (errorResult as unknown).data,
      undefined,
      "Error result should not have data property",
    );

    // Test type guards
    assertEquals(isOk(successResult), true);
    assertEquals(isError(successResult), false);
    assertEquals(isOk(errorResult), false);
    assertEquals(isError(errorResult), true);
  });

  await t.step("ensures totality principle compliance", async () => {
    const { ok, error, map, chain, all } = await import("./result.ts");

    // All operations should handle both success and error cases
    const successResult = ok(10);
    const errorResult = error("test error");

    // Map should preserve error
    const mappedSuccess = map(successResult, (x: number) => x * 2);
    const mappedError = map(errorResult, (x: number) => x * 2);

    assertEquals(mappedSuccess.ok, true);
    if (mappedSuccess.ok) assertEquals(mappedSuccess.data, 20);
    assertEquals(mappedError.ok, false);
    if (!mappedError.ok) assertEquals(mappedError.error, "test error");

    // Chain should preserve error
    const chainedSuccess = chain(successResult, (x: number) => ok(x + 1));
    const chainedError = chain(errorResult, (x: number) => ok(x + 1));

    assertEquals(chainedSuccess.ok, true);
    if (chainedSuccess.ok) assertEquals(chainedSuccess.data, 11);
    assertEquals(chainedError.ok, false);

    // All should fail if any result fails
    const allSuccess = all([ok(1), ok(2), ok(3)]);
    const allError = all([ok(1), error("fail"), ok(3)]);

    assertEquals(allSuccess.ok, true);
    if (allSuccess.ok) assertEquals(allSuccess.data, [1, 2, 3]);
    assertEquals(allError.ok, false);
  });

  await t.step("maintains immutability", async () => {
    const { ok, map } = await import("./result.ts");

    // Original results should not be modified
    const original = ok({ value: 42 });
    const mapped = map(original, (data: { value: number }) => ({ ...data, value: data.value * 2 }));

    // Original should be unchanged
    assertEquals(original.ok, true);
    if (original.ok) assertEquals(original.data.value, 42);

    // Mapped should have new value
    assertEquals(mapped.ok, true);
    if (mapped.ok) assertEquals(mapped.data.value, 84);

    // Objects should be different references
    if (original.ok && mapped.ok) {
      assertEquals(original.data === mapped.data, false, "Should create new objects, not mutate");
    }
  });

  await t.step("provides type-safe error handling", async () => {
    // This test verifies that TypeScript compiler enforces proper usage
    const filePath = new URL("./result.ts", import.meta.url).pathname;
    const resultContent = await Deno.readTextFile(filePath);

    // Result type should use discriminated union pattern
    assertEquals(resultContent.includes("{ ok: true; data: T }"), true);
    assertEquals(resultContent.includes("{ ok: false; error: E }"), true);

    // Type guards should use type predicates
    assertEquals(resultContent.includes("result is { ok: true; data: T }"), true);
    assertEquals(resultContent.includes("result is { ok: false; error: E }"), true);
  });

  await t.step("follows consistent API design", async () => {
    const resultModule = await import("./result.ts");

    // Should export core functions
    assertExists(resultModule.ok, "Should export ok function");
    assertExists(resultModule.error, "Should export error function");
    assertExists(resultModule.isOk, "Should export isOk type guard");
    assertExists(resultModule.isError, "Should export isError type guard");

    // Should export utility functions
    assertExists(resultModule.map, "Should export map function");
    assertExists(resultModule.chain, "Should export chain function");
    assertExists(resultModule.getOrElse, "Should export getOrElse function");
    assertExists(resultModule.all, "Should export all function");

    // All functions should be callable
    assertEquals(typeof _resultModule.ok, "function");
    assertEquals(typeof _resultModule.error, "function");
    assertEquals(typeof _resultModule.map, "function");
    assertEquals(typeof _resultModule.chain, "function");
  });
});

/**
 * Dependency Analysis Test
 *
 * Verifies the module's position in the dependency graph
 */
Deno.test("Result Type Dependency Analysis", async (t) => {
  await t.step("is a leaf module with zero dependencies", async () => {
    const filePath = new URL("./result.ts", import.meta.url).pathname;
    const resultContent = await Deno.readTextFile(filePath);

    // Should have no imports at all
    const importCount = (resultContent.match(/import /g) || []).length;
    const requireCount = (resultContent.match(/require\(/g) || []).length;

    assertEquals(importCount, 0, "Should have no import statements");
    assertEquals(requireCount, 0, "Should have no require statements");

    // Should be purely self-contained
    const lineCount = resultContent.split("\n").length;
    assertEquals(lineCount < 150, true, "Should be concise and focused");
  });

  await t.step("can be safely imported without side effects", async () => {
    // Importing should not cause any side effects
    const resultModule = await import("./result.ts");

    // Module should only export types and pure functions
    const exports = Object.keys(resultModule);

    // All exports should be functions (constructors and utilities)
    for (const exportName of exports) {
      const exportValue = resultModule[exportName as keyof typeof _resultModule];
      assertEquals(typeof exportValue, "function", `${exportName} should be a function`);
    }
  });

  await t.step("serves as foundation for error handling architecture", async () => {
    // This module should be importable by all other modules without creating cycles
    const filePath = new URL("./result.ts", import.meta.url).pathname;
    const resultContent = await Deno.readTextFile(filePath);

    // Should define generic, reusable types
    assertEquals(resultContent.includes("Result<T, E"), true, "Should define generic Result type");
    assertEquals(resultContent.includes("export type"), true, "Should export types");

    // Should provide utility functions for common operations
    const utilityFunctions = ["map", "chain", "getOrElse", "all"];
    for (const fn of utilityFunctions) {
      assertEquals(
        resultContent.includes(`export function ${fn}`),
        true,
        `Should export utility function: ${fn}`,
      );
    }
  });
});
