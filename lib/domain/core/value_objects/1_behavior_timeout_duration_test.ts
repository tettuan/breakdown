import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { TimeoutDuration } from "./timeout_duration.ts";

describe("1_behavior_timeout_duration_test", () => {
  it("should handle valid inputs correctly", () => {
    // Test normal operation paths
    const fromMs = TimeoutDuration.fromMilliseconds(1000);
    assertEquals(fromMs.toMilliseconds(), 1000);
    assertEquals(fromMs.toSeconds(), 1);
    assertEquals(fromMs.toMinutes(), 0);
    assertEquals(fromMs.toHumanReadable(), "1s");
    
    const fromSec = TimeoutDuration.fromSeconds(30);
    assertEquals(fromSec.toMilliseconds(), 30000);
    assertEquals(fromSec.toSeconds(), 30);
    assertEquals(fromSec.toMinutes(), 0);
    assertEquals(fromSec.toHumanReadable(), "30s");
    
    const fromMin = TimeoutDuration.fromMinutes(2);
    assertEquals(fromMin.toMilliseconds(), 120000);
    assertEquals(fromMin.toSeconds(), 120);
    assertEquals(fromMin.toMinutes(), 2);
    assertEquals(fromMin.toHumanReadable(), "2m");
    
    // Test default and infinite instances
    const defaultInstance = TimeoutDuration.default();
    assertEquals(defaultInstance.toMilliseconds(), 30000);
    assertEquals(defaultInstance.toHumanReadable(), "30s");
    
    const infiniteInstance = TimeoutDuration.infinite();
    assertEquals(infiniteInstance.toMilliseconds(), 600000);
    assertEquals(infiniteInstance.toHumanReadable(), "10m");
    
    // Test all public methods
    const instance = TimeoutDuration.fromMilliseconds(5000);
    assertEquals(instance.toSeconds(), 5);
    assertEquals(instance.toMinutes(), 0);
    assertEquals(instance.toHumanReadable(), "5s");
    assertEquals(instance.toString(), "TimeoutDuration(5s)");
    
    const json = instance.toJSON();
    assertEquals(json.milliseconds, 5000);
    assertEquals(json.humanReadable, "5s");
  });

  it("should handle invalid inputs with proper errors", () => {
    // Test error conditions for fromMilliseconds
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(1.5),
      Error,
      "TimeoutDuration must be an integer"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(50),
      Error,
      "TimeoutDuration must be at least 100ms"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(700000),
      Error,
      "TimeoutDuration must not exceed 600000ms"
    );
    
    // Test error conditions for fromSeconds
    assertThrows(
      () => TimeoutDuration.fromSeconds(-1),
      Error,
      "Invalid seconds value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromSeconds(Infinity),
      Error,
      "Invalid seconds value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromSeconds(NaN),
      Error,
      "Invalid seconds value"
    );
    
    // Test error conditions for fromMinutes
    assertThrows(
      () => TimeoutDuration.fromMinutes(-1),
      Error,
      "Invalid minutes value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMinutes(Infinity),
      Error,
      "Invalid minutes value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMinutes(NaN),
      Error,
      "Invalid minutes value"
    );
    
    // Test error conditions for scale
    const instance = TimeoutDuration.fromMilliseconds(1000);
    assertThrows(
      () => instance.scale(-1),
      Error,
      "Invalid scale factor"
    );
    
    assertThrows(
      () => instance.scale(Infinity),
      Error,
      "Invalid scale factor"
    );
    
    assertThrows(
      () => instance.scale(NaN),
      Error,
      "Invalid scale factor"
    );
  });

  it("should maintain immutability", () => {
    // Test that objects don't mutate
    const original = TimeoutDuration.fromMilliseconds(1000);
    const originalMs = original.toMilliseconds();
    
    // Operations should return new instances
    const added = original.add(TimeoutDuration.fromMilliseconds(500));
    const subtracted = original.subtract(TimeoutDuration.fromMilliseconds(500));
    const scaled = original.scale(2);
    
    // Original should be unchanged
    assertEquals(original.toMilliseconds(), originalMs);
    assertEquals(original.toMilliseconds(), 1000);
    
    // New instances should have different values
    assertEquals(added.toMilliseconds(), 1500);
    assertEquals(subtracted.toMilliseconds(), 500);
    assertEquals(scaled.toMilliseconds(), 2000);
    
    // Verify side-effect free operations
    const instance = TimeoutDuration.fromMilliseconds(5000);
    const ms1 = instance.toMilliseconds();
    const sec1 = instance.toSeconds();
    const min1 = instance.toMinutes();
    const human1 = instance.toHumanReadable();
    
    // Multiple calls should return same values
    assertEquals(instance.toMilliseconds(), ms1);
    assertEquals(instance.toSeconds(), sec1);
    assertEquals(instance.toMinutes(), min1);
    assertEquals(instance.toHumanReadable(), human1);
  });

  it("should follow totality principles", () => {
    // Test that all inputs produce valid outputs
    const validInputs = [100, 1000, 5000, 30000, 600000];
    
    for (const input of validInputs) {
      const instance = TimeoutDuration.fromMilliseconds(input);
      
      // No undefined/null returns
      assertEquals(typeof instance.toMilliseconds(), "number");
      assertEquals(typeof instance.toSeconds(), "number");
      assertEquals(typeof instance.toMinutes(), "number");
      assertEquals(typeof instance.toHumanReadable(), "string");
      assertEquals(typeof instance.toString(), "string");
      
      const json = instance.toJSON();
      assertEquals(typeof json.milliseconds, "number");
      assertEquals(typeof json.humanReadable, "string");
      
      // Comparison operations always return boolean
      const other = TimeoutDuration.fromMilliseconds(2000);
      assertEquals(typeof instance.equals(other), "boolean");
      assertEquals(typeof instance.isGreaterThan(other), "boolean");
      assertEquals(typeof instance.isLessThan(other), "boolean");
      assertEquals(typeof instance.isGreaterThanOrEqualTo(other), "boolean");
      assertEquals(typeof instance.isLessThanOrEqualTo(other), "boolean");
    }
    
    // Complete error handling coverage - invalid inputs throw errors
    const invalidInputs = [
      { fn: () => TimeoutDuration.fromMilliseconds(1.5), desc: "non-integer" },
      { fn: () => TimeoutDuration.fromMilliseconds(50), desc: "below minimum" },
      { fn: () => TimeoutDuration.fromMilliseconds(700000), desc: "above maximum" },
      { fn: () => TimeoutDuration.fromSeconds(-1), desc: "negative seconds" },
      { fn: () => TimeoutDuration.fromMinutes(-1), desc: "negative minutes" },
    ];
    
    for (const invalid of invalidInputs) {
      assertThrows(invalid.fn, Error);
    }
    
    // Boundary conditions are handled correctly
    const minInstance = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    const maxInstance = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS);
    
    assertEquals(minInstance.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
    assertEquals(maxInstance.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
    
    // Arithmetic operations handle overflow/underflow
    const largeSum = maxInstance.add(TimeoutDuration.fromMilliseconds(1000));
    assertEquals(largeSum.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
    
    const smallDiff = minInstance.subtract(TimeoutDuration.fromMilliseconds(1000));
    assertEquals(smallDiff.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
  });

  it("should handle arithmetic operations correctly", () => {
    // Test addition
    const base = TimeoutDuration.fromMilliseconds(1000);
    const addition = TimeoutDuration.fromMilliseconds(500);
    const sum = base.add(addition);
    
    assertEquals(sum.toMilliseconds(), 1500);
    assertEquals(base.toMilliseconds(), 1000); // Original unchanged
    
    // Test subtraction
    const difference = base.subtract(addition);
    assertEquals(difference.toMilliseconds(), 500);
    
    // Test scaling
    const scaled = base.scale(2.5);
    assertEquals(scaled.toMilliseconds(), 2500);
    
    const scaledDown = base.scale(0.5);
    assertEquals(scaledDown.toMilliseconds(), 500);
    
    // Test edge cases with overflow/underflow protection
    const nearMax = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS - 500);
    const overflow = nearMax.add(TimeoutDuration.fromMilliseconds(1000));
    assertEquals(overflow.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
    
    const nearMin = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS + 50);
    const underflow = nearMin.subtract(TimeoutDuration.fromMilliseconds(100));
    assertEquals(underflow.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
  });

  it("should handle comparison operations correctly", () => {
    const timeout1 = TimeoutDuration.fromMilliseconds(1000);
    const timeout2 = TimeoutDuration.fromMilliseconds(2000);
    const timeout3 = TimeoutDuration.fromMilliseconds(1000);
    
    // Test equality
    assertEquals(timeout1.equals(timeout2), false);
    assertEquals(timeout1.equals(timeout3), true);
    
    // Test greater than
    assertEquals(timeout1.isGreaterThan(timeout2), false);
    assertEquals(timeout2.isGreaterThan(timeout1), true);
    assertEquals(timeout1.isGreaterThan(timeout3), false);
    
    // Test less than
    assertEquals(timeout1.isLessThan(timeout2), true);
    assertEquals(timeout2.isLessThan(timeout1), false);
    assertEquals(timeout1.isLessThan(timeout3), false);
    
    // Test greater than or equal to
    assertEquals(timeout1.isGreaterThanOrEqualTo(timeout2), false);
    assertEquals(timeout2.isGreaterThanOrEqualTo(timeout1), true);
    assertEquals(timeout1.isGreaterThanOrEqualTo(timeout3), true);
    
    // Test less than or equal to
    assertEquals(timeout1.isLessThanOrEqualTo(timeout2), true);
    assertEquals(timeout2.isLessThanOrEqualTo(timeout1), false);
    assertEquals(timeout1.isLessThanOrEqualTo(timeout3), true);
  });

  it("should handle human-readable format correctly", () => {
    // Test milliseconds format
    const ms = TimeoutDuration.fromMilliseconds(500);
    assertEquals(ms.toHumanReadable(), "500ms");
    
    // Test seconds format
    const sec = TimeoutDuration.fromSeconds(30);
    assertEquals(sec.toHumanReadable(), "30s");
    
    // Test minutes format
    const min = TimeoutDuration.fromMinutes(2);
    assertEquals(min.toHumanReadable(), "2m");
    
    // Test mixed minutes and seconds
    const mixed = TimeoutDuration.fromMilliseconds(90000); // 1.5 minutes = 1m30s
    assertEquals(mixed.toHumanReadable(), "1m30s");
    
    // Test exact minutes (no seconds)
    const exactMin = TimeoutDuration.fromMinutes(5);
    assertEquals(exactMin.toHumanReadable(), "5m");
    
    // Test boundary cases
    const minBoundary = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    assertEquals(minBoundary.toHumanReadable(), "100ms");
    
    const maxBoundary = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS);
    assertEquals(maxBoundary.toHumanReadable(), "10m");
  });
});