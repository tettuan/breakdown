/**
 * Validator module exports
 * 
 * This module provides parameter validation functionality following
 * the Totality principle with comprehensive error handling.
 * 
 * @module validator
 */

export {
  ParameterValidator,
  type ValidatedParams,
  type ValidatedOptions,
  type ValidationMetadata,
  type ValidationError,
  type ConfigValidator
} from "./parameter_validator.ts";