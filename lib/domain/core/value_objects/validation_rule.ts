/**
 * ValidationRule - バリデーションルールを表現するValue Object
 * 
 * バリデーションのルールと条件を型安全に扱うための不変オブジェクト。
 * 複数のルールを組み合わせたり、条件付きバリデーションを表現可能。
 */

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
  }
  
  /**
   * 基本的なバリデーションルールを作成
   */
  public static create<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string
  ): ValidationRule<T> {
    if (!name || name.trim().length === 0) {
      throw new Error("Validation rule name cannot be empty");
    }
    
    if (!errorMessage || errorMessage.trim().length === 0) {
      throw new Error("Error message cannot be empty");
    }
    
    return new ValidationRule(name.trim(), validator, errorMessage.trim());
  }
  
  /**
   * 必須フィールドのバリデーションルール
   */
  public static required<T>(fieldName: string): ValidationRule<T | null | undefined> {
    return new ValidationRule(
      `required_${fieldName}`,
      (value) => value !== null && value !== undefined,
      `${fieldName} is required`
    );
  }
  
  /**
   * 文字列の最小長バリデーション
   */
  public static minLength(minLength: number, fieldName: string = "value"): ValidationRule<string> {
    if (minLength < 0) {
      throw new Error("Min length must be non-negative");
    }
    
    return new ValidationRule(
      `minLength_${minLength}_${fieldName}`,
      (value) => value.length >= minLength,
      `${fieldName} must be at least ${minLength} characters long`
    );
  }
  
  /**
   * 文字列の最大長バリデーション
   */
  public static maxLength(maxLength: number, fieldName: string = "value"): ValidationRule<string> {
    if (maxLength < 0) {
      throw new Error("Max length must be non-negative");
    }
    
    return new ValidationRule(
      `maxLength_${maxLength}_${fieldName}`,
      (value) => value.length <= maxLength,
      `${fieldName} must not exceed ${maxLength} characters`
    );
  }
  
  /**
   * 正規表現によるバリデーション
   */
  public static pattern(pattern: RegExp, fieldName: string = "value", message?: string): ValidationRule<string> {
    return new ValidationRule(
      `pattern_${fieldName}`,
      (value) => pattern.test(value),
      message || `${fieldName} does not match the required pattern`
    );
  }
  
  /**
   * 数値の範囲バリデーション
   */
  public static range(min: number, max: number, fieldName: string = "value"): ValidationRule<number> {
    if (min > max) {
      throw new Error("Min value cannot be greater than max value");
    }
    
    return new ValidationRule(
      `range_${min}_${max}_${fieldName}`,
      (value) => value >= min && value <= max,
      `${fieldName} must be between ${min} and ${max}`
    );
  }
  
  /**
   * カスタムバリデーション
   */
  public static custom<T>(
    name: string,
    validator: ValidationFunction<T>,
    errorMessage: string
  ): ValidationRule<T> {
    return ValidationRule.create(name, validator, errorMessage);
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
   * エラーメッセージのカスタマイズ
   */
  public withMessage(newMessage: string): ValidationRule<T> {
    if (!newMessage || newMessage.trim().length === 0) {
      throw new Error("Error message cannot be empty");
    }
    
    return new ValidationRule(
      this.name,
      this.validator,
      newMessage.trim(),
      this.isOptional
    );
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
   * 複数のルールを組み合わせた複合バリデーション
   */
  public static combine<T>(rules: ValidationRule<T>[]): ValidationRule<T> {
    if (rules.length === 0) {
      throw new Error("At least one rule must be provided");
    }
    
    if (rules.length === 1) {
      return rules[0];
    }
    
    const combinedValidator: ValidationFunction<T> = (value) => {
      return rules.every(rule => rule.validator(value));
    };
    
    const errorMessages = rules.map(rule => rule.errorMessage);
    const combinedMessage = errorMessages.join("; ");
    const ruleNames = rules.map(rule => rule.name).join("_");
    const allOptional = rules.every(rule => rule.isOptional);
    
    return new ValidationRule(
      `combined_${ruleNames}`,
      combinedValidator,
      combinedMessage,
      allOptional
    );
  }
  
  /**
   * 文字列表現
   */
  public toString(): string {
    return `ValidationRule(${this.name}${this.isOptional ? ", optional" : ""})`;
  }
}