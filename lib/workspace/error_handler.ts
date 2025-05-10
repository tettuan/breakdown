import { WorkspaceErrorHandler } from "./interfaces.ts";
import { WorkspaceError } from "./errors.ts";

export class WorkspaceErrorHandlerImpl implements WorkspaceErrorHandler {
  handleError(error: Error, type: string): void {
    if (error instanceof WorkspaceError) {
      console.error(`[${type}] ${error.name}: ${error.message}`);
    } else {
      console.error(`[${type}] Unexpected error: ${error.message}`);
    }
  }

  logError(error: Error, context: Record<string, unknown>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    };
    console.error(JSON.stringify(errorInfo, null, 2));
  }
} 