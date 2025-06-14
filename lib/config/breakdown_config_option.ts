/**
 * BreakdownConfigOption: CLI config option parser with CustomConfig support
 *
 * Purpose:
 *   - Parses --config and -c options from CLI arguments
 *   - Extracts config prefix value for BreakdownConfig
 *   - Provides clean interface for config option handling
 *   - Supports CustomConfig retrieval and management
 *
 * Responsibilities:
 *   - Parse CLI args for config options
 *   - Extract prefix value from --config=$prefix or -c=$prefix
 *   - Return undefined if option not present
 *   - Load and manage CustomConfig from BreakdownConfig
 *   - No validation of prefix value (BreakdownConfig's responsibility)
 */
/**
 * CustomConfig interface for type safety
 * Represents the structure of customConfig section in YAML files
 */
export interface CustomConfig {
  enabled?: boolean;
  find?: {
    twoParams?: string[];
  };
  findBugs?: {
    enabled?: boolean;
    sensitivity?: string;
    patterns?: string[];
    includeExtensions?: string[];
    excludeDirectories?: string[];
    maxResults?: number;
    detailedReports?: boolean;
  };
}

/**
 * Full configuration interface that includes CustomConfig
 * Represents the complete structure of configuration files
 */
export interface FullConfig {
  customConfig?: CustomConfig;
  breakdownParams?: {
    version?: string;
    customConfig?: {
      params?: {
        two?: Record<string, unknown>;
      };
      validation?: Record<string, unknown>;
      options?: Record<string, unknown>;
    };
    customParams?: Record<string, unknown>;
  };
  logger?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  output?: Record<string, unknown>;
  security?: Record<string, unknown>;
  features?: Record<string, unknown>;
}

export class BreakdownConfigOption {
  private configPrefix?: string;
  private breakdownConfig?: {
    loadConfig(): Promise<void>;
    getConfig(): Promise<Record<string, unknown>>;
  };
  private customConfig?: CustomConfig;

  /**
   * Creates a new BreakdownConfigOption instance
   * @param args CLI arguments to parse
   * @param workingDir Working directory for BreakdownConfig (optional)
   */
  constructor(args: string[], private workingDir?: string) {
    this.configPrefix = this.parseConfigOption(args);
  }

  /**
   * Parses config option from CLI arguments
   * Supports both --config=prefix and -c=prefix formats
   * @param args CLI arguments
   * @returns Config prefix or undefined
   */
  private parseConfigOption(args: string[]): string | undefined {
    for (const arg of args) {
      // Handle --config=prefix
      if (arg.startsWith("--config=")) {
        return arg.slice("--config=".length);
      }
      // Handle -c=prefix
      if (arg.startsWith("-c=")) {
        return arg.slice("-c=".length);
      }

      // Handle space-separated format (--config prefix or -c prefix)
      const index = args.indexOf(arg);
      if ((arg === "--config" || arg === "-c") && index + 1 < args.length) {
        const nextArg = args[index + 1];
        // Check if next arg is not another option
        if (!nextArg.startsWith("-")) {
          return nextArg;
        }
      }
    }
    return undefined;
  }

  /**
   * Gets the parsed config prefix
   * @returns Config prefix or undefined if not specified
   */
  getConfigPrefix(): string | undefined {
    return this.configPrefix;
  }

  /**
   * Checks if config option was provided
   * @returns true if config option exists
   */
  hasConfigOption(): boolean {
    return this.configPrefix !== undefined;
  }

  /**
   * Loads BreakdownConfig instance if not already loaded
   * @returns Promise that resolves when config is loaded
   */
  async loadBreakdownConfig(): Promise<void> {
    if (this.breakdownConfig) {
      return; // Already loaded
    }

    try {
      const { BreakdownConfig } = await import("@tettuan/breakdownconfig");
      const workingDir = this.workingDir || Deno.cwd();

      if (this.configPrefix) {
        this.breakdownConfig = new BreakdownConfig(workingDir, this.configPrefix);
      } else {
        this.breakdownConfig = new BreakdownConfig(workingDir);
      }

      await this.breakdownConfig.loadConfig();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load BreakdownConfig: ${message}`);
    }
  }

  /**
   * Gets the full configuration from BreakdownConfig
   * @returns Promise that resolves to the full configuration object
   */
  async getFullConfig(): Promise<FullConfig> {
    await this.loadBreakdownConfig();

    try {
      if (!this.breakdownConfig) {
        throw new Error("BreakdownConfig is not initialized");
      }
      // Access userConfig directly from configManager to get the properly parsed config
      const userConfig = (this.breakdownConfig as { configManager?: { userConfig?: unknown } })
        .configManager?.userConfig;
      if (!userConfig) {
        throw new Error("User config not found in BreakdownConfig");
      }
      return userConfig as FullConfig;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get config: ${message}`);
    }
  }

  /**
   * Gets the CustomConfig from BreakdownConfig
   * @returns Promise that resolves to CustomConfig or undefined
   */
  async getCustomConfig(): Promise<CustomConfig | undefined> {
    if (this.customConfig) {
      return this.customConfig;
    }

    try {
      const fullConfig = await this.getFullConfig();
      this.customConfig = fullConfig.customConfig;
      return this.customConfig;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get CustomConfig: ${message}`);
    }
  }

  /**
   * Sets CustomConfig (for testing or programmatic configuration)
   * @param customConfig CustomConfig object to set
   */
  setCustomConfig(customConfig: CustomConfig): void {
    this.customConfig = customConfig;
  }

  /**
   * Checks if CustomConfig is enabled
   * @returns Promise that resolves to true if CustomConfig is enabled
   */
  async isCustomConfigEnabled(): Promise<boolean> {
    const customConfig = await this.getCustomConfig();
    return customConfig?.enabled === true;
  }

  /**
   * Gets findBugs configuration from CustomConfig
   * @returns Promise that resolves to findBugs config or undefined
   */
  async getFindBugsConfig(): Promise<CustomConfig["findBugs"] | undefined> {
    const customConfig = await this.getCustomConfig();
    return customConfig?.findBugs;
  }

  /**
   * Gets find configuration from CustomConfig
   * @returns Promise that resolves to find config or undefined
   */
  async getFindConfig(): Promise<CustomConfig["find"] | undefined> {
    const customConfig = await this.getCustomConfig();
    return customConfig?.find;
  }

  /**
   * Checks if find-bugs functionality is enabled
   * @returns Promise that resolves to true if find-bugs is enabled
   */
  async isFindBugsEnabled(): Promise<boolean> {
    const findBugsConfig = await this.getFindBugsConfig();
    return findBugsConfig?.enabled === true;
  }

  /**
   * Gets supported two-parameter commands from find config
   * @returns Promise that resolves to array of supported two-parameter commands
   */
  async getSupportedTwoParams(): Promise<string[]> {
    const findConfig = await this.getFindConfig();
    return findConfig?.twoParams || [];
  }

  /**
   * Checks if a specific two-parameter command is supported
   * @param param The parameter to check (e.g., "bugs")
   * @returns Promise that resolves to true if the parameter is supported
   */
  async isTwoParamSupported(param: string): Promise<boolean> {
    const supportedParams = await this.getSupportedTwoParams();
    return supportedParams.includes(param);
  }
}
