/**
 * debug_config.ts
 *
 * Purpose:
 *   - Demonstrate how to load and inspect BreakdownConfig settings using the @tettuan/breakdownconfig JSR package.
 *   - Useful for debugging configuration loading and verifying config file resolution in different working directories.
 *
 * Intent:
 *   - Show how to instantiate and use BreakdownConfig in a standalone script.
 *   - Output the current working directory and the loaded configuration for inspection.
 *
 * Usage:
 *   - Run this script with Deno:
 *       deno run --allow-read examples/debug_config.ts
 *   - Optionally add --allow-env if your config loading depends on environment variables.
 *   - Make sure @tettuan/breakdownconfig is installed as a JSR dependency in your project.
 *
 * Example output:
 *   Deno.cwd(): /path/to/your/project
 *   BreakdownConfig loaded settings: { ...config object... }
 */
// Import BreakdownConfig from JSR package (ensure it's installed via deno add jsr:@tettuan/breakdownconfig)
import { BreakdownConfig } from "@tettuan/breakdownconfig";

// Output the current working directory for context
debugger;
console.log("Deno.cwd():", Deno.cwd());

// Instantiate and load the configuration
const config = new BreakdownConfig();
await config.loadConfig();
const settings = await config.getConfig();

// Output the loaded configuration for inspection
console.log("BreakdownConfig loaded settings:", settings); 