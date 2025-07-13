/**
 * @fileoverview TwoParams Aggregate Root implementation
 *
 * This file re-exports the optimized TwoParams implementation to maintain
 * backward compatibility with existing imports.
 *
 * @module domain/core/aggregates/two_params
 */

export {
  type PathConfig,
  TwoParams,
  type TwoParamsValidationError,
} from "./two_params_optimized.ts";
