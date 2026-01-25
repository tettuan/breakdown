#!/usr/bin/env -S deno run -A
/**
 * Breakdown CLI - Main Entry Point
 *
 * Architecture:
 * - Delegates to BreakdownConfig, BreakdownParams, BreakdownPrompt
 * - Handles only config prefix detection and STDIN processing
 * - Follows the flow: config prefix -> BreakdownParams -> STDIN -> BreakdownPrompt -> output
 *
 * @module
 */

import { ConfigPrefixDetector } from "$lib/factory/config_prefix_detector.ts";
import { ConfigLoader } from "$lib/config/loader.ts";
import type { BreakdownConfig as _BreakdownConfig } from "@tettuan/breakdownconfig";
import { ParamsParser } from "@tettuan/breakdownparams";
import type { showHelp as _showHelp, showVersion as _showVersion } from "$lib/cli/help.ts";
import { handleZeroParams } from "$lib/cli/handlers/zero_params_handler.ts";
import { handleOneParams } from "$lib/cli/handlers/one_params_handler.ts";
import { handleTwoParams } from "$lib/cli/handlers/two_params_handler.ts";
import { ParamsCustomConfig } from "$lib/types/params_custom_config.ts";
import { ResultStatus } from "$lib/types/enums.ts";
import { ConfigProfile } from "$lib/config/config_profile_name.ts";
import { type formatError as _formatError, handleTwoParamsError } from "$lib/cli/error_handler.ts";
import type { Result } from "$lib/types/result.ts";
import type {
  ConfigurationError as _ConfigurationError,
  ProcessingError as _ProcessingError,
  ValidationError as _ValidationError,
} from "$lib/types/unified_error_types.ts";
import type { RunBreakdownOptions } from "$lib/types/run_options.ts";

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
 * ## Architecture: I/O Boundary Separation
 *
 * This function is the I/O boundary layer where Input and Output are controlled:
 * - Input: receives args
 * - Internal processing: pure data transformation (no side effects)
 * - Output: determined by options.returnMode
 *
 * Internal layers (handleTwoParams, Orchestrator, etc.) are pure functions
 * that only transform data and return strings.
 *
 * ## Workflow
 *
 * 1. Detects configuration prefix from command line arguments
 * 2. Loads BreakdownConfig with appropriate settings
 * 3. Parses command line arguments using BreakdownParams
 * 4. Delegates to appropriate handlers based on parameter count
 * 5. Generates prompts using BreakdownPrompt with variable substitution
 * 6. Outputs based on returnMode: stdout (default) or return value
 *
 * ## Integration
 *
 * Integrates four JSR packages (@tettuan/breakdownconfig,
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
 * @param options - Options for controlling output behavior
 * @param options.returnMode - When true, returns prompt content as Result.data instead of writing to stdout
 *
 * @returns Promise<Result<string | undefined, BreakdownError>>
 *          - When returnMode=true: data is the prompt string
 *          - When returnMode=false/omit: data is undefined (prompt written to stdout)
 *
 * @example Default behavior - output to stdout
 * ```typescript
 * const result = await runBreakdown(["to", "project"]);
 * // result.data is undefined, prompt was written to stdout
 * ```
 *
 * @example Return mode - get prompt as return value
 * ```typescript
 * const result = await runBreakdown(["to", "project"], { returnMode: true });
 * if (result.ok) {
 *   console.log("Prompt content:", result.data);
 * }
 * ```
 *
 * @example CLI usage
 * ```bash
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
  options?: RunBreakdownOptions,
): Promise<Result<string | undefined, BreakdownError>> {
  // Debug flag
  const isDebug = Deno.env.get("LOG_LEVEL") === "debug";

  if (isDebug) {
    console.log("[breakdown.ts] Starting runBreakdown with args:", JSON.stringify(args, null, 2));
  }

  // 1. Extract and create config profile name with Result pattern matching
  const detectedPrefix = ConfigPrefixDetector.detect(args);

  if (isDebug) {
    console.log("[breakdown.ts] Detected config prefix:", detectedPrefix ?? "null (using default)");
  }

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

  if (isDebug) {
    console.log("[breakdown.ts] ConfigProfile created:", configProfile.value);
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
      "[Warning] Configuration not found, using defaults:",
      errorMessage,
      configProfile.value ? `profile: ${configProfile.value}` : "no profile",
    );
    // Use empty configuration - ParamsCustomConfig will handle defaults appropriately
    config = {};
  } else {
    config = breakdownConfigResult.data;

    if (isDebug) {
      console.log("[breakdown.ts] BreakdownConfig loaded:", JSON.stringify(config, null, 2));
    }
  }

  // 3. Pass BreakdownConfig settings to BreakdownParams using ParamsCustomConfig
  // Fix the config structure - wrap in 'breakdown' key as expected by ParamsCustomConfig
  const wrappedConfig = { breakdown: config };
  const paramsConfigResult = ParamsCustomConfig.create(wrappedConfig);

  let customConfig;
  if (paramsConfigResult.status === ResultStatus.SUCCESS) {
    customConfig = paramsConfigResult.data; // undefined if no breakdown config, or CustomConfig if present
  } else {
    console.warn("[Warning] Configuration extraction failed:", paramsConfigResult.error?.message);
    customConfig = undefined; // Fall back to BreakdownParams defaults
  }

  const paramsParser = new ParamsParser(undefined, customConfig);

  if (isDebug) {
    console.log("[breakdown.ts -> ParamsParser] Input:", {
      args: args,
      customConfig: customConfig
        ? {
          params: customConfig.params,
          validation: customConfig.validation,
          errorHandling: customConfig.errorHandling,
        }
        : "undefined (using defaults)",
    });
  }

  const result = paramsParser.parse(args);

  if (isDebug) {
    console.log("[ParamsParser -> breakdown.ts] Output:", JSON.stringify(result, null, 2));
  }

  // 4. Determine zero/one/two params and branch
  switch (result.type) {
    case "two": {
      if (isDebug) {
        console.log("[breakdown.ts] Calling handleTwoParams with:", {
          params: result.params,
          options: result.options,
        });
      }

      const handlerResult = await handleTwoParams(result.params, config, result.options);

      if (isDebug) {
        console.log(
          "[breakdown.ts] handleTwoParams result:",
          handlerResult.ok ? "Success" : "Error",
        );
      }

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
        return { ok: true, data: undefined };
      }

      // I/O Boundary: Decide output based on returnMode
      const promptContent = handlerResult.data;
      if (options?.returnMode) {
        // Return mode: return prompt content as Result.data
        return { ok: true, data: promptContent };
      } else {
        // Default mode: write to stdout
        const encoder = new TextEncoder();
        await Deno.stdout.write(encoder.encode(promptContent));
        return { ok: true, data: undefined };
      }
    }
    case "one": {
      if (isDebug) {
        console.log("[breakdown.ts] Calling handleOneParams with:", {
          params: result.params,
          options: result.options,
        });
      }

      await handleOneParams(result.params, config, result.options);
      return { ok: true, data: undefined };
    }
    case "zero": {
      if (isDebug) {
        console.log("[breakdown.ts] Calling handleZeroParams with options:", result.options);
      }

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
