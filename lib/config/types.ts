/**
 * @fileoverview Configuration type definitions for Breakdown
 *
 * This module provides proper type definitions for configuration objects
 * to avoid unsafe type casting with Record<string, unknown>.
 *
 * @module config/types
 */

/**
 * Base configuration structure returned by BreakdownConfig
 */
export interface BaseConfigStructure {
  app_prompt?: {
    base_dir?: string;
    [key: string]: unknown;
  };
  app_schema?: {
    base_dir?: string;
    [key: string]: unknown;
  };
  output?: {
    base_dir?: string;
    [key: string]: unknown;
  };
  profile?: {
    description?: string;
    [key: string]: unknown;
  };
  features?: {
    extendedThinking?: boolean;
    debugMode?: boolean;
    strictValidation?: boolean;
    autoSchema?: boolean;
    [key: string]: unknown;
  };
  limits?: {
    maxFileSize?: number;
    maxPromptLength?: number;
    maxVariables?: number;
    [key: string]: unknown;
  };
  environment?: {
    logLevel?: string;
    colorOutput?: boolean;
    timezone?: string | null;
    locale?: string | null;
    [key: string]: unknown;
  };
  user?: {
    userVariables?: Record<string, string> | null;
    aliases?: Record<string, string> | null;
    templates?: Record<string, string> | null;
    [key: string]: unknown;
  };
  paths?: {
    promptBaseDir?: string;
    schemaBaseDir?: string;
    outputBaseDir?: string;
    [key: string]: unknown;
  };
  // Legacy properties for migration
  extended_thinking?: boolean;
  debug_mode?: boolean;
  strict_validation?: boolean;
  auto_schema?: boolean;
  log_level?: string;
  color_output?: boolean;
  working_directory?: string;
  type_patterns?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Type guard to check if a value has the app_prompt structure
 */
export function hasAppPromptStructure(
  value: unknown,
): value is { app_prompt: { base_dir?: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "app_prompt" in value &&
    typeof (value as Record<string, unknown>).app_prompt === "object" &&
    (value as Record<string, unknown>).app_prompt !== null
  );
}

/**
 * Type guard to check if a value has the app_schema structure
 */
export function hasAppSchemaStructure(
  value: unknown,
): value is { app_schema: { base_dir?: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "app_schema" in value &&
    typeof (value as Record<string, unknown>).app_schema === "object" &&
    (value as Record<string, unknown>).app_schema !== null
  );
}

/**
 * Type guard to check if a value has the output structure
 */
export function hasOutputStructure(value: unknown): value is { output: { base_dir?: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "output" in value &&
    typeof (value as Record<string, unknown>).output === "object" &&
    (value as Record<string, unknown>).output !== null
  );
}

/**
 * Extract base_dir safely from a configuration object
 */
export function extractBaseDir(
  obj: unknown,
  key: "app_prompt" | "app_schema" | "output",
): string | undefined {
  if (typeof obj !== "object" || obj === null) {
    return undefined;
  }

  const config = obj as Record<string, unknown>;
  const section = config[key];

  if (typeof section === "object" && section !== null && "base_dir" in section) {
    const baseDir = (section as Record<string, unknown>).base_dir;
    return typeof baseDir === "string" ? baseDir : undefined;
  }

  return undefined;
}

/**
 * Extract nested property safely
 */
export function extractNestedProperty<T>(
  obj: unknown,
  path: string[],
  defaultValue: T,
): T {
  if (typeof obj !== "object" || obj === null) {
    return defaultValue;
  }

  let current: Record<string, unknown> = obj as Record<string, unknown>;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return defaultValue;
    }
    current = current[key] as Record<string, unknown>;
  }

  return current as T;
}
