/**
 * @fileoverview Configuration test helper functions
 * 
 * This module provides helper functions for testing configuration loading,
 * specifically for DirectiveType and LayerType arrays from default-user.yml.
 * 
 * Used by test files to avoid hardcoded DirectiveType and LayerType values
 * and instead load them from configuration files.
 */

import { loadConfig } from "../config/loader.ts";

/**
 * Configuration structure for params.two section
 */
interface TwoParamsConfig {
  readonly directiveType?: {
    readonly pattern?: string;
    readonly errorMessage?: string;
  };
  readonly layerType?: {
    readonly pattern?: string;
    readonly errorMessage?: string;
  };
}

/**
 * Configuration structure matching default-user.yml structure
 */
interface UserConfig {
  readonly params?: {
    readonly two?: TwoParamsConfig;
  };
  readonly [key: string]: unknown;
}

/**
 * Get DirectiveType values from default-user.yml configuration
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns Array of DirectiveType strings
 * @throws Error if configuration cannot be loaded or pattern is invalid
 */
export async function getDirectiveTypes(configPath = "config/default-user.yml"): Promise<string[]> {
  const configResult = await loadConfig(configPath);
  
  if (!configResult.ok) {
    throw new Error(
      `Failed to load config from ${configPath}: ${configResult.error.message}`
    );
  }
  
  const config = configResult.data as UserConfig;
  const pattern = config.params?.two?.directiveType?.pattern;
  
  if (!pattern || typeof pattern !== "string") {
    throw new Error(
      `DirectiveType pattern not found or invalid in ${configPath}`
    );
  }
  
  // Handle both "^(a|b|c)$" and "a|b|c" formats
  let cleanPattern = pattern;
  
  // Remove regex anchors if present
  const regexMatch = pattern.match(/^\^\(([^)]+)\)\$$/);
  if (regexMatch) {
    cleanPattern = regexMatch[1];
  }
  
  // Split by pipe to get individual DirectiveType values
  return cleanPattern.split("|").map(type => type.trim()).filter(type => type.length > 0);
}

/**
 * Get LayerType values from default-user.yml configuration
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml") 
 * @returns Array of LayerType strings
 * @throws Error if configuration cannot be loaded or pattern is invalid
 */
export async function getLayerTypes(configPath = "config/default-user.yml"): Promise<string[]> {
  const configResult = await loadConfig(configPath);
  
  if (!configResult.ok) {
    throw new Error(
      `Failed to load config from ${configPath}: ${configResult.error.message}`
    );
  }
  
  const config = configResult.data as UserConfig;
  const pattern = config.params?.two?.layerType?.pattern;
  
  if (!pattern || typeof pattern !== "string") {
    throw new Error(
      `LayerType pattern not found or invalid in ${configPath}`
    );
  }
  
  // Handle both "^(a|b|c)$" and "a|b|c" formats
  let cleanPattern = pattern;
  
  // Remove regex anchors if present
  const regexMatch = pattern.match(/^\^\(([^)]+)\)\$$/);
  if (regexMatch) {
    cleanPattern = regexMatch[1];
  }
  
  // Split by pipe to get individual LayerType values
  return cleanPattern.split("|").map(type => type.trim()).filter(type => type.length > 0);
}

/**
 * Get both DirectiveType and LayerType values from configuration
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns Object containing both directive and layer type arrays
 * @throws Error if configuration cannot be loaded or patterns are invalid
 */
export async function getDirectiveAndLayerTypes(configPath = "config/default-user.yml"): Promise<{
  directiveTypes: string[];
  layerTypes: string[];
}> {
  const [directiveTypes, layerTypes] = await Promise.all([
    getDirectiveTypes(configPath),
    getLayerTypes(configPath),
  ]);
  
  return {
    directiveTypes,
    layerTypes,
  };
}

/**
 * Check if a DirectiveType is valid according to configuration
 * 
 * @param directiveType DirectiveType to validate
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns True if DirectiveType is valid
 */
export async function isValidDirectiveType(
  directiveType: string, 
  configPath = "config/default-user.yml"
): Promise<boolean> {
  const validTypes = await getDirectiveTypes(configPath);
  return validTypes.includes(directiveType);
}

/**
 * Check if a LayerType is valid according to configuration
 * 
 * @param layerType LayerType to validate
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns True if LayerType is valid
 */
export async function isValidLayerType(
  layerType: string, 
  configPath = "config/default-user.yml"
): Promise<boolean> {
  const validTypes = await getLayerTypes(configPath);
  return validTypes.includes(layerType);
}