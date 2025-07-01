/**
 * Type definitions for the Breakdown tool.
 *
 * This module contains core type definitions used throughout the Breakdown tool.
 * It defines the fundamental types for commands and layers that structure the
 * application's functionality, following the Totality principle for type safety.
 *
 * @example Basic usage with new Totality-compliant types
 * ```ts
 * import { TypeFactory, TypePatternProvider } from "@tettuan/breakdown/lib/types/mod.ts";
 *
 * // Totality-compliant type construction
 * const factory = new TypeFactory(patternProvider);
 * const directiveResult = factory.createDirectiveType("to");
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.getValue()); // "to"
 * }
 * ```
 *
 * @example Legacy usage (deprecated)
 * ```ts
 * import { DemonstrativeType, LayerType } from "@tettuan/breakdown/lib/types/mod.ts";
 *
 * const command: DemonstrativeType = "to"; // DEPRECATED: Use DirectiveType instead
 * const layer: LayerType = "project";      // DEPRECATED: Use new LayerType class instead
 * ```
 *
 * @module
 */

// === New Totality-compliant types ===
export { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
export { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
export { ConfigProfileName } from "./config_profile_name.ts";
export { 
  TypeFactory, 
  type TypePatternProvider, 
  type TypeCreationResult, 
  type TypeCreationError 
} from "./type_factory.ts";

// === Factory types (temporary re-export from factory module) ===
export { type TotalityPromptCliParams, type PromptCliParams } from "../factory/prompt_variables_factory.ts";

// === PromptVariables types ===
export {
  StandardVariable,
  FilePathVariable,
  StdinVariable,
  UserVariable,
  StandardVariableName,
  FilePathVariableName,
  StdinVariableName,
  type PromptVariable,
  type PromptVariables,
  toPromptParamsVariables,
  createPromptParams
} from "./prompt_variables.ts";

// === Enums and Result types ===
export {
  ResultStatus
} from "./enums.ts";

export {
  type Result,
  ok,
  error,
  isOk,
  isError,
  map,
  chain,
  getOrElse,
  all
} from "./result.ts";

// === ParamsCustomConfig types ===
export {
  ConfigError,
  ParamsCustomConfig
} from "./params_custom_config.ts";

// === BreakdownParams types (re-export) ===
export type { CustomConfig, TwoParamsResult as BaseTwoParamsResult } from "@tettuan/breakdownparams";
import type { TwoParamsResult as InternalBaseTwoParamsResult } from "@tettuan/breakdownparams";

// === Extended types for local use ===
/**
 * Extended TwoParamsResult interface with additional options for type safety.
 * Extends the base TwoParamsResult from @tettuan/breakdownparams with proper options override.
 */
export interface ExtendedTwoParamsResult extends Omit<InternalBaseTwoParamsResult, 'options'> {
  options?: {
    adaptation?: string;
    fromLayerType?: string;
    fromFile?: string;
    useSchema?: boolean;
  } & Record<string, unknown>;
}

// === Legacy types (DEPRECATED) ===
// These will be removed after migration completion

/**
 * @deprecated Use DirectiveType class instead
 * Type representing the available demonstrative command types for Breakdown.
 * These commands define the core operations that can be performed by the tool.
 *
 * @property {"to"} - Convert to next layer
 * @property {"summary"} - Summarize the current layer
 * @property {"defect"} - Analyze defects in the current layer
 * @property {"init"} - Initialize the workspace
 * @property {"find"} - Find and analyze specific patterns (e.g., bugs)
 *
 * @example
 * ```ts
 * const command: DemonstrativeType = "to";
 * ```
 */
export type DemonstrativeType = "to" | "summary" | "defect" | "init" | "find";

/**
 * @deprecated Use LayerType class instead
 * Type representing the available layer types for Breakdown.
 * These layers define the hierarchical structure of the breakdown process.
 *
 * @property {"project"} - Project layer, top-level organizational unit
 * @property {"issue"} - Issue layer, represents specific problems or features
 * @property {"task"} - Task layer, represents actionable items
 * @property {"bugs"} - Bugs layer, for tracking and analyzing bugs or defects
 * @property {"temp"} - Temporary layer, for intermediate or temporary data
 *
 * @example
 * ```ts
 * const layer: LegacyLayerType = "project";
 * ```
 */
export type LegacyLayerType = "project" | "issue" | "task" | "bugs" | "temp";

// === Legacy factory exports (DEPRECATED) ===
export {
  DemonstrativeTypeFactory,
  LegacyLayerTypeFactory,
  DemonstrativeTypeGuards,
  LegacyLayerTypeGuards,
} from "./legacy_factories.ts";
