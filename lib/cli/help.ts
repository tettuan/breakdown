/**
 * Help text constants for Breakdown CLI
 */

import { VERSION } from "../version.ts";

export { VERSION };
export const APP_NAME = "Breakdown - AI Development Instruction Tool";

/**
 * Help text structure
 */
export interface HelpTextConfig {
  commands: Array<{ name: string; description: string }>;
  options: Array<{ flags: string; description: string }>;
  examples: Array<string>;
}

/**
 * Default help configuration
 */
const DEFAULT_HELP_CONFIG: HelpTextConfig = {
  commands: [
    {
      name: "to <layer> [from_layer] [adaptation]",
      description: "Process directive with layer parameters using config files",
    },
  ],
  options: [
    {
      flags: "--config/-c <prefix>",
      description: "Use custom config prefix (loads <prefix>-app.yml, <prefix>-user.yml)",
    },
    { flags: "--help/-h", description: "Show this help message" },
    { flags: "--version/-v", description: "Show version information" },
  ],
  examples: [
    "breakdown to project --config=custom",
    "breakdown to issue from_task < input.md",
    "breakdown to task issue adaptation=strict",
  ],
};

/**
 * Generate help text from configuration
 */
function generateHelpText(config: HelpTextConfig = DEFAULT_HELP_CONFIG): string {
  let text = "\nUsage: breakdown [command] [options]\n\n";

  text += "Commands:\n";
  const maxCommandLength = Math.max(...config.commands.map((c) => c.name.length));
  for (const cmd of config.commands) {
    text += `  ${cmd.name.padEnd(maxCommandLength + 4)}${cmd.description}\n`;
  }

  text += "\nOptions:\n";
  const maxFlagLength = Math.max(...config.options.map((o) => o.flags.length));
  for (const opt of config.options) {
    text += `  ${opt.flags.padEnd(maxFlagLength + 4)}${opt.description}\n`;
  }

  text += "\nExamples:\n";
  for (const example of config.examples) {
    text += `  ${example}\n`;
  }

  return text;
}

export const HELP_TEXT = generateHelpText();

/**
 * Display version information
 */
export function showVersion(): void {
  console.log(`Breakdown v${VERSION}`);
  console.log(APP_NAME);
}

/**
 * Display help text
 */
export function showHelp(): void {
  console.log(APP_NAME);
  console.log(HELP_TEXT);
}

/**
 * Display minimal usage information
 */
export function showUsage(): void {
  console.log(APP_NAME);
  console.log("No parameters provided. Use --help for usage information.");
}
