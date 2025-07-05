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

export function createSuccess<T>(value: T): VariableResult<T> {
  return VariableResultHelper.success(value);
}

export function createError<T>(error: VariableError): VariableResult<T> {
  return VariableResultHelper.error(error);
}

export function createInvalidNameError<T>(name: string, validNames: string[]): VariableResult<T> {
  return createError({
    code: 'INVALID_NAME',
    message: `Invalid name: ${name}. Valid names: ${validNames.join(', ')}`,
    details: { name, validNames }
  });
}

export function createEmptyValueError<T>(variableName: string, reason: string): VariableResult<T> {
  return createError({
    code: 'EMPTY_VALUE',
    message: `Empty value for variable ${variableName}: ${reason}`,
    details: { variableName, reason }
  });
}

export function createValidationFailedError<T>(value: string, constraint: string): VariableResult<T> {
  return createError({
    code: 'VALIDATION_FAILED',
    message: `Validation failed for value ${value}: ${constraint}`,
    details: { value, constraint }
  });
}