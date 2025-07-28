/**
 * @fileoverview Prompt Generation Domain Service Interface
 *
 * This module defines the domain service interface for prompt generation,
 * following DDD principles and Totality pattern. It provides a clear boundary
 * between the domain logic and infrastructure concerns.
 *
 * @module prompt/prompt_generation_service
 */

import type { Result } from "../types/result.ts";
import type { PromptError, PromptResult } from "../types/prompt_types.ts";

/**
 * Prompt generation context containing all necessary data
 *
 * This represents the aggregate of all data needed for prompt generation,
 * avoiding direct dependency on infrastructure-specific types.
 */
export interface PromptGenerationContext {
  /** Path to the prompt template file */
  promptFilePath: string;
  /** Path to the input file (or "-" for stdin) */
  inputFilePath: string;
  /** Path where output will be saved */
  outputFilePath: string;
  /** Path to the schema file for validation */
  schemaFilePath: string;
  /** Optional user variables for template substitution */
  userVariables?: Record<string, string>;
  /** Input text content (from stdin or file) */
  inputText?: string;
}

/**
 * Validation context for prompt generation
 */
export interface PromptValidationContext {
  /** Whether the base directory is valid */
  hasValidBaseDir: boolean;
  /** Base directory error if any */
  baseDirError?: string;
}

/**
 * Prompt Generation Domain Service Interface
 *
 * This interface defines the contract for prompt generation services,
 * ensuring clear separation of concerns and following DDD principles.
 *
 * Responsibilities:
 * - Validate prompt generation context
 * - Generate prompts from templates and variables
 * - Handle errors in a type-safe manner
 */
export interface PromptGenerationService {
  /**
   * Validate the prompt generation context
   *
   * @param context - The prompt generation context
   * @param validationContext - Additional validation context
   * @returns Result indicating validation success or errors
   */
  validateContext(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Result<void, PromptError>;

  /**
   * Generate a prompt from the given context
   *
   * @param context - The prompt generation context
   * @returns Result containing the generated prompt or error
   */
  generatePrompt(
    context: PromptGenerationContext,
  ): Promise<Result<PromptResult, PromptError>>;

  /**
   * Validate and generate prompt in one operation
   *
   * @param context - The prompt generation context
   * @param validationContext - Additional validation context
   * @returns Result containing the generated prompt or error
   */
  validateAndGenerate(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Promise<Result<PromptResult, PromptError>>;
}

/**
 * Factory for creating PromptGenerationService instances
 *
 * This factory provides a way to create service instances
 * without exposing concrete implementations.
 */
export interface PromptGenerationServiceFactory {
  /**
   * Create a new PromptGenerationService instance
   *
   * @returns A new service instance
   */
  create(): PromptGenerationService;
}
