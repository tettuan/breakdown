/**
 * Handler for one parameter case
 *
 * This module handles commands with a single parameter, such as 'init'.
 *
 * @module lib/cli/handlers/one_params_handler
 */

import { initializeBreakdownConfiguration } from "../initialization/workspace_initializer.ts";

/**
 * Handle one parameter case
 *
 * @param params - Command line parameters from BreakdownParams
 * @param config - Configuration object from BreakdownConfig
 * @param _options - Parsed options from BreakdownParams
 */
export async function handleOneParams(
  params: string[],
  _config: Record<string, unknown>,
  _options: Record<string, unknown>,
): Promise<void> {
  if (params.length >= 1) {
    const [command] = params;

    // Handle common one-parameter commands
    if (command === "init") {
      await initializeBreakdownConfiguration();
    } else {
      // Future: Handle other single parameter commands
    }
  }
}
