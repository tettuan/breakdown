/**
 * Config Prefix Detector
 * 
 * Lightweight detector for early --config/-c option detection.
 * Executes before parseArgs to identify configuration file paths.
 * 
 * @module
 */

/**
 * Detects --config or -c option from command line arguments
 */
export class ConfigPrefixDetector {
  constructor(private args: string[]) {}

  /**
   * Detects config prefix from command line arguments
   * @returns Config prefix string or undefined
   */
  detectPrefix(): string | undefined {
    return ConfigPrefixDetector.detectConfigPath(this.args);
  }

  /**
   * Checks if config option exists in arguments
   * @returns true if --config or -c option is present
   */
  hasConfig(): boolean {
    for (const arg of this.args) {
      if (arg === "--config" || arg === "-c" || 
          arg.startsWith("--config=") || arg.startsWith("-c=")) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the index of config option in arguments
   * @returns Index of config option or -1 if not found
   */
  getConfigIndex(): number {
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      if (arg === "--config" || arg === "-c" || 
          arg.startsWith("--config=") || arg.startsWith("-c=")) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Extracts config file path from command line arguments
   * @param args - Command line arguments array
   * @returns Config file path if found, undefined otherwise
   */
  public static detectConfigPath(args: string[]): string | undefined {
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