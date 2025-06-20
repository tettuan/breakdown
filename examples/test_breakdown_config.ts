#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * Test script to investigate BreakdownConfig behavior
 * This script loads configuration using BreakdownConfig and outputs the merged result
 */

import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.2";

async function testBreakdownConfig() {
  console.log("=== Testing BreakdownConfig Behavior ===");
  console.log("Working directory:", Deno.cwd());
  
  try {
    // Test with no prefix (should merge app.yml and user.yml)
    console.log("\n--- Testing with no prefix ---");
    // Use the current directory where .agent/breakdown/config/app.yml exists
    const config1 = new BreakdownConfig(undefined, Deno.cwd());
    await config1.loadConfig();
    const merged1 = await config1.getConfig();
    
    console.log("Merged config keys:", Object.keys(merged1));
    console.log("Has 'params' key:", 'params' in merged1);
    console.log("Has 'breakdownParams' key:", 'breakdownParams' in merged1);
    
    if ('params' in merged1) {
      console.log("params content:", JSON.stringify(merged1.params, null, 2));
    }
    
    if ('breakdownParams' in merged1) {
      console.log("breakdownParams content:", JSON.stringify(merged1.breakdownParams, null, 2));
    }
    
    console.log("Full merged config:", JSON.stringify(merged1, null, 2));
    
  } catch (error) {
    console.error("Error loading config:", error);
  }
  
  try {
    // Test with production prefix
    console.log("\n--- Testing with production prefix ---");
    const config2 = new BreakdownConfig("production", Deno.cwd());
    await config2.loadConfig();
    const merged2 = await config2.getConfig();
    
    console.log("Production config keys:", Object.keys(merged2));
    console.log("Has 'params' key:", 'params' in merged2);
    console.log("Has 'breakdownParams' key:", 'breakdownParams' in merged2);
    
    if ('params' in merged2) {
      console.log("params content:", JSON.stringify(merged2.params, null, 2));
    }
    
  } catch (error) {
    console.error("Error loading production config:", error);
  }
}

if (import.meta.main) {
  await testBreakdownConfig();
}