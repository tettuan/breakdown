/**
 * @fileoverview LayerType test helper functions
 * 
 * This module provides helper functions for testing LayerType values
 * extracted from configuration files without hardcoded values.
 * 
 * @module lib/types/layer_type_test_helper
 */

import { getLayerTypes } from "../test_helpers/config_test_helper.ts";

/**
 * Get valid LayerType values from configuration for testing
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns Array of valid LayerType strings
 */
export async function getValidLayerTypesForTest(configPath = "config/default-user.yml"): Promise<string[]> {
  return await getLayerTypes(configPath);
}

/**
 * Get first valid LayerType for test cases
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns First valid LayerType string
 */
export async function getFirstValidLayerType(configPath = "config/default-user.yml"): Promise<string> {
  const layerTypes = await getLayerTypes(configPath);
  if (layerTypes.length === 0) {
    throw new Error("No valid LayerType found in configuration");
  }
  return layerTypes[0];
}

/**
 * Get all combinations of DirectiveType and LayerType for testing
 * 
 * @param configPath Path to user configuration file (defaults to "config/default-user.yml")
 * @returns Array of {directive, layer} combinations
 */
export async function getAllTypesCombinationsForTest(configPath = "config/default-user.yml"): Promise<{directive: string, layer: string}[]> {
  const { getDirectiveTypes } = await import("../test_helpers/config_test_helper.ts");
  
  const [directiveTypes, layerTypes] = await Promise.all([
    getDirectiveTypes(configPath),
    getLayerTypes(configPath),
  ]);
  
  const combinations: {directive: string, layer: string}[] = [];
  for (const directive of directiveTypes) {
    for (const layer of layerTypes) {
      combinations.push({ directive, layer });
    }
  }
  
  return combinations;
}