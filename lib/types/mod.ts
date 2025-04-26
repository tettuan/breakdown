/**
 * Type definitions for the Breakdown tool.
 *
 * @module
 */

/**
 * Type representing the available demonstrative command types for Breakdown.
 * - "to": Convert to next layer
 * - "summary": Summarize the current layer
 * - "defect": Analyze defects in the current layer
 * - "init": Initialize the workspace
 */
export type DemonstrativeType = "to" | "summary" | "defect" | "init";

/**
 * Type representing the available layer types for Breakdown.
 * - "projects": Project layer
 * - "issues": Issue layer
 * - "tasks": Task layer
 * - "temp": Temporary layer (for intermediate or temporary data)
 */
export type LayerType = "projects" | "issues" | "tasks" | "temp";
