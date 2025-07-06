#!/usr/bin/env deno run --allow-run --allow-net

/**
 * tmux Monitor Tool - Reconstructed with Totality Principles
 *
 * Monitor tmux session pane status and perform state management
 * Design Policy: Object-Oriented with SOLID Principles + Totality Principles
 *
 * Features:
 *   - Discovers the most active tmux session automatically
 *   - Separates main pane (active) from target panes (inactive)
 *   - Sends status update instructions to target panes
 *   - Reports pane status to main pane
 *   - Displays comprehensive pane list
 *   - Supports both single-run and continuous monitoring modes
 *   - Scheduled execution with keyboard interrupt capability
 *   - Instruction file option for sending startup commands to main pane
 *   - Automatic termination after 4 hours of continuous operation
 *
 * Usage:
 *   # Single monitoring cycle
 *   deno run --allow-run --allow-net scripts/monitor.ts
 *
 *   # Continuous monitoring mode
 *   deno run --allow-run --allow-net scripts/monitor.ts --continuous
 *   deno run --allow-run --allow-net scripts/monitor.ts -c
 *
 *   # Scheduled execution (wait until specified time, then start normal monitoring)
 *   deno run --allow-run --allow-net scripts/monitor.ts --time=4:00
 *   deno run --allow-run --allow-net scripts/monitor.ts -t 14:30
 *
 *   # Scheduled + continuous mode (waits until scheduled time, then runs continuous monitoring)
 *   deno run --allow-run --allow-net scripts/monitor.ts -c --time=4:00
 *   deno run --allow-run --allow-net scripts/monitor.ts -c -t 4:00
 *
 *   # Instruction file option (sends instruction file to main pane at startup)
 *   deno run --allow-run --allow-net scripts/monitor.ts --instruction=draft/2025/06/20250629-14-fix-tests.ja.md
 *   deno run --allow-run --allow-net scripts/monitor.ts -i draft/2025/06/20250629-14-fix-tests.ja.md
 *
 *   # Combined options
 *   deno run --allow-run --allow-net scripts/monitor.ts -c --time=4:00 --instruction=draft/file.md
 *
 * Following totality principles:
 * - Replace optional properties with discriminated unions
 * - Use Result types for error handling instead of exceptions
 * - Apply smart constructors for value validation
 * - Eliminate impossible states through type design
 * - All imports are properly typed and structured
 * - Error handling is exhaustive and type-safe
 */

// =============================================================================
// Imports from the monitor module directory
// =============================================================================

import { Result, ValidationError, createError } from "./monitor/types.ts";
import { TIMING } from "./monitor/config.ts";
import { 
  Pane, 
  PaneDetail, 
  WorkerStatus, 
  WorkerStatusParser, 
  MonitoringOptions, 
  ValidatedTime 
} from "./monitor/models.ts";
import { 
  CommandExecutor, 
  Logger, 
  TimeManager, 
  KeyboardInterruptHandler, 
  RuntimeTracker 
} from "./monitor/services.ts";
import { ArgumentParser } from "./monitor/arguments.ts";
import { 
  PaneDataProcessor, 
  StatusAnalyzer, 
  PaneManager, 
  PaneStatusManager 
} from "./monitor/panes.ts";
import { MessageGenerator, PaneCommunicator } from "./monitor/communication.ts";
import { PaneDisplayer } from "./monitor/display.ts";
import { CIManager } from "./monitor/ci.ts";
import { TmuxSession } from "./monitor/session.ts";
import { MonitoringEngine } from "./monitor/engine.ts";
import { DIContainer } from "./monitor/container.ts";
import { Application } from "./monitor/application.ts";

// =============================================================================
// Main Entry Point with Totality-based Design
// =============================================================================

/**
 * Main function following totality principles
 * All possible states are handled explicitly
 * No exceptions are thrown - all errors are handled through Result types
 */
async function main(): Promise<void> {
  // Initialize logger first for error reporting
  const logger = new Logger();
  
  try {
    logger.info("Starting tmux monitor with totality principles...");
    logger.info("Initializing application with dependency injection...");
    
    // Create application instance with proper initialization
    const app = new Application();
    
    // Run the application - all errors are handled internally
    await app.run();
    
    logger.info("Application completed successfully");
  } catch (error) {
    // This should never happen due to totality principles,
    // but we handle it just in case
    logger.error("Unexpected error occurred:", error);
    
    // Exit with error code
    Deno.exit(1);
  }
}

// =============================================================================
// Application Entry Point
// =============================================================================

if (import.meta.main) {
  await main();
}

// =============================================================================
// Export for potential reuse
// =============================================================================

export type {
  // Core types
  Result,
  ValidationError,
  
  // Smart constructors and models
  WorkerStatus,
};

export {
  // Helper functions
  createError,
  
  // Smart constructors and models
  Pane,
  PaneDetail,
  WorkerStatusParser,
  MonitoringOptions,
  ValidatedTime,
  
  // Services
  CommandExecutor,
  Logger,
  TimeManager,
  KeyboardInterruptHandler,
  RuntimeTracker,
  
  // Business logic
  ArgumentParser,
  PaneDataProcessor,
  StatusAnalyzer,
  PaneManager,
  PaneStatusManager,
  MessageGenerator,
  PaneCommunicator,
  PaneDisplayer,
  CIManager,
  TmuxSession,
  MonitoringEngine,
  DIContainer,
  Application,
  
  // Configuration
  TIMING,
};
