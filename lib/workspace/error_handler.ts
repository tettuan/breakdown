import { WorkspaceErrorHandler } from "./interfaces.ts";
import { WorkspaceError } from "./errors.ts";

/**
 * Implementation of the WorkspaceErrorHandler interface for handling and logging workspace errors.
 */
export class WorkspaceErrorHandlerImpl implements WorkspaceErrorHandler {
  /**
   * Handles an error of a specific type, logging it to the console.
   * @param error The error to handle.
   * @param type The type/category of the error.
   */
  handleError(error: Error, type: string): void {
    if (error instanceof WorkspaceError) {
      console.error(`[${type}] ${error.name}: ${error.message}`);
    } else {
      console.error(`[${type}] Unexpected error: ${error.message}`);
    }
  }

  /**
   * Logs an error with additional context information.
   * @param error The error to log.
   * @param context Additional context for the error.
   */
  logError(error: Error, context: Record<string, unknown>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    };
    console.error(JSON.stringify(errorInfo, null, 2));
  }
}
