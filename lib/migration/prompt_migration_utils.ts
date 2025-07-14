/**
 * @fileoverview Migration utilities for converting legacy PromptCliParams to new type system
 *
 * This module provides migration functions to convert from the deprecated PromptCliParams
 * type to the new PromptPath and PromptVariables types following the Totality principle.
 *
 * @module migration/prompt_migration_utils
 */

import { PromptPath } from "../types/prompt_types.ts";
import type { PromptCliParams, PromptVariables } from "../types/prompt_variables_vo.ts";
import {
  FilePathVariable as _FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "../types/prompt_variables_vo.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";
import type { ErrorInfo } from "@tettuan/breakdownparams";

/**
 * Migration error types
 */
export type MigrationError = {
  kind: "MigrationError";
  source: string;
  details: string[];
};

/**
 * Migration result containing both path and variables
 */
export type MigrationResult = {
  path?: PromptPath;
  variables: PromptVariables;
  warnings: string[];
};

/**
 * Format variable error for user-friendly display
 */
function formatVariableError(fieldName: string, error: ErrorInfo): string {
  return `Failed to convert ${fieldName}: ${error.message || 'Unknown error'}`;
}

/**
 * Convert PromptCliParams to PromptVariables
 *
 * Maps the legacy CLI parameters to the new variable system:
 * - directiveType -> StandardVariable("directive_type")
 * - layerType -> StandardVariable("layer_type")
 * - options.fromFile -> StandardVariable("input_text_file")
 * - options.destinationFile -> StandardVariable("destination_path")
 * - options.input_text -> StdinVariable("input_text")
 * - options.customVariables -> UserVariable instances
 *
 * @param params - Legacy PromptCliParams to convert
 * @returns Result containing PromptVariables or MigrationError
 */
export function migrateCliParamsToVariables(
  params: PromptCliParams,
): Result<PromptVariables, MigrationError> {
  const variables: PromptVariables = [];
  const errors: string[] = [];

  // Convert directiveType
  if (params.directiveType) {
    const result = StandardVariable.create("directive_type", params.directiveType);
    if (result.ok) {
      variables.push(result.data);
    } else {
      const errorMessage = formatVariableError("directiveType", result.error);
      errors.push(errorMessage);
    }
  }

  // Convert layerType
  if (params.layerType) {
    const result = StandardVariable.create("layer_type", params.layerType);
    if (result.ok) {
      variables.push(result.data);
    } else {
      const errorMessage = formatVariableError("layerType", result.error);
      errors.push(errorMessage);
    }
  }

  // Convert options
  if (params.options) {
    // Convert fromFile
    if (params.options.fromFile) {
      const result = StandardVariable.create("input_text_file", params.options.fromFile);
      if (result.ok) {
        variables.push(result.data);
      } else {
        const errorMessage = formatVariableError("fromFile", result.error);
        errors.push(errorMessage);
      }
    }

    // Convert destinationFile
    if (params.options.destinationFile) {
      const result = StandardVariable.create("destination_path", params.options.destinationFile);
      if (result.ok) {
        variables.push(result.data);
      } else {
        const errorMessage = formatVariableError("destinationFile", result.error);
        errors.push(errorMessage);
      }
    }

    // Convert input_text (stdin)
    if (params.options.input_text) {
      const result = StdinVariable.create("input_text", params.options.input_text);
      if (result.ok) {
        variables.push(result.data);
      } else {
        const errorMessage = formatVariableError("input_text", result.error);
        errors.push(errorMessage);
      }
    }

    // Convert customVariables
    if (params.options.customVariables) {
      for (const [key, value] of Object.entries(params.options.customVariables)) {
        const result = UserVariable.create(key, value);
        if (result.ok) {
          variables.push(result.data);
        } else {
          const errorMessage = formatVariableError(`custom variable '${key}'`, result.error);
          errors.push(errorMessage);
        }
      }
    }
  }

  if (errors.length > 0) {
    return resultError({
      kind: "MigrationError",
      source: "PromptCliParams",
      details: errors,
    });
  }

  return resultOk(variables);
}

/**
 * Extract prompt path from PromptCliParams
 *
 * Attempts to determine the prompt template path from various options:
 * 1. options.promptDir - if specified, use as base directory
 * 2. Construct path from directiveType and layerType
 *
 * @param params - Legacy PromptCliParams
 * @returns Result containing PromptPath or MigrationError
 */
export function extractPromptPath(
  params: PromptCliParams,
): Result<PromptPath | null, MigrationError> {
  // If no prompt-related parameters, return null (no path needed)
  if (!params.options?.promptDir && (!params.directiveType || !params.layerType)) {
    return resultOk(null);
  }

  // Construct path from parameters
  let pathString = "";

  if (params.options?.promptDir) {
    pathString = params.options.promptDir;

    // If promptDir is provided with directiveType/layerType, combine them
    if (params.directiveType && params.layerType) {
      if (!pathString.endsWith("/")) {
        pathString += "/";
      }
      pathString += `${params.directiveType}_${params.layerType}.md`;
    }
  } else if (params.directiveType && params.layerType) {
    // Default path construction
    pathString = `prompts/${params.directiveType}_${params.layerType}.md`;
  }

  if (!pathString) {
    return resultOk(null);
  }

  const pathResult = PromptPath.create(pathString);
  if (!pathResult.ok) {
    return resultError({
      kind: "MigrationError",
      source: "PromptPath",
      details: [`Failed to create path: ${pathResult.error.message}`],
    });
  }

  return resultOk(pathResult.data);
}

/**
 * Complete migration from PromptCliParams to new system
 *
 * Converts legacy parameters to both PromptPath and PromptVariables,
 * providing warnings for any deprecated or unused options.
 *
 * @param params - Legacy PromptCliParams to migrate
 * @returns Result containing MigrationResult or MigrationError
 */
export function migratePromptCliParams(
  params: PromptCliParams,
): Result<MigrationResult, MigrationError> {
  const warnings: string[] = [];

  // Check for deprecated options
  if (params.options?.adaptation) {
    warnings.push("Option 'adaptation' is deprecated and was ignored");
  }
  if (params.options?.fromLayerType) {
    warnings.push("Option 'fromLayerType' is deprecated and was ignored");
  }
  if (params.options?.extended) {
    warnings.push("Option 'extended' is deprecated and was ignored");
  }
  if (params.options?.customValidation) {
    warnings.push("Option 'customValidation' is deprecated and was ignored");
  }
  if (params.options?.errorFormat) {
    warnings.push("Option 'errorFormat' is deprecated and was ignored");
  }
  if (params.options?.config) {
    warnings.push("Option 'config' should be handled by BreakdownConfig package");
  }

  // Extract prompt path
  const pathResult = extractPromptPath(params);
  if (!pathResult.ok) {
    return resultError(pathResult.error);
  }

  // Convert to variables
  const variablesResult = migrateCliParamsToVariables(params);
  if (!variablesResult.ok) {
    return resultError(variablesResult.error);
  }

  return resultOk({
    path: pathResult.data || undefined,
    variables: variablesResult.data,
    warnings,
  });
}

/**
 * Create a summary of the migration
 *
 * Provides a human-readable summary of what was migrated.
 *
 * @param original - Original PromptCliParams
 * @param result - Migration result
 * @returns Summary string
 */
export function createMigrationSummary(
  _original: PromptCliParams,
  result: MigrationResult,
): string {
  const lines: string[] = ["Migration Summary:"];

  if (result.path) {
    lines.push(`- Prompt path: ${result.path.toString()}`);
  }

  lines.push(`- Variables created: ${result.variables.length}`);

  for (const variable of result.variables) {
    const record = variable.toRecord();
    for (const [key, value] of Object.entries(record)) {
      lines.push(`  - ${key}: ${value}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("- Warnings:");
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

/**
 * Convert PromptCliParams to PromptPath
 *
 * Simple wrapper function that extracts the prompt path from legacy CLI parameters.
 * Returns null if no path can be determined from the parameters.
 *
 * @param params - Legacy PromptCliParams to convert
 * @returns Result containing PromptPath (or null) or MigrationError
 */
export function convertPromptCliParamsToPromptPath(
  params: PromptCliParams,
): Result<PromptPath | null, MigrationError> {
  return extractPromptPath(params);
}

/**
 * Convert PromptCliParams to PromptVariables
 *
 * Simple wrapper function that converts legacy CLI parameters to the new variable system.
 * This function maps:
 * - directiveType -> StandardVariable("directive_type")
 * - layerType -> StandardVariable("layer_type")
 * - options.fromFile -> StandardVariable("input_text_file")
 * - options.destinationFile -> StandardVariable("destination_path")
 * - options.input_text -> StdinVariable("input_text")
 * - options.customVariables -> UserVariable instances
 *
 * @param params - Legacy PromptCliParams to convert
 * @returns Result containing PromptVariables or MigrationError
 */
export function convertPromptCliParamsToPromptVariables(
  params: PromptCliParams,
): Result<PromptVariables, MigrationError> {
  return migrateCliParamsToVariables(params);
}
