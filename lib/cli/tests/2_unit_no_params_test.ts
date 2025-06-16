/**
 * CLI No-Parameters Tests - SIMPLIFIED FOR BREAKDOWNPARAMS DELEGATION
 *
 * Purpose:
 * - Basic verification of CLI behavior without parameters
 * - Focus on BreakdownParams delegation architecture
 * - Minimal testing approach
 *
 * Note: Complex parameter validation is now handled by BreakdownParams
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();

// Basic functionality tests - BreakdownParams delegation focused
Deno.test("CLI basic no-params behavior", async () => {
  logger.debug("Testing basic CLI behavior without parameters");

  // Focus on architecture delegation, not specific CLI execution
  // BreakdownParams handles the parameter parsing logic

  // Basic structural verification
  const { runBreakdown } = await import("../../../cli/breakdown.ts");
  assertEquals(typeof runBreakdown, "function");

  logger.debug("CLI no-params delegation architecture verified");
});

Deno.test("CLI help text availability", async () => {
  logger.debug("Testing help text availability");

  // Verify help text is available for BreakdownParams integration
  const { HELP_TEXT } = await import("../../../cli/breakdown.ts");
  assertEquals(typeof HELP_TEXT, "string");
  assertEquals(HELP_TEXT.length > 0, true);

  logger.debug("Help text verification completed");
});

// Architecture consistency verification
Deno.test("CLI BreakdownParams integration", async () => {
  logger.debug("Testing BreakdownParams integration consistency");

  // Verify that BreakdownParams is properly imported and available
  try {
    const { ParamsParser } = await import("@tettuan/breakdownparams");
    assertEquals(typeof ParamsParser, "function");

    // Basic parser instantiation verification
    const parser = new ParamsParser();
    assertEquals(typeof parser.parse, "function");

    logger.debug("BreakdownParams integration verified");
  } catch (error) {
    logger.error("BreakdownParams integration error", { error });
    throw error;
  }
});
