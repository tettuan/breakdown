#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * Test script to verify params access in BreakdownConfig
 */

import { loadBreakdownConfig } from "../lib/config/loader.ts";

async function testParamsAccess() {
  console.log("=== Testing Params Access in BreakdownConfig ===");
  console.log("Working directory:", Deno.cwd());
  
  try {
    // Load config using loadBreakdownConfig
    console.log("\n--- Loading config with loadBreakdownConfig ---");
    const config = await loadBreakdownConfig();
    
    console.log("\nConfig keys:", Object.keys(config));
    console.log("\nHas 'params' key:", 'params' in config);
    console.log("Has 'breakdownParams' key:", 'breakdownParams' in config);
    
    if (config.params) {
      console.log("\n✅ Found params configuration:");
      console.log("Type:", typeof config.params);
      console.log("Constructor:", config.params?.constructor?.name);
      console.log("Keys:", Object.keys(config.params));
      console.log("Value:", config.params);
      
      // Try to access the nested structure
      const paramsObj = config.params as any;
      if (paramsObj.two) {
        console.log("\nFound 'two' params:", paramsObj.two);
      }
    }
    
    if (config.breakdownParams) {
      console.log("\n✅ Found breakdownParams configuration:");
      console.log(JSON.stringify(config.breakdownParams, null, 2));
    }
    
    // Try to access specific param validation patterns
    const paramsConfig = config.params as any;
    if (paramsConfig?.two?.demonstrativeType?.pattern) {
      console.log("\n✅ Found demonstrativeType pattern:", paramsConfig.two.demonstrativeType.pattern);
    }
    if (paramsConfig?.two?.layerType?.pattern) {
      console.log("✅ Found layerType pattern:", paramsConfig.two.layerType.pattern);
    }
    
  } catch (error) {
    console.error("Error loading config:", error);
  }
}

if (import.meta.main) {
  await testParamsAccess();
}