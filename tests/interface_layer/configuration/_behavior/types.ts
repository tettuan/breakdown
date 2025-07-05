/**
 * @fileoverview Types for configuration behavior testing
 * 
 * This module provides type definitions for configuration
 * behavior tests.
 */

export interface BreakdownConfig {
  prompts: {
    baseDir: string;
  };
  schema: {
    baseDir: string;
  };
  workspace: {
    baseDir: string;
  };
}

export interface ConfigOptions {
  profile?: string;
  debug?: boolean;
}