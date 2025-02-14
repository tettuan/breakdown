import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { getConfig } from "../config/config.ts";

export async function loadPrompt(
  demonstrativeType: string,
  layerType: string,
  fromType?: string
): Promise<string> {
  const config = getConfig();
  const baseDir = config.app_prompt?.base_dir || "./breakdown/prompts/";
  
  const promptPath = fromType 
    ? join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`)
    : join(baseDir, demonstrativeType, layerType, "default.md");

  if (!await exists(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  const content = await Deno.readTextFile(promptPath);
  if (!content.trim()) {
    throw new Error(`Prompt file is empty: ${promptPath}`);
  }

  return content;
} 