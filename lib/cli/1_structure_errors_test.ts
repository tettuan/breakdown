/**
 * @fileoverview Structure tests for CLI errors module
 * 
 * Tests structural integrity and design patterns:
 * - Constructor parameter validation
 * - Property accessibility and types
 * - Method signatures and contracts
 * - Error object structure consistency
 * - Enum value structure and patterns
 * 
 * @module cli/1_structure_errors_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { CliError, CliErrorCode } from "./errors.ts";

Deno.test("Structure: CliError constructor parameter handling", () => {
  // Test with all valid error codes
  const errorCodes = Object.values(CliErrorCode);
  
  for (const code of errorCodes) {
    const testMessage = `Test message for ${code}`;
    const error = new CliError(code, testMessage);
    
    assertEquals(error.code, code, `Should set code correctly for ${code}`);
    assertEquals(
      error.message,
      `[${code}] ${testMessage}`,
      `Should format message correctly for ${code}`
    );
    assertEquals(error.name, "CliError", `Should set name correctly for ${code}`);
  }
});

Deno.test("Structure: CliError property types and accessibility", () => {
  const error = new CliError(CliErrorCode.INVALID_OPTION, "Test message");
  
  // Code property
  assertEquals(typeof error.code, "string", "Code should be string type");
  assertEquals(error.code, CliErrorCode.INVALID_OPTION, "Code should be accessible");
  
  // Message property (inherited from Error)
  assertEquals(typeof error.message, "string", "Message should be string type");
  assertEquals(
    error.message.includes("Test message"),
    true,
    "Message should include original text"
  );
  assertEquals(
    error.message.includes("[INVALID_OPTION]"),
    true,
    "Message should include error code"
  );
  
  // Name property
  assertEquals(typeof error.name, "string", "Name should be string type");
  assertEquals(error.name, "CliError", "Name should be 'CliError'");
  
  // Stack property (inherited from Error)
  assertEquals(typeof error.stack, "string", "Stack should be string type");
  assertExists(error.stack, "Stack should exist");
});

Deno.test("Structure: CliErrorCode enum value structure", () => {
  const errorCodes = Object.entries(CliErrorCode);
  
  for (const [key, value] of errorCodes) {
    // Key and value should be identical (string enum pattern)
    assertEquals(key, value, `Enum key ${key} should equal value ${value}`);
    
    // Value should be uppercase with underscores
    const upperCasePattern = /^[A-Z][A-Z_]*$/;
    assertEquals(
      upperCasePattern.test(value),
      true,
      `Value ${value} should follow UPPER_CASE pattern`
    );
    
    // Should not contain spaces or special characters (except underscore)
    assertEquals(
      /^[A-Z_]+$/.test(value),
      true,
      `Value ${value} should only contain letters and underscores`
    );
  }
});

Deno.test("Structure: Error message formatting consistency", () => {
  const testCases = [
    {
      code: CliErrorCode.INVALID_OPTION,
      message: "Simple message",
      expectedStart: "[INVALID_OPTION] Simple message"
    },
    {
      code: CliErrorCode.DUPLICATE_OPTION,
      message: "Message with symbols !@#$%",
      expectedStart: "[DUPLICATE_OPTION] Message with symbols !@#$%"
    },
    {
      code: CliErrorCode.MISSING_REQUIRED,
      message: "",
      expectedStart: "[MISSING_REQUIRED] "
    },
    {
      code: CliErrorCode.CONFLICTING_OPTIONS,
      message: "Multi-line\nmessage\nwith\nbreaks",
      expectedStart: "[CONFLICTING_OPTIONS] Multi-line\nmessage\nwith\nbreaks"
    }
  ];
  
  for (const testCase of testCases) {
    const error = new CliError(testCase.code, testCase.message);
    
    assertEquals(
      error.message,
      testCase.expectedStart,
      `Message formatting should be consistent for ${testCase.code}`
    );
    
    // Should always start with [CODE] pattern
    assertEquals(
      error.message.startsWith(`[${testCase.code}]`),
      true,
      `Should start with code bracket for ${testCase.code}`
    );
    
    // Should have exactly one space after closing bracket
    const expectedPosition = testCase.code.length + 2; // '[' + code + ']' + ' '
    assertEquals(
      error.message.charAt(expectedPosition),
      " ",
      `Should have space after bracket for ${testCase.code}`
    );
  }
});

Deno.test("Structure: CliError inheritance structure", () => {
  const error = new CliError(CliErrorCode.INVALID_INPUT_TYPE, "Test");
  
  // Should have Error prototype chain
  assertEquals(
    Object.getPrototypeOf(error).constructor.name,
    "CliError",
    "Direct prototype should be CliError"
  );
  assertEquals(
    Object.getPrototypeOf(Object.getPrototypeOf(error)).constructor.name,
    "Error",
    "Should inherit from Error"
  );
  
  // Should have all Error properties
  assertExists(error.message, "Should have message property");
  assertExists(error.name, "Should have name property");
  assertExists(error.stack, "Should have stack property");
  
  // Should be detectable via instanceof
  assertEquals(error instanceof Error, true, "Should be instanceof Error");
  assertEquals(error instanceof CliError, true, "Should be instanceof CliError");
  
  // Should not be instanceof other error types
  assertEquals(error instanceof TypeError, false, "Should not be TypeError");
  assertEquals(error instanceof RangeError, false, "Should not be RangeError");
});

Deno.test("Structure: CliErrorCode completeness for CLI scenarios", () => {
  const codes = Object.values(CliErrorCode);
  
  // Should cover option parsing scenarios
  const hasOptionErrors = codes.some(code => 
    code.includes("OPTION") || code.includes("DUPLICATE")
  );
  assertEquals(hasOptionErrors, true, "Should have option-related errors");
  
  // Should cover validation scenarios  
  const hasValidationErrors = codes.some(code =>
    code.includes("INVALID") || code.includes("PARAMETERS")
  );
  assertEquals(hasValidationErrors, true, "Should have validation errors");
  
  // Should cover requirement scenarios
  const hasRequirementErrors = codes.some(code =>
    code.includes("MISSING") || code.includes("REQUIRED")
  );
  assertEquals(hasRequirementErrors, true, "Should have requirement errors");
  
  // Should cover conflict scenarios
  const hasConflictErrors = codes.some(code =>
    code.includes("CONFLICT")
  );
  assertEquals(hasConflictErrors, true, "Should have conflict errors");
});

Deno.test("Structure: Error object serialization structure", () => {
  const error = new CliError(CliErrorCode.INVALID_PARAMETERS, "Serialization test");
  
  // Should be JSON serializable with important properties
  const serialized = JSON.stringify(error);
  const parsed = JSON.parse(serialized);
  
  // Check if message property exists and has correct format
  if (parsed.message) {
    assertEquals(
      parsed.message,
      "[INVALID_PARAMETERS] Serialization test",
      "Should preserve formatted message"
    );
  } else {
    // If message doesn't serialize, check error properties are enumerable
    const errorHasMessage = error.hasOwnProperty('message');
    assertEquals(errorHasMessage, true, "Error should have message property");
  }
  
  // Should preserve name if it serializes
  if (parsed.name) {
    assertEquals(parsed.name, "CliError", "Should preserve error name");
  }
  
  // Should be able to recreate meaningful error info from error object
  const errorString = error.toString();
  assertEquals(
    errorString.includes("INVALID_PARAMETERS"),
    true,
    "Code should be recoverable from error string"
  );
});

Deno.test("Structure: CliError code property accessibility", () => {
  const error = new CliError(CliErrorCode.DUPLICATE_OPTION, "Test");
  
  // Code should be readable
  assertEquals(error.code, CliErrorCode.DUPLICATE_OPTION, "Code should be readable");
  
  // Code property should have correct descriptor
  const descriptor = Object.getOwnPropertyDescriptor(error, "code");
  assertExists(descriptor, "Code property should have descriptor");
  assertEquals(descriptor.enumerable, true, "Code should be enumerable");
  assertEquals(descriptor.configurable, true, "Code should be configurable");
  
  // Should be accessible via bracket notation
  assertEquals(error["code"], CliErrorCode.DUPLICATE_OPTION, "Should work with bracket notation");
  
  // Should be accessible via Object.keys
  const keys = Object.keys(error);
  assertEquals(keys.includes("code"), true, "Code should appear in Object.keys");
});

Deno.test("Structure: Error code type safety", () => {
  // All error codes should be valid enum values
  const errorCodes = Object.values(CliErrorCode);
  
  for (const code of errorCodes) {
    const error = new CliError(code, "Type safety test");
    
    // Code should match enum value exactly
    assertEquals(error.code, code, `Code should match enum value ${code}`);
    
    // Code should be valid for switch statements
    let switchResult = false;
    switch (error.code) {
      case CliErrorCode.INVALID_OPTION:
      case CliErrorCode.DUPLICATE_OPTION:
      case CliErrorCode.CONFLICTING_OPTIONS:
      case CliErrorCode.INVALID_INPUT_TYPE:
      case CliErrorCode.MISSING_REQUIRED:
      case CliErrorCode.INVALID_PARAMETERS:
        switchResult = true;
        break;
      default:
        switchResult = false;
    }
    assertEquals(switchResult, true, `Code ${code} should be valid in switch`);
  }
});

Deno.test("Structure: CliError toString behavior", () => {
  const error = new CliError(CliErrorCode.CONFLICTING_OPTIONS, "toString test");
  
  // toString should return the formatted message
  const stringified = error.toString();
  assertEquals(typeof stringified, "string", "toString should return string");
  assertEquals(
    stringified.includes("[CONFLICTING_OPTIONS]"),
    true,
    "toString should include error code"
  );
  assertEquals(
    stringified.includes("toString test"),
    true,
    "toString should include original message"
  );
  
  // Should be same as message for Error objects
  assertEquals(
    stringified,
    `CliError: [CONFLICTING_OPTIONS] toString test`,
    "toString should follow Error pattern"
  );
});

Deno.test("Structure: Error enumeration and iteration", () => {
  const error = new CliError(CliErrorCode.MISSING_REQUIRED, "Enumeration test");
  
  // Should be enumerable for debugging/logging
  const properties = Object.getOwnPropertyNames(error);
  assertEquals(properties.includes("code"), true, "Should include code property");
  assertEquals(properties.includes("message"), true, "Should include message property");
  assertEquals(properties.includes("name"), true, "Should include name property");
  
  // Should support for...in iteration
  const foundProperties: string[] = [];
  for (const prop in error) {
    foundProperties.push(prop);
  }
  assertEquals(foundProperties.includes("code"), true, "Code should be iterable");
  
  // Should support Object.entries
  const entries = Object.entries(error);
  const codeEntry = entries.find(([key]) => key === "code");
  assertExists(codeEntry, "Should find code in entries");
  assertEquals(codeEntry[1], CliErrorCode.MISSING_REQUIRED, "Should have correct code value");
});