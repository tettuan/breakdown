/**
 * @fileoverview Error handling implementation for workspace operations.
 *
 * This module provides the concrete implementation of the WorkspaceErrorHandler
 * interface, offering structured error handling and logging capabilities for
 * the Breakdown workspace system. It handles both workspace-specific errors
 * and unexpected errors with appropriate categorization and context preservation.
 *
 * The error handler follows the principle of graceful degradation, ensuring
 * that errors are properly logged and categorized without crashing the system.
 *
 * @module workspace/error_handler
 */

import { WorkspaceErrorHandler } from "./interfaces.ts";
import { WorkspaceError, isWorkspaceError } from "./errors.ts";

/**
 * Implementation of the WorkspaceErrorHandler interface for handling and
 * logging workspace errors.
 *
 * The WorkspaceErrorHandlerImpl class provides structured error handling
 * capabilities for workspace operations. It distinguishes between workspace-specific
 * errors (which extend WorkspaceError) and unexpected errors, providing
 * appropriate logging and context preservation for debugging and monitoring.
 *
 * @implements {WorkspaceErrorHandler}
 */
export class WorkspaceErrorHandlerImpl implements WorkspaceErrorHandler {
  /**
   * Handles an error of a specific type, providing structured logging with categorization.
   *
   * This method processes errors by examining their type and providing appropriate
   * logging output. It distinguishes between workspace-specific errors (which include
   * error codes) and unexpected errors, ensuring proper categorization for debugging.
   *
   * @param error - The error instance to handle and log
   * @param type - The category or context of the error (e.g., "INIT", "CONFIG", "PATH")
   *
   * @returns void
   *
   * @example
   * ```typescript
   * const _handler = new WorkspaceErrorHandlerImpl();
   *
   * // Handle a workspace-specific error
   * const initError = new WorkspaceInitError("Failed to create directory");
   * handler.handleError(initError, "INITIALIZATION");
   * // Output: [INITIALIZATION] WorkspaceInitError: Failed to create directory
   *
   * // Handle an unexpected error
   * const genericError = new Error("Network timeout");
   * handler.handleError(genericError, "NETWORK");
   * // Output: [NETWORK] Unexpected error: Network timeout
   * ```
   */
  handleError(error: Error, type: string): void {
    if (isWorkspaceError(error)) {
      console.error(`[${type}] ${error.type}: ${error.message}`);
    } else {
      console.error(`[${type}] Unexpected error: ${error.message}`);
    }
  }

  /**
   * Logs an error with comprehensive context information in structured JSON format.
   *
   * This method creates a detailed error log entry that includes the error details,
   * stack trace, and additional context information. The output is formatted as
   * JSON for easy parsing by log analysis tools and debugging systems.
   *
   * @param error - The error instance to log with full details
   * @param context - Additional context information relevant to the error occurrence
   *
   * @returns void
   *
   * @example
   * ```typescript
   * const handler = new WorkspaceErrorHandlerImpl();
   *
   * // Log with operational context
   * const pathError = new WorkspacePathError("Invalid path format");
   * handler.logError(pathError, {
   *   operation: "createDirectory",
   *   path: "invalid/path/../../../etc",
   *   timestamp: new Date().toISOString(),
   *   userId: "user123"
   * });
   *
   * // Log with system context
   * const systemError = new Error("Out of memory");
   * handler.logError(systemError, {
   *   memoryUsage: process.memoryUsage(),
   *   platform: Deno.build.os,
   *   timestamp: Date.now()
   * });
   * ```
   */
  logError(error: Error, context: Record<string, unknown>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    };
    console.error(JSON.stringify(errorInfo));
  }
}
