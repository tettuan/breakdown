/**
 * @fileoverview Two Params Variable Processor - Wrapper for Architectural Compliance
 *
 * This module provides a wrapper for the TwoParamsVariableProcessor to ensure
 * handlers can import from the correct architectural layer (../processors/).
 * This maintains clean architecture boundaries while providing the necessary
 * functionality to handlers.
 *
 * @module lib/cli/processors/two_params_variable_processor
 */

// Re-export the processor from the core processor directory
export {
  type ProcessedVariables,
  type ProcessorOptions,
  type ProcessorResult,
  TwoParamsVariableProcessor,
  type TwoParamsVariableProcessorError,
  type VariableProcessorError,
} from "../../processor/variable_processor.ts";
