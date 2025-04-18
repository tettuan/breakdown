/**
 * Command line argument parser for the Breakdown tool.
 * @module
 */

import type { CommandParams, NoParamsResult, SingleParamResult, DoubleParamsResult } from "../types/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { parse as parseFlags } from "jsr:@std/flags@^0.224.0";

const logger = new BreakdownLogger();

/**
 * Parser for command line arguments
 */
export class ParamsParser {
  /**
   * Parse command line arguments into structured command parameters
   * @param args Command line arguments
   * @returns Parsed command parameters
   * @throws {Error} If parsing fails or arguments are invalid
   */
  async parse(args: string[]): Promise<CommandParams> {
    try {
      const parsedArgs = parseFlags(args, {
        string: ["from", "to", "destination", "input"],
        boolean: ["help", "version"],
        alias: {
          h: "help",
          v: "version",
          f: "from",
          o: "destination",
          i: "input"
        },
      });

      // Handle help and version flags
      if (parsedArgs.help || parsedArgs.version) {
        return {
          type: "no-params",
          workingDir: ".",
          help: parsedArgs.help === true ? true : undefined,
          version: parsedArgs.version === true ? true : undefined,
        } as NoParamsResult;
      }

      // Handle empty args
      if (parsedArgs._.length === 0) {
        return {
          type: "no-params",
          workingDir: ".",
        } as NoParamsResult;
      }

      const command = parsedArgs._[0] as string;

      // Handle init command
      if (command === "init") {
        return {
          type: "single",
          workingDir: ".",
          command: "init",
        } as SingleParamResult;
      }

      // Handle double commands
      if (command === "to" || command === "summary" || command === "defect") {
        const layerType = parsedArgs._[1] as string;
        if (!layerType) {
          throw new Error("Layer type is required");
        }

        if (!parsedArgs.from) {
          throw new Error("--from option is required for this command");
        }

        // Validate input layer type if provided
        if (parsedArgs.input && !["project", "issue", "task"].includes(parsedArgs.input)) {
          throw new Error("Invalid input layer type. Must be one of: project, issue, task");
        }

        return {
          type: "double",
          workingDir: ".",
          demonstrativeType: command,
          layerType,
          options: {
            fromFile: parsedArgs.from,
            destinationFile: parsedArgs.to || parsedArgs.destination,
            fromLayerType: parsedArgs.input,
          },
        } as DoubleParamsResult;
      }

      throw new Error("Invalid command type");
    } catch (error) {
      logger.error(`Parameter parsing error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}