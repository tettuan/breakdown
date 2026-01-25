/**
 * Represents the configuration structure for the Breakdown CLI.
 * Contains paths and settings used for CLI operations.
 */
export interface BreakdownConfig {
  /** The working directory for the CLI. */
  working_directory: string;
  /** The output directory for generated files. */
  output_directory: string;
  /** The default path to the configuration file. */
  default_config_path: string;
  // Other configuration items...
}

/**
 * Options for configuring the Breakdown CLI at runtime.
 */
export interface ConfigOptions {
  /** Path to the configuration file. */
  configPath?: string;
  /** Working directory for the CLI. */
  workingDir?: string;
  /** Output directory for generated files. */
  outputDir?: string;
}
