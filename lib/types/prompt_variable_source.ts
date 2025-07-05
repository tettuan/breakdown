/**
 * @fileoverview PromptVariableSource - Stage 1 of the 3-stage transformation
 *
 * This module defines the raw material types for prompt variable generation.
 * PromptVariableSource represents unvalidated, raw input data that will be
 * transformed through the 3-stage process into final PromptParams.
 *
 * Stage 1: PromptVariableSource (raw materials) <- THIS FILE
 * Stage 2: PromptVariables (validated components)
 * Stage 3: PromptParams (final form for @tettuan/breakdownprompt)
 *
 * @module types/prompt_variable_source
 */

import type { Result } from "./result.ts";

/**
 * Raw source data for prompt variable construction
 *
 * This type represents the unvalidated, raw input that comes from:
 * - CLI arguments
 * - Configuration files
 * - Standard input
 * - User-provided options
 */
export interface PromptVariableSource {
  /** Raw directive type from CLI or config */
  directive?: string;

  /** Raw layer type from CLI or config */
  layer?: string;

  /** Raw input file path */
  inputFile?: string;

  /** Raw destination path */
  destinationPath?: string;

  /** Raw schema file path */
  schemaFile?: string;

  /** Raw standard input content */
  stdinContent?: string;

  /** Raw user-defined variables (--uv-* options) */
  userVariables?: Record<string, string>;

  /** Additional metadata for transformation context */
  metadata?: SourceMetadata;
}

/**
 * Metadata about the source of the raw data
 */
export interface SourceMetadata {
  /** Source of the data (cli, config, stdin, etc.) */
  source: DataSource;

  /** Timestamp when the data was collected */
  timestamp: Date;

  /** Original command line arguments if from CLI */
  originalArgs?: string[];

  /** Configuration profile if from config */
  configProfile?: string;
}

/**
 * Possible sources of raw data
 */
export enum DataSource {
  CLI = "cli",
  CONFIG = "config",
  STDIN = "stdin",
  DEFAULT = "default",
  MERGED = "merged",
}

/**
 * Factory for creating PromptVariableSource instances
 */
export class PromptVariableSourceFactory {
  /**
   * Create from CLI arguments
   */
  static fromCLI(args: {
    directive?: string;
    layer?: string;
    fromFile?: string;
    destinationFile?: string;
    userVariables?: Record<string, string>;
    originalArgs?: string[];
  }): PromptVariableSource {
    return {
      directive: args.directive,
      layer: args.layer,
      inputFile: args.fromFile,
      destinationPath: args.destinationFile,
      userVariables: args.userVariables,
      metadata: {
        source: DataSource.CLI,
        timestamp: new Date(),
        originalArgs: args.originalArgs,
      },
    };
  }

  /**
   * Create from configuration
   */
  static fromConfig(config: {
    directive?: string;
    layer?: string;
    promptDir?: string;
    profile?: string;
  }): PromptVariableSource {
    return {
      directive: config.directive,
      layer: config.layer,
      metadata: {
        source: DataSource.CONFIG,
        timestamp: new Date(),
        configProfile: config.profile,
      },
    };
  }

  /**
   * Create from standard input
   */
  static fromStdin(content: string): PromptVariableSource {
    return {
      stdinContent: content,
      metadata: {
        source: DataSource.STDIN,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Merge multiple sources with priority
   * Priority: CLI > STDIN > CONFIG > DEFAULT
   */
  static merge(...sources: PromptVariableSource[]): PromptVariableSource {
    const merged: PromptVariableSource = {
      metadata: {
        source: DataSource.MERGED,
        timestamp: new Date(),
      },
    };

    // Sort by priority (reverse order for reduce)
    const prioritized = sources.sort((a, b) => {
      const priority = [DataSource.DEFAULT, DataSource.CONFIG, DataSource.STDIN, DataSource.CLI];
      const aIndex = priority.indexOf(a.metadata?.source || DataSource.DEFAULT);
      const bIndex = priority.indexOf(b.metadata?.source || DataSource.DEFAULT);
      return aIndex - bIndex;
    });

    // Merge with priority
    for (const source of prioritized) {
      if (source.directive !== undefined) merged.directive = source.directive;
      if (source.layer !== undefined) merged.layer = source.layer;
      if (source.inputFile !== undefined) merged.inputFile = source.inputFile;
      if (source.destinationPath !== undefined) merged.destinationPath = source.destinationPath;
      if (source.schemaFile !== undefined) merged.schemaFile = source.schemaFile;
      if (source.stdinContent !== undefined) merged.stdinContent = source.stdinContent;
      if (source.userVariables !== undefined) {
        merged.userVariables = { ...merged.userVariables, ...source.userVariables };
      }
    }

    return merged;
  }
}

/**
 * Validation errors specific to PromptVariableSource
 */
export interface SourceValidationError {
  field: keyof PromptVariableSource;
  message: string;
  source?: DataSource;
}

/**
 * Result type for source validation
 */
export type SourceValidationResult = Result<PromptVariableSource, SourceValidationError[]>;

/**
 * Basic validation for PromptVariableSource
 *
 * Note: This is minimal validation. Full validation happens in Stage 2
 */
export function validateSource(source: PromptVariableSource): SourceValidationResult {
  const errors: SourceValidationError[] = [];

  // Check for required fields based on context
  if (!source.directive && !source.layer) {
    errors.push({
      field: "directive",
      message: "Either directive or layer must be provided",
      source: source.metadata?.source,
    });
  }

  // Check for input source
  if (!source.inputFile && !source.stdinContent) {
    errors.push({
      field: "inputFile",
      message: "Either input file or stdin content must be provided",
      source: source.metadata?.source,
    });
  }

  if (errors.length > 0) {
    return { ok: false, error: errors };
  }

  return { ok: true, data: source };
}
