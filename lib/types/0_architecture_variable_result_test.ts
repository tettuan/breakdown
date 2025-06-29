/**
 * Architecture tests for VariableResult
 * 
 * Tests that verify the architectural principles and design constraints
 * of the Result type system for variable operations.
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type VariableResult,
  type VariableError,
} from "./variable_result.ts";

Deno.test("VariableResult architecture - follows Totality principle", () => {
  // The VariableResult type should exhaustively cover all possible states
  // This is enforced by the discriminated union design
  
  const checkTotality = (result: VariableResult<string>) => {
    if (result.ok) {
      // Success case: must have data
      assertExists(result.data);
      return "success";
    } else {
      // Error case: must have error
      assertExists(result.error);
      assertExists(result.error.kind);
      return "error";
    }
  };
  
  // These should compile and run without TypeScript complaints
  const successCase: VariableResult<string> = { ok: true, data: "test" };
  const errorCase: VariableResult<string> = { 
    ok: false, 
    error: { kind: "InvalidName", name: "bad", validNames: [] } 
  };
  
  assertEquals(checkTotality(successCase), "success");
  assertEquals(checkTotality(errorCase), "error");
});

Deno.test("VariableResult architecture - no implicit error states", () => {
  // The design should not allow undefined or null states
  // All error conditions should be explicit
  
  const checkNoImplicitErrors = (result: VariableResult<number>) => {
    // Should never be able to have both ok=true and error present
    // Should never be able to have both ok=false and data present
    if (result.ok) {
      // Success case: should not have error property
      assertEquals("error" in result, false);
      return true;
    } else {
      // Error case: should not have data property
      assertEquals("data" in result, false);
      return true;
    }
  };
  
  const validSuccess: VariableResult<number> = { ok: true, data: 42 };
  const validError: VariableResult<number> = { 
    ok: false, 
    error: { kind: "ValidationFailed", value: "bad", constraint: "numeric" }
  };
  
  assertEquals(checkNoImplicitErrors(validSuccess), true);
  assertEquals(checkNoImplicitErrors(validError), true);
});

Deno.test("VariableResult architecture - error discriminated union completeness", () => {
  // All error types should be properly discriminated
  // This ensures exhaustive handling of error cases
  
  const handleError = (error: VariableError): string => {
    switch (error.kind) {
      case "InvalidName":
        return `Invalid name: ${error.name}`;
      case "EmptyValue":
        return `Empty value for ${error.variableName}`;
      case "ValidationFailed":
        return `Validation failed: ${error.value}`;
      // Note: No default case - TypeSpace will complain if we miss a case
    }
  };
  
  const invalidNameError: VariableError = {
    kind: "InvalidName",
    name: "test",
    validNames: ["valid"]
  };
  
  const emptyValueError: VariableError = {
    kind: "EmptyValue",
    variableName: "var",
    reason: "empty"
  };
  
  const validationError: VariableError = {
    kind: "ValidationFailed",
    value: "bad",
    constraint: "good"
  };
  
  assertEquals(handleError(invalidNameError), "Invalid name: test");
  assertEquals(handleError(emptyValueError), "Empty value for var");
  assertEquals(handleError(validationError), "Validation failed: bad");
});

Deno.test("VariableResult architecture - type safety at compile time", () => {
  // The type system should prevent common mistakes at compile time
  // This test verifies that the design supports proper type inference
  
  const processResult = <T>(result: VariableResult<T>): T | string => {
    if (result.ok) {
      // TypeScript should infer that result.data is of type T
      return result.data;
    } else {
      // TypeScript should infer that result.error is VariableError
      return `Error: ${result.error.kind}`;
    }
  };
  
  const stringResult: VariableResult<string> = { ok: true, data: "hello" };
  const numberResult: VariableResult<number> = { ok: true, data: 123 };
  const errorResult: VariableResult<boolean> = { 
    ok: false, 
    error: { kind: "InvalidName", name: "bad", validNames: [] }
  };
  
  assertEquals(processResult(stringResult), "hello");
  assertEquals(processResult(numberResult), 123);
  assertEquals(processResult(errorResult), "Error: InvalidName");
});