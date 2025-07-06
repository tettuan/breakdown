import { assertEquals, assertThrows } from "@std/assert";
import { TimeoutDuration } from "../../../lib/domain/core/value_objects/timeout_duration.ts";

Deno.test("TimeoutDuration - fromMilliseconds creates valid instance", () => {
  const duration = TimeoutDuration.fromMilliseconds(5000);
  assertEquals(duration.toMilliseconds(), 5000);
});

Deno.test("TimeoutDuration - validates minimum milliseconds", () => {
  assertThrows(
    () => TimeoutDuration.fromMilliseconds(50),
    Error,
    "TimeoutDuration must be at least 100ms: 50"
  );
});

Deno.test("TimeoutDuration - validates maximum milliseconds", () => {
  assertThrows(
    () => TimeoutDuration.fromMilliseconds(700_000),
    Error,
    "TimeoutDuration must not exceed 600000ms: 700000"
  );
});

Deno.test("TimeoutDuration - validates integer requirement", () => {
  assertThrows(
    () => TimeoutDuration.fromMilliseconds(1000.5),
    Error,
    "TimeoutDuration must be an integer: 1000.5"
  );
});

Deno.test("TimeoutDuration - fromSeconds creates valid instance", () => {
  const duration = TimeoutDuration.fromSeconds(30);
  assertEquals(duration.toMilliseconds(), 30_000);
  assertEquals(duration.toSeconds(), 30);
});

Deno.test("TimeoutDuration - fromSeconds validates input", () => {
  assertThrows(
    () => TimeoutDuration.fromSeconds(-5),
    Error,
    "Invalid seconds value: -5"
  );
  
  assertThrows(
    () => TimeoutDuration.fromSeconds(NaN),
    Error,
    "Invalid seconds value: NaN"
  );
});

Deno.test("TimeoutDuration - fromMinutes creates valid instance", () => {
  const duration = TimeoutDuration.fromMinutes(5);
  assertEquals(duration.toMilliseconds(), 300_000);
  assertEquals(duration.toMinutes(), 5);
});

Deno.test("TimeoutDuration - fromMinutes validates input", () => {
  assertThrows(
    () => TimeoutDuration.fromMinutes(-1),
    Error,
    "Invalid minutes value: -1"
  );
  
  assertThrows(
    () => TimeoutDuration.fromMinutes(Infinity),
    Error,
    "Invalid minutes value: Infinity"
  );
});

Deno.test("TimeoutDuration - default returns correct value", () => {
  const duration = TimeoutDuration.default();
  assertEquals(duration.toMilliseconds(), 30_000);
});

Deno.test("TimeoutDuration - infinite returns maximum value", () => {
  const duration = TimeoutDuration.infinite();
  assertEquals(duration.toMilliseconds(), 600_000);
});

Deno.test("TimeoutDuration - toHumanReadable formats correctly", () => {
  assertEquals(TimeoutDuration.fromMilliseconds(500).toHumanReadable(), "500ms");
  assertEquals(TimeoutDuration.fromSeconds(45).toHumanReadable(), "45s");
  assertEquals(TimeoutDuration.fromMinutes(2).toHumanReadable(), "2m");
  assertEquals(TimeoutDuration.fromMilliseconds(90_000).toHumanReadable(), "1m30s");
});

Deno.test("TimeoutDuration - equals compares correctly", () => {
  const duration1 = TimeoutDuration.fromSeconds(30);
  const duration2 = TimeoutDuration.fromMilliseconds(30_000);
  const duration3 = TimeoutDuration.fromSeconds(60);
  
  assertEquals(duration1.equals(duration2), true);
  assertEquals(duration1.equals(duration3), false);
});

Deno.test("TimeoutDuration - comparison methods work correctly", () => {
  const small = TimeoutDuration.fromSeconds(10);
  const medium = TimeoutDuration.fromSeconds(30);
  const large = TimeoutDuration.fromSeconds(60);
  
  assertEquals(small.isLessThan(medium), true);
  assertEquals(large.isGreaterThan(medium), true);
  assertEquals(medium.isGreaterThanOrEqualTo(medium), true);
  assertEquals(small.isLessThanOrEqualTo(large), true);
});

Deno.test("TimeoutDuration - add works correctly", () => {
  const duration1 = TimeoutDuration.fromSeconds(30);
  const duration2 = TimeoutDuration.fromSeconds(20);
  const result = duration1.add(duration2);
  
  assertEquals(result.toSeconds(), 50);
});

Deno.test("TimeoutDuration - add caps at maximum", () => {
  const duration1 = TimeoutDuration.fromMinutes(9);
  const duration2 = TimeoutDuration.fromMinutes(2);
  const result = duration1.add(duration2);
  
  assertEquals(result.toMilliseconds(), 600_000);
});

Deno.test("TimeoutDuration - subtract works correctly", () => {
  const duration1 = TimeoutDuration.fromSeconds(30);
  const duration2 = TimeoutDuration.fromSeconds(10);
  const result = duration1.subtract(duration2);
  
  assertEquals(result.toSeconds(), 20);
});

Deno.test("TimeoutDuration - subtract caps at minimum", () => {
  const duration1 = TimeoutDuration.fromSeconds(1);
  const duration2 = TimeoutDuration.fromSeconds(10);
  const result = duration1.subtract(duration2);
  
  assertEquals(result.toMilliseconds(), 100);
});

Deno.test("TimeoutDuration - scale works correctly", () => {
  const duration = TimeoutDuration.fromSeconds(10);
  
  assertEquals(duration.scale(2).toSeconds(), 20);
  assertEquals(duration.scale(0.5).toSeconds(), 5);
});

Deno.test("TimeoutDuration - scale validates factor", () => {
  const duration = TimeoutDuration.fromSeconds(10);
  
  assertThrows(
    () => duration.scale(-1),
    Error,
    "Invalid scale factor: -1"
  );
  
  assertThrows(
    () => duration.scale(NaN),
    Error,
    "Invalid scale factor: NaN"
  );
});

Deno.test("TimeoutDuration - scale caps at boundaries", () => {
  const duration = TimeoutDuration.fromSeconds(10);
  
  assertEquals(duration.scale(0.001).toMilliseconds(), 100);
  assertEquals(duration.scale(100).toMilliseconds(), 600_000);
});

Deno.test("TimeoutDuration - toJSON returns correct format", () => {
  const duration = TimeoutDuration.fromSeconds(90);
  const json = duration.toJSON();
  
  assertEquals(json.milliseconds, 90_000);
  assertEquals(json.humanReadable, "1m30s");
});

Deno.test("TimeoutDuration - toString returns correct format", () => {
  const duration = TimeoutDuration.fromSeconds(30);
  assertEquals(duration.toString(), "TimeoutDuration(30s)");
});