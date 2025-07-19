/**
 * @fileoverview Configuration Module - Unified exports for configuration components
 *
 * This module provides centralized exports for all configuration-related
 * functionality following DDD and Totality principles.
 *
 * @module config
 */

// Export the main loader functionality
export { ConfigLoader, loadConfig } from "./loader.ts";
export type { ConfigLoadError, CustomConfig } from "./loader.ts";

// Export other configuration utilities if they exist
// Add more exports as needed
