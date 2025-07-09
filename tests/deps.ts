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
  // Core type definitions
  DirectiveType,
  LayerType,
  ConfigProfileName,
  
  // Factory and creation utilities
  TypeFactory,
  type TypeCreationResult,
  type TypePatternProvider,
  
  // Pattern types
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  
  // Result type for error handling
  all,
  chain,
  error,
  getOrElse,
  isError,
  isOk,
  map,
  ok,
  type Result,
  type ResultType,
  
  // Variable types
  createEmptyValueError,
  createError,
  createInvalidNameError,
  createSuccess,
  createValidationFailedError,
  type VariableError,
  type VariableResult,
  createPromptParams,
  FilePathVariable,
  FilePathVariableName,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  toPromptParamsVariables,
  UserVariable,
  type PromptVariable,
  type PromptVariables,
  
  // Deprecated legacy types (for backward compatibility)
  type DemonstrativeType,
  type LegacyLayerType,
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  DirectiveFactory,
  LayerFactory,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  TwoParamsConfigFactory,
  VariableResultFactory,
  type ExtendedTwoParams_Result,
  
  // Layer type utilities
  LayerTypeFactory,
  
  // Default implementations
  DefaultTypePatternProvider,
  _defaultConfigTwoParams,
  
  // Configuration types
  ConfigError,
  ParamsCustomConfig,
  ResultStatus,
  type EnumResult,
  
  // Error severity types
  ErrorSeverityClass,
  SeverityLevel,
  ImpactScope,
  type ErrorMetadata,
  ErrorSeverity,
  type ErrorSeverityType,
  
  // Re-export types defined in factory to avoid circular dependencies
  type PromptCliOptions,
  type PromptCliParams,
  type TotalityPromptCliParams,
  
  // Re-export factory classes
  TotalityPromptVariablesFactory,
  
  // Result types for parameter operations
  type TwoParams_Result,
  type OneParamsResult,
  type ZeroParamsResult,
  
  // Unified Error Types - excluding ValidationError to avoid conflict
  type BaseError,
  type SystemError,
  type SystemErrorKind,
  type PathError,
  type ConfigurationError,
  type ProcessingError,
  type WorkspaceError,
  type UnifiedError,
  type UnifiedResult,
  ErrorGuards,
  ErrorFactory,
  extractUnifiedErrorMessage,
} from "../lib/types/mod.ts";