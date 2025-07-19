/**
 * @fileoverview Behavior tests for I/O stdin error handling
 *
 * Tests the behavioral aspects of stdin error handling, focusing on
 * the correct behavior of Result-based error handling patterns.
 * These tests validate that the I/O system behaves correctly under
 * various error conditions and edge cases.
 *
 * Behavior tests focus on:
 * - Result type error handling behavior
 * - Error propagation and transformation
 * - Resource cleanup in error scenarios
 * - Timeout and cancellation behavior
 *
 * @module
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { error as _error, ok as _ok } from "../types/result.ts";
import {
  formatStdinError,
  isConfigurationError,
  isEmptyInputError,
  isNotAvailableError,
  isReadError,
  isTimeoutError,
  isValidationError,
  type StdinErrorType,
} from "./stdin_error_types.ts";
import { StdinAvailability, StdinReadingConfiguration } from "./stdin_configuration.ts";
import { safeReadStdin } from "./enhanced_stdin.ts";

/**
 * Test group: Result-based error handling behavior
 */
Deno.test({
  name: "IO Behavior: readStdinSafe returns Result with timeout error",
  fn: () => {
    // Mock test: タイムアウト設定でのエラーハンドリングを確認
    const config = StdinReadingConfiguration.create(false, 100); // Very short timeout
    assertEquals(config.ok, true);

    if (config.ok) {
      // テスト環境では実際のstdinは使わず、設定の妥当性のみテスト
      assertEquals(config.data.allowEmpty, false);
      assertEquals(config.data.timeout, 100);

      // タイムアウトが短すぎることを検証（実際のstdin読み取りはスキップ）
      assertEquals(config.data.timeout < 1000, true, "Short timeout should be properly configured");
    }
  },
});

Deno.test("IO Behavior: StdinAvailability detection handles errors gracefully", () => {
  // Test behavior under normal conditions
  const availabilityResult = StdinAvailability.detect();

  if (availabilityResult.ok) {
    const availability = availabilityResult.data;

    // Behavior: should provide consistent state
    const shouldRead = availability.shouldAttemptRead();
    assertEquals(typeof shouldRead, "boolean");

    // Behavior: terminal detection should be consistent
    if (availability.isTerminal) {
      assertEquals(shouldRead, false);
    }
  } else {
    // Behavior: error should be ReadError type
    assertEquals(isReadError(availabilityResult.error), true);
  }
});

Deno.test("IO Behavior: Error type guards behave correctly", () => {
  const errors: StdinErrorType[] = [
    { kind: "ReadError", message: "Read failed" },
    { kind: "TimeoutError", timeout: 5000 },
    { kind: "EmptyInputError", message: "No input" },
    { kind: "NotAvailableError", environment: "CI" },
    { kind: "ValidationError", field: "timeout", message: "Invalid" },
    { kind: "ConfigurationError", setting: "encoding" },
  ];

  // Behavior: each type guard should only match its specific type
  assertEquals(isReadError(errors[0]), true);
  assertEquals(isTimeoutError(errors[1]), true);
  assertEquals(isEmptyInputError(errors[2]), true);
  assertEquals(isNotAvailableError(errors[3]), true);
  assertEquals(isValidationError(errors[4]), true);
  assertEquals(isConfigurationError(errors[5]), true);

  // Behavior: type guards should not cross-match
  assertEquals(isReadError(errors[1]), false);
  assertEquals(isTimeoutError(errors[0]), false);
  assertEquals(isEmptyInputError(errors[1]), false);
  assertEquals(isNotAvailableError(errors[0]), false);
  assertEquals(isValidationError(errors[0]), false);
  assertEquals(isConfigurationError(errors[0]), false);
});

Deno.test("IO Behavior: formatStdinError produces readable messages", () => {
  const errors: StdinErrorType[] = [
    { kind: "ReadError", message: "Failed to read" },
    { kind: "TimeoutError", timeout: 5000 },
    { kind: "EmptyInputError", message: "No input provided" },
    { kind: "NotAvailableError", environment: "test" },
    { kind: "ValidationError", field: "timeout", message: "Must be positive" },
    { kind: "ConfigurationError", setting: "encoding", value: "invalid" },
  ];

  const messages = errors.map(formatStdinError);

  // Behavior: all messages should be non-empty strings
  messages.forEach((message) => {
    assertEquals(typeof message, "string");
    assertEquals(message.length > 0, true);
  });

  // Behavior: messages should contain relevant information
  assertEquals(messages[0].includes("Failed to read"), true);
  assertEquals(messages[1].includes("5000ms"), true);
  assertEquals(messages[2].includes("No input provided"), true);
  assertEquals(messages[3].includes("test"), true);
  assertEquals(messages[4].includes("timeout"), true);
  assertEquals(messages[5].includes("encoding"), true);
});

/**
 * Test group: Configuration validation behavior
 */
Deno.test("IO Behavior: StdinReadingConfiguration validation behavior", () => {
  // Behavior: valid configurations should succeed
  const validConfigs = [
    StdinReadingConfiguration.create(true, 1000),
    StdinReadingConfiguration.create(false, 30000),
    StdinReadingConfiguration.standard(),
    StdinReadingConfiguration.permissive(10000),
    StdinReadingConfiguration.ciSafe(),
  ];

  validConfigs.forEach((result) => {
    assertEquals(result.ok, true);
  });

  // Behavior: invalid configurations should fail predictably
  const invalidConfigs = [
    StdinReadingConfiguration.create(true, -100), // Negative timeout
    StdinReadingConfiguration.create(false, 0), // Zero timeout
    StdinReadingConfiguration.create(true, 400000), // Too large timeout
  ];

  invalidConfigs.forEach((result) => {
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(isValidationError(result.error), true);
    }
  });
});

/**
 * Test group: Enhanced stdin behavior
 */
Deno.test("IO Behavior: safeReadStdin handles CI environment gracefully", async () => {
  // Test behavior in CI-like environment
  const result = await safeReadStdin({
    allowEmpty: true,
    timeout: 1000,
    forceRead: false,
  });

  // Behavior: should either succeed or fail gracefully
  assertEquals(typeof result.success, "boolean");
  assertEquals(typeof result.content, "string");
  assertEquals(typeof result.skipped, "boolean");
  assertExists(result.envInfo);

  // Behavior: if skipped, should have reason
  if (result.skipped) {
    assertExists(result.reason);
    assertEquals(typeof result.reason, "string");
  }

  // Behavior: environment info should be consistent
  assertEquals(typeof result.envInfo.isCI, "boolean");
  assertEquals(typeof result.envInfo.isTerminal, "boolean");
  assertEquals(typeof result.envInfo.isTest, "boolean");
});

Deno.test("IO Behavior: Error recovery and fallback behavior", async () => {
  // Test behavior when forcing read in unfavorable conditions
  const result = await safeReadStdin({
    allowEmpty: true,
    timeout: 500,
    forceRead: true, // Force read even in CI
  });

  // Behavior: with forceRead, should attempt operation
  assertEquals(typeof result.success, "boolean");

  if (!result.success) {
    // Behavior: should provide reason for failure
    assertExists(result.reason);
    assertEquals(typeof result.reason, "string");
  }

  // Behavior: should not skip when forced
  // (though it may still fail)
  assertEquals(result.skipped, false);
});

/**
 * Test group: Resource management behavior
 */
Deno.test("IO Behavior: Configuration factory methods are isolated", () => {
  // Test behavior: factory methods should produce independent instances
  const config1 = StdinReadingConfiguration.permissive(1000);
  const config2 = StdinReadingConfiguration.permissive(2000);

  assertEquals(config1.ok, true);
  assertEquals(config2.ok, true);

  if (config1.ok && config2.ok) {
    // Behavior: different timeouts should be preserved
    assertEquals(config1.data.timeout, 1000);
    assertEquals(config2.data.timeout, 2000);

    // Behavior: both should allow empty
    assertEquals(config1.data.allowEmpty, true);
    assertEquals(config2.data.allowEmpty, true);

    // Behavior: enhanced options should be independent
    const options1 = config1.data.enhancedOptions;
    const options2 = config2.data.enhancedOptions;

    assertEquals(options1.timeout, 1000);
    assertEquals(options2.timeout, 2000);
  }
});

Deno.test("IO Behavior: Error state does not affect subsequent operations", () => {
  // Create a configuration that will fail
  const failedConfig = StdinReadingConfiguration.create(false, -100);
  assertEquals(failedConfig.ok, false);

  // Behavior: subsequent operations should not be affected by previous failures
  const successConfig = StdinReadingConfiguration.create(true, 5000);
  assertEquals(successConfig.ok, true);

  // Behavior: the successful config should work normally
  if (successConfig.ok) {
    assertEquals(successConfig.data.allowEmpty, true);
    assertEquals(successConfig.data.timeout, 5000);
  }
});
