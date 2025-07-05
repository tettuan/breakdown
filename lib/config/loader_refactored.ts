/**
 * @fileoverview Configuration loader for Breakdown tool with version management
 *
 * This module provides utilities to load and parse configuration files,
 * particularly for testing purposes and custom configuration scenarios.
 * All version dependencies are managed through the central versions module.
 *
 * @module config/loader_refactored
 */

import { parse } from "jsr:@std/yaml@^1.0.6";
import { DEPENDENCY_VERSIONS, getJsrImport } from "./versions.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";

/**
 * Configuration loading errors
 */
export type ConfigLoadError =
  | { kind: "FileReadError"; path: string; message: string }
  | { kind: "ParseError"; path: string; message: string }
  | { kind: "ValidationError"; message: string }
  | { kind: "BreakdownConfigError"; message: string };

/**
 * Configuration structure for custom configs
 */
export interface CustomConfig {
  customConfig?: {
    findBugs?: {
      enabled?: boolean;
      sensitivity?: string;
      patterns?: string[];
      includeExtensions?: string[];
      excludeDirectories?: string[];
      maxResults?: number;
      detailedReports?: boolean;
    };
    find?: {
      twoParams?: string[];
    };
  };
  breakdownParams?: {
    version?: string;
    customConfig?: {
      validation?: Record<string, unknown>;
      params?: Record<string, unknown>;
      options?: Record<string, unknown>;
    };
    customParams?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

/**
 * Loads and parses a YAML configuration file with Result type
 *
 * @param filePath - Path to the configuration file
 * @returns Result containing parsed configuration or error
 */
export async function loadConfig(filePath: string): Promise<Result<CustomConfig, ConfigLoadError>> {
  try {
    const content = await Deno.readTextFile(filePath);
    try {
      const config = parse(content) as CustomConfig;
      return resultOk(config);
    } catch (parseError) {
      return resultError({
        kind: "ParseError",
        path: filePath,
        message: parseError instanceof Error ? parseError.message : String(parseError),
      });
    }
  } catch (readError) {
    return resultError({
      kind: "FileReadError",
      path: filePath,
      message: readError instanceof Error ? readError.message : String(readError),
    });
  }
}

/**
 * Loads configuration using BreakdownConfig with custom config prefix
 *
 * @param configPrefix - Optional config prefix for BreakdownConfig
 * @param workingDir - Working directory for BreakdownConfig
 * @returns Result containing merged configuration or error
 */
export async function loadBreakdownConfig(
  configPrefix?: string | null,
  workingDir?: string,
): Promise<Result<Record<string, unknown>, ConfigLoadError>> {
  try {
    // Dynamic import using version from central management
    const importUrl = getJsrImport("BREAKDOWN_CONFIG");
    const { BreakdownConfig } = await import(importUrl);

    // Use BreakdownConfig static factory method (convert null to undefined)
    const configResult = await BreakdownConfig.create(
      configPrefix ?? undefined,
      workingDir,
    );

    if (!configResult.success) {
      return resultError({
        kind: "BreakdownConfigError",
        message: `Failed to create BreakdownConfig: ${JSON.stringify(configResult.error) || "Unknown error"}`,
      });
    }

    const config = configResult.data;
    await config.loadConfig();
    const configData = await config.getConfig();

    return resultOk(configData);
  } catch (error) {
    return resultError({
      kind: "BreakdownConfigError",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate custom configuration structure
 */
export function validateCustomConfig(config: unknown): Result<CustomConfig, ConfigLoadError> {
  if (!config || typeof config !== "object") {
    return resultError({
      kind: "ValidationError",
      message: "Configuration must be an object",
    });
  }

  const cfg = config as CustomConfig;

  // Validate customConfig if present
  if (cfg.customConfig && typeof cfg.customConfig !== "object") {
    return resultError({
      kind: "ValidationError",
      message: "customConfig must be an object",
    });
  }

  // Validate breakdownParams if present
  if (cfg.breakdownParams && typeof cfg.breakdownParams !== "object") {
    return resultError({
      kind: "ValidationError",
      message: "breakdownParams must be an object",
    });
  }

  return resultOk(cfg);
}

/**
 * Load and validate configuration file
 */
export async function loadAndValidateConfig(
  filePath: string,
): Promise<Result<CustomConfig, ConfigLoadError>> {
  const loadResult = await loadConfig(filePath);
  if (!loadResult.ok) {
    return loadResult;
  }

  return validateCustomConfig(loadResult.data);
}

/**
 * Merge multiple configurations with priority
 * Later configurations override earlier ones
 */
export function mergeConfigs(...configs: CustomConfig[]): CustomConfig {
  const result: CustomConfig = {};

  for (const config of configs) {
    // Deep merge logic
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        result[key] = {
          ...(result[key] as Record<string, unknown> || {}),
          ...(value as Record<string, unknown>),
        };
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Format configuration loading error for user display
 */
export function formatConfigLoadError(error: ConfigLoadError): string {
  switch (error.kind) {
    case "FileReadError":
      return `Failed to read configuration file: ${error.path}\n${error.message}`;

    case "ParseError":
      return `Failed to parse configuration file: ${error.path}\n${error.message}`;

    case "ValidationError":
      return `Configuration validation failed: ${error.message}`;

    case "BreakdownConfigError":
      return `BreakdownConfig error: ${error.message}`;
  }
}
