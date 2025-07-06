import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { TimeoutDuration } from "./timeout_duration.ts";

describe("0_architecture_timeout_duration_test", () => {
  it("should follow Smart Constructor pattern", () => {
    // Verify private constructor pattern - constructor is private
    // @ts-expect-error - constructor should be private
    const shouldFail = () => new TimeoutDuration(1000);
    
    // Verify static create methods exist
    assertExists(TimeoutDuration.fromMilliseconds);
    assertExists(TimeoutDuration.fromSeconds);
    assertExists(TimeoutDuration.fromMinutes);
    assertExists(TimeoutDuration.default);
    assertExists(TimeoutDuration.infinite);
    
    // Verify methods return TimeoutDuration instances
    const fromMs = TimeoutDuration.fromMilliseconds(1000);
    const fromSec = TimeoutDuration.fromSeconds(1);
    const fromMin = TimeoutDuration.fromMinutes(1);
    const defaultInstance = TimeoutDuration.default();
    const infiniteInstance = TimeoutDuration.infinite();
    
    assertEquals(fromMs.constructor.name, "TimeoutDuration");
    assertEquals(fromSec.constructor.name, "TimeoutDuration");
    assertEquals(fromMin.constructor.name, "TimeoutDuration");
    assertEquals(defaultInstance.constructor.name, "TimeoutDuration");
    assertEquals(infiniteInstance.constructor.name, "TimeoutDuration");
  });

  it("should have proper type safety boundaries", () => {
    // Verify no any/unknown usage - all methods have explicit types
    const instance = TimeoutDuration.fromMilliseconds(1000);
    
    // Verify proper generic constraints - methods return specific types
    const milliseconds: number = instance.toMilliseconds();
    const seconds: number = instance.toSeconds();
    const minutes: number = instance.toMinutes();
    const humanReadable: string = instance.toHumanReadable();
    const equals: boolean = instance.equals(TimeoutDuration.default());
    const json: { milliseconds: number; humanReadable: string } = instance.toJSON();
    const str: string = instance.toString();
    
    assertEquals(typeof milliseconds, "number");
    assertEquals(typeof seconds, "number");
    assertEquals(typeof minutes, "number");
    assertEquals(typeof humanReadable, "string");
    assertEquals(typeof equals, "boolean");
    assertEquals(typeof json, "object");
    assertEquals(typeof str, "string");
    
    // Verify immutability patterns - instance methods return new instances
    const original = TimeoutDuration.fromMilliseconds(1000);
    const added = original.add(TimeoutDuration.fromMilliseconds(500));
    const subtracted = original.subtract(TimeoutDuration.fromMilliseconds(500));
    const scaled = original.scale(2);
    
    // Original should be unchanged
    assertEquals(original.toMilliseconds(), 1000);
    assertEquals(added.toMilliseconds(), 1500);
    assertEquals(subtracted.toMilliseconds(), 500);
    assertEquals(scaled.toMilliseconds(), 2000);
  });

  it("should integrate with domain boundaries", () => {
    // Verify proper domain interfaces - constants are exposed
    assertEquals(typeof TimeoutDuration.MIN_MILLISECONDS, "number");
    assertEquals(typeof TimeoutDuration.MAX_MILLISECONDS, "number");
    assertEquals(typeof TimeoutDuration.DEFAULT_MILLISECONDS, "number");
    
    // Verify proper error propagation - errors are thrown with meaningful messages
    let errorThrown = false;
    try {
      TimeoutDuration.fromMilliseconds(50); // Below minimum
    } catch (error) {
      errorThrown = true;
      assertExists(error);
      assertEquals(error instanceof Error, true);
      if (error instanceof Error) {
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
      }
    }
    assertEquals(errorThrown, true);
    
    // Verify boundary values are enforced
    assertEquals(TimeoutDuration.MIN_MILLISECONDS, 100);
    assertEquals(TimeoutDuration.MAX_MILLISECONDS, 600_000);
    assertEquals(TimeoutDuration.DEFAULT_MILLISECONDS, 30_000);
    
    // Verify domain constraints are enforced
    const minInstance = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    const maxInstance = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS);
    
    assertEquals(minInstance.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
    assertEquals(maxInstance.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
  });

  it("should enforce Totality principle - Result-based error handling", () => {
    // NOTE: Current implementation uses throw-based error handling
    // This test documents the expected behavior for Result-based refactoring
    
    // Test boundary violations return errors instead of throwing
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(50), // Below minimum
      Error,
      "TimeoutDuration must be at least 100ms"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(700000), // Above maximum
      Error,
      "TimeoutDuration must not exceed 600000ms"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMilliseconds(1000.5), // Non-integer
      Error,
      "TimeoutDuration must be an integer"
    );
    
    // Test invalid scale factor
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
    
    // Test invalid seconds/minutes
    assertThrows(
      () => TimeoutDuration.fromSeconds(-1),
      Error,
      "Invalid seconds value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMinutes(-1),
      Error,
      "Invalid minutes value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromSeconds(Infinity),
      Error,
      "Invalid seconds value"
    );
    
    assertThrows(
      () => TimeoutDuration.fromMinutes(Infinity),
      Error,
      "Invalid minutes value"
    );
  });

  it("should maintain immutability guarantees", () => {
    const original = TimeoutDuration.fromMilliseconds(1000);
    
    // Verify arithmetic operations return new instances
    const added = original.add(TimeoutDuration.fromMilliseconds(500));
    const subtracted = original.subtract(TimeoutDuration.fromMilliseconds(500));
    const scaled = original.scale(2);
    
    // Original remains unchanged
    assertEquals(original.toMilliseconds(), 1000);
    assertEquals(added.toMilliseconds(), 1500);
    assertEquals(subtracted.toMilliseconds(), 500);
    assertEquals(scaled.toMilliseconds(), 2000);
    
    // Verify comparison operations don't modify state
    const other = TimeoutDuration.fromMilliseconds(2000);
    original.equals(other);
    original.isGreaterThan(other);
    original.isLessThan(other);
    
    assertEquals(original.toMilliseconds(), 1000);
    assertEquals(other.toMilliseconds(), 2000);
  });

  it("should handle boundary value edge cases correctly", () => {
    // Test minimum boundary enforcement
    const minTimeout = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    assertEquals(minTimeout.toMilliseconds(), 100);
    
    // Test maximum boundary enforcement
    const maxTimeout = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS);
    assertEquals(maxTimeout.toMilliseconds(), 600000);
    
    // Test add operation with overflow protection
    const nearMax = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS - 1000);
    const added = nearMax.add(TimeoutDuration.fromMilliseconds(2000));
    assertEquals(added.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS); // Should cap at max
    
    // Test subtract operation with underflow protection
    const nearMin = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS + 50);
    const subtracted = nearMin.subtract(TimeoutDuration.fromMilliseconds(100));
    assertEquals(subtracted.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS); // Should cap at min
    
    // Test scale operation boundaries
    const instance = TimeoutDuration.fromMilliseconds(1000);
    const scaledUp = instance.scale(1000); // Should cap at maximum
    assertEquals(scaledUp.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
    
    const scaledDown = instance.scale(0.01); // Should cap at minimum
    assertEquals(scaledDown.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
  });
});