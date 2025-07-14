/**
 * @fileoverview ErrorSeverity Value Object - Enhanced Totality Pattern Implementation
 *
 * Smart Constructor、Result型、Discriminated Unionパターンを統合したTotality準拠の
 * エラー重要度管理システム。型安全性、不変性、包括的エラーハンドリングを実現。
 *
 * 主要パターン:
 * - Smart Constructor: プライベートコンストラクタ + パブリック静的ファクトリーメソッド
 * - Result型: 例外ではなく明示的なエラーハンドリング
 * - Discriminated Union: 型安全なエラー分類
 * - Value Object: 不変性と等価性の保証
 * - Defensive Copying: メタデータの改変防止
 *
 * @module domain/core/value_objects/error_severity
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

// =============================================================================
// ENUMS AND TYPES
// =============================================================================

/**
 * エラー重要度レベル（数値ベース）
 * 数値が大きいほど重要度が高い
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
 * 影響範囲（文字列ベースのDiscriminated Union）
 */
export enum ImpactScope {
  NONE = "none",
  LOCAL = "local",
  MODULE = "module",
  SYSTEM = "system",
  GLOBAL = "global",
}

/**
 * エラーメタデータインターフェース
 * 拡張可能なメタデータ構造を提供
 */
export interface ErrorMetadata {
  readonly code?: string;
  readonly category?: string;
  readonly timestamp?: Date;
  readonly context?: Record<string, unknown>;
}

// =============================================================================
// DISCRIMINATED UNION ERROR TYPES
// =============================================================================

/**
 * ErrorSeverity Discriminated Union エラー型
 * 各エラー種別を型安全に区別可能
 */
export type ErrorSeverityError =
  | { kind: "InvalidLevel"; level: unknown; message: string }
  | { kind: "InvalidImpact"; impact: unknown; message: string }
  | { kind: "InvalidMetadata"; metadata: unknown; message: string }
  | { kind: "InvalidType"; type: unknown; message: string }
  | { kind: "NullOrUndefined"; message: string };

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isInvalidLevelError(error: ErrorSeverityError): error is { kind: "InvalidLevel"; level: unknown; message: string } {
  return error.kind === "InvalidLevel";
}

export function isInvalidImpactError(error: ErrorSeverityError): error is { kind: "InvalidImpact"; impact: unknown; message: string } {
  return error.kind === "InvalidImpact";
}

export function isInvalidMetadataError(error: ErrorSeverityError): error is { kind: "InvalidMetadata"; metadata: unknown; message: string } {
  return error.kind === "InvalidMetadata";
}

export function isInvalidTypeError(error: ErrorSeverityError): error is { kind: "InvalidType"; type: unknown; message: string } {
  return error.kind === "InvalidType";
}

export function isNullOrUndefinedError(error: ErrorSeverityError): error is { kind: "NullOrUndefined"; message: string } {
  return error.kind === "NullOrUndefined";
}

// =============================================================================
// ERROR FORMATTER
// =============================================================================

/**
 * ErrorSeverityError 包括的フォーマッター
 * ユーザーフレンドリーなエラーメッセージを生成
 */
export function formatErrorSeverityError(error: ErrorSeverityError): string {
  switch (error.kind) {
    case "InvalidLevel":
      return `Invalid severity level: "${error.level}". Valid levels: debug, info, warning, error, critical, fatal`;

    case "InvalidImpact":
      return `Invalid impact scope: "${error.impact}". Valid scopes: none, local, module, system, global`;

    case "InvalidMetadata":
      return `Invalid metadata: Expected object, received ${typeof error.metadata}`;

    case "InvalidType":
      return `Invalid type: Expected specific type, received ${typeof error.type}`;

    case "NullOrUndefined":
      return "Parameter cannot be null or undefined";

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = error;
      return `Unknown error: ${JSON.stringify(_exhaustive)}`;
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

function isValidSeverityLevel(level: unknown): level is SeverityLevel {
  return typeof level === "number" && Object.values(SeverityLevel).includes(level as SeverityLevel);
}

function isValidImpactScope(impact: unknown): impact is ImpactScope {
  return typeof impact === "string" && Object.values(ImpactScope).includes(impact as ImpactScope);
}

function isValidMetadata(metadata: unknown): metadata is ErrorMetadata {
  return metadata === null || metadata === undefined || 
    (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata));
}

function severityLevelFromString(level: string): SeverityLevel | null {
  const normalized = level.toLowerCase();
  switch (normalized) {
    case "debug": return SeverityLevel.DEBUG;
    case "info": return SeverityLevel.INFO;
    case "warning": return SeverityLevel.WARNING;
    case "error": return SeverityLevel.ERROR;
    case "critical": return SeverityLevel.CRITICAL;
    case "fatal": return SeverityLevel.FATAL;
    default: return null;
  }
}

function severityLevelToString(level: SeverityLevel): string {
  switch (level) {
    case SeverityLevel.DEBUG: return "DEBUG";
    case SeverityLevel.INFO: return "INFO";
    case SeverityLevel.WARNING: return "WARNING";
    case SeverityLevel.ERROR: return "ERROR";
    case SeverityLevel.CRITICAL: return "CRITICAL";
    case SeverityLevel.FATAL: return "FATAL";
    default: return "UNKNOWN";
  }
}

// =============================================================================
// MAIN CLASS: ErrorSeverity
// =============================================================================

/**
 * ErrorSeverity Value Object
 * 
 * Smart Constructor パターンによる安全な生成と
 * Result型による明示的エラーハンドリングを実装。
 * 
 * 特徴:
 * - プライベートコンストラクタ（直接インスタンス化不可）
 * - パブリック静的ファクトリーメソッド
 * - 完全な不変性（Object.freeze）
 * - 防御的コピー（メタデータ）
 * - 包括的バリデーション
 */
export class ErrorSeverity {
  // Private fields (immutable after construction)
  private readonly _level: SeverityLevel;
  private readonly _impact: ImpactScope;
  private readonly _metadata: Readonly<ErrorMetadata>;

  /**
   * プライベートコンストラクタ
   * Smart Constructor パターンの実装
   */
  private constructor(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata: ErrorMetadata = {},
  ) {
    this._level = level;
    this._impact = impact;
    // 防御的コピー: メタデータの深いコピーを作成
    this._metadata = Object.freeze({
      ...metadata,
      context: metadata.context ? { ...metadata.context } : undefined,
    });

    // Value Object の不変性を保証
    Object.freeze(this);
  }

  // =============================================================================
  // SMART CONSTRUCTOR METHODS (PRIMARY)
  // =============================================================================

  /**
   * プライマリ Smart Constructor
   * 包括的バリデーションとResult型を使用
   */
  static create(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata,
  ): Result<ErrorSeverity, ErrorSeverityError> {
    // Null/undefined チェック
    if (level === null || level === undefined) {
      return error({
        kind: "NullOrUndefined" as const,
        message: "Severity level cannot be null or undefined",
      });
    }

    if (impact === null || impact === undefined) {
      return error({
        kind: "NullOrUndefined" as const,
        message: "Impact scope cannot be null or undefined",
      });
    }

    // レベル バリデーション
    if (!isValidSeverityLevel(level)) {
      return error({
        kind: "InvalidLevel" as const,
        level,
        message: `Invalid severity level: ${level}`,
      });
    }

    // 影響範囲 バリデーション
    if (!isValidImpactScope(impact)) {
      return error({
        kind: "InvalidImpact" as const,
        impact,
        message: `Invalid impact scope: ${impact}`,
      });
    }

    // メタデータ バリデーション
    if (metadata !== undefined && !isValidMetadata(metadata)) {
      return error({
        kind: "InvalidMetadata" as const,
        metadata,
        message: `Invalid metadata: expected object, received ${typeof metadata}`,
      });
    }

    return ok(new ErrorSeverity(level, impact, metadata || {}));
  }

  /**
   * 文字列からの Smart Constructor
   * 大文字小文字を問わない柔軟な解析
   */
  static fromString(levelString: string): Result<ErrorSeverity, ErrorSeverityError> {
    // Null/undefined チェック
    if (levelString === null || levelString === undefined) {
      return error({
        kind: "NullOrUndefined" as const,
        message: "Level string cannot be null or undefined",
      });
    }

    // 文字列バリデーション
    if (typeof levelString !== "string" || levelString.trim() === "") {
      return error({
        kind: "InvalidLevel" as const,
        level: levelString,
        message: `Invalid level string: ${levelString}`,
      });
    }

    const level = severityLevelFromString(levelString.trim());
    if (level === null) {
      return error({
        kind: "InvalidLevel" as const,
        level: levelString,
        message: `Invalid severity level: ${levelString}`,
      });
    }

    // デフォルト影響範囲を適用
    const defaultImpact = getDefaultImpactForLevel(level);
    return ok(new ErrorSeverity(level, defaultImpact));
  }

  // =============================================================================
  // LEGACY FACTORY METHODS (BACKWARD COMPATIBILITY)
  // =============================================================================

  static debug(impact: ImpactScope = ImpactScope.NONE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.DEBUG, impact, metadata);
  }

  static info(impact: ImpactScope = ImpactScope.LOCAL, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.INFO, impact, metadata);
  }

  static warning(impact: ImpactScope = ImpactScope.MODULE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.WARNING, impact, metadata);
  }

  static error(impact: ImpactScope = ImpactScope.MODULE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.ERROR, impact, metadata);
  }

  static critical(impact: ImpactScope = ImpactScope.SYSTEM, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.CRITICAL, impact, metadata);
  }

  static fatal(impact: ImpactScope = ImpactScope.GLOBAL, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.FATAL, impact, metadata);
  }

  /**
   * カスタム設定によるErrorSeverity生成（レガシー互換）
   * @deprecated Smart Constructor パターンのcreateメソッドを使用してください
   */
  static custom(level: SeverityLevel, impact: ImpactScope, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(level, impact, metadata);
  }

  /**
   * 文字列からの安全でない変換（レガシー互換）
   * エラー時に例外を投げる従来の動作を維持
   * @deprecated fromStringメソッドを使用してください（Result型による安全な処理）
   */
  static fromStringUnsafe(levelString: string): ErrorSeverity {
    const result = ErrorSeverity.fromString(levelString);
    if (!result.ok) {
      throw new Error(formatErrorSeverityError(result.error));
    }
    return result.data;
  }

  // =============================================================================
  // VALUE OBJECT METHODS
  // =============================================================================

  getLevel(): SeverityLevel {
    return this._level;
  }

  getImpact(): ImpactScope {
    return this._impact;
  }

  /**
   * 防御的コピーでメタデータを返す
   */
  getMetadata(): ErrorMetadata {
    return {
      ...this._metadata,
      context: this._metadata.context ? { ...this._metadata.context } : undefined,
    };
  }

  getLevelName(): string {
    return severityLevelToString(this._level);
  }

  getNumericLevel(): number {
    return this._level;
  }

  // =============================================================================
  // FUNCTIONAL COMPOSITION METHODS
  // =============================================================================

  withMetadata(metadata: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(this._level, this._impact, metadata);
  }

  withCode(code: string): ErrorSeverity {
    return new ErrorSeverity(this._level, this._impact, { ...this._metadata, code });
  }

  withCategory(category: string): ErrorSeverity {
    return new ErrorSeverity(this._level, this._impact, { ...this._metadata, category });
  }

  withImpact(impact: ImpactScope): ErrorSeverity {
    return new ErrorSeverity(this._level, impact, this._metadata);
  }

  /**
   * 重要度のエスカレーション
   * より高い重要度を選択、同レベルなら影響範囲を考慮
   */
  escalate(other: ErrorSeverity): ErrorSeverity {
    if (this._level > other._level) {
      return this;
    } else if (other._level > this._level) {
      return other;
    } else {
      // 同レベルの場合、影響範囲で判定
      const impactOrder = [ImpactScope.NONE, ImpactScope.LOCAL, ImpactScope.MODULE, ImpactScope.SYSTEM, ImpactScope.GLOBAL];
      const thisImpactIndex = impactOrder.indexOf(this._impact);
      const otherImpactIndex = impactOrder.indexOf(other._impact);
      return otherImpactIndex > thisImpactIndex ? other : this;
    }
  }

  // =============================================================================
  // COMPARISON METHODS
  // =============================================================================

  isAtLeast(level: SeverityLevel): boolean {
    return this._level >= level;
  }

  isHigherThan(other: ErrorSeverity): boolean {
    return this._level > other._level;
  }

  requiresNotification(): boolean {
    return this._level >= SeverityLevel.WARNING;
  }

  requiresImmediateAction(): boolean {
    return this._level >= SeverityLevel.CRITICAL;
  }

  requiresSystemHalt(): boolean {
    return this._level >= SeverityLevel.FATAL;
  }

  shouldLog(): boolean {
    return this._level >= SeverityLevel.INFO;
  }

  // =============================================================================
  // EQUALITY AND VALUE OBJECT METHODS
  // =============================================================================

  equals(other: ErrorSeverity): boolean {
    return this._level === other._level &&
           this._impact === other._impact &&
           JSON.stringify(this._metadata) === JSON.stringify(other._metadata);
  }

  toString(): string {
    return `ErrorSeverity(level=${this.getLevelName()}, impact=${this._impact}, metadata=${JSON.stringify(this._metadata)})`;
  }

  toJSON(): {
    level: string;
    numericLevel: number;
    impact: ImpactScope;
    metadata: ErrorMetadata;
    requiresNotification: boolean;
    requiresImmediateAction: boolean;
  } {
    return {
      level: this.getLevelName(),
      numericLevel: this._level,
      impact: this._impact,
      metadata: this.getMetadata(),
      requiresNotification: this.requiresNotification(),
      requiresImmediateAction: this.requiresImmediateAction(),
    };
  }

  toLogFormat(): string {
    const parts = [
      `[${this.getLevelName()}]`,
      `impact=${this._impact}`,
    ];

    if (this._metadata.code) {
      parts.push(`code=${this._metadata.code}`);
    }
    if (this._metadata.category) {
      parts.push(`category=${this._metadata.category}`);
    }

    return parts.join(" ");
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * 重要度レベルに対するデフォルト影響範囲を取得
 */
function getDefaultImpactForLevel(level: SeverityLevel): ImpactScope {
  switch (level) {
    case SeverityLevel.DEBUG: return ImpactScope.NONE;
    case SeverityLevel.INFO: return ImpactScope.LOCAL;
    case SeverityLevel.WARNING: return ImpactScope.MODULE;
    case SeverityLevel.ERROR: return ImpactScope.MODULE;
    case SeverityLevel.CRITICAL: return ImpactScope.SYSTEM;
    case SeverityLevel.FATAL: return ImpactScope.GLOBAL;
    default: return ImpactScope.LOCAL;
  }
}