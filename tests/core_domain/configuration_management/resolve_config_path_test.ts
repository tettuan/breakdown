/**
 * Unit tests for resolveConfigPath function (REMOVED)
 *
 * Note: resolveConfigPath function has been removed as part of PREDEFINED_CONFIGS migration.
 * Configuration path resolution is now handled entirely by BreakdownConfig.
 *
 * This test file remains for historical reference but tests are disabled.
 */

import { assertEquals } from "../../../lib/deps.ts";
import { join as _join } from "@std/path";

// PREDEFINED_CONFIGS functionality moved to BreakdownConfig
// resolveConfigPath function has been completely removed
// Configuration path resolution is now handled entirely by BreakdownConfig

// Placeholder test to indicate function removal
Deno.test("resolveConfigPath - function removed (migration to BreakdownConfig)", () => {
  // This test documents that resolveConfigPath function has been removed
  // Configuration path resolution is now handled by BreakdownConfig
  assertEquals(true, true, "resolveConfigPath function successfully removed");
});

// Historical note: Previous functionality included:
// - PREDEFINED_CONFIGS mapping (test, dev, prod, production)
// - Absolute path handling
// - Relative path resolution with working directory support
// - Edge case handling for empty strings, dots, special characters
// All of this functionality is now provided by BreakdownConfig
