import { CommandOptions } from "./args.ts";
import { processWithPrompt } from "../prompt/processor.ts";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";
import { Config } from "./config/config.ts";

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

        switch (targetType) {
          case "issue":
            await processWithPrompt("", "to", "issue", fromFile, destFile, "");
            output = `Successfully converted ${fromFile} to issue at ${destFile}`;
            break;
          case "task":
            await processWithPrompt("", "to", "task", fromFile, destFile, "");
            output = `Successfully converted ${fromFile} to task at ${destFile}`;
            break;
          default:
            error = `Unknown conversion target type: ${targetType}`;
            return { success: false, output, error };
        }
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

        switch (targetType) {
          case "task": {
            const content = await Deno.readTextFile(fromFile);
            const tasks = content.match(/\[[ x]\]/g) || [];
            const completed = tasks.filter((t) => t === "[x]").length;
            const analysis = {
              total: tasks.length,
              completed,
              remaining: tasks.length - completed,
              progress: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
            };
            await Deno.writeTextFile(destFile, JSON.stringify(analysis, null, 2));
            output = `Successfully analyzed tasks from ${fromFile}. Results saved to ${destFile}`;
            break;
          }
          default:
            error = `Unknown analysis target type: ${targetType}`;
            return { success: false, output, error };
        }
        break;
      }
      case "init": {
        await Config.getInstance().initialize();
        const now = new Date().toISOString();
        console.debug(`[${now}] [DEBUG] Configuration loaded`);
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
