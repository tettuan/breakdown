import { DemonstrativeType, LayerType } from "../types/mod.ts";
import { join } from "jsr:@std/path@^0.224.0/join";
import { exists } from "@std/fs";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";

interface LoadPromptParams {
  demonstrativeType: DemonstrativeType;
  layerType: LayerType;
  fromLayerType: LayerType;
  variables: Record<string, string>;
}

interface LoadPromptResult {
  content: string;
  success: boolean;
}

/**
 * Load a prompt file and replace variables
 * @param params Parameters for loading the prompt
 * @param baseDir Base directory for prompts
 * @returns The loaded prompt content with variables replaced
 */
export async function loadPrompt(
  params: LoadPromptParams,
  baseDir: string,
): Promise<LoadPromptResult> {
  const logger = new BreakdownLogger();

  // First try to load from the workspace prompts directory
  const workspacePromptPath = join(
    baseDir,
    params.demonstrativeType,
    params.layerType,
    `f_${params.fromLayerType}.md`,
  );

  logger.debug("Attempting to load prompt", {
    workspacePromptPath,
    baseDir,
    params,
  });

  const promptPath = workspacePromptPath;
  const promptExists = await exists(workspacePromptPath);

  logger.debug("Prompt file existence check", {
    path: workspacePromptPath,
    exists: promptExists,
  });

  if (!promptExists) {
    throw new Error(`Prompt loading failed: Prompt file not found at ${workspacePromptPath}`);
  }

  logger.debug("Reading prompt file", { promptPath });
  const content = await Deno.readTextFile(promptPath);
  let processedContent = content;

  // Replace variables in the content
  for (const [key, value] of Object.entries(params.variables)) {
    processedContent = processedContent.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  logger.debug("Successfully loaded and processed prompt", {
    originalLength: content.length,
    processedLength: processedContent.length,
  });

  return {
    content: processedContent,
    success: true,
  };
}
