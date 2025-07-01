/**
 * Result types for PromptVariables following Totality principle
 *
 * This module provides Result types for type-safe error handling
 * in prompt variable creation and validation operations.
 *
 * @module
 */

/**
 * Variable creation error types using discriminated union
 */
export type VariableError =
  | { kind: "InvalidName"; name: string; validNames: readonly string[] }
  | { kind: "EmptyValue"; variableName: string; reason: string }
  | { kind: "ValidationFailed"; value: string; constraint: string };

/**
 * Result type for variable operations
 * Follows Totality principle by making errors explicit
 */
export type VariableResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: VariableError };

/**
 * Helper function to create success result
 */
export function createSuccess<T>(data: T): VariableResult<T> {
  return { ok: true, data };
}

/**
 * Helper function to create error result
 */
export function createError<T>(error: VariableError): VariableResult<T> {
  return { ok: false, error };
}

/**
 * Helper function to create invalid name error
 */
export function createInvalidNameError<T>(
  name: string,
  validNames: readonly string[],
): VariableResult<T> {
  return createError({
    kind: "InvalidName",
    name,
    validNames,
  });
}

/**
 * Helper function to create empty value error
 */
export function createEmptyValueError<T>(
  variableName: string,
  reason: string,
): VariableResult<T> {
  return createError({
    kind: "EmptyValue",
    variableName,
    reason,
  });
}

/**
 * Helper function to create validation failed error
 */
export function createValidationFailedError<T>(
  value: string,
  constraint: string,
): VariableResult<T> {
  return createError({
    kind: "ValidationFailed",
    value,
    constraint,
  });
}
