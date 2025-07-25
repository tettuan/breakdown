/**
 * Workspace initialization functionality
 *
 * This module handles the initialization of the breakdown workspace,
 * creating directory structures and configuration files.
 *
 * @module lib/cli/initialization/workspace_initializer
 */

import { ensureDir } from "@std/fs";
import { JSRPatternAdapter } from "../../config/jsr_pattern_adapter.ts";
import { DEFAULT_WORKSPACE_ROOT } from "../../config/constants.ts";

/**
 * Initialize breakdown configuration and directory structure
 */
export async function initializeBreakdownConfiguration(): Promise<void> {
  console.log("🚀 Initializing breakdown configuration...");

  const cwd = Deno.cwd?.() || ".";
  const baseDir = `${cwd}/${DEFAULT_WORKSPACE_ROOT}`;

  // Create directory structure
  // Initialize JSR pattern adapter for type extraction
  const adapterResult = JSRPatternAdapter.create();
  if (!adapterResult.ok) {
    const errorMessage = "message" in adapterResult.error
      ? adapterResult.error.message
      : adapterResult.error.kind;
    throw new Error(`Failed to initialize JSR pattern adapter: ${errorMessage}`);
  }

  const adapter = adapterResult.data;
  const layerTypes = adapter.getValidLayerTypes();
  if (layerTypes.length === 0) {
    throw new Error("Configuration must define layer types");
  }

  // Create directories dynamically based on layer types
  const directories = [
    "config",
    ...layerTypes.map((type) => `${type}s`), // pluralize layer types
    "temp",
    "prompts",
    "schema",
  ];

  for (const dir of directories) {
    const dirPath = `${baseDir}/${dir}`;
    await ensureDir(dirPath);
    console.log(`✅ Created directory: ${dirPath}`);
  }

  // Get directive types from JSR pattern adapter
  const directiveTypes = adapter.getValidDirectiveTypes();
  if (directiveTypes.length === 0) {
    throw new Error("Configuration must define directive types");
  }

  // Build configuration content dynamically
  const configContent = `# Breakdown Configuration
app_prompt:
  base_dir: "${cwd}/${DEFAULT_WORKSPACE_ROOT}/prompts"
app_schema:
  base_dir: "${cwd}/${DEFAULT_WORKSPACE_ROOT}/schema"
params:
  two:
    directiveType:
      pattern: "^(${directiveTypes.join("|")})$"
    layerType:
      pattern: "^(${layerTypes.join("|")})$"
workspace:
  working_dir: "${cwd}"
  temp_dir: "${cwd}/${DEFAULT_WORKSPACE_ROOT}/temp"
`;

  // Use BreakdownConfig for configuration management
  const configPath = `${baseDir}/config/default-app.yml`;

  // Write configuration file
  await Deno.writeTextFile(configPath, configContent);
  console.log(`✅ Created config file: ${configPath}`);

  console.log("🎉 Breakdown initialization completed successfully!");
}
