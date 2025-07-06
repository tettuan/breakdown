/**
 * @fileoverview Unit tests for Result type implementation
 *
 * Tests are organized in three categories:
 * - 0_architecture: Type constraint verification
 * - 1_behavior: Runtime behavior verification
 * - 2_structure: Structural correctness verification
 *
 * @module types/result_test
 */

import { assertEquals, assertExists } from "@std/assert";
import type { Result } from "./result.ts";
import {
  all,
  chain,
  error,
  getOrElse,
  isError,
  isOk,
  map,
  ok,
} from "./result.ts";

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Result type should enforce mutual exclusivity", () => {
  // Type-level test: Result<T, E> can only be Ok or Error, not both
  const successResult: Result<number, string> = { ok: true, data: 42 };
  const errorResult: Result<number, string> = { ok: false, error: "failed" };

  // Verify discriminated union works correctly
  if (successResult.ok) {
    // TypeScript knows data exists here
    assertExists(successResult.data);
    assertEquals(successResult.data, 42);
    // Verify error property doesn't exist at runtime
    assertEquals("error" in successResult, false);
  }

  if (!errorResult.ok) {
    // TypeScript knows error exists here
    assertExists(errorResult.error);
    assertEquals(errorResult.error, "failed");
    // Verify data property doesn't exist at runtime
    assertEquals("data" in errorResult, false);
  }
});

Deno.test("0_architecture: Helper functions return correctly typed Results", () => {
  // ok function returns Result<T, never>
  const okResult = ok(42);
  const _okType: Result<number, never> = okResult;
  assertEquals(okResult.ok, true);
  if (okResult.ok) {
    assertEquals(okResult.data, 42);
  }

  // error function returns Result<never, E>
  const errorResult = error("failed");
  const _errorType: Result<never, string> = errorResult;
  assertEquals(errorResult.ok, false);
  if (!errorResult.ok) {
    assertEquals(errorResult.error, "failed");
  }
});

Deno.test("0_architecture: Type guards narrow Result types correctly", () => {
  const result: Result<number, string> = ok(42);

  if (isOk(result)) {
    // Type narrowed to { ok: true; data: number }
    const data: number = result.data;
    assertEquals(data, 42);
  }

  const errorRes: Result<number, string> = error("failed");
  if (isError(errorRes)) {
    // Type narrowed to { ok: false; error: string }
    const err: string = errorRes.error;
    assertEquals(err, "failed");
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests
// =============================================================================

Deno.test("1_behavior: ok() creates successful result", () => {
  const result = ok(42);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, 42);
  }
});

Deno.test("1_behavior: error() creates error result", () => {
  const result = error("Something went wrong");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Something went wrong");
  }
});

Deno.test("1_behavior: isOk() correctly identifies success results", () => {
  assertEquals(isOk(ok(42)), true);
  assertEquals(isOk(error("failed")), false);
});

Deno.test("1_behavior: isError() correctly identifies error results", () => {
  assertEquals(isError(ok(42)), false);
  assertEquals(isError(error("failed")), true);
});

Deno.test("1_behavior: map() transforms success values", () => {
  const result = ok(42);
  const mapped = map(result, (x) => x * 2);
  
  assertEquals(mapped.ok, true);
  if (mapped.ok) {
    assertEquals(mapped.data, 84);
  }
});

Deno.test("1_behavior: map() preserves errors", () => {
  const result = error<string>("failed");
  const mapped = map(result, (x: number) => x * 2);
  
  assertEquals(mapped.ok, false);
  if (!mapped.ok) {
    assertEquals(mapped.error, "failed");
  }
});

Deno.test("1_behavior: chain() sequences successful operations", () => {
  const result = ok(42);
  const chained = chain(result, (x) => ok(x * 2));
  
  assertEquals(chained.ok, true);
  if (chained.ok) {
    assertEquals(chained.data, 84);
  }
});

Deno.test("1_behavior: chain() short-circuits on error", () => {
  const result = error<string>("initial error");
  const chained = chain(result, (x: number) => ok(x * 2));
  
  assertEquals(chained.ok, false);
  if (!chained.ok) {
    assertEquals(chained.error, "initial error");
  }
});

Deno.test("1_behavior: chain() propagates errors from chained function", () => {
  const result = ok(42);
  const chained = chain(result, (_x) => error("chained error"));
  
  assertEquals(chained.ok, false);
  if (!chained.ok) {
    assertEquals(chained.error, "chained error");
  }
});

Deno.test("1_behavior: getOrElse() returns data on success", () => {
  const result = ok(42);
  assertEquals(getOrElse(result, 0), 42);
});

Deno.test("1_behavior: getOrElse() returns default on error", () => {
  const result = error<string>("failed");
  assertEquals(getOrElse(result, 0), 0);
});

Deno.test("1_behavior: all() combines successful results", () => {
  const results = [ok(1), ok(2), ok(3)];
  const combined = all(results);
  
  assertEquals(combined.ok, true);
  if (combined.ok) {
    assertEquals(combined.data, [1, 2, 3]);
  }
});

Deno.test("1_behavior: all() fails on first error", () => {
  const results = [ok(1), error("failed at 2"), ok(3)];
  const combined = all(results);
  
  assertEquals(combined.ok, false);
  if (!combined.ok) {
    assertEquals(combined.error, "failed at 2");
  }
});

Deno.test("1_behavior: all() returns empty array for empty input", () => {
  const results: Result<number, string>[] = [];
  const combined = all(results);
  
  assertEquals(combined.ok, true);
  if (combined.ok) {
    assertEquals(combined.data, []);
  }
});

// =============================================================================
// 1_behavior: Monad Laws Verification (Totality Principle)
// =============================================================================

Deno.test("1_behavior: Monad left identity law - return a >>= f === f a", () => {
  const a = 42;
  const f = (x: number): Result<number, string> => ok(x * 2);
  
  // Left identity: ok(a) >>= f === f(a)
  const leftSide = chain(ok(a), f);
  const rightSide = f(a);
  
  assertEquals(leftSide, rightSide);
});

Deno.test("1_behavior: Monad right identity law - m >>= return === m", () => {
  const m = ok(42);
  
  // Right identity: m >>= ok === m
  const result = chain(m, ok);
  
  assertEquals(result, m);
});

Deno.test("1_behavior: Monad associativity law - (m >>= f) >>= g === m >>= (x => f x >>= g)", () => {
  const m = ok(42);
  const f = (x: number): Result<number, string> => ok(x * 2);
  const g = (x: number): Result<number, string> => ok(x + 10);
  
  // Left side: (m >>= f) >>= g
  const leftSide = chain(chain(m, f), g);
  
  // Right side: m >>= (\x -> f x >>= g)
  const rightSide = chain(m, (x) => chain(f(x), g));
  
  assertEquals(leftSide, rightSide);
});

Deno.test("1_behavior: Totality - handles all possible inputs without throwing", () => {
  // Test with various input types to ensure totality
  const inputs = [
    null,
    undefined,
    0,
    -0,
    Infinity,
    -Infinity,
    NaN,
    "",
    "string",
    true,
    false,
    [],
    {},
    () => {},
    Symbol("test"),
    BigInt(9007199254740991),
  ];
  
  // All inputs should be handled without throwing
  for (const input of inputs) {
    const result = ok(input);
    assertEquals(result.ok, true);
    
    const errorRes = error(input);
    assertEquals(errorRes.ok, false);
  }
});

Deno.test("1_behavior: fold operation for Result type", () => {
  // Implement fold as a derived operation
  function fold<T, E, R>(
    result: Result<T, E>,
    onError: (error: E) => R,
    onSuccess: (data: T) => R,
  ): R {
    return result.ok ? onSuccess(result.data) : onError(result.error);
  }
  
  const successResult = ok(42);
  const errorResult = error<string>("failed");
  
  const successFolded = fold(
    successResult,
    (err) => `Error: ${err}`,
    (data) => `Success: ${data}`,
  );
  assertEquals(successFolded, "Success: 42");
  
  const errorFolded = fold(
    errorResult,
    (err) => `Error: ${err}`,
    (data: number) => `Success: ${data}`,
  );
  assertEquals(errorFolded, "Error: failed");
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: Result objects have correct shape", () => {
  const successResult = ok(42);
  assertEquals(Object.keys(successResult).sort(), ["data", "ok"]);
  assertEquals(typeof successResult.ok, "boolean");
  if (successResult.ok) {
    assertEquals(typeof successResult.data, "number");
  }

  const errorResult = error("failed");
  assertEquals(Object.keys(errorResult).sort(), ["error", "ok"]);
  assertEquals(typeof errorResult.ok, "boolean");
  if (!errorResult.ok) {
    assertEquals(typeof errorResult.error, "string");
  }
});

Deno.test("2_structure: Result supports different data types", () => {
  // String data
  const stringResult = ok("hello");
  if (stringResult.ok) {
    assertEquals(stringResult.data, "hello");
  }

  // Object data
  const objectResult = ok({ name: "test", value: 42 });
  if (objectResult.ok) {
    assertEquals(objectResult.data, { name: "test", value: 42 });
  }

  // Array data
  const arrayResult = ok([1, 2, 3]);
  if (arrayResult.ok) {
    assertEquals(arrayResult.data, [1, 2, 3]);
  }

  // Custom error types
  const customError = error({ code: 404, message: "Not found" });
  if (!customError.ok) {
    assertEquals(customError.error, { code: 404, message: "Not found" });
  }
});

Deno.test("2_structure: Function composition maintains type safety", () => {
  // Compose multiple operations
  const result = ok("42");
  
  const processed = chain(
    map(result, (s) => parseInt(s)),
    (n) => n > 0 ? ok(n * 2) : error("negative number")
  );
  
  assertEquals(processed.ok, true);
  if (processed.ok) {
    assertEquals(processed.data, 84);
  }
});

Deno.test("2_structure: Error type defaults to Error", () => {
  // When not specified, E defaults to Error
  const parseNumber = (s: string): Result<number> => {
    const num = parseInt(s);
    if (isNaN(num)) {
      return error(new Error("Invalid number"));
    }
    return ok(num);
  };

  const result = parseNumber("abc");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error instanceof Error, true);
    assertEquals(result.error.message, "Invalid number");
  }
});