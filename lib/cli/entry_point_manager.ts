/**
 * @fileoverview Entry Point Manager for Breakdown Application
 *
 * This module implements the Entry Point Design Pattern providing:
 * - Centralized application entry point management
 * - Environment-aware initialization
 * - Error boundary for application startup
 * - Graceful shutdown handling
 * - Resource cleanup coordination
 *
 * @module lib/cli/entry_point_manager
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

/**
 * Entry point configuration options
 */
export interface EntryPointConfig {
  /** Enable verbose logging during startup */
  verbose?: boolean;
  /** Custom error handler for application errors */
  errorHandler?: (error: Error) => void;
  /** Custom signal handlers */
  signalHandlers?: {
    SIGINT?: () => void;
    SIGTERM?: () => void;
  };
  /** Environment validation options */
  validateEnvironment?: boolean;
  /** Main application function to run */
  mainFunction?: (args: string[]) => Promise<unknown>;
}

/**
 * Application startup errors
 */
export type EntryPointError =
  | { kind: "EnvironmentValidationError"; message: string; requirements: string[] }
  | { kind: "StartupError"; message: string; cause?: unknown }
  | { kind: "SignalHandlerError"; signal: string; error: string; message: string }
  | { kind: "ShutdownError"; message: string; cause?: unknown }
  | {
    kind: "ConfigurationError";
    message: string;
    config: {
      verbose?: boolean;
      validateEnvironment?: boolean;
      hasErrorHandler: boolean;
      hasSignalHandlers: boolean;
    };
  };

/**
 * Extract error message from EntryPointError union type
 */
export function getEntryPointErrorMessage(error: EntryPointError): string {
  switch (error.kind) {
    case "EnvironmentValidationError":
    case "StartupError":
    case "ShutdownError":
    case "ConfigurationError":
      return error.message;
    case "SignalHandlerError":
      return error.error;
    default: {
      const exhaustive: never = error;
      throw new Error(`Unhandled error kind: ${exhaustive}`);
    }
  }
}

/**
 * Entry Point Manager implementing the Entry Point Design Pattern
 *
 * This class provides a robust, standardized way to initialize and manage
 * the application's lifecycle, following enterprise application patterns.
 */
export class EntryPointManager {
  private config: EntryPointConfig;
  private isShuttingDown = false;
  private startupTime?: Date;
  private signalHandlersInstalled = false;
  private sigintHandler?: () => void;
  private sigtermHandler?: () => void;

  constructor(config: EntryPointConfig = {}) {
    this.config = {
      verbose: false,
      validateEnvironment: true,
      ...config,
    };
  }

  /**
   * Main application entry point
   *
   * This method orchestrates the complete application startup:
   * 1. Environment validation
   * 2. Signal handler setup
   * 3. Application initialization
   * 4. Command execution
   * 5. Graceful shutdown
   *
   * @param args - Command line arguments
   * @returns Result indicating success or failure with detailed error information
   */
  async start(args: string[] = Deno.args): Promise<Result<void, EntryPointError>> {
    try {
      this.startupTime = new Date();

      if (this.config.verbose) {
        console.log("🚀 Starting Breakdown application...");
      }

      // 1. Validate environment
      if (this.config.validateEnvironment) {
        const envValidation = this.validateEnvironment();
        if (!envValidation.ok) {
          return envValidation;
        }
      }

      // 2. Setup signal handlers for graceful shutdown
      const signalSetup = this.setupSignalHandlers();
      if (!signalSetup.ok) {
        return signalSetup;
      }

      // 3. Execute main application logic
      if (!this.config.mainFunction) {
        return error({
          kind: "ConfigurationError",
          message: "Main function not provided to EntryPointManager",
          config: {
            verbose: this.config.verbose,
            validateEnvironment: this.config.validateEnvironment,
            hasErrorHandler: !!this.config.errorHandler,
            hasSignalHandlers: !!this.config.signalHandlers,
          },
        });
      }

      await this.config.mainFunction(args);

      if (this.config.verbose) {
        const duration = Date.now() - this.startupTime.getTime();
        console.log(`✅ Application completed successfully in ${duration}ms`);
      }

      return ok(undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (this.config.errorHandler) {
        this.config.errorHandler(err instanceof Error ? err : new Error(errorMessage));
      }

      return error({
        kind: "StartupError",
        message: `Application startup failed: ${errorMessage}`,
        cause: err,
      });
    }
  }

  /**
   * Validates the runtime environment
   */
  private validateEnvironment(): Result<void, EntryPointError> {
    const requirements: string[] = [];
    const missing: string[] = [];

    // Check Deno version compatibility
    const denoVersion = Deno.version.deno;
    requirements.push(`Deno ${denoVersion}`);

    // Check required permissions are available
    try {
      // Test basic permissions that the app needs
      Deno.cwd(); // Requires --allow-read
      requirements.push("--allow-read permission");
    } catch {
      missing.push("--allow-read permission required");
    }

    if (missing.length > 0) {
      return error({
        kind: "EnvironmentValidationError",
        message: `Environment validation failed: ${missing.join(", ")}`,
        requirements,
      });
    }

    if (this.config.verbose) {
      console.log("✅ Environment validation passed");
      console.log(`   Requirements: ${requirements.join(", ")}`);
    }

    return ok(undefined);
  }

  /**
   * Sets up signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): Result<void, EntryPointError> {
    try {
      // Skip if already installed or in test environment
      if (this.signalHandlersInstalled || Deno.env.get("DENO_TESTING") === "true") {
        return ok(undefined);
      }

      // Handle SIGINT (Ctrl+C)
      this.sigintHandler = () => {
        if (this.config.signalHandlers?.SIGINT) {
          this.config.signalHandlers.SIGINT();
        } else {
          this.handleShutdownSignal("SIGINT");
        }
      };
      Deno.addSignalListener("SIGINT", this.sigintHandler);

      // Handle SIGTERM (graceful termination)
      this.sigtermHandler = () => {
        if (this.config.signalHandlers?.SIGTERM) {
          this.config.signalHandlers.SIGTERM();
        } else {
          this.handleShutdownSignal("SIGTERM");
        }
      };
      Deno.addSignalListener("SIGTERM", this.sigtermHandler);

      this.signalHandlersInstalled = true;

      if (this.config.verbose) {
        console.log("✅ Signal handlers configured");
      }

      return ok(undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return error({
        kind: "SignalHandlerError",
        signal: "setup",
        error: errorMessage,
        message: `Signal handler setup failed: ${errorMessage}`,
      });
    }
  }

  /**
   * Handles shutdown signals gracefully
   */
  private handleShutdownSignal(signal: string): void {
    if (this.isShuttingDown) {
      // Force exit if already shutting down
      console.log(`⚠️ Force exit on second ${signal}`);
      Deno.exit(1);
    }

    this.isShuttingDown = true;

    if (this.config.verbose) {
      console.log(`📤 Received ${signal}, shutting down gracefully...`);
    }

    // Perform graceful shutdown
    this.shutdown()
      .then(() => {
        if (this.config.verbose) {
          console.log("✅ Graceful shutdown completed");
        }
        Deno.exit(0);
      })
      .catch((err) => {
        console.error("❌ Error during shutdown:", err);
        Deno.exit(1);
      });
  }

  /**
   * Performs graceful application shutdown
   */
  private shutdown(): Promise<Result<void, EntryPointError>> {
    try {
      // Cleanup signal handlers
      this.cleanupSignalHandlers();

      // Future: Add cleanup logic here
      // - Close database connections
      // - Flush pending writes
      // - Cancel ongoing operations
      // - Release resources

      return Promise.resolve(ok(undefined));
    } catch (err) {
      return Promise.resolve(error({
        kind: "ShutdownError",
        message: "Error during application shutdown",
        cause: err,
      }));
    }
  }

  /**
   * Cleanup signal handlers to prevent resource leaks
   */
  private cleanupSignalHandlers(): void {
    if (this.signalHandlersInstalled) {
      try {
        // Remove signal listeners
        if (this.sigintHandler) {
          Deno.removeSignalListener("SIGINT", this.sigintHandler);
          this.sigintHandler = undefined;
        }
        if (this.sigtermHandler) {
          Deno.removeSignalListener("SIGTERM", this.sigtermHandler);
          this.sigtermHandler = undefined;
        }
        this.signalHandlersInstalled = false;
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Factory method to create a standard entry point manager
   */
  static createStandard(
    verbose = false,
    mainFunction?: (args: string[]) => Promise<unknown>,
  ): EntryPointManager {
    return new EntryPointManager({
      verbose,
      validateEnvironment: true,
      mainFunction,
      errorHandler: (error) => {
        console.error("❌ Application Error:", error.message);
        if (verbose && error.stack) {
          console.error(error.stack);
        }
      },
    });
  }

  /**
   * Factory method to create a development entry point manager
   */
  static createDevelopment(mainFunction?: (args: string[]) => Promise<unknown>): EntryPointManager {
    return new EntryPointManager({
      verbose: true,
      validateEnvironment: true,
      mainFunction,
      errorHandler: (error) => {
        console.error("🐛 Development Error:", error.message);
        if (error.stack) {
          console.error(error.stack);
        }
      },
    });
  }

  /**
   * Factory method to create a production entry point manager
   */
  static createProduction(mainFunction?: (args: string[]) => Promise<unknown>): EntryPointManager {
    return new EntryPointManager({
      verbose: false,
      validateEnvironment: true,
      mainFunction,
      errorHandler: (_error) => {
        // In production, log errors but don't expose details
        console.error("Application error occurred");
        // Future: Send to error tracking service
      },
    });
  }
}
