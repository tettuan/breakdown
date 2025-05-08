import type { CommandOptions } from "./args.ts";
export type { CommandOptions } from "./args.ts";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { PromptAdapterImpl } from "../prompt/prompt_adapter.ts";

/**
 * Executes a CLI command with the given subcommands and arguments.
 * Handles command validation, option conflicts, and delegates to the appropriate logic for each command.
 *
 * @param command The main command to execute (e.g., 'convert', 'analyze', 'init').
 * @param subcommands The list of subcommands or arguments for the command.
 * @param args The parsed command line options.
 * @returns An object containing success status, output, and error message.
 */
export async function executeCommand(
  command: string,
  subcommands: string[],
  args: CommandOptions,
): Promise<{ success: boolean; output: string; error: string }> {
  let output = "";
  let error = "";

  try {
    // Validate input file options
    if (args.fromFile && args.from) {
      throw new Error("Cannot specify both --from and --from-file");
    }

    // Get input file path
    const fromFile = args.fromFile || args.from;
    if (!fromFile) {
      throw new Error("No input file specified");
    }

    // Validate destination
    if (!args.destination) {
      throw new Error("Destination must be specified");
    }

    // Process command based on type
    if (subcommands.length === 2) {
      switch (command) {
        case "convert": {
          const targetType = subcommands[1];
          const destFile = args.destination;

          const cliParams = {
            demonstrativeType: "to" as import("../types/mod.ts").DemonstrativeType,
            layerType: targetType as import("../types/mod.ts").LayerType,
            options: {
              fromFile,
              destinationFile: destFile,
              adaptation: args.adaptation,
            },
          };
          const factory = await PromptVariablesFactory.create(cliParams);
          const adapter = new PromptAdapterImpl(factory);
          const promptResult = await adapter.validateAndGenerate();
          if (!promptResult.success) {
            return { success: false, output: "", error: promptResult.content };
          }
          output = promptResult.content;
          break;
        }
        case "analyze": {
          const targetType = subcommands[1];
          const destFile = args.destination;

          const cliParams2 = {
            demonstrativeType: "summary" as import("../types/mod.ts").DemonstrativeType,
            layerType: targetType as import("../types/mod.ts").LayerType,
            options: {
              fromFile,
              destinationFile: destFile,
              adaptation: args.adaptation,
            },
          };
          const factory2 = await PromptVariablesFactory.create(cliParams2);
          const adapter2 = new PromptAdapterImpl(factory2);
          const promptResult2 = await adapter2.validateAndGenerate();
          if (!promptResult2.success) {
            return { success: false, output: "", error: promptResult2.content };
          }
          output = promptResult2.content;
          break;
        }
        case "init": {
          output = "";
          break;
        }
        default:
          error = `Unknown command: ${command}`;
          return { success: false, output, error };
      }
    } else {
      error = `Invalid command usage. Usage: ${command} <type>`;
      return { success: false, output, error };
    }

    return { success: true, output, error };
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
    return { success: false, output, error };
  }
}
