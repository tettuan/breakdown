/**
 * @fileoverview Integration tests for CLI errors module
 *
 * Tests end-to-end integration scenarios:
 * - Integration with CLI argument parsing
 * - Error handling in real command execution
 * - Integration with logging and error reporting
 * - Error propagation through application layers
 * - Real-world CLI error scenarios
 *
 * @module cli/3_integration_errors_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "../deps.ts";
import { CliError, CliErrorCode } from "./errors.ts";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("cli-errors-integration-test");

Deno.test("Integration: CliError with command line argument simulation", async () => {
  // Simulate real CLI scenarios that would produce these errors

  // Scenario 1: Invalid option detection
  const parseArgs = (args: string[]): CliError | null => {
    const validOptions = ["--help", "--version", "--output", "--verbose", "--quiet"];

    for (const arg of args) {
      if (arg.startsWith("--") && !validOptions.includes(arg)) {
        return new CliError(
          CliErrorCode.INVALID_OPTION,
          `Unknown option '${arg}'. Use --help to see available options.`,
        );
      }
    }
    return null;
  };

  const invalidOptionError = parseArgs(["--invalid-flag", "--output", "file.txt"]);
  assertExists(invalidOptionError, "Should detect invalid option");
  assertEquals(invalidOptionError.code, CliErrorCode.INVALID_OPTION);
  assertStringIncludes(invalidOptionError.message, "--invalid-flag");

  // Scenario 2: Duplicate option detection
  const detectDuplicates = (args: string[]): CliError | null => {
    const seen = new Set<string>();

    for (const arg of args) {
      if (arg.startsWith("--")) {
        if (seen.has(arg)) {
          return new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            `Option '${arg}' specified multiple times. Each option should be used only once.`,
          );
        }
        seen.add(arg);
      }
    }
    return null;
  };

  const duplicateError = detectDuplicates(["--verbose", "--output", "file1.txt", "--verbose"]);
  assertExists(duplicateError, "Should detect duplicate option");
  assertEquals(duplicateError.code, CliErrorCode.DUPLICATE_OPTION);
  assertStringIncludes(duplicateError.message, "--verbose");

  // Scenario 3: Conflicting options detection
  const detectConflicts = (args: string[]): CliError | null => {
    const hasQuiet = args.includes("--quiet");
    const hasVerbose = args.includes("--verbose");

    if (hasQuiet && hasVerbose) {
      return new CliError(
        CliErrorCode.CONFLICTING_OPTIONS,
        "Cannot use --quiet and --verbose together. Choose one output verbosity level.",
      );
    }
    return null;
  };

  const conflictError = detectConflicts(["--quiet", "--output", "file.txt", "--verbose"]);
  assertExists(conflictError, "Should detect conflicting options");
  assertEquals(conflictError.code, CliErrorCode.CONFLICTING_OPTIONS);
  assertStringIncludes(conflictError.message, "--quiet and --verbose");
});

Deno.test("Integration: CliError with parameter validation", async () => {
  // Simulate parameter validation scenarios

  interface CliConfig {
    timeout?: number;
    port?: number;
    force?: boolean;
    outputFormat?: "json" | "yaml" | "text";
  }

  const validateConfig = (args: Record<string, string>): CliError | CliConfig => {
    const config: CliConfig = {};

    // Validate timeout parameter
    if (args.timeout !== undefined) {
      const timeoutValue = parseInt(args.timeout);
      if (isNaN(timeoutValue) || timeoutValue < 0) {
        return new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Invalid timeout value '${args.timeout}'. Expected positive number in milliseconds.`,
        );
      }
      config.timeout = timeoutValue;
    }

    // Validate port parameter
    if (args.port !== undefined) {
      const portValue = parseInt(args.port);
      if (isNaN(portValue) || portValue < 1 || portValue > 65535) {
        return new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Invalid port value '${args.port}'. Expected number between 1 and 65535.`,
        );
      }
      config.port = portValue;
    }

    // Validate boolean parameter
    if (args.force !== undefined) {
      if (!["true", "false", "1", "0"].includes(args.force.toLowerCase())) {
        return new CliError(
          CliErrorCode.INVALID_INPUT_TYPE,
          `Invalid boolean value '${args.force}' for --force. Expected 'true' or 'false'.`,
        );
      }
      config.force = ["true", "1"].includes(args.force.toLowerCase());
    }

    // Validate enum parameter
    if (args.outputFormat !== undefined) {
      const validFormats = ["json", "yaml", "text"];
      if (!validFormats.includes(args.outputFormat)) {
        return new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Invalid output format '${args.outputFormat}'. Expected one of: ${
            validFormats.join(", ")
          }.`,
        );
      }
      config.outputFormat = args.outputFormat as "json" | "yaml" | "text";
    }

    return config;
  };

  // Test invalid timeout
  const timeoutError = validateConfig({ timeout: "invalid" });
  assertEquals(timeoutError instanceof CliError, true);
  if (timeoutError instanceof CliError) {
    assertEquals(timeoutError.code, CliErrorCode.INVALID_PARAMETERS);
    assertStringIncludes(timeoutError.message, "timeout");
  }

  // Test invalid port
  const portError = validateConfig({ port: "99999" });
  assertEquals(portError instanceof CliError, true);
  if (portError instanceof CliError) {
    assertEquals(portError.code, CliErrorCode.INVALID_PARAMETERS);
    assertStringIncludes(portError.message, "port");
  }

  // Test invalid boolean
  const boolError = validateConfig({ force: "maybe" });
  assertEquals(boolError instanceof CliError, true);
  if (boolError instanceof CliError) {
    assertEquals(boolError.code, CliErrorCode.INVALID_INPUT_TYPE);
    assertStringIncludes(boolError.message, "boolean");
  }

  // Test valid configuration
  const validConfig = validateConfig({ timeout: "5000", port: "3000", force: "true" });
  assertEquals(validConfig instanceof CliError, false);
  if (!(validConfig instanceof CliError)) {
    assertEquals(validConfig.timeout, 5000);
    assertEquals(validConfig.port, 3000);
    assertEquals(validConfig.force, true);
  }
});

Deno.test("Integration: CliError with required argument validation", async () => {
  // Simulate command structure validation

  interface CommandSpec {
    name: string;
    requiredArgs: string[];
    optionalArgs: string[];
  }

  const commands: Record<string, CommandSpec> = {
    "to": {
      name: "to",
      requiredArgs: ["target-type", "input-file"],
      optionalArgs: ["output-file"],
    },
    "summary": {
      name: "summary",
      requiredArgs: ["source-type"],
      optionalArgs: ["filter"],
    },
    "init": {
      name: "init",
      requiredArgs: [],
      optionalArgs: ["template"],
    },
  };

  const validateCommand = (commandName: string, args: string[]): CliError | null => {
    const spec = commands[commandName];
    if (!spec) {
      return new CliError(
        CliErrorCode.INVALID_PARAMETERS,
        `Unknown command '${commandName}'. Available commands: ${
          Object.keys(commands).join(", ")
        }.`,
      );
    }

    if (args.length < spec.requiredArgs.length) {
      const missing = spec.requiredArgs.slice(args.length);
      return new CliError(
        CliErrorCode.MISSING_REQUIRED,
        `Missing required arguments for '${commandName}': ${
          missing.join(", ")
        }. Usage: ${commandName} ${spec.requiredArgs.join(" ")} [${spec.optionalArgs.join("] [")}]`,
      );
    }

    return null;
  };

  // Test missing required arguments
  const missingArgsError = validateCommand("to", ["project"]);
  assertExists(missingArgsError, "Should detect missing required arguments");
  assertEquals(missingArgsError.code, CliErrorCode.MISSING_REQUIRED);
  assertStringIncludes(missingArgsError.message, "input-file");

  // Test unknown command
  const unknownCommandError = validateCommand("unknown", []);
  assertExists(unknownCommandError, "Should detect unknown command");
  assertEquals(unknownCommandError.code, CliErrorCode.INVALID_PARAMETERS);
  assertStringIncludes(unknownCommandError.message, "Unknown command");

  // Test valid command
  const validCommand = validateCommand("to", ["project", "input.md", "output.md"]);
  assertEquals(validCommand, null, "Should accept valid command");
});

Deno.test("Integration: CliError with logging and error reporting", async () => {
  // Test integration with BreakdownLogger

  const reportError = (error: CliError): { logged: boolean; userMessage: string } => {
    // Log detailed error for debugging
    _logger.error("CLI validation error occurred", {
      errorCode: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      errorType: "CliError",
    });

    // Generate user-friendly message
    const userMessage = (() => {
      switch (error.code) {
        case CliErrorCode.INVALID_OPTION:
          return `❌ ${error.message}\n💡 Use --help to see available options.`;
        case CliErrorCode.MISSING_REQUIRED:
          return `❌ ${error.message}\n💡 Check the command usage with --help.`;
        case CliErrorCode.CONFLICTING_OPTIONS:
          return `❌ ${error.message}\n💡 Review your command line arguments.`;
        case CliErrorCode.INVALID_PARAMETERS:
          return `❌ ${error.message}\n💡 Check parameter values and types.`;
        default:
          return `❌ ${error.message}`;
      }
    })();

    return { logged: true, userMessage };
  };

  // Test error reporting for different error types
  const invalidOptionError = new CliError(
    CliErrorCode.INVALID_OPTION,
    "Unknown option '--invalid'",
  );

  const report1 = reportError(invalidOptionError);
  assertEquals(report1.logged, true);
  assertStringIncludes(report1.userMessage, "❌");
  assertStringIncludes(report1.userMessage, "💡");
  assertStringIncludes(report1.userMessage, "--help");

  const missingRequiredError = new CliError(
    CliErrorCode.MISSING_REQUIRED,
    "Missing required argument: input-file",
  );

  const report2 = reportError(missingRequiredError);
  assertEquals(report2.logged, true);
  assertStringIncludes(report2.userMessage, "Missing required");
  assertStringIncludes(report2.userMessage, "Check the command usage");
});

Deno.test("Integration: CliError in command execution workflow", async () => {
  // Simulate full command execution with error handling

  interface ExecutionResult {
    success: boolean;
    output?: string;
    error?: CliError;
    exitCode: number;
  }

  const executeCommand = async (
    command: string,
    args: string[],
    options: Record<string, string> = {},
  ): Promise<ExecutionResult> => {
    try {
      // Step 1: Validate command
      const validCommands = ["to", "summary", "find", "init"];
      if (!validCommands.includes(command)) {
        return {
          success: false,
          error: new CliError(
            CliErrorCode.INVALID_PARAMETERS,
            `Unknown command '${command}'. Available: ${validCommands.join(", ")}`,
          ),
          exitCode: 1,
        };
      }

      // Step 2: Validate options
      const validOptions = ["--output", "--verbose", "--quiet", "--help", "--version"];
      for (const [key] of Object.entries(options)) {
        const optionKey = `--${key}`;
        if (!validOptions.includes(optionKey)) {
          return {
            success: false,
            error: new CliError(
              CliErrorCode.INVALID_OPTION,
              `Unknown option '${optionKey}'. Use --help for available options.`,
            ),
            exitCode: 1,
          };
        }
      }

      // Step 3: Validate required arguments
      const requiredArgCounts: Record<string, number> = {
        "to": 2,
        "summary": 1,
        "find": 1,
        "init": 0,
      };

      const requiredCount = requiredArgCounts[command] || 0;
      if (args.length < requiredCount) {
        return {
          success: false,
          error: new CliError(
            CliErrorCode.MISSING_REQUIRED,
            `Command '${command}' requires ${requiredCount} arguments, got ${args.length}`,
          ),
          exitCode: 1,
        };
      }

      // Step 4: Check for conflicts
      if (options.verbose && options.quiet) {
        return {
          success: false,
          error: new CliError(
            CliErrorCode.INVALID_OPTION,
            "Cannot use --verbose and --quiet together",
          ),
          exitCode: 1,
        };
      }

      // Success case
      return {
        success: true,
        output: `Executed ${command} with args: ${args.join(", ")}`,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
        exitCode: 2,
      };
    }
  };

  // Test successful execution
  const successResult = await executeCommand("to", ["project", "input.md"]);
  assertEquals(successResult.success, true);
  assertEquals(successResult.exitCode, 0);
  assertExists(successResult.output);

  // Test invalid command
  const invalidCommandResult = await executeCommand("invalid", []);
  assertEquals(invalidCommandResult.success, false);
  assertEquals(invalidCommandResult.exitCode, 1);
  assertExists(invalidCommandResult.error);
  assertEquals(invalidCommandResult.error?.code, CliErrorCode.INVALID_PARAMETERS);

  // Test missing arguments
  const missingArgsResult = await executeCommand("to", ["project"]);
  assertEquals(missingArgsResult.success, false);
  assertEquals(missingArgsResult.error?.code, CliErrorCode.MISSING_REQUIRED);

  // Test invalid option
  const invalidOptionResult = await executeCommand("init", [], { "invalid": "value" });
  assertEquals(invalidOptionResult.success, false);
  assertEquals(invalidOptionResult.error?.code, CliErrorCode.INVALID_OPTION);

  // Test conflicting options
  const conflictResult = await executeCommand("summary", ["task"], {
    "verbose": "true",
    "quiet": "true",
  });
  assertEquals(conflictResult.success, false);
  assertEquals(conflictResult.error?.code, CliErrorCode.INVALID_OPTION);
});

Deno.test("Integration: CliError error recovery and suggestions", async () => {
  // Test error recovery patterns and user guidance

  const generateErrorHelp = (error: CliError): string[] => {
    const suggestions: string[] = [];

    switch (error.code) {
      case CliErrorCode.INVALID_OPTION:
        suggestions.push("Use --help to see all available options");
        suggestions.push("Check for typos in option names");
        suggestions.push("Ensure options start with -- for long form or - for short form");
        break;

      case CliErrorCode.DUPLICATE_OPTION:
        suggestions.push("Remove duplicate options from your command");
        suggestions.push("Use each option only once");
        break;

      case CliErrorCode.CONFLICTING_OPTIONS:
        suggestions.push("Choose only one of the conflicting options");
        suggestions.push("Review the command documentation for option compatibility");
        break;

      case CliErrorCode.MISSING_REQUIRED:
        suggestions.push("Provide all required arguments");
        suggestions.push("Use --help to see command usage");
        suggestions.push("Check the command syntax in documentation");
        break;

      case CliErrorCode.INVALID_INPUT_TYPE:
        suggestions.push("Check the expected data type for the parameter");
        suggestions.push("Ensure values match the expected format");
        break;

      case CliErrorCode.INVALID_PARAMETERS:
        suggestions.push("Verify parameter values are within valid ranges");
        suggestions.push("Check parameter format and syntax");
        suggestions.push("Use --help for parameter documentation");
        break;
    }

    return suggestions;
  };

  // Test suggestions for each error type
  const errorTypes = Object.values(CliErrorCode);

  for (const errorType of errorTypes) {
    const error = new CliError(errorType, `Test error for ${errorType}`);
    const suggestions = generateErrorHelp(error);

    assertEquals(suggestions.length > 0, true, `Should have suggestions for ${errorType}`);
    assertEquals(
      suggestions.every((s) => typeof s === "string" && s.length > 0),
      true,
      `All suggestions should be non-empty strings for ${errorType}`,
    );

    // Each error type should have specific, relevant suggestions
    const suggestionText = suggestions.join(" ").toLowerCase();

    switch (errorType) {
      case CliErrorCode.INVALID_OPTION:
        assertEquals(
          suggestionText.includes("help") || suggestionText.includes("option"),
          true,
          "Invalid option suggestions should mention help or options",
        );
        break;
      case CliErrorCode.MISSING_REQUIRED:
        assertEquals(
          suggestionText.includes("required") || suggestionText.includes("usage"),
          true,
          "Missing required suggestions should mention requirements or usage",
        );
        break;
      case CliErrorCode.CONFLICTING_OPTIONS:
        assertEquals(
          suggestionText.includes("conflict") || suggestionText.includes("choose"),
          true,
          "Conflicting options suggestions should mention conflicts or choices",
        );
        break;
    }
  }
});
