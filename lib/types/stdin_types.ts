/**
 * @fileoverview STDIN State Types - Following Totality Principle
 *
 * This module defines types for representing STDIN state explicitly,
 * distinguishing between:
 * - STDIN provided with content
 * - STDIN provided but empty
 * - STDIN not provided at all
 *
 * This follows the totality principle by making all states explicit
 * and exhaustively handled.
 *
 * @module lib/types/stdin_types
 */

/**
 * STDIN State - Discriminated Union following Totality Principle
 *
 * Explicitly represents all possible STDIN states:
 * - "provided": STDIN was provided (may be empty or have content)
 * - "not_provided": STDIN was not provided at all
 * - "skipped": STDIN was skipped due to environment (CI, test, etc.)
 */
export type StdinState =
  | {
    kind: "provided";
    content: string; // Can be empty string
    source: "pipe" | "redirect" | "terminal";
  }
  | {
    kind: "not_provided";
    reason: "no_pipe" | "terminal_input" | "explicit_skip";
  }
  | {
    kind: "skipped";
    reason: "ci_environment" | "test_environment" | "env_variable";
    details?: string;
  };

/**
 * Helper functions for creating StdinState values
 */
export const StdinState = {
  /**
   * Create a "provided" state
   */
  provided(content: string, source: "pipe" | "redirect" | "terminal" = "pipe"): StdinState {
    return { kind: "provided", content, source };
  },

  /**
   * Create a "not_provided" state
   */
  notProvided(reason: "no_pipe" | "terminal_input" | "explicit_skip" = "no_pipe"): StdinState {
    return { kind: "not_provided", reason };
  },

  /**
   * Create a "skipped" state
   */
  skipped(
    reason: "ci_environment" | "test_environment" | "env_variable",
    details?: string,
  ): StdinState {
    return { kind: "skipped", reason, details };
  },

  /**
   * Check if STDIN has content
   */
  hasContent(state: StdinState): boolean {
    return state.kind === "provided" && state.content.length > 0;
  },

  /**
   * Get content or default value
   */
  getContentOrDefault(state: StdinState, defaultValue: string): string {
    return state.kind === "provided" ? state.content : defaultValue;
  },

  /**
   * Convert to legacy string representation
   * Used for backward compatibility with existing code
   */
  toLegacyString(state: StdinState): string | null {
    switch (state.kind) {
      case "provided":
        return state.content;
      case "not_provided":
      case "skipped":
        return null;
    }
  },
} as const;

/**
 * Type guard for StdinState
 */
export function isStdinState(value: unknown): value is StdinState {
  if (!value || typeof value !== "object") return false;
  if (!("kind" in value)) return false;

  const state = value as { kind: string };
  switch (state.kind) {
    case "provided":
      return "content" in state && typeof (state as Record<string, unknown>).content === "string" &&
        "source" in state;
    case "not_provided":
      return "reason" in state;
    case "skipped":
      return "reason" in state;
    default:
      return false;
  }
}
