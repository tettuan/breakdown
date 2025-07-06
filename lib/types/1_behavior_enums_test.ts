/**
 * Behavior tests for enums module
 * Tests the functional behavior and usage patterns of enum definitions
 *
 * @fileoverview Validates that enums behave correctly in various usage scenarios
 * and maintain their intended semantics throughout the application lifecycle.
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import { ResultStatus, Result } from "./enums.ts";

Deno.test({
  name: "Behavior: ResultStatus enum values should be usable for equality checks",
  fn() {
    const status1 = ResultStatus.SUCCESS;
    const status2 = ResultStatus.SUCCESS;
    const status3 = ResultStatus.ERROR;
    
    assertEquals(status1, status2);
    assertNotEquals(status1, status3);
    assertEquals(status1 === status2, true);
    assertEquals(status1 === status3, false);
  },
});

Deno.test({
  name: "Behavior: ResultStatus should work with conditional logic",
  fn() {
    function isSuccess(status: ResultStatus): boolean {
      return status === ResultStatus.SUCCESS;
    }
    
    function isError(status: ResultStatus): boolean {
      return status === ResultStatus.ERROR;
    }
    
    assertEquals(isSuccess(ResultStatus.SUCCESS), true);
    assertEquals(isSuccess(ResultStatus.ERROR), false);
    assertEquals(isError(ResultStatus.ERROR), true);
    assertEquals(isError(ResultStatus.SUCCESS), false);
  },
});

Deno.test({
  name: "Behavior: Result type should work with success scenarios",
  fn() {
    const successResult: Result<string, Error> = {
      status: ResultStatus.SUCCESS,
      data: "test data"
    };
    
    assertEquals(successResult.status, ResultStatus.SUCCESS);
    if (successResult.status === ResultStatus.SUCCESS) {
      assertEquals(successResult.data, "test data");
    }
  },
});

Deno.test({
  name: "Behavior: Result type should work with error scenarios",
  fn() {
    const errorResult: Result<string, { message: string }> = {
      status: ResultStatus.ERROR,
      error: { message: "Something went wrong" }
    };
    
    assertEquals(errorResult.status, ResultStatus.ERROR);
    if (errorResult.status === ResultStatus.ERROR) {
      assertEquals(errorResult.error.message, "Something went wrong");
    }
  },
});

Deno.test({
  name: "Behavior: Result type should support type discrimination",
  fn() {
    function processResult(result: Result<number, string>): string {
      if (result.status === ResultStatus.SUCCESS) {
        return `Success: ${result.data}`;
      } else {
        return `Error: ${result.error}`;
      }
    }
    
    const successResult: Result<number, string> = {
      status: ResultStatus.SUCCESS,
      data: 42
    };
    
    const errorResult: Result<number, string> = {
      status: ResultStatus.ERROR,
      error: "Invalid input"
    };
    
    assertEquals(processResult(successResult), "Success: 42");
    assertEquals(processResult(errorResult), "Error: Invalid input");
  },
});

Deno.test({
  name: "Behavior: ResultStatus should work with arrays and filtering",
  fn() {
    const results = [
      ResultStatus.SUCCESS,
      ResultStatus.ERROR,
      ResultStatus.SUCCESS,
      ResultStatus.ERROR
    ];
    
    const successResults = results.filter(r => r === ResultStatus.SUCCESS);
    const errorResults = results.filter(r => r === ResultStatus.ERROR);
    
    assertEquals(successResults.length, 2);
    assertEquals(errorResults.length, 2);
    assertEquals(successResults.every(r => r === ResultStatus.SUCCESS), true);
    assertEquals(errorResults.every(r => r === ResultStatus.ERROR), true);
  },
});

Deno.test({
  name: "Behavior: Result type should support complex data types",
  fn() {
    interface UserData {
      id: number;
      name: string;
      email: string;
    }
    
    interface ValidationError {
      field: string;
      message: string;
    }
    
    const successResult: Result<UserData, ValidationError> = {
      status: ResultStatus.SUCCESS,
      data: {
        id: 1,
        name: "John Doe",
        email: "john@example.com"
      }
    };
    
    const errorResult: Result<UserData, ValidationError> = {
      status: ResultStatus.ERROR,
      error: {
        field: "email",
        message: "Invalid email format"
      }
    };
    
    assertEquals(successResult.status, ResultStatus.SUCCESS);
    assertEquals(errorResult.status, ResultStatus.ERROR);
    
    if (successResult.status === ResultStatus.SUCCESS) {
      assertEquals(successResult.data.name, "John Doe");
    }
    
    if (errorResult.status === ResultStatus.ERROR) {
      assertEquals(errorResult.error.field, "email");
    }
  },
});

Deno.test({
  name: "Behavior: ResultStatus should be serializable",
  fn() {
    const data = {
      status: ResultStatus.SUCCESS,
      timestamp: Date.now()
    };
    
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    
    assertEquals(parsed.status, "success");
    assertEquals(parsed.status, ResultStatus.SUCCESS);
  },
});

Deno.test({
  name: "Behavior: Result type should work with async operations",
  async fn() {
    async function asyncOperation(shouldSucceed: boolean): Promise<Result<string, Error>> {
      await new Promise(resolve => setTimeout(resolve, 1));
      
      if (shouldSucceed) {
        return {
          status: ResultStatus.SUCCESS,
          data: "Async operation completed"
        };
      } else {
        return {
          status: ResultStatus.ERROR,
          error: new Error("Async operation failed")
        };
      }
    }
    
    const successResult = await asyncOperation(true);
    const errorResult = await asyncOperation(false);
    
    assertEquals(successResult.status, ResultStatus.SUCCESS);
    assertEquals(errorResult.status, ResultStatus.ERROR);
    
    if (successResult.status === ResultStatus.SUCCESS) {
      assertEquals(successResult.data, "Async operation completed");
    }
    
    if (errorResult.status === ResultStatus.ERROR) {
      assertEquals(errorResult.error.message, "Async operation failed");
    }
  },
});