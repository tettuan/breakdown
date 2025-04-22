import { DemonstrativeType, LayerType } from "../types/mod.ts";
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.8";
import { getConfig } from "../config/config.ts";
import { join } from "jsr:@std/path@^0.224.0/join";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { ensureDir } from "@std/fs";
import { dirname } from "jsr:@std/path@^0.224.0/dirname";
import { resolveLayerPath } from "../path/path_utils.ts";
import { basename } from "jsr:@std/path@^0.224.0/basename";
import { loadPrompt } from "./loader.ts";
import { ProgressBar, Spinner } from "../io/stdin.ts";

// Define valid demonstrative types at runtime
const VALID_DEMONSTRATIVE_TYPES = ["to", "summary", "defect"] as const;

/**
 * Sanitize a path for use in prompt variables
 * Ensures the path meets the PromptManager's validation rules:
 * - Only contains alphanumeric characters, forward slashes, hyphens, underscores, and dots
 * - No directory traversal (..)
 * - No absolute paths (starting with / or \)
 */
function sanitizePathForPrompt(path: string): string {
  // Get just the filename without directory
  const filename = basename(path);
  // Replace any invalid characters with underscores
  return filename.replace(/[^a-zA-Z0-9\-_\.]/g, "_");
}

/**
 * Process a file with a prompt
 */
export async function processWithPrompt(
  demonstrative: DemonstrativeType,
  layer: LayerType,
  fromFile: string,
  destFile: string,
  options: { quiet?: boolean } = {},
): Promise<void> {
  // Runtime type check using the constant array
  if (
    !VALID_DEMONSTRATIVE_TYPES.includes(demonstrative as typeof VALID_DEMONSTRATIVE_TYPES[number])
  ) {
    throw new Error(`Unsupported demonstrative type: ${demonstrative}`);
  }

  const config = getConfig();
  const workingDir = config.working_dir || ".";
  const baseDir = join(workingDir, "breakdown", "prompts");
  const logger = new BreakdownLogger();
  logger.debug(`Processing with prompt: ${demonstrative} ${layer} ${fromFile} ${destFile}`);

  // Ensure destination directory exists
  await ensureDir(dirname(destFile));

  const promptManager = new PromptManager(logger);

  // Use options.quiet when creating progress indicators
  const total = 100; // Set an appropriate total based on your processing steps
  const _progressBar = new ProgressBar(logger, total, 40, { quiet: options.quiet });
  const _spinner = new Spinner(logger, { quiet: options.quiet });

  // Read the input file content
  const inputContent = await Deno.readTextFile(fromFile);

  // Determine the fromLayerType based on the content
  const fromLayerType = inputContent.includes("Feature")
    ? "projects"
    : inputContent.includes("Issue")
    ? "issues"
    : inputContent.includes("Task")
    ? "tasks"
    : layer;

  // Sanitize file paths for prompt variables - use only filenames
  const sanitizedFromFile = sanitizePathForPrompt(fromFile);
  const sanitizedDestFile = destFile ? sanitizePathForPrompt(destFile) : "";

  // Load and process the prompt template using the loader
  const loadResult = await loadPrompt({
    demonstrativeType: demonstrative,
    layerType: layer,
    fromLayerType,
    variables: {
      input_markdown_file: sanitizedFromFile,
      input_markdown: inputContent,
      destination_path: sanitizedDestFile,
    },
  }, baseDir);

  if (!loadResult.success) {
    throw new Error("Failed to load prompt template");
  }

  logger.debug("Generating prompt with variables", {
    fromFile,
    sanitizedFromFile,
    destFile,
    sanitizedDestFile,
    workingDir,
  });

  // Create a temporary template file in the workspace's temp directory
  const tempTemplateDir = join(workingDir, "breakdown", "temp", "templates");
  await ensureDir(tempTemplateDir);
  const tempTemplatePath = join(tempTemplateDir, `template_${Date.now()}.md`);

  try {
    // Write the template content to the temporary file
    await Deno.writeTextFile(tempTemplatePath, loadResult.content);

    // Generate prompt using the temporary template file
    const result = await promptManager.generatePrompt(tempTemplatePath, {
      input_markdown_file: sanitizedFromFile,
      input_markdown: inputContent,
      destination_path: sanitizedDestFile,
    });

    if (!result.success) {
      throw new Error("Failed to generate prompt");
    }

    if (destFile) {
      // Create a temporary file in the same directory as destFile
      const tempDir = dirname(destFile);
      const tempFile = join(tempDir, basename(destFile));
      await ensureDir(tempDir);
      await Deno.writeTextFile(tempFile, result.prompt);
      // Move the file to its final destination
      await Deno.rename(tempFile, destFile);
    }

    // Process according to demonstrative type
    switch (demonstrative) {
      case "to": {
        if (layer === "issues") {
          logger.debug("Converting project to issues");

          // Resolve paths using the utility function
          const issuesDir = resolveLayerPath(fromFile, "issues" as LayerType, workingDir);
          const absoluteIssuesDir = join(workingDir, issuesDir);
          await ensureDir(dirname(absoluteIssuesDir));

          logger.debug("Path resolution", {
            fromFile,
            workingDir,
            issuesDir,
            absoluteIssuesDir,
          });

          const features = inputContent.match(/- Feature \d+/g);
          logger.debug("Found features", { features });

          if (features) {
            for (let i = 0; i < features.length; i++) {
              const issueContent = `# Feature ${i + 1}

Converted from project file: ${fromFile}

Feature: ${features[i].replace("- ", "")}
`;
              const issueFile = join(dirname(absoluteIssuesDir), `issue_${i + 1}.md`);
              logger.debug("Writing issue file", {
                issueFile,
                issueContent,
              });

              try {
                await Deno.writeTextFile(issueFile, issueContent);
                const writtenContent = await Deno.readTextFile(issueFile);
                logger.debug("Written content", { writtenContent });
              } catch (error) {
                logger.error("Error writing file", {
                  error: error instanceof Error ? error.message : String(error),
                });
                throw new Error(
                  `Failed to write issue file: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                );
              }
            }
          } else {
            throw new Error("No features found in the input file");
          }
        }
        break;
      }
      case "summary": {
        logger.debug("Generating summary");
        // Extract and display priority from input file
        logger.debug("Summary input content", { inputContent });
        const priorityMatch = inputContent.match(/Priority: \w+/);
        logger.debug("Found priority", { priorityMatch });
        if (priorityMatch) {
          logger.info(priorityMatch[0]);
        }
        break;
      }
      case "defect": {
        logger.debug("Analyzing defects");
        break;
      }
    }
  } finally {
    // Clean up the temporary template file
    try {
      await Deno.remove(tempTemplatePath);
    } catch (error) {
      logger.warn(`Failed to clean up temporary template file: ${error}`);
    }
  }
}
