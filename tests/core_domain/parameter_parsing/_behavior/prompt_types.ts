/**
 * @fileoverview Prompt types for behavior testing
 * 
 * This module provides prompt type definitions
 * for behavior tests.
 */

export interface PromptParams {
  directive: string;
  layer: string;
  inputFile?: string;
  outputFile?: string;
}

export interface PromptVariables {
  [key: string]: string | number | boolean;
}

export class PromptTypeHelper {
  static validateParams(params: PromptParams): boolean {
    return !!(params.directive && params.layer);
  }
}