/**
 * @fileoverview Options Normalizer
 *
 * This module is responsible for normalizing and extracting options
 * from various input formats, following the Single Responsibility Principle.
 *
 * @module lib/validator/options_normalizer
 */

import type { Result } from "../types/result.ts";
import { ok } from "../types/result.ts";

/**
 * Normalized options structure
 */
export interface NormalizedOptions {
  inputPath: string;
  outputPath: string;
  schemaPath?: string;
  promptPath?: string;
  stdin?: string;
  profile?: string;
}

/**
 * Options normalization configuration
 */
export interface NormalizationConfig {
  /** Default value for input path */
  defaultInput?: string;
  /** Default value for output path */
  defaultOutput?: string;
  /** Aliases for option keys */
  aliases?: OptionAliases;
}

/**
 * Option aliases mapping
 */
export interface OptionAliases {
  input?: string[];
  output?: string[];
  schema?: string[];
  prompt?: string[];
  stdin?: string[];
  profile?: string[];
}

/**
 * Default option aliases
 */
const DEFAULT_ALIASES: OptionAliases = {
  input: ["fromFile", "from", "input", "i", "f", "src", "source"],
  output: ["destinationFile", "destination", "output", "o", "d", "dest", "target"],
  schema: ["schemaFile", "schema", "s", "schemaPath"],
  prompt: ["promptFile", "prompt", "template", "p", "promptPath"],
  stdin: ["input_text", "stdin", "text", "content"],
  profile: ["profile", "configProfile", "config", "c"],
};

/**
 * Options Normalizer class
 *
 * Responsible for extracting and normalizing options from various
 * input formats, providing a consistent interface for option access.
 */
export class OptionsNormalizer {
  private readonly config: Required<NormalizationConfig>;

  constructor(config: NormalizationConfig = {}) {
    this.config = {
      defaultInput: config.defaultInput ?? "stdin",
      defaultOutput: config.defaultOutput ?? "stdout",
      aliases: config.aliases ?? DEFAULT_ALIASES,
    };
  }

  /**
   * Normalize options from raw input
   */
  normalize(options: Record<string, unknown>): Result<NormalizedOptions, never> {
    const normalized: NormalizedOptions = {
      inputPath: this.extractValue(options, this.config.aliases.input) ?? this.config.defaultInput,
      outputPath: this.extractValue(options, this.config.aliases.output) ??
        this.config.defaultOutput,
      schemaPath: this.extractValue(options, this.config.aliases.schema),
      promptPath: this.extractValue(options, this.config.aliases.prompt),
      stdin: this.extractValue(options, this.config.aliases.stdin),
      profile: this.extractValue(options, this.config.aliases.profile),
    };

    return ok(normalized);
  }

  /**
   * Extract a value from options using multiple possible keys
   */
  private extractValue(
    options: Record<string, unknown>,
    keys?: string[],
  ): string | undefined {
    if (!keys) return undefined;

    for (const key of keys) {
      if (key in options) {
        const value = options[key];
        if (value === null || value === undefined) {
          continue;
        }
        // Convert to string if it's a valid type
        if (typeof value === "string" || typeof value === "number") {
          return String(value);
        }
      }
    }

    return undefined;
  }

  /**
   * Check if input is from stdin
   */
  isStdinInput(options: NormalizedOptions): boolean {
    return options.inputPath === "stdin" || options.inputPath === "-";
  }

  /**
   * Check if output is to stdout
   */
  isStdoutOutput(options: NormalizedOptions): boolean {
    return options.outputPath === "stdout" || options.outputPath === "-";
  }

  /**
   * Get all possible aliases for a given option type
   */
  getAliases(optionType: keyof OptionAliases): string[] {
    return this.config.aliases[optionType] ?? [];
  }

  /**
   * Check if a key matches any alias for a given option type
   */
  isAliasFor(key: string, optionType: keyof OptionAliases): boolean {
    const aliases = this.getAliases(optionType);
    return aliases.includes(key);
  }
}
