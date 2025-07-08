#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * @file local_ci.ts
 * @description Deno-based TypeScript CI runner for breakdown project
 * 
 * Purpose:
 *   - Run all Deno tests in the project with strict permissions and debug logging
 *   - Ensure all tests pass before running formatting and lint checks
 *   - Mimics the CI flow locally to catch issues before commit, push, or merge
 * 
 * Features:
 *   - Type-safe configuration and error handling
 *   - Multiple execution modes (single-file, batch, legacy)
 *   - Automatic fallback mechanisms
 *   - Comprehensive error diagnostics
 *   - Memory optimization for large test suites
 * 
 * Usage:
 *   deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts
 *   deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --single-file
 *   deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --batch --batch-size 15
 *   deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --legacy
 */

import { CIRunner } from "./local_ci/ci_runner.ts";
import { CLIParser } from "./local_ci/cli_parser.ts";
import { Logger } from "./local_ci/logger.ts";

async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const config = CLIParser.parse(Deno.args);
    
    // Initialize logger with debug and silent modes
    const logger = new Logger(config.debug, config.silent);
    
    // Create and run CI
    const runner = new CIRunner(config, logger);
    const success = await runner.run();
    
    // Exit with appropriate code
    Deno.exit(success ? 0 : 1);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error:", errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
