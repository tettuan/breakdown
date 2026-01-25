/**
 * @fileoverview ErrorSeverity Value Object - Enhanced Totality Pattern Implementation
 *
 * Totality-compliant error severity management system integrating Smart Constructor,
 * Result type, and Discriminated Union patterns. Achieves type safety, immutability,
 * and comprehensive error handling.
 *
 * Key patterns:
 * - Smart Constructor: Private constructor + public static factory methods
 * - Result type: Explicit error handling instead of exceptions
 * - Discriminated Union: Type-safe error classification
 * - Value Object: Guarantees immutability and equality
 * - Defensive Copying: Prevents metadata modification
 *
 * @module domain/core/value_objects/error_severity
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

// =============================================================================
// ENUMS AND TYPES
// =============================================================================

/**
 * Error severity level (numeric-based)
 * Higher numeric value indicates higher severity
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
 * Impact scope (string-based Discriminated Union)
 */
export enum ImpactScope {
  NONE = "none",
  LOCAL = "local",
  MODULE = "module",
  SYSTEM = "system",
  GLOBAL = "global",
}

/**
 * Error metadata interface
 * Provides extensible metadata structure
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
 * ErrorSeverity Discriminated Union error type
 * Allows type-safe distinction of each error kind
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

export function isInvalidLevelError(
  error: ErrorSeverityError,
): error is { kind: "InvalidLevel"; level: unknown; message: string } {
  return error.kind === "InvalidLevel";
}

export function isInvalidImpactError(
  error: ErrorSeverityError,
): error is { kind: "InvalidImpact"; impact: unknown; message: string } {
  return error.kind === "InvalidImpact";
}

export function isInvalidMetadataError(
  error: ErrorSeverityError,
): error is { kind: "InvalidMetadata"; metadata: unknown; message: string } {
  return error.kind === "InvalidMetadata";
}

export function isInvalidTypeError(
  error: ErrorSeverityError,
): error is { kind: "InvalidType"; type: unknown; message: string } {
  return error.kind === "InvalidType";
}

export function isNullOrUndefinedError(
  error: ErrorSeverityError,
): error is { kind: "NullOrUndefined"; message: string } {
  return error.kind === "NullOrUndefined";
}

// =============================================================================
// ERROR FORMATTER
// =============================================================================

/**
 * ErrorSeverityError comprehensive formatter
 * Generates user-friendly error messages
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

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = error;
      return `Unknown error: ${JSON.stringify(_exhaustive)}`;
    }
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
    case "debug":
      return SeverityLevel.DEBUG;
    case "info":
      return SeverityLevel.INFO;
    case "warning":
      return SeverityLevel.WARNING;
    case "error":
      return SeverityLevel.ERROR;
    case "critical":
      return SeverityLevel.CRITICAL;
    case "fatal":
      return SeverityLevel.FATAL;
    default:
      return null;
  }
}

function severityLevelToString(level: SeverityLevel): string {
  switch (level) {
    case SeverityLevel.DEBUG:
      return "DEBUG";
    case SeverityLevel.INFO:
      return "INFO";
    case SeverityLevel.WARNING:
      return "WARNING";
    case SeverityLevel.ERROR:
      return "ERROR";
    case SeverityLevel.CRITICAL:
      return "CRITICAL";
    case SeverityLevel.FATAL:
      return "FATAL";
    default:
      return "UNKNOWN";
  }
}

// =============================================================================
// MAIN CLASS: ErrorSeverity
// =============================================================================

/**
 * ErrorSeverity Value Object
 *
 * Implements safe creation via Smart Constructor pattern
 * and explicit error handling via Result type.
 *
 * Features:
 * - Private constructor (direct instantiation not allowed)
 * - Public static factory methods
 * - Complete immutability (Object.freeze)
 * - Defensive copying (metadata)
 * - Comprehensive validation
 */
export class ErrorSeverity {
  // Private fields (immutable after construction)
  private readonly _level: SeverityLevel;
  private readonly _impact: ImpactScope;
  private readonly _metadata: Readonly<ErrorMetadata>;

  /**
   * Private constructor
   * Implementation of Smart Constructor pattern
   */
  private constructor(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata: ErrorMetadata = {},
  ) {
    this._level = level;
    this._impact = impact;
    // Defensive copying: Create deep copy of metadata
    this._metadata = Object.freeze({
      ...metadata,
      context: metadata.context ? { ...metadata.context } : undefined,
    });

    // Guarantee Value Object immutability
    Object.freeze(this);
  }

  // =============================================================================
  // SMART CONSTRUCTOR METHODS (PRIMARY)
  // =============================================================================

  /**
   * Primary Smart Constructor
   * Uses comprehensive validation and Result type
   */
  static create(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata,
  ): Result<ErrorSeverity, ErrorSeverityError> {
    // Null/undefined check
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

    // Level validation
    if (!isValidSeverityLevel(level)) {
      return error({
        kind: "InvalidLevel" as const,
        level,
        message: `Invalid severity level: ${level}`,
      });
    }

    // Impact scope validation
    if (!isValidImpactScope(impact)) {
      return error({
        kind: "InvalidImpact" as const,
        impact,
        message: `Invalid impact scope: ${impact}`,
      });
    }

    // Metadata validation
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
   * Smart Constructor from string
   * Flexible parsing regardless of case
   */
  static fromString(levelString: string): Result<ErrorSeverity, ErrorSeverityError> {
    // Null/undefined check
    if (levelString === null || levelString === undefined) {
      return error({
        kind: "NullOrUndefined" as const,
        message: "Level string cannot be null or undefined",
      });
    }

    // String validation
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

    // Apply default impact scope
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

  static warning(
    impact: ImpactScope = ImpactScope.MODULE,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.WARNING, impact, metadata);
  }

  static error(impact: ImpactScope = ImpactScope.MODULE, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.ERROR, impact, metadata);
  }

  static critical(
    impact: ImpactScope = ImpactScope.SYSTEM,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.CRITICAL, impact, metadata);
  }

  static fatal(impact: ImpactScope = ImpactScope.GLOBAL, metadata?: ErrorMetadata): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.FATAL, impact, metadata);
  }

  /**
   * Generate ErrorSeverity with custom settings (legacy compatibility)
   * @deprecated Use the create method of Smart Constructor pattern
   */
  static custom(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(level, impact, metadata);
  }

  /**
   * Unsafe conversion from string (legacy compatibility)
   * Maintains legacy behavior of throwing exceptions on error
   * @deprecated Use fromString method (safe handling via Result type)
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
   * Return metadata with defensive copying
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
   * Severity escalation
   * Selects higher severity, considers impact scope if same level
   */
  escalate(other: ErrorSeverity): ErrorSeverity {
    if (this._level > other._level) {
      return this;
    } else if (other._level > this._level) {
      return other;
    } else {
      // If same level, determine by impact scope
      const impactOrder = [
        ImpactScope.NONE,
        ImpactScope.LOCAL,
        ImpactScope.MODULE,
        ImpactScope.SYSTEM,
        ImpactScope.GLOBAL,
      ];
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
    return `ErrorSeverity(level=${this.getLevelName()}, impact=${this._impact}, metadata=${
      JSON.stringify(this._metadata)
    })`;
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
 * Get default impact scope for severity level
 */
function getDefaultImpactForLevel(level: SeverityLevel): ImpactScope {
  switch (level) {
    case SeverityLevel.DEBUG:
      return ImpactScope.NONE;
    case SeverityLevel.INFO:
      return ImpactScope.LOCAL;
    case SeverityLevel.WARNING:
      return ImpactScope.MODULE;
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
