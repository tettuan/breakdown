#!/usr/bin/env -S deno run -A

/**
 * Breakdown CLI
 *
 * Command-line interface for the Breakdown tool.
 * See docs/breakdown/breakdown.ja.md for specifications.
 */

import { runBreakdown } from "./cli/breakdown.ts";

if (import.meta.main) {
  try {
    await runBreakdown(Deno.args);
  } catch (err) {
    console.error(err);
    Deno.exit(1);
  }
}
