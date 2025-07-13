/**
 * @fileoverview DEPRECATED: Use variable_processor_v2.ts instead
 * 
 * This file is kept for backward compatibility but now redirects
 * to the refactored variable_processor_v2.ts implementation.
 *
 * @module cli/processors/two_params_variable_processor
 * @deprecated Use ../../processor/variable_processor_v2.ts instead
 */

// Re-export everything from variable_processor_v2 for backward compatibility
export {
  type ProcessedVariables,
  TwoParamsVariableProcessor,
  type VariableProcessorError,
} from "../../processor/variable_processor_v2.ts";
