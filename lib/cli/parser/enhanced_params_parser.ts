/**
 * Enhanced ParamsParser with Two-Parameter and Three-Word Command Support
 *
 * This module provides an enhanced wrapper around BreakdownParams ParamsParser
 * to handle:
 * - Three-word commands (e.g., "find bugs layer" as type="three")
 * - Two-parameter commands (e.g., "find bugs" as demonstrativeType="find", layerType="bugs")
 * - Equals format options (e.g., -f=test.md)
 *
 * @module EnhancedParamsParser
 */

import { ParamsParser } from "jsr:@tettuan/breakdownparams@^1.0.1";
import type { ParamsResult } from "jsr:@tettuan/breakdownparams@^1.0.1";
import type { ThreeParamsResult } from "../validators/three_command_validator.ts";

/**
 * CustomConfig interface that matches the structure expected by BreakdownParams.
 * This interface defines the configuration for parameter validation and options.
 */
interface CustomConfig {
  validation?: {
    zero?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
    one?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
    two?: {
      allowedOptions?: string[];
      valueOptions?: string[];
    };
  };
  params?: {
    two?: {
      demonstrativeType?: {
        pattern: string;
        errorMessage: string;
      };
      layerType?: {
        pattern: string;
        errorMessage: string;
      };
    };
  };
  options?: {
    values?: Record<string, {
      shortForm?: string;
      description?: string;
      valueRequired?: boolean;
      allowEqualsFormat?: boolean;
    }>;
    flags?: Record<string, {
      shortForm?: string;
      description?: string;
    }>;
  };
}

/**
 * Enhanced ParamsParser that supports two-parameter commands and equals format.
 *
 * This class wraps the standard BreakdownParams ParamsParser to provide
 * native support for commands like "find bugs" as two-parameter format
 * and equals format options (e.g., -f=test.md).
 */
export class EnhancedParamsParser {
  private readonly baseParser: ParamsParser;
  private readonly customConfig?: CustomConfig;
  private readonly hasUserProvidedConfig: boolean;

  /**
   * Creates a new instance of EnhancedParamsParser with optional custom configuration.
   *
   * @param customConfig - Optional custom configuration to pass to the underlying ParamsParser
   */
  constructor(customConfig?: CustomConfig) {
    this.hasUserProvidedConfig = !!customConfig;

    // Default configuration that supports options for two-parameter commands
    const defaultConfig: CustomConfig = {
      validation: {
        zero: {
          allowedOptions: ["help", "version"],
          valueOptions: [],
        },
        one: {
          allowedOptions: ["help", "version"],
          valueOptions: [],
        },
        two: {
          allowedOptions: [
            "help",
            "version",
            "from",
            "destination",
            "input",
            "adaptation",
            "promptDir",
            "extended",
            "customValidation",
            "errorFormat",
          ],
          valueOptions: [
            "from",
            "destination",
            "input",
            "adaptation",
            "promptDir",
            "errorFormat",
          ],
        },
      },
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(to|summary|defect|find)$",
            errorMessage: "Invalid demonstrative type. Must be one of: to, summary, defect, find",
          },
          layerType: {
            pattern: "^(project|issue|task|bugs)$",
            errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs",
          },
        },
      },
      options: {
        values: {
          from: { shortForm: "f", valueRequired: true, allowEqualsFormat: true },
          destination: { shortForm: "o", valueRequired: true, allowEqualsFormat: true },
          input: { shortForm: "i", valueRequired: true, allowEqualsFormat: true },
          adaptation: { shortForm: "a", valueRequired: true, allowEqualsFormat: true },
          promptDir: { valueRequired: true, allowEqualsFormat: true },
          errorFormat: { valueRequired: true, allowEqualsFormat: true },
        },
        flags: {
          help: { shortForm: "h" },
          version: { shortForm: "v" },
          extended: {},
          customValidation: {},
        },
      },
    };

    // Merge with custom config if provided
    this.customConfig = customConfig
      ? this.mergeConfigs(defaultConfig, customConfig)
      : defaultConfig;

    // Pass the merged config to base parser
    // deno-lint-ignore no-explicit-any
    this.baseParser = new ParamsParser(undefined, undefined, this.customConfig as any);
  }

  /**
   * Merges two CustomConfig objects, with the second config taking precedence.
   *
   * @param defaultConfig - The default configuration
   * @param customConfig - The custom configuration to merge
   * @returns Merged configuration
   */
  private mergeConfigs(defaultConfig: CustomConfig, customConfig: CustomConfig): CustomConfig {
    return {
      validation: {
        zero: {
          ...(defaultConfig.validation?.zero || {}),
          ...(customConfig.validation?.zero || {}),
        },
        one: {
          ...(defaultConfig.validation?.one || {}),
          ...(customConfig.validation?.one || {}),
        },
        two: {
          ...(defaultConfig.validation?.two || {}),
          ...(customConfig.validation?.two || {}),
        },
      },
      params: {
        two: {
          ...(defaultConfig.params?.two || {}),
          ...(customConfig.params?.two || {}),
        },
      },
      options: {
        values: {
          ...(defaultConfig.options?.values || {}),
          ...(customConfig.options?.values || {}),
        },
        flags: {
          ...(defaultConfig.options?.flags || {}),
          ...(customConfig.options?.flags || {}),
        },
      },
    };
  }

  /**
   * Parse command-line arguments with three-word command and equals format support.
   *
   * First checks for three-word command patterns (e.g., "find bugs layer"),
   * then preprocesses arguments to handle equals format (e.g., -f=value)
   * before delegating to the standard ParamsParser.
   *
   * @param args - Array of command-line arguments
   * @returns Parsed result object with type information
   */
  parse(args: string[]): ParamsResult | ThreeParamsResult {
    // Check for three-word command pattern first
    if (this.isThreeWordCommand(args)) {
      return this.parseThreeWordCommand(args);
    }

    // Separate positional arguments, options, and custom variables
    const { positionalArgs, options, customVariables } = this.separateArgs(args);

    // Check for version/help flags
    const hasVersionFlag = "--version" in options || "v" in options;
    const hasHelpFlag = "--help" in options || "h" in options;

    // Special handling for version/help flags without any positional arguments
    if ((hasVersionFlag || hasHelpFlag) && positionalArgs.length === 0) {
      return {
        type: "zero",
        params: [],
        options: {
          version: hasVersionFlag,
          help: hasHelpFlag,
        },
      };
    }

    // Delegate to standard ParamsParser with only positional arguments
    const result = this.baseParser.parse(positionalArgs);

    // Handle version/help flags that might cause type errors
    if (result.type === "error" && (hasVersionFlag || hasHelpFlag)) {
      return {
        type: "zero",
        params: [],
        options: {
          version: hasVersionFlag,
          help: hasHelpFlag,
        },
      };
    }

    // Merge options and custom variables into the result
    return this.mergeResults(result, options, customVariables);
  }

  /**
   * Separates command-line arguments into positional arguments, options, and custom variables.
   *
   * @param args - Array of command-line arguments
   * @returns Object with separated positional arguments, options, and custom variables
   */
  private separateArgs(args: string[]): {
    positionalArgs: string[];
    options: Record<string, unknown>;
    customVariables: Record<string, string>;
  } {
    const positionalArgs: string[] = [];
    const options: Record<string, unknown> = {};
    const customVariables: Record<string, string> = {};

    let i = 0;

    // Extract positional arguments (until we hit an option)
    while (i < args.length && !args[i].startsWith("-")) {
      positionalArgs.push(args[i]);
      i++;
    }

    // Process options and custom variables
    while (i < args.length) {
      const arg = args[i];

      // Handle custom variable with equals format (e.g., --uv-project=value)
      if (arg.match(/^--uv-[a-zA-Z-]+=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        const varName = option.substring(5); // Remove '--uv-' prefix
        customVariables[varName] = valueParts.join("=");
        i++;
      } // Handle custom variable without equals format (e.g., --uv-project value)
      else if (arg.startsWith("--uv-")) {
        const varName = arg.substring(5); // Remove '--uv-' prefix
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          customVariables[varName] = args[i + 1];
          i += 2;
        } else {
          customVariables[varName] = "true"; // Flag-style custom variable
          i++;
        }
      } // Handle short option with equals format (e.g., -f=value)
      else if (arg.match(/^-[a-zA-Z]=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        const optionName = option.substring(1);
        options[optionName] = valueParts.join("=");
        i++;
      } // Handle long option with equals format (e.g., --from=value)
      else if (arg.match(/^--[a-zA-Z-]+=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        const optionName = option.substring(2);
        options[optionName] = valueParts.join("=");
        i++;
      } // Handle long option (e.g., --from value)
      else if (arg.startsWith("--")) {
        const optionName = arg.substring(2);
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          options[optionName] = args[i + 1];
          i += 2;
        } else {
          options[optionName] = true;
          i++;
        }
      } // Handle short option (e.g., -f value)
      else if (arg.startsWith("-")) {
        const optionName = arg.substring(1);
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          options[optionName] = args[i + 1];
          i += 2;
        } else {
          options[optionName] = true;
          i++;
        }
      } else {
        // This shouldn't happen, but handle gracefully
        i++;
      }
    }

    return { positionalArgs, options, customVariables };
  }

  /**
   * Merges the base parser result with options and custom variables.
   *
   * @param baseResult - Result from the base parser
   * @param options - Extracted options
   * @param customVariables - Extracted custom variables
   * @returns Merged result
   */
  private mergeResults(
    baseResult: ParamsResult,
    options: Record<string, unknown>,
    customVariables: Record<string, string>,
  ): ParamsResult {
    // For error results, return as-is
    if (baseResult.type === "error") {
      return baseResult;
    }

    // Merge options into the result
    const mergedOptions = {
      ...baseResult.options,
      ...this.convertOptionsToBaseFormat(options),
    };

    // Add custom variables if any exist
    if (Object.keys(customVariables).length > 0) {
      mergedOptions.customVariables = customVariables;
    }

    return {
      ...baseResult,
      options: mergedOptions,
    };
  }

  /**
   * Converts options to the format expected by the base parser.
   * Maps short options to their long forms based on the configuration.
   *
   * @param options - Raw options object
   * @returns Converted options
   */
  private convertOptionsToBaseFormat(options: Record<string, unknown>): Record<string, unknown> {
    const converted: Record<string, unknown> = {};
    const valueOptions = this.customConfig?.options?.values || {};
    const flagOptions = this.customConfig?.options?.flags || {};

    for (const [key, value] of Object.entries(options)) {
      // Check if this is a short form that needs to be converted to long form
      let longForm: string | undefined;

      // Look for short form in value options
      for (const [longOption, config] of Object.entries(valueOptions)) {
        if (config.shortForm === key) {
          longForm = longOption;
          break;
        }
      }

      // Look for short form in flag options
      if (!longForm) {
        for (const [longOption, config] of Object.entries(flagOptions)) {
          if (config.shortForm === key) {
            longForm = longOption;
            break;
          }
        }
      }

      // Use long form if found, otherwise use the key as-is
      converted[longForm || key] = value;
    }

    return converted;
  }

  /**
   * Preprocesses arguments to handle equals format options and extract custom variables.
   *
   * Converts -f=value format to -f value format that the base parser expects.
   * Removes custom variables (--uv-*) from arguments and stores them separately.
   *
   * @param args - Array of command-line arguments
   * @returns Object with processed arguments and extracted custom variables
   */
  private preprocessArgs(
    args: string[],
  ): { args: string[]; customVariables: Record<string, string> } {
    const processedArgs: string[] = [];
    const customVariables: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // Check for custom variable with equals format (e.g., --uv-project=value)
      if (arg.match(/^--uv-[a-zA-Z-]+=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        const varName = option.substring(5); // Remove '--uv-' prefix
        customVariables[varName] = valueParts.join("="); // Rejoin in case value contains =
        // Don't add to processedArgs - filter out custom variables
        continue;
      } // Check for custom variable without equals format (e.g., --uv-project value)
      else if (arg.startsWith("--uv-")) {
        const varName = arg.substring(5); // Remove '--uv-' prefix
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          customVariables[varName] = args[i + 1];
          i++; // Skip the value
        } else {
          customVariables[varName] = "true"; // Flag-style custom variable
        }
        // Don't add to processedArgs - filter out custom variables
        continue;
      } // Check for short option with equals format (e.g., -f=value)
      else if (arg.match(/^-[a-zA-Z]=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        processedArgs.push(option);
        processedArgs.push(valueParts.join("=")); // Rejoin in case value contains =
      } // Check for long option with equals format (e.g., --from=value)
      else if (arg.match(/^--[a-zA-Z-]+=.+$/)) {
        const [option, ...valueParts] = arg.split("=");
        processedArgs.push(option);
        processedArgs.push(valueParts.join("=")); // Rejoin in case value contains =
      } else {
        processedArgs.push(arg);
      }
    }

    return { args: processedArgs, customVariables };
  }

  /**
   * Checks if the arguments represent a three-word command pattern.
   *
   * @param args - Array of command-line arguments
   * @returns True if it matches a three-word command pattern
   */
  private isThreeWordCommand(args: string[]): boolean {
    // Check if we have "find bugs" as the first two arguments
    if (args.length >= 2 && args[0] === "find" && args[1] === "bugs") {
      // If no user-provided custom config, always treat "find bugs" as three-word command
      if (!this.hasUserProvidedConfig) {
        return true;
      }

      // If user provided custom config and it defines "find" pattern, check if it should be two-parameter
      const twoParamsConfig = this.customConfig?.params?.two;
      if (twoParamsConfig?.demonstrativeType?.pattern && twoParamsConfig?.layerType?.pattern) {
        const demonstrativePattern = new RegExp(twoParamsConfig.demonstrativeType.pattern);
        const layerPattern = new RegExp(twoParamsConfig.layerType.pattern);

        // If both "find" and "bugs" match the patterns, treat as two-parameter
        if (demonstrativePattern.test("find") && layerPattern.test("bugs")) {
          return false;
        }
      }

      // Otherwise treat as three-word command
      return true;
    }
    return false;
  }

  /**
   * Parses a three-word command and returns a ThreeParamsResult.
   *
   * @param args - Array of command-line arguments
   * @returns ThreeParamsResult object
   */
  private parseThreeWordCommand(args: string[]): ThreeParamsResult {
    // Preprocess arguments to extract custom variables and handle equals format
    const { args: processedArgs, customVariables } = this.preprocessArgs(args);

    // Extract layer type (third word if present and not an option)
    let layerType: string | undefined;
    let optionStartIndex = 2;

    if (processedArgs.length > 2 && !processedArgs[2].startsWith("-")) {
      layerType = processedArgs[2];
      optionStartIndex = 3;
    }

    // Parse options from the remaining arguments
    const options: Record<string, unknown> = {};

    for (let i = optionStartIndex; i < processedArgs.length; i++) {
      const arg = processedArgs[i];

      if (arg.startsWith("--")) {
        const optionName = arg.substring(2);
        // Regular long option
        if (i + 1 < processedArgs.length && !processedArgs[i + 1].startsWith("-")) {
          options[optionName] = processedArgs[i + 1];
          i++; // Skip the value
        } else {
          options[optionName] = true; // Flag option
        }
      } else if (arg.startsWith("-")) {
        // Short option
        const optionName = arg.substring(1);
        if (i + 1 < processedArgs.length && !processedArgs[i + 1].startsWith("-")) {
          options[optionName] = processedArgs[i + 1];
          i++; // Skip the value
        } else {
          options[optionName] = true; // Flag option
        }
      }
    }

    // Add custom variables to options
    if (Object.keys(customVariables).length > 0) {
      options.customVariables = customVariables;
    }

    return {
      type: "three",
      demonstrativeType: "find",
      subCommand: "bugs",
      layerType,
      options,
    };
  }
}
