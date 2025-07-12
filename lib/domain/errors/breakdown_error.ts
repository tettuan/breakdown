/**
 * @fileoverview Breakdown Error Base Class and Union Type
 * 
 * Provides a unified error handling system for all Breakdown domains.
 * Following DDD principles with rich domain context and user-friendly messages.
 * 
 * @module domain/errors/breakdown_error
 */

/**
 * Base interface for all Breakdown errors
 * Provides consistent structure and rich context
 */
export interface BreakdownErrorBase {
  /** Error category for type discrimination */
  readonly domain: string;
  /** Specific error type within domain */
  readonly kind: string;
  /** Human-readable error message */
  readonly message: string;
  /** Additional context for debugging */
  readonly context?: Record<string, unknown>;
  /** Original error if wrapped */
  readonly cause?: Error;
  /** Timestamp when error occurred */
  readonly timestamp: Date;
  /** Unique error ID for tracking */
  readonly id: string;
}

/**
 * Base class for all Breakdown domain errors
 * Extends native Error with rich context
 */
export abstract class BaseBreakdownError extends Error implements BreakdownErrorBase {
  abstract readonly domain: string;
  abstract readonly kind: string;
  readonly context?: Record<string, unknown>;
  override readonly cause?: Error;
  readonly timestamp: Date;
  private _id?: string;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.context = options?.context;
    this.timestamp = new Date();

    // Maintain proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get unique error ID (lazy initialization)
   */
  get id(): string {
    if (!this._id) {
      const timestamp = this.timestamp.getTime().toString(36);
      const random = Math.random().toString(36).substring(2, 9);
      this._id = `${this.domain}-${this.kind}-${timestamp}-${random}`;
    }
    return this._id;
  }

  /**
   * Convert error to structured JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      domain: this.domain,
      kind: this.kind,
      message: this.message,
      context: this.context,
      cause: this.cause?.message,
      timestamp: this.timestamp.toISOString(),
      id: this.id,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Get developer-friendly error details
   */
  getDeveloperMessage(): string {
    const parts = [
      `[${this.domain}:${this.kind}]`,
      this.message,
    ];

    if (this.context) {
      parts.push(`Context: ${JSON.stringify(this.context)}`);
    }

    if (this.cause) {
      parts.push(`Caused by: ${this.cause.message}`);
    }

    return parts.join(' | ');
  }
}

/**
 * Error recovery suggestions
 */
export interface ErrorRecoverySuggestion {
  readonly action: string;
  readonly description: string;
  readonly command?: string;
}

/**
 * Basic type guard for Breakdown errors
 */
export function isBreakdownError(error: unknown): error is BaseBreakdownError {
  return error instanceof BaseBreakdownError;
}