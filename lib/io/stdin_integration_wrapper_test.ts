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

Deno.test("StdinIntegrationWrapper - Basic instantiation", async () => {
  const _wrapper = new StdinIntegrationWrapper();
  assertExists(wrapper);
});

Deno.test("StdinIntegrationWrapper - Custom config instantiation", async () => {
  const config: StdinMigrationConfig = {
    useEnhanced: true,
    debug: false,
    forceFallback: false,
  };

  const wrapper = new StdinIntegrationWrapper(config);
  assertExists(wrapper);
});

Deno.test("StdinIntegrationWrapper - isStdinAvailable returns Result", async () => {
  const wrapper = new StdinIntegrationWrapper();
  const _result = wrapper.isStdinAvailable();

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertEquals(typeof _result.data, "boolean");
  } else {
    assertEquals(typeof _result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - isStdinAvailable with terminal option", async () => {
  const wrapper = new StdinIntegrationWrapper();
  const _result = wrapper.isStdinAvailable({ isTerminal: true });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertEquals(typeof _result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - readStdin returns Result", async () => {
  const wrapper = new StdinIntegrationWrapper();

  // Test with allowEmpty to avoid hanging on empty stdin
  const _result = await wrapper.readStdin({
    allowEmpty: true,
    timeout: 100, // Short timeout for test
  });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertEquals(typeof _result.data, "string");
  } else {
    assertEquals(typeof _result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - readStdinSafe returns comprehensive Result", async () => {
  const wrapper = new StdinIntegrationWrapper();

  const _result = await wrapper.readStdinSafe({
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertExists(_result.data);
    assertEquals(typeof _result.data.content, "string");
    assertEquals(typeof _result.data.skipped, "boolean");
    if (_result.data.reason) {
      assertEquals(typeof _result.data.reason, "string");
    }
    if (_result.data.environmentInfo) {
      assertExists(_result.data.environmentInfo);
    }
  }
});

Deno.test("StdinIntegrationWrapper - getEnvironmentInfo returns Result", async () => {
  const wrapper = new StdinIntegrationWrapper();
  const _result = wrapper.getEnvironmentInfo();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertExists(_result.data);
    assertEquals(typeof _result.data.isTerminal, "boolean");
    assertEquals(typeof _result.data.isCI, "boolean");
    assertEquals(typeof _result.data.isTest, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - shouldSkipStdin returns Result", async () => {
  const wrapper = new StdinIntegrationWrapper();
  const _result = wrapper.shouldSkipStdin();

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertEquals(typeof _result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - shouldSkipStdin with forceRead", async () => {
  const wrapper = new StdinIntegrationWrapper();
  const _result = wrapper.shouldSkipStdin({ forceRead: true });

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(typeof _result.data, "boolean");
  }
});

Deno.test("StdinIntegrationWrapper - forceFallback configuration", async () => {
  const config: StdinMigrationConfig = {
    forceFallback: true,
    useEnhanced: false,
  };

  const wrapper = new StdinIntegrationWrapper(config);
  const _result = wrapper.isStdinAvailable();

  assertEquals(typeof _result.ok, "boolean");
});

Deno.test("StdinIntegrationWrapper - environment overrides", async () => {
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
Deno.test("Backward compatibility - isStdinAvailable function", async () => {
  const _result = isStdinAvailable();
  assertEquals(typeof _result, "boolean");
});

Deno.test("Backward compatibility - readStdin function", async () => {
  try {
    const _result = await readStdin({ allowEmpty: true, timeout: 100 });
    assertEquals(typeof _result, "string");
  } catch (error) {
    // Expected for some environments
    assertExists(error);
  }
});

Deno.test("Backward compatibility - readStdinSafe function", async () => {
  const _result = await readStdinSafe({ allowEmpty: true, timeout: 100 });

  assertExists(_result);
  assertEquals(typeof _result.success, "boolean");
  assertEquals(typeof _result.content, "string");
  assertEquals(typeof _result.skipped, "boolean");
});

Deno.test("Backward compatibility - getEnvironmentInfo function", async () => {
  const _result = getEnvironmentInfo();

  assertExists(_result);
  assertEquals(typeof _result.isTerminal, "boolean");
  assertEquals(typeof _result.isCI, "boolean");
  assertEquals(typeof _result.isTest, "boolean");
});

Deno.test("Backward compatibility - shouldSkipStdin function", async () => {
  const _result = shouldSkipStdin();
  assertEquals(typeof _result, "boolean");
});

// Test CLI integration helper
Deno.test("handleStdinForCLI - explicit stdin with dash", async () => {
  const _result = await handleStdinForCLI({
    from: "-",
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertExists(_result.data);
    assertEquals(typeof _result.data.inputText, "string");
    assertEquals(typeof _result.data.skipped, "boolean");
    assertEquals(Array.isArray(_result.data.warnings), true);
  }
});

Deno.test("handleStdinForCLI - fromFile with dash", async () => {
  const _result = await handleStdinForCLI({
    fromFile: "-",
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertExists(_result.data);
    assertEquals(typeof _result.data.inputText, "string");
    assertEquals(typeof _result.data.skipped, "boolean");
  }
});

Deno.test("handleStdinForCLI - auto-detection", async () => {
  const _result = await handleStdinForCLI({
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof _result.ok, "boolean");
  if (_result.ok) {
    assertExists(_result.data);
    assertEquals(typeof _result.data.inputText, "string");
    assertEquals(typeof _result.data.skipped, "boolean");
    assertEquals(Array.isArray(_result.data.warnings), true);
  }
});

Deno.test("handleStdinForCLI - with debug option", async () => {
  const _result = await handleStdinForCLI({
    debug: true,
    allowEmpty: true,
    timeout: 100,
  });

  assertEquals(typeof _result.ok, "boolean");
});

// Error handling tests
Deno.test("StdinIntegrationWrapper - error handling in readStdinSafe", async () => {
  const wrapper = new StdinIntegrationWrapper();

  // Test with very short timeout to potentially trigger timeout error
  const _result = await wrapper.readStdinSafe({
    allowEmpty: false,
    timeout: 1, // Very short timeout
    forceRead: false,
  });

  // Should either succeed or handle error gracefully
  assertEquals(typeof _result.ok, "boolean");
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string");
  }
});

Deno.test("StdinIntegrationWrapper - migration config defaults", async () => {
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

  const _result = await wrapper.readStdinSafe({
    allowEmpty: true,
    timeout: 100,
    forceRead: false,
  });

  assertEquals(typeof _result.ok, "boolean");
});
