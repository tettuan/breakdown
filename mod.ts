/**
 * Breakdown - A tool for breaking down projects into manageable tasks
 * 
 * This is the main entry point for the library.
 */

// Export main functionality
export { runBreakdown } from "./lib/cli/breakdown.ts";

// Export core functionality
export { Workspace } from "./lib/core/workspace.ts";

export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// CLI functionality is not exported from the main module
// Use cli.ts for CLI functionality 