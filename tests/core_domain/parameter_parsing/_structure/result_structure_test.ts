/**
 * @fileoverview Structure Test for Result Type
 *
 * Validates structural design and functional composition patterns
 * for the Result type following Totality principle.
 *
 * Key structural validations:
 * - Functional composition capabilities
 * - Error propagation patterns
 * - Type transformation consistency
 * - API surface coherence
 *
 * @module types/1_structureresult_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { all, chain, error, getOrElse, isError, isOk, map, ok, type Result } from "./result.ts";

/**
 * Structure Test Suite: Result Type
 *
 * These tests verify structural design principles:
 * 1. Consistent error propagation
 * 2. Functional composition patterns
 * 3. Type transformation coherence
 * 4. Monadic behavior compliance
 * 5. API surface consistency
 */
Deno.test("Result Type Structure", async (t) => {
  await t.step("implements consistent error propagation", () => {
    const _initialError = "initial error";
    const errorResult: Result<number, string> = error(_initialError);

    // Error should propagate through all operations
    const mapped = map(errorResult, (x) => x * 2);
    assertEquals(mapped.ok, false);
    if (!mapped.ok) assertEquals(mapped.error, _initialError);

    const chained = chain(errorResult, (x) => ok(x + 1));
    assertEquals(chained.ok, false);
    if (!chained.ok) assertEquals(chained.error, _initialError);

    // Error type should be preserved
    const chainedWithDifferentType = chain(errorResult, (x) => ok(`${x}`));
    assertEquals(chainedWithDifferentType.ok, false);
    if (!chainedWithDifferentType.ok) assertEquals(chainedWithDifferentType.error, _initialError);
  });

  await t.step("supports functional composition patterns", () => {
    const value = 10;
    const successResult = ok(value);

    // Should support method chaining through composition
    const result = chain(
      map(successResult, (x) => x * 2),
      (doubled) =>
        chain(
          ok(doubled + 5),
          (added) => ok(`Result: ${added}`),
        ),
    );

    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data, "Result: 25");

    // Should break chain on first error
    const errorInChain = chain(
      map(successResult, (x) => x * 2),
      (doubled) => error("Chain broken"),
    );

    assertEquals(errorInChain.ok, false);
    if (!errorInChain.ok) assertEquals(errorInChain.error, "Chain broken");
  });

  await t.step("maintains type transformation coherence", () => {
    // Number to string transformation
    const numberResult: Result<number, string> = ok(42);
    const stringResult: Result<string, string> = map(numberResult, (n) => `${n}`);

    assertEquals(stringResult.ok, true);
    if (stringResult.ok) {
      assertEquals(typeof stringResult.data, "string");
      assertEquals(stringResult.data, "42");
    }

    // Complex object transformation
    interface User {
      id: number;
      name: string;
    }
    interface UserView {
      display: string;
    }

    const userResult: Result<User, string> = ok({ id: 1, name: "Alice" });
    const viewResult: Result<UserView, string> = map(userResult, (user) => ({
      display: `${user.name} (${user.id})`,
    }));

    assertEquals(viewResult.ok, true);
    if (viewResult.ok) assertEquals(viewResult.data.display, "Alice (1)");
  });

  await t.step("implements monadic behavior patterns", () => {
    // Left identity: ok(a).chain(f) === f(a)
    const value = 5;
    const f = (x: number) => ok(x * 2);

    const leftSide = chain(ok(value), f);
    const rightSide = f(value);

    assertEquals(leftSide.ok, rightSide.ok);
    if (leftSide.ok && rightSide.ok) {
      assertEquals(leftSide.data, rightSide.data);
    }

    // Right identity: m.chain(ok) === m
    const m = ok(10);
    const rightIdentity = chain(m, ok);

    assertEquals(m.ok, rightIdentity.ok);
    if (m.ok && rightIdentity.ok) {
      assertEquals(m.data, rightIdentity.data);
    }

    // Associativity: m.chain(f).chain(g) === m.chain(x => f(x).chain(g))
    const g = (x: number) => ok(x + 1);

    const leftAssoc = chain(chain(m, f), g);
    const rightAssoc = chain(m, (x) => chain(f(x), g));

    assertEquals(leftAssoc.ok, rightAssoc.ok);
    if (leftAssoc.ok && rightAssoc.ok) {
      assertEquals(leftAssoc.data, rightAssoc.data);
    }
  });

  await t.step("provides consistent API surface", () => {
    // Constructor functions should be consistent
    const successValue = 42;
    const errorValue = "test error";

    const successResult = ok(successValue);
    const errorResult = error(errorValue);

    // Type guards should be consistent
    assertEquals(isOk(successResult), true);
    assertEquals(isError(successResult), false);
    assertEquals(isOk(errorResult), false);
    assertEquals(isError(errorResult), true);

    // Utility functions should handle both cases
    assertEquals(getOrElse(successResult, 0), successValue);
    assertEquals(getOrElse(errorResult, 0), 0);

    // Should work with different types
    const stringSuccess = ok("hello");
    const stringError = error(404);

    assertEquals(getOrElse(stringSuccess, "default"), "hello");
    assertEquals(getOrElse(stringError, "default"), "default");
  });

  await t.step("handles collection operations correctly", () => {
    // All successful results
    const allSuccess = [ok(1), ok(2), ok(3)];
    const successResult = all(allSuccess);

    assertEquals(successResult.ok, true);
    if (successResult.ok) {
      assertEquals(successResult.data, [1, 2, 3]);
      assertEquals(successResult.data.length, 3);
    }

    // Mix of success and error
    const mixedResults = [ok(1), error("fail"), ok(3)];
    const errorResult = all(mixedResults);

    assertEquals(errorResult.ok, false);
    if (!errorResult.ok) assertEquals(errorResult.error, "fail");

    // Empty array should succeed
    const emptyResults: Result<number, string>[] = [];
    const emptyResult = all(emptyResults);

    assertEquals(emptyResult.ok, true);
    if (emptyResult.ok) assertEquals(emptyResult.data.length, 0);
  });

  await t.step("maintains referential transparency", () => {
    // Same input should always produce same output
    const input = 42;

    const result1 = ok(input);
    const result2 = ok(input);

    // Results should be structurally equal but different objects
    assertEquals(result1.ok, result2.ok);
    if (result1.ok && result2.ok) {
      assertEquals(result1.data, result2.data);
      assertEquals(result1 === result2, false, "Should create new objects");
    }

    // Functions should be pure
    const mapFn = (x: number) => x * 2;
    const mapped1 = map(result1, mapFn);
    const mapped2 = map(result2, mapFn);

    assertEquals(mapped1.ok, mapped2.ok);
    if (mapped1.ok && mapped2.ok) {
      assertEquals(mapped1.data, mapped2.data);
    }
  });
});

/**
 * Error Handling Structure Test
 *
 * Tests the structural patterns for error handling
 */
Deno.test("Result Type Error Handling Structure", async (t) => {
  await t.step("preserves error types through transformations", () => {
    // String errors
    const stringError: Result<number, string> = error("string error");
    const mappedString = map(stringError, (x) => x.toString());

    assertEquals(mappedString.ok, false);
    if (!mappedString.ok) {
      assertEquals(typeof mappedString.error, "string");
      assertEquals(mappedString.error, "string error");
    }

    // Object errors
    interface CustomError {
      code: number;
      message: string;
    }
    const customError: Result<number, CustomError> = error({ code: 404, message: "Not found" });
    const mappedCustom = map(customError, (x) => x * 2);

    assertEquals(mappedCustom.ok, false);
    if (!mappedCustom.ok) {
      assertEquals(mappedCustom.error.code, 404);
      assertEquals(mappedCustom.error.message, "Not found");
    }
  });

  await t.step("supports error transformation patterns", () => {
    // Error should be transformable in chain operations
    const initialValue = 10;
    const result = chain(ok(initialValue), (value) => {
      if (value > 5) {
        return error("Value too large");
      }
      return ok(value * 2);
    });

    assertEquals(result.ok, false);
    if (!result.ok) assertEquals(result.error, "Value too large");

    // Should work with complex error types
    interface ValidationError {
      field: string;
      rule: string;
      value: unknown;
    }

    const validate = (x: number): Result<number, ValidationError> => {
      if (x < 0) {
        return error({ field: "value", rule: "positive", value: x });
      }
      return ok(x);
    };

    const validationResult = chain(ok(-1), validate);
    assertEquals(validationResult.ok, false);
    if (!validationResult.ok) {
      assertEquals(validationResult.error.field, "value");
      assertEquals(validationResult.error.rule, "positive");
      assertEquals(validationResult.error.value, -1);
    }
  });

  await t.step("maintains error context through nested operations", () => {
    // Nested chain operations should preserve error context
    const processValue = (x: number): Result<string, string> => {
      return chain(
        x > 0 ? ok(x) : error("negative value"),
        (positive) =>
          chain(
            positive < 100 ? ok(positive) : error("value too large"),
            (valid) => ok(`Processed: ${valid}`),
          ),
      );
    };

    // Test error in first step
    const result1 = processValue(-5);
    assertEquals(result1.ok, false);
    if (!result1.ok) assertEquals(result1.error, "negative value");

    // Test error in second step
    const result2 = processValue(150);
    assertEquals(result2.ok, false);
    if (!result2.ok) assertEquals(result2.error, "value too large");

    // Test successful path
    const result3 = processValue(50);
    assertEquals(result3.ok, true);
    if (result3.ok) assertEquals(result3.data, "Processed: 50");
  });
});
