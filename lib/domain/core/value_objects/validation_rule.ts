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
 * Predefined validation rule types
 */
export const VALIDATION_RULE_TYPES = {
  REQUIRED: "required",
  MIN_LENGTH: "min_length",
  MAX_LENGTH: "max_length",
  PATTERN: "pattern",
  RANGE: "range",
  EMAIL: "email",
  URL: "url",
  NUMERIC: "numeric",
  ALPHA: "alpha",
  ALPHANUMERIC: "alphanumeric",
  CUSTOM: "custom",
} as const;

export type ValidationRuleType = typeof VALIDATION_RULE_TYPES[keyof typeof VALIDATION_RULE_TYPES];

/**
 * Error types for ValidationRule validation
 */
export type ValidationRuleError =
  | { kind: "InvalidRuleType"; input: string; validTypes: string[] }
  | { kind: "InvalidFormat"; input: unknown; reason: string }
  | { kind: "InvalidParameters"; ruleType: string; parameters: unknown; reason: string }
  | { kind: "MissingParameters"; ruleType: string; requiredParameters: string[] };

/**
 * Parameters for different validation rule types
 */
export type ValidationRuleParameters =
  | { type: "required" }
  | { type: "min_length"; minLength: number }
  | { type: "max_length"; maxLength: number }
  | { type: "pattern"; pattern: string; flags?: string }
  | { type: "range"; min: number; max: number }
  | { type: "email" }
  | { type: "url" }
  | { type: "numeric" }
  | { type: "alpha" }
  | { type: "alphanumeric" }
  | { type: "custom"; validator: (value: unknown) => boolean; errorMessage: string };

/**
 * Immutable value object representing a validation rule
 */
export class ValidationRule {
  private readonly _type: ValidationRuleType;
  private readonly _parameters: ValidationRuleParameters;
  private readonly _errorMessage: string;

  private constructor(parameters: ValidationRuleParameters, errorMessage?: string) {
    this._type = parameters.type;
    this._parameters = parameters;
    this._errorMessage = errorMessage || this.getDefaultErrorMessage(parameters);
    Object.freeze(this);
  }

  /**
   * Smart Constructor: Creates a ValidationRule with validation
   */
  static create(
    parameters: ValidationRuleParameters,
    errorMessage?: string
  ): Result<ValidationRule, ValidationRuleError> {
    // Validate parameters based on rule type
    const validationResult = ValidationRule.validateParameters(parameters);
    if (!validationResult.ok) {
      return validationResult;
    }

    return resultOk(new ValidationRule(parameters, errorMessage));
  }

  /**
   * Validate rule parameters based on type
   */
  private static validateParameters(
    parameters: ValidationRuleParameters
  ): Result<void, ValidationRuleError> {
    switch (parameters.type) {
      case VALIDATION_RULE_TYPES.MIN_LENGTH:
        if (typeof parameters.minLength !== "number" || parameters.minLength < 0) {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "minLength must be a non-negative number",
          });
        }
        break;

      case VALIDATION_RULE_TYPES.MAX_LENGTH:
        if (typeof parameters.maxLength !== "number" || parameters.maxLength < 0) {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "maxLength must be a non-negative number",
          });
        }
        break;

      case VALIDATION_RULE_TYPES.PATTERN:
        if (typeof parameters.pattern !== "string" || parameters.pattern === "") {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "pattern must be a non-empty string",
          });
        }
        // Test if pattern is a valid regex
        try {
          new RegExp(parameters.pattern, parameters.flags);
        } catch (error) {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: `Invalid regex pattern: ${error.message}`,
          });
        }
        break;

      case VALIDATION_RULE_TYPES.RANGE:
        if (typeof parameters.min !== "number" || typeof parameters.max !== "number") {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "min and max must be numbers",
          });
        }
        if (parameters.min > parameters.max) {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "min cannot be greater than max",
          });
        }
        break;

      case VALIDATION_RULE_TYPES.CUSTOM:
        if (typeof parameters.validator !== "function") {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "validator must be a function",
          });
        }
        if (typeof parameters.errorMessage !== "string" || parameters.errorMessage === "") {
          return resultError({
            kind: "InvalidParameters",
            ruleType: parameters.type,
            parameters,
            reason: "errorMessage must be a non-empty string",
          });
        }
        break;

      // Simple types that don't need additional validation
      case VALIDATION_RULE_TYPES.REQUIRED:
      case VALIDATION_RULE_TYPES.EMAIL:
      case VALIDATION_RULE_TYPES.URL:
      case VALIDATION_RULE_TYPES.NUMERIC:
      case VALIDATION_RULE_TYPES.ALPHA:
      case VALIDATION_RULE_TYPES.ALPHANUMERIC:
        break;

      default:
        return resultError({
          kind: "InvalidRuleType",
          input: (parameters as { type: string }).type,
          validTypes: Object.values(VALIDATION_RULE_TYPES),
        });
    }

    return resultOk(undefined);
  }

  /**
   * Get default error message for rule type
   */
  private getDefaultErrorMessage(parameters: ValidationRuleParameters): string {
    switch (parameters.type) {
      case VALIDATION_RULE_TYPES.REQUIRED:
        return "This field is required";
      case VALIDATION_RULE_TYPES.MIN_LENGTH:
        return `Minimum length is ${parameters.minLength} characters`;
      case VALIDATION_RULE_TYPES.MAX_LENGTH:
        return `Maximum length is ${parameters.maxLength} characters`;
      case VALIDATION_RULE_TYPES.PATTERN:
        return `Value must match the pattern: ${parameters.pattern}`;
      case VALIDATION_RULE_TYPES.RANGE:
        return `Value must be between ${parameters.min} and ${parameters.max}`;
      case VALIDATION_RULE_TYPES.EMAIL:
        return "Must be a valid email address";
      case VALIDATION_RULE_TYPES.URL:
        return "Must be a valid URL";
      case VALIDATION_RULE_TYPES.NUMERIC:
        return "Must be a number";
      case VALIDATION_RULE_TYPES.ALPHA:
        return "Must contain only letters";
      case VALIDATION_RULE_TYPES.ALPHANUMERIC:
        return "Must contain only letters and numbers";
      case VALIDATION_RULE_TYPES.CUSTOM:
        return parameters.errorMessage;
      default:
        return "Validation failed";
    }
  }

  /**
   * Factory methods for common validation rules
   */
  static required(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.REQUIRED }, errorMessage);
  }

  static minLength(minLength: number, errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.MIN_LENGTH, minLength }, errorMessage);
  }

  static maxLength(maxLength: number, errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.MAX_LENGTH, maxLength }, errorMessage);
  }

  static pattern(pattern: string, flags?: string, errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.PATTERN, pattern, flags }, errorMessage);
  }

  static range(min: number, max: number, errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.RANGE, min, max }, errorMessage);
  }

  static email(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.EMAIL }, errorMessage);
  }

  static url(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.URL }, errorMessage);
  }

  static numeric(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.NUMERIC }, errorMessage);
  }

  static alpha(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.ALPHA }, errorMessage);
  }

  static alphanumeric(errorMessage?: string): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.ALPHANUMERIC }, errorMessage);
  }

  static custom(
    validator: (value: unknown) => boolean,
    errorMessage: string
  ): Result<ValidationRule, ValidationRuleError> {
    return ValidationRule.create({ type: VALIDATION_RULE_TYPES.CUSTOM, validator, errorMessage });
  }

  /**
   * Get rule type
   */
  get type(): ValidationRuleType {
    return this._type;
  }

  /**
   * Get rule parameters
   */
  get parameters(): ValidationRuleParameters {
    return this._parameters;
  }

  /**
   * Get error message
   */
  get errorMessage(): string {
    return this._errorMessage;
  }

  /**
   * Validate a value against this rule
   */
  validate(value: unknown): { isValid: boolean; error?: string } {
    switch (this._parameters.type) {
      case VALIDATION_RULE_TYPES.REQUIRED:
        return this.validateRequired(value);
      case VALIDATION_RULE_TYPES.MIN_LENGTH:
        return this.validateMinLength(value, this._parameters.minLength);
      case VALIDATION_RULE_TYPES.MAX_LENGTH:
        return this.validateMaxLength(value, this._parameters.maxLength);
      case VALIDATION_RULE_TYPES.PATTERN:
        return this.validatePattern(value, this._parameters.pattern, this._parameters.flags);
      case VALIDATION_RULE_TYPES.RANGE:
        return this.validateRange(value, this._parameters.min, this._parameters.max);
      case VALIDATION_RULE_TYPES.EMAIL:
        return this.validateEmail(value);
      case VALIDATION_RULE_TYPES.URL:
        return this.validateUrl(value);
      case VALIDATION_RULE_TYPES.NUMERIC:
        return this.validateNumeric(value);
      case VALIDATION_RULE_TYPES.ALPHA:
        return this.validateAlpha(value);
      case VALIDATION_RULE_TYPES.ALPHANUMERIC:
        return this.validateAlphanumeric(value);
      case VALIDATION_RULE_TYPES.CUSTOM:
        return this.validateCustom(value, this._parameters.validator);
      default:
        return { isValid: false, error: "Unknown validation rule type" };
    }
  }

  /**
   * Individual validation methods
   */
  private validateRequired(value: unknown): { isValid: boolean; error?: string } {
    const isValid = value !== null && value !== undefined && value !== "";
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateMinLength(value: unknown, minLength: number): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const isValid = value.length >= minLength;
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateMaxLength(value: unknown, maxLength: number): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const isValid = value.length <= maxLength;
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validatePattern(value: unknown, pattern: string, flags?: string): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const regex = new RegExp(pattern, flags);
    const isValid = regex.test(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateRange(value: unknown, min: number, max: number): { isValid: boolean; error?: string } {
    if (typeof value !== "number") {
      return { isValid: false, error: "Value must be a number" };
    }
    const isValid = value >= min && value <= max;
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateEmail(value: unknown): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateUrl(value: unknown): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: this._errorMessage };
    }
  }

  private validateNumeric(value: unknown): { isValid: boolean; error?: string } {
    const isValid = typeof value === "number" && Number.isFinite(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateAlpha(value: unknown): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const alphaRegex = /^[a-zA-Z]+$/;
    const isValid = alphaRegex.test(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateAlphanumeric(value: unknown): { isValid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { isValid: false, error: "Value must be a string" };
    }
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    const isValid = alphanumericRegex.test(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  private validateCustom(value: unknown, validator: (value: unknown) => boolean): { isValid: boolean; error?: string } {
    const isValid = validator(value);
    return { isValid, error: isValid ? undefined : this._errorMessage };
  }

  /**
   * Value equality comparison
   */
  equals(other: ValidationRule): boolean {
    return this._type === other._type &&
           JSON.stringify(this._parameters) === JSON.stringify(other._parameters) &&
           this._errorMessage === other._errorMessage;
  }

  /**
   * Check if this is a required rule
   */
  isRequired(): boolean {
    return this._type === VALIDATION_RULE_TYPES.REQUIRED;
  }

  /**
   * Check if this is a length-based rule
   */
  isLengthBased(): boolean {
    return this._type === VALIDATION_RULE_TYPES.MIN_LENGTH ||
           this._type === VALIDATION_RULE_TYPES.MAX_LENGTH;
  }

  /**
   * Check if this is a format-based rule
   */
  isFormatBased(): boolean {
    return this._type === VALIDATION_RULE_TYPES.EMAIL ||
           this._type === VALIDATION_RULE_TYPES.URL ||
           this._type === VALIDATION_RULE_TYPES.PATTERN;
  }

  /**
   * String representation
   */
  toString(): string {
    return `ValidationRule(${this._type})`;
  }

  /**
   * JSON serialization
   */
  toJSON(): { type: ValidationRuleType; parameters: ValidationRuleParameters; errorMessage: string } {
    return {
      type: this._type,
      parameters: this._parameters,
      errorMessage: this._errorMessage,
    };
  }
}

/**
 * Collection of validation rules
 */
export class ValidationRuleSet {
  private readonly _rules: ValidationRule[];

  private constructor(rules: ValidationRule[]) {
    this._rules = [...rules];
    Object.freeze(this);
  }

  /**
   * Create a validation rule set
   */
  static create(rules: ValidationRule[]): ValidationRuleSet {
    return new ValidationRuleSet(rules);
  }

  /**
   * Get all rules
   */
  get rules(): ValidationRule[] {
    return [...this._rules];
  }

  /**
   * Validate a value against all rules
   */
  validate(value: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this._rules) {
      const result = rule.validate(value);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if the set contains a required rule
   */
  hasRequiredRule(): boolean {
    return this._rules.some(rule => rule.isRequired());
  }

  /**
   * Get the count of rules
   */
  getCount(): number {
    return this._rules.length;
  }

  /**
   * Check if the set is empty
   */
  isEmpty(): boolean {
    return this._rules.length === 0;
  }
}

/**
 * Format validation rule error for user-friendly display
 */
export function formatValidationRuleError(error: ValidationRuleError): string {
  switch (error.kind) {
    case "InvalidRuleType":
      return `Invalid validation rule type: "${error.input}". ` +
        `Valid types are: ${error.validTypes.join(", ")}`;

    case "InvalidFormat":
      return `Invalid format for validation rule: ${error.reason}`;

    case "InvalidParameters":
      return `Invalid parameters for ${error.ruleType} rule: ${error.reason}`;

    case "MissingParameters":
      return `Missing required parameters for ${error.ruleType} rule: ${error.requiredParameters.join(", ")}`;

    default:
      return "Unknown validation rule error occurred.";
  }
}