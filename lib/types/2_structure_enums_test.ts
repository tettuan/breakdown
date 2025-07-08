/**
 * @fileoverview Structure tests for Enums module
 * Testing data structure integrity and type relationships
 * 
 * Structure tests verify:
 * - Enum value completeness and consistency
 * - Type relationships and discriminated unions
 * - Structural completeness of Result type
 * - Type compatibility and exhaustiveness
 */

import { assertEquals, assertExists } from "@std/assert";
import { ResultStatus, type Result } from "./enums.ts";

Deno.test("2_structure: ResultStatus enum has correct string literal values", () => {
  // Test that ResultStatus enum values are exactly what's expected
  assertEquals(ResultStatus.SUCCESS, "success");
  assertEquals(ResultStatus.ERROR, "error");
  
  // Test that enum has exactly 2 values
  const enumValues = Object.values(ResultStatus);
  assertEquals(enumValues.length, 2);
  assertEquals(enumValues.includes(ResultStatus.SUCCESS), true);
  assertEquals(enumValues.includes(ResultStatus.ERROR), true);
  
  // Test that enum keys match expected names
  const enumKeys = Object.keys(ResultStatus);
  assertEquals(enumKeys.length, 2);
  assertEquals(enumKeys.includes("SUCCESS"), true);
  assertEquals(enumKeys.includes("ERROR"), true);
});

Deno.test("2_structure: ResultStatus enum values are string literals", () => {
  // Test that all enum values are strings
  for (const value of Object.values(ResultStatus)) {
    assertEquals(typeof value, "string");
  }
  
  // Test that values can be used as discriminators
  const successStatus: typeof ResultStatus.SUCCESS = ResultStatus.SUCCESS;
  const errorStatus: typeof ResultStatus.ERROR = ResultStatus.ERROR;
  
  assertEquals(successStatus === "success", true);
  assertEquals(errorStatus === "error", true);
  // Different enum values are inherently different
  assertEquals(successStatus, ResultStatus.SUCCESS);
  assertEquals(errorStatus, ResultStatus.ERROR);
});

Deno.test("2_structure: Result discriminated union has correct structure for success case", () => {
  // Test success case with different data types
  const stringResult: Result<string, string> = {
    status: ResultStatus.SUCCESS,
    data: "test data",
  };
  
  const numberResult: Result<number, string> = {
    status: ResultStatus.SUCCESS,
    data: 42,
  };
  
  const objectResult: Result<{ id: number; name: string }, string> = {
    status: ResultStatus.SUCCESS,
    data: { id: 1, name: "test" },
  };
  
  const arrayResult: Result<string[], string> = {
    status: ResultStatus.SUCCESS,
    data: ["item1", "item2"],
  };
  
  // All success results should have correct structure
  const successResults = [stringResult, numberResult, objectResult, arrayResult];
  
  for (const result of successResults) {
    assertEquals(result.status, ResultStatus.SUCCESS);
    assertExists(result.data);
    assertEquals("error" in result, false);
    
    // Type guard should work correctly
    if (result.status === ResultStatus.SUCCESS) {
      assertExists(result.data);
    }
  }
});

Deno.test("2_structure: Result discriminated union has correct structure for error case", () => {
  // Test error case with different error types
  const stringErrorResult: Result<string, string> = {
    status: ResultStatus.ERROR,
    error: "error message",
  };
  
  const objectErrorResult: Result<string, { code: number; message: string }> = {
    status: ResultStatus.ERROR,
    error: { code: 404, message: "Not found" },
  };
  
  const unionErrorResult: Result<string, string | number> = {
    status: ResultStatus.ERROR,
    error: 500,
  };
  
  // All error results should have correct structure
  const errorResults = [stringErrorResult, objectErrorResult, unionErrorResult];
  
  for (const result of errorResults) {
    assertEquals(result.status, ResultStatus.ERROR);
    assertExists(result.error);
    assertEquals("data" in result, false);
    
    // Type guard should work correctly
    if (result.status === ResultStatus.ERROR) {
      assertExists(result.error);
    }
  }
});

Deno.test("2_structure: Result type supports proper type narrowing", () => {
  // Test that discriminated union allows proper type narrowing
  function processResult<T, E>(result: Result<T, E>): string {
    if (result.status === ResultStatus.SUCCESS) {
      // In this branch, TypeScript knows result has 'data' property
      return `Success: ${String(result.data)}`;
    } else {
      // In this branch, TypeScript knows result has 'error' property
      return `Error: ${String(result.error)}`;
    }
  }
  
  const successResult: Result<number, string> = {
    status: ResultStatus.SUCCESS,
    data: 42,
  };
  
  const errorResult: Result<number, string> = {
    status: ResultStatus.ERROR,
    error: "Something went wrong",
  };
  
  assertEquals(processResult(successResult), "Success: 42");
  assertEquals(processResult(errorResult), "Error: Something went wrong");
});

Deno.test("2_structure: Result type supports exhaustive pattern matching", () => {
  // Test that all Result cases can be handled exhaustively
  function handleResult<T, E>(result: Result<T, E>): "handled" {
    switch (result.status) {
      case ResultStatus.SUCCESS:
        // Handle success case
        return "handled";
      case ResultStatus.ERROR:
        // Handle error case
        return "handled";
      default:
        // This ensures exhaustive checking at compile time
        const _exhaustiveCheck: never = result;
        return _exhaustiveCheck;
    }
  }
  
  const testCases: Array<Result<string, string>> = [
    { status: ResultStatus.SUCCESS, data: "test" },
    { status: ResultStatus.ERROR, error: "test error" },
  ];
  
  for (const testCase of testCases) {
    assertEquals(handleResult(testCase), "handled");
  }
});

Deno.test("2_structure: Result type maintains type safety with different generic parameters", () => {
  // Test that Result works correctly with various generic type combinations
  type StringResult = Result<string, Error>;
  type NumberResult = Result<number, string>;
  type ObjectResult = Result<{ value: boolean }, { code: number }>;
  type ArrayResult = Result<string[], number[]>;
  type VoidResult = Result<void, null>;
  
  // Test with complex success data
  const complexSuccessResult: ObjectResult = {
    status: ResultStatus.SUCCESS,
    data: { value: true },
  };
  
  assertEquals(complexSuccessResult.status, ResultStatus.SUCCESS);
  if (complexSuccessResult.status === ResultStatus.SUCCESS) {
    assertEquals(complexSuccessResult.data.value, true);
    assertEquals(typeof complexSuccessResult.data.value, "boolean");
  }
  
  // Test with complex error data
  const complexErrorResult: ObjectResult = {
    status: ResultStatus.ERROR,
    error: { code: 400 },
  };
  
  assertEquals(complexErrorResult.status, ResultStatus.ERROR);
  if (complexErrorResult.status === ResultStatus.ERROR) {
    assertEquals(complexErrorResult.error.code, 400);
    assertEquals(typeof complexErrorResult.error.code, "number");
  }
  
  // Test with void success
  const voidResult: VoidResult = {
    status: ResultStatus.SUCCESS,
    data: undefined,
  };
  
  assertEquals(voidResult.status, ResultStatus.SUCCESS);
  assertEquals(voidResult.data, undefined);
});

Deno.test("2_structure: Result type ensures mutual exclusivity of success and error properties", () => {
  // Test that Result enforces mutual exclusivity at the type level
  const successResult: Result<string, string> = {
    status: ResultStatus.SUCCESS,
    data: "success",
  };
  
  const errorResult: Result<string, string> = {
    status: ResultStatus.ERROR,
    error: "error",
  };
  
  // Success result should not have error property
  assertEquals("error" in successResult, false);
  assertEquals(successResult.status, ResultStatus.SUCCESS);
  
  // Error result should not have data property
  assertEquals("data" in errorResult, false);
  assertEquals(errorResult.status, ResultStatus.ERROR);
  
  // Test property existence based on status
  if (successResult.status === ResultStatus.SUCCESS) {
    assertEquals("data" in successResult, true);
    assertEquals("error" in successResult, false);
  }
  
  if (errorResult.status === ResultStatus.ERROR) {
    assertEquals("error" in errorResult, true);
    assertEquals("data" in errorResult, false);
  }
});

Deno.test("2_structure: Result type supports nested Result structures", () => {
  // Test that Result can contain other Result types
  type NestedResult = Result<Result<string, number>, string>;
  
  const successWithSuccess: NestedResult = {
    status: ResultStatus.SUCCESS,
    data: {
      status: ResultStatus.SUCCESS,
      data: "inner success",
    },
  };
  
  const successWithError: NestedResult = {
    status: ResultStatus.SUCCESS,
    data: {
      status: ResultStatus.ERROR,
      error: 404,
    },
  };
  
  const errorResult: NestedResult = {
    status: ResultStatus.ERROR,
    error: "outer error",
  };
  
  // Test outer success with inner success
  assertEquals(successWithSuccess.status, ResultStatus.SUCCESS);
  if (successWithSuccess.status === ResultStatus.SUCCESS) {
    assertEquals(successWithSuccess.data.status, ResultStatus.SUCCESS);
    if (successWithSuccess.data.status === ResultStatus.SUCCESS) {
      assertEquals(successWithSuccess.data.data, "inner success");
    }
  }
  
  // Test outer success with inner error
  assertEquals(successWithError.status, ResultStatus.SUCCESS);
  if (successWithError.status === ResultStatus.SUCCESS) {
    assertEquals(successWithError.data.status, ResultStatus.ERROR);
    if (successWithError.data.status === ResultStatus.ERROR) {
      assertEquals(successWithError.data.error, 404);
    }
  }
  
  // Test outer error
  assertEquals(errorResult.status, ResultStatus.ERROR);
  if (errorResult.status === ResultStatus.ERROR) {
    assertEquals(errorResult.error, "outer error");
  }
});