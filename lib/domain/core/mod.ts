/**
 * @fileoverview Core Domain Module - Unified exports for core domain components
 *
 * This module provides centralized exports for all core domain components
 * following Domain-Driven Design principles. The core domain contains the
 * most important business logic and value objects.
 *
 * @module domain/core
 */

// Value Objects
export * from "./value_objects/mod.ts";

// Domain Aggregates - Using optimized integrated implementation
export {
  TwoParams,
  TwoParamsCollection,
  type TwoParamsError,
  type TwoParamsValidationError,
  formatTwoParamsError,
  isDirectiveCreationFailedError,
  isLayerCreationFailedError,
  isInvalidCombinationError,
  isProfileValidationFailedError,
  isPathResolutionFailedError,
} from "./aggregates/two_params_integrated.ts";

// Prompt Variable Generation Domain (future implementation)
// export * from "./prompt_variable_generation/mod.ts";