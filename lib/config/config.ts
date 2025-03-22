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

import { exists, join } from "../../deps.ts";
import { BreakdownConfig as IBreakdownConfig, ConfigOptions, WorkspaceStructure } from "./types.ts";
import { ConfigLoadError } from "./errors.ts";

export class BreakdownConfig {
  protected static instance: BreakdownConfig;
  private config: IBreakdownConfig;
  protected static readonly DEFAULT_CONFIG_PATH = "breakdown/config.json";
  protected static readonly DEFAULT_WORKING_DIR = "./.agent/breakdown";
  protected static readonly DEFAULT_PROMPT_BASE_DIR = "./breakdown/prompts/";

  protected constructor() {
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
      },
      working_dir: BreakdownConfig.DEFAULT_WORKING_DIR,
      app_prompt: {
        base_dir: BreakdownConfig.DEFAULT_PROMPT_BASE_DIR
      }
    };
  }

  public static getInstance(): BreakdownConfig {
    if (!BreakdownConfig.instance) {
      BreakdownConfig.instance = new BreakdownConfig();
    }
    return BreakdownConfig.instance;
  }

  public async loadConfig(options: ConfigOptions = {}): Promise<void> {
    try {
      const configPath = options.configPath || 
                        Deno.env.get("BREAKDOWN_CONFIG") || 
                        BreakdownConfig.DEFAULT_CONFIG_PATH;
      
      let configData: Partial<IBreakdownConfig> = {};
      
      if (options.configPath) {
        // 明示的に設定ファイルが指定された場合は、存在しない場合はエラー
        configData = await this.loadConfigFile(configPath, true);
      } else {
        try {
          configData = await this.loadConfigFile(configPath, false);
        } catch (error) {
          if (!(error instanceof ConfigLoadError)) {
            throw error;
          }
          // デフォルトの設定ファイルが存在しない場合は警告を表示
          console.warn(`Config file not found at ${configPath}, using defaults`);
        }
      }
      
      const workingDir = options.workingDir || 
                        configData.working_dir || 
                        BreakdownConfig.DEFAULT_WORKING_DIR;
      const promptBaseDir = configData.app_prompt?.base_dir || 
                          BreakdownConfig.DEFAULT_PROMPT_BASE_DIR;

      this.config = {
        ...this.config,
        working_dir: workingDir,
        app_prompt: {
          base_dir: promptBaseDir
        }
      };
    } catch (error) {
      if (error instanceof ConfigLoadError) {
        throw error;
      }
      console.error("Error loading config:", error);
      // デフォルト設定を維持
      console.warn("Using default configuration");
    }
  }

  private async loadConfigFile(path: string, required = false): Promise<Partial<IBreakdownConfig>> {
    try {
      if (await exists(path)) {
        const content = await Deno.readTextFile(path);
        try {
          return JSON.parse(content);
        } catch (error) {
          throw new ConfigLoadError(`Failed to parse config from ${path}`, error);
        }
      }
      if (required) {
        throw new ConfigLoadError(`Config file not found: ${path}`);
      }
      throw new ConfigLoadError(`Failed to load config from ${path}`);
    } catch (error) {
      if (error instanceof ConfigLoadError) {
        throw error;
      }
      throw new ConfigLoadError(`Failed to read config from ${path}`, error);
    }
  }

  public getConfig(): IBreakdownConfig {
    return { ...this.config };
  }

  public getWorkingDir(): string {
    return this.config.working_dir || BreakdownConfig.DEFAULT_WORKING_DIR;
  }

  public getPromptBaseDir(): string {
    return this.config.app_prompt?.base_dir || BreakdownConfig.DEFAULT_PROMPT_BASE_DIR;
  }
}

// 後方互換性のための既存のConfig APIを維持
export class Config extends BreakdownConfig {
  static override getInstance(): Config {
    if (!BreakdownConfig.instance) {
      BreakdownConfig.instance = new Config();
    }
    return BreakdownConfig.instance as Config;
  }
} 