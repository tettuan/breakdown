import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { type OptionParams, ParamsParser } from "@tettuan/breakdownparams";
import { VERSION } from "../version.ts";
import { initWorkspace } from "../lib/commands/mod.ts";

const logger = new BreakdownLogger();
const settings = new BreakdownConfig();

const HELP_TEXT = `
Breakdown - AI Development Instruction Tool

Usage:
  breakdown <command> [options]

Commands:
  init        Initialize a new workspace
  convert     Convert between different layer types

Options:
  --help      Show this help message
  --version   Show version information
`;

const VERSION_TEXT = `Breakdown v${VERSION}\nCopyright (c) 2024\nLicense: MIT`;

// Extend the OptionParams type to include workingDir
interface ExtendedOptionParams extends OptionParams {
  workingDir?: string;
}

export async function runBreakdown(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  try {
    // Initialize configuration
    await settings.loadConfig();
    const settingsConfig = await settings.getConfig();

    // Parse command parameters and execute command
    const params = new ParamsParser();
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
          const options = parsedParams.options as ExtendedOptionParams;
          const workingDir = options?.workingDir || settingsConfig.working_dir || ".";
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
