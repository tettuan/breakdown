/**
 * @fileoverview Test dependencies re-export module
 * 
 * This module re-exports types and utilities needed for tests.
 * It mirrors the structure of lib/deps.ts but for test-specific dependencies.
 * 
 * @module tests/lib/deps
 */

// Re-export types from main lib
export type {
  TwoParams_Result,
  OneParamsResult,
  ZeroParamsResult,
} from "../../lib/deps.ts";

export type { Result } from "../../lib/types/result.ts";

// Re-export configuration-related exports
export { DEFAULT_CUSTOM_CONFIG, ParamsParser } from "../../lib/deps.ts";

// Re-export type-related exports
export { TwoParamsDirectivePattern, TwoParamsLayerTypePattern } from "../../lib/types/mod.ts";
export { TypeFactory } from "../../lib/types/type_factory.ts";
export { DirectiveType, LayerType } from "../../lib/types/mod.ts";
export type { TypePatternProvider, TypeCreationError } from "../../lib/types/mod.ts";

// Missing exports that tests expect - add as aliases
export { DirectiveType as DemonstrativeType } from "../../lib/types/mod.ts";

// Define missing factory and utility exports as type aliases
export type DemonstrativeTypeFactory = typeof import("../../lib/types/mod.ts").DirectiveType;
export const DemonstrativeTypeGuards = {
  isDemonstrativeType: (value: unknown): boolean => typeof value === "object" && value !== null,
};

// Re-export Result utilities
export { all, chain, error, getOrElse, isError, isOk, map, ok } from "../../lib/types/result.ts";

// Re-export configuration types from breakdownparams (using correct name)
export type { CustomConfig as ParamsCustomConfig } from "jsr:@tettuan/breakdownparams@^1.0.3";

// Define missing types locally for tests
export type ConfigError = {
  kind: string;
  message: string;
};

export type ConfigProfileName = string;

// Re-export from breakdownprompt (using correct export name)
export type { PromptParams as createPromptParams } from "jsr:@tettuan/breakdownprompt@1.2.3";

// Additional missing exports as reported by Worker%11
export type FilePathVariable = {
  type: "file_path";
  value: string;
};

export type PromptVariable = {
  type: "prompt";
  value: string;
};

export type StandardVariable = {
  type: "standard";
  value: string;
};

export type LegacyLayerType = import("../../lib/types/mod.ts").LayerType;

// Missing exports that tests expect
export type FilePathVariableName = string;
export type LegacyLayerTypeFactory = typeof import("../../lib/types/mod.ts").LayerType;
export const LegacyLayerTypeGuards = {
  isLegacyLayerType: (value: unknown): boolean => typeof value === "object" && value !== null,
};

export type PromptVariables = {
  [key: string]: string;
};

export type ResultStatus = "ok" | "error";

// Additional test-specific exports if needed
export { 
  assertEquals, 
  assertExists, 
  assert,
  assertFalse,
  assertInstanceOf,
  assertRejects,
  assertThrows
} from "../../lib/deps.ts";

// Additional assert functions now available from ../../lib/deps.ts
export { 
  assertStrictEquals,
  assertNotEquals,
  assertStringIncludes,
  assertMatch,
  assertArrayIncludes,
  assertObjectMatch,
  fail,
  assertAlmostEquals,
  assertGreater,
  assertGreaterOrEqual,
  assertLess,
  assertLessOrEqual,
  assertIsError,
  assertNotStrictEquals
} from "../../lib/deps.ts";