/**
 * Workspace initialization functionality
 *
 * This module handles the initialization of the breakdown workspace,
 * creating directory structures and configuration files.
 *
 * @module lib/cli/initialization/workspace_initializer
 */

import { ensureDir } from "@std/fs";

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
  // TODO: Layer-specific directories should be derived from BreakdownParams
  // e.g., const layerTypes = BreakdownParams.getDefaultLayerTypes();
  //       const directories = ["config", ...layerTypes.map(t => t + "s"), "temp", "prompts", "schema"];
  // This would dynamically create "projects", "issues", "tasks" based on defaults
  const directories = [
    "config",
    "projects",
    "issues",
    "tasks",
    "temp",
    "prompts",
    "schema",
  ];

  for (const dir of directories) {
    const dirPath = `${baseDir}/${dir}`;
    await ensureDir(dirPath);
    console.log(`✅ Created directory: ${dirPath}`);
  }

  // Create basic app.yml config file
  // TODO: Default patterns should be obtained from BreakdownParams
  // BreakdownParams should provide methods like:
  //   - getDefaultDemonstrativeTypes() => ["to", "summary", "defect"]
  //   - getDefaultLayerTypes() => ["project", "issue", "task"]
  // This ensures consistency across the ecosystem
  const configContent = `# Breakdown Configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    demonstrativeType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
`;

  // TODO: BreakdownConfig should provide a write method for config files
  // This direct file writing should be delegated to BreakdownConfig
  const configPath = `${baseDir}/config/app.yml`;
  await Deno.writeTextFile(configPath, configContent);
  console.log(`✅ Created config file: ${configPath}`);

  console.log("🎉 Breakdown initialization completed successfully!");
}
