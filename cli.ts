/**
 * Breakdown CLI - Command Line Interface
 * 
 * This module provides the command line interface for the Breakdown tool.
 * It directly imports and uses the implementation from lib/cli/breakdown.ts.
 */

import { runBreakdown } from "$lib/cli/breakdown.ts";

if (import.meta.main) {
  try {
    await runBreakdown(Deno.args);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to execute breakdown CLI: ${error.message}`);
    } else {
      console.error("An unknown error occurred while executing breakdown CLI");
    }
    Deno.exit(1);
  }
} 