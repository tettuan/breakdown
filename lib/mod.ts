/**
 * Core module for Breakdown functionality.
 *
 * Provides core processing functions and type exports for the Breakdown tool.
 *
 * @example
 * ```ts
 * import { processWithPrompt, initWorkspace } from "@tettuan/breakdown/lib/mod.ts";
 * ```
 *
 * @module
 */

/**
 * Initializes a new workspace for Breakdown projects.
 * @see {@link ./workspace/workspace.ts}
 */
export { initWorkspace } from "./workspace/workspace.ts";

/**
 * Types representing the available demonstrative and layer types for Breakdown.
 * @see {@link ./types/mod.ts}
 */
export type { DemonstrativeType, LayerType } from "./types/mod.ts";
