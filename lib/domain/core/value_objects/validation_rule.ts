/**
 * @fileoverview ValidationRule Value Object implementation
 *
 * This module provides a type-safe representation of validation rules
 * used throughout the breakdown system for data validation and constraints.
 *
 * @module domain/core/value_objects/validation_rule
 */

import type { Result } from "../../../types/result.ts";
import { error as resultError, ok as resultOk } from "../../../types/result.ts";

/**
 * Validation function type
 */
export type ValidationFunction<T> = (value: T) => boolean;

/**
 * Error types for ValidationRule validation
 */
export type ValidationRuleError =
  | { kind: "NullOrUndefined"; input: unknown }
  | { kind: "EmptyName"; input: string }
  | { kind: "InvalidValidator"; input: unknown }
  | { kind: "EmptyErrorMessage"; input: string }
  | { kind: "NegativeLength"; input: number }
  | { kind: "InvalidType"; input: unknown; expectedType: string }
  | { kind: "InvalidRange"; min: number; max: number }
  | { kind: "EmptyRuleSet"; input: unknown }
  | { kind: "InvalidRuleType"; input: string; validTypes: string[] }
  | { kind: "InvalidFormat"; input: unknown; reason: string }
  | { kind: "InvalidParameters"; ruleType: string; parameters: unknown; reason: string }
  | { kind: "MissingParameters"; ruleType: string; requiredParameters: string[] };

/**
 * Type guard functions for ValidationRuleError
 */
export function isNullOrUndefinedError(
  error: ValidationRuleError,
): error is { kind: "NullOrUndefined"; input: unknown } {
  return error.kind === "NullOrUndefined";
}

export function isEmptyNameError(
  error: ValidationRuleError,
): error is { kind: "EmptyName"; input: string } {
  return error.kind === "EmptyName";
}

export function isInvalidValidatorError(
  error: ValidationRuleError,
): error is { kind: "InvalidValidator"; input: unknown } {
  return error.kind === "InvalidValidator";
}

export function isEmptyErrorMessageError(
  error: ValidationRuleError,
): error is { kind: "EmptyErrorMessage"; input: string } {
  return error.kind === "EmptyErrorMessage";
}

export function isNegativeLengthError(
  error: ValidationRuleError,
): error is { kind: "NegativeLength"; input: number } {
  return error.kind === "NegativeLength";
}

export function isInvalidTypeError(
  error: ValidationRuleError,
): error is { kind: "InvalidType"; input: unknown; expectedType: string } {
  return error.kind === "InvalidType";
}

export function isInvalidRangeError(
  error: ValidationRuleError,
): error is { kind: "InvalidRange"; min: number; max: number } {
  return error.kind === "InvalidRange";
}

export function isEmptyRuleSetError(
  error: ValidationRuleError,
): error is { kind: "EmptyRuleSet"; input: unknown } {
  return error.kind === "EmptyRuleSet";
}

/**
 * Immutable value object representing a validation rule
 */
export class ValidationRule<T = unknown> {
  private readonly _name: string;
  private readonly _validator: ValidationFunction<T>;
  private readonly _errorMessage: string;

  private constructor(name: string, validator: ValidationFunction<T>, errorMessage: string) {
    this._name = name;
    this._validator = validator;
    this._errorMessage = errorMessage;
    Object.freeze(this);
  }

  /**
   * Smart Constructor: Creates a ValidationRule with validation
   */
  static create<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string,
  ): Result<ValidationRule<T>, ValidationRuleError> {
    // Validate name
    if (name === null || name === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: name,
      });
    }

    if (typeof name !== "string") {
      return resultError({
        kind: "InvalidType",
        input: name,
        expectedType: "string",
      });
    }

    if (name.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: name,
      });
    }

    // Validate validator
    if (validator === null || validator === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: validator,
      });
    }

    if (typeof validator !== "function") {
      return resultError({
        kind: "InvalidValidator",
        input: validator,
      });
    }

    // Validate error message
    if (errorMessage === null || errorMessage === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: errorMessage,
      });
    }

    if (typeof errorMessage !== "string") {
      return resultError({
        kind: "InvalidType",
        input: errorMessage,
        expectedType: "string",
      });
    }

    if (errorMessage.trim() === "") {
      return resultError({
        kind: "EmptyErrorMessage",
        input: errorMessage,
      });
    }

    return resultOk(new ValidationRule(name, validator, errorMessage));
  }

  /**
   * Unsafe factory method for backward compatibility
   */
  static createUnsafe<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string,
  ): ValidationRule<T> {
    const result = ValidationRule.create(name, validator, errorMessage);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Factory method for minimum length validation
   */
  static minLength(
    length: number,
    fieldName: string,
  ): Result<ValidationRule<string>, ValidationRuleError> {
    // Validate length
    if (length === null || length === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: length,
      });
    }

    if (typeof length !== "number") {
      return resultError({
        kind: "InvalidType",
        input: length,
        expectedType: "number",
      });
    }

    if (length < 0) {
      return resultError({
        kind: "NegativeLength",
        input: length,
      });
    }

    // Validate field name
    if (fieldName === null || fieldName === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: fieldName,
      });
    }

    if (typeof fieldName !== "string") {
      return resultError({
        kind: "InvalidType",
        input: fieldName,
        expectedType: "string",
      });
    }

    if (fieldName.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: fieldName,
      });
    }

    const name = `minLength_${length}_${fieldName}`;
    const validator = (value: string) => typeof value === "string" && value.length >= length;
    const errorMessage = `${fieldName} must be at least ${length} characters long`;

    return ValidationRule.create(name, validator, errorMessage);
  }

  /**
   * Unsafe factory method for minimum length validation
   */
  static minLengthUnsafe(length: number, fieldName: string): ValidationRule<string> {
    const result = ValidationRule.minLength(length, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Factory method for maximum length validation
   */
  static maxLength(
    length: number,
    fieldName: string,
  ): Result<ValidationRule<string>, ValidationRuleError> {
    // Validate length
    if (length === null || length === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: length,
      });
    }

    if (typeof length !== "number") {
      return resultError({
        kind: "InvalidType",
        input: length,
        expectedType: "number",
      });
    }

    if (length < 0) {
      return resultError({
        kind: "NegativeLength",
        input: length,
      });
    }

    // Validate field name
    if (fieldName === null || fieldName === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: fieldName,
      });
    }

    if (typeof fieldName !== "string") {
      return resultError({
        kind: "InvalidType",
        input: fieldName,
        expectedType: "string",
      });
    }

    if (fieldName.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: fieldName,
      });
    }

    const name = `maxLength_${length}_${fieldName}`;
    const validator = (value: string) => typeof value === "string" && value.length <= length;
    const errorMessage = `${fieldName} must be no more than ${length} characters long`;

    return ValidationRule.create(name, validator, errorMessage);
  }

  /**
   * Unsafe factory method for maximum length validation
   */
  static maxLengthUnsafe(length: number, fieldName: string): ValidationRule<string> {
    const result = ValidationRule.maxLength(length, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Factory method for range validation
   */
  static range(
    min: number,
    max: number,
    fieldName: string,
  ): Result<ValidationRule<number>, ValidationRuleError> {
    // Validate min
    if (min === null || min === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: min,
      });
    }

    if (typeof min !== "number") {
      return resultError({
        kind: "InvalidType",
        input: min,
        expectedType: "number",
      });
    }

    // Validate max
    if (max === null || max === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: max,
      });
    }

    if (typeof max !== "number") {
      return resultError({
        kind: "InvalidType",
        input: max,
        expectedType: "number",
      });
    }

    // Validate range
    if (min > max) {
      return resultError({
        kind: "InvalidRange",
        min,
        max,
      });
    }

    // Validate field name
    if (fieldName === null || fieldName === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: fieldName,
      });
    }

    if (typeof fieldName !== "string") {
      return resultError({
        kind: "InvalidType",
        input: fieldName,
        expectedType: "string",
      });
    }

    if (fieldName.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: fieldName,
      });
    }

    const name = `range_${min}_${max}_${fieldName}`;
    const validator = (value: number) => typeof value === "number" && value >= min && value <= max;
    const errorMessage = `${fieldName} must be between ${min} and ${max}`;

    return ValidationRule.create(name, validator, errorMessage);
  }

  /**
   * Unsafe factory method for range validation
   */
  static rangeUnsafe(min: number, max: number, fieldName: string): ValidationRule<number> {
    const result = ValidationRule.range(min, max, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Factory method for combining multiple validation rules
   */
  static combine<T>(rules: ValidationRule<T>[]): Result<ValidationRule<T>, ValidationRuleError> {
    // Validate rules array
    if (rules === null || rules === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: rules,
      });
    }

    if (!Array.isArray(rules)) {
      return resultError({
        kind: "InvalidType",
        input: rules,
        expectedType: "array",
      });
    }

    if (rules.length === 0) {
      return resultError({
        kind: "EmptyRuleSet",
        input: rules,
      });
    }

    const name = `combined_${rules.map((r) => r.getName()).join("_")}`;
    const validator = (value: T) => rules.every((rule) => rule.isValid(value));
    const errorMessage = `Value must satisfy all validation rules: ${
      rules.map((r) => r.getErrorMessage()).join(", ")
    }`;

    return ValidationRule.create(name, validator, errorMessage);
  }

  /**
   * Unsafe factory method for combining validation rules
   */
  static combineUnsafe<T>(rules: ValidationRule<T>[]): ValidationRule<T> {
    const result = ValidationRule.combine(rules);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Legacy factory methods for backward compatibility
   */
  static required(fieldName?: string): ValidationRule<unknown> {
    const name = fieldName ? `required_${fieldName}` : "required";
    const message = fieldName ? `${fieldName} is required` : "This field is required";
    return ValidationRule.createUnsafe(
      name,
      (value: unknown) => value !== null && value !== undefined && value !== "",
      message,
    );
  }

  static pattern(pattern: RegExp | string, fieldName?: string): ValidationRule<string> {
    const name = fieldName ? `pattern_${fieldName}` : "pattern";
    const message = fieldName
      ? `${fieldName} must match the pattern`
      : `Value must match the pattern`;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return ValidationRule.createUnsafe(
      name,
      (value: string) => typeof value === "string" && regex.test(value),
      message,
    );
  }

  static custom<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string,
  ): ValidationRule<T> {
    return ValidationRule.createUnsafe(name, validator, errorMessage);
  }

  /**
   * Get rule name
   */
  getName(): string {
    return this._name;
  }

  /**
   * Get error message
   */
  getErrorMessage(): string {
    return this._errorMessage;
  }

  /**
   * Create a new rule with a different error message
   */
  withMessage(newMessage: string): Result<ValidationRule<T>, ValidationRuleError> {
    return ValidationRule.create(this._name, this._validator, newMessage);
  }

  /**
   * Unsafe version of withMessage for backward compatibility
   */
  withMessageUnsafe(newMessage: string): ValidationRule<T> {
    const result = this.withMessage(newMessage);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Validate a value against this rule
   */
  validate(value: T): { isValid: boolean; errorMessage?: string; appliedRules: string[] } {
    try {
      const isValid = this._validator(value);
      return {
        isValid,
        errorMessage: isValid ? undefined : this._errorMessage,
        appliedRules: [this._name],
      };
    } catch {
      return {
        isValid: false,
        errorMessage: this._errorMessage,
        appliedRules: [this._name],
      };
    }
  }

  /**
   * Simple validation that returns only boolean
   */
  isValid(value: T): boolean {
    try {
      return this._validator(value);
    } catch {
      return false;
    }
  }

  /**
   * Validate a value and return detailed result
   */
  validateWithError(value: T): { isValid: boolean; error?: string } {
    const isValid = this.isValid(value);
    return {
      isValid,
      error: isValid ? undefined : this._errorMessage,
    };
  }

  /**
   * Combine this rule with another using AND logic
   */
  and(other: ValidationRule<T>): ValidationRule<T> {
    const result = ValidationRule.combine([this, other]);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }

  /**
   * Combine this rule with another using OR logic
   */
  or(other: ValidationRule<T>): ValidationRule<T> {
    const name = `${this._name}_or_${other._name}`;
    const validator = (value: T) => this.isValid(value) || other.isValid(value);
    const errorMessage =
      `Value must satisfy either: ${this._errorMessage} OR ${other._errorMessage}`;

    return ValidationRule.createUnsafe(name, validator, errorMessage);
  }

  /**
   * Make this rule optional (passes validation for null/undefined)
   */
  optional(): ValidationRule<T | null | undefined> {
    const name = `optional_${this._name}`;
    const validator = (value: T | null | undefined) => {
      if (value === null || value === undefined) return true;
      return this.isValid(value as T);
    };
    const errorMessage = `${this._errorMessage} (optional)`;

    return ValidationRule.createUnsafe(name, validator, errorMessage);
  }

  /**
   * Check if this is an optional rule
   */
  isOptionalRule(): boolean {
    return this._name.startsWith("optional_");
  }

  /**
   * Value equality comparison
   */
  equals(other: ValidationRule<T>): boolean {
    return this._name === other._name &&
      this._errorMessage === other._errorMessage;
  }

  /**
   * String representation
   */
  toString(): string {
    return `ValidationRule(${this._name})`;
  }

  /**
   * JSON serialization
   */
  toJSON(): { name: string; errorMessage: string } {
    return {
      name: this._name,
      errorMessage: this._errorMessage,
    };
  }
}

/**
 * Format validation rule error for user-friendly display
 */
export function formatValidationRuleError(error: ValidationRuleError): string {
  switch (error.kind) {
    case "NullOrUndefined":
      return `Validation rule parameter cannot be null or undefined. Received: ${error.input}`;

    case "EmptyName":
      return `Validation rule name cannot be empty. Received: "${error.input}"`;

    case "InvalidValidator":
      return `Validator must be a function. Received: ${typeof error.input}`;

    case "EmptyErrorMessage":
      return `Error message cannot be empty. Received: "${error.input}"`;

    case "NegativeLength":
      return `Length cannot be negative. Received: ${error.input}`;

    case "InvalidType":
      return `Invalid type. Expected ${error.expectedType}, received: ${typeof error.input}`;

    case "InvalidRange":
      return `Invalid range: min (${error.min}) cannot be greater than max (${error.max})`;

    case "EmptyRuleSet":
      return `Rule set cannot be empty. At least one validation rule is required.`;

    case "InvalidRuleType":
      return `Invalid validation rule type: "${error.input}". ` +
        `Valid types are: ${error.validTypes.join(", ")}`;

    case "InvalidFormat":
      return `Invalid format for validation rule: ${error.reason}`;

    case "InvalidParameters":
      return `Invalid parameters for ${error.ruleType} rule: ${error.reason}`;

    case "MissingParameters":
      return `Missing required parameters for ${error.ruleType} rule: ${
        error.requiredParameters.join(", ")
      }`;

    default:
      return "Unknown validation rule error occurred.";
  }
}
