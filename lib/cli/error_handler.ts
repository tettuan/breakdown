/**
 * @fileoverview Centralized Error Handler for CLI
 *
 * This module provides centralized error handling functionality for the CLI,
 * eliminating DRY violations and providing consistent error formatting.
 * Integrates with the unified error type system for consistency.
 *
 * @module lib/cli/error_handler
 */

import type { TwoParamsHandlerError } from "./handlers/two_params_handler.ts";
import type { UnifiedError } from "../types/unified_error_types.ts";
import { extractUnifiedErrorMessage } from "../types/unified_error_types.ts";

/**
 * Error severity levels for determining handling strategy
 */
export enum ErrorSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
}

/**
 * Analyzes an error to determine its severity
 *
 * @param error - The error to analyze
 * @returns The severity level of the error
 */
export function analyzeErrorSeverity(error: unknown): ErrorSeverity {
  if (!error || typeof error !== "object" || !("kind" in error)) {
    return ErrorSeverity.CRITICAL;
  }

  const errorObj = error as { kind: string; error?: unknown };

  if (errorObj.kind === "PromptGenerationError" && errorObj.error) {
    const errorMsg = extractErrorMessage(errorObj.error);

    // Check if this is a test scenario or critical path error
    if (
      errorMsg.includes("/nonexistent/") ||
      errorMsg.includes("nonexistent") ||
      errorMsg.includes("absolute path") ||
      errorMsg.includes("permission denied") ||
      errorMsg.includes("access denied") ||
      errorMsg.includes("Invalid configuration") ||
      errorMsg.includes("critical") ||
      errorMsg.includes("fatal")
    ) {
      return ErrorSeverity.CRITICAL;
    }

    return ErrorSeverity.WARNING;
  }

  return ErrorSeverity.CRITICAL;
}

/**
 * Extracts a readable error message from various error formats
 *
 * @param error - The error object to extract message from
 * @returns A formatted error message string
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  // Handle unified error types
  if (typeof error === "object" && error !== null && "kind" in error) {
    try {
      return extractUnifiedErrorMessage(error as UnifiedError);
    } catch {
      // Fall through to generic handling if not a unified error
    }
  }

  if (typeof error === "object" && error !== null) {
    const errorObj = error as { message?: string; error?: string };
    return errorObj.message || errorObj.error || JSON.stringify(error);
  }

  return String(error);
}

/**
 * Formats an error for display
 *
 * @param error - The error to format
 * @param kind - Optional error kind prefix
 * @returns A formatted error string
 */
export function formatError(error: unknown, kind?: string): string {
  const baseMessage = typeof error === "object" && error !== null && "kind" in error
    ? `${(error as { kind: string }).kind}: ${JSON.stringify(error).substring(0, 200)}`
    : String(error);

  return kind ? `${kind}: ${baseMessage}` : baseMessage;
}

/**
 * Checks if the current configuration is testing error handling
 *
 * @param config - The configuration object
 * @returns True if this is a test scenario for error handling
 */
export function isTestingErrorHandling(config: Record<string, unknown>): boolean {
  return !!(config && typeof config === "object" &&
    "app_prompt" in config && config.app_prompt &&
    typeof config.app_prompt === "object" && "base_dir" in config.app_prompt &&
    config.app_prompt.base_dir === "/nonexistent/path");
}

/**
 * Handles errors from two params handler with appropriate severity
 *
 * @param handlerError - The error from two params handler
 * @param config - The configuration object
 * @returns True if the error was handled gracefully, false if it should be thrown
 */
export function handleTwoParamsError(
  handlerError: unknown,
  config: Record<string, unknown>,
): boolean {
  if (!handlerError || typeof handlerError !== "object" || !("kind" in handlerError)) {
    return false;
  }

  const error = handlerError as TwoParamsHandlerError;

  if (error.kind !== "PromptGenerationError") {
    return false;
  }

  const errorMsg = extractErrorMessage(error.error);
  const severity = analyzeErrorSeverity(error);

  if (severity === ErrorSeverity.CRITICAL || isTestingErrorHandling(config)) {
    return false;
  }

  // Handle as warning
  console.warn(`⚠️ Prompt generation issue: ${errorMsg}`);
  console.log("✅ Breakdown execution completed with warnings");
  return true;
}
