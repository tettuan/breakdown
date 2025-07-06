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
import { loadBreakdownConfig } from "$lib/config/loader.ts";
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^1.0.3";
import { showHelp, showVersion } from "$lib/cli/help.ts";
import { handleZeroParams } from "$lib/cli/handlers/zero_params_handler.ts";
import { handleOneParams } from "$lib/cli/handlers/one_params_handler.ts";
import { handleTwoParams } from "$lib/cli/handlers/two_params_handler.ts";
import { ParamsCustomConfig } from "$lib/types/params_custom_config.ts";
import { ResultStatus } from "$lib/types/enums.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";
import { formatError, handleTwoParamsError } from "$lib/cli/error_handler.ts";

/**
 * Main CLI entry point for direct execution
 */
async function main() {
  await runBreakdown();
}

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
export async function runBreakdown(args: string[] = Deno.args): Promise<void> {
  try {
    // 1. Extract and create config profile name with Result pattern matching
    const configProfileNameResult = ConfigProfileName.create(ConfigPrefixDetector.detect(args));
    
    if (!configProfileNameResult.ok) {
      console.error("❌ Invalid config profile name:", configProfileNameResult.error.message);
      Deno.exit(1);
    }
    
    const configProfileName = configProfileNameResult.data;

    // 2. Initialize BreakdownConfig with profile name (with error handling)
    let config: Record<string, unknown> = {};
    try {
      // Use the profile name value directly for BreakdownConfig
      config = await loadBreakdownConfig(configProfileName.value, Deno.cwd());
    } catch (error) {
      console.warn(
        "⚠️ Configuration not found, using defaults:",
        error instanceof Error ? error.message : String(error),
        configProfileName.value ? `profile: ${configProfileName.value}` : "no profile",
      );
      // Use empty configuration - ParamsCustomConfig will handle defaults appropriately
      config = {};
    }

    // 3. Pass BreakdownConfig settings to BreakdownParams using ParamsCustomConfig
    const configResult = ParamsCustomConfig.create(config);

    let customConfig;
    if (configResult.status === ResultStatus.SUCCESS) {
      customConfig = configResult.data; // undefined if no breakdown config, or CustomConfig if present
    } else {
      console.warn("⚠️ Configuration extraction failed:", configResult.error?.message);
      customConfig = undefined; // Fall back to BreakdownParams defaults
    }

    const paramsParser = new ParamsParser(undefined, customConfig);

    //     console.log("🔍 DEBUG: Calling parse() with args:", args);
    const result = paramsParser.parse(args);
    //     console.log("🔍 DEBUG: ParamsParser result:", JSON.stringify(result, null, 2));

    // 4. Determine zero/one/two params and branch
    if (result.type === "two") {
      const handlerResult = await handleTwoParams(result.params, config, result.options);
      if (!handlerResult.ok) {
        // Use centralized error handler
        if (!handleTwoParamsError(handlerResult.error, config)) {
          throw new Error(`Two params handler error: ${formatError(handlerResult.error)}`);
        }
        return; // Error was handled gracefully as warning
      }
    } else if (result.type === "one") {
      await handleOneParams(result.params, config, result.options);
    } else if (result.type === "zero") {
      // Pass original args for backward compatibility
      await handleZeroParams(args, config, result.options);
    } else if (result.type === "error") {
      throw new Error(`Parameter parsing error: ${result.error?.message || "Unknown error"}`);
    } else {
      throw new Error(`Unknown result type: ${result.type}`);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

if (import.meta.main) {
  await main();
}
