/**
 * @fileoverview Validation Rule Value Object with Smart Constructor and Totality design
 *
 * This module provides a type-safe ValidationRule value object following
 * Domain-Driven Design principles and the Totality pattern. All operations
 * return Result types instead of throwing exceptions, ensuring complete
 * type safety and explicit error handling.
 *
 * ## Design Patterns Applied
 * - Smart Constructor: Type-safe creation with validation
 * - Discriminated Union: Explicit error types with type guards
 * - Result Type: No exceptions, all errors as values
 * - Value Object: Immutable with domain logic encapsulation
 *
 * ## Domain Context
 * ValidationRule represents business validation rules within the
 * Breakdown application validation management bounded context.
 * It enforces domain rules for valid validation specifications.
 *
 * @module domain/core/value_objects/validation_rule
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

/**
 * バリデーション関数の型定義
 */
export type ValidationFunction<T> = (value: T) => boolean;

/**
 * バリデーション結果の型定義
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errorMessage?: string;
  readonly appliedRules: string[];
}

/**
 * Discriminated Union for ValidationRule-specific errors
 * 
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 * The error types reflect domain concepts and validation constraints.
 */
export type ValidationRuleError =
  | {
    kind: "EmptyName";
    message: string;
    providedName: string;
  }
  | {
    kind: "EmptyErrorMessage";
    message: string;
    providedMessage: string;
  }
  | {
    kind: "InvalidValidator";
    message: string;
    validator?: unknown;
  }
  | {
    kind: "InvalidRange";
    message: string;
    min: number;
    max: number;
  }
  | {
    kind: "NegativeLength";
    message: string;
    providedLength: number;
    parameter: "minLength" | "maxLength";
  }
  | {
    kind: "EmptyRuleSet";
    message: string;
    operation: "combine" | "and" | "or";
  }
  | {
    kind: "NullOrUndefined";
    message: string;
    parameter: string;
  }
  | {
    kind: "InvalidType";
    message: string;
    expected: string;
    actual: string;
  };

/**
 * Type guards for ValidationRuleError discrimination
 * 
 * These type guards enable exhaustive pattern matching over error types
 * and provide type-safe access to error-specific properties.
 */
export function isEmptyNameError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "EmptyName" }> {
  return error.kind === "EmptyName";
}

export function isEmptyErrorMessageError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "EmptyErrorMessage" }> {
  return error.kind === "EmptyErrorMessage";
}

export function isInvalidValidatorError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "InvalidValidator" }> {
  return error.kind === "InvalidValidator";
}

export function isInvalidRangeError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "InvalidRange" }> {
  return error.kind === "InvalidRange";
}

export function isNegativeLengthError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "NegativeLength" }> {
  return error.kind === "NegativeLength";
}

export function isEmptyRuleSetError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "EmptyRuleSet" }> {
  return error.kind === "EmptyRuleSet";
}

export function isNullOrUndefinedError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "NullOrUndefined" }> {
  return error.kind === "NullOrUndefined";
}

export function isInvalidTypeError(error: ValidationRuleError): error is Extract<ValidationRuleError, { kind: "InvalidType" }> {
  return error.kind === "InvalidType";
}

/**
 * Format ValidationRuleError for display
 * 
 * Provides human-readable error messages for all error types
 * with contextual information to help users understand and fix issues.
 */
export function formatValidationRuleError(validationError: ValidationRuleError): string {
  switch (validationError.kind) {
    case "EmptyName":
      return `Validation rule name cannot be empty: "${validationError.providedName}". ${validationError.message}`;
    case "EmptyErrorMessage":
      return `Error message cannot be empty: "${validationError.providedMessage}". ${validationError.message}`;
    case "InvalidValidator":
      return `Invalid validator function: ${validationError.message}`;
    case "InvalidRange":
      return `Invalid range: min (${validationError.min}) cannot be greater than max (${validationError.max}). ${validationError.message}`;
    case "NegativeLength":
      return `${validationError.parameter} cannot be negative: ${validationError.providedLength}. ${validationError.message}`;
    case "EmptyRuleSet":
      return `Cannot ${validationError.operation} with empty rule set: ${validationError.message}`;
    case "NullOrUndefined":
      return `Parameter "${validationError.parameter}" cannot be null or undefined: ${validationError.message}`;
    case "InvalidType":
      return `Invalid type for parameter: expected ${validationError.expected}, got ${validationError.actual}. ${validationError.message}`;
  }
}

export class ValidationRule<T> {
  private readonly name: string;
  private readonly validator: ValidationFunction<T>;
  private readonly errorMessage: string;
  private readonly isOptional: boolean;
  
  private constructor(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string,
    isOptional: boolean = false
  ) {
    this.name = name;
    this.validator = validator;
    this.errorMessage = errorMessage;
    this.isOptional = isOptional;
    // Ensure complete immutability
    Object.freeze(this);
  }
  
  /**
   * Smart Constructor for ValidationRule with comprehensive validation
   * 
   * Validates all domain rules for validation specifications and returns
   * a Result type containing either a valid ValidationRule or specific error.
   * 
   * @param name - The rule name identifier
   * @param validator - The validation function
   * @param errorMessage - The error message for validation failures
   * @returns Result containing ValidationRule or ValidationRuleError
   * 
   * @example
   * ```typescript
   * const ruleResult = ValidationRule.create(
   *   "required_username",
   *   (value) => value != null && value.trim().length > 0,
   *   "Username is required"
   * );
   * if (ruleResult.ok) {
   *   console.log(`Valid rule: ${ruleResult.data.getName()}`);
   * } else {
   *   console.error(formatValidationRuleError(ruleResult.error));
   * }
   * ```
   */
  static create<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string
  ): Result<ValidationRule<T>, ValidationRuleError> {
    // Validate name
    if (name == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Validation rule name must be provided",
        parameter: "name",
      });
    }

    if (typeof name !== "string") {
      return error({
        kind: "InvalidType",
        message: "Validation rule name must be a string",
        expected: "string",
        actual: typeof name,
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return error({
        kind: "EmptyName",
        message: "Validation rule name cannot be empty or whitespace only",
        providedName: name,
      });
    }

    // Validate validator function
    if (validator == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Validator function must be provided",
        parameter: "validator",
      });
    }

    if (typeof validator !== "function") {
      return error({
        kind: "InvalidValidator",
        message: "Validator must be a function",
        validator,
      });
    }

    // Validate error message
    if (errorMessage == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Error message must be provided",
        parameter: "errorMessage",
      });
    }

    if (typeof errorMessage !== "string") {
      return error({
        kind: "InvalidType",
        message: "Error message must be a string",
        expected: "string",
        actual: typeof errorMessage,
      });
    }

    const trimmedMessage = errorMessage.trim();
    if (trimmedMessage.length === 0) {
      return error({
        kind: "EmptyErrorMessage",
        message: "Error message cannot be empty or whitespace only",
        providedMessage: errorMessage,
      });
    }

    // All validations passed - create immutable ValidationRule
    return ok(new ValidationRule(trimmedName, validator, trimmedMessage));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ValidationRule.create() for Result-based error handling
   */
  public static createUnsafe<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string
  ): ValidationRule<T> {
    const result = ValidationRule.create(name, validator, errorMessage);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * 必須フィールドのバリデーションルール (Legacy method for backward compatibility)
   */
  public static required<T>(fieldName: string): ValidationRule<T | null | undefined> {
    const result = ValidationRule.create(
      `required_${fieldName}`,
      (value: T | null | undefined) => value !== null && value !== undefined,
      `${fieldName} is required`
    );
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * Smart Constructor for minimum length validation with Result type
   */
  public static minLength(
    minLength: number, 
    fieldName: string = "value"
  ): Result<ValidationRule<string>, ValidationRuleError> {
    if (minLength == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Minimum length must be provided",
        parameter: "minLength",
      });
    }

    if (typeof minLength !== "number") {
      return error({
        kind: "InvalidType",
        message: "Minimum length must be a number",
        expected: "number",
        actual: typeof minLength,
      });
    }

    if (minLength < 0) {
      return error({
        kind: "NegativeLength",
        message: "Minimum length must be non-negative",
        providedLength: minLength,
        parameter: "minLength",
      });
    }
    
    return ValidationRule.create(
      `minLength_${minLength}_${fieldName}`,
      (value) => value.length >= minLength,
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ValidationRule.minLength() for Result-based error handling
   */
  public static minLengthUnsafe(minLength: number, fieldName: string = "value"): ValidationRule<string> {
    const result = ValidationRule.minLength(minLength, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * Smart Constructor for maximum length validation with Result type
   */
  public static maxLength(
    maxLength: number, 
    fieldName: string = "value"
  ): Result<ValidationRule<string>, ValidationRuleError> {
    if (maxLength == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Maximum length must be provided",
        parameter: "maxLength",
      });
    }

    if (typeof maxLength !== "number") {
      return error({
        kind: "InvalidType",
        message: "Maximum length must be a number",
        expected: "number",
        actual: typeof maxLength,
      });
    }

    if (maxLength < 0) {
      return error({
        kind: "NegativeLength",
        message: "Maximum length must be non-negative",
        providedLength: maxLength,
        parameter: "maxLength",
      });
    }
    
    return ValidationRule.create(
      `maxLength_${maxLength}_${fieldName}`,
      (value) => value.length <= maxLength,
      `${fieldName} must not exceed ${maxLength} characters`
    );
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ValidationRule.maxLength() for Result-based error handling
   */
  public static maxLengthUnsafe(maxLength: number, fieldName: string = "value"): ValidationRule<string> {
    const result = ValidationRule.maxLength(maxLength, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * 正規表現によるバリデーション (Legacy method for backward compatibility)
   */
  public static pattern(pattern: RegExp, fieldName: string = "value", message?: string): ValidationRule<string> {
    const result = ValidationRule.create(
      `pattern_${fieldName}`,
      (value: string) => pattern.test(value),
      message || `${fieldName} does not match the required pattern`
    );
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * Smart Constructor for numeric range validation with Result type
   */
  public static range(
    min: number, 
    max: number, 
    fieldName: string = "value"
  ): Result<ValidationRule<number>, ValidationRuleError> {
    if (min == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Minimum value must be provided",
        parameter: "min",
      });
    }

    if (max == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Maximum value must be provided",
        parameter: "max",
      });
    }

    if (typeof min !== "number" || typeof max !== "number") {
      return error({
        kind: "InvalidType",
        message: "Min and max values must be numbers",
        expected: "number",
        actual: `min: ${typeof min}, max: ${typeof max}`,
      });
    }

    if (min > max) {
      return error({
        kind: "InvalidRange",
        message: "Minimum value cannot be greater than maximum value",
        min,
        max,
      });
    }
    
    return ValidationRule.create(
      `range_${min}_${max}_${fieldName}`,
      (value) => value >= min && value <= max,
      `${fieldName} must be between ${min} and ${max}`
    );
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ValidationRule.range() for Result-based error handling
   */
  public static rangeUnsafe(min: number, max: number, fieldName: string = "value"): ValidationRule<number> {
    const result = ValidationRule.range(min, max, fieldName);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * カスタムバリデーション (Legacy method for backward compatibility)
   */
  public static custom<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string
  ): ValidationRule<T> {
    const result = ValidationRule.create(name, validator, errorMessage);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * バリデーションの実行
   */
  public validate(value: T): ValidationResult {
    const isValid = this.validator(value);
    
    return {
      isValid,
      errorMessage: isValid ? undefined : this.errorMessage,
      appliedRules: [this.name],
    };
  }
  
  /**
   * 条件付きバリデーション
   */
  public when<U>(
    condition: (context: U) => boolean,
    contextValue: U
  ): ValidationRule<T> {
    const conditionalValidator: ValidationFunction<T> = (value) => {
      if (!condition(contextValue)) {
        return true; // 条件が満たされない場合は常に有効
      }
      return this.validator(value);
    };
    
    return new ValidationRule(
      `conditional_${this.name}`,
      conditionalValidator,
      this.errorMessage,
      this.isOptional
    );
  }
  
  /**
   * オプショナルフィールドのバリデーション
   */
  public optional(): ValidationRule<T | null | undefined> {
    const optionalValidator: ValidationFunction<T | null | undefined> = (value) => {
      if (value === null || value === undefined) {
        return true;
      }
      return this.validator(value as T);
    };
    
    return new ValidationRule(
      `optional_${this.name}`,
      optionalValidator,
      this.errorMessage,
      true
    );
  }
  
  /**
   * AND条件での結合
   */
  public and(other: ValidationRule<T>): ValidationRule<T> {
    const combinedValidator: ValidationFunction<T> = (value) => {
      return this.validator(value) && other.validator(value);
    };
    
    const combinedMessage = `${this.errorMessage} AND ${other.errorMessage}`;
    
    return new ValidationRule(
      `${this.name}_and_${other.name}`,
      combinedValidator,
      combinedMessage,
      this.isOptional && other.isOptional
    );
  }
  
  /**
   * OR条件での結合
   */
  public or(other: ValidationRule<T>): ValidationRule<T> {
    const combinedValidator: ValidationFunction<T> = (value) => {
      return this.validator(value) || other.validator(value);
    };
    
    const combinedMessage = `${this.errorMessage} OR ${other.errorMessage}`;
    
    return new ValidationRule(
      `${this.name}_or_${other.name}`,
      combinedValidator,
      combinedMessage,
      this.isOptional || other.isOptional
    );
  }
  
  /**
   * Create new ValidationRule with custom error message (Result type)
   */
  public withMessage(newMessage: string): Result<ValidationRule<T>, ValidationRuleError> {
    if (newMessage == null) {
      return error({
        kind: "NullOrUndefined",
        message: "New error message must be provided",
        parameter: "newMessage",
      });
    }

    if (typeof newMessage !== "string") {
      return error({
        kind: "InvalidType",
        message: "Error message must be a string",
        expected: "string",
        actual: typeof newMessage,
      });
    }

    const trimmedMessage = newMessage.trim();
    if (trimmedMessage.length === 0) {
      return error({
        kind: "EmptyErrorMessage",
        message: "Error message cannot be empty or whitespace only",
        providedMessage: newMessage,
      });
    }
    
    return ok(new ValidationRule(
      this.name,
      this.validator,
      trimmedMessage,
      this.isOptional
    ));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use withMessage() for Result-based error handling
   */
  public withMessageUnsafe(newMessage: string): ValidationRule<T> {
    const result = this.withMessage(newMessage);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * ルール名の取得
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * エラーメッセージの取得
   */
  public getErrorMessage(): string {
    return this.errorMessage;
  }
  
  /**
   * オプショナルかどうかの判定
   */
  public isOptionalRule(): boolean {
    return this.isOptional;
  }
  
  /**
   * Smart Constructor for combining multiple validation rules with Result type
   */
  public static combine<T>(rules: ValidationRule<T>[]): Result<ValidationRule<T>, ValidationRuleError> {
    if (rules == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Rules array must be provided",
        parameter: "rules",
      });
    }

    if (!Array.isArray(rules)) {
      return error({
        kind: "InvalidType",
        message: "Rules must be an array",
        expected: "ValidationRule[]",
        actual: typeof rules,
      });
    }

    if (rules.length === 0) {
      return error({
        kind: "EmptyRuleSet",
        message: "At least one rule must be provided for combination",
        operation: "combine",
      });
    }
    
    if (rules.length === 1) {
      return ok(rules[0]);
    }
    
    const combinedValidator: ValidationFunction<T> = (value) => {
      return rules.every(rule => rule.validator(value));
    };
    
    const errorMessages = rules.map(rule => rule.errorMessage);
    const combinedMessage = errorMessages.join("; ");
    const ruleNames = rules.map(rule => rule.name).join("_");
    const allOptional = rules.every(rule => rule.isOptional);
    
    return ok(new ValidationRule(
      `combined_${ruleNames}`,
      combinedValidator,
      combinedMessage,
      allOptional
    ));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ValidationRule.combine() for Result-based error handling
   */
  public static combineUnsafe<T>(rules: ValidationRule<T>[]): ValidationRule<T> {
    const result = ValidationRule.combine(rules);
    if (!result.ok) {
      throw new Error(formatValidationRuleError(result.error));
    }
    return result.data;
  }
  
  /**
   * 文字列表現
   */
  public toString(): string {
    return `ValidationRule(${this.name}${this.isOptional ? ", optional" : ""})`;
  }
}