/**
 * Enhanced Stdin Resource Leak Test
 *
 * This test verifies that the new StdinReader interface properly
 * handles resource cleanup and prevents the op_read resource leaks.
 */

import { assertEquals, assertRejects } from "../deps.ts";
import { MockStdinReader } from "./stdin_reader_interface.ts";
import { readStdinEnhanced } from "./enhanced_stdin.ts";

Deno.test("Enhanced stdin with MockStdinReader - no resource leaks", async () => {
  const ___mockReader = new MockStdinReader({
    data: "test input",
    terminal: false,
    delay: 0,
  });

  const result = await readStdinEnhanced({
    stdinReader: ___mockReader,
    timeout: 1000,
    allowEmpty: false,
  });

  assertEquals(result, "test input");
  assertEquals(___mockReader.getReadCount(), 1);
});

Deno.test("Enhanced stdin timeout with MockStdinReader - proper cleanup", async () => {
  const __mockReader = new MockStdinReader({
    data: "slow input",
    terminal: false,
    delay: 2000, // Longer than timeout
  });

  await assertRejects(
    () =>
      readStdinEnhanced({
        stdinReader: __mockReader,
        timeout: 100,
      }),
    Error,
    "timed out",
  );

  // Reader should be properly cleaned up
  assertEquals(__mockReader.getInfo().isCancelled, true);
});

Deno.test("Enhanced stdin AbortSignal integration - explicit reader", async () => {
  const __mockReader = new MockStdinReader({
    data: "abortable input",
    terminal: false,
    delay: 500,
  });

  // Test the timeout mechanism which uses AbortSignal internally
  await assertRejects(
    () =>
      readStdinEnhanced({
        stdinReader: __mockReader,
        timeout: 100, // Shorter than delay (500ms)
      }),
    Error,
    "timed out",
  );
});

Deno.test("Enhanced stdin timer cleanup verification", async () => {
  const __mockReader = new MockStdinReader({
    data: "timer test",
    terminal: false,
    delay: 50,
  });

  // This should complete successfully and clean up timers
  const result = await readStdinEnhanced({
    stdinReader: __mockReader,
    timeout: 1000,
  });

  assertEquals(result, "timer test");
  // No assertions about timers since they're internal,
  // but this test ensures completion doesn't leave timers hanging
});

Deno.test("Enhanced stdin empty input handling", async () => {
  // Create separate readers for each test case
  const __mockReader1 = new MockStdinReader({
    data: "",
    terminal: false,
  });

  // Should reject with allowEmpty: false
  await assertRejects(
    () =>
      readStdinEnhanced({
        stdinReader: __mockReader1,
        allowEmpty: false,
      }),
    Error,
    "No input provided",
  );

  // Create fresh reader for the second test
  const __mockReader2 = new MockStdinReader({
    data: "",
    terminal: false,
  });

  // Should succeed with allowEmpty: true
  const result = await readStdinEnhanced({
    stdinReader: __mockReader2,
    allowEmpty: true,
  });

  assertEquals(result, "");
});

Deno.test("Enhanced stdin test environment handling", async () => {
  // In test environment, should fail by default
  await assertRejects(
    () =>
      readStdinEnhanced({
        // No custom reader provided, should use test environment default
        forceRead: false,
      }),
    Error,
    "test environment",
  );
});
