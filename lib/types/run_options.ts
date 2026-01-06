/**
 * @fileoverview Options for runBreakdown function
 *
 * This module defines the options interface for controlling
 * the output behavior of the runBreakdown function.
 *
 * ## Design Principle: I/O Boundary Separation
 *
 * Input (args) and Output (stdout/return) are controlled at the same layer (runBreakdown).
 * Internal layers are pure functions with no side effects.
 *
 * ```
 * runBreakdown(args, options?)      ← I/O boundary layer
 *   │
 *   ├─ Input:  receives args
 *   │
 *   ├─ Internal processing (pure data transformation)
 *   │    └─ handleTwoParams → Orchestrator → Generator
 *   │         └─ return promptContent (data only, no side effects)
 *   │
 *   └─ Output: determined by returnMode
 *        ├─ true  → return ok(promptContent)
 *        └─ false → stdout.write(promptContent)
 * ```
 *
 * @module types/run_options
 */

/**
 * Options for runBreakdown function
 *
 * @example Basic usage - return prompt content instead of stdout
 * ```typescript
 * import { runBreakdown } from "@tettuan/breakdown";
 *
 * // Default behavior: output to stdout
 * const result1 = await runBreakdown(["to", "project"]);
 * // result1.data is undefined
 *
 * // Return mode: get prompt content as return value
 * const result2 = await runBreakdown(["to", "project"], { returnMode: true });
 * // result2.data is the prompt content string
 * ```
 */
export interface RunBreakdownOptions {
  /**
   * When true, prompt content is returned as Result.data instead of writing to stdout.
   *
   * | returnMode | stdout | Result.data |
   * |------------|--------|-------------|
   * | false/omit | prompt output | undefined |
   * | true | no output | prompt string |
   *
   * @default false
   */
  returnMode?: boolean;
}
