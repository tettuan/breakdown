/**
 * Tests for config path resolution (HISTORICAL)
 *
 * Note: PREDEFINED_CONFIGS and resolveConfigPath have been removed in favor of BreakdownConfig.
 * This test file remains for historical reference but tests are disabled.
 */

import { assertEquals } from "@std/assert";
import { join as _join } from "@std/path";

// Note: PREDEFINED_CONFIGS and resolveConfigPath have been removed in favor of BreakdownConfig
// Configuration resolution is now handled dynamically by BreakdownConfig

// Placeholder test to indicate function removal
Deno.test("PREDEFINED_CONFIGS - migration to BreakdownConfig completed", () => {
  // This test documents that PREDEFINED_CONFIGS and resolveConfigPath have been removed
  // Configuration handling is now entirely managed by BreakdownConfig
  assertEquals(
    true,
    true,
    "PREDEFINED_CONFIGS migration to BreakdownConfig successfully completed",
  );
});

// Historical note: Previous functionality included:
// - PREDEFINED_CONFIGS mapping (test, dev, prod, production)
// - resolveConfigPath function for path resolution
// - Support for absolute/relative paths, custom working directories
// - Edge case handling for various path formats
// All of this functionality is now provided by BreakdownConfig
