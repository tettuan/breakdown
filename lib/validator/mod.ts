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
  type ValidationError,
  type ValidationMetadata,
} from "./parameter_validator.ts";
