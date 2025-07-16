/**
 * @fileoverview Configuration Module - Unified exports for configuration components
 *
 * This module provides centralized exports for all configuration-related
 * functionality following DDD and Totality principles.
 *
 * @module config
 */

// Export the main loader functionality
export { loadConfig, ConfigLoader } from "./loader.ts";
export type { CustomConfig, ConfigLoadError } from "./loader.ts";

// Export other configuration utilities if they exist
// Add more exports as needed