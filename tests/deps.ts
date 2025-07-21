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
  type ConfigurationError,
  // Variable types
  // createPromptParams, // REMOVED - not exported from mod.ts
  // Default implementations
  DefaultTypePatternProvider,
  // Deprecated legacy types (for backward compatibility) - COMMENTED OUT
  // type DirectiveType,
  // DirectiveTypeFactory,
  // DirectiveTypeGuards,
  // DirectiveFactory,
  // Core type definitions
  DirectiveType,
  type EnumResult,
  error,
  ErrorFactory,
  ErrorGuards,
  // type ErrorMetadata, // REMOVED - not exported from mod.ts
  ErrorSeverity,
  // Error severity types
  // ErrorSeverityClass, // REMOVED - use ErrorSeverity instead
  type ErrorSeverityType,
  extractUnifiedErrorMessage,
  // FilePathVariable, // REMOVED - not exported from mod.ts
  // FilePathVariableName, // REMOVED - not exported from mod.ts
  getOrElse,
  // ImpactScope, // REMOVED - not exported from mod.ts
  isError,
  isOk,
  // LayerFactory, // REMOVED - use TypeFactory instead
  LayerType,
  // Layer type utilities - UPDATED to use unified TypeFactory
  // LayerTypeFactory, // DEPRECATED - use TypeFactory instead
  // type LegacyLayerType, // REMOVED
  // LegacyLayerTypeFactory, // REMOVED
  // LegacyLayerTypeGuards, // REMOVED
  map,
  ok,
  type OneParamsResult,
  ParamsCustomConfig,
  type PathError,
  type ProcessingError,
  // Re-export types defined in factory to avoid circular dependencies
  type PromptCliOptions,
  type PromptCliParams,
  // type PromptVariable, // REMOVED - not exported from mod.ts
  // type PromptVariables, // REMOVED - not exported from mod.ts
  type Result,
  ResultStatus,
  // SeverityLevel, // REMOVED - not exported from mod.ts
  // StandardVariable, // REMOVED - not exported from mod.ts
  // StandardVariableName, // REMOVED - not exported from mod.ts
  // StdinVariable, // REMOVED - not exported from mod.ts
  // StdinVariableName, // REMOVED - not exported from mod.ts
  type SystemError,
  type SystemErrorKind,
  // toPromptParamsVariables, // REMOVED - not exported from mod.ts
  type TotalityPromptCliParams,
  // Re-export factory classes
  TotalityPromptVariablesFactory,
  // Result types for parameter operations
  type TwoParams_Result,
  // TwoParamsConfigFactory, // REMOVED
  // Pattern types
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationResult,
  // Factory and creation utilities
  TypeFactory,
  type TypePatternProvider,
  type UnifiedError,
  type UnifiedResult,
  // UserVariable, // REMOVED - not exported from mod.ts
  // VariableResultFactory, // REMOVED
  type WorkspaceError,
  type ZeroParamsResult,
} from "../lib/types/mod.ts";
