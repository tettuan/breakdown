import { parse } from "https://deno.land/std/flags/mod.ts";
import { toJSON, toMarkdown } from "./lib/mod.ts";

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
  main();
} 