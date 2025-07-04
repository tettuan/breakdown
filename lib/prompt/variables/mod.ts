/**
 * @fileoverview Prompt variables module exports
 *
 * This module provides all prompt variables implementations
 * and re-exports the PromptVariables interface.
 *
 * @module prompt/variables
 */

// Re-export the PromptVariables interface
export type { PromptVariables } from "../../types/prompt_types.ts";

// Export prompt variables implementations
export { StandardPromptVariables } from "./standard_prompt_variables.ts";
export { UserPromptVariables } from "./user_prompt_variables.ts";
export { CompositePromptVariables } from "./composite_prompt_variables.ts";
export { StdinPromptVariables } from "./stdin_prompt_variables.ts";
export { FilePathPromptVariables } from "./filepath_prompt_variables.ts";

// Export Duck Typing implementation and utilities
export {
  createPromptVariables,
  DuckTypingPromptVariables,
  isPromptVariables,
  isPromptVariablesLike,
  mergePromptVariables,
} from "./duck_typing_prompt_variables.ts";
