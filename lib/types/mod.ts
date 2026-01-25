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
 * const directive = DirectiveType.create({ type: "two", directiveType: "to",
    directiveType: "to", layerType: "project", params: ["to", "project"], options: {} });
 * const layer = LayerType.create({ type: "two", directiveType: "to",
    directiveType: "to", layerType: "project", params: ["to", "project"], options: {} });
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
 *   console.log("Success:", successResult.data.value);
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
 * @example Using TwoParams with Result types
 * ```typescript
 * import { createTwoParamsType } from "./mod.ts";
 *
 * // Create TwoParams with validation
 * const paramsResult = createTwoParamsType("to", "project");
 *
 * if (paramsResult.ok) {
 *   console.log("Directive:", paramsResult.data.directive.value);
 *   console.log("Layer:", paramsResult.data.layer.value);
 * }
 * ```
 *
 * @module types
 */

// Core type definitions - Unified implementation
export {
  DirectiveType,
  type DirectiveTypeError,
  TwoParamsDirectivePattern,
} from "../domain/core/value_objects/directive_type.ts";
// Note: layer_type.ts has been moved to domain/core/value_objects/layer_type.ts
export {
  LayerType,
  type LayerTypeError,
  TwoParamsLayerTypePattern,
} from "../domain/core/value_objects/layer_type.ts";

// TwoParams type implementation with Smart Constructor pattern
export { createTwoParamsType, TwoParamsType, type TwoParamsTypeError } from "./two_params.ts";

// Factory and creation utilities
export { TypeFactory } from "./type_factory.ts";
export type { TypeCreationResult } from "./type_factory.ts";
// TypePatternProvider removed - removed due to JSR integration

// Pattern types - LayerType pattern (now unified with domain implementation)
// Note: TwoParamsLayerTypePattern has been removed (@deprecated)

// Result type for error handling
export { all, chain, error, getOrElse, isError, isOk, map, ok } from "./result.ts";
export type { Result } from "./result.ts";

// Variable types - Using unified Result types from result.ts
export {
  createPromptParams,
  FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "./prompt_variables_vo.ts";
export type { PromptVariable, PromptVariables } from "./prompt_variables_vo.ts";

// Deprecated legacy types (for backward compatibility)
// NOTE: Legacy factories removed during DirectiveType -> DirectiveType refactor
// TODO: Remove legacy test files that depend on these exports
// export type { DirectiveType, LegacyLayerType } from "./legacy_factories.ts";
// export {
//   DirectiveTypeFactory,
//   DirectiveTypeGuards,
//   DirectiveFactory,
//   LayerFactory,
//   LegacyLayerTypeFactory,
//   LegacyLayerTypeGuards,
//   TwoParamsConfigFactory,
//   VariableResultFactory,
// } from "./legacy_factories.ts";
// export type { PromptCliParams } from "./prompt_variables.ts"; // Moved to factory re-export to avoid duplicate

// Layer type utilities - moved to domain/core/value_objects

// Default implementations - moved to JSR packages
// Note: DefaultTypePatternProvider has been removed as part of hardcode elimination
// Pattern provider functionality is now handled by BreakdownParams package

// Configuration types
export { ConfigError, ParamsCustomConfig } from "./params_custom_config.ts";
export { ConfigProfile } from "../config/config_profile_name.ts";
export { ResultStatus } from "./enums.ts";
export type { Result as EnumResult } from "./enums.ts";

// Error severity types
// export {
//   ErrorSeverity as ErrorSeverityClass,
//   ImpactScope,
//   SeverityLevel,
// } from "../domain/core/value_objects/error_severity.ts";
// export type { ErrorMetadata } from "../domain/core/value_objects/error_severity.ts";

// CLI Error severity enum for backward compatibility
export const ErrorSeverity = {
  CRITICAL: "critical",
  WARNING: "warning",
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
export type { OneParamsResult, TwoParams_Result, ZeroParamsResult } from "../deps.ts";

// Path Value Objects - Smart Constructors for Schema and Prompt paths
export { createSchemaPathUnsafe, SchemaPath } from "./schema_path.ts";
export type { SchemaPathError } from "./schema_path.ts";
export { createPromptPathUnsafe, PromptPath } from "./prompt_path.ts";
export type { PromptPathError } from "./prompt_path.ts";

// Unified Error Types - Totality-compliant error handling system
export type {
  BaseError,
  ConfigurationError,
  PathError,
  ProcessingError,
  SystemError,
  SystemErrorKind,
  UnifiedError,
  UnifiedResult,
  ValidationError,
  WorkspaceError,
} from "./unified_error_types.ts";
export { ErrorFactory, ErrorGuards, extractUnifiedErrorMessage } from "./unified_error_types.ts";

// Team-specific types for team development workflows
export type {
  TeamConfig,
  TeamContextualVariables,
  TeamInfo,
  TeamIntegration,
  TeamMember,
  TeamOutputConfig,
  TeamPaths,
  TeamPromptConfig,
  UserVariable as TeamUserVariable,
} from "./team_types.ts";

export {
  isTeamConfig,
  isTeamContextualVariables,
  isTeamInfo,
  isTeamOutputConfig,
  isTeamPaths,
  isTeamPromptConfig,
  isUserVariable as isTeamUserVariable,
} from "./team_types.ts";
