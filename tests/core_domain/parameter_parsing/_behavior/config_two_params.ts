/**
 * @fileoverview Config two params for behavior testing
 *
 * This module provides configuration for two-parameter operations
 * in parameter parsing behavior tests.
 *
 * @module core_domain/parameter_parsing/config_two_params
 */

import type { TwoParams_Result } from "../../../../lib/deps.ts";

/**
 * Configuration for two parameters behavior
 */
export interface ConfigTwoParams {
  directivePattern: string;
  layerPattern: string;
  validationEnabled: boolean;
  fallbackEnabled: boolean;
}

/**
 * Default configuration for two parameters
 */
export const defaultConfigTwoParams: ConfigTwoParams = {
  directivePattern: "to|summary|defect|find",
  layerPattern: "project|issue|task|bugs|temp",
  validationEnabled: true,
  fallbackEnabled: true,
};

/**
 * Configuration builder for two parameters
 */
export class ConfigTwoParamsBuilder {
  private config: ConfigTwoParams;

  constructor(baseConfig: ConfigTwoParams = defaultConfigTwoParams) {
    this.config = { ...baseConfig };
  }

  /**
   * Set directive pattern
   */
  withDirectivePattern(pattern: string): ConfigTwoParamsBuilder {
    this.config.directivePattern = pattern;
    return this;
  }

  /**
   * Set layer pattern
   */
  withLayerPattern(pattern: string): ConfigTwoParamsBuilder {
    this.config.layerPattern = pattern;
    return this;
  }

  /**
   * Enable/disable validation
   */
  withValidation(enabled: boolean): ConfigTwoParamsBuilder {
    this.config.validationEnabled = enabled;
    return this;
  }

  /**
   * Enable/disable fallback
   */
  withFallback(enabled: boolean): ConfigTwoParamsBuilder {
    this.config.fallbackEnabled = enabled;
    return this;
  }

  /**
   * Build the configuration
   */
  build(): ConfigTwoParams {
    return { ...this.config };
  }
}

/**
 * Validate two params result against configuration
 */
export function validateTwoParamsResult(
  result: TwoParams_Result,
  config: ConfigTwoParams,
): boolean {
  if (!config.validationEnabled) {
    return true;
  }

  const directivePattern = new RegExp(`^(${config.directivePattern})$`);
  const layerPattern = new RegExp(`^(${config.layerPattern})$`);

  return directivePattern.test(result.demonstrativeType) &&
         layerPattern.test(result.layerType);
}