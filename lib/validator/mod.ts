/**
 * Validator module exports
 *
 * This module provides parameter validation functionality following
 * the Totality principle with comprehensive error handling.
 *
 * @module validator
 */

// Parameter Validatorのエクスポート
export {
  type ConfigValidator,
  ParameterValidator,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationError,
  type ValidationMetadata,
} from "./parameter_validator.ts";

// 統一エラータイプも継続エクスポート
export type { ValidationError as UnifiedValidationError } from "../types/unified_error_types.ts";
