import { assertEquals, assertThrows } from "@std/assert";
import { TimeoutDuration } from "../../../lib/domain/core/value_objects/timeout_duration.ts";

Deno.test("TimeoutDuration - fromMilliseconds creates valid instance", () => {
  const result = TimeoutDuration.fromMilliseconds(5000);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.toMilliseconds(), 5000);
  }
});

Deno.test("TimeoutDuration - validates minimum milliseconds", () => {
  const result = TimeoutDuration.fromMilliseconds(50);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "BelowMinimum") {
    assertEquals(result.error.kind, "BelowMinimum");
    assertEquals(result.error.providedValue, 50);
    assertEquals(result.error.minimumValue, 100);
  }
});

Deno.test("TimeoutDuration - validates maximum milliseconds", () => {
  const result = TimeoutDuration.fromMilliseconds(700_000);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "AboveMaximum") {
    assertEquals(result.error.kind, "AboveMaximum");
    assertEquals(result.error.providedValue, 700_000);
    assertEquals(result.error.maximumValue, 600_000);
  }
});

Deno.test("TimeoutDuration - validates integer requirement", () => {
  const result = TimeoutDuration.fromMilliseconds(1000.5);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "NonIntegerValue") {
    assertEquals(result.error.kind, "NonIntegerValue");
    assertEquals(result.error.providedValue, 1000.5);
  }
});

Deno.test("TimeoutDuration - fromSeconds creates valid instance", () => {
  const result = TimeoutDuration.fromSeconds(30);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.toMilliseconds(), 30_000);
    assertEquals(result.data.toSeconds(), 30);
  }
});

Deno.test("TimeoutDuration - fromSeconds validates input", () => {
  const result1 = TimeoutDuration.fromSeconds(-5);
  assertEquals(result1.ok, false);
  if (!result1.ok && result1.error.kind === "InvalidSeconds") {
    assertEquals(result1.error.kind, "InvalidSeconds");
    assertEquals(result1.error.providedValue, -5);
  }
  
  const result2 = TimeoutDuration.fromSeconds(NaN);
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidSeconds");
  }
});

Deno.test("TimeoutDuration - fromMinutes creates valid instance", () => {
  const result = TimeoutDuration.fromMinutes(5);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.toMilliseconds(), 300_000);
    assertEquals(result.data.toMinutes(), 5);
  }
});

Deno.test("TimeoutDuration - fromMinutes validates input", () => {
  const result1 = TimeoutDuration.fromMinutes(-1);
  assertEquals(result1.ok, false);
  if (!result1.ok && result1.error.kind === "InvalidMinutes") {
    assertEquals(result1.error.kind, "InvalidMinutes");
    assertEquals(result1.error.providedValue, -1);
  }
  
  const result2 = TimeoutDuration.fromMinutes(Infinity);
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidMinutes");
  }
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
  const result1 = TimeoutDuration.fromMilliseconds(500);
  if (result1.ok) assertEquals(result1.data.toHumanReadable(), "500ms");
  
  const result2 = TimeoutDuration.fromSeconds(45);
  if (result2.ok) assertEquals(result2.data.toHumanReadable(), "45s");
  
  const result3 = TimeoutDuration.fromMinutes(2);
  if (result3.ok) assertEquals(result3.data.toHumanReadable(), "2m");
  
  const result4 = TimeoutDuration.fromMilliseconds(90_000);
  if (result4.ok) assertEquals(result4.data.toHumanReadable(), "1m30s");
});

Deno.test("TimeoutDuration - equals compares correctly", () => {
  const result1 = TimeoutDuration.fromSeconds(30);
  const result2 = TimeoutDuration.fromMilliseconds(30_000);
  const result3 = TimeoutDuration.fromSeconds(60);
  
  if (result1.ok && result2.ok && result3.ok) {
    assertEquals(result1.data.equals(result2.data), true);
    assertEquals(result1.data.equals(result3.data), false);
  }
});

Deno.test("TimeoutDuration - comparison methods work correctly", () => {
  const smallResult = TimeoutDuration.fromSeconds(10);
  const mediumResult = TimeoutDuration.fromSeconds(30);
  const largeResult = TimeoutDuration.fromSeconds(60);
  
  if (smallResult.ok && mediumResult.ok && largeResult.ok) {
    assertEquals(smallResult.data.isLessThan(mediumResult.data), true);
    assertEquals(largeResult.data.isGreaterThan(mediumResult.data), true);
    assertEquals(mediumResult.data.isGreaterThanOrEqualTo(mediumResult.data), true);
    assertEquals(smallResult.data.isLessThanOrEqualTo(largeResult.data), true);
  }
});

Deno.test("TimeoutDuration - add works correctly", () => {
  const result1 = TimeoutDuration.fromSeconds(30);
  const result2 = TimeoutDuration.fromSeconds(20);
  
  if (result1.ok && result2.ok) {
    const sumResult = result1.data.add(result2.data);
    if (sumResult.ok) {
      assertEquals(sumResult.data.toSeconds(), 50);
    }
  }
});

Deno.test("TimeoutDuration - add caps at maximum", () => {
  const result1 = TimeoutDuration.fromMinutes(9);
  const result2 = TimeoutDuration.fromMinutes(2);
  
  if (result1.ok && result2.ok) {
    const sumResult = result1.data.add(result2.data);
    if (sumResult.ok) {
      assertEquals(sumResult.data.toMilliseconds(), 600_000);
    }
  }
});

Deno.test("TimeoutDuration - subtract works correctly", () => {
  const result1 = TimeoutDuration.fromSeconds(30);
  const result2 = TimeoutDuration.fromSeconds(10);
  
  if (result1.ok && result2.ok) {
    const diffResult = result1.data.subtract(result2.data);
    if (diffResult.ok) {
      assertEquals(diffResult.data.toSeconds(), 20);
    }
  }
});

Deno.test("TimeoutDuration - subtract caps at minimum", () => {
  const result1 = TimeoutDuration.fromSeconds(1);
  const result2 = TimeoutDuration.fromSeconds(10);
  
  if (result1.ok && result2.ok) {
    const diffResult = result1.data.subtract(result2.data);
    if (diffResult.ok) {
      assertEquals(diffResult.data.toMilliseconds(), 100);
    }
  }
});

Deno.test("TimeoutDuration - scale works correctly", () => {
  const result = TimeoutDuration.fromSeconds(10);
  
  if (result.ok) {
    const scaled1 = result.data.scale(2);
    if (scaled1.ok) assertEquals(scaled1.data.toSeconds(), 20);
    
    const scaled2 = result.data.scale(0.5);
    if (scaled2.ok) assertEquals(scaled2.data.toSeconds(), 5);
  }
});

Deno.test("TimeoutDuration - scale validates factor", () => {
  const result = TimeoutDuration.fromSeconds(10);
  
  if (result.ok) {
    const scaleResult1 = result.data.scale(-1);
    assertEquals(scaleResult1.ok, false);
    if (!scaleResult1.ok && scaleResult1.error.kind === "InvalidScaleFactor") {
      assertEquals(scaleResult1.error.providedFactor, -1);
    }
    
    const scaleResult2 = result.data.scale(NaN);
    assertEquals(scaleResult2.ok, false);
    if (!scaleResult2.ok && scaleResult2.error.kind === "InvalidScaleFactor") {
      assertEquals(scaleResult2.error.providedFactor, NaN);
    }
  }
});

Deno.test("TimeoutDuration - scale caps at boundaries", () => {
  const result = TimeoutDuration.fromSeconds(10);
  
  if (result.ok) {
    const scaled1 = result.data.scale(0.001);
    if (scaled1.ok) assertEquals(scaled1.data.toMilliseconds(), 100);
    
    const scaled2 = result.data.scale(100);
    if (scaled2.ok) assertEquals(scaled2.data.toMilliseconds(), 600_000);
  }
});

Deno.test("TimeoutDuration - toJSON returns correct format", () => {
  const result = TimeoutDuration.fromSeconds(90);
  
  if (result.ok) {
    const json = result.data.toJSON();
    assertEquals(json.milliseconds, 90_000);
    assertEquals(json.humanReadable, "1m30s");
  }
});

Deno.test("TimeoutDuration - toString returns correct format", () => {
  const result = TimeoutDuration.fromSeconds(30);
  
  if (result.ok) {
    assertEquals(result.data.toString(), "TimeoutDuration(30s)");
  }
});