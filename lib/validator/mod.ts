/**
 * Validator module exports
 *
 * This module provides parameter validation functionality following
 * the Totality principle with comprehensive error handling.
 *
 * @module validator
 */

// DDD版Validatorをプライマリエクスポートとして使用
export {
  type ConfigValidator,
  ParameterValidatorV2 as ParameterValidator,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationMetadata,
  type ValidationError,
} from "./parameter_validator_v2.ts";

// レガシー版は明示的な名前でエクスポート
export {
  ParameterValidator as LegacyParameterValidator,
} from "./parameter_validator.ts";

// 統一エラータイプも継続エクスポート
export type { ValidationError as UnifiedValidationError } from "../types/unified_error_types.ts";
