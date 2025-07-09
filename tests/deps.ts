/**
 * @fileoverview Test dependencies re-export
 *
 * This module provides centralized re-exports for test dependencies
 *
 * @module tests/deps
 */

// Re-export from main lib, excluding ValidationError to avoid duplication
export * from "../lib/deps.ts";
// Re-export from types/mod.ts but exclude ValidationError which is already exported from deps.ts
export {
  _defaultConfigTwoParams,
  // Result type for error handling
  all,
  // Unified Error Types - excluding ValidationError to avoid conflict
  type BaseError,
  chain,
  // Configuration types
  ConfigError,
  ConfigProfileName,
  type ConfigurationError,
  // Variable types
  createEmptyValueError,
  createError,
  createInvalidNameError,
  createPromptParams,
  createSuccess,
  createValidationFailedError,
  // Default implementations
  DefaultTypePatternProvider,
  // Deprecated legacy types (for backward compatibility)
  type DemonstrativeType,
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  DirectiveFactory,
  // Core type definitions
  DirectiveType,
  type EnumResult,
  error,
  ErrorFactory,
  ErrorGuards,
  type ErrorMetadata,
  ErrorSeverity,
  // Error severity types
  ErrorSeverityClass,
  type ErrorSeverityType,
  type ExtendedTwoParams_Result,
  extractUnifiedErrorMessage,
  FilePathVariable,
  FilePathVariableName,
  getOrElse,
  ImpactScope,
  isError,
  isOk,
  LayerFactory,
  LayerType,
  // Layer type utilities
  LayerTypeFactory,
  type LegacyLayerType,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  map,
  ok,
  type OneParamsResult,
  ParamsCustomConfig,
  type PathError,
  type ProcessingError,
  // Re-export types defined in factory to avoid circular dependencies
  type PromptCliOptions,
  type PromptCliParams,
  type PromptVariable,
  type PromptVariables,
  type Result,
  ResultStatus,
  type ResultType,
  SeverityLevel,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  type SystemError,
  type SystemErrorKind,
  toPromptParamsVariables,
  type TotalityPromptCliParams,
  // Re-export factory classes
  TotalityPromptVariablesFactory,
  // Result types for parameter operations
  type TwoParams_Result,
  TwoParamsConfigFactory,
  // Pattern types
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationResult,
  // Factory and creation utilities
  TypeFactory,
  type TypePatternProvider,
  type UnifiedError,
  type UnifiedResult,
  UserVariable,
  type VariableError,
  type VariableResult,
  VariableResultFactory,
  type WorkspaceError,
  type ZeroParamsResult,
} from "../lib/types/mod.ts";
