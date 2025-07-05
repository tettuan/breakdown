/**
 * Enhanced Stdin Handling Module - New Implementation with StdinReader Interface
 *
 * This is the new implementation that uses the StdinReader interface
 * for proper resource management and testing.
 *
 * Includes TimerManager for leak-free timeout handling.
 */

import type { TimeoutManager } from "../config/timeout_manager.ts";
import { DenoStdinReader, MockStdinReader, StdinReader } from "./stdin_reader_interface.ts";

/**
 * Enhanced options for reading from stdin
 */
export interface EnhancedStdinOptions {
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Timeout manager for unified configuration */
  timeoutManager?: TimeoutManager;
  /** Force reading stdin regardless of environment */
  forceRead?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom CI environment detector */
  ciDetector?: () => boolean;
  /** Custom stdin reader implementation (for testing/mocking) */
  stdinReader?: StdinReader;
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
  const getEnvVar = config?.getEnvVar || ((name: string) => {
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
    const value = getEnvVar(indicator);
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

  // Test environment detection
  const isTest = config?.isTest ?? !!(
    getEnvVar("DENO_TESTING") === "true" ||
    getEnvVar("TEST") === "true" ||
    globalThis.Deno?.test
  );

  // Terminal detection with fallback
  let isTerminal = config?.isTerminal;
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
 * Create appropriate reader based on environment
 */
export function createStdinReaderForEnvironment(envInfo: EnvironmentInfo): StdinReader {
  // In test environments, use a mock reader by default
  if (envInfo.isTest) {
    return new MockStdinReader({
      data: "",
      terminal: envInfo.isTerminal,
      delay: 0,
      shouldFail: true,
      failureError: {
        kind: "NotAvailableError",
        environment: "test environment",
      },
    });
  }

  // In production, use the real Deno reader
  return new DenoStdinReader();
}

/**
 * Timer management utility to prevent leaks
 */
class TimerManager {
  private timers = new Set<number>();
  private abortHandlers = new Set<() => void>();

  setTimeout(callback: () => void, delay: number): number {
    const id = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.add(id);
    return id;
  }

  clearTimeout(id: number): void {
    if (this.timers.has(id)) {
      clearTimeout(id);
      this.timers.delete(id);
    }
  }

  addAbortHandler(handler: () => void, signal: AbortSignal): void {
    this.abortHandlers.add(handler);
    signal.addEventListener("abort", handler);
  }

  cleanup(): void {
    // Clear all remaining timers
    for (const id of this.timers) {
      clearTimeout(id);
    }
    this.timers.clear();

    // Remove all abort handlers
    this.abortHandlers.clear();
  }
}

/**
 * Enhanced stdin reader with comprehensive CI/test environment handling
 * Uses the StdinReader interface for proper resource management
 * Now includes TimerManager for leak-free timeout handling
 */
export async function readStdinEnhanced(options: EnhancedStdinOptions = {}): Promise<string> {
  const timerManager = new TimerManager();

  const {
    allowEmpty = false,
    timeout,
    forceRead = false,
    ciDetector,
    stdinReader, // New parameter
  } = options;

  // Get environment detection config from TimeoutManager if available
  let envDetectionConfig: EnvironmentDetectionConfig | undefined;
  if (options.timeoutManager && "getEnvironmentDetectionConfig" in options.timeoutManager) {
    envDetectionConfig = (options.timeoutManager as TimeoutManager & {
      getEnvironmentDetectionConfig(): EnvironmentDetectionConfig;
    }).getEnvironmentDetectionConfig();
  }

  const envInfo = detectEnvironment(envDetectionConfig);

  try {
    // Custom CI detection override
    if (ciDetector) {
      envInfo.isCI = ciDetector();
    }

    // Create or use provided reader
    const reader = stdinReader || createStdinReaderForEnvironment(envInfo);

    // Determine effective values
    let effectiveTimeout: number;
    let effectiveAllowEmpty: boolean;
    let effectiveForceRead: boolean;

    if (options.timeoutManager) {
      const stdinConfig = options.timeoutManager.getStdinConfig();
      effectiveTimeout = stdinConfig.timeout;
      effectiveAllowEmpty = allowEmpty ?? stdinConfig.allowEmpty;
      effectiveForceRead = forceRead || stdinConfig.forceRead;
    } else {
      const { TimeoutManager } = await import("../config/timeout_manager.ts");
      const defaultManager = new TimeoutManager();
      effectiveTimeout = timeout || defaultManager.getStdinTimeout();
      effectiveAllowEmpty = allowEmpty ?? defaultManager.getStdinConfig().allowEmpty;
      effectiveForceRead = forceRead || defaultManager.getStdinConfig().forceRead;
    }

    // Early abort conditions for CI/test environments (only when not forced)
    if (!effectiveForceRead) {
      if (envInfo.isCI && envInfo.isTerminal) {
        const errorMsg = "Stdin not available in CI terminal environment";
        throw new EnhancedStdinError(errorMsg, envInfo, { reason: "ci_terminal" });
      }

      if (envInfo.isTest && reader.isTerminal()) {
        const errorMsg = "Stdin not available in test environment";
        throw new EnhancedStdinError(errorMsg, envInfo, { reason: "test_environment" });
      }
    }

    // Create abort controller and timeout with proper cleanup
    const controller = new AbortController();
    const timeoutId = timerManager.setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    let input: Uint8Array;

    try {
      // This is much simpler now! Just use the reader interface
      input = await reader.read(controller.signal);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new EnhancedStdinError(
          `Stdin reading timed out after ${effectiveTimeout}ms`,
          envInfo,
          { reason: "timeout", originalError: error },
        );
      }
      throw error;
    } finally {
      // Always clear the timeout
      timerManager.clearTimeout(timeoutId);
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

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new EnhancedStdinError(
      `Failed to read from stdin: ${errorMessage}`,
      envInfo,
      { reason: "read_error", originalError: error },
    );
  } finally {
    // Always cleanup timers and handlers
    timerManager.cleanup();

    // Always ensure reader is cleaned up
    try {
      const reader = options.stdinReader || createStdinReaderForEnvironment(detectEnvironment());
      await reader.cancel();
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Enhanced stdin availability checker using StdinReader
 */
export function isStdinAvailableEnhanced(options?: {
  environmentInfo?: EnvironmentInfo;
  debug?: boolean;
  environmentDetectionConfig?: EnvironmentDetectionConfig;
  stdinReader?: StdinReader;
}): boolean {
  const envInfo = options?.environmentInfo ||
    detectEnvironment(options?.environmentDetectionConfig);

  const reader = options?.stdinReader || createStdinReaderForEnvironment(envInfo);

  // In CI environments, never assume stdin is available unless explicitly piped
  if (envInfo.isCI) {
    return !reader.isTerminal();
  }

  // In test environments, use conservative detection
  if (envInfo.isTest) {
    return !reader.isTerminal();
  }

  // Standard terminal detection for interactive environments
  return !reader.isTerminal();
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
    envDetectionConfig = (options.timeoutManager as TimeoutManager & {
      getEnvironmentDetectionConfig(): EnvironmentDetectionConfig;
    }).getEnvironmentDetectionConfig();
  }

  const envInfo = detectEnvironment(envDetectionConfig);

  // Check if we should skip stdin processing
  if (!options.forceRead) {
    // Skip in CI terminal environments
    if (envInfo.isCI && envInfo.isTerminal) {
      const reason = `CI terminal environment (${envInfo.ciProvider})`;
      return { success: true, content: "", skipped: true, reason, envInfo };
    }

    // Skip in test environments without explicit stdin
    if (
      envInfo.isTest && !isStdinAvailableEnhanced({
        environmentInfo: envInfo,
        debug,
        environmentDetectionConfig: envDetectionConfig,
        stdinReader: options.stdinReader,
      })
    ) {
      const reason = "Test environment without available stdin";
      return { success: true, content: "", skipped: true, reason, envInfo };
    }
  }

  try {
    const content = await readStdinEnhanced(options);
    return {
      success: true,
      content,
      skipped: false,
      envInfo,
    };
  } catch (error) {
    return {
      success: false,
      content: "",
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
      envInfo,
    };
  }
}

/**
 * Utility function to check if stdin processing should be skipped
 * Maintained for backward compatibility
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
