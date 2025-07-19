/**
 * @fileoverview Stdin Integration Wrapper
 *
 * This module provides a wrapper class for stdin integration that encapsulates
 * the enhanced stdin functionality and provides backward compatibility.
 *
 * @module io/stdin_integration_wrapper
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import {
  detectEnvironment,
  type EnhancedStdinOptions as _EnhancedStdinOptions,
  type EnvironmentInfo,
  isStdinAvailableEnhanced,
  readStdinEnhanced,
  safeReadStdin,
  shouldSkipStdinProcessing,
} from "./enhanced_stdin.ts";

/**
 * Configuration for stdin migration behavior
 */
export interface StdinMigrationConfig {
  useEnhanced?: boolean;
  debug?: boolean;
  forceFallback?: boolean;
  environmentOverrides?: {
    terminal?: boolean;
    ci?: boolean;
    test?: boolean;
  };
}

/**
 * Integration wrapper class for stdin operations
 */
export class StdinIntegrationWrapper {
  private config: StdinMigrationConfig;

  constructor(config: StdinMigrationConfig = {}) {
    this.config = {
      useEnhanced: true,
      debug: false,
      forceFallback: false,
      ...config,
    };
  }

  /**
   * Check if stdin is available
   */
  isStdinAvailable(options?: { isTerminal?: boolean }): Result<boolean, Error> {
    try {
      if (this.config.forceFallback) {
        return ok(false);
      }

      const envInfo = detectEnvironment();
      const isAvailable = isStdinAvailableEnhanced({
        environmentInfo: envInfo,
        debug: this.config.debug,
      });

      // Apply environment overrides
      if (options?.isTerminal !== undefined) {
        return ok(!options.isTerminal);
      }

      return ok(isAvailable);
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Read from stdin with timeout and options
   */
  async readStdin(options: {
    timeout?: number;
    allowEmpty?: boolean;
    forceRead?: boolean;
  } = {}): Promise<Result<string, Error>> {
    try {
      const content = await readStdinEnhanced({
        timeout: options.timeout,
        allowEmpty: options.allowEmpty ?? true,
        forceRead: options.forceRead ?? false,
        debug: this.config.debug,
      });
      return ok(content);
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Safe read from stdin with comprehensive result
   */
  async readStdinSafe(options: {
    timeout?: number;
    allowEmpty?: boolean;
    forceRead?: boolean;
  } = {}): Promise<
    Result<{
      content: string;
      skipped: boolean;
      reason?: string;
      environmentInfo?: EnvironmentInfo;
    }, Error>
  > {
    try {
      const result = await safeReadStdin({
        timeout: options.timeout,
        allowEmpty: options.allowEmpty ?? true,
        forceRead: options.forceRead ?? false,
        debug: this.config.debug,
      });
      return ok({
        content: result.content,
        skipped: result.skipped,
        reason: result.reason,
        environmentInfo: result.envInfo,
      });
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo(): Result<EnvironmentInfo, Error> {
    try {
      const envInfo = detectEnvironment();
      return ok(envInfo);
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Check if stdin should be skipped
   */
  shouldSkipStdin(options?: { forceRead?: boolean }): Result<boolean, Error> {
    try {
      const shouldSkip = shouldSkipStdinProcessing({
        forceRead: options?.forceRead ?? false,
        debug: this.config.debug,
      });
      return ok(shouldSkip.skip);
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

// Backward compatibility functions
export function isStdinAvailable(options?: { isTerminal?: boolean }): boolean {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.isStdinAvailable(options);
  return result.ok ? result.data : false;
}

export async function readStdin(options?: {
  timeout?: number;
  allowEmpty?: boolean;
  forceRead?: boolean;
}): Promise<string> {
  const wrapper = new StdinIntegrationWrapper();
  const result = await wrapper.readStdin(options ?? {});
  if (result.ok) {
    return result.data;
  }
  throw result.error;
}

export async function readStdinSafe(options?: {
  timeout?: number;
  allowEmpty?: boolean;
  skipChecks?: boolean;
}): Promise<{
  success: boolean;
  content: string;
  skipped: boolean;
  reason?: string;
  envInfo: EnvironmentInfo;
}> {
  const wrapper = new StdinIntegrationWrapper();
  const result = await wrapper.readStdinSafe({
    timeout: options?.timeout,
    allowEmpty: options?.allowEmpty,
    forceRead: false,
  });
  if (result.ok) {
    return {
      success: !result.data.skipped,
      content: result.data.content,
      skipped: result.data.skipped,
      reason: result.data.reason,
      envInfo: result.data.environmentInfo || detectEnvironment(),
    };
  }
  throw result.error;
}

export function shouldSkipStdin(options?: { forceRead?: boolean }): boolean {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.shouldSkipStdin(options);
  return result.ok ? result.data : true;
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const wrapper = new StdinIntegrationWrapper();
  const result = wrapper.getEnvironmentInfo();
  if (result.ok) {
    return result.data;
  }
  throw result.error;
}

export async function handleStdinForCLI(options?: {
  from?: string;
  fromFile?: string;
  timeout?: number;
  allowEmpty?: boolean;
  debug?: boolean;
}): Promise<
  Result<{
    inputText: string;
    skipped: boolean;
    warnings: string[];
  }, Error>
> {
  const wrapper = new StdinIntegrationWrapper({ debug: options?.debug });

  // Check if stdin is explicitly requested
  const isExplicitStdin = options?.from === "-" || options?.fromFile === "-";

  if (isExplicitStdin) {
    const result = await wrapper.readStdin({
      timeout: options?.timeout,
      allowEmpty: options?.allowEmpty ?? true,
      forceRead: true,
    });

    if (result.ok) {
      return ok({
        inputText: result.data,
        skipped: false,
        warnings: [],
      });
    }
    return error(result.error);
  }

  // Auto-detection mode
  const safeResult = await wrapper.readStdinSafe({
    timeout: options?.timeout,
    allowEmpty: options?.allowEmpty ?? true,
  });

  if (safeResult.ok) {
    const warnings: string[] = [];
    if (safeResult.data.skipped) {
      warnings.push(safeResult.data.reason || "Stdin was skipped");
    }

    return ok({
      inputText: safeResult.data.content,
      skipped: safeResult.data.skipped,
      warnings,
    });
  }

  return error(safeResult.error);
}
