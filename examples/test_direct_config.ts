#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * Test script to verify params access using BreakdownConfig directly
 */

import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.2";

async function testDirectConfig() {
  console.log("=== Testing Direct BreakdownConfig ===");
  console.log("Working directory:", Deno.cwd());
  
  try {
    // Create BreakdownConfig instance
    const config = new BreakdownConfig();
    await config.loadConfig();
    const mergedConfig = await config.getConfig();
    
    console.log("\nConfig keys:", Object.keys(mergedConfig));
    console.log("\nFull config:");
    console.dir(mergedConfig, { depth: 4 });
    
    // Check specific fields
    if ('params' in mergedConfig) {
      console.log("\n✅ Found params in config");
      const params = mergedConfig.params;
      console.log("Params type:", typeof params);
      console.log("Params value:", params);
    }
    
    // Try to access the raw configs
    console.log("\n--- Checking raw config methods ---");
    // Check if there are any other methods on the config object
    const configMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(config));
    console.log("Available methods:", configMethods.filter(m => m !== 'constructor'));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  await testDirectConfig();
}