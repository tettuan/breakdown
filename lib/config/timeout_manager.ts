/**
 * Unified Timeout Management Module
 *
 * A unified timeout management system that does not depend on environment variables.
 * Environment-specific timeout control through YAML-based hierarchical configuration.
 *
 * @module
 */

import {
  detectEnvironment,
  type EnvironmentDetectionConfig,
  type EnvironmentInfo,
} from "../io/enhanced_stdin.ts";

/**
 * CustomConfig type definition compatible with BreakdownConfig
 */
export interface BreakdownConfigCompatible {
  performance?: YamlPerformanceConfig;
  customConfig?: Record<string, unknown>;
  breakdownParams?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Basic timeout configuration interface
 */
export interface TimeoutConfig {
  /** Default timeout (milliseconds) */
  default: number;
  /** CI environment timeout (milliseconds) */
  ci: number;
  /** Test environment timeout (milliseconds) */
  test: number;
  /** Interactive environment timeout (milliseconds) */
  interactive: number;
}

/**
 * STDIN-specific timeout configuration interface
 */
export interface StdinTimeoutConfig {
  /** Timeout value (milliseconds) */
  timeout: number;
  /** Whether to allow empty input */
  allowEmpty: boolean;
  /** Force read mode */
  forceRead: boolean;
  /** Whether to enable debug output */
  debug: boolean;
}

/**
 * Type definition for the Performance section of YAML configuration
 */
export interface YamlPerformanceConfig {
  timeout?: number;
  timeouts?: {
    default?: number;
    ci?: number;
    test?: number;
    interactive?: number;
  };
  stdin?: {
    timeout?: number;
    allowEmpty?: boolean;
    forceRead?: boolean;
    debug?: boolean;
    environments?: {
      ci?: Partial<StdinTimeoutConfig>;
      test?: Partial<StdinTimeoutConfig>;
      interactive?: Partial<StdinTimeoutConfig>;
    };
  };
}

/**
 * Complete structure of environment-specific timeout configuration
 */
export interface EnvironmentTimeoutConfig {
  /** Basic timeout configuration */
  timeouts: TimeoutConfig;
  /** STDIN configuration (default) */
  stdin: StdinTimeoutConfig & {
    /** Environment-specific STDIN configuration */
    environments: {
      ci: StdinTimeoutConfig;
      test: StdinTimeoutConfig;
      interactive: StdinTimeoutConfig;
    };
  };
}

/**
 * Definition of environment types
 */
export type EnvironmentType = "ci" | "test" | "interactive";

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: EnvironmentTimeoutConfig = {
  timeouts: {
    default: 30000,
    ci: 5000,
    test: 1000,
    interactive: 30000,
  },
  stdin: {
    timeout: 30000,
    allowEmpty: false,
    forceRead: false,
    debug: false,
    environments: {
      ci: {
        timeout: 5000,
        allowEmpty: true,
        forceRead: false,
        debug: true,
      },
      test: {
        timeout: 1000,
        allowEmpty: true,
        forceRead: false,
        debug: false,
      },
      interactive: {
        timeout: 30000,
        allowEmpty: false,
        forceRead: false,
        debug: false,
      },
    },
  },
};

/**
 * Unified timeout management class
 *
 * Provides configuration-based timeout management that does not depend on environment variables.
 * Combines configuration loaded from YAML with environment detection to
 * automatically select appropriate timeout values.
 */
export class TimeoutManager {
  private config: EnvironmentTimeoutConfig;
  private _environmentType: EnvironmentType;
  private _environmentInfo: EnvironmentInfo;
  private _debugMode: boolean;

  /**
   * TimeoutManager constructor
   *
   * @param config Timeout configuration (uses default configuration if omitted)
   * @param environmentType Explicit environment type specification (auto-detected if omitted)
   * @param debugMode Enable/disable debug mode (obtained from configuration if omitted)
   */
  constructor(
    config?: Partial<EnvironmentTimeoutConfig>,
    environmentType?: EnvironmentType,
    debugMode?: boolean,
  ) {
    // Merge configuration (default configuration + provided configuration)
    this.config = this.mergeConfig(DEFAULT_TIMEOUT_CONFIG, config);

    // Get environment information
    this._environmentInfo = detectEnvironment();

    // Determine environment type (explicit specification > auto-detection)
    this._environmentType = environmentType || this.detectEnvironmentType();

    // Determine debug mode
    this._debugMode = debugMode ?? this.config.stdin.environments[this._environmentType].debug;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * Perform deep merge of configuration
   */
  private mergeConfig(
    defaultConfig: EnvironmentTimeoutConfig,
    userConfig?: Partial<EnvironmentTimeoutConfig>,
  ): EnvironmentTimeoutConfig {
    if (!userConfig) return defaultConfig;

    return {
      timeouts: {
        ...defaultConfig.timeouts,
        ...userConfig.timeouts,
      },
      stdin: {
        ...defaultConfig.stdin,
        ...userConfig.stdin,
        environments: {
          ci: {
            ...defaultConfig.stdin.environments.ci,
            ...userConfig.stdin?.environments?.ci,
          },
          test: {
            ...defaultConfig.stdin.environments.test,
            ...userConfig.stdin?.environments?.test,
          },
          interactive: {
            ...defaultConfig.stdin.environments.interactive,
            ...userConfig.stdin?.environments?.interactive,
          },
        },
      },
    };
  }

  /**
   * Auto-detect environment type
   * Utilizes the detectEnvironment() function from enhanced_stdin.ts
   */
  private detectEnvironmentType(): EnvironmentType {
    if (this._environmentInfo.isCI) {
      // Debug logging removed - use BreakdownLogger instead
      return "ci";
    }

    if (this._environmentInfo.isTest) {
      // Debug logging removed - use BreakdownLogger instead
      return "test";
    }

    // Debug logging removed - use BreakdownLogger instead
    return "interactive";
  }

  /**
   * Get value from BREAKDOWN_TIMEOUT environment variable
   *
   * @returns Timeout value obtained from environment variable, or undefined
   */
  private getEnvironmentTimeout(): number | undefined {
    const envTimeout = Deno.env.get("BREAKDOWN_TIMEOUT");
    if (envTimeout) {
      const parsed = parseInt(envTimeout, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return undefined;
  }

  /**
   * Get basic timeout value based on current environment
   *
   * @returns Timeout value appropriate for the environment (milliseconds)
   */
  getTimeout(): number {
    // BREAKDOWN_TIMEOUT takes highest priority
    const envTimeout = this.getEnvironmentTimeout();
    if (envTimeout !== undefined) {
      // Debug logging removed - use BreakdownLogger instead
      return envTimeout;
    }

    // Existing logic
    const timeout = this.config.timeouts[this._environmentType];

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * Get timeout value for STDIN
   *
   * @returns Timeout value for STDIN processing (milliseconds)
   */
  getStdinTimeout(): number {
    // BREAKDOWN_TIMEOUT takes highest priority
    const envTimeout = this.getEnvironmentTimeout();
    if (envTimeout !== undefined) {
      // Debug logging removed - use BreakdownLogger instead
      return envTimeout;
    }

    // Existing logic
    const timeout = this.config.stdin.environments[this._environmentType].timeout;

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * Get complete configuration for STDIN
   *
   * @returns Complete configuration for STDIN processing
   */
  getStdinConfig(): StdinTimeoutConfig {
    const config = this.config.stdin.environments[this._environmentType];

    // Debug logging removed - use BreakdownLogger instead

    return config;
  }

  /**
   * Apply custom timeout value
   *
   * Uses the custom value if provided,
   * otherwise returns the default value based on environment
   *
   * @param customTimeout Custom timeout value (optional)
   * @returns Applied timeout value (milliseconds)
   */
  applyCustomTimeout(customTimeout?: number): number {
    const timeout = customTimeout || this.getTimeout();

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * Get environment type
   *
   * @returns Current environment type
   */
  getEnvironmentType(): EnvironmentType {
    return this._environmentType;
  }

  /**
   * Get environment information
   *
   * @returns Detailed environment information
   */
  getEnvironmentInfo(): EnvironmentInfo {
    return this._environmentInfo;
  }

  /**
   * Validate configuration
   *
   * @returns Validation result
   */
  validateConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check timeout value range
    const timeouts = this.config.timeouts;
    Object.entries(timeouts).forEach(([env, timeout]) => {
      if (timeout < 0) {
        errors.push(`Invalid timeout for ${env}: ${timeout} (must be >= 0)`);
      }
      if (timeout > 300000) { // More than 5 minutes
        warnings.push(`Very long timeout for ${env}: ${timeout}ms (>5 minutes)`);
      }
    });

    // Check STDIN configuration
    Object.entries(this.config.stdin.environments).forEach(([env, config]) => {
      if (config.timeout < 0) {
        errors.push(`Invalid stdin timeout for ${env}: ${config.timeout} (must be >= 0)`);
      }
      if (env === "ci" && config.timeout > 10000) {
        warnings.push(`Long CI stdin timeout: ${config.timeout}ms (CI should be fast)`);
      }
    });

    const valid = errors.length === 0;

    // Debug logging removed - use BreakdownLogger instead

    return { valid, errors, warnings };
  }

  /**
   * Get debug information
   *
   * Returns detailed information including current configuration state and environment information
   *
   * @returns Detailed information for debugging
   */
  getDebugInfo(): {
    environmentType: EnvironmentType;
    environmentInfo: EnvironmentInfo;
    timeout: number;
    stdinTimeout: number;
    stdinConfig: StdinTimeoutConfig;
    config: EnvironmentTimeoutConfig;
    validation: { valid: boolean; errors: string[]; warnings: string[] };
  } {
    return {
      environmentType: this._environmentType,
      environmentInfo: this._environmentInfo,
      timeout: this.getTimeout(),
      stdinTimeout: this.getStdinTimeout(),
      stdinConfig: this.getStdinConfig(),
      config: this.config,
      validation: this.validateConfig(),
    };
  }

  /**
   * Update configuration
   *
   * Partially update configuration at runtime
   *
   * @param updates Partial configuration to update
   */
  updateConfig(updates: Partial<EnvironmentTimeoutConfig>): void {
    this.config = this.mergeConfig(this.config, updates);

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * Force change environment type
   *
   * Forcibly change the environment type during testing, etc.
   *
   * @param environmentType New environment type
   */
  setEnvironmentType(environmentType: EnvironmentType): void {
    const _previousType = this._environmentType;
    this._environmentType = environmentType;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * Toggle debug mode
   *
   * @param enabled Whether to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this._debugMode = enabled;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * Get environment detection configuration
   *
   * Provides configuration used by the detectEnvironment function in enhanced_stdin.ts.
   * This avoids direct dependency on environment variables.
   *
   * @returns Environment detection configuration
   */
  getEnvironmentDetectionConfig(): EnvironmentDetectionConfig {
    // Default uses Deno.env.get (for backward compatibility)
    // In the future, environment variable values can be injected from configuration
    return {
      getEnvVar: (name: string) => Deno.env.get(name),
    };
  }

  /**
   * Compatibility API: Static method for backward compatibility with lib/io/timeout_manager.ts
   *
   * @param customTimeout Custom timeout value (optional)
   * @returns Timeout value for STDIN processing (milliseconds)
   */
  static getStdinTimeout(customTimeout?: number): number {
    if (customTimeout !== undefined) {
      return customTimeout;
    }

    const manager = new TimeoutManager();
    return manager.getStdinTimeout();
  }

  /**
   * Compatibility API: Create timeout context
   *
   * @param customTimeout Custom timeout value (optional)
   * @returns Timeout context
   */
  static createContext(customTimeout?: number): {
    isCI: boolean;
    isTest: boolean;
    customTimeout?: number;
  } {
    const manager = new TimeoutManager();
    const envInfo = manager.getEnvironmentInfo();

    return {
      isCI: envInfo.isCI,
      isTest: envInfo.isTest,
      customTimeout,
    };
  }

  /**
   * Compatibility API: Get timeout value based on environment
   *
   * @param context Timeout context
   * @returns Appropriate timeout value (milliseconds)
   */
  static getTimeout(context: {
    isCI: boolean;
    isTest: boolean;
    customTimeout?: number;
  }): number {
    if (context.customTimeout !== undefined) {
      return context.customTimeout;
    }

    const envType: EnvironmentType = context.isTest ? "test" : context.isCI ? "ci" : "interactive";

    const manager = new TimeoutManager(undefined, envType);
    return manager.getTimeout();
  }
}

/**
 * Factory function: Create TimeoutManager with default configuration
 *
 * @returns TimeoutManager with default configuration
 */
export function createDefaultTimeoutManager(): TimeoutManager {
  return new TimeoutManager();
}

/**
 * Factory function: Create TimeoutManager from YAML configuration
 *
 * @param yamlConfig YAML configuration object
 * @returns Configured TimeoutManager
 */
export function createTimeoutManagerFromConfig(
  yamlConfig: BreakdownConfigCompatible,
): TimeoutManager {
  const performanceConfig: YamlPerformanceConfig = yamlConfig?.performance || {};

  const config: Partial<EnvironmentTimeoutConfig> = {
    timeouts: {
      default: performanceConfig.timeout || DEFAULT_TIMEOUT_CONFIG.timeouts.default,
      ci: performanceConfig.timeouts?.ci || DEFAULT_TIMEOUT_CONFIG.timeouts.ci,
      test: performanceConfig.timeouts?.test || DEFAULT_TIMEOUT_CONFIG.timeouts.test,
      interactive: performanceConfig.timeouts?.interactive ||
        DEFAULT_TIMEOUT_CONFIG.timeouts.interactive,
    },
  };

  // If STDIN configuration exists
  if (performanceConfig.stdin) {
    config.stdin = {
      timeout: performanceConfig.stdin.timeout || DEFAULT_TIMEOUT_CONFIG.stdin.timeout,
      allowEmpty: performanceConfig.stdin.allowEmpty ?? DEFAULT_TIMEOUT_CONFIG.stdin.allowEmpty,
      forceRead: performanceConfig.stdin.forceRead ?? DEFAULT_TIMEOUT_CONFIG.stdin.forceRead,
      debug: performanceConfig.stdin.debug ?? DEFAULT_TIMEOUT_CONFIG.stdin.debug,
      environments: {
        ci: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.ci,
          ...(performanceConfig.stdin.environments?.ci || {}),
        },
        test: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.test,
          ...(performanceConfig.stdin.environments?.test || {}),
        },
        interactive: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.interactive,
          ...(performanceConfig.stdin.environments?.interactive || {}),
        },
      },
    };
  }

  return new TimeoutManager(config);
}

/**
 * Factory function: Create TimeoutManager from BREAKDOWN_TIMEOUT environment variable
 *
 * @returns TimeoutManager reflecting environment variable configuration
 */
export function createTimeoutManagerFromEnvironment(): TimeoutManager {
  const envTimeout = Deno.env.get("BREAKDOWN_TIMEOUT");
  const config: Partial<EnvironmentTimeoutConfig> = {};

  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // Apply the same timeout to all environments
      config.timeouts = {
        default: parsed,
        ci: parsed,
        test: parsed,
        interactive: parsed,
      };

      // Also apply to STDIN configuration
      config.stdin = {
        timeout: parsed,
        allowEmpty: false,
        forceRead: false,
        debug: false,
        environments: {
          ci: {
            timeout: parsed,
            allowEmpty: true,
            forceRead: false,
            debug: false,
          },
          test: {
            timeout: parsed,
            allowEmpty: true,
            forceRead: false,
            debug: false,
          },
          interactive: {
            timeout: parsed,
            allowEmpty: false,
            forceRead: false,
            debug: false,
          },
        },
      };
    }
  }

  return new TimeoutManager(config);
}
