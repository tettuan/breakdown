/**
 * @fileoverview LayerType Type Definitions
 *
 * This module provides type definitions for LayerType operations,
 * separated from the domain implementation following DDD principles.
 *
 * @module types/layer_type_types
 */

/**
 * Error types for LayerType creation operations
 */
export type LayerTypeCreationError =
  | { kind: "EmptyInput"; input: string }
  | { kind: "UnknownLayer"; input: string; suggestions: readonly string[] }
  | { kind: "ValidationFailed"; input: string; pattern: string }
  | { kind: "NullInput" }
  | { kind: "InvalidInput"; input: unknown; actualType: string };

/**
 * LayerType creation result following Totality principle
 */
export type LayerTypeResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: LayerTypeCreationError;
};

/**
 * Enhanced LayerType error with suggestions
 * Updated to match DirectiveTypeError structure for type compatibility
 */
export type LayerTypeErrorWithSuggestions = {
  kind: "EmptyInput" | "InvalidFormat" | "PatternMismatch" | "TooLong";
  message: string;
  suggestions?: readonly string[];
  value?: string;
  pattern?: string;
  maxLength?: number;
};