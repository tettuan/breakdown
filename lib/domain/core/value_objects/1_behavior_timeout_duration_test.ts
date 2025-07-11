/**
 * @fileoverview TimeoutDuration Behavior Tests - Enhanced Totality Pattern Validation
 *
 * Totality原則に基づくSmart Constructor、Result型、Discriminated Unionパターンの統合テスト。
 * 新しいTotality準拠実装の動作とエラーハンドリングを検証。
 *
 * テスト構成:
 * - Smart Constructor (fromMilliseconds/fromSeconds/fromMinutes) パターンの検証
 * - Result型によるエラーハンドリングの検証
 * - Discriminated Unionエラー型の検証
 * - 型ガード関数の検証
 * - レガシー互換性の検証
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  formatTimeoutDurationError,
  isAboveMaximumError as _isAboveMaximumError,
  isBelowMinimumError,
  isInvalidMinutesError as _isInvalidMinutesError,
  isInvalidScaleFactorError as _isInvalidScaleFactorError,
  isInvalidSecondsError as _isInvalidSecondsError,
  isInvalidTypeError as _isInvalidTypeError,
  isNonIntegerValueError,
  isNullOrUndefinedError,
  TimeoutDuration,
  TimeoutDurationError as _TimeoutDurationError,
} from "./timeout_duration.ts";
import type { Result as _Result } from "../../../types/result.ts";

// =============================================================================
// TOTALITY PATTERN: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("Totality - TimeoutDuration implements Smart Constructor pattern with Result type", () => {
  // Smart Constructor: Private constructor, public static factory methods

  // Primary Smart Constructor methods
  assertExists(TimeoutDuration.fromMilliseconds);
  assertExists(TimeoutDuration.fromSeconds);
  assertExists(TimeoutDuration.fromMinutes);

  // Legacy factory methods should still exist
  assertExists(TimeoutDuration.fromMillisecondsUnsafe);
  assertExists(TimeoutDuration.fromSecondsUnsafe);
  assertExists(TimeoutDuration.fromMinutesUnsafe);
  assertExists(TimeoutDuration.default);
  assertExists(TimeoutDuration.infinite);

  // Verify Smart Constructor returns Result type
  const result = TimeoutDuration.fromMilliseconds(5000);
  assertExists(result);
  assertExists(result.ok);

  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.toMilliseconds(), 5000);
  }
});

Deno.test("Totality - TimeoutDuration.fromMilliseconds validates all parameters comprehensively", () => {
  // Valid creation should succeed
  const validResult = TimeoutDuration.fromMilliseconds(5000);

  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.toMilliseconds(), 5000);
    assertEquals(validResult.data.toHumanReadable(), "5s");
  }

  // Invalid value (null) should return error
  const nullResult = TimeoutDuration.fromMilliseconds(null as unknown as number);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }

  // Invalid value (non-integer) should return error
  const nonIntegerResult = TimeoutDuration.fromMilliseconds(1.5);
  assert(!nonIntegerResult.ok);
  if (!nonIntegerResult.ok) {
    assertEquals(nonIntegerResult.error.kind, "NonIntegerValue");
  }

  // Invalid value (below minimum) should return error
  const belowMinResult = TimeoutDuration.fromMilliseconds(50);
  assert(!belowMinResult.ok);
  if (!belowMinResult.ok) {
    assertEquals(belowMinResult.error.kind, "BelowMinimum");
  }

  // Invalid value (above maximum) should return error
  const aboveMaxResult = TimeoutDuration.fromMilliseconds(700000);
  assert(!aboveMaxResult.ok);
  if (!aboveMaxResult.ok) {
    assertEquals(aboveMaxResult.error.kind, "AboveMaximum");
  }

  // Invalid type should return error
  const invalidTypeResult = TimeoutDuration.fromMilliseconds("5000" as unknown as number);
  assert(!invalidTypeResult.ok);
  if (!invalidTypeResult.ok) {
    assertEquals(invalidTypeResult.error.kind, "InvalidType");
  }

  // Infinite value should return error
  const infiniteResult = TimeoutDuration.fromMilliseconds(Infinity);
  assert(!infiniteResult.ok);
  if (!infiniteResult.ok) {
    assertEquals(infiniteResult.error.kind, "InvalidType");
  }
});

Deno.test("Totality - TimeoutDuration.fromSeconds returns Result type with comprehensive validation", () => {
  // Valid seconds creation should return success Result
  const validResult = TimeoutDuration.fromSeconds(30);
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.toSeconds(), 30);
    assertEquals(validResult.data.toMilliseconds(), 30000);
  }

  // Negative seconds should return error Result (Totality pattern)
  const negativeResult = TimeoutDuration.fromSeconds(-1);
  assert(!negativeResult.ok);
  if (!negativeResult.ok) {
    assertEquals(negativeResult.error.kind, "InvalidSeconds");
  }

  // Null seconds should return error Result
  const nullResult = TimeoutDuration.fromSeconds(null as unknown as number);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }

  // Infinite seconds should return error Result
  const infiniteResult = TimeoutDuration.fromSeconds(Infinity);
  assert(!infiniteResult.ok);
  if (!infiniteResult.ok) {
    assertEquals(infiniteResult.error.kind, "InvalidSeconds");
  }

  // Non-number seconds should return error Result
  const invalidTypeResult = TimeoutDuration.fromSeconds("30" as unknown as number);
  assert(!invalidTypeResult.ok);
  if (!invalidTypeResult.ok) {
    assertEquals(invalidTypeResult.error.kind, "InvalidType");
  }
});

Deno.test("Totality - TimeoutDuration.fromMinutes returns Result type with comprehensive validation", () => {
  // Valid minutes creation should return success Result
  const validResult = TimeoutDuration.fromMinutes(2);
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.toMinutes(), 2);
    assertEquals(validResult.data.toMilliseconds(), 120000);
  }

  // Negative minutes should return error Result (Totality pattern)
  const negativeResult = TimeoutDuration.fromMinutes(-1);
  assert(!negativeResult.ok);
  if (!negativeResult.ok) {
    assertEquals(negativeResult.error.kind, "InvalidMinutes");
  }

  // Null minutes should return error Result
  const nullResult = TimeoutDuration.fromMinutes(null as unknown as number);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }
});

Deno.test("Totality - TimeoutDuration arithmetic operations return Result types", () => {
  // Create valid base timeout
  const baseResult = TimeoutDuration.fromMilliseconds(5000);
  assert(baseResult.ok);
  if (baseResult.ok) {
    const base = baseResult.data;
    const otherResult = TimeoutDuration.fromMilliseconds(2000);
    assert(otherResult.ok);
    if (otherResult.ok) {
      const other = otherResult.data;

      // Test addition returns Result
      const addResult = base.add(other);
      assert(addResult.ok);
      if (addResult.ok) {
        assertEquals(addResult.data.toMilliseconds(), 7000);
      }

      // Test subtraction returns Result
      const subResult = base.subtract(other);
      assert(subResult.ok);
      if (subResult.ok) {
        assertEquals(subResult.data.toMilliseconds(), 3000);
      }

      // Test scaling returns Result
      const scaleResult = base.scale(2);
      assert(scaleResult.ok);
      if (scaleResult.ok) {
        assertEquals(scaleResult.data.toMilliseconds(), 10000);
      }
    }
  }
});

Deno.test("Totality - TimeoutDuration.scale validates scale factor comprehensively", () => {
  const baseResult = TimeoutDuration.fromMilliseconds(1000);
  assert(baseResult.ok);
  if (baseResult.ok) {
    const base = baseResult.data;

    // Valid scale factor should succeed
    const validResult = base.scale(2.5);
    assert(validResult.ok);
    if (validResult.ok) {
      assertEquals(validResult.data.toMilliseconds(), 2500);
    }

    // Negative scale factor should return error
    const negativeResult = base.scale(-1);
    assert(!negativeResult.ok);
    if (!negativeResult.ok) {
      assertEquals(negativeResult.error.kind, "InvalidScaleFactor");
    }

    // Null scale factor should return error
    const nullResult = base.scale(null as unknown as number);
    assert(!nullResult.ok);
    if (!nullResult.ok) {
      assertEquals(nullResult.error.kind, "NullOrUndefined");
    }

    // Infinite scale factor should return error
    const infiniteResult = base.scale(Infinity);
    assert(!infiniteResult.ok);
    if (!infiniteResult.ok) {
      assertEquals(infiniteResult.error.kind, "InvalidScaleFactor");
    }
  }
});

// =============================================================================
// DISCRIMINATED UNION ERROR TYPE TESTS
// =============================================================================

Deno.test("Totality - TimeoutDurationError type guards work correctly", () => {
  // Test different error types and their type guards
  const nonIntegerResult = TimeoutDuration.fromMilliseconds(1.5);
  assert(!nonIntegerResult.ok);
  if (!nonIntegerResult.ok) {
    const nonIntegerError = nonIntegerResult.error;

    const belowMinResult = TimeoutDuration.fromMilliseconds(50);
    assert(!belowMinResult.ok);
    if (!belowMinResult.ok) {
      const belowMinError = belowMinResult.error;

      const nullResult = TimeoutDuration.fromMilliseconds(null as unknown as number);
      assert(!nullResult.ok);
      if (!nullResult.ok) {
        const nullError = nullResult.error;

        // Test type guards
        assert(isNonIntegerValueError(nonIntegerError));
        assert(!isBelowMinimumError(nonIntegerError));
        assert(!isNullOrUndefinedError(nonIntegerError));

        assert(isBelowMinimumError(belowMinError));
        assert(!isNonIntegerValueError(belowMinError));

        assert(isNullOrUndefinedError(nullError));
        assert(!isNonIntegerValueError(nullError));
      }
    }
  }
});

Deno.test("Totality - formatTimeoutDurationError provides comprehensive error messages", () => {
  // Test NonIntegerValue error formatting
  const nonIntegerResult = TimeoutDuration.fromMilliseconds(1.5);
  assert(!nonIntegerResult.ok);
  if (!nonIntegerResult.ok) {
    const nonIntegerMessage = formatTimeoutDurationError(nonIntegerResult.error);
    assert(nonIntegerMessage.includes("must be an integer"));
    assert(nonIntegerMessage.includes("1.5"));
  }

  // Test BelowMinimum error formatting
  const belowMinResult = TimeoutDuration.fromMilliseconds(50);
  assert(!belowMinResult.ok);
  if (!belowMinResult.ok) {
    const belowMinMessage = formatTimeoutDurationError(belowMinResult.error);
    assert(belowMinMessage.includes("below minimum"));
    assert(belowMinMessage.includes("50"));
    assert(belowMinMessage.includes("100"));
  }

  // Test AboveMaximum error formatting
  const aboveMaxResult = TimeoutDuration.fromMilliseconds(700000);
  assert(!aboveMaxResult.ok);
  if (!aboveMaxResult.ok) {
    const aboveMaxMessage = formatTimeoutDurationError(aboveMaxResult.error);
    assert(aboveMaxMessage.includes("above maximum"));
    assert(aboveMaxMessage.includes("700000"));
    assert(aboveMaxMessage.includes("600000"));
  }

  // Test InvalidSeconds error formatting
  const invalidSecondsResult = TimeoutDuration.fromSeconds(-5);
  assert(!invalidSecondsResult.ok);
  if (!invalidSecondsResult.ok) {
    const invalidSecondsMessage = formatTimeoutDurationError(invalidSecondsResult.error);
    assert(invalidSecondsMessage.includes("Invalid seconds value"));
    assert(invalidSecondsMessage.includes("-5"));
  }
});

// =============================================================================
// LEGACY COMPATIBILITY TESTS
// =============================================================================

Deno.test("Totality - Legacy methods maintain backward compatibility", () => {
  // Legacy factory methods should still work
  const defaultTimeout = TimeoutDuration.default();
  assertEquals(defaultTimeout.toMilliseconds(), 30000);

  const infiniteTimeout = TimeoutDuration.infinite();
  assertEquals(infiniteTimeout.toMilliseconds(), 600000);

  // Legacy unsafe methods should work but are deprecated
  const unsafeTimeout = TimeoutDuration.fromMillisecondsUnsafe(5000);
  assertEquals(unsafeTimeout.toMilliseconds(), 5000);

  // Legacy unsafe methods should throw on error
  try {
    TimeoutDuration.fromMillisecondsUnsafe(1.5);
    assert(false, "Should have thrown");
  } catch (error) {
    assert(error instanceof Error);
    if (error instanceof Error) {
      assert(error.message.includes("must be an integer"));
    }
  }

  // Test unsafe arithmetic methods
  const baseUnsafe = TimeoutDuration.fromMillisecondsUnsafe(1000);
  const otherUnsafe = TimeoutDuration.fromMillisecondsUnsafe(500);

  const addedUnsafe = baseUnsafe.addUnsafe(otherUnsafe);
  assertEquals(addedUnsafe.toMilliseconds(), 1500);

  const subtractedUnsafe = baseUnsafe.subtractUnsafe(otherUnsafe);
  assertEquals(subtractedUnsafe.toMilliseconds(), 500);

  const scaledUnsafe = baseUnsafe.scaleUnsafe(2);
  assertEquals(scaledUnsafe.toMilliseconds(), 2000);

  // Should throw on invalid scale factor
  try {
    baseUnsafe.scaleUnsafe(-1);
    assert(false, "Should have thrown");
  } catch (error) {
    assert(error instanceof Error);
  }
});

// =============================================================================
// IMMUTABILITY AND VALUE OBJECT TESTS
// =============================================================================

Deno.test("Totality - TimeoutDuration instances are completely immutable", () => {
  const result = TimeoutDuration.fromMilliseconds(5000);
  assert(result.ok);
  if (result.ok) {
    const timeout = result.data;

    // Object should be frozen
    assert(Object.isFrozen(timeout));

    // Repeated calls should return identical values
    assertEquals(timeout.toMilliseconds(), timeout.toMilliseconds());
    assertEquals(timeout.toSeconds(), timeout.toSeconds());
    assertEquals(timeout.toMinutes(), timeout.toMinutes());
    assertEquals(timeout.toHumanReadable(), timeout.toHumanReadable());

    // Arithmetic operations should create new instances
    const otherResult = TimeoutDuration.fromMilliseconds(2000);
    assert(otherResult.ok);
    if (otherResult.ok) {
      const other = otherResult.data;

      const addResult = timeout.add(other);
      assert(addResult.ok);
      if (addResult.ok) {
        const added = addResult.data;
        assertEquals(timeout.toMilliseconds(), 5000); // Original unchanged
        assertEquals(added.toMilliseconds(), 7000); // New instance changed
      }
    }
  }
});

Deno.test("Architecture - TimeoutDuration timeout behavior works correctly", () => {
  // Test that timeout creation and basic operations still work with the new implementation
  const timeoutResult = TimeoutDuration.fromMilliseconds(10000);

  assert(timeoutResult.ok);
  if (timeoutResult.ok) {
    const timeout = timeoutResult.data;

    // Basic conversions
    assertEquals(timeout.toMilliseconds(), 10000);
    assertEquals(timeout.toSeconds(), 10);
    assertEquals(timeout.toMinutes(), 0);
    assertEquals(timeout.toHumanReadable(), "10s");

    // JSON representation
    const json = timeout.toJSON();
    assertEquals(json.milliseconds, 10000);
    assertEquals(json.humanReadable, "10s");

    // String representation
    assertEquals(timeout.toString(), "TimeoutDuration(10s)");
  }
});

Deno.test("Architecture - TimeoutDuration comparison methods work correctly", () => {
  // Test that comparison operations still work after Totality refactoring
  const timeout1Result = TimeoutDuration.fromMilliseconds(1000);
  const timeout2Result = TimeoutDuration.fromMilliseconds(2000);
  const timeout3Result = TimeoutDuration.fromMilliseconds(1000);

  assert(timeout1Result.ok && timeout2Result.ok && timeout3Result.ok);
  if (timeout1Result.ok && timeout2Result.ok && timeout3Result.ok) {
    const timeout1 = timeout1Result.data;
    const timeout2 = timeout2Result.data;
    const timeout3 = timeout3Result.data;

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
  }
});

Deno.test("Architecture - TimeoutDuration handles edge cases correctly", () => {
  // Test boundary values
  const minResult = TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
  const maxResult = TimeoutDuration.fromMilliseconds(TimeoutDuration.MAX_MILLISECONDS);

  assert(minResult.ok && maxResult.ok);
  if (minResult.ok && maxResult.ok) {
    const minTimeout = minResult.data;
    const maxTimeout = maxResult.data;

    assertEquals(minTimeout.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
    assertEquals(maxTimeout.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);

    // Test overflow handling
    const overflowResult = maxTimeout.add(minTimeout);
    assert(overflowResult.ok);
    if (overflowResult.ok) {
      assertEquals(overflowResult.data.toMilliseconds(), TimeoutDuration.MAX_MILLISECONDS);
    }

    // Test underflow handling
    const underflowResult = minTimeout.subtract(maxTimeout);
    assert(underflowResult.ok);
    if (underflowResult.ok) {
      assertEquals(underflowResult.data.toMilliseconds(), TimeoutDuration.MIN_MILLISECONDS);
    }
  }
});

Deno.test("Architecture - TimeoutDuration human-readable format is consistent", () => {
  // Test various human-readable formats
  const testCases = [
    { ms: 500, expected: "500ms" },
    { ms: 1000, expected: "1s" },
    { ms: 30000, expected: "30s" },
    { ms: 60000, expected: "1m" },
    { ms: 90000, expected: "1m30s" },
    { ms: 120000, expected: "2m" },
    { ms: 300000, expected: "5m" },
  ];

  for (const testCase of testCases) {
    const result = TimeoutDuration.fromMilliseconds(testCase.ms);
    assert(result.ok);
    if (result.ok) {
      assertEquals(result.data.toHumanReadable(), testCase.expected);
    }
  }
});
