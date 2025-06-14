/**
 * Type definitions for the Breakdown tool.
 *
 * This module contains core type definitions used throughout the Breakdown tool.
 * It defines the fundamental types for commands and layers that structure the
 * application's functionality.
 *
 * @example
 * ```ts
 * import { DemonstrativeType, LayerType } from "@tettuan/breakdown/lib/types/mod.ts";
 *
 * const command: DemonstrativeType = "to";
 * const layer: LayerType = "project";
 * ```
 *
 * @module
 */

/**
 * Type representing the available demonstrative command types for Breakdown.
 * These commands define the core operations that can be performed by the tool.
 *
 * @property {"to"} - Convert to next layer
 * @property {"summary"} - Summarize the current layer
 * @property {"defect"} - Analyze defects in the current layer
 * @property {"init"} - Initialize the workspace
 * @property {"find"} - Find and analyze specific patterns (e.g., bugs)
 *
 * @example
 * ```ts
 * const command: DemonstrativeType = "to";
 * ```
 */
export type DemonstrativeType = "to" | "summary" | "defect" | "init" | "find";

/**
 * Type representing the available layer types for Breakdown.
 * These layers define the hierarchical structure of the breakdown process.
 *
 * @property {"project"} - Project layer, top-level organizational unit
 * @property {"issue"} - Issue layer, represents specific problems or features
 * @property {"task"} - Task layer, represents actionable items
 * @property {"bugs"} - Bugs layer, for tracking and analyzing bugs or defects
 * @property {"temp"} - Temporary layer, for intermediate or temporary data
 *
 * @example
 * ```ts
 * const layer: LayerType = "project";
 * ```
 */
export type LayerType = "project" | "issue" | "task" | "bugs" | "temp";
