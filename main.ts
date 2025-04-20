#!/usr/bin/env -S deno run -A

/**
 * Breakdown CLI
 *
 * A tool that uses JSR packages to handle:
 * - Configuration management (@tettuan/breakdownconfig)
 * - Parameter processing (@tettuan/breakdownparams)
 * - Prompt handling (@tettuan/breakdownprompt)
 * - Logging (@tettuan/breakdownlogger)
 */

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ParamsParser } from "@tettuan/breakdownparams";
import { PromptManager } from "@tettuan/breakdownprompt";
import { join } from "https://deno.land/std@0.217.0/path/join.ts";
import { ensureDirSync } from "https://deno.land/std@0.217.0/fs/ensure_dir.ts";

if (import.meta.main) {
  const logger = new BreakdownLogger();

  try {
    // Initialize configuration
    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();

    // Parse command line arguments
    const parser = new ParamsParser();
    const params = await parser.parse(Deno.args);

    // Initialize prompt manager
    const promptManager = new PromptManager(logger);

    // Process based on parameters
    switch (params.type) {
      case "no-params":
        // Help and version are handled by BreakdownParams
        break;

      case "single":
        if (params.command === "init") {
          const workingDir = settings.working_dir || ".agent/breakdown";
          await ensureDirSync(workingDir);
        }
        break;

      case "double": {
        // Handle conversion using BreakdownPrompt
        const fromFile = params.options?.fromFile;
        const destinationFile = params.options?.destinationFile;
        const inputContent = fromFile ? await Deno.readTextFile(fromFile) : "";

        // Create temporary template file
        const tempDir = join(settings.working_dir || ".agent/breakdown", "temp", "templates");
        await ensureDirSync(tempDir);
        const tempTemplatePath = join(tempDir, `template_${Date.now()}.md`);

        // Generate prompt using the temporary template
        const result = await promptManager.generatePrompt(tempTemplatePath, {
          input_markdown_file: fromFile || "",
          input_markdown: inputContent,
          destination_path: destinationFile || "",
        });

        if (result.success && destinationFile) {
          const destPath = settings.working_dir || ".agent/breakdown";
          await ensureDirSync(destPath);
          await Deno.writeTextFile(join(destPath, destinationFile), result.prompt);
        }
        break;
      }
    }
  } catch (error) {
    logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
