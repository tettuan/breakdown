/**
 * Stdin Integration Wrapper with Totality Principle
 *
 * STDIN処理のTotality対応、例外を排除してResult型へ変換
 * 既存のstdin.tsと新しいenhanced_stdin.tsの統合ラッパー
 * 後方互換性を維持しながら改善された機能を提供
 *
 * @module
 */

import {
  isStdinAvailable as originalIsStdinAvailable,
  readStdin as originalReadStdin,
  StdinOptions,
} from "./stdin.ts";
import {
  detectEnvironment,
  type EnhancedStdinOptions,
  type EnvironmentInfo,
  isStdinAvailableEnhanced,
  readStdinEnhanced,
  safeReadStdin,
  shouldSkipStdinProcessing,
} from "./enhanced_stdin.ts";
import { error, ok, Result } from "../types/result.ts";

/**
 * Migration configuration for stdin behavior
 */
export interface StdinMigrationConfig {
  /** Use enhanced stdin implementation */
  useEnhanced?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Force fallback to original implementation */
  forceFallback?: boolean;
  /** Environment-specific overrides */
  environmentOverrides?: {
    ci?: boolean;
    test?: boolean;
    terminal?: boolean;
  };
}

/**
 * Get migration config with simplified defaults
 * Migration-specific environment variables removed
 */
function getMigrationConfig(): StdinMigrationConfig {
  return {
    useEnhanced: true, // Always use enhanced version
    debug: false, // Use LOG_LEVEL for debugging instead
    forceFallback: false, // Migration completed, no fallback needed
    environmentOverrides: {
      ci: false, // No environment overrides needed
      test: false,
      terminal: false,
    },
  };
}

/**
 * StdinIntegrationWrapper class for Totality-compliant STDIN processing
 */
export class StdinIntegrationWrapper {
  private config: StdinMigrationConfig;

  constructor(config?: StdinMigrationConfig) {
    this.config = config || getMigrationConfig();
  }

  /**
   * Check stdin availability with Result type (Totality principle)
   */
  isStdinAvailable(options?: {
    isTerminal?: boolean;
  }): Result<boolean, string> {
    try {
      if (this.config.forceFallback) {
        const result = originalIsStdinAvailable(options);
        return ok(result);
      }

      if (this.config.useEnhanced) {
        const envInfo = detectEnvironment();

        // Apply environment overrides
        if (this.config.environmentOverrides) {
          if (this.config.environmentOverrides.ci !== undefined) {
            envInfo.isCI = this.config.environmentOverrides.ci;
          }
          if (this.config.environmentOverrides.test !== undefined) {
            envInfo.isTest = this.config.environmentOverrides.test;
          }
          if (this.config.environmentOverrides.terminal !== undefined) {
            envInfo.isTerminal = this.config.environmentOverrides.terminal;
          }
        }

        const result = isStdinAvailableEnhanced({
          environmentInfo: envInfo,
          debug: this.config.debug,
        });
        return ok(result);
      }

      const result = originalIsStdinAvailable(options);
      return ok(result);
    } catch (err) {
      return error(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Read stdin with Result type (Totality principle)
   */
  async readStdin(options: StdinOptions & {
    forceRead?: boolean;
  } = {}): Promise<Result<string, string>> {
    try {
      if (this.config.forceFallback) {
        const content = await originalReadStdin(options);
        return ok(content);
      }

      if (this.config.useEnhanced) {
        const enhancedOptions: EnhancedStdinOptions = {
          allowEmpty: options.allowEmpty,
          timeout: options.timeout,
          forceRead: options.forceRead,
          debug: this.config.debug,
        };

        const content = await readStdinEnhanced(enhancedOptions);
        return ok(content);
      }

      const content = await originalReadStdin(options);
      return ok(content);
    } catch (err) {
      return error(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Safe stdin reader with comprehensive Result type
   */
  async readStdinSafe(options: StdinOptions & {
    forceRead?: boolean;
  } = {}): Promise<
    Result<{
      content: string;
      skipped: boolean;
      reason?: string;
      environmentInfo?: EnvironmentInfo;
    }, string>
  > {
    try {
      if (this.config.useEnhanced && !this.config.forceFallback) {
        const enhancedOptions: EnhancedStdinOptions = {
          allowEmpty: options.allowEmpty,
          timeout: options.timeout,
          forceRead: options.forceRead,
          debug: this.config.debug,
        };

        const result = await safeReadStdin(enhancedOptions);
        return ok({
          content: result.content,
          skipped: result.skipped,
          reason: result.reason,
          environmentInfo: result.envInfo,
        });
      }

      // Fallback implementation
      const skipCheck = shouldSkipStdinProcessing({
        forceRead: options.forceRead,
        debug: this.config.debug,
      });

      if (skipCheck.skip && !options.forceRead) {
        return ok({
          content: "",
          skipped: true,
          reason: skipCheck.reason,
          environmentInfo: skipCheck.envInfo,
        });
      }

      const content = await originalReadStdin(options);
      return ok({
        content,
        skipped: false,
        environmentInfo: skipCheck.envInfo,
      });
    } catch (err) {
      return error(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Get environment information with Result type
   */
  getEnvironmentInfo(): Result<EnvironmentInfo, string> {
    try {
      const envInfo = detectEnvironment();
      return ok(envInfo);
    } catch (err) {
      return error(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Check if stdin processing should be skipped with Result type
   */
  shouldSkipStdin(options?: {
    forceRead?: boolean;
    debug?: boolean;
  }): Result<boolean, string> {
    try {
      const result = shouldSkipStdinProcessing(options);
      return ok(result.skip);
    } catch (err) {
      return error(err instanceof Error ? err.message : String(err));
    }
  }
}

/**
 * Enhanced version of isStdinAvailable with backward compatibility
 * @deprecated Use StdinIntegrationWrapper class instead
 */
export function isStdinAvailable(options?: {
  isTerminal?: boolean;
  migrationConfig?: StdinMigrationConfig;
}): boolean {
  const wrapper = new StdinIntegrationWrapper(options?.migrationConfig);
  const result = wrapper.isStdinAvailable(options);
  return result.ok ? result.data : false;
}

/**
 * Enhanced version of readStdin with backward compatibility
 * @deprecated Use StdinIntegrationWrapper class instead
 */
export async function readStdin(options: StdinOptions & {
  migrationConfig?: StdinMigrationConfig;
  forceRead?: boolean;
} = {}): Promise<string> {
  const wrapper = new StdinIntegrationWrapper(options.migrationConfig);
  const result = await wrapper.readStdin(options);
  if (result.ok) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

/**
 * Safe stdin reader that handles all edge cases gracefully
 * @deprecated Use StdinIntegrationWrapper class instead
 */
export async function readStdinSafe(options: StdinOptions & {
  migrationConfig?: StdinMigrationConfig;
  forceRead?: boolean;
} = {}): Promise<{
  success: boolean;
  content: string;
  skipped: boolean;
  reason?: string;
  environmentInfo?: EnvironmentInfo;
}> {
  const wrapper = new StdinIntegrationWrapper(options.migrationConfig);
  const result = await wrapper.readStdinSafe(options);

  if (result.ok) {
    return {
      success: true,
      content: result.data.content,
      skipped: result.data.skipped,
      reason: result.data.reason,
      environmentInfo: result.data.environmentInfo,
    };
  } else {
    const envInfo = detectEnvironment();
    return {
      success: false,
      content: "",
      skipped: false,
      reason: result.error,
      environmentInfo: envInfo,
    };
  }
}

/**
 * Utility function to get current environment information
 * @deprecated Use StdinIntegrationWrapper class instead
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.getEnvironmentInfo();
  if (result.ok) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

/**
 * Utility function to check if stdin processing should be skipped
 * @deprecated Use StdinIntegrationWrapper class instead
 */
export function shouldSkipStdin(options?: {
  forceRead?: boolean;
  debug?: boolean;
}): boolean {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.shouldSkipStdin(options);
  return result.ok ? result.data : false;
}

/**
 * Read stdin content with Result type and async support
 */
export async function readStdinContent(
  options: StdinOptions = {},
): Promise<Result<string, string>> {
  const wrapper = new StdinIntegrationWrapper();
  return await wrapper.readStdin(options);
}

/**
 * Read stdin with timeout and Result type with async support
 */
export async function readStdinWithTimeout(
  timeout: number = 5000,
  options: StdinOptions = {},
): Promise<Result<string, string>> {
  const wrapper = new StdinIntegrationWrapper();
  return await wrapper.readStdin({ ...options, timeout });
}

/**
 * CLI integration helper for breakdown.ts with Totality principle
 */
export async function handleStdinForCLI(options: {
  from?: string;
  fromFile?: string;
  allowEmpty?: boolean;
  timeout?: number;
  debug?: boolean;
}): Promise<
  Result<{
    inputText: string;
    skipped: boolean;
    warnings: string[];
  }, string>
> {
  try {
    const warnings: string[] = [];
    const wrapper = new StdinIntegrationWrapper();

    // Check for explicit stdin flags
    const explicitStdin = options.from === "-" || options.fromFile === "-";

    if (explicitStdin) {
      const result = await wrapper.readStdin({
        allowEmpty: options.allowEmpty || false,
        timeout: options.timeout,
        forceRead: true, // Force read when explicitly requested
      });

      if (result.ok) {
        return ok({ inputText: result.data, skipped: false, warnings });
      } else {
        warnings.push(
          `Failed to read from explicitly requested stdin: ${result.error}`,
        );
        return ok({ inputText: "", skipped: false, warnings });
      }
    }

    // Check if stdin is available
    const availabilityResult = wrapper.isStdinAvailable();
    if (availabilityResult.ok && availabilityResult.data) {
      const safeResult = await wrapper.readStdinSafe({
        allowEmpty: options.allowEmpty !== false, // Default to allowing empty for auto-detected stdin
        timeout: options.timeout,
      });

      if (safeResult.ok) {
        return ok({
          inputText: safeResult.data.content,
          skipped: safeResult.data.skipped,
          warnings,
        });
      } else {
        warnings.push(`Stdin read failed: ${safeResult.error}`);
        return ok({ inputText: "", skipped: true, warnings });
      }
    }

    return ok({ inputText: "", skipped: true, warnings });
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

/**
 * CLI integration helper for breakdown.ts (backward compatibility)
 * @deprecated Use handleStdinForCLI with Result type instead
 */
export async function handleStdinForCLILegacy(options: {
  from?: string;
  fromFile?: string;
  allowEmpty?: boolean;
  timeout?: number;
  debug?: boolean;
}): Promise<{
  inputText: string;
  skipped: boolean;
  warnings: string[];
}> {
  const result = await handleStdinForCLI(options);
  if (result.ok) {
    return result.data;
  } else {
    return { inputText: "", skipped: true, warnings: [result.error] };
  }
}
