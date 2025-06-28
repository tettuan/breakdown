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
 * CustomConfig type definition for BreakdownParams v1.0.4+ compatibility
 * Based on the actual type structure expected by ParamsParser constructor
 */
export type CustomConfig = {
  params: {
    two: {
      demonstrativeType?: {
        pattern?: string;
        errorMessage?: string;
      };
      layerType?: {
        pattern?: string;
        errorMessage?: string;
      };
    };
  };
  options: {
    flags?: string[];
    values?: string[];
    customVariables?: Record<string, string>;
  };
  validation: {
    zero?: {
      allowedOptions?: string[];
      allowedValueOptions?: string[];
      allowCustomVariables?: boolean;
    };
    one?: {
      allowedOptions?: string[];
      allowedValueOptions?: string[];
      allowCustomVariables?: boolean;
    };
    two?: {
      allowedOptions?: string[];
      allowedValueOptions?: string[];
      allowCustomVariables?: boolean;
    };
  };
  errorHandling: {
    unknownOption?: 'error' | 'ignore' | 'warn';
    duplicateOption?: 'error' | 'ignore' | 'warn';
    emptyValue?: 'error' | 'ignore' | 'warn';
  };
};

/**
 * Complete parameters custom configuration following BreakdownParams format
 */
export class ParamsCustomConfig {
  private constructor(
    readonly params: CustomConfig['params'],
    readonly options: CustomConfig['options'],
    readonly validation: CustomConfig['validation'],
    readonly errorHandling: CustomConfig['errorHandling']
  ) {}

  static create(mergedConfig: Record<string, unknown>): Result<ParamsCustomConfig, ConfigError> {
    // Extract configuration sections from mergedConfig and ensure proper structure
    const rawParams = mergedConfig.params as Record<string, unknown> || {};
    const rawOptions = mergedConfig.options as Record<string, unknown> || {};
    const rawValidation = mergedConfig.validation as Record<string, unknown> || {};
    const rawErrorHandling = mergedConfig.errorHandling as Record<string, unknown> || {};

    // Transform to proper CustomConfig structure
    const params: CustomConfig['params'] = {
      two: {
        demonstrativeType: ParamsCustomConfig.extractPatternConfig(rawParams, 'two.demonstrativeType'),
        layerType: ParamsCustomConfig.extractPatternConfig(rawParams, 'two.layerType'),
      }
    };

    const options: CustomConfig['options'] = {
      flags: rawOptions.flags as string[] || [],
      values: rawOptions.values as string[] || [],
      customVariables: rawOptions.customVariables as Record<string, string> || {},
    };

    const validation: CustomConfig['validation'] = {
      zero: ParamsCustomConfig.extractValidationRules(rawValidation, 'zero'),
      one: ParamsCustomConfig.extractValidationRules(rawValidation, 'one'),
      two: ParamsCustomConfig.extractValidationRules(rawValidation, 'two'),
    };

    const errorHandling: CustomConfig['errorHandling'] = {
      unknownOption: rawErrorHandling.unknownOption as 'error' | 'ignore' | 'warn' || 'error',
      duplicateOption: rawErrorHandling.duplicateOption as 'error' | 'ignore' | 'warn' || 'error',
      emptyValue: rawErrorHandling.emptyValue as 'error' | 'ignore' | 'warn' || 'error',
    };

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
   * Helper function to extract pattern configuration
   */
  private static extractPatternConfig(
    rawParams: Record<string, unknown>, 
    path: string
  ): { pattern?: string; errorMessage?: string } | undefined {
    const parts = path.split('.');
    let current: Record<string, unknown> | unknown = rawParams;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    if (current && typeof current === 'object' && current !== null) {
      const config = current as Record<string, unknown>;
      return {
        pattern: config.pattern as string,
        errorMessage: config.errorMessage as string,
      };
    }
    
    return undefined;
  }

  /**
   * Helper function to extract validation rules
   */
  private static extractValidationRules(
    rawValidation: Record<string, unknown>,
    key: string
  ): { allowedOptions?: string[]; allowedValueOptions?: string[]; allowCustomVariables?: boolean } | undefined {
    const rules = rawValidation[key] as Record<string, unknown>;
    if (!rules || typeof rules !== 'object') return undefined;

    return {
      allowedOptions: rules.allowedOptions as string[],
      allowedValueOptions: rules.allowedValueOptions as string[],
      allowCustomVariables: rules.allowCustomVariables as boolean,
    };
  }

  /**
   * Convert to BreakdownParams CustomConfig format
   * Returns undefined if configuration is incomplete, which allows the receiving constructor
   * to use its default configuration (customConfig?: CustomConfig pattern)
   */
  toBreakdownParamsFormat(): CustomConfig | undefined {
    // Check if configuration is complete
    if (!this.params || Object.keys(this.params).length === 0) {
      // Return undefined to trigger default config usage in receiving constructor
      return undefined;
    }
    
    if (!this.options || !this.validation || !this.errorHandling) {
      // Return undefined to trigger default config usage in receiving constructor
      return undefined;
    }

    // Return complete configuration only when all sections are properly defined
    return {
      params: this.params,
      options: this.options,
      validation: this.validation,
      errorHandling: this.errorHandling,
    };
  }
}
