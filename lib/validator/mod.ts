/**
 * Validator module exports
 *
 * This module provides parameter validation functionality following
 * the Totality principle with comprehensive error handling.
 *
 * @module validator
 */

export {
  type ConfigValidator,
  ParameterValidator,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationMetadata,
} from "./parameter_validator.ts";

// ValidationError is now re-exported from unified_error_types
export type { ValidationError } from "../types/unified_error_types.ts";
