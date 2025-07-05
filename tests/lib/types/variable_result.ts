/**
 * @fileoverview Variable result for testing
 * 
 * This module provides variable result type definitions
 * for test files.
 */

export interface VariableError {
  code: string;
  message: string;
  details?: unknown;
}

export interface VariableResult<T> {
  success: boolean;
  value?: T;
  error?: VariableError;
}

export class VariableResultHelper {
  static success<T>(value: T): VariableResult<T> {
    return {
      success: true,
      value,
    };
  }

  static error<T>(error: VariableError): VariableResult<T> {
    return {
      success: false,
      error,
    };
  }
}