/**
 * Workspace initialization functionality
 *
 * This module handles the initialization of the breakdown workspace,
 * creating directory structures and configuration files.
 *
 * @module lib/cli/initialization/workspace_initializer
 */

import { ensureDir } from "@std/fs";
import { DefaultTypePatternProvider } from "../../types/defaults/default_type_pattern_provider.ts";

/**
 * Initialize breakdown configuration and directory structure
 */
export async function initializeBreakdownConfiguration(): Promise<void> {
  console.log("🚀 Initializing breakdown configuration...");

  // Use BreakdownConfig to get the configuration directory
  const _cwd = Deno.cwd?.() || ".";
  const baseDir = `${_cwd}/.agent/breakdown`;

  // Create directory structure
  // Get default configuration from DefaultTypePatternProvider
  const patternProvider = new DefaultTypePatternProvider();

  // Get layer types from pattern provider (unified configuration source)
  const layerTypes = patternProvider.getLayerTypes();
  if (!layerTypes || layerTypes.length === 0) {
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

  // Get directive types from pattern provider (unified configuration source)
  const directiveTypes = patternProvider.getDirectiveTypes();
  if (!directiveTypes || directiveTypes.length === 0) {
    throw new Error("Configuration must define directive types");
  }

  // Build configuration content dynamically
  const configContent = `# Breakdown Configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(${directiveTypes.join("|")})$"
    layerType:
      pattern: "^(${layerTypes.join("|")})$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
`;

  // Use BreakdownConfig for configuration management
  const configPath = `${baseDir}/config/default-app.yml`;

  // Write configuration file
  await Deno.writeTextFile(configPath, configContent);
  console.log(`✅ Created config file: ${configPath}`);

  console.log("🎉 Breakdown initialization completed successfully!");
}
