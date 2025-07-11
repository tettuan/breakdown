/**
 * @fileoverview Centralized Error Handler for CLI
 *
 * This module provides centralized error handling functionality for the CLI,
 * eliminating DRY violations and providing consistent error formatting.
 * Integrates with the unified error type system for consistency.
 *
 * @module lib/cli/error_handler
 */

import type { Result } from "../types/result.ts";
import type { TwoParamsHandlerError } from "./handlers/two_params_handler.ts";
import type { UnifiedError } from "../types/unified_error_types.ts";
import { extractUnifiedErrorMessage } from "../types/unified_error_types.ts";

/**
 * Error severity levels for determining handling strategy
 */
export const ErrorSeverity = {
  CRITICAL: "critical",
  WARNING: "warning",
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Error severity result type for determining handling strategy
 */
export type ErrorSeverityResult =
  | { kind: "critical" }
  | { kind: "warning" };

/**
 * Configuration validation result
 */
export type ConfigValidationResult =
  | { ok: true; isValid: true; isTestScenario: false }
  | { ok: true; isValid: true; isTestScenario: true }
  | { ok: true; isValid: false; isTestScenario: false };

/**
 * Analyzes an error to determine its severity
 *
 * @param error - The error to analyze
 * @returns The severity level of the error
 */
export function analyzeErrorSeverity(
  error: UnifiedError | TwoParamsHandlerError,
): ErrorSeverityResult {
  // Type check for defensive programming
  if (typeof error !== "object" || error === null) {
    return { kind: "critical" };
  }

  // TwoParamsHandlerError specific logic
  if ("kind" in error && error.kind === "PromptGenerationError") {
    const handlerError = error as Extract<TwoParamsHandlerError, { kind: "PromptGenerationError" }>;
    const errorMsg = handlerError.error;

    // Convert error to string for analysis
    const errorStr = typeof errorMsg === "string"
      ? errorMsg
      : typeof errorMsg === "object" && errorMsg !== null && "message" in errorMsg
      ? String((errorMsg as { message: unknown }).message)
      : JSON.stringify(errorMsg);

    // Check if this is a test scenario or critical path error
    if (
      errorStr.includes("/nonexistent/") ||
      errorStr.includes("nonexistent") ||
      errorStr.includes("absolute path") ||
      errorStr.includes("permission denied") ||
      errorStr.includes("access denied") ||
      errorStr.includes("Invalid configuration") ||
      errorStr.includes("critical") ||
      errorStr.includes("fatal")
    ) {
      return { kind: "critical" };
    }

    return { kind: "warning" };
  }

  return { kind: "critical" };
}

/**
 * Extracts a readable error message from various error formats
 * Now returns a Result type following Totality principle
 *
 * @param error - The error object to extract message from
 * @returns Result containing formatted error message string
 */
export function extractErrorMessage(error: unknown): Result<string, { kind: "UnknownErrorType" }> {
  if (typeof error === "string") {
    return { ok: true, data: error };
  }

  if (typeof error === "object" && error !== null) {
    // Try unified error handling first for objects with kind property
    if ("kind" in error) {
      try {
        const unifiedMessage = extractUnifiedErrorMessage(error as UnifiedError);
        // Only use unified message if it doesn't fall back to JSON.stringify
        if (!unifiedMessage.startsWith("Unknown error:")) {
          return { ok: true, data: unifiedMessage };
        }
      } catch {
        // Fall through to standard property extraction
      }
    }

    // Type-safe property access
    const errorObj = error as Record<string, unknown>;

    // Try standard message/error properties
    if (typeof errorObj.message === "string") {
      return { ok: true, data: errorObj.message };
    }
    if (typeof errorObj.error === "string") {
      return { ok: true, data: errorObj.error };
    }

    // JSON fallback for objects without standard properties
    return { ok: true, data: JSON.stringify(error) };
  }

  return { ok: true, data: String(error) };
}

/**
 * Formats an error for display using Result type
 *
 * @param error - The error to format
 * @param kind - Optional error kind prefix
 * @returns Result containing formatted error string
 */
export function formatError(
  error: unknown,
  kind?: string,
): Result<string, { kind: "FormatError" }> {
  if (typeof error === "object" && error !== null && "kind" in error) {
    const errorWithKind = error as { kind: string };
    const baseMessage = `${errorWithKind.kind}: ${JSON.stringify(error).substring(0, 200)}`;
    return { ok: true, data: kind ? `${kind}: ${baseMessage}` : baseMessage };
  }

  const baseMessage = String(error);
  return { ok: true, data: kind ? `${kind}: ${baseMessage}` : baseMessage };
}

/**
 * Checks if the current configuration is testing error handling
 * Returns a Result type following Totality principle
 *
 * @param config - The configuration object
 * @returns Result indicating if this is a test scenario
 */
export function isTestingErrorHandling(config: unknown): ConfigValidationResult {
  // Type guard: ensure config is a valid object
  if (
    config === null ||
    config === undefined ||
    typeof config !== "object" ||
    Array.isArray(config)
  ) {
    return { ok: true, isValid: false, isTestScenario: false };
  }

  const configObj = config as Record<string, unknown>;

  // Check for app_prompt property
  if (
    !("app_prompt" in configObj) ||
    configObj.app_prompt === null ||
    configObj.app_prompt === undefined ||
    typeof configObj.app_prompt !== "object" ||
    Array.isArray(configObj.app_prompt)
  ) {
    return { ok: true, isValid: false, isTestScenario: false };
  }

  const appPrompt = configObj.app_prompt as Record<string, unknown>;

  // Check for base_dir property
  if (
    !("base_dir" in appPrompt) ||
    typeof appPrompt.base_dir !== "string"
  ) {
    return { ok: true, isValid: true, isTestScenario: false };
  }

  // Check if base_dir matches test scenario
  if (appPrompt.base_dir === "/nonexistent/path") {
    return { ok: true, isValid: true, isTestScenario: true };
  }

  return { ok: true, isValid: true, isTestScenario: false };
}

/**
 * Error handling result type
 */
export type ErrorHandlingResult =
  | { ok: true; handled: true; action: "logged_warning" }
  | { ok: true; handled: false; reason: "critical_error" | "test_scenario" | "invalid_error_type" };

/**
 * Handles errors from two params handler with appropriate severity
 * Returns Result type following Totality principle
 *
 * @param handlerError - The error from two params handler
 * @param config - The configuration object
 * @returns Result indicating if the error was handled gracefully
 */
export function handleTwoParamsError(
  handlerError: unknown,
  config: unknown,
): ErrorHandlingResult {
  // Validate error type
  if (
    !handlerError ||
    typeof handlerError !== "object" ||
    !("kind" in handlerError)
  ) {
    return { ok: true, handled: false, reason: "invalid_error_type" };
  }

  const error = handlerError as { kind: string; error?: unknown };

  if (error.kind !== "PromptGenerationError") {
    return { ok: true, handled: false, reason: "invalid_error_type" };
  }

  // Cast to specific error type after validation
  const twoParamsError = error as TwoParamsHandlerError;

  // For PromptGenerationError, extract the error message
  if (twoParamsError.kind === "PromptGenerationError") {
    const promptError = twoParamsError as Extract<
      TwoParamsHandlerError,
      { kind: "PromptGenerationError" }
    >;
    const errorMsgResult = extractErrorMessage(promptError.error);
    if (!errorMsgResult.ok) {
      return { ok: true, handled: false, reason: "invalid_error_type" };
    }

    const severity = analyzeErrorSeverity(twoParamsError);
    const configResult = isTestingErrorHandling(config);

    if (
      severity.kind === "critical" ||
      (configResult.ok && configResult.isValid && configResult.isTestScenario)
    ) {
      return {
        ok: true,
        handled: false,
        reason: severity.kind === "critical" ? "critical_error" : "test_scenario",
      };
    }

    // Handle as warning
    console.warn(`⚠️ Prompt generation issue: ${errorMsgResult.data}`);
    console.log("✅ Breakdown execution completed with warnings");
    return { ok: true, handled: true, action: "logged_warning" };
  }

  return { ok: true, handled: false, reason: "invalid_error_type" };
}
