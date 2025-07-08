/**
 * @fileoverview Types module barrel export
 *
 * This module provides centralized exports for all type definitions,
 * interfaces, and type utilities used throughout the Breakdown application.
 *
 * ## Totality Principle
 *
 * The types in this module follow the Totality principle:
 * - All functions are total (no exceptions, undefined returns)
 * - All error cases are represented as values using Result types
 * - Exhaustive pattern matching is enforced through discriminated unions
 *
 * New types (DirectiveType, LayerType, etc.) are Totality-compliant and provide
 * type-safe creation and validation. Legacy types are maintained for backward
 * compatibility but are deprecated in favor of the new approach.
 *
 * @example Basic Usage - Creating Totality-compliant types
 * ```typescript
 * import { DirectiveType, LayerType, TypeFactory } from "./mod.ts";
 *
 * // Create type factory with pattern provider
 * const factory = new TypeFactory(patternProvider);
 *
 * // Create validated types
 * const directive = DirectiveType.create({ type: "two", demonstrativeType: "to", layerType: "project", params: ["to", "project"], options: {} });
 * const layer = LayerType.create({ type: "two", demonstrativeType: "to", layerType: "project", params: ["to", "project"], options: {} });
 * ```
 *
 * @example Error Handling with Result Types
 * ```typescript
 * import { ok, error, isOk, isError, map } from "./mod.ts";
 *
 * // Create a success result
 * const successResult = ok({ value: 42 });
 *
 * // Create an error result
 * const errorResult = error("Invalid input");
 *
 * // Check result status
 * if (isOk(successResult)) {
 *   console.log("Success:", successResult.value);
 * }
 *
 * // Transform results functionally
 * const doubled = map(successResult, (val) => val.value * 2);
 * ```
 *
 * @example Working with PromptVariables
 * ```typescript
 * import { createPromptParams, StandardVariable, FilePathVariable } from "./mod.ts";
 *
 * // Create prompt parameters with different variable types
 * const params = createPromptParams({
 *   directive: StandardVariable.create("directive", "to"),
 *   layer: StandardVariable.create("layer", "project"),
 *   inputFile: FilePathVariable.create("inputFile", "/path/to/input.md"),
 * });
 * ```
 *
 * @example Using ConfigProfileName for profile management
 * ```typescript
 * import { ConfigProfileName } from "./mod.ts";
 *
 * // Create a profile name (Totality-compliant with validation)
 * const profileResult = ConfigProfileName.create({ type: "two", demonstrativeType: "to", layerType: "project", params: ["to", "project"], options: {} });
 *
 * if (profileResult.value) {
 *   console.log("Profile:", profileResult.value);
 * }
 * ```
 *
 * @module types
 */

// Core type definitions
export { DirectiveType } from "./directive_type.ts";
export { LayerType } from "./layer_type.ts";
export { ConfigProfileName } from "./config_profile_name.ts";

// Factory and creation utilities
export { TypeFactory } from "./type_factory.ts";
export type { TypeCreationResult, TypePatternProvider } from "./type_factory.ts";

// Pattern types
export { TwoParamsDirectivePattern } from "./directive_type.ts";
export { TwoParamsLayerTypePattern } from "./layer_type.ts";

// Result type for error handling
export { all, chain, error, getOrElse, isError, isOk, map, ok } from "./result.ts";
export type { Result, Result as ResultType } from "./result.ts";

// Variable types
export {
  createEmptyValueError,
  createError,
  createInvalidNameError,
  createSuccess,
  createValidationFailedError,
} from "./variable_result.ts";
export type { VariableError, VariableResult } from "./variable_result.ts";
export {
  createPromptParams,
  FilePathVariable,
  FilePathVariableName,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  toPromptParamsVariables,
  UserVariable,
} from "./prompt_variables.ts";
export type { PromptVariable, PromptVariables } from "./prompt_variables.ts";

// Deprecated legacy types (for backward compatibility)
export type { DemonstrativeType, LegacyLayerType } from "./legacy_factories.ts";
export {
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  DirectiveFactory,
  LayerFactory,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  TwoParamsConfigFactory,
  VariableResultFactory,
} from "./legacy_factories.ts";
// export type { PromptCliParams } from "./prompt_variables.ts"; // Moved to factory re-export to avoid duplicate
export type { ExtendedTwoParams_Result as ExtendedTwoParams_Result } from "./variable_result.ts";

// Layer type utilities
export { LayerTypeFactory } from "./layer_type_factory.ts";

// Default implementations
export { DefaultTypePatternProvider } from "./defaults/default_type_pattern_provider.ts";
export { _defaultConfigTwoParams } from "./defaults/config_two_params.ts";

// Configuration types
export { ConfigError, ParamsCustomConfig } from "./params_custom_config.ts";
export { ResultStatus } from "./enums.ts";
export type { Result as EnumResult } from "./enums.ts";

// Error severity types
export { ErrorSeverity as ErrorSeverityClass, SeverityLevel, ImpactScope } from "../domain/core/value_objects/error_severity.ts";
export type { ErrorMetadata } from "../domain/core/value_objects/error_severity.ts";

// CLI Error severity enum for backward compatibility
export const ErrorSeverity = {
  CRITICAL: "critical",
  WARNING: "warning"
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

// Re-export types defined in factory to avoid circular dependencies
export type {
  PromptCliOptions,
  PromptCliParams,
  TotalityPromptCliParams,
} from "../factory/prompt_variables_factory.ts";

// Re-export factory classes
export { TotalityPromptVariablesFactory } from "../factory/prompt_variables_factory.ts";

/**
 * Result types for parameter operations.
 * Re-exported from breakdownparams for consistency.
 */
export type { TwoParams_Result, OneParamsResult, ZeroParamsResult } from "../deps.ts";

// Unified Error Types - Totality-compliant error handling system
export type {
  BaseError,
  SystemError,
  SystemErrorKind,
  PathError,
  ValidationError,
  ConfigurationError,
  ProcessingError,
  WorkspaceError,
  UnifiedError,
  UnifiedResult,
} from "./unified_error_types.ts";
export {
  ErrorGuards,
  ErrorFactory,
  extractUnifiedErrorMessage,
} from "./unified_error_types.ts";
