/**
 * @fileoverview Base Breakdown Error
 *
 * Base class for all domain-specific errors in the Breakdown application.
 * Provides a consistent error structure following DDD principles.
 *
 * @module domain/errors
 */

/**
 * Context information for error recovery
 */
export interface ErrorRecoverySuggestion {
  /** The action to take */
  action: string;
  /** Description of the action */
  description: string;
  /** Optional command to run */
  command?: string;
}

/**
 * Base error interface for all Breakdown domain errors
 */
export interface BreakdownErrorBase {
  /** Unique error identifier */
  id: string;
  /** Domain that owns this error */
  domain: string;
  /** Specific error type within the domain */
  kind: string;
  /** Context information for the error */
  context?: Record<string, unknown>;
}

/**
 * Base class for all Breakdown domain errors
 *
 * Implements the Error interface while providing domain-specific
 * functionality for error handling and recovery.
 */
export abstract class BaseBreakdownError extends Error implements BreakdownErrorBase {
  public readonly id: string;
  public readonly domain: string;
  public readonly kind: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    domain: string,
    kind: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.id = `${domain}-${kind}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.domain = domain;
    this.kind = kind;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get user-friendly error message
   */
  abstract getUserMessage(): string;

  /**
   * Get developer-friendly error message with technical details
   */
  getDeveloperMessage(): string {
    return `[${this.domain}:${this.kind}] ${this.message}${
      this.context ? ` | Context: ${JSON.stringify(this.context)}` : ""
    }`;
  }

  /**
   * Get recovery suggestions for this error
   */
  abstract getRecoverySuggestions(): ErrorRecoverySuggestion[];

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      domain: this.domain,
      kind: this.kind,
      context: this.context,
      stack: this.stack,
      userMessage: this.getUserMessage(),
      developerMessage: this.getDeveloperMessage(),
      recoverySuggestions: this.getRecoverySuggestions(),
    };
  }
}
