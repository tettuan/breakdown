/**
 * @fileoverview Stdin Wrapper Module
 *
 * This module provides a backwards compatibility wrapper for stdin operations.
 * It exports the enhanced stdin functionality as the main stdin interface.
 *
 * @module io/stdin
 */

// Re-export the enhanced stdin functionality as the main interface
export {
  type EnhancedStdinOptions as StdinOptions,
  type EnvironmentInfo,
  type EnvironmentDetectionConfig,
  EnhancedStdinError as StdinError,
  detectEnvironment,
  isStdinAvailableEnhanced as isStdinAvailable,
  safeReadStdin,
  shouldSkipStdinProcessing,
  createStdinReaderForEnvironment,
} from "./enhanced_stdin.ts";

/**
 * Default readStdin function with enhanced error handling
 * This function is used by legacy code that expects the old readStdin interface
 */
export async function readStdin(options?: {
  timeoutManager?: any;
  forceRead?: boolean;
  allowEmpty?: boolean;
}): Promise<string> {
  const { readStdinEnhanced } = await import("./enhanced_stdin.ts");
  
  return await readStdinEnhanced({
    timeoutManager: options?.timeoutManager,
    forceRead: options?.forceRead ?? false,
    allowEmpty: options?.allowEmpty ?? true,
  });
}