/**
 * @fileoverview Unit tests for StdinIntegrationWrapper
 * Tests the Totality-compliant stdin processing with Result type safety
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  getEnvironmentInfo,
  handleStdinForCLI,
  isStdinAvailable,
  readStdin,
  readStdinSafe,
  shouldSkipStdin,
  StdinIntegrationWrapper,
  type StdinMigrationConfig,
} from "./stdin_integration_wrapper.ts";

Deno.test("StdinIntegrationWrapper - Basic instantiation", () => {
  const _wrapper = new StdinIntegrationWrapper();
  assertExists(_wrapper);
});

Deno.test("StdinIntegrationWrapper - Custom config instantiation", () => {
  const config: StdinMigrationConfig = {
    useEnhanced: true,
    debug: false,
    forceFallback: false,
  };

  const wrapper = new StdinIntegrationWrapper(config);
  assertExists(wrapper);
});

Deno.test("StdinIntegrationWrapper - isStdinAvailable returns Result", () => {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.isStdinAvailable();

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertEquals(typeof result.data, "boolean");
  } else {
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - isStdinAvailable with terminal option", () => {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.isStdinAvailable({ isTerminal: true });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertEquals(typeof result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - readStdin returns Result", async () => {
  const wrapper = new StdinIntegrationWrapper();

  // Test with allowEmpty to avoid hanging on empty stdin
  const result = await wrapper.readStdin({
    allowEmpty: true,
    timeout: 100, // Short timeout for test
  });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertEquals(typeof result.data, "string");
  } else {
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - readStdinSafe returns comprehensive Result", async () => {
  const wrapper = new StdinIntegrationWrapper();

  const result = await wrapper.readStdinSafe({
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.content, "string");
    assertEquals(typeof result.data.skipped, "boolean");
    if (result.data.reason) {
      assertEquals(typeof result.data.reason, "string");
    }
    if (result.data.environmentInfo) {
      assertExists(result.data.environmentInfo);
    }
  }
});

Deno.test("StdinIntegrationWrapper - getEnvironmentInfo returns Result", () => {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.getEnvironmentInfo();

  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.isTerminal, "boolean");
    assertEquals(typeof result.data.isCI, "boolean");
    assertEquals(typeof result.data.isTest, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - shouldSkipStdin returns Result", () => {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.shouldSkipStdin();

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertEquals(typeof result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - shouldSkipStdin with forceRead", () => {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.shouldSkipStdin({ forceRead: true });

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(typeof result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - forceFallback configuration", () => {
  const config: StdinMigrationConfig = {
    forceFallback: true,
    useEnhanced: false,
  };

  const wrapper = new StdinIntegrationWrapper(config);
  const result = wrapper.isStdinAvailable();

  assertEquals(typeof result.ok, "boolean");
});

Deno.test("StdinIntegrationWrapper - environment overrides", () => {
  const config: StdinMigrationConfig = {
    useEnhanced: true,
    environmentOverrides: {
      ci: true,
      test: true,
      terminal: false,
    },
  };

  const wrapper = new StdinIntegrationWrapper(config);
  const envResult = wrapper.getEnvironmentInfo();

  assertEquals(envResult.ok, true);
  if (envResult.ok) {
    assertExists(envResult.data);
    assertEquals(typeof envResult.data.isTerminal, "boolean");
    assertEquals(typeof envResult.data.isCI, "boolean");
    assertEquals(typeof envResult.data.isTest, "boolean");
  }
});

// Test deprecated backward compatibility functions
Deno.test("Backward compatibility - isStdinAvailable function", () => {
  const result = isStdinAvailable();
  assertEquals(typeof result, "boolean");
});

Deno.test("Backward compatibility - readStdin function", async () => {
  try {
    const result = await readStdin({ allowEmpty: true, timeout: 100 });
    assertEquals(typeof result, "string");
  } catch (error) {
    // Expected for some environments
    assertExists(error);
  }
});

Deno.test("Backward compatibility - readStdinSafe function", async () => {
  const result = await readStdinSafe({ allowEmpty: true, timeout: 100 });

  assertExists(result);
  assertEquals(typeof result.success, "boolean");
  assertEquals(typeof result.content, "string");
  assertEquals(typeof result.skipped, "boolean");
});

Deno.test("Backward compatibility - getEnvironmentInfo function", () => {
  const result = getEnvironmentInfo();

  assertExists(result);
  assertEquals(typeof result.isTerminal, "boolean");
  assertEquals(typeof result.isCI, "boolean");
  assertEquals(typeof result.isTest, "boolean");
});

Deno.test("Backward compatibility - shouldSkipStdin function", () => {
  const result = shouldSkipStdin();
  assertEquals(typeof result, "boolean");
});

// Test CLI integration helper
Deno.test("handleStdinForCLI - explicit stdin with dash", async () => {
  const result = await handleStdinForCLI({
    from: "-",
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.inputText, "string");
    assertEquals(typeof result.data.skipped, "boolean");
    assertEquals(Array.isArray(result.data.warnings), true);
  }
});

Deno.test("handleStdinForCLI - fromFile with dash", async () => {
  const result = await handleStdinForCLI({
    fromFile: "-",
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.inputText, "string");
    assertEquals(typeof result.data.skipped, "boolean");
  }
});

Deno.test("handleStdinForCLI - auto-detection", async () => {
  const result = await handleStdinForCLI({
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof result.ok, "boolean");
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.inputText, "string");
    assertEquals(typeof result.data.skipped, "boolean");
    assertEquals(Array.isArray(result.data.warnings), true);
  }
});

Deno.test("handleStdinForCLI - with debug option", async () => {
  const result = await handleStdinForCLI({
    debug: true,
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof result.ok, "boolean");
});

// Error handling tests
Deno.test("StdinIntegrationWrapper - error handling in readStdinSafe", async () => {
  const wrapper = new StdinIntegrationWrapper();

  // Test with very short timeout to potentially trigger timeout error
  const result = await wrapper.readStdinSafe({
    allowEmpty: false,
    timeout: 1, // Very short timeout
    forceRead: false,
  });

  // Should either succeed or handle error gracefully
  assertEquals(typeof result.ok, "boolean");
  if (!result.ok) {
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - migration config defaults", () => {
  const wrapper = new StdinIntegrationWrapper();

  // Test that default configuration works
  const availabilityResult = wrapper.isStdinAvailable();
  assertEquals(typeof availabilityResult.ok, "boolean");

  const envResult = wrapper.getEnvironmentInfo();
  assertEquals(envResult.ok, true);
});

Deno.test("StdinIntegrationWrapper - comprehensive option handling", async () => {
  const wrapper = new StdinIntegrationWrapper({
    useEnhanced: true,
    debug: false,
    forceFallback: false,
    environmentOverrides: {
      ci: false,
      test: true,
      terminal: false,
    },
  });

  const result = await wrapper.readStdinSafe({
    allowEmpty: true,
    timeout: 100,
    forceRead: false,
  });

  assertEquals(typeof result.ok, "boolean");
});
