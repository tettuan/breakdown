/**
 * Breakdown CLI
 * 
 * Command-line interface for the Breakdown tool.
 * See docs/breakdown/breakdown.ja.md for specifications.
 */

import { parse } from "./deps.ts";
import { Config } from "./lib/config/config.ts";
import { exists, ensureDir } from "./deps.ts";
import { loadPrompt } from "./lib/prompts/loader.ts";

// Main CLI function
async function main() {
  const args = parse(Deno.args);
  
  // Handle command line arguments according to options.ja.md
  const demonstrativeType = args._[0] as string;
  const layerType = args._[1] as string;
  
  // Handle from file option
  const fromFile = args.from || args.f;
  
  // Handle destination option
  const destinationFile = args.destination || args.o;
  
  // Handle input option
  const fromLayerType = args.input || args.i;
  
  // Process command based on demonstrativeType
  switch (demonstrativeType) {
    case "init":
      // Initialize workspace
      const workingDir = ".agent/breakdown";
      
      if (await exists(workingDir)) {
        console.log(`Working directory already exists: ${workingDir}`);
      } else {
        await ensureDir(workingDir);
        await ensureDir(`${workingDir}/projects`);
        await ensureDir(`${workingDir}/issues`);
        await ensureDir(`${workingDir}/tasks`);
        console.log(`Created working directory: ${workingDir}`);
      }
      break;
    case "to":
      // Basic command output for single argument
      if (!layerType && !fromFile) {
        console.log(demonstrativeType);
        return;
      }
      
      // Validate layerType
      if (layerType && !["project", "issue", "task"].includes(layerType)) {
        console.error("Invalid second argument. Must be one of: project, issue, task");
        Deno.exit(1);
      }
      
      // Check if input file is provided
      if (layerType && !fromFile) {
        console.error("Input file is required. Use --from/-f option");
        Deno.exit(1);
      }
      
      // Load appropriate prompt and process
      if (fromFile) {
        try {
          const prompt = await loadPrompt(demonstrativeType, layerType, fromLayerType);
          console.log(prompt);
        } catch (error) {
          console.error(error.message);
          Deno.exit(1);
        }
      }
      break;
    case "summary":
    case "defect":
      // Validate layerType
      if (layerType && !["project", "issue", "task"].includes(layerType)) {
        console.error("Invalid second argument. Must be one of: project, issue, task");
        Deno.exit(1);
      }
      
      // Check if input file is provided
      if (!fromFile) {
        console.error("Input file is required. Use --from/-f option");
        Deno.exit(1);
      }
      
      // Load appropriate prompt and process
      try {
        const prompt = await loadPrompt(demonstrativeType, layerType, fromLayerType);
        console.log(prompt);
      } catch (error) {
        console.error(error.message);
        Deno.exit(1);
      }
      break;
    default:
      console.error("Invalid first argument. Must be one of: to, summary, defect, init");
      Deno.exit(1);
  }
}

// Run the CLI
if (import.meta.main) {
  main().catch(err => {
    console.error(err);
    Deno.exit(1);
  });
} 