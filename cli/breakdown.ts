#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join, resolve, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

interface Config {
  working_directory: {
    root: string;
    Interims: {
      projects: string;
      issues: string;
      tasks: string;
    };
  };
}

// Add version number from Deno
const VERSION = "0.1.0";

interface TransformOptions {
  layerType: string;
  inputFile: string;
  outputDir: string;
}

async function transformMarkdown({ layerType, inputFile, outputDir }: TransformOptions) {
  try {
    // 1. Get content from input markdown file - resolve from current working directory
    const resolvedInputPath = resolve(Deno.cwd(), inputFile);
    const inputMarkdown = await Deno.readTextFile(resolvedInputPath);

    // 2. Get schema content - resolve from script location
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const schemaPath = resolve(scriptDir, "..", "rules", "schema", `${layerType}.schema.json`);
    const schema = await Deno.readTextFile(schemaPath);

    // 3. Get prompt template - resolve from script location
    const promptPath = resolve(scriptDir, "..", "breakdown", "prompts", layerType, "default.prompt");
    const promptTemplate = await Deno.readTextFile(promptPath);

    // 4. Replace placeholders
    const prompt = promptTemplate
      .replace("{input_markdown}", inputMarkdown)
      .replace("{output_schema}", schema);

    // 5. Write to output file
    await ensureDir(outputDir);
    const outputPath = join(outputDir, `${Date.now()}.md`);
    await Deno.writeTextFile(outputPath, prompt);

    // 6. Output to stdout as well
    console.log("\n=== Input Markdown ===\n");
    console.log(inputMarkdown);
    console.log("\n=== Generated Prompt ===\n");
    console.log(prompt);
    console.log("\n=== End of Output ===\n");
    
    console.log(`✅ Processed ${layerType} saved to: ${outputPath}`);
    return { prompt, outputPath };
  } catch (error) {
    console.error(`Error in transformMarkdown: ${error.message}`);
    throw error;
  }
}

async function main() {
  const args = parse(Deno.args);
  
  if (args._[0] === "to" && args._[1]) {
    try {
      const layerType = args._[1] as string;
      // Fix: Get the last argument as input file if multiple are provided
      const inputFile = args._[args._.length - 1] as string;
      
      if (!inputFile) {
        console.error("Error: Input file path is required");
        Deno.exit(1);
      }

      // Validate the input file exists
      try {
        const resolvedInputPath = resolve(Deno.cwd(), inputFile);
        await Deno.stat(resolvedInputPath);
      } catch {
        console.error(`Error: Input file not found: ${inputFile}`);
        Deno.exit(1);
      }

      const outputDir = args.o || args.output || `./.agent/breakdown/${layerType}s`;

      await transformMarkdown({
        layerType,
        inputFile,
        outputDir,
      });
    } catch (error) {
      console.error("Error:", error.message);
      Deno.exit(1);
    }
  } else {
    console.log(`
Breakdown ${VERSION}
Usage: breakdown to <layer_type> <input_file.md> [-o output_dir]

Options:
  -o, --output    Output directory (default: ./.agent/breakdown/<layer_type>s)

Layer Types:
  - issue
  - task
  - project
    `);
  }
}

if (import.meta.main) {
  main();
} 