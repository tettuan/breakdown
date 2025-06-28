/**
 * ParamsCustomConfig type definition for Breakdown
 * 
 * This module defines type-safe configuration for BreakdownParams following Totality principles.
 * Uses Smart Constructors and Discriminated Unions to ensure type safety.
 * 
 * @module types/params_custom_config
 */

/**
 * Result type for operations that can fail
 */
export type Result<T, E> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Configuration creation errors
 */
export type ConfigError = 
  | { kind: 'InvalidPattern'; pattern: string; message: string }
  | { kind: 'EmptyErrorMessage'; field: string }
  | { kind: 'InvalidOptions'; field: string; message: string };

/**
 * Complete parameters custom configuration following BreakdownParams format
 */
export class ParamsCustomConfig {
  private constructor(
    readonly params: Record<string, unknown>,
    readonly options: Record<string, unknown>,
    readonly validation: Record<string, unknown>,
    readonly errorHandling: Record<string, unknown>
  ) {}

  static create(mergedConfig: Record<string, unknown>): Result<ParamsCustomConfig, ConfigError> {
    // Extract configuration sections from mergedConfig
    const params = mergedConfig.params as Record<string, unknown> || {};
    const options = mergedConfig.options as Record<string, unknown> || {};
    const validation = mergedConfig.validation as Record<string, unknown> || {};
    const errorHandling = mergedConfig.errorHandling as Record<string, unknown> || {};

    return {
      ok: true,
      data: new ParamsCustomConfig(
        params,
        options,
        validation,
        errorHandling
      )
    };
  }

  /**
   * Convert to BreakdownParams CustomConfig format
   */
  toBreakdownParamsFormat(): Record<string, unknown> {
    return {
      params: this.params,
      options: this.options,
      validation: this.validation,
      errorHandling: this.errorHandling,
    };
  }
}
