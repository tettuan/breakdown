/**
 * @fileoverview Generic domain factory types module
 *
 * This module provides centralized type exports for generic domain factory operations
 *
 * @module tests/generic_domain/factory/types
 */

// Re-export from main lib types
export * from "../../../../lib/types/mod.ts";

// Re-export factory types
export * from "../../../../lib/factory/prompt_variables_factory.ts";

// Additional test-specific types
export type TestTwoParams_Result = {
  type: "two";
  demonstrativeType: string;
  layerType: string;
  params: [string, string];
  options: Record<string, unknown>;
};

export type TestOneParams_Result = {
  type: "one";
  param: string;
  options: Record<string, unknown>;
};

export type TestZeroParams_Result = {
  type: "zero";
  options: Record<string, unknown>;
};