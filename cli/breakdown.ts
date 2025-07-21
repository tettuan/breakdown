#!/usr/bin/env -S deno run -A
/**
 * Breakdown CLI - Main Entry Point
 *
 * Architecture:
 * - Delegates to BreakdownConfig, BreakdownParams, BreakdownPrompt
 * - Handles only config prefix detection and STDIN processing
 * - Follows the flow: config prefix � BreakdownParams � STDIN � BreakdownPrompt � output
 *
 * @module
 */

import { ConfigPrefixDetector } from "$lib/factory/config_prefix_detector.ts";
import { ConfigLoader } from "$lib/config/loader.ts";
import { BreakdownConfig as _BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^1.0.7";
import { showHelp as _showHelp, showVersion as _showVersion } from "$lib/cli/help.ts";
import { handleZeroParams } from "$lib/cli/handlers/zero_params_handler.ts";
import { handleOneParams } from "$lib/cli/handlers/one_params_handler.ts";
import { handleTwoParams } from "$lib/cli/handlers/two_params_handler.ts";
import { ParamsCustomConfig } from "$lib/types/params_custom_config.ts";
import { ResultStatus } from "$lib/types/enums.ts";
import { ConfigProfile } from "$lib/config/config_profile_name.ts";
import { formatError as _formatError, handleTwoParamsError } from "$lib/cli/error_handler.ts";
import type { Result } from "$lib/types/result.ts";
import type {
  ConfigurationError as _ConfigurationError,
  ProcessingError as _ProcessingError,
  ValidationError as _ValidationError,
} from "$lib/types/unified_error_types.ts";

/**
 * Default configuration profile name
 */
const DEFAULT_CONFIG_PROFILE = "default";

/**
 * Breakdown-specific error types following Totality principle
 */
type BreakdownError =
  | { kind: "ConfigProfileError"; message: string; cause: unknown }
  | { kind: "ConfigLoadError"; message: string }
  | { kind: "ParameterParsingError"; message: string }
  | { kind: "TwoParamsHandlerError"; cause: unknown }
  | { kind: "OneParamsHandlerError"; cause: unknown }
  | { kind: "ZeroParamsHandlerError"; cause: unknown }
  | { kind: "UnknownResultType"; type: string };

/**
 * Main entry point for the Breakdown prompt generation tool.
 *
 * This function orchestrates the complete Breakdown workflow:
 * 1. Detects configuration prefix from command line arguments
 * 2. Loads BreakdownConfig with appropriate settings
 * 3. Parses command line arguments using BreakdownParams
 * 4. Delegates to appropriate handlers based on parameter count
 * 5. Generates prompts using BreakdownPrompt with variable substitution
 * 6. Outputs the generated prompt to stdout
 *
 * The function integrates four JSR packages (@tettuan/breakdownconfig,
 * @tettuan/breakdownparams, @tettuan/breakdownprompt, @tettuan/breakdownlogger)
 * to provide a complete AI development assistance tool for prompt generation.
 *
 * @param args - Command line arguments. Defaults to Deno.args if not provided.
 *               Supports various patterns:
 *               - Zero params: Interactive mode or help/version display
 *               - One param: Single layer processing (e.g., "project")
 *               - Two params: Demonstrative type + layer processing (e.g., "to project")
 *               - Options: --help, --version, --verbose, --experimental, --config=prefix
 *
 * @returns Promise<void> - Resolves when processing completes successfully.
 *                         Generated prompts are written to stdout for piping.
 *
 * @throws {Error} When configuration loading fails, parameter parsing fails,
 *                 or prompt generation encounters errors.
 *
 * @example
 * ```typescript
 * // Basic usage - generate project-level prompt
 * await runBreakdown(["project"]);
 *
 * // Generate task breakdown prompt
 * await runBreakdown(["to", "task"]);
 *
 * // Use custom config with verbose output
 * await runBreakdown(["--config=custom", "--verbose", "to", "project"]);
 *
 * // Show help
 * await runBreakdown(["--help"]);
 * ```
 *
 * @example
 * ```bash
 * # CLI usage examples
 * deno run --allow-read breakdown to project > prompt.md
 * deno run --allow-read breakdown task --verbose
 * deno run --allow-read breakdown --config=myproject to issue
 * ```
 *
 * @see {@link https://jsr.io/@tettuan/breakdown} for complete documentation
 * @see {@link https://jsr.io/@tettuan/breakdownconfig} for configuration options
 * @see {@link https://jsr.io/@tettuan/breakdownparams} for parameter parsing
 * @see {@link https://jsr.io/@tettuan/breakdownprompt} for prompt generation
 */
export async function runBreakdown(
  args: string[] = Deno.args,
): Promise<Result<void, BreakdownError>> {
  // 1. Extract and create config profile name with Result pattern matching
  const detectedPrefix = ConfigPrefixDetector.detect(args);
  const configProfileResult = ConfigProfile.createOrError(
    detectedPrefix ?? DEFAULT_CONFIG_PROFILE,
  );

  if (!configProfileResult.ok) {
    const validationError = configProfileResult.error;
    let errorMessage = "Invalid config profile name";

    if (validationError && validationError.kind === "InvalidInput") {
      errorMessage = validationError.message || "Invalid input";
    } else if (validationError && validationError.kind === "EmptyValue") {
      errorMessage = `Empty value for field: ${validationError.field || "unknown"}`;
    }

    return {
      ok: false,
      error: {
        kind: "ConfigProfileError",
        message: errorMessage,
        cause: validationError,
      },
    };
  }

  const configProfile = configProfileResult.data;
  if (!configProfile) {
    return {
      ok: false,
      error: {
        kind: "ConfigProfileError",
        message: "Failed to create config profile",
        cause: configProfileResult.error,
      },
    };
  }

  // 2. Initialize BreakdownConfig with profile name (with error handling)
  let config: Record<string, unknown> = {};
  const breakdownConfigResult = await ConfigLoader.loadBreakdownConfig(
    configProfile.value,
    Deno.cwd(),
  );
  if (!breakdownConfigResult.ok) {
    const error = breakdownConfigResult.error;
    let errorMessage: string;

    if (error && typeof error === "object" && "kind" in error) {
      const errorObj = error as { kind: string; reason?: string; message?: string };
      if (errorObj.kind === "InvalidPath" && "reason" in errorObj) {
        errorMessage = (errorObj as { reason: string }).reason;
      } else if ("message" in errorObj) {
        errorMessage = (errorObj as { message: string }).message;
      } else {
        errorMessage = errorObj.kind;
      }
    } else {
      errorMessage = "Unknown configuration error";
    }

    console.warn(
      "⚠️ Configuration not found, using defaults:",
      errorMessage,
      configProfile.value ? `profile: ${configProfile.value}` : "no profile",
    );
    // Use empty configuration - ParamsCustomConfig will handle defaults appropriately
    config = {};
  } else {
    config = breakdownConfigResult.data;
  }

  // 3. Pass BreakdownConfig settings to BreakdownParams using ParamsCustomConfig
  // Fix the config structure - wrap in 'breakdown' key as expected by ParamsCustomConfig
  const wrappedConfig = { breakdown: config };
  const paramsConfigResult = ParamsCustomConfig.create(wrappedConfig);

  let customConfig;
  if (paramsConfigResult.status === ResultStatus.SUCCESS) {
    customConfig = paramsConfigResult.data; // undefined if no breakdown config, or CustomConfig if present
  } else {
    console.warn("⚠️ Configuration extraction failed:", paramsConfigResult.error?.message);
    customConfig = undefined; // Fall back to BreakdownParams defaults
  }

  const paramsParser = new ParamsParser(undefined, customConfig);

  const result = paramsParser.parse(args);

  // 4. Determine zero/one/two params and branch
  switch (result.type) {
    case "two": {
      const handlerResult = await handleTwoParams(result.params, config, result.options);
      if (!handlerResult.ok) {
        // Use centralized error handler
        if (!handleTwoParamsError(handlerResult.error, config)) {
          return {
            ok: false,
            error: {
              kind: "TwoParamsHandlerError",
              cause: handlerResult.error,
            },
          };
        }
        // Error was handled gracefully as warning
      }
      return { ok: true, data: undefined };
    }
    case "one": {
      await handleOneParams(result.params, config, result.options);
      return { ok: true, data: undefined };
    }
    case "zero": {
      // Pass original args for backward compatibility
      await handleZeroParams(args, config, result.options);
      return { ok: true, data: undefined };
    }
    case "error": {
      return {
        ok: false,
        error: {
          kind: "ParameterParsingError",
          message: result.error?.message || "Unknown error",
        },
      };
    }
    default: {
      // TypeScript exhaustive check - this should never be reached
      return {
        ok: false,
        error: {
          kind: "UnknownResultType",
          type: "type" in result ? String(result.type) : "unknown",
        },
      };
    }
  }
}

// Enhanced Entry Point Pattern using Entry Point Manager
if (import.meta.main) {
  // Dynamic import to avoid circular dependencies
  const { EntryPointManager, getEntryPointErrorMessage } = await import(
    "$lib/cli/entry_point_manager.ts"
  );

  // Detect environment and create appropriate manager
  const isDevelopment = Deno.env.get("DENO_ENV") === "development" ||
    Deno.args.includes("--verbose") ||
    Deno.args.includes("--dev");

  // Create a wrapper function that handles Result type
  const mainFunction = async (args: string[]) => {
    const result = await runBreakdown(args);
    if (!result.ok) {
      throw new Error(`Breakdown execution failed: ${JSON.stringify(result.error)}`);
    }
  };

  const manager = isDevelopment
    ? EntryPointManager.createDevelopment(mainFunction)
    : EntryPointManager.createStandard(false, mainFunction);

  // Start application with enhanced entry point management
  const result = await manager.start();

  if (!result.ok) {
    console.error("Entry Point Error:", getEntryPointErrorMessage(result.error));
    // Exit with error code - necessary evil for CLI applications
    Deno.exit(1);
  }
}
