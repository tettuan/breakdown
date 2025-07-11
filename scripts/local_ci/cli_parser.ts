/**
 * @file cli_parser.ts
 * @description Command line argument parser for the CI system
 */

import type { CIConfig, ExecutionMode } from "./types.ts";

export class CLIParser {
  static parse(args: string[]): CIConfig {
    const config: CIConfig = {
      singleFileMode: false,
      batchMode: true, // Default to batch mode
      legacyMode: false,
      fallbackToSingleFile: true, // Enable automatic fallback
      batchSize: 25,
      debug: false,
      silent: false,
      errorFilesOnly: false,
    };

    // Check for DEBUG environment variable
    const debugEnv = Deno.env.get("DEBUG");
    if (debugEnv === "true" || debugEnv === "1") {
      config.debug = true;
    }

    // Check for LOG_LEVEL environment variable
    const logLevel = Deno.env.get("LOG_LEVEL");
    if (logLevel === "debug") {
      config.debug = true;
    }

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      switch (arg) {
        case "--single-file":
          config.singleFileMode = true;
          config.batchMode = false;
          config.fallbackToSingleFile = false;
          break;

        case "--batch":
          config.batchMode = true;
          config.singleFileMode = false;
          break;

        case "--batch-size": {
          if (i + 1 >= args.length) {
            throw new Error("--batch-size requires a value");
          }
          const batchSize = parseInt(args[i + 1], 10);
          if (isNaN(batchSize) || batchSize < 1) {
            throw new Error("--batch-size must be a positive integer");
          }
          config.batchSize = batchSize;
          i++; // Skip the next argument
          break;
        }

        case "--legacy":
          config.legacyMode = true;
          config.batchMode = false;
          config.fallbackToSingleFile = false;
          break;

        case "--no-fallback":
          config.fallbackToSingleFile = false;
          break;

        case "--debug":
          config.debug = true;
          break;

        case "--silent":
          config.silent = true;
          break;

        case "--error-files-only":
          config.errorFilesOnly = true;
          config.silent = true; // Implies silent mode
          break;

        case "--help":
        case "-h":
          CLIParser.printHelp();
          Deno.exit(0);
          break;

        default:
          throw new Error(`Unknown option: ${arg}`);
      }

      i++;
    }

    // Validate configuration
    CLIParser.validateConfig(config);

    return config;
  }

  static printHelp(): void {
    console.log(
      `Usage: deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts [options]

Options:
  --single-file      Run tests one file at a time in debug mode
  --batch            Run tests in batches (default behavior)
  --batch-size N     Set batch size (default: 25)
  --legacy           Use legacy mode (all tests at once)
  --no-fallback      Disable automatic fallback to single-file mode
  --debug            Enable debug logging
  --silent           Enable silent mode (only show errors)
  --error-files-only Show only error files list (implies silent mode)
  --help, -h         Show this help message

Environment Variables:
  DEBUG=true         Enable debug logging
  LOG_LEVEL=debug    Enable debug logging

Default behavior: Batch mode with automatic fallback to single-file on error

Examples:
  # Default batch mode
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts

  # Single file mode with debug
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --single-file

  # Batch mode with custom batch size
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --batch --batch-size 15

  # Legacy mode (all tests at once)
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --legacy

  # With debug logging
  DEBUG=true deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts

  # With silent mode
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --silent

  # Show only error files list
  deno run --allow-read --allow-write --allow-run --allow-env scripts/local_ci.ts --error-files-only`,
    );
  }

  static validateConfig(config: CIConfig): void {
    // Ensure only one execution mode is selected
    const modeCount = [
      config.singleFileMode,
      config.batchMode,
      config.legacyMode,
    ].filter(Boolean).length;

    if (modeCount > 1) {
      throw new Error("Only one execution mode can be selected");
    }

    if (modeCount === 0) {
      // Default to batch mode if no mode specified
      config.batchMode = true;
    }

    // Validate batch size
    if (config.batchSize < 1 || config.batchSize > 100) {
      throw new Error("Batch size must be between 1 and 100");
    }

    // Validate log mode conflicts
    if (config.debug && config.silent && !config.errorFilesOnly) {
      throw new Error("Cannot use both --debug and --silent modes simultaneously");
    }

    if (config.debug && config.errorFilesOnly) {
      throw new Error("Cannot use both --debug and --error-files-only modes simultaneously");
    }
  }

  static getExecutionMode(config: CIConfig): ExecutionMode {
    if (config.singleFileMode) return "single-file";
    if (config.legacyMode) return "legacy";
    return "batch";
  }
}
