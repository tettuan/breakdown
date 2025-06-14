import { EnhancedParamsParser } from "./lib/cli/parser/enhanced_params_parser.ts";
import { validateCommandOptions as validateArgs } from "./lib/cli/args.ts";

function preprocessCommandLine(args: string[]): {
  commandArgs: string[];
  extractedOptions: Record<string, string | boolean>;
} {
  const commandArgs: string[] = [];
  const extractedOptions: Record<string, string | boolean> = {};

  // Find the end of command arguments (stop at first option)
  let commandEndIndex = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("-")) {
      commandEndIndex = i;
      break;
    }
    commandArgs.push(args[i]);
    commandEndIndex = i + 1;
  }

  // If no options found, return original args
  if (commandEndIndex >= args.length) {
    return { commandArgs: args, extractedOptions: {} };
  }

  // Process options
  for (let i = commandEndIndex; i < args.length; i++) {
    const arg = args[i];

    // Custom variables (--uv-*) are handled by EnhancedParamsParser
    if (arg.startsWith("--uv-")) {
      commandArgs.push(arg);
      if (!arg.includes("=") && i + 1 < args.length && !args[i + 1].startsWith("-")) {
        commandArgs.push(args[i + 1]);
        i++; // Skip the value
      }
      continue;
    }

    // Handle equals format (-f=value, --from=value)
    if (arg.includes("=")) {
      const [option, ...valueParts] = arg.split("=");
      const value = valueParts.join("=");
      const key = option.replace(/^-+/, "");
      extractedOptions[key] = value;
      continue;
    }

    // Handle regular options
    if (arg.startsWith("-")) {
      const key = arg.replace(/^-+/, "");
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        extractedOptions[key] = args[i + 1];
        i++; // Skip value
      } else {
        extractedOptions[key] = true;
      }
      continue;
    }

    // If we get here, it's a value without an option (shouldn't happen with our logic)
    commandArgs.push(arg);
  }

  return { commandArgs, extractedOptions };
}

const testArgs = ["find", "bugs", "--from", "test_input.txt", "--destination", "output.md"];
console.log("Original args:", testArgs);

const { commandArgs, extractedOptions } = preprocessCommandLine(testArgs);
console.log("Command args:", commandArgs);
console.log("Extracted options:", extractedOptions);

const parser = new EnhancedParamsParser();
const result = parser.parse(commandArgs);
console.log("EnhancedParamsParser result:", result);

const filteredArgs = commandArgs.filter((arg) => !arg.startsWith("--uv-"));
console.log("Filtered args:", filteredArgs);

try {
  const parsedOptions = validateArgs(filteredArgs);
  console.log("Parsed options:", parsedOptions);
} catch (error) {
  console.error("validateArgs error:", error instanceof Error ? error.message : String(error));
}
