import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TIMING, WORKER_STATUS_TYPES } from "../config.ts";

Deno.test("TIMING configuration - instruction delay", () => {
  assertEquals(TIMING.INSTRUCTION_DELAY, 200);
});

Deno.test("TIMING configuration - enter key delay", () => {
  assertEquals(TIMING.ENTER_KEY_DELAY, 300);
});

Deno.test("TIMING configuration - pane processing delay", () => {
  assertEquals(TIMING.PANE_PROCESSING_DELAY, 1000);
});

Deno.test("TIMING configuration - monitoring cycle delay", () => {
  assertEquals(TIMING.MONITORING_CYCLE_DELAY, 300000);
});

Deno.test("TIMING configuration - CLD command delay", () => {
  assertEquals(TIMING.CLD_COMMAND_DELAY, 200);
});

Deno.test("TIMING configuration - enter send cycle delay", () => {
  assertEquals(TIMING.ENTER_SEND_CYCLE_DELAY, 30000);
});

Deno.test("TIMING configuration - max runtime", () => {
  assertEquals(TIMING.MAX_RUNTIME, 14400000);
});

Deno.test("TIMING configuration - immutable", () => {
  // TypeScript should enforce readonly properties
  // This test ensures the configuration is properly defined
  const timingKeys = Object.keys(TIMING);
  assertEquals(timingKeys.length, 7);
  assertEquals(timingKeys.includes("INSTRUCTION_DELAY"), true);
  assertEquals(timingKeys.includes("ENTER_KEY_DELAY"), true);
  assertEquals(timingKeys.includes("PANE_PROCESSING_DELAY"), true);
  assertEquals(timingKeys.includes("MONITORING_CYCLE_DELAY"), true);
  assertEquals(timingKeys.includes("CLD_COMMAND_DELAY"), true);
  assertEquals(timingKeys.includes("ENTER_SEND_CYCLE_DELAY"), true);
  assertEquals(timingKeys.includes("MAX_RUNTIME"), true);
});

Deno.test("WORKER_STATUS_TYPES configuration", () => {
  assertEquals(WORKER_STATUS_TYPES[0], "IDLE");
  assertEquals(WORKER_STATUS_TYPES[1], "WORKING");
  assertEquals(WORKER_STATUS_TYPES[2], "BLOCKED");
  assertEquals(WORKER_STATUS_TYPES[3], "DONE");
  assertEquals(WORKER_STATUS_TYPES[4], "TERMINATED");
  assertEquals(WORKER_STATUS_TYPES[5], "UNKNOWN");
});

Deno.test("WORKER_STATUS_TYPES - all status types defined", () => {
  assertEquals(WORKER_STATUS_TYPES.length, 6);
  assertEquals(WORKER_STATUS_TYPES.includes("IDLE"), true);
  assertEquals(WORKER_STATUS_TYPES.includes("WORKING"), true);
  assertEquals(WORKER_STATUS_TYPES.includes("BLOCKED"), true);
  assertEquals(WORKER_STATUS_TYPES.includes("DONE"), true);
  assertEquals(WORKER_STATUS_TYPES.includes("TERMINATED"), true);
  assertEquals(WORKER_STATUS_TYPES.includes("UNKNOWN"), true);
});

Deno.test("Timing calculations - monitoring cycles", () => {
  const cycleCount = TIMING.MONITORING_CYCLE_DELAY / TIMING.ENTER_SEND_CYCLE_DELAY;
  assertEquals(cycleCount, 10); // 300000 / 30000 = 10 cycles
});

Deno.test("Timing calculations - max runtime in hours", () => {
  const hours = TIMING.MAX_RUNTIME / (1000 * 60 * 60);
  assertEquals(hours, 4); // 14400000 ms = 4 hours
});

Deno.test("Timing calculations - monitoring cycle in minutes", () => {
  const minutes = TIMING.MONITORING_CYCLE_DELAY / (1000 * 60);
  assertEquals(minutes, 5); // 300000 ms = 5 minutes
});

Deno.test("Timing calculations - enter send cycle in seconds", () => {
  const seconds = TIMING.ENTER_SEND_CYCLE_DELAY / 1000;
  assertEquals(seconds, 30); // 30000 ms = 30 seconds
});
