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

import { readAll } from "jsr:@std/io@0.224.9/read-all";

/**
 * Enhanced options for reading from stdin
 */
export interface EnhancedStdinOptions {
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Force reading stdin regardless of environment */
  forceRead?: boolean;
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
 * Enhanced error for stdin operations
 */
export class EnhancedStdinError extends Error {
  constructor(
    message: string,
    public readonly environmentInfo: EnvironmentInfo,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = "EnhancedStdinError";
  }
}

/**
 * Enhanced CI environment detector with improved reliability
 */
export function detectEnvironment(): EnvironmentInfo {
  const envVars: Record<string, string> = {};
  
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
    const value = Deno.env.get(indicator);
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

  // Additional specific checks
  if (Deno.env.get("NODE_ENV") === "ci") {
    isCI = true;
    ciProvider = ciProvider || "NODE_ENV";
    envVars["NODE_ENV"] = "ci";
  }

  // Test environment detection
  const isTest = !!(
    Deno.env.get("DENO_TESTING") === "true" ||
    Deno.env.get("NODE_ENV") === "test" ||
    Deno.env.get("TEST") === "true" ||
    globalThis.Deno?.test
  );

  // Terminal detection with fallback
  let isTerminal = false;
  try {
    isTerminal = Deno.stdin.isTerminal();
  } catch (error) {
    // Fallback: if we can't determine, assume non-terminal in CI
    isTerminal = !isCI;
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
}): boolean {
  const envInfo = options?.environmentInfo || detectEnvironment();
  const debug = options?.debug || false;

  if (debug) {
    console.debug("[STDIN] Environment detection:", envInfo);
  }

  // In CI environments, never assume stdin is available unless explicitly piped
  if (envInfo.isCI) {
    if (debug) {
      console.debug("[STDIN] CI environment detected, checking terminal status");
    }
    
    // In CI, if it's a terminal, no stdin is available
    if (envInfo.isTerminal) {
      if (debug) {
        console.debug("[STDIN] CI + Terminal = No stdin available");
      }
      return false;
    }
    
    // In CI, if it's not a terminal, stdin might be piped
    if (debug) {
      console.debug("[STDIN] CI + Non-terminal = Stdin potentially available");
    }
    return true;
  }

  // In test environments, use conservative detection
  if (envInfo.isTest) {
    if (debug) {
      console.debug("[STDIN] Test environment detected");
    }
    
    // Check for explicit test stdin configuration
    const testStdin = Deno.env.get("TEST_STDIN_AVAILABLE");
    if (testStdin !== undefined) {
      const available = testStdin === "true";
      if (debug) {
        console.debug(`[STDIN] TEST_STDIN_AVAILABLE=${testStdin}, returning ${available}`);
      }
      return available;
    }
    
    // Default: no stdin in tests unless piped
    return !envInfo.isTerminal;
  }

  // Standard terminal detection for interactive environments
  if (debug) {
    console.debug("[STDIN] Standard environment, using terminal detection");
  }
  
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
    debug = false,
    ciDetector,
  } = options;

  const envInfo = detectEnvironment();
  
  if (debug) {
    console.debug("[STDIN] Starting enhanced stdin read", { options, envInfo });
  }

  // Custom CI detection override
  if (ciDetector) {
    envInfo.isCI = ciDetector();
    if (debug) {
      console.debug("[STDIN] Custom CI detector result:", envInfo.isCI);
    }
  }

  // Early abort conditions for CI/test environments
  if (!forceRead) {
    if (envInfo.isCI && envInfo.isTerminal) {
      const errorMsg = "Stdin not available in CI terminal environment";
      if (debug) {
        console.debug(`[STDIN] ${errorMsg}`);
      }
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "ci_terminal" });
    }

    if (envInfo.isTest && !isStdinAvailableEnhanced({ environmentInfo: envInfo, debug })) {
      const errorMsg = "Stdin not available in test environment";
      if (debug) {
        console.debug(`[STDIN] ${errorMsg}`);
      }
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "test_environment" });
    }
  }

  try {
    let input: Uint8Array;
    
    // Determine timeout value with environment-specific defaults
    const effectiveTimeout = timeout || 
      parseInt(Deno.env.get("BREAKDOWN_TIMEOUT") || "0", 10) ||
      (envInfo.isCI ? 5000 : (envInfo.isTest ? 1000 : 30000));

    if (debug) {
      console.debug(`[STDIN] Using timeout: ${effectiveTimeout}ms`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (debug) {
        console.debug("[STDIN] Timeout triggered");
      }
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
        const quickCheck = new Promise<Uint8Array>((resolve, reject) => {
          setTimeout(() => {
            reject(new DOMException("Quick timeout", "AbortError"));
          }, 100);
          
          readAll(Deno.stdin).then(resolve, reject);
        });

        if (debug) {
          console.debug("[STDIN] Using quick check for CI environment");
        }

        input = await Promise.race([quickCheck, abortPromise]);
      } else {
        if (debug) {
          console.debug("[STDIN] Starting standard stdin read");
        }

        input = await Promise.race([
          readAll(Deno.stdin),
          abortPromise,
        ]);
      }

      if (debug) {
        console.debug(`[STDIN] Successfully read ${input.length} bytes`);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const content = new TextDecoder().decode(input).trim();

    if (!allowEmpty && !content) {
      const errorMsg = "No input provided via stdin";
      if (debug) {
        console.debug(`[STDIN] ${errorMsg}`);
      }
      throw new EnhancedStdinError(errorMsg, envInfo, { reason: "empty_input" });
    }

    if (debug) {
      console.debug(`[STDIN] Successfully processed content: ${content.length} characters`);
    }

    return content;
  } catch (error) {
    if (error instanceof EnhancedStdinError) {
      throw error;
    }

    const isAbortError = error instanceof Error && error.name === "AbortError";
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (debug) {
      console.debug(`[STDIN] Error occurred: ${errorMessage}`, { isAbortError, envInfo });
    }

    if (isAbortError) {
      throw new EnhancedStdinError(
        `Stdin reading timed out after ${timeout}ms`,
        envInfo,
        { reason: "timeout", originalError: error }
      );
    }

    throw new EnhancedStdinError(
      `Failed to read from stdin: ${errorMessage}`,
      envInfo,
      { reason: "read_error", originalError: error }
    );
  }
}

/**
 * Utility function to check if stdin processing should be skipped
 */
export function shouldSkipStdinProcessing(options?: {
  forceRead?: boolean;
  debug?: boolean;
}): { skip: boolean; reason?: string; envInfo: EnvironmentInfo } {
  const { forceRead = false, debug = false } = options || {};
  const envInfo = detectEnvironment();

  if (forceRead) {
    return { skip: false, envInfo };
  }

  // Skip in CI terminal environments
  if (envInfo.isCI && envInfo.isTerminal) {
    const reason = `CI terminal environment (${envInfo.ciProvider})`;
    if (debug) {
      console.debug(`[STDIN] Skipping: ${reason}`);
    }
    return { skip: true, reason, envInfo };
  }

  // Skip in test environments without explicit stdin
  if (envInfo.isTest && !isStdinAvailableEnhanced({ environmentInfo: envInfo, debug })) {
    const reason = "Test environment without available stdin";
    if (debug) {
      console.debug(`[STDIN] Skipping: ${reason}`);
    }
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

  // Check if we should skip stdin processing
  const skipCheck = shouldSkipStdinProcessing({ 
    forceRead: options.forceRead, 
    debug 
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
    if (debug) {
      console.debug("[STDIN] Safe read failed:", error);
    }

    return {
      success: false,
      content: "",
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
      envInfo: skipCheck.envInfo,
    };
  }
}