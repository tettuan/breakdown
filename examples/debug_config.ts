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
// NOTE:
// This script relies on the import map defined in the root-level deno.json.
// To ensure imports like '@tettuan/breakdownconfig' resolve correctly, run this script from the project root:
//   deno run --allow-read examples/debug_config.ts
// Or, if running from within the examples/ directory, specify the import map explicitly:
//   deno run --import-map=../deno.json --allow-read debug_config.ts
// No need to duplicate the import map in examples/deno.json.
import { dirname, fromFileUrl, join } from "jsr:@std/path@0.218.2";
import { exists } from "jsr:@std/fs@0.218.2";

// Debug logging function
function debugLog(message: string, ...args: unknown[]) {
  console.error(`[DEBUG] ${message}`, ...args);
}

// Main debug function
async function debugConfig() {
  debugLog("Starting debug config");
  debugLog("Current working directory:", Deno.cwd());
  debugLog("Script directory:", dirname(fromFileUrl(import.meta.url)));

  const configDir = join(Deno.cwd(), ".agent", "breakdown", "config");
  debugLog("Config directory:", configDir);
  debugLog("Config directory exists:", await exists(configDir));

  const appYmlPath = join(configDir, "app.yml");
  debugLog("App YAML path:", appYmlPath);
  debugLog("App YAML exists:", await exists(appYmlPath));

  if (await exists(appYmlPath)) {
    const content = await Deno.readTextFile(appYmlPath);
    debugLog("App YAML content:", content);
  }

  const systemPromptDir = join(Deno.cwd(), ".agent", "breakdown", "prompts");
  debugLog("System prompt directory:", systemPromptDir);
  debugLog("System prompt directory exists:", await exists(systemPromptDir));

  if (await exists(systemPromptDir)) {
    debugLog("Listing system prompt directory contents:");
    for await (const entry of Deno.readDir(systemPromptDir)) {
      debugLog("-", entry.name, entry.isDirectory ? "(dir)" : "(file)");
    }
  }

  const userPromptDir = join(systemPromptDir, "user");
  debugLog("User prompt directory:", userPromptDir);
  debugLog("User prompt directory exists:", await exists(userPromptDir));

  if (await exists(userPromptDir)) {
    debugLog("Listing user prompt directory contents:");
    for await (const entry of Deno.readDir(userPromptDir)) {
      debugLog("-", entry.name, entry.isDirectory ? "(dir)" : "(file)");
    }
  }
}

// Run the debug function
if (import.meta.main) {
  await debugConfig();
}
