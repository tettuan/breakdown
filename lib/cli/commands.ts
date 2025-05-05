import { CommandOptions } from "./args.ts";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { PromptAdapterImpl } from "../prompt/prompt_adapter.ts";

export async function executeCommand(
  command: string,
  subcommands: string[],
  args: CommandOptions,
): Promise<{ success: boolean; output: string; error: string }> {
  let output = "";
  let error = "";

  try {
    // Validate mutually exclusive options
    if (args.fromFile && args.fromProject) {
      error = "Conflicting options: --from and --from-project cannot be used together";
      return { success: false, output, error };
    }
    if (args.fromFile && args.fromIssue) {
      error = "Conflicting options: --from and --from-issue cannot be used together";
      return { success: false, output, error };
    }
    if (args.fromProject && args.fromIssue) {
      error = "Conflicting options: --from-project and --from-issue cannot be used together";
      return { success: false, output, error };
    }

    switch (command) {
      case "convert": {
        if (subcommands.length < 2 || subcommands[0] !== "to") {
          error = "Invalid convert command. Usage: convert to <type>";
          return { success: false, output, error };
        }

        const targetType = subcommands[1];
        const fromFile = args.fromFile || args.fromProject || args.fromIssue;
        const destFile = args.destination;

        if (!fromFile) {
          error = "Source file must be specified using --from, --from-project, or --from-issue";
          return { success: false, output, error };
        }

        if (!destFile) {
          error = "Destination file must be specified using --destination";
          return { success: false, output, error };
        }

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
        if (subcommands.length < 2 || subcommands[0] !== "summary") {
          error = "Invalid analyze command. Usage: analyze summary <type>";
          return { success: false, output, error };
        }

        const targetType = subcommands[1];
        const fromFile = args.fromFile;
        const destFile = args.destination;

        if (!fromFile) {
          error = "Source file must be specified using --from";
          return { success: false, output, error };
        }

        if (!destFile) {
          error = "Destination file must be specified using --destination";
          return { success: false, output, error };
        }

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

    return { success: true, output, error };
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
    return { success: false, output, error };
  }
}
