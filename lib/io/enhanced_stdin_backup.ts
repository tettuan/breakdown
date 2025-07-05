/**
 * Enhanced Stdin Handling Module
 *
 * CI環境STDIN処理改善版
 * - CI環境判定の確実性向上
 * - isStdinAvailable()の信頼性改善
 * - CI環境でのSTDIN処理スキップ実装の最適化
 * - テスト環境でのSTDIN処理制御機能追加
 * - デバッグ用ログ出力追加
 *
 * @module
 */

import type { TimeoutManager } from "../config/timeout_manager.ts";
import { type ExtendedStdinOptions, StdinProviderFactory } from "./stdin_provider.ts";

/**
 * Enhanced options for reading from stdin
 */
export interface EnhancedStdinOptions extends ExtendedStdinOptions {
  /** Timeout manager for unified configuration */
  timeoutManager?: TimeoutManager;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom CI environment detector */
  ciDetector?: () => boolean;
}

/**
 * Environment detection result
 */
export interface EnvironmentInfo {
  /** Is this a CI environment? */
  isCI: boolean;
  /** Is this a terminal? */
  isTerminal: boolean;
  /** Is this a test environment? */
  isTest: boolean;
  /** Detected CI provider */
  ciProvider?: string;
  /** Environment variables relevant to CI detection */
  envVars: Record<string, string>;
}

/**
 * Configuration for environment detection
 */
export interface EnvironmentDetectionConfig {
  /** Map of environment variable names to their values */
  envVars?: Record<string, string>;
  /** Function to get environment variable value */
  getEnvVar?: (name: string) => string | undefined;
  /** Override for terminal detection */
  isTerminal?: boolean;
  /** Override for test detection */
  isTest?: boolean;
}

/**
 * Enhanced error for stdin operations
 */
export class EnhancedStdinError extends Error {
  constructor(
    message: string,
    public readonly environmentInfo: EnvironmentInfo,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "EnhancedStdinError";
  }
}

/**
 * Enhanced CI environment detector with improved reliability
 */
export function detectEnvironment(config?: EnvironmentDetectionConfig): EnvironmentInfo {
  const envVars: Record<string, string> = {};

  // Use provided getEnvVar function or default to Deno.env.get
  const _getEnvVar = config?.getEnvVar || ((name: string) => {
    // If envVars map is provided, check it first
    if (config?.envVars && name in config.envVars) {
      return config.envVars[name];
    }
    // Otherwise fall back to Deno.env.get
    return Deno.env.get(name);
  });

  // Comprehensive CI environment variable checks
  const ciIndicators = [
    "CI",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "JENKINS_URL",
    "BUILDKITE",
    "CIRCLECI",
    "TRAVIS",
    "APPVEYOR",
    "TEAMCITY_VERSION",
    "TF_BUILD", // Azure DevOps
    "BAMBOO_BUILD_NUMBER",
    "BUDDY_EXECUTION_ID",
    "CODESHIP",
    "DRONE",
    "NETLIFY",
    "VERCEL",
    "HEROKU",
  ];

  let isCI = false;
  let ciProvider: string | undefined;

  for (const indicator of ciIndicators) {
    const value = _getEnvVar(indicator);
    if (value) {
      envVars[indicator] = value;
      if (value === "true" || value === "1" || indicator === "JENKINS_URL") {
        isCI = true;
        if (!ciProvider) {
          ciProvider = indicator;
        }
      }
    }
  }

  // Simplified CI detection - NODE_ENV removed

  // Test environment detection - simplified
  const isTest = config?.isTest ?? !!(
    _getEnvVar("DENO_TESTING") === "true" ||
    _getEnvVar("TEST") === "true" ||
    globalThis.Deno?.test
  );

  // Terminal detection with fallback
  let isTerminal = false;
  if (config?.isTerminal !== undefined) {
    isTerminal = config.isTerminal;
  } else {
    try {
      isTerminal = Deno.stdin.isTerminal();
    } catch (_error) {
      // Fallback: if we can't determine, assume non-terminal in CI
      isTerminal = !isCI;
    }
  }

  return {
    isCI,
    isTerminal,
    isTest,
    ciProvider,
    envVars,
  };
}

/**
 * Enhanced stdin availability checker with improved reliability
 */
export function isStdinAvailableEnhanced(options?: {
  environmentInfo?: EnvironmentInfo;
  debug?: boolean;
  environmentDetectionConfig?: EnvironmentDetectionConfig;
}): boolean {
  const envInfo = options?.environmentInfo ||
    detectEnvironment(options?.environmentDetectionConfig);
  // In CI environments, never assume stdin is available unless explicitly piped
  if (envInfo.isCI) {
    // In CI, if it's a terminal, no stdin is available
    if (envInfo.isTerminal) {
      return false;
    }

    // In CI, if it's not a terminal, stdin might be piped
    return true;
  }

  // In test environments, use conservative detection
  if (envInfo.isTest) {
    // Check for explicit test stdin configuration
    // TEST_STDIN_AVAILABLE removed - use native detection

    // Default: no stdin in tests unless piped
    return !envInfo.isTerminal;
  }

  // Standard terminal detection for interactive environments

  return !envInfo.isTerminal;
}

/**
 * Enhanced stdin reader with comprehensive CI/test environment handling
 */
export async function readStdinEnhanced(options: EnhancedStdinOptions = {}): Promise<string> {
  const {
    allowEmpty = false,
    timeout,
    forceRead = false,
    ciDetector,
    mockConfig,
  } = options;

  // Create appropriate stdin provider for the current environment
  const stdinProvider = StdinProviderFactory.create(mockConfig);

  // Get environment detection config from TimeoutManager if available
  let envDetectionConfig: EnvironmentDetectionConfig | undefined;
  if (options.timeoutManager && "getEnvironmentDetectionConfig" in options.timeoutManager) {
    // TimeoutManager can provide environment detection configuration
    envDetectionConfig = (options.timeoutManager as TimeoutManager & {
      getEnvironmentDetectionConfig(): EnvironmentDetectionConfig;
    }).getEnvironmentDetectionConfig();
  }

  const envInfo = detectEnvironment(envDetectionConfig);

  // Custom CI detection override
  if (ciDetector) {
    envInfo.isCI = ciDetector();
  }

  // Determine timeout value with environment-specific defaults first
  let effectiveTimeout: number;
  let effectiveAllowEmpty: boolean;
  let effectiveForceRead: boolean;

  if (options.timeoutManager) {
    // 新しい統一管理を使用
    const stdinConfig = options.timeoutManager.getStdinConfig();
    effectiveTimeout = stdinConfig.timeout;
    effectiveAllowEmpty = allowEmpty ?? stdinConfig.allowEmpty;
    effectiveForceRead = forceRead || stdinConfig.forceRead;
  } else {
    // フォールバック: TimeoutManagerを使用（推奨）
    const { TimeoutManager } = await import("../config/timeout_manager.ts");
    const defaultManager = new TimeoutManager();

    effectiveTimeout = timeout || defaultManager.getStdinTimeout();
    effectiveAllowEmpty = allowEmpty ?? defaultManager.getStdinConfig().allowEmpty;
    effectiveForceRead = forceRead || defaultManager.getStdinConfig().forceRead;
  }

  // Early abort conditions for CI/test environments
  if (!effectiveForceRead) {
    if (envInfo.isCI && envInfo.isTerminal) {
      const errorMsg = "Stdin not available in CI terminal environment";
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "ci_terminal" });
    }

    if (
      envInfo.isTest &&
      !isStdinAvailableEnhanced({
        environmentInfo: envInfo,
        debug: options?.debug || false,
        environmentDetectionConfig: envDetectionConfig,
      })
    ) {
      const errorMsg = "Stdin not available in test environment";
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "test_environment" });
    }
  }

  try {
    let input: Uint8Array;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    try {
      // Create abort promise
      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

      // For CI environments with very short timeout, add immediate check
      if (envInfo.isCI && effectiveTimeout < 1000) {
        // Give a very short window for piped input
        const quickTimeoutId = setTimeout(() => {
          controller.abort();
        }, 100);

        let isReadComplete = false;

        // Add cleanup function
        const cleanupStdin = async () => {
          try {
            // Mark that we're done with stdin
            isReadComplete = true;

            // Try to close the readable stream if available
            if (stdinProvider.readable && typeof stdinProvider.readable.cancel === "function") {
              await stdinProvider.readable.cancel();
            }
          } catch {
            // Ignore cleanup errors
          }
        };

        const quickCheck = stdinProvider.readAll().then((result) => {
          isReadComplete = true;
          clearTimeout(quickTimeoutId);
          return result;
        });

        try {
          input = await Promise.race([
            quickCheck,
            abortPromise.then(async () => {
              clearTimeout(quickTimeoutId);
              if (!isReadComplete) {
                await cleanupStdin();
              }
              throw new DOMException("Aborted", "AbortError");
            }),
          ]);
        } catch (_error) {
          if (!isReadComplete) {
            await cleanupStdin();
          }

          if (_error instanceof DOMException && _error.name === "AbortError") {
            throw _error;
          }
          throw _error;
        }
      } else {
        // Create a more robust cleanup mechanism
        let readPromise: Promise<Uint8Array> | null = null;
        let isReadComplete = false;

        // Add cleanup function
        const cleanupStdin = async () => {
          try {
            // Mark that we're done with stdin
            isReadComplete = true;

            // Try to close the readable stream if available
            if (stdinProvider.readable && typeof stdinProvider.readable.cancel === "function") {
              await stdinProvider.readable.cancel();
            }
          } catch {
            // Ignore cleanup errors
          }
        };

        try {
          // Start the read operation
          readPromise = stdinProvider.readAll();

          // Create a wrapper that marks completion
          const readWithCompletion = readPromise.then((result) => {
            isReadComplete = true;
            return result;
          });

          input = await Promise.race([
            readWithCompletion,
            abortPromise.then(async () => {
              if (!isReadComplete) {
                await cleanupStdin();
              }
              throw new DOMException("Aborted", "AbortError");
            }),
          ]);
        } catch (_error) {
          // Ensure stdin is cleaned up on any error
          if (!isReadComplete) {
            await cleanupStdin();
          }

          if (_error instanceof DOMException && _error.name === "AbortError") {
            throw _error;
          }
          throw _error;
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const content = new TextDecoder().decode(input).trim();

    if (!effectiveAllowEmpty && !content) {
      const errorMsg = "No input provided via stdin";
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "empty_input" });
    }

    return content;
  } catch (error) {
    if (error instanceof EnhancedStdinError) {
      throw error;
    }

    const isAbortError = error instanceof Error && error.name === "AbortError";
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isAbortError) {
      throw new EnhancedStdinError(
        `Stdin reading timed out after ${effectiveTimeout}ms`,
        envInfo,
        { reason: "timeout", originalError: error },
      );
    }

    throw new EnhancedStdinError(
      `Failed to read from stdin: ${errorMessage}`,
      envInfo,
      { reason: "read_error", originalError: error },
    );
  } finally {
    // Cleanup stdin provider resources
    if (stdinProvider.cleanup) {
      try {
        await stdinProvider.cleanup();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Utility function to check if stdin processing should be skipped
 */
export function shouldSkipStdinProcessing(options?: {
  forceRead?: boolean;
  debug?: boolean;
  environmentDetectionConfig?: EnvironmentDetectionConfig;
}): { skip: boolean; reason?: string; envInfo: EnvironmentInfo } {
  const { forceRead = false, debug = false } = options || {};
  const envInfo = detectEnvironment(options?.environmentDetectionConfig);

  if (forceRead) {
    return { skip: false, envInfo };
  }

  // Skip in CI terminal environments
  if (envInfo.isCI && envInfo.isTerminal) {
    const reason = `CI terminal environment (${envInfo.ciProvider})`;
    return { skip: true, reason, envInfo };
  }

  // Skip in test environments without explicit stdin
  if (
    envInfo.isTest && !isStdinAvailableEnhanced({
      environmentInfo: envInfo,
      debug,
      environmentDetectionConfig: options?.environmentDetectionConfig,
    })
  ) {
    const reason = "Test environment without available stdin";
    return { skip: true, reason, envInfo };
  }

  return { skip: false, envInfo };
}

/**
 * Wrapper function that gracefully handles stdin reading with environment awareness
 */
export async function safeReadStdin(options: EnhancedStdinOptions = {}): Promise<{
  success: boolean;
  content: string;
  skipped: boolean;
  reason?: string;
  envInfo: EnvironmentInfo;
}> {
  const { debug = false } = options;

  // Get environment detection config from TimeoutManager if available
  let envDetectionConfig: EnvironmentDetectionConfig | undefined;
  if (options.timeoutManager && "getEnvironmentDetectionConfig" in options.timeoutManager) {
    // TimeoutManager can provide environment detection configuration
    envDetectionConfig = (options.timeoutManager as TimeoutManager & {
      getEnvironmentDetectionConfig(): EnvironmentDetectionConfig;
    }).getEnvironmentDetectionConfig();
  }

  // Check if we should skip stdin processing
  const skipCheck = shouldSkipStdinProcessing({
    forceRead: options.forceRead,
    debug,
    environmentDetectionConfig: envDetectionConfig,
  });

  if (skipCheck.skip) {
    return {
      success: true,
      content: "",
      skipped: true,
      reason: skipCheck.reason,
      envInfo: skipCheck.envInfo,
    };
  }

  try {
    const content = await readStdinEnhanced(options);
    return {
      success: true,
      content,
      skipped: false,
      envInfo: skipCheck.envInfo,
    };
  } catch (error) {
    return {
      success: false,
      content: "",
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
      envInfo: skipCheck.envInfo,
    };
  }
}
