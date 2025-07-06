/**
 * @fileoverview Result Type Tests
 * 
 * Tests for Result type implementation ensuring Totality principle
 * compliance. Validates error handling without exceptions and
 * proper monadic operations.
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { 
  Result, 
  ok, 
  error, 
  isOk, 
  isError, 
  map, 
  chain, 
  getOrElse, 
  all 
} from "../../../lib/types/result.ts";

const logger = new BreakdownLogger("result-type-test");

Deno.test("Result Type: ok() constructor", async () => {
  logger.debug("Testing Result ok constructor");
  
  const result = ok(42);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, 42);
  }
});

Deno.test("Result Type: error() constructor", async () => {
  logger.debug("Testing Result error constructor");
  
  const result = error("Something went wrong");
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Something went wrong");
  }
});

Deno.test("Result Type: isOk() type guard", async () => {
  logger.debug("Testing isOk type guard");
  
  const successResult = ok("success");
  const errorResult = error("error");
  
  assertEquals(isOk(successResult), true);
  assertEquals(isOk(errorResult), false);
  
  if (isOk(successResult)) {
    assertEquals(successResult.data, "success");
  }
});

Deno.test("Result Type: isError() type guard", async () => {
  logger.debug("Testing isError type guard");
  
  const successResult = ok("success");
  const errorResult = error("error");
  
  assertEquals(isError(successResult), false);
  assertEquals(isError(errorResult), true);
  
  if (isError(errorResult)) {
    assertEquals(errorResult.error, "error");
  }
});

Deno.test("Result Type: map() operation on success", async () => {
  logger.debug("Testing map operation on successful result");
  
  const result = ok(10);
  const mapped = map(result, (x) => x * 2);
  
  assertEquals(mapped.ok, true);
  if (mapped.ok) {
    assertEquals(mapped.data, 20);
  }
});

Deno.test("Result Type: map() operation on error", async () => {
  logger.debug("Testing map operation on error result");
  
  const result = error("original error");
  const mapped = map(result, (x: number) => x * 2);
  
  assertEquals(mapped.ok, false);
  if (!mapped.ok) {
    assertEquals(mapped.error, "original error");
  }
});

Deno.test("Result Type: chain() operation on success", async () => {
  logger.debug("Testing chain operation on successful result");
  
  const result = ok(10);
  const chained = chain(result, (x) => ok(x.toString()));
  
  assertEquals(chained.ok, true);
  if (chained.ok) {
    assertEquals(chained.data, "10");
  }
});

Deno.test("Result Type: chain() operation on error", async () => {
  logger.debug("Testing chain operation on error result");
  
  const result = error("original error");
  const chained = chain(result, (x: number) => ok(x.toString()));
  
  assertEquals(chained.ok, false);
  if (!chained.ok) {
    assertEquals(chained.error, "original error");
  }
});

Deno.test("Result Type: chain() with inner error", async () => {
  logger.debug("Testing chain operation where inner function returns error");
  
  const result = ok(10);
  const chained = chain(result, (_x) => error("inner error"));
  
  assertEquals(chained.ok, false);
  if (!chained.ok) {
    assertEquals(chained.error, "inner error");
  }
});

Deno.test("Result Type: getOrElse() with success", async () => {
  logger.debug("Testing getOrElse with successful result");
  
  const result = ok("success value");
  const value = getOrElse(result, "default");
  
  assertEquals(value, "success value");
});

Deno.test("Result Type: getOrElse() with error", async () => {
  logger.debug("Testing getOrElse with error result");
  
  const result = error("error occurred");
  const value = getOrElse(result, "default");
  
  assertEquals(value, "default");
});

Deno.test("Result Type: all() with all success", async () => {
  logger.debug("Testing all operation with all successful results");
  
  const results = [ok(1), ok(2), ok(3)];
  const combined = all(results);
  
  assertEquals(combined.ok, true);
  if (combined.ok) {
    assertEquals(combined.data, [1, 2, 3]);
  }
});

Deno.test("Result Type: all() with one error", async () => {
  logger.debug("Testing all operation with one error");
  
  const results = [ok(1), error("failed"), ok(3)];
  const combined = all(results);
  
  assertEquals(combined.ok, false);
  if (!combined.ok) {
    assertEquals(combined.error, "failed");
  }
});

Deno.test("Result Type: all() with empty array", async () => {
  logger.debug("Testing all operation with empty array");
  
  const results: Result<number, string>[] = [];
  const combined = all(results);
  
  assertEquals(combined.ok, true);
  if (combined.ok) {
    assertEquals(combined.data, []);
  }
});

Deno.test("Result Type: complex chaining scenario", async () => {
  logger.debug("Testing complex Result chaining scenario");
  
  function parseNumber(input: string): Result<number, string> {
    const num = parseInt(input);
    if (isNaN(num)) {
      return error("Invalid number format");
    }
    return ok(num);
  }
  
  function validatePositive(num: number): Result<number, string> {
    if (num <= 0) {
      return error("Number must be positive");
    }
    return ok(num);
  }
  
  function doubleNumber(num: number): Result<number, string> {
    return ok(num * 2);
  }
  
  // Success case
  const result1 = chain(
    chain(parseNumber("10"), validatePositive),
    doubleNumber
  );
  
  assertEquals(result1.ok, true);
  if (result1.ok) {
    assertEquals(result1.data, 20);
  }
  
  // Parse error case
  const result2 = chain(
    chain(parseNumber("invalid"), validatePositive),
    doubleNumber
  );
  
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error, "Invalid number format");
  }
  
  // Validation error case
  const result3 = chain(
    chain(parseNumber("-5"), validatePositive),
    doubleNumber
  );
  
  assertEquals(result3.ok, false);
  if (!result3.ok) {
    assertEquals(result3.error, "Number must be positive");
  }
});

Deno.test("Result Type: Totality principle compliance", async () => {
  logger.debug("Testing Totality principle compliance");
  
  // Result type should handle all possible outcomes explicitly
  function safeDivide(a: number, b: number): Result<number, string> {
    if (b === 0) {
      return error("Division by zero");
    }
    return ok(a / b);
  }
  
  // All cases are handled explicitly without exceptions
  const validResult = safeDivide(10, 2);
  const errorResult = safeDivide(10, 0);
  
  assertEquals(validResult.ok, true);
  assertEquals(errorResult.ok, false);
  
  // Type system enforces explicit handling
  if (validResult.ok) {
    assertEquals(validResult.data, 5);
  }
  
  if (!errorResult.ok) {
    assertEquals(errorResult.error, "Division by zero");
  }
});

Deno.test("Result Type: Monad laws compliance", async () => {
  logger.debug("Testing monad laws compliance");
  
  // Left identity: ok(a).chain(f) === f(a)
  const value = 42;
  const f = (x: number) => ok(x.toString());
  
  const leftIdentity1 = chain(ok(value), f);
  const leftIdentity2 = f(value);
  
  assertEquals(leftIdentity1.ok, leftIdentity2.ok);
  if (leftIdentity1.ok && leftIdentity2.ok) {
    assertEquals(leftIdentity1.data, leftIdentity2.data);
  }
  
  // Right identity: m.chain(ok) === m
  const m = ok(value);
  const rightIdentity = chain(m, ok);
  
  assertEquals(rightIdentity.ok, m.ok);
  if (rightIdentity.ok && m.ok) {
    assertEquals(rightIdentity.data, m.data);
  }
  
  // Associativity: m.chain(f).chain(g) === m.chain(x => f(x).chain(g))
  const g = (x: string) => ok(x.length);
  
  const assoc1 = chain(chain(m, f), g);
  const assoc2 = chain(m, (x) => chain(f(x), g));
  
  assertEquals(assoc1.ok, assoc2.ok);
  if (assoc1.ok && assoc2.ok) {
    assertEquals(assoc1.data, assoc2.data);
  }
});