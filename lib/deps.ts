/**
 * External dependencies for the Breakdown tool.
 * This file centralizes all external dependencies and re-exports them.
 */

// Standard Deno modules with aliasing
export { ensureDir, exists } from "jsr:@std/fs@0.224.0";

export { dirname, fromFileUrl, join } from "@std/path";

export { parse as parseFlags } from "@std/flags";

// JSR packages
export {
  type AppConfig,
  BreakdownConfig,
  type MergedConfig,
  type UserConfig,
} from "jsr:@tettuan/breakdownconfig@1.0.10";

export {
  type ParamsParser,
  ParamsParser as BreakdownParams,
  type ParamsResult,
} from "jsr:@tettuan/breakdownparams@0.1.11";

export * from "jsr:@tettuan/breakdownprompt@1.1.2";
