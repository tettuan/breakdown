import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { TimeoutDuration } from "./timeout_duration.ts";

describe("2_structure_timeout_duration_test", () => {
  it("should have correct data structure integrity", () => {
    // Test internal data consistency
    const instance = TimeoutDuration.fromMilliseconds(5000);
    
    // Verify that all time unit conversions are mathematically consistent
    const milliseconds = instance.toMilliseconds();
    const seconds = instance.toSeconds();
    const minutes = instance.toMinutes();
    
    assertEquals(milliseconds, 5000);
    assertEquals(seconds, Math.floor(milliseconds / 1000));
    assertEquals(minutes, Math.floor(milliseconds / 60000));
    
    // Verify invariant conditions
    assertEquals(milliseconds >= TimeoutDuration.MIN_MILLISECONDS, true);
    assertEquals(milliseconds <= TimeoutDuration.MAX_MILLISECONDS, true);
    assertEquals(Number.isInteger(milliseconds), true);
    
    // Test structural constraints
    assertEquals(milliseconds > 0, true);
    assertEquals(seconds >= 0, true);
    assertEquals(minutes >= 0, true);
    
    // Test conversion consistency across different creation methods
    const fromMs = TimeoutDuration.fromMilliseconds(60000);
    const fromSec = TimeoutDuration.fromSeconds(60);
    const fromMin = TimeoutDuration.fromMinutes(1);
    
    assertEquals(fromMs.toMilliseconds(), 60000);
    assertEquals(fromSec.toMilliseconds(), 60000);
    assertEquals(fromMin.toMilliseconds(), 60000);
    
    assertEquals(fromMs.toSeconds(), 60);
    assertEquals(fromSec.toSeconds(), 60);
    assertEquals(fromMin.toSeconds(), 60);
    
    assertEquals(fromMs.toMinutes(), 1);
    assertEquals(fromSec.toMinutes(), 1);
    assertEquals(fromMin.toMinutes(), 1);
  });

  it("should validate discriminated union types", () => {
    // TimeoutDuration doesn't use discriminated unions directly,
    // but we can test that it behaves consistently as a value object
    const instance1 = TimeoutDuration.fromMilliseconds(1000);
    const instance2 = TimeoutDuration.fromMilliseconds(1000);
    const instance3 = TimeoutDuration.fromMilliseconds(2000);
    
    // Test value equality (structural equality)
    assertEquals(instance1.equals(instance2), true);
    assertEquals(instance1.equals(instance3), false);
    assertEquals(instance2.equals(instance3), false);
    
    // Test that equal instances have same string representation
    assertEquals(instance1.toString(), instance2.toString());
    assertEquals(instance1.toHumanReadable(), instance2.toHumanReadable());
    
    // Test that different instances have different string representations
    assertEquals(instance1.toString() === instance3.toString(), false);
    
    // Test JSON serialization consistency
    const json1 = instance1.toJSON();
    const json2 = instance2.toJSON();
    const json3 = instance3.toJSON();
    
    assertEquals(json1.milliseconds, json2.milliseconds);
    assertEquals(json1.humanReadable, json2.humanReadable);
    assertEquals(json1.milliseconds === json3.milliseconds, false);
  });

  it("should maintain Result type structure", () => {
    // TimeoutDuration doesn't use Result<T, E> pattern explicitly,
    // but it should maintain consistent error handling structure
    
    // Test that all creation methods either succeed or throw
    const validInstance1 = TimeoutDuration.fromMilliseconds(1000);
    const validInstance2 = TimeoutDuration.fromSeconds(1);
    const validInstance3 = TimeoutDuration.fromMinutes(1);
    
    // Verify successful creation returns valid instance
    assertExists(validInstance1);
    assertEquals(validInstance1.constructor.name, "TimeoutDuration");
    assertEquals(typeof validInstance1.toMilliseconds(), "number");
    
    assertExists(validInstance2);
    assertEquals(validInstance2.constructor.name, "TimeoutDuration");
    assertEquals(typeof validInstance2.toMilliseconds(), "number");
    
    assertExists(validInstance3);
    assertEquals(validInstance3.constructor.name, "TimeoutDuration");
    assertEquals(typeof validInstance3.toMilliseconds(), "number");
    
    // Test error type consistency - all errors should be Error instances
    try {
      TimeoutDuration.fromMilliseconds(50);
      assertEquals(false, true, "Should have thrown for fromMilliseconds with 50");
    } catch (error) {
      assertEquals(error instanceof Error, true);
      if (error instanceof Error) {
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        assertEquals(error.message.length > 0, true);
      }
    }
    
    try {
      TimeoutDuration.fromSeconds(-1);
      assertEquals(false, true, "Should have thrown for fromSeconds with -1");
    } catch (error) {
      assertEquals(error instanceof Error, true);
      if (error instanceof Error) {
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        assertEquals(error.message.length > 0, true);
      }
    }
    
    try {
      TimeoutDuration.fromMinutes(Infinity);
      assertEquals(false, true, "Should have thrown for fromMinutes with Infinity");
    } catch (error) {
      assertEquals(error instanceof Error, true);
      if (error instanceof Error) {
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        assertEquals(error.message.length > 0, true);
      }
    }
  });

  it("should validate value object constraints", () => {
    // Test business rule enforcement
    const minBoundary = TimeoutDuration.MIN_MILLISECONDS;
    const maxBoundary = TimeoutDuration.MAX_MILLISECONDS;
    
    // Test minimum boundary
    const minInstance = TimeoutDuration.fromMilliseconds(minBoundary);
    assertEquals(minInstance.toMilliseconds(), minBoundary);
    
    // Test maximum boundary  
    const maxInstance = TimeoutDuration.fromMilliseconds(maxBoundary);
    assertEquals(maxInstance.toMilliseconds(), maxBoundary);
    
    // Verify validation logic
    const testCases = [
      { input: minBoundary, shouldPass: true },
      { input: minBoundary - 1, shouldPass: false },
      { input: maxBoundary, shouldPass: true },
      { input: maxBoundary + 1, shouldPass: false },
      { input: 1.5, shouldPass: false },
      { input: 1000, shouldPass: true },
    ];
    
    for (const testCase of testCases) {
      if (testCase.shouldPass) {
        const instance = TimeoutDuration.fromMilliseconds(testCase.input);
        assertEquals(instance.toMilliseconds(), testCase.input);
      } else {
        try {
          TimeoutDuration.fromMilliseconds(testCase.input);
          assertEquals(false, true, `Should have failed for input: ${testCase.input}`);
        } catch (error) {
          assertEquals(error instanceof Error, true);
        }
      }
    }
    
    // Test constraint boundaries for arithmetic operations
    const instance = TimeoutDuration.fromMilliseconds(1000);
    
    // Addition should cap at maximum
    const largeValue = TimeoutDuration.fromMilliseconds(maxBoundary);
    const overflowResult = largeValue.add(instance);
    assertEquals(overflowResult.toMilliseconds(), maxBoundary);
    
    // Subtraction should cap at minimum
    const smallValue = TimeoutDuration.fromMilliseconds(minBoundary);
    const underflowResult = smallValue.subtract(instance);
    assertEquals(underflowResult.toMilliseconds(), minBoundary);
    
    // Scaling should respect boundaries
    const scaledUp = instance.scale(1000);
    assertEquals(scaledUp.toMilliseconds(), maxBoundary);
    
    const scaledDown = instance.scale(0.01);
    assertEquals(scaledDown.toMilliseconds(), minBoundary);
    
    // Test human readable format constraints
    const testFormats = [
      { ms: 500, expected: "500ms" },
      { ms: 1000, expected: "1s" },
      { ms: 60000, expected: "1m" },
      { ms: 90000, expected: "1m30s" },
      { ms: 600000, expected: "10m" }, // Use max allowed value instead of 3600000
    ];
    
    for (const test of testFormats) {
      const instance = TimeoutDuration.fromMilliseconds(test.ms);
      assertEquals(instance.toHumanReadable(), test.expected);
    }
    
    // Test comparison constraints
    const smaller = TimeoutDuration.fromMilliseconds(1000);
    const larger = TimeoutDuration.fromMilliseconds(2000);
    
    assertEquals(smaller.isLessThan(larger), true);
    assertEquals(larger.isGreaterThan(smaller), true);
    assertEquals(smaller.isLessThanOrEqualTo(larger), true);
    assertEquals(larger.isGreaterThanOrEqualTo(smaller), true);
    assertEquals(smaller.equals(larger), false);
    
    // Test reflexivity
    assertEquals(smaller.equals(smaller), true);
    assertEquals(smaller.isLessThanOrEqualTo(smaller), true);
    assertEquals(smaller.isGreaterThanOrEqualTo(smaller), true);
  });

  it("should maintain JSON serialization structure integrity", () => {
    // Test JSON structure consistency
    const instance = TimeoutDuration.fromMilliseconds(5000);
    const json = instance.toJSON();
    
    // Verify JSON structure
    assertEquals(typeof json, "object");
    assertEquals(json !== null, true);
    assertEquals(Array.isArray(json), false);
    
    // Verify required properties
    assertEquals("milliseconds" in json, true);
    assertEquals("humanReadable" in json, true);
    assertEquals(Object.keys(json).length, 2);
    
    // Verify property types
    assertEquals(typeof json.milliseconds, "number");
    assertEquals(typeof json.humanReadable, "string");
    
    // Verify property values
    assertEquals(json.milliseconds, 5000);
    assertEquals(json.humanReadable, "5s");
    
    // Test JSON serialization stability
    const json2 = instance.toJSON();
    assertEquals(json.milliseconds, json2.milliseconds);
    assertEquals(json.humanReadable, json2.humanReadable);
    
    // Test JSON serialization for different instances
    const instances = [
      { timeout: TimeoutDuration.fromMilliseconds(100), expectedMs: 100, expectedHuman: "100ms" },
      { timeout: TimeoutDuration.fromSeconds(30), expectedMs: 30000, expectedHuman: "30s" },
      { timeout: TimeoutDuration.fromMinutes(2), expectedMs: 120000, expectedHuman: "2m" },
      { timeout: TimeoutDuration.default(), expectedMs: 30000, expectedHuman: "30s" },
      { timeout: TimeoutDuration.infinite(), expectedMs: 600000, expectedHuman: "10m" },
    ];
    
    for (const test of instances) {
      const testJson = test.timeout.toJSON();
      assertEquals(testJson.milliseconds, test.expectedMs);
      assertEquals(testJson.humanReadable, test.expectedHuman);
    }
  });

  it("should maintain toString structure integrity", () => {
    // Test toString format consistency
    const instance = TimeoutDuration.fromMilliseconds(5000);
    const str = instance.toString();
    
    // Verify string format
    assertEquals(typeof str, "string");
    assertEquals(str.length > 0, true);
    assertEquals(str.startsWith("TimeoutDuration("), true);
    assertEquals(str.endsWith(")"), true);
    assertEquals(str.includes("5s"), true);
    
    // Test toString consistency across calls
    const str2 = instance.toString();
    assertEquals(str, str2);
    
    // Test toString format for different values
    const testCases = [
      { timeout: TimeoutDuration.fromMilliseconds(500), expectedSubstring: "500ms" },
      { timeout: TimeoutDuration.fromSeconds(30), expectedSubstring: "30s" },
      { timeout: TimeoutDuration.fromMinutes(2), expectedSubstring: "2m" },
      { timeout: TimeoutDuration.fromMilliseconds(90000), expectedSubstring: "1m30s" },
    ];
    
    for (const test of testCases) {
      const testStr = test.timeout.toString();
      assertEquals(testStr.startsWith("TimeoutDuration("), true);
      assertEquals(testStr.includes(test.expectedSubstring), true);
      assertEquals(testStr.endsWith(")"), true);
    }
  });

  it("should maintain equality semantics structure", () => {
    // Test equality relation properties
    const timeout1 = TimeoutDuration.fromMilliseconds(1000);
    const timeout2 = TimeoutDuration.fromMilliseconds(1000);
    const timeout3 = TimeoutDuration.fromMilliseconds(2000);
    
    // Reflexivity: a.equals(a) should be true
    assertEquals(timeout1.equals(timeout1), true);
    
    // Symmetry: a.equals(b) iff b.equals(a)
    assertEquals(timeout1.equals(timeout2), timeout2.equals(timeout1));
    assertEquals(timeout1.equals(timeout3), timeout3.equals(timeout1));
    
    // Transitivity: if a.equals(b) and b.equals(c), then a.equals(c)
    const timeout4 = TimeoutDuration.fromMilliseconds(1000);
    if (timeout1.equals(timeout2) && timeout2.equals(timeout4)) {
      assertEquals(timeout1.equals(timeout4), true);
    }
    
    // Consistency: multiple calls should return same result
    assertEquals(timeout1.equals(timeout2), timeout1.equals(timeout2));
    assertEquals(timeout1.equals(timeout3), timeout1.equals(timeout3));
    
    // Non-nullity: equals should handle the same instance correctly
    assertEquals(timeout1.equals(timeout1), true);
    
    // Value-based equality: objects with same value should be equal
    const sameValue1 = TimeoutDuration.fromMilliseconds(5000);
    const sameValue2 = TimeoutDuration.fromSeconds(5);
    assertEquals(sameValue1.equals(sameValue2), true);
    
    // Different construction methods should still allow equality
    const fromMs = TimeoutDuration.fromMilliseconds(60000);
    const fromSec = TimeoutDuration.fromSeconds(60);
    const fromMin = TimeoutDuration.fromMinutes(1);
    
    assertEquals(fromMs.equals(fromSec), true);
    assertEquals(fromSec.equals(fromMin), true);
    assertEquals(fromMs.equals(fromMin), true);
  });

  it("should maintain immutability structure invariants", () => {
    // Test that all operations preserve original instance
    const original = TimeoutDuration.fromMilliseconds(1000);
    const originalMs = original.toMilliseconds();
    const originalSec = original.toSeconds();
    const originalMin = original.toMinutes();
    const originalHuman = original.toHumanReadable();
    const originalStr = original.toString();
    const originalJson = original.toJSON();
    
    // Perform all possible operations
    const other = TimeoutDuration.fromMilliseconds(500);
    original.add(other);
    original.subtract(other);
    original.scale(2);
    original.equals(other);
    original.isGreaterThan(other);
    original.isLessThan(other);
    original.isGreaterThanOrEqualTo(other);
    original.isLessThanOrEqualTo(other);
    
    // Verify original is unchanged
    assertEquals(original.toMilliseconds(), originalMs);
    assertEquals(original.toSeconds(), originalSec);
    assertEquals(original.toMinutes(), originalMin);
    assertEquals(original.toHumanReadable(), originalHuman);
    assertEquals(original.toString(), originalStr);
    
    const newJson = original.toJSON();
    assertEquals(newJson.milliseconds, originalJson.milliseconds);
    assertEquals(newJson.humanReadable, originalJson.humanReadable);
    
    // Test that returned instances are different objects but with correct values
    const added = original.add(other);
    const subtracted = original.subtract(other);
    const scaled = original.scale(2);
    
    // Different object references
    assertEquals(added !== original, true);
    assertEquals(subtracted !== original, true);
    assertEquals(scaled !== original, true);
    
    // Correct values
    assertEquals(added.toMilliseconds(), 1500);
    assertEquals(subtracted.toMilliseconds(), 500);
    assertEquals(scaled.toMilliseconds(), 2000);
  });
});