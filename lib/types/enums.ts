/**
 * Enum definitions for the Breakdown application
 *
 * This module contains all enum definitions used throughout the application.
 * Centralizes enum declarations for consistency and reusability.
 *
 * @module types/enums
 */

/**
 * Result status enumeration for type-safe status checking
 * Used throughout the application for consistent result handling
 */
export enum ResultStatus {
  SUCCESS = "success",
  ERROR = "error",
}

/**
 * Generic Result type for operations that can fail
 * Provides type-safe error handling with discriminated unions
 *
 * @template T - Type of successful result data
 * @template E - Type of error information
 *
 * Usage:
 * ```typescript
 * import { Result, ResultStatus } from './types/enums';
 *
 * function parseData(input: string): Result<ParsedData, ParseError> {
 *   try {
 *     const _data = JSON.parse(input);
 *     return { status: ResultStatus.SUCCESS, data };
 *   } catch (error) {
 *     return { status: ResultStatus.ERROR, error: { message: error.message } };
 *   }
 * }
 *
 * const result = parseData(userInput);
 * if (_result.status === ResultStatus.SUCCESS) {
 *   console.log(result.data); // Type-safe access to data
 * } else {
 *   console.error(result.error); // Type-safe access to error
 * }
 * ```
 */
export type Result<T, E> =
  | { status: ResultStatus.SUCCESS; data: T }
  | { status: ResultStatus.ERROR; error: E };
