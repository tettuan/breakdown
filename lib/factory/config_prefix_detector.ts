/**
 * ConfigPrefixDetector - Minimal implementation for config prefix detection
 *
 * Single responsibility: Detect --config or -c option and extract its value
 * This class cannot depend on BreakdownConfig to avoid circular dependency
 *
 * @module
 */

/**
 * Detector for config prefix from command line arguments
 * Supports formats:
 * - --config=value
 * - -c=value
 * - --config value
 * - -c value
 */
export class ConfigPrefixDetector {
  /**
   * Detects config prefix from command line arguments
   * @param args - Command line arguments array
   * @returns Config prefix value if found, undefined otherwise
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
