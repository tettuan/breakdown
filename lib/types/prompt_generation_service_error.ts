/**
 * @fileoverview Error types for PromptGenerationService domain
 *
 * This module defines all error types that can occur during
 * prompt generation service operations following Totality principle.
 *
 * @module types/prompt_generation_service_error
 */

/**
 * Base error for PromptGenerationService operations
 */
export interface PromptGenerationServiceError {
  readonly kind: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly details?: unknown;
}

/**
 * Error during variable validation
 */
export interface VariableValidationError extends PromptGenerationServiceError {
  readonly kind: "VariableValidationFailed";
  readonly validationErrors: Array<{ message: string }>;
}

/**
 * Error during template resolution
 */
export interface TemplateResolutionError extends PromptGenerationServiceError {
  readonly kind: "TemplateResolutionFailed";
  readonly templatePath?: string;
}

/**
 * Error during template selection
 */
export interface TemplateSelectionError extends PromptGenerationServiceError {
  readonly kind: "TemplateSelectionFailed";
  readonly reason: string;
}

/**
 * Error during template loading
 */
export interface TemplateLoadingError extends PromptGenerationServiceError {
  readonly kind: "TemplateLoadingFailed";
  readonly reason: string;
}

/**
 * Error during prompt generation
 */
export interface PromptGenerationError extends PromptGenerationServiceError {
  readonly kind: "PromptGenerationFailed";
  readonly reason: string;
}

/**
 * Error during service configuration
 */
export interface ServiceConfigurationError extends PromptGenerationServiceError {
  readonly kind: "ServiceConfigurationError";
  readonly configurationIssue: string;
}

/**
 * Union type for all PromptGenerationService errors
 */
export type PromptGenerationServiceErrors =
  | VariableValidationError
  | TemplateResolutionError
  | TemplateSelectionError
  | TemplateLoadingError
  | PromptGenerationError
  | ServiceConfigurationError;

/**
 * Factory functions for creating specific errors
 */
export const PromptGenerationServiceErrorFactory = {
  variableValidationFailed: (
    validationErrors: Array<{ message: string }>,
  ): VariableValidationError => ({
    kind: "VariableValidationFailed",
    message: `Variable validation failed: ${validationErrors.map((e) => e.message).join(", ")}`,
    validationErrors,
  }),

  templateResolutionFailed: (templatePath?: string): TemplateResolutionError => ({
    kind: "TemplateResolutionFailed",
    message: `Template resolution failed${templatePath ? ` for path: ${templatePath}` : ""}`,
    templatePath,
  }),

  promptGenerationFailed: (reason: string): PromptGenerationError => ({
    kind: "PromptGenerationFailed",
    message: `Prompt generation failed: ${reason}`,
    reason,
  }),

  serviceConfigurationError: (configurationIssue: string): ServiceConfigurationError => ({
    kind: "ServiceConfigurationError",
    message: `Service configuration error: ${configurationIssue}`,
    configurationIssue,
  }),

  templateSelectionFailed: (reason: string): TemplateSelectionError => ({
    kind: "TemplateSelectionFailed",
    message: `Template selection failed: ${reason}`,
    reason,
  }),

  templateLoadingFailed: (reason: string): TemplateLoadingError => ({
    kind: "TemplateLoadingFailed",
    message: `Template loading failed: ${reason}`,
    reason,
  }),
} as const;
