/**
 * Workspace initialization functionality
 *
 * This module handles the initialization of the breakdown workspace,
 * creating directory structures and configuration files.
 *
 * @module lib/cli/initialization/workspace_initializer
 */

import { ensureDir } from "@std/fs";
import { BreakdownConfig } from "../../deps.ts";
import { DefaultTypePatternProvider } from "../../types/defaults/default_type_pattern_provider.ts";

/**
 * Initialize breakdown configuration and directory structure
 */
export async function initializeBreakdownConfiguration(): Promise<void> {
  console.log("🚀 Initializing breakdown configuration...");

  // TODO: If BreakdownConfig had write functionality, baseDir definition would be unnecessary
  // BreakdownConfig already knows the appropriate paths and should handle initialization
  const _cwd = Deno.cwd?.() || ".";
  const baseDir = `${_cwd}/.agent/breakdown`;

  // Create directory structure
  // Get default configuration from DefaultTypePatternProvider
  const patternProvider = new DefaultTypePatternProvider();
  const defaultConfig = patternProvider.getDefaultConfig();

  // Extract layer types from default configuration
  const layerTypes = defaultConfig.params?.two?.layerType?.pattern
    ?.match(/\^?\((.*?)\)\$?/)?.[1]
    ?.split("|") || ["project", "issue", "task"];

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

  // Create basic default-app.yml config file using dynamic values from BreakdownParams
  // Extract directive types from default configuration
  const directiveTypes = defaultConfig.params?.two?.directiveType?.pattern
    ?.match(/\^?\((.*?)\)\$?/)?.[1]
    ?.split("|") || ["to", "summary", "defect"];

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
