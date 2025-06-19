#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * Test script to verify YAML loading directly
 */

import { loadConfig } from "../lib/config/loader.ts";

async function testYamlLoad() {
  console.log("=== Testing YAML Load Directly ===");
  
  try {
    // Load user.yml directly
    const userConfig = await loadConfig(".agent/breakdown/config/user.yml");
    console.log("\nUser config loaded:");
    console.log(JSON.stringify(userConfig, null, 2));
    
    // Load app.yml directly
    const appConfig = await loadConfig(".agent/breakdown/config/app.yml");
    console.log("\nApp config loaded:");
    console.log(JSON.stringify(appConfig, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  await testYamlLoad();
}