/**
 * Dependencies for the Breakdown tool
 *
 * Re-exports all required dependencies with proper versioning and structure
 * as specified in import_policy.ja.md
 */

// JSR packages (direct imports as they're already mapped in deno.json)
export * from "@tettuan/breakdownconfig";
export * from "@tettuan/breakdownlogger";
export * from "@tettuan/breakdownparams";
export * from "@tettuan/breakdownprompt";

// JSR standard library
export { ensureDir, exists, walk } from "@std/fs";
export { dirname, join, resolve } from "@std/path";
export { parse } from "@std/flags";
export {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";

// Third-party dependencies
// [2024-05-05] cliffy Command import removed: Not used anywhere in the codebase, only re-exported in deps.ts. All CLI and command logic uses Deno.Command or internal logic. See https://github.com/c4spar/deno-cliffy for latest. If CLI framework is needed in the future, consider JSR version.
// export { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

// TODO: Add required JSR package imports as specified in breakdown.ja.md:
// - @tettuan/breakdownconfig
// - @tettuan/breakdownlogger
// - @tettuan/breakdownparams
// - @tettuan/breakdownprompt

// Third-party dependencies are managed through JSR imports in deno.json
// See import_policy.ja.md for import guidelines

// Remove the incorrect Command import
// export { Command } from "https://deno.land/std@0.210.0/cli/mod.ts";

// TODO: Add proper error types as specified in deno.ja.md
// TODO: Add proper test utilities as specified in testing.ja.md

// Third-party dependencies
// (Add as needed)
