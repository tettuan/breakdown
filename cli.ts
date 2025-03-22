/**
 * Breakdown CLI
 * 
 * Command-line interface for the Breakdown tool.
 * See docs/breakdown/breakdown.ja.md for specifications.
 */

import { runBreakdown } from "./lib/cli/breakdown.ts";

try {
  await runBreakdown(Deno.args);
} catch (err) {
  console.error(err);
  Deno.exit(1);
} 