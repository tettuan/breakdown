#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { join, resolve, dirname, fromFileUrl } from "https://deno.land/std@0.208.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { Config } from "../breakdown/config/config.ts";
import { Workspace } from "../breakdown/core/workspace.ts";
import { WorkspaceStructure } from "../breakdown/config/types.ts";

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
      .replace("{output_schema}", schema)
      .replace("{output_directory}", outputDir);

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

// Add new command type
type Command = "to" | "init";

async function main() {
  const config = Config.getInstance();
  const workspace = new Workspace(config);
  
  // コマンドライン引数のパース
  const { args, options } = parse(Deno.args);
  
  // 設定の初期化
  await config.initialize({
    outputDir: options.o || options.output,
    workingDir: options.w || options.workingDir,
    configPath: options.config
  });

  const command = args._[0] as Command;

  switch (command) {
    case "init": {
      const targetDir = args._[1] || Deno.cwd();
      try {
        await workspace.initialize(targetDir);
        console.log("✅ Workspace initialized successfully");
      } catch (error) {
        console.error("Error initializing workspace:", error.message);
        Deno.exit(1);
      }
      break;
    }

    case "to": {
      if (args._[1] && args._[args._.length - 1]) {
        try {
          const layerType = args._[1] as string;
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

          // Get output directory from -o or --output flag
          const outputDirectory = options.o || options.output;

          if (!outputDirectory) {
            throw new Error('Output directory (-o or --output) is required');
          }

          // Ensure output directory exists
          try {
            await ensureDir(outputDirectory);
          } catch (error) {
            console.error(`Error creating output directory: ${error.message}`);
            Deno.exit(1);
          }

          await transformMarkdown({
            layerType,
            inputFile,
            outputDir: outputDirectory,
          });
        } catch (error) {
          console.error("Error:", error.message);
          Deno.exit(1);
        }
      } else {
        console.error("Error: Invalid command usage");
        Deno.exit(1);
      }
      break;
    }

    default:
      console.log(`
Breakdown ${VERSION}
Usage: 
  breakdown init [directory]     Initialize workspace
  breakdown to <layer_type> <input_file.md> [-o output_dir]

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