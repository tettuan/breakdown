import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Result, ValidationError, createError, getDefaultMessage } from "../types.ts";

Deno.test("Result type - success case", () => {
  const result: Result<string, Error> = { ok: true, data: "success" };
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "success");
  }
});

Deno.test("Result type - error case", () => {
  const result: Result<string, Error> = { ok: false, error: new Error("failed") };
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertInstanceOf(result.error, Error);
    assertEquals(result.error.message, "failed");
  }
});

Deno.test("ValidationError - ParseError", () => {
  const error: ValidationError = { kind: "ParseError", input: "invalid" };
  assertEquals(error.kind, "ParseError");
  assertEquals(error.input, "invalid");
});

Deno.test("ValidationError - EmptyInput", () => {
  const error: ValidationError = { kind: "EmptyInput" };
  assertEquals(error.kind, "EmptyInput");
});

Deno.test("ValidationError - InvalidFormat", () => {
  const error: ValidationError = { 
    kind: "InvalidFormat", 
    input: "wrong", 
    expected: "correct" 
  };
  assertEquals(error.kind, "InvalidFormat");
  assertEquals(error.input, "wrong");
  assertEquals(error.expected, "correct");
});

Deno.test("ValidationError - CommandFailed", () => {
  const error: ValidationError = { 
    kind: "CommandFailed", 
    command: "test", 
    stderr: "error output" 
  };
  assertEquals(error.kind, "CommandFailed");
  assertEquals(error.command, "test");
  assertEquals(error.stderr, "error output");
});

Deno.test("ValidationError - TimeoutError", () => {
  const error: ValidationError = { kind: "TimeoutError", operation: "test" };
  assertEquals(error.kind, "TimeoutError");
  assertEquals(error.operation, "test");
});

Deno.test("ValidationError - InvalidTimeFormat", () => {
  const error: ValidationError = { kind: "InvalidTimeFormat", input: "25:99" };
  assertEquals(error.kind, "InvalidTimeFormat");
  assertEquals(error.input, "25:99");
});

Deno.test("ValidationError - FileNotFound", () => {
  const error: ValidationError = { kind: "FileNotFound", path: "/missing/file" };
  assertEquals(error.kind, "FileNotFound");
  assertEquals(error.path, "/missing/file");
});

Deno.test("ValidationError - InvalidState", () => {
  const error: ValidationError = { 
    kind: "InvalidState", 
    current: "bad", 
    expected: "good" 
  };
  assertEquals(error.kind, "InvalidState");
  assertEquals(error.current, "bad");
  assertEquals(error.expected, "good");
});

Deno.test("ValidationError - CancellationRequested", () => {
  const error: ValidationError = { kind: "CancellationRequested", operation: "test" };
  assertEquals(error.kind, "CancellationRequested");
  assertEquals(error.operation, "test");
});

Deno.test("createError - with custom message", () => {
  const error = createError({ kind: "EmptyInput" }, "Custom message");
  assertEquals(error.kind, "EmptyInput");
  assertEquals(error.message, "Custom message");
});

Deno.test("createError - with default message", () => {
  const error = createError({ kind: "EmptyInput" });
  assertEquals(error.kind, "EmptyInput");
  assertEquals(error.message, "Input cannot be empty");
});

Deno.test("getDefaultMessage - ParseError", () => {
  const message = getDefaultMessage({ kind: "ParseError", input: "test" });
  assertEquals(message, 'Cannot parse "test"');
});

Deno.test("getDefaultMessage - EmptyInput", () => {
  const message = getDefaultMessage({ kind: "EmptyInput" });
  assertEquals(message, "Input cannot be empty");
});

Deno.test("getDefaultMessage - InvalidFormat", () => {
  const message = getDefaultMessage({ 
    kind: "InvalidFormat", 
    input: "wrong", 
    expected: "correct" 
  });
  assertEquals(message, 'Invalid format: "wrong", expected: correct');
});

Deno.test("getDefaultMessage - CommandFailed", () => {
  const message = getDefaultMessage({ 
    kind: "CommandFailed", 
    command: "test", 
    stderr: "error" 
  });
  assertEquals(message, "Command failed: test. Error: error");
});

Deno.test("getDefaultMessage - TimeoutError", () => {
  const message = getDefaultMessage({ kind: "TimeoutError", operation: "test" });
  assertEquals(message, "Operation timed out: test");
});

Deno.test("getDefaultMessage - InvalidTimeFormat", () => {
  const message = getDefaultMessage({ kind: "InvalidTimeFormat", input: "25:99" });
  assertEquals(message, 'Invalid time format: "25:99", expected: HH:MM');
});

Deno.test("getDefaultMessage - FileNotFound", () => {
  const message = getDefaultMessage({ kind: "FileNotFound", path: "/missing" });
  assertEquals(message, "File not found: /missing");
});

Deno.test("getDefaultMessage - InvalidState", () => {
  const message = getDefaultMessage({ 
    kind: "InvalidState", 
    current: "bad", 
    expected: "good" 
  });
  assertEquals(message, "Invalid state: bad, expected: good");
});

Deno.test("getDefaultMessage - CancellationRequested", () => {
  const message = getDefaultMessage({ kind: "CancellationRequested", operation: "test" });
  assertEquals(message, "Cancellation requested for operation: test");
});
