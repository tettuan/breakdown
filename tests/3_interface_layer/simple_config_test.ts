/**
 * @fileoverview Simple test for configuration loading
 */

import { assertEquals, assertExists, assert } from "../deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Simple test to check if basic imports work
Deno.test("Simple config test - imports", () => {
  const logger = new BreakdownLogger("simple-config-test");
  logger.debug("Simple test start", {});
  
  // Basic assertion
  assertEquals(1 + 1, 2);
  assert(true);
  assertExists("hello");
  
  logger.debug("Simple test passed", {});
});

// Test BreakdownConfig JSR import directly
Deno.test("Simple config test - BreakdownConfig import", async () => {
  const logger = new BreakdownLogger("simple-config-test");
  
  try {
    const { BreakdownConfig } = await import("@tettuan/breakdownconfig");
    logger.debug("BreakdownConfig imported", { BreakdownConfig: !!BreakdownConfig });
    assertExists(BreakdownConfig);
    
    // Test create method signature
    const createResult = await BreakdownConfig.create();
    logger.debug("BreakdownConfig create result", { 
      success: createResult.success
    });
    
    // This test checks if the import and basic structure works
    assert(typeof createResult === 'object');
    assert('success' in createResult);
    
  } catch (error) {
    logger.debug("BreakdownConfig import failed", { error: String(error) });
    throw error;
  }
});

// Test UnifiedConfigInterface import
Deno.test("Simple config test - UnifiedConfigInterface import", async () => {
  const logger = new BreakdownLogger("simple-config-test");
  
  try {
    const { UnifiedConfigInterface } = await import("../../lib/config/unified_config_interface.ts");
    logger.debug("UnifiedConfigInterface imported", { UnifiedConfigInterface: !!UnifiedConfigInterface });
    assertExists(UnifiedConfigInterface);
    
    // Test create method exists
    assert(typeof UnifiedConfigInterface.create === 'function');
    
  } catch (error) {
    logger.debug("UnifiedConfigInterface import failed", { error: String(error) });
    throw error;
  }
});