/**
 * @fileoverview Configuration data validator
 *
 * Provides validation for configuration data structures
 * following DDD and Totality principles.
 *
 * @module config/config_validator
 */

import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import { ConfigError } from "../domain/errors/config_error.ts";

/**
 * Configuration data validation result
 */
export type ConfigDataValidationResult = Result<void, ConfigError>;

/**
 * Validation rules for configuration fields
 */
interface ValidationRule {
  field: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "array" | "object";
  arrayItemType?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  customValidator?: (value: unknown) => boolean;
}

/**
 * Default validation rules for base configuration
 */
const BASE_CONFIG_VALIDATION_RULES: ValidationRule[] = [
  {
    field: "directiveTypes",
    required: true,
    type: "array",
    arrayItemType: "string",
    minLength: 1,
  },
  {
    field: "layerTypes",
    required: true,
    type: "array",
    arrayItemType: "string",
    minLength: 1,
  },
];

/**
 * Path configuration validation rules
 */
const PATH_CONFIG_VALIDATION_RULES: ValidationRule[] = [
  {
    field: "app_prompt.basedir",
    required: false,
    type: "string",
    pattern: /^[a-zA-Z0-9_\-/.]+$/,
  },
  {
    field: "app_schema.basedir",
    required: false,
    type: "string",
    pattern: /^[a-zA-Z0-9_\-/.]+$/,
  },
  {
    field: "output.basedir",
    required: false,
    type: "string",
    pattern: /^[a-zA-Z0-9_\-/.]+$/,
  },
];

/**
 * Validate configuration data structure
 *
 * @param configData - Configuration data to validate
 * @param profile - Configuration profile name (optional)
 * @param configFileName - Configuration file name for error messages (optional)
 * @returns Result with void on success or ConfigError on failure
 */
export function validateConfigData(
  configData: unknown,
  profile?: string,
  configFileName?: string,
): ConfigDataValidationResult {
  const fileName = configFileName || (profile ? `${profile}-user.yml` : "default-user.yml");

  // Check if config data exists
  if (!configData) {
    return resultError(
      ConfigError.notFound(fileName, profile),
    );
  }

  // Check if config data is an object
  if (typeof configData !== "object" || Array.isArray(configData)) {
    return resultError(
      ConfigError.invalidFormat(
        fileName,
        "Configuration must be an object",
      ),
    );
  }

  const config = configData as Record<string, unknown>;
  const validationErrors: Array<{ field: string; error: string }> = [];
  const missingFields: string[] = [];

  // Validate base configuration rules
  for (const rule of BASE_CONFIG_VALIDATION_RULES) {
    const validationResult = validateField(config, rule, fileName);
    if (!validationResult.ok) {
      if (validationResult.error.kind === "missing" && rule.required) {
        missingFields.push(rule.field);
      } else if (validationResult.error.kind === "invalid") {
        validationErrors.push({
          field: rule.field,
          error: validationResult.error.message,
        });
      }
    }
  }

  // Validate path configuration rules
  for (const rule of PATH_CONFIG_VALIDATION_RULES) {
    const validationResult = validateField(config, rule, fileName);
    if (!validationResult.ok && validationResult.error.kind === "invalid") {
      validationErrors.push({
        field: rule.field,
        error: validationResult.error.message,
      });
    }
  }

  // Validate params.two structure if present
  const paramsTwoValidationResult = validateParamsTwoStructure(config, fileName);
  if (!paramsTwoValidationResult.ok) {
    if (paramsTwoValidationResult.error.kind === "config-missing-required") {
      missingFields.push(
        ...(paramsTwoValidationResult.error.context?.missingFields as string[] || []),
      );
    } else {
      return paramsTwoValidationResult;
    }
  }

  // Return appropriate error if validation failed
  if (missingFields.length > 0) {
    const detailedMissingFields = missingFields.map((field) =>
      field.includes("params.two") ? `${field} in ${fileName}` : field
    );
    return resultError(
      ConfigError.missingRequired(fileName, detailedMissingFields),
    );
  }

  if (validationErrors.length > 0) {
    return resultError(
      ConfigError.validationFailed(fileName, validationErrors),
    );
  }

  // Additional structural validation
  const structuralValidationResult = validateStructure(config, fileName);
  if (!structuralValidationResult.ok) {
    return structuralValidationResult;
  }

  return resultOk(undefined);
}

/**
 * Validate a single field against a rule
 */
function validateField(
  config: Record<string, unknown>,
  rule: ValidationRule,
  fileName: string,
): Result<void, { kind: "missing" | "invalid"; message: string }> {
  const value = getNestedValue(config, rule.field);

  // Check if field exists
  if (value === undefined) {
    if (rule.required) {
      return resultError({
        kind: "missing",
        message: `Missing required field: ${rule.field} in ${fileName}`,
      });
    }
    return resultOk(undefined);
  }

  // Check type
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (actualType !== rule.type) {
    return resultError({
      kind: "invalid",
      message: `Field '${rule.field}' in ${fileName}: Expected ${rule.type}, got ${actualType}`,
    });
  }

  // Validate array items
  if (rule.type === "array" && rule.arrayItemType) {
    const array = value as unknown[];
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      let isValidType = false;
      if (rule.arrayItemType === "string" && typeof item === "string") isValidType = true;
      else if (rule.arrayItemType === "number" && typeof item === "number") isValidType = true;
      else if (rule.arrayItemType === "boolean" && typeof item === "boolean") isValidType = true;
      else if (rule.arrayItemType === "object" && typeof item === "object") isValidType = true;

      if (!isValidType) {
        return resultError({
          kind: "invalid",
          message:
            `Field '${rule.field}[${i}]' in ${fileName}: Array items must be of type ${rule.arrayItemType}, got ${typeof item}`,
        });
      }
    }
  }

  // Validate length constraints
  if (rule.minLength !== undefined && Array.isArray(value)) {
    if (value.length < rule.minLength) {
      return resultError({
        kind: "invalid",
        message:
          `Field '${rule.field}' in ${fileName}: Array must have at least ${rule.minLength} items, got ${value.length}`,
      });
    }
  }

  if (rule.maxLength !== undefined && Array.isArray(value)) {
    if (value.length > rule.maxLength) {
      return resultError({
        kind: "invalid",
        message:
          `Field '${rule.field}' in ${fileName}: Array must have at most ${rule.maxLength} items, got ${value.length}`,
      });
    }
  }

  // Validate string pattern
  if (rule.pattern && typeof value === "string") {
    if (!rule.pattern.test(value)) {
      return resultError({
        kind: "invalid",
        message:
          `Field '${rule.field}' in ${fileName}: Value '${value}' does not match required pattern`,
      });
    }
  }

  // Custom validation
  if (rule.customValidator && !rule.customValidator(value)) {
    return resultError({
      kind: "invalid",
      message: `Field '${rule.field}' in ${fileName}: Value failed custom validation`,
    });
  }

  return resultOk(undefined);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Validate overall configuration structure
 */
function validateStructure(
  config: Record<string, unknown>,
  fileName: string,
): ConfigDataValidationResult {
  // Check for duplicate values in directiveTypes
  if (Array.isArray(config.directiveTypes)) {
    const directiveSet = new Set(config.directiveTypes);
    if (directiveSet.size !== config.directiveTypes.length) {
      return resultError(
        ConfigError.validationFailed(fileName, [{
          field: "directiveTypes",
          error: "Duplicate values are not allowed",
        }]),
      );
    }
  }

  // Check for duplicate values in layerTypes
  if (Array.isArray(config.layerTypes)) {
    const layerSet = new Set(config.layerTypes);
    if (layerSet.size !== config.layerTypes.length) {
      return resultError(
        ConfigError.validationFailed(fileName, [{
          field: "layerTypes",
          error: "Duplicate values are not allowed",
        }]),
      );
    }
  }

  // Validate that arrays contain non-empty strings
  const arrays = [
    { field: "directiveTypes", value: config.directiveTypes },
    { field: "layerTypes", value: config.layerTypes },
  ];

  for (const { field, value } of arrays) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item === "string" && item.trim() === "") {
          return resultError(
            ConfigError.validationFailed(fileName, [{
              field: `${field}[${i}]`,
              error: "Empty string values are not allowed",
            }]),
          );
        }
      }
    }
  }

  return resultOk(undefined);
}

/**
 * Validate params.two structure for pattern definitions
 */
function validateParamsTwoStructure(
  config: Record<string, unknown>,
  fileName: string,
): ConfigDataValidationResult {
  const paramsTwo = getNestedValue(config, "params.two");

  // params.two is optional
  if (!paramsTwo) {
    return resultOk(undefined);
  }

  if (typeof paramsTwo !== "object" || Array.isArray(paramsTwo)) {
    return resultError(
      ConfigError.typeMismatch("params.two", "object", typeof paramsTwo, paramsTwo),
    );
  }

  const paramsTwoObj = paramsTwo as Record<string, unknown>;
  const requiredPatternFields = ["directiveType", "layerType"];
  const missingFields: string[] = [];

  for (const field of requiredPatternFields) {
    const pattern = paramsTwoObj[field];
    if (!pattern) {
      missingFields.push(`params.two.${field}.pattern`);
      continue;
    }

    if (typeof pattern !== "object" || Array.isArray(pattern)) {
      return resultError(
        ConfigError.typeMismatch(
          `params.two.${field}`,
          "object",
          Array.isArray(pattern) ? "array" : typeof pattern,
          pattern,
        ),
      );
    }

    const patternObj = pattern as Record<string, unknown>;
    if (!patternObj.pattern) {
      missingFields.push(`params.two.${field}.pattern`);
    } else if (typeof patternObj.pattern !== "string") {
      return resultError(
        ConfigError.typeMismatch(
          `params.two.${field}.pattern`,
          "string",
          typeof patternObj.pattern,
          patternObj.pattern,
        ),
      );
    }
  }

  if (missingFields.length > 0) {
    return resultError(
      ConfigError.missingRequired(fileName, missingFields),
    );
  }

  return resultOk(undefined);
}

/**
 * Validate configuration data for missing required fields
 * Used to detect when hardcoded fallbacks might be needed
 *
 * @param configData - Configuration data to check
 * @returns Array of missing required field names
 */
export function getMissingRequiredFields(configData: unknown): string[] {
  if (!configData || typeof configData !== "object" || Array.isArray(configData)) {
    return BASE_CONFIG_VALIDATION_RULES
      .filter((rule) => rule.required)
      .map((rule) => rule.field);
  }

  const config = configData as Record<string, unknown>;
  const missingFields: string[] = [];

  for (const rule of BASE_CONFIG_VALIDATION_RULES) {
    if (rule.required) {
      const value = getNestedValue(config, rule.field);
      if (value === undefined) {
        missingFields.push(rule.field);
      }
    }
  }

  return missingFields;
}

/**
 * Create safe configuration data with validated defaults
 * This replaces hardcoded fallbacks with validated configuration
 *
 * @param partialConfig - Partial configuration data
 * @returns Complete configuration with safe defaults
 */
export function createSafeConfigData(
  partialConfig?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  const safeConfig: Record<string, unknown> = {
    // Required fields with safe defaults
    directiveTypes: ["to", "summary", "defect"],
    layerTypes: ["project", "issue", "task"],

    // Optional path configurations
    app_prompt: {
      basedir: ".breakdown/prompts",
    },
    app_schema: {
      basedir: ".breakdown/schemas",
    },
    output: {
      basedir: "output",
    },
  };

  // Merge with partial config if provided
  if (partialConfig) {
    // Deep merge logic to preserve nested structures
    for (const [key, value] of Object.entries(partialConfig)) {
      if (value !== undefined && value !== null) {
        if (
          typeof value === "object" && !Array.isArray(value) &&
          typeof safeConfig[key] === "object" && !Array.isArray(safeConfig[key])
        ) {
          // Merge nested objects
          safeConfig[key] = {
            ...(safeConfig[key] as Record<string, unknown>),
            ...(value as Record<string, unknown>),
          };
        } else {
          // Replace value
          safeConfig[key] = value;
        }
      }
    }
  }

  return safeConfig;
}
