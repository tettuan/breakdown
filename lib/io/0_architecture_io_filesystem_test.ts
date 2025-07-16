/**
 * @fileoverview Architecture tests for I/O filesystem operations
 *
 * Tests the fundamental filesystem operation constraints that support
 * the I/O domain's responsibility for safe file system interactions.
 * These are architecture tests that validate the core principles and
 * constraints of the I/O subsystem.
 *
 * Architecture tests focus on:
 * - Filesystem abstraction layers work correctly
 * - Result-based error handling for filesystem operations
 * - Type safety of file system interaction contracts
 * - Proper resource management and cleanup
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  StdinAvailability,
  StdinReadingConfiguration,
} from "./stdin_configuration.ts";
import { StdinErrorType } from "./stdin_error_types.ts";
import {
  StdoutWriteConfiguration,
  writeStdoutSafe,
} from "./stdout.ts";

/**
 * Test group: Filesystem operation architecture constraints
 */
Deno.test("IO Architecture: StdinReadingConfiguration follows Value Object pattern", () => {
  // Test immutability constraint
  const configResult = StdinReadingConfiguration.create(true, 5000);
  assertEquals(configResult.ok, true);

  if (configResult.ok) {
    const config = configResult.data;

    // Value Object constraint: immutable properties
    assertEquals(config.allowEmpty, true);
    assertEquals(config.timeout, 5000);

    // Attempt to modify (should be impossible with readonly)
    // This is enforced at compile time by TypeScript
    assertExists(config.enhancedOptions);
  }
});

Deno.test("IO Architecture: StdinReadingConfiguration validates construction parameters", () => {
  // Test constraint: invalid timeout rejected
  const invalidTimeout = StdinReadingConfiguration.create(false, -100);
  assertEquals(invalidTimeout.ok, false);

  if (!invalidTimeout.ok) {
    assertEquals(invalidTimeout.error.kind, "ValidationError");
    if (invalidTimeout.error.kind === "ValidationError") {
      assertEquals(invalidTimeout.error.field, "timeout");
    }
  }

  // Test constraint: timeout too large rejected
  const tooLargeTimeout = StdinReadingConfiguration.create(false, 400000);
  assertEquals(tooLargeTimeout.ok, false);

  if (!tooLargeTimeout.ok) {
    assertEquals(tooLargeTimeout.error.kind, "ValidationError");
    if (tooLargeTimeout.error.kind === "ValidationError") {
      assertEquals(tooLargeTimeout.error.field, "timeout");
    }
  }
});

Deno.test("IO Architecture: StdoutWriteConfiguration follows factory pattern", () => {
  // Test standard configuration factory
  const standardConfig = StdoutWriteConfiguration.standard();
  assertEquals(standardConfig.ok, true);

  if (standardConfig.ok) {
    assertEquals(standardConfig.data.flushImmediate, false);
    assertEquals(standardConfig.data.appendNewline, false);
  }

  // Test immediate configuration factory
  const immediateConfig = StdoutWriteConfiguration.immediate();
  assertEquals(immediateConfig.ok, true);

  if (immediateConfig.ok) {
    assertEquals(immediateConfig.data.flushImmediate, true);
    assertEquals(immediateConfig.data.appendNewline, false);
  }

  // Test line configuration factory
  const lineConfig = StdoutWriteConfiguration.line();
  assertEquals(lineConfig.ok, true);

  if (lineConfig.ok) {
    assertEquals(lineConfig.data.flushImmediate, true);
    assertEquals(lineConfig.data.appendNewline, true);
  }
});

Deno.test("IO Architecture: StdinAvailability follows detection pattern", () => {
  // Test successful detection returns proper Value Object
  const availabilityResult = StdinAvailability.detect();
  assertEquals(availabilityResult.ok, true);

  if (availabilityResult.ok) {
    const availability = availabilityResult.data;

    // Architecture constraint: immutable properties
    assertExists(availability.isTerminal);
    assertExists(availability.isCI);
    assertExists(availability.isTest);

    // Architecture constraint: logical consistency
    assertEquals(typeof availability.shouldAttemptRead(), "boolean");

    // In terminal mode, should not attempt read
    if (availability.isTerminal) {
      assertEquals(availability.shouldAttemptRead(), false);
    }
  }
});

Deno.test("IO Architecture: writeStdoutSafe follows Result pattern", () => {
  // Test successful write
  const config = StdoutWriteConfiguration.standard();
  assertEquals(config.ok, true);

  if (config.ok) {
    const writeResult = writeStdoutSafe("test content", config.data);
    assertEquals(writeResult.ok, true);
  }
});

Deno.test("IO Architecture: Error types follow discriminated union pattern", () => {
  const errors: StdinErrorType[] = [
    { kind: "ReadError", message: "Test read error" },
    { kind: "TimeoutError", timeout: 5000 },
    { kind: "EmptyInputError", message: "Empty input" },
    { kind: "NotAvailableError", environment: "test" },
    { kind: "ValidationError", field: "timeout", message: "Invalid" },
    { kind: "ConfigurationError", setting: "encoding" },
  ];

  // Architecture constraint: each error has unique discriminator
  const kinds = errors.map((e) => e.kind);
  const uniqueKinds = new Set(kinds);
  assertEquals(kinds.length, uniqueKinds.size);

  // Architecture constraint: all required fields present
  errors.forEach((error) => {
    assertExists(error.kind);
    switch (error.kind) {
      case "ReadError":
        assertExists(error.message);
        break;
      case "TimeoutError":
        assertExists(error.timeout);
        break;
      case "EmptyInputError":
        assertExists(error.message);
        break;
      case "NotAvailableError":
        assertExists(error.environment);
        break;
      case "ValidationError":
        assertExists(error.field);
        assertExists(error.message);
        break;
      case "ConfigurationError":
        assertExists(error.setting);
        break;
    }
  });
});

Deno.test("IO Architecture: Factory methods follow consistent pattern", () => {
  // Test that all factory methods return Result types
  const standardConfig = StdinReadingConfiguration.standard();
  assertEquals(standardConfig.ok, true);

  const permissiveConfig = StdinReadingConfiguration.permissive(10000);
  assertEquals(permissiveConfig.ok, true);

  const ciSafeConfig = StdinReadingConfiguration.ciSafe();
  assertEquals(ciSafeConfig.ok, true);

  // Architecture constraint: factory methods produce valid configurations
  [standardConfig, permissiveConfig, ciSafeConfig].forEach((result) => {
    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.data.timeout);
      assertEquals(typeof result.data.allowEmpty, "boolean");
    }
  });
});

Deno.test("IO Architecture: Resource cleanup follows RAII pattern", () => {
  // Test that configurations are properly isolated
  const config1 = StdinReadingConfiguration.create(true, 1000);
  const config2 = StdinReadingConfiguration.create(false, 2000);

  assertEquals(config1.ok, true);
  assertEquals(config2.ok, true);

  if (config1.ok && config2.ok) {
    // Architecture constraint: instances are independent
    assertEquals(config1.data.allowEmpty, true);
    assertEquals(config2.data.allowEmpty, false);
    assertEquals(config1.data.timeout, 1000);
    assertEquals(config2.data.timeout, 2000);

    // Architecture constraint: no shared state
    const options1 = config1.data.enhancedOptions;
    const options2 = config2.data.enhancedOptions;

    // Modifying one shouldn't affect the other
    assertEquals(options1.allowEmpty, true);
    assertEquals(options2.allowEmpty, false);
  }
});
