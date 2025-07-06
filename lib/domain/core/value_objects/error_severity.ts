/**
 * ErrorSeverity - エラーの重要度を表現するValue Object
 * 
 * エラーの重要度レベルを型安全に扱うための不変オブジェクト。
 * ログレベルや通知レベルの判定に使用。
 */

/**
 * エラーの重要度レベル
 */
export enum SeverityLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
  FATAL = 5,
}

/**
 * エラーの影響範囲
 */
export enum ImpactScope {
  NONE = "none",
  LOCAL = "local",
  MODULE = "module",
  SYSTEM = "system",
  GLOBAL = "global",
}

/**
 * エラーメタデータ
 */
export interface ErrorMetadata {
  readonly code?: string;
  readonly category?: string;
  readonly timestamp?: Date;
  readonly context?: Record<string, unknown>;
}

export class ErrorSeverity {
  private readonly level: SeverityLevel;
  private readonly impact: ImpactScope;
  private readonly metadata: ErrorMetadata;
  
  private constructor(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata: ErrorMetadata = {}
  ) {
    this.level = level;
    this.impact = impact;
    this.metadata = Object.freeze({ ...metadata });
  }
  
  /**
   * デバッグレベルのエラー重要度を生成
   */
  public static debug(impact: ImpactScope = ImpactScope.NONE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.DEBUG, impact, metadata);
  }
  
  /**
   * 情報レベルのエラー重要度を生成
   */
  public static info(impact: ImpactScope = ImpactScope.LOCAL, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.INFO, impact, metadata);
  }
  
  /**
   * 警告レベルのエラー重要度を生成
   */
  public static warning(impact: ImpactScope = ImpactScope.MODULE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.WARNING, impact, metadata);
  }
  
  /**
   * エラーレベルのエラー重要度を生成
   */
  public static error(impact: ImpactScope = ImpactScope.MODULE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.ERROR, impact, metadata);
  }
  
  /**
   * 重大レベルのエラー重要度を生成
   */
  public static critical(impact: ImpactScope = ImpactScope.SYSTEM, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.CRITICAL, impact, metadata);
  }
  
  /**
   * 致命的レベルのエラー重要度を生成
   */
  public static fatal(impact: ImpactScope = ImpactScope.GLOBAL, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.FATAL, impact, metadata);
  }
  
  /**
   * カスタムエラー重要度を生成
   */
  public static custom(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata
  ): ErrorSeverity {
    return new ErrorSeverity(level, impact, metadata);
  }
  
  /**
   * 文字列からエラー重要度を生成
   */
  public static fromString(levelStr: string, impact?: ImpactScope, metadata?: ErrorMetadata): ErrorSeverity {
    const normalizedLevel = levelStr.toUpperCase();
    const level = SeverityLevel[normalizedLevel as keyof typeof SeverityLevel];
    
    if (level === undefined) {
      throw new Error(`Invalid severity level: ${levelStr}`);
    }
    
    const defaultImpact = this.getDefaultImpactForLevel(level);
    return new ErrorSeverity(level, impact || defaultImpact, metadata);
  }
  
  /**
   * レベルに応じたデフォルトの影響範囲を取得
   */
  private static getDefaultImpactForLevel(level: SeverityLevel): ImpactScope {
    switch (level) {
      case SeverityLevel.DEBUG:
        return ImpactScope.NONE;
      case SeverityLevel.INFO:
        return ImpactScope.LOCAL;
      case SeverityLevel.WARNING:
      case SeverityLevel.ERROR:
        return ImpactScope.MODULE;
      case SeverityLevel.CRITICAL:
        return ImpactScope.SYSTEM;
      case SeverityLevel.FATAL:
        return ImpactScope.GLOBAL;
      default:
        return ImpactScope.LOCAL;
    }
  }
  
  /**
   * 重要度レベルを取得
   */
  public getLevel(): SeverityLevel {
    return this.level;
  }
  
  /**
   * 影響範囲を取得
   */
  public getImpact(): ImpactScope {
    return this.impact;
  }
  
  /**
   * メタデータを取得
   */
  public getMetadata(): ErrorMetadata {
    return { ...this.metadata };
  }
  
  /**
   * レベル名を文字列で取得
   */
  public getLevelName(): string {
    return SeverityLevel[this.level];
  }
  
  /**
   * 数値としてのレベルを取得
   */
  public getNumericLevel(): number {
    return this.level;
  }
  
  /**
   * 指定されたレベル以上かどうかを判定
   */
  public isAtLeast(threshold: SeverityLevel): boolean {
    return this.level >= threshold;
  }
  
  /**
   * 指定されたレベルより高いかどうかを判定
   */
  public isHigherThan(other: ErrorSeverity): boolean {
    return this.level > other.level;
  }
  
  /**
   * 通知が必要かどうかを判定
   */
  public requiresNotification(threshold: SeverityLevel = SeverityLevel.ERROR): boolean {
    return this.isAtLeast(threshold);
  }
  
  /**
   * 即座の対応が必要かどうかを判定
   */
  public requiresImmediateAction(): boolean {
    return this.level >= SeverityLevel.CRITICAL;
  }
  
  /**
   * システム停止が必要かどうかを判定
   */
  public requiresSystemHalt(): boolean {
    return this.level === SeverityLevel.FATAL;
  }
  
  /**
   * ログ出力が必要かどうかを判定
   */
  public shouldLog(logLevel: SeverityLevel): boolean {
    return this.level >= logLevel;
  }
  
  /**
   * メタデータを追加した新しいインスタンスを生成
   */
  public withMetadata(additionalMetadata: ErrorMetadata): ErrorSeverity {
    const mergedMetadata = {
      ...this.metadata,
      ...additionalMetadata,
      context: {
        ...this.metadata.context,
        ...additionalMetadata.context,
      },
    };
    
    return new ErrorSeverity(this.level, this.impact, mergedMetadata);
  }
  
  /**
   * エラーコードを設定した新しいインスタンスを生成
   */
  public withCode(code: string): ErrorSeverity {
    return this.withMetadata({ code });
  }
  
  /**
   * カテゴリを設定した新しいインスタンスを生成
   */
  public withCategory(category: string): ErrorSeverity {
    return this.withMetadata({ category });
  }
  
  /**
   * 影響範囲を変更した新しいインスタンスを生成
   */
  public withImpact(impact: ImpactScope): ErrorSeverity {
    return new ErrorSeverity(this.level, impact, this.metadata);
  }
  
  /**
   * より高い重要度と比較して高い方を返す
   */
  public escalate(other: ErrorSeverity): ErrorSeverity {
    if (other.level > this.level) {
      // より高いレベルの場合、メタデータをマージして返す
      return new ErrorSeverity(other.level, other.impact, {
        ...this.metadata,
        ...other.metadata,
      });
    }
    
    if (other.level === this.level && this.getImpactPriority(other.impact) > this.getImpactPriority(this.impact)) {
      return new ErrorSeverity(this.level, other.impact, {
        ...this.metadata,
        ...other.metadata,
      });
    }
    
    return this;
  }
  
  /**
   * 影響範囲の優先度を取得
   */
  private getImpactPriority(impact: ImpactScope): number {
    const priorities: Record<ImpactScope, number> = {
      [ImpactScope.NONE]: 0,
      [ImpactScope.LOCAL]: 1,
      [ImpactScope.MODULE]: 2,
      [ImpactScope.SYSTEM]: 3,
      [ImpactScope.GLOBAL]: 4,
    };
    
    return priorities[impact] || 0;
  }
  
  /**
   * 等価性の比較
   */
  public equals(other: ErrorSeverity): boolean {
    return this.level === other.level && 
           this.impact === other.impact &&
           JSON.stringify(this.metadata) === JSON.stringify(other.metadata);
  }
  
  /**
   * ログ出力用のフォーマット
   */
  public toLogFormat(): string {
    const parts = [
      `[${this.getLevelName()}]`,
      `impact=${this.impact}`,
    ];
    
    if (this.metadata.code) {
      parts.push(`code=${this.metadata.code}`);
    }
    
    if (this.metadata.category) {
      parts.push(`category=${this.metadata.category}`);
    }
    
    return parts.join(" ");
  }
  
  /**
   * JSON形式への変換
   */
  public toJSON(): Record<string, unknown> {
    return {
      level: this.getLevelName(),
      numericLevel: this.level,
      impact: this.impact,
      metadata: this.metadata,
      requiresNotification: this.requiresNotification(),
      requiresImmediateAction: this.requiresImmediateAction(),
    };
  }
  
  /**
   * 文字列表現
   */
  public toString(): string {
    return `ErrorSeverity(${this.getLevelName()}, ${this.impact})`;
  }
}