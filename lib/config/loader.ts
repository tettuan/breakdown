/**
 * Configuration loader for Breakdown tool
 *
 * This module provides utilities to load and parse configuration files,
 * particularly for testing purposes and custom configuration scenarios.
 */

import { parse } from "jsr:@std/yaml@^1.0.6";

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
 * Loads and parses a YAML configuration file
 *
 * @param filePath - Path to the configuration file
 * @returns Parsed configuration object
 * @throws Error if file cannot be read or parsed
 */
export async function loadConfig(filePath: string): Promise<CustomConfig> {
  try {
    const content = await Deno.readTextFile(filePath);
    const config = parse(content) as CustomConfig;
    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Loads configuration using BreakdownConfig with custom config prefix
 *
 * @param configPrefix - Optional config prefix for BreakdownConfig
 * @param workingDir - Working directory for BreakdownConfig
 * @returns Merged configuration from BreakdownConfig
 */
export async function loadBreakdownConfig(
  configPrefix?: string,
  workingDir?: string,
): Promise<Record<string, unknown>> {
  const { BreakdownConfig } = await import("jsr:@tettuan/breakdownconfig@^1.1.2");

  const config = new BreakdownConfig(configPrefix, workingDir || Deno.cwd());
  await config.loadConfig();
  return await config.getConfig();
}
