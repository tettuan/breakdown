/**
 * @fileoverview Behavior tests for Result type module
 * Testing business logic and expected behaviors with Result-based Totality
 *
 * Behavior tests verify:
 * - Business rules and invariants
 * - Error handling with Result type
 * - Edge cases and boundary conditions
 * - Functional operations (map, flatMap/chain, getOrElse)
 */

import { assertEquals, assertExists } from "@std/assert";
import { chain, error, getOrElse, isError, isOk, map, ok, Result } from "./result.ts";

Deno.test("1_behavior: ok() creates successful Result with correct structure", () => {
  const testCases = [
    { value: 42, description: "number" },
    { value: "hello", description: "string" },
    { value: true, description: "boolean" },
    { value: null, description: "null" },
    { value: undefined, description: "undefined" },
    { value: { nested: "object" }, description: "object" },
    { value: [1, 2, 3], description: "array" },
  ];

  for (const { value, description } of testCases) {
    const result = ok(value);

    assertExists(result);
    assertEquals(result.ok, true, `Should create success Result for ${description}`);
    if (result.ok) {
      assertEquals(result.data, value, `Should contain correct value for ${description}`);
    }
  }
});

Deno.test("1_behavior: error() creates error Result with correct structure", () => {
  const errorCases = [
    { error: "simple string error", description: "string error" },
    { error: new Error("Error object"), description: "Error instance" },
    { error: { code: "ERR001", message: "Custom error" }, description: "custom error object" },
    { error: 404, description: "number error" },
    { error: null, description: "null error" },
  ];

  for (const { error: errorValue, description } of errorCases) {
    const result = error(errorValue);

    assertExists(result);
    assertEquals(result.ok, false, `Should create error Result for ${description}`);
    if (!result.ok) {
      assertEquals(result.error, errorValue, `Should contain correct error for ${description}`);
    }
  }
});

Deno.test("1_behavior: isOk() and isError() type guards work correctly", () => {
  const success: Result<number, string> = ok(42);
  const failure: Result<number, string> = error("failed");

  // isOk tests
  assertEquals(isOk(success), true);
  assertEquals(isOk(failure), false);

  // isError tests
  assertEquals(isError(success), false);
  assertEquals(isError(failure), true);

  // Type narrowing behavior
  if (isOk(success)) {
    // TypeScript knows success.data exists here
    assertEquals(success.data, 42);
  }

  if (isError(failure)) {
    // TypeScript knows failure.error exists here
    assertEquals(failure.error, "failed");
  }
});

Deno.test("1_behavior: map() transforms success values correctly", () => {
  const double = (n: number) => n * 2;
  const toString = (n: number) => n.toString();

  // Map over success
  const success: Result<number, string> = ok(21);
  const doubled = map(success, double);
  const stringified = map(success, toString);

  assertEquals(doubled.ok, true);
  if (doubled.ok) {
    assertEquals(doubled.data, 42);
  }

  assertEquals(stringified.ok, true);
  if (stringified.ok) {
    assertEquals(stringified.data, "21");
  }

  // Map over error (should not transform)
  const failure: Result<number, string> = error("error");
  const mappedError = map(failure, double);

  assertEquals(mappedError.ok, false);
  if (!mappedError.ok) {
    assertEquals(mappedError.error, "error");
  }
});

Deno.test("1_behavior: map() supports complex transformations", () => {
  interface User {
    id: number;
    name: string;
  }

  interface UserDTO {
    userId: number;
    displayName: string;
  }

  const toDTO = (user: User): UserDTO => ({
    userId: user.id,
    displayName: user.name.toUpperCase(),
  });

  const userResult: Result<User, string> = ok({ id: 1, name: "alice" });
  const dtoResult = map(userResult, toDTO);

  assertEquals(dtoResult.ok, true);
  if (dtoResult.ok) {
    assertEquals(dtoResult.data.userId, 1);
    assertEquals(dtoResult.data.displayName, "ALICE");
  }
});

Deno.test("1_behavior: chain()/flatMap chains operations correctly", () => {
  const parseNumber = (s: string): Result<number, string> => {
    const n = parseInt(s, 10);
    return isNaN(n) ? error(`Cannot parse "${s}"`) : ok(n);
  };

  const safeDivide = (n: number): Result<number, string> => {
    return n === 0 ? error("Division by zero") : ok(100 / n);
  };

  // Successful chain
  const result1 = chain(parseNumber("10"), safeDivide);
  assertEquals(result1.ok, true);
  if (result1.ok) {
    assertEquals(result1.data, 10);
  }

  // Chain with first operation failing
  const result2 = chain(parseNumber("invalid"), safeDivide);
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error, 'Cannot parse "invalid"');
  }

  // Chain with second operation failing
  const result3 = chain(parseNumber("0"), safeDivide);
  assertEquals(result3.ok, false);
  if (!result3.ok) {
    assertEquals(result3.error, "Division by zero");
  }
});

Deno.test("1_behavior: chain() enables sequential validation", () => {
  interface FormData {
    email: string;
    age: string;
  }

  const validateEmail = (email: string): Result<string, string> => {
    if (!email.includes("@")) {
      return error("Invalid email format");
    }
    return ok(email);
  };

  const validateAge = (ageStr: string): Result<number, string> => {
    const age = parseInt(ageStr, 10);
    if (isNaN(age)) {
      return error("Age must be a number");
    }
    if (age < 18) {
      return error("Must be 18 or older");
    }
    return ok(age);
  };

  const processForm = (data: FormData): Result<{ email: string; age: number }, string> => {
    const emailResult = validateEmail(data.email);
    if (!emailResult.ok) return emailResult;

    const ageResult = validateAge(data.age);
    if (!ageResult.ok) return ageResult;

    return ok({ email: emailResult.data, age: ageResult.data });
  };

  // Valid form
  const valid = processForm({ email: "user@example.com", age: "25" });
  assertEquals(valid.ok, true);
  if (valid.ok) {
    assertEquals(valid.data.email, "user@example.com");
    assertEquals(valid.data.age, 25);
  }

  // Invalid email
  const invalidEmail = processForm({ email: "notanemail", age: "25" });
  assertEquals(invalidEmail.ok, false);
  if (!invalidEmail.ok) {
    assertEquals(invalidEmail.error, "Invalid email format");
  }

  // Invalid age
  const invalidAge = processForm({ email: "user@example.com", age: "17" });
  assertEquals(invalidAge.ok, false);
  if (!invalidAge.ok) {
    assertEquals(invalidAge.error, "Must be 18 or older");
  }
});

Deno.test("1_behavior: getOrElse() provides default values correctly", () => {
  const success: Result<number, string> = ok(42);
  const failure: Result<number, string> = error("failed");

  // Get value from success
  assertEquals(getOrElse(success, 0), 42);
  assertEquals(getOrElse(success, 100), 42);

  // Get default from error
  assertEquals(getOrElse(failure, 0), 0);
  assertEquals(getOrElse(failure, 100), 100);

  // Works with different types
  const stringSuccess: Result<string, Error> = ok("hello");
  const stringFailure: Result<string, Error> = error(new Error("failed"));

  assertEquals(getOrElse(stringSuccess, "default"), "hello");
  assertEquals(getOrElse(stringFailure, "default"), "default");
});

Deno.test("1_behavior: Result type handles edge cases gracefully", () => {
  // Empty string
  const emptyString = ok("");
  assertEquals(emptyString.ok, true);
  if (emptyString.ok) {
    assertEquals(emptyString.data, "");
  }

  // Zero
  const zero = ok(0);
  assertEquals(zero.ok, true);
  if (zero.ok) {
    assertEquals(zero.data, 0);
  }

  // False
  const falseValue = ok(false);
  assertEquals(falseValue.ok, true);
  if (falseValue.ok) {
    assertEquals(falseValue.data, false);
  }

  // Nested Results
  const nestedSuccess: Result<Result<number, string>, Error> = ok(ok(42));
  assertEquals(nestedSuccess.ok, true);
  if (nestedSuccess.ok) {
    assertEquals(nestedSuccess.data.ok, true);
    if (nestedSuccess.data.ok) {
      assertEquals(nestedSuccess.data.data, 42);
    }
  }
});

Deno.test("1_behavior: Result enables railway-oriented programming", () => {
  // Define a series of operations that might fail
  const step1 = (input: string): Result<number, string> => {
    const n = parseInt(input, 10);
    return isNaN(n) ? error("Step 1 failed: Not a number") : ok(n);
  };

  const step2 = (n: number): Result<number, string> => {
    return n < 0 ? error("Step 2 failed: Negative number") : ok(n * 2);
  };

  const step3 = (n: number): Result<string, string> => {
    return n > 100 ? error("Step 3 failed: Too large") : ok(`Result: ${n}`);
  };

  // Compose operations
  const pipeline = (input: string): Result<string, string> => {
    const r1 = step1(input);
    if (!r1.ok) return r1;

    const r2 = step2(r1.data);
    if (!r2.ok) return r2;

    return step3(r2.data);
  };

  // Test successful path
  const success = pipeline("25");
  assertEquals(success.ok, true);
  if (success.ok) {
    assertEquals(success.data, "Result: 50");
  }

  // Test failure at step 1
  const fail1 = pipeline("not-a-number");
  assertEquals(fail1.ok, false);
  if (!fail1.ok) {
    assertEquals(fail1.error, "Step 1 failed: Not a number");
  }

  // Test failure at step 2
  const fail2 = pipeline("-5");
  assertEquals(fail2.ok, false);
  if (!fail2.ok) {
    assertEquals(fail2.error, "Step 2 failed: Negative number");
  }

  // Test failure at step 3
  const fail3 = pipeline("60");
  assertEquals(fail3.ok, false);
  if (!fail3.ok) {
    assertEquals(fail3.error, "Step 3 failed: Too large");
  }
});

Deno.test("1_behavior: Result type promotes explicit error handling", () => {
  // Function that might fail in multiple ways
  function parseAndValidateAge(input: string): Result<number, string> {
    // Step 1: Check if input is empty
    if (!input.trim()) {
      return error("Age is required");
    }

    // Step 2: Parse number
    const age = parseInt(input, 10);
    if (isNaN(age)) {
      return error("Age must be a valid number");
    }

    // Step 3: Validate range
    if (age < 0) {
      return error("Age cannot be negative");
    }

    if (age > 150) {
      return error("Age seems unrealistic");
    }

    return ok(age);
  }

  // Test various scenarios
  const testCases = [
    { input: "25", expectedOk: true, expectedValue: 25 },
    { input: "", expectedOk: false, expectedError: "Age is required" },
    { input: "   ", expectedOk: false, expectedError: "Age is required" },
    { input: "abc", expectedOk: false, expectedError: "Age must be a valid number" },
    { input: "-5", expectedOk: false, expectedError: "Age cannot be negative" },
    { input: "200", expectedOk: false, expectedError: "Age seems unrealistic" },
    { input: "0", expectedOk: true, expectedValue: 0 },
    { input: "150", expectedOk: true, expectedValue: 150 },
  ];

  for (const { input, expectedOk, expectedValue, expectedError } of testCases) {
    const result = parseAndValidateAge(input);
    assertEquals(result.ok, expectedOk, `Failed for input: "${input}"`);

    if (expectedOk && result.ok) {
      assertEquals(result.data, expectedValue);
    } else if (!expectedOk && !result.ok) {
      assertEquals(result.error, expectedError);
    }
  }
});
