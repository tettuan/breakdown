/**
 * @fileoverview Variable result for parameter parsing architecture
 *
 * This module provides variable result types following Totality principle
 * for parameter parsing domain.
 *
 * @module core_domain/parameter_parsing/variable_result
 */

/**
 * Variable creation error types using discriminated union
 */
export type VariableError =
  | { kind: "InvalidName"; name: string; validNames: readonly string[] }
  | { kind: "EmptyValue"; variableName: string; reason: string }
  | { kind: "ValidationFailed"; value: string; constraint: string };

/**
 * Result type for variable operations in parameter parsing
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