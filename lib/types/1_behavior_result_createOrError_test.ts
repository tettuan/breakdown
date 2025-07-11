/**
 * @fileoverview Tests for createOrError pattern with Result type
 * Testing Result type usage with ValidationError and ErrorFactory
 *
 * This test demonstrates how Result type can be used with
 * createOrError pattern similar to DirectiveType implementation
 */

import { assertEquals, assertExists } from "@std/assert";
import { error, ok, Result } from "./result.ts";
import { ErrorFactory, ValidationError } from "./mod.ts";

// Example domain type with createOrError pattern
class ExampleDomainType {
  private constructor(private readonly value: string) {}

  getValue(): string {
    return this.value;
  }

  /**
   * Create instance with validation using Result type
   * Similar to DirectiveType.createOrError pattern
   */
  static createOrError(
    value: string,
    options?: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    },
  ): Result<ExampleDomainType, ValidationError> {
    // Validate empty string
    if (!value || value.trim().length === 0) {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "value",
        source: "ExampleDomainType",
      }));
    }

    // Validate minimum length
    if (options?.minLength && value.length < options.minLength) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "value",
        value: value,
        reason: `Value must be at least ${options.minLength} characters long`,
      }));
    }

    // Validate maximum length
    if (options?.maxLength && value.length > options.maxLength) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "value",
        value: value,
        reason: `Value must not exceed ${options.maxLength} characters`,
      }));
    }

    // Validate pattern
    if (options?.pattern && !options.pattern.test(value)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "value",
        value: value,
        reason: `Value does not match required pattern: ${options.pattern.source}`,
      }));
    }

    // All validations passed
    return ok(new ExampleDomainType(value));
  }
}

Deno.test("1_behavior: createOrError pattern validates empty input", () => {
  const result1 = ExampleDomainType.createOrError("");
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "MissingRequiredField");
    if (result1.error.kind === "MissingRequiredField") {
      assertEquals(result1.error.field, "value");
    }
  }

  const result2 = ExampleDomainType.createOrError("   ");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "MissingRequiredField");
  }
});

Deno.test("1_behavior: createOrError pattern validates length constraints", () => {
  // Test minimum length
  const tooShort = ExampleDomainType.createOrError("ab", { minLength: 3 });
  assertEquals(tooShort.ok, false);
  if (!tooShort.ok) {
    assertEquals(tooShort.error.kind, "InvalidInput");
    if (tooShort.error.kind === "InvalidInput") {
      assertEquals(tooShort.error.reason, "Value must be at least 3 characters long");
    }
  }

  // Test maximum length
  const tooLong = ExampleDomainType.createOrError("hello world", { maxLength: 5 });
  assertEquals(tooLong.ok, false);
  if (!tooLong.ok) {
    assertEquals(tooLong.error.kind, "InvalidInput");
    if (tooLong.error.kind === "InvalidInput") {
      assertEquals(tooLong.error.reason, "Value must not exceed 5 characters");
    }
  }

  // Test valid length
  const valid = ExampleDomainType.createOrError("hello", { minLength: 3, maxLength: 10 });
  assertEquals(valid.ok, true);
  if (valid.ok) {
    assertEquals(valid.data.getValue(), "hello");
  }
});

Deno.test("1_behavior: createOrError pattern validates regex patterns", () => {
  const alphanumericPattern = /^[a-zA-Z0-9]+$/;

  // Test invalid pattern match
  const invalid = ExampleDomainType.createOrError("hello world!", { pattern: alphanumericPattern });
  assertEquals(invalid.ok, false);
  if (!invalid.ok) {
    assertEquals(invalid.error.kind, "InvalidInput");
    if (invalid.error.kind === "InvalidInput") {
      assertEquals(invalid.error.reason, "Value does not match required pattern: ^[a-zA-Z0-9]+$");
    }
  }

  // Test valid pattern match
  const valid = ExampleDomainType.createOrError("hello123", { pattern: alphanumericPattern });
  assertEquals(valid.ok, true);
  if (valid.ok) {
    assertEquals(valid.data.getValue(), "hello123");
  }
});

Deno.test("1_behavior: createOrError pattern combines multiple validations", () => {
  const options = {
    minLength: 5,
    maxLength: 10,
    pattern: /^[A-Z][a-z]+$/,
  };

  // Test all validation failures
  const testCases = [
    { input: "abc", expectedError: "Value must be at least 5 characters long" },
    { input: "VeryLongName", expectedError: "Value must not exceed 10 characters" },
    { input: "lowercase", expectedError: "Value does not match required pattern: ^[A-Z][a-z]+$" },
    { input: "Valid", expectedSuccess: true },
    { input: "Validation", expectedSuccess: true },
  ];

  for (const { input, expectedError, expectedSuccess } of testCases) {
    const result = ExampleDomainType.createOrError(input, options);

    if (expectedSuccess) {
      assertEquals(result.ok, true, `Expected success for input: ${input}`);
      if (result.ok) {
        assertEquals(result.data.getValue(), input);
      }
    } else {
      assertEquals(result.ok, false, `Expected error for input: ${input}`);
      if (!result.ok && result.error.kind === "InvalidInput") {
        assertEquals(result.error.reason, expectedError);
      }
    }
  }
});

Deno.test("1_behavior: Result type with ErrorFactory provides clear error messages", () => {
  // Simulating DirectiveType-like validation
  function validateDirectiveType(value: string): Result<string, ValidationError> {
    const validDirectives = ["to", "from", "summary", "defect"];

    if (!value) {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "directiveType",
        source: "DirectiveValidator",
      }));
    }

    if (!validDirectives.includes(value)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "directiveType",
        value: value,
        reason: `Invalid directive type. Must be one of: ${validDirectives.join(", ")}`,
      }));
    }

    return ok(value);
  }

  // Test missing field
  const missing = validateDirectiveType("");
  assertEquals(missing.ok, false);
  if (!missing.ok) {
    assertEquals(missing.error.kind, "MissingRequiredField");
    if (missing.error.kind === "MissingRequiredField") {
      assertEquals(missing.error.field, "directiveType");
    }
  }

  // Test invalid value
  const invalid = validateDirectiveType("invalid");
  assertEquals(invalid.ok, false);
  if (!invalid.ok) {
    assertEquals(invalid.error.kind, "InvalidInput");
    if (invalid.error.kind === "InvalidInput") {
      assertEquals(invalid.error.value, "invalid");
      assertExists(invalid.error.reason);
      assertEquals(invalid.error.reason.includes("to, from, summary, defect"), true);
    }
  }

  // Test valid value
  const valid = validateDirectiveType("summary");
  assertEquals(valid.ok, true);
  if (valid.ok) {
    assertEquals(valid.data, "summary");
  }
});

Deno.test("1_behavior: createOrError pattern ensures Totality principle", () => {
  // Every possible input produces a defined output (no exceptions)
  const inputs = [
    "", // Empty string
    "   ", // Whitespace
    "valid", // Normal string
    "a".repeat(100), // Very long string
    "特殊文字", // Unicode
    "🎯", // Emoji
    null as unknown as string, // Invalid type - cast through unknown first
    undefined as unknown as string, // Invalid type - cast through unknown first
  ];

  for (const input of inputs) {
    // Should never throw, always return Result
    let result: Result<ExampleDomainType, ValidationError>;
    try {
      result = ExampleDomainType.createOrError(input);
      assertExists(result);
      assertEquals(typeof result.ok, "boolean");
    } catch (_e) {
      // This should never happen with proper Totality implementation
      throw new Error(`Totality violation: createOrError threw exception for input: ${input}`);
    }
  }
});
