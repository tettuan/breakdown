/**
 * Configuration management for Breakdown
 * 
 * File Structure:
 * breakdown/config/
 * ├── config.ts    - Main configuration implementation
 * ├── types.ts     - Type definitions
 * └── (future)     - Potential extensions:
 *     ├── validators.ts      - Configuration validation
 *     ├── migrations/       - Config format migrations
 *     └── environments/     - Environment-specific configs
 * 
 * Design Decisions:
 * 1. Configuration Priority
 *    - Default configuration (breakdown/config.json)
 *    - User-specified config file
 *    - CLI options (highest priority)
 * 
 * 2. Workspace Structure Management
 *    - Centralized directory structure definition
 *    - Default structure in Config class
 *    - Customizable through config files
 *    - Type-safe directory access
 * 
 * 3. Separation of Concerns
 *    - Config: Configuration and structure definitions
 *    - Workspace: Directory management and initialization
 *    - CLI: Command processing and user interaction
 * 
 * 4. Extensibility
 *    - Ready for future features like validation, migrations
 *    - Easy to add environment-specific configurations
 *    - Flexible workspace structure customization
 * 
 * Configuration Flow:
 * 1. Load default config from breakdown/config.json
 * 2. Override with user-specified config file if provided
 * 3. Apply CLI options as highest priority
 * 4. Initialize workspace structure based on final config
 */

import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { BreakdownConfig, ConfigOptions, WorkspaceStructure } from "./types.ts";
import { ConfigLoadError } from "./errors.ts";

export interface AppConfig {
  working_dir: string;
  output_format: string;
}

let config: AppConfig = {
  working_dir: "./agent/breakdown",
  output_format: "="
};

export function getConfig(): AppConfig {
  return config;
}

export function setConfig(newConfig: Partial<AppConfig>): void {
  config = { ...config, ...newConfig };
}

export class Config {
  private static instance: Config;
  private config: BreakdownConfig;
  private static readonly DEFAULT_CONFIG_PATH = "breakdown/config.json";

  private constructor() {
    this.config = {
      root: ".agent",
      working_directory: "",
      output_directory: "",
      workspace_structure: {
        root: "breakdown",
        directories: {
          issues: "issues",
          tasks: "tasks",
          projects: "projects"
        }
      }
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public async initialize(options: ConfigOptions = {}): Promise<void> {
    const workingDir = options.workingDir || Deno.cwd();
    const outputDir = options.outputDir || join(workingDir, this.config.root, "breakdown");

    this.config = {
      root: this.config.root,
      working_directory: workingDir,
      output_directory: outputDir,
      workspace_structure: this.config.workspace_structure
    };

    try {
      // 1. デフォルト設定ファイルの読み込み
      const defaultConfig = await this.loadConfigFile(Config.DEFAULT_CONFIG_PATH);
      this.config = { ...this.config, ...defaultConfig };
    } catch (error) {
      if (error instanceof Error) {
        console.debug(`Using fallback configuration: ${error.message}`);
      } else {
        console.debug("Using fallback configuration: Unknown error");
      }
    }

    // 2. 指定された設定ファイルの読み込み
    if (options?.configPath) {
      try {
        const customConfig = await this.loadConfigFile(options.configPath);
        // 既存の workspace_structure は保持
        const structure = this.config.workspace_structure;
        this.config = { 
          ...this.config, 
          ...customConfig,
          workspace_structure: structure 
        };
      } catch (error) {
        if (error instanceof ConfigLoadError) {
          console.debug(`Custom config not loaded: ${error.message}`);
        }
      }
    }

    // 3. CLIオプションでの上書き（最優先）
    if (options?.workingDir) {
      this.config.working_directory = options.workingDir;
    }
    if (options?.outputDir) {
      this.config.output_directory = options.outputDir;
    }
  }

  private async loadConfigFile(path: string): Promise<Partial<BreakdownConfig>> {
    try {
      if (await exists(path)) {
        const content = await Deno.readTextFile(path);
        return JSON.parse(content);
      }
      throw new ConfigLoadError(path);
    } catch (error) {
      if (error instanceof ConfigLoadError) {
        throw error;
      }
      throw new ConfigLoadError(path, error);
    }
  }

  public get workingDirectory(): string {
    return this.config.working_directory;
  }

  public get outputDirectory(): string {
    return this.config.output_directory;
  }

  public get workspaceStructure(): WorkspaceStructure {
    return this.config.workspace_structure;
  }
} 