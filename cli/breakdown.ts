import { VERSION } from "../version.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.6";
import { ParamsParser as BreakdownParams } from "jsr:@tettuan/breakdownparams@^0.1.8";
import { initWorkspace } from "../lib/commands/mod.ts";

const logger = new BreakdownLogger();

const HELP_TEXT = `
Breakdown - AI Development Instruction Tool

Usage:
  breakdown <command> [options]

Commands:
  to      Convert between different formats
  summary Generate summary from input
  defect  Analyze error logs
  init    Initialize working directory
  help    Show this help message
  version Show version information

Options:
  --from, -f        Input file path
  --destination, -o Output file or directory path
  --config          Configuration file path
`;

const VERSION_TEXT = `Breakdown v${VERSION}\nCopyright (c) 2024\nLicense: MIT`;

interface OptionParams {
  workingDir: string;
  fromFile?: string;
  destinationFile?: string;
  fromLayerType?: string;
  layerType?: string;
  help?: boolean;
  version?: boolean;
}

export async function runBreakdown(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  try {
    // Initialize configuration
    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();

    // Parse command parameters and execute command
    const params = new BreakdownParams();
    const parsedParams = await params.parse(args);

    switch (parsedParams.type) {
      case "no-params":
        if (parsedParams.help) {
          console.log(HELP_TEXT);
        } else if (parsedParams.version) {
          console.log(VERSION_TEXT);
        }
        break;

      case "single":
        if (parsedParams.command === "init") {
          const workingDir = parsedParams.options?.workingDir || settings.working_dir || ".";
          await initWorkspace(workingDir);
        }
        break;

      case "double": {
        // Handle conversion commands
        const options = parsedParams.options || {};
        logger.info(
          `Converting from ${options.fromLayerType || "unknown"} to ${parsedParams.layerType}`,
        );
        if (options.fromFile) {
          logger.info(`Input file: ${options.fromFile}`);
        }
        if (options.destinationFile) {
          logger.info(`Output file: ${options.destinationFile}`);
        }
        break;
      }

      default:
        logger.error("Unknown command type");
        console.log(HELP_TEXT);
        break;
    }
  } catch (error) {
    logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

if (import.meta.main) {
  try {
    await runBreakdown(Deno.args);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred");
    }
    Deno.exit(1);
  }
}
