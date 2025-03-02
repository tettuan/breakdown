#!/usr/bin/env -S deno run -A

/**
 * Breakdown CLI Tool - Entry Point
 * 
 * This file serves as the main entry point for the Breakdown CLI tool.
 * It directly imports and uses the implementation from cli/breakdown.ts.
 */

// 直接インポートして依存関係を明示する
import { runBreakdown } from "./cli/breakdown.ts";

if (import.meta.main) {
  try {
    // 直接関数を呼び出す
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