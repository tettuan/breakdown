/**
 * Handler for zero parameters case
 * 
 * This module handles the case when no command line parameters are provided,
 * managing help, version, and usage display based on parsed options.
 * 
 * @module lib/cli/handlers/zero_params_handler
 */

import { showHelp, showUsage, showVersion } from "$lib/cli/help.ts";

/**
 * Handle zero parameters case
 * 
 * @param _args - Original command line arguments (for compatibility)
 * @param _config - Configuration object from BreakdownConfig
 * @param options - Parsed options from BreakdownParams
 */
export function handleZeroParams(
  _args: string[],
  _config: Record<string, unknown>,
  options: Record<string, unknown> | null | undefined,
): void {
  // Handle null/undefined options gracefully
  const safeOptions = options || {};
  
  // Use options from BreakdownParams result instead of checking args directly
  if (safeOptions.help) {
    showHelp();
  } else if (safeOptions.version) {
    showVersion();
  } else {
    showUsage();
  }
}
