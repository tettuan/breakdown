import { parse } from "https://deno.land/std/flags/mod.ts";
import { toJSON, toMarkdown } from "./lib/mod.ts";
import { Command } from "https://deno.land/std@0.131.0/flags/mod.ts";

async function main() {
  const args = parse(Deno.args);
  const command = args._[0];
  const subCommand = args._[1];
  const input = args._[2];
  const output = args.o || args.output;

  if (!command || !subCommand || !input || !output) {
    console.error("Usage: breakdown <to|summary> <project|issue|task> <input> -o <output>");
    Deno.exit(1);
  }

  try {
    switch (command) {
      case "to":
        await toJSON(subCommand, input, output);
        break;
      case "summary":
        await toMarkdown(subCommand, input, output);
        break;
      default:
        console.error("Unknown command:", command);
        Deno.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  const command = new Command()
    .name("breakdown")
    .version("0.1.0");

  await command.parse(Deno.args);
}

export async function toJSON(subcommand: string, content: string, outputPath: string): Promise<ConversionResult> {
  if (!["project", "issue", "task"].includes(subcommand)) {
    throw new Error(`Invalid subcommand: ${subcommand}`);
  }
  // ... 既存の処理 ...
}

export async function toMarkdown(subcommand: string, content: string, outputPath: string): Promise<ConversionResult> {
  if (!["project", "issue", "task"].includes(subcommand)) {
    throw new Error(`Invalid subcommand: ${subcommand}`);
  }
  // ... 既存の処理 ...
} 