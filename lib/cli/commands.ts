import { CommandOptions } from "./args.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { processWithPrompt } from "../prompt/processor.ts";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

const logger = new BreakdownLogger();

export async function executeCommand(
  command: string,
  subcommands: string[],
  args: CommandOptions,
): Promise<{ success: boolean; output: string; error: string }> {
  let output = "";
  let error = "";

  try {
    logger.info(`Executing command: ${command} with subcommands: ${subcommands.join(" ")}`);

    // Validate mutually exclusive options
    if (args.fromFile && args.fromProject) {
      error = "Conflicting options: --from and --from-project cannot be used together";
      logger.error(error);
      return { success: false, output, error };
    }
    if (args.fromFile && args.fromIssue) {
      error = "Conflicting options: --from and --from-issue cannot be used together";
      logger.error(error);
      return { success: false, output, error };
    }
    if (args.fromProject && args.fromIssue) {
      error = "Conflicting options: --from-project and --from-issue cannot be used together";
      logger.error(error);
      return { success: false, output, error };
    }

    switch (command) {
      case "convert": {
        if (subcommands.length < 2 || subcommands[0] !== "to") {
          error = "Invalid convert command. Usage: convert to <type>";
          logger.error(error);
          return { success: false, output, error };
        }

        const targetType = subcommands[1];
        const fromFile = args.fromFile || args.fromProject || args.fromIssue;
        const destFile = args.destination;

        if (!fromFile) {
          error = "Source file must be specified using --from, --from-project, or --from-issue";
          logger.error(error);
          return { success: false, output, error };
        }

        if (!destFile) {
          error = "Destination file must be specified using --destination";
          logger.error(error);
          return { success: false, output, error };
        }

        logger.info(`Converting from ${fromFile} to ${destFile} with type ${targetType}`);

        // Ensure destination directory exists
        await ensureDir(join(destFile, ".."));
        logger.debug(`Ensured destination directory exists for ${destFile}`);

        switch (targetType) {
          case "issues":
            await processWithPrompt("to", "issues", fromFile, destFile, { quiet: args.quiet });
            output = `Successfully converted ${fromFile} to issues at ${destFile}`;
            logger.info(output);
            break;
          case "tasks":
            await processWithPrompt("to", "tasks", fromFile, destFile, { quiet: args.quiet });
            output = `Successfully converted ${fromFile} to tasks at ${destFile}`;
            logger.info(output);
            break;
          default:
            error = `Unknown conversion target type: ${targetType}`;
            logger.error(error);
            return { success: false, output, error };
        }
        break;
      }
      case "analyze": {
        if (subcommands.length < 2 || subcommands[0] !== "summary") {
          error = "Invalid analyze command. Usage: analyze summary <type>";
          logger.error(error);
          return { success: false, output, error };
        }

        const targetType = subcommands[1];
        const fromFile = args.fromFile;
        const destFile = args.destination;

        if (!fromFile) {
          error = "Source file must be specified using --from";
          logger.error(error);
          return { success: false, output, error };
        }

        if (!destFile) {
          error = "Destination file must be specified using --destination";
          logger.error(error);
          return { success: false, output, error };
        }

        logger.info(`Analyzing ${targetType} from ${fromFile} to ${destFile}`);

        // Ensure destination directory exists
        await ensureDir(join(destFile, ".."));
        logger.debug(`Ensured destination directory exists for ${destFile}`);

        switch (targetType) {
          case "tasks": {
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
            logger.info(output);
            break;
          }
          default:
            error = `Unknown analysis target type: ${targetType}`;
            logger.error(error);
            return { success: false, output, error };
        }
        break;
      }
      default:
        error = `Unknown command: ${command}`;
        logger.error(error);
        return { success: false, output, error };
    }

    return { success: true, output, error };
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
    logger.error(`Command execution failed: ${error}`);
    return { success: false, output, error };
  }
}
