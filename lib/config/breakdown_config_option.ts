/**
 * BreakdownConfigOption: CLI config option parser
 *
 * Purpose:
 *   - Parses --config and -c options from CLI arguments
 *   - Extracts config prefix value for BreakdownConfig
 *   - Provides clean interface for config option handling
 *
 * Responsibilities:
 *   - Parse CLI args for config options
 *   - Extract prefix value from --config=$prefix or -c=$prefix
 *   - Return undefined if option not present
 *   - No validation of prefix value (BreakdownConfig's responsibility)
 */
export class BreakdownConfigOption {
  private configPrefix?: string;

  /**
   * Creates a new BreakdownConfigOption instance
   * @param args CLI arguments to parse
   */
  constructor(args: string[]) {
    this.configPrefix = this.parseConfigOption(args);
  }

  /**
   * Parses config option from CLI arguments
   * Supports both --config=prefix and -c=prefix formats
   * @param args CLI arguments
   * @returns Config prefix or undefined
   */
  private parseConfigOption(args: string[]): string | undefined {
    for (const arg of args) {
      // Handle --config=prefix
      if (arg.startsWith("--config=")) {
        return arg.slice("--config=".length);
      }
      // Handle -c=prefix
      if (arg.startsWith("-c=")) {
        return arg.slice("-c=".length);
      }

      // Handle space-separated format (--config prefix or -c prefix)
      const index = args.indexOf(arg);
      if ((arg === "--config" || arg === "-c") && index + 1 < args.length) {
        const nextArg = args[index + 1];
        // Check if next arg is not another option
        if (!nextArg.startsWith("-")) {
          return nextArg;
        }
      }
    }
    return undefined;
  }

  /**
   * Gets the parsed config prefix
   * @returns Config prefix or undefined if not specified
   */
  getConfigPrefix(): string | undefined {
    return this.configPrefix;
  }

  /**
   * Checks if config option was provided
   * @returns true if config option exists
   */
  hasConfigOption(): boolean {
    return this.configPrefix !== undefined;
  }
}
