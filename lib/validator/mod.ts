/**
 * Validator module exports
 *
 * This module provides parameter validation functionality following
 * the Totality principle with comprehensive error handling.
 *
 * @module validator
 */

// Parameter Validator exports
export {
  type ConfigValidator,
  ParameterValidator,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationError,
  type ValidationMetadata,
} from "./parameter_validator.ts";

// Also re-export unified error types
export type { ValidationError as UnifiedValidationError } from "../types/unified_error_types.ts";
