/**
 * @fileoverview Configuration prefix detection for Breakdown CLI arguments.
 *
 * This module provides a lightweight utility for detecting and extracting
 * configuration-related command line arguments without creating circular dependencies
 * with the BreakdownConfig system. It handles various formats of configuration
 * specification including both short and long forms with different syntaxes.
 *
 * The detector operates independently of BreakdownConfig to avoid circular
 * dependencies during the configuration loading process, making it suitable
 * for early-stage argument processing.
 *
 * @module factory/config_prefix_detector
 */

/**
 * Configuration prefix detector for command line arguments.
 *
 * Provides robust detection of configuration file specifications in various
 * command line argument formats. This detector is designed to be lightweight
 * and dependency-free, making it suitable for early-stage CLI processing
 * before the main configuration system is initialized.
 *
 * Supported argument formats:
 * - `--config=filename` - Long form with equals syntax
 * - `-c=filename` - Short form with equals syntax
 * - `--config filename` - Long form with space separation
 * - `-c filename` - Short form with space separation
 *
 * @example Basic usage
 * ```typescript
 * const detector = new ConfigPrefixDetector();
 *
 * // Detect equals format
 * const config1 = detector.detect(['--config=production']);
 * // Result: 'production'
 *
 * // Detect space-separated format
 * const config2 = detector.detect(['--config', 'development']);
 * // Result: 'development'
 * ```
 *
 * @example Integration with CLI processing
 * ```typescript
 * const detector = new ConfigPrefixDetector();
 * const configName = detector.detect(Deno.args);
 *
 * if (configName) {
 *   console.log(`Using configuration: ${configName}`);
 * } else {
 *   console.log('Using default configuration');
 * }
 * ```
 */
export class ConfigPrefixDetector {
  /**
   * Detects and extracts configuration prefix from command line arguments.
   *
   * Scans the provided argument array for configuration-related options
   * and extracts the associated configuration name or file path. The method
   * handles multiple argument formats and validates that space-separated
   * values are not mistaken for flags.
   *
   * @param args - Array of command line arguments to scan
   * @returns The configuration name/path if found, undefined if no config option detected
   *
   * @example Detect various configuration formats
   * ```typescript
   * const detector = new ConfigPrefixDetector();
   *
   * // Equals syntax detection
   * detector.detect(['--config=prod']); // Returns: 'prod'
   * detector.detect(['-c=dev']); // Returns: 'dev'
   *
   * // Space-separated detection
   * detector.detect(['--config', 'staging']); // Returns: 'staging'
   * detector.detect(['-c', 'test']); // Returns: 'test'
   *
   * // No configuration specified
   * detector.detect(['--help', '--version']); // Returns: undefined
   * ```
   *
   * @example Handling edge cases
   * ```typescript
   * const detector = new ConfigPrefixDetector();
   *
   * // Avoids false positives with flags
   * detector.detect(['--config', '--verbose']); // Returns: undefined
   *
   * // Handles mixed arguments
   * detector.detect(['--verbose', '--config=custom', '--help']); // Returns: 'custom'
   * ```
   */
  detect(args: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // Handle --config=value format
      if (arg.startsWith("--config=")) {
        return arg.slice("--config=".length);
      }

      // Handle -c=value format
      if (arg.startsWith("-c=")) {
        return arg.slice("-c=".length);
      }

      // Handle space-separated format (--config value or -c value)
      if ((arg === "--config" || arg === "-c") && i + 1 < args.length) {
        const nextArg = args[i + 1];
        // Only recognize as value if next arg doesn't start with dash
        if (nextArg && !nextArg.startsWith("-")) {
          return nextArg;
        }
      }
    }
    return undefined;
  }
}
