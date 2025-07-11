/**
 * @fileoverview Error types for PromptVariablesFactory domain
 *
 * This module defines all error types that can occur during
 * prompt variables factory operations following Totality principle.
 *
 * @module types/prompt_variables_factory_error
 */

/**
 * Base error for PromptVariablesFactory operations
 */
export interface PromptVariablesFactoryError {
  readonly kind: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Error during path options creation
 */
export interface PathOptionsCreationError extends PromptVariablesFactoryError {
  readonly kind: "PathOptionsCreationFailed";
  readonly pathOptionsError: string;
}

/**
 * Error during template resolver creation
 */
export interface TemplateResolverCreationError extends PromptVariablesFactoryError {
  readonly kind: "TemplateResolverCreationFailed";
  readonly resolverError: string;
}

/**
 * Error during schema resolver creation
 */
export interface SchemaResolverCreationError extends PromptVariablesFactoryError {
  readonly kind: "SchemaResolverCreationFailed";
  readonly resolverError: string;
}

/**
 * Error when prompt file path is not resolved
 */
export interface PromptFilePathNotResolvedError extends PromptVariablesFactoryError {
  readonly kind: "PromptFilePathNotResolved";
}

/**
 * Error when input file path is not resolved
 */
export interface InputFilePathNotResolvedError extends PromptVariablesFactoryError {
  readonly kind: "InputFilePathNotResolved";
}

/**
 * Error when output file path is not resolved
 */
export interface OutputFilePathNotResolvedError extends PromptVariablesFactoryError {
  readonly kind: "OutputFilePathNotResolved";
}

/**
 * Error when schema file path is not resolved
 */
export interface SchemaFilePathNotResolvedError extends PromptVariablesFactoryError {
  readonly kind: "SchemaFilePathNotResolved";
}

/**
 * Error during prompt path resolution
 */
export interface PromptPathResolutionError extends PromptVariablesFactoryError {
  readonly kind: "PromptPathResolutionFailed";
  readonly details: string;
}

/**
 * Error during input path resolution
 */
export interface InputPathResolutionError extends PromptVariablesFactoryError {
  readonly kind: "InputPathResolutionFailed";
  readonly details: string;
}

/**
 * Error during output path resolution
 */
export interface OutputPathResolutionError extends PromptVariablesFactoryError {
  readonly kind: "OutputPathResolutionFailed";
  readonly details: string;
}

/**
 * Error during schema path resolution
 */
export interface SchemaPathResolutionError extends PromptVariablesFactoryError {
  readonly kind: "SchemaPathResolutionFailed";
  readonly details: string;
}

/**
 * Union type for all PromptVariablesFactory errors
 */
export type PromptVariablesFactoryErrors =
  | PathOptionsCreationError
  | TemplateResolverCreationError
  | SchemaResolverCreationError
  | PromptFilePathNotResolvedError
  | InputFilePathNotResolvedError
  | OutputFilePathNotResolvedError
  | SchemaFilePathNotResolvedError
  | PromptPathResolutionError
  | InputPathResolutionError
  | OutputPathResolutionError
  | SchemaPathResolutionError;

/**
 * Factory functions for creating specific errors
 */
export const PromptVariablesFactoryErrorFactory = {
  pathOptionsCreationFailed: (pathOptionsError: string): PathOptionsCreationError => ({
    kind: "PathOptionsCreationFailed",
    message: `Failed to create path options: ${pathOptionsError}`,
    pathOptionsError,
  }),

  templateResolverCreationFailed: (resolverError: string): TemplateResolverCreationError => ({
    kind: "TemplateResolverCreationFailed",
    message: `Failed to create template resolver: ${resolverError}`,
    resolverError,
  }),

  schemaResolverCreationFailed: (resolverError: string): SchemaResolverCreationError => ({
    kind: "SchemaResolverCreationFailed",
    message: `Failed to create schema resolver: ${resolverError}`,
    resolverError,
  }),

  promptFilePathNotResolved: (): PromptFilePathNotResolvedError => ({
    kind: "PromptFilePathNotResolved",
    message: "Prompt file path not resolved",
  }),

  inputFilePathNotResolved: (): InputFilePathNotResolvedError => ({
    kind: "InputFilePathNotResolved",
    message: "Input file path not resolved",
  }),

  outputFilePathNotResolved: (): OutputFilePathNotResolvedError => ({
    kind: "OutputFilePathNotResolved",
    message: "Output file path not resolved",
  }),

  schemaFilePathNotResolved: (): SchemaFilePathNotResolvedError => ({
    kind: "SchemaFilePathNotResolved",
    message: "Schema file path not resolved",
  }),

  promptPathResolutionFailed: (details: string): PromptPathResolutionError => ({
    kind: "PromptPathResolutionFailed",
    message: `Failed to resolve prompt path: ${details}`,
    details,
  }),

  inputPathResolutionFailed: (details: string): InputPathResolutionError => ({
    kind: "InputPathResolutionFailed",
    message: `Failed to resolve input path: ${details}`,
    details,
  }),

  outputPathResolutionFailed: (details: string): OutputPathResolutionError => ({
    kind: "OutputPathResolutionFailed",
    message: `Failed to resolve output path: ${details}`,
    details,
  }),

  schemaPathResolutionFailed: (details: string): SchemaPathResolutionError => ({
    kind: "SchemaPathResolutionFailed",
    message: `Failed to resolve schema path: ${details}`,
    details,
  }),
} as const;
