/**
 * Workspace initialization functionality
 *
 * This module handles the initialization of the breakdown workspace,
 * creating directory structures and configuration files.
 *
 * **用途**: このモジュールは `breakdown init` コマンドでのみ使用されます。
 * ドメイン境界を超えた設定の橋渡しは行いません。
 * 単に初期化時のディレクトリ構造と設定ファイルの作成のみを担当します。
 *
 * @module lib/cli/initialization/workspace_initializer
 */

import { ensureDir } from "@std/fs";
import { JSRPatternAdapter } from "../../config/jsr_pattern_adapter.ts";
import { DEFAULT_WORKSPACE_ROOT } from "../../config/constants.ts";

/**
 * Initialize breakdown configuration and directory structure
 *
 * `breakdown init` コマンドで呼び出される唯一の関数です。
 * プロジェクトの初期セットアップ時に1回だけ実行されます。
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
base_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
params:
  two:
    directiveType:
      pattern: "^(${directiveTypes.join("|")})$"
    layerType:
      pattern: "^(${layerTypes.join("|")})$"
`;

  // Use BreakdownConfig for configuration management
  const configPath = `${baseDir}/config/default-app.yml`;

  // Write configuration file
  await Deno.writeTextFile(configPath, configContent);
  console.log(`✅ Created config file: ${configPath}`);

  console.log("🎉 Breakdown initialization completed successfully!");
}
