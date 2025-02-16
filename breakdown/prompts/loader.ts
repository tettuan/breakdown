import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { getConfig } from "../config/config.ts";

interface PromptVariables {
  input_markdown_file?: string;
  input_markdown?: string;
  destination_path?: string;
}

export async function loadPrompt(
  demonstrativeType: string,
  layerType: string,
  fromType?: string,
  variables?: PromptVariables
): Promise<string> {
  const config = getConfig();
  const baseDir = config.app_prompt?.base_dir || "./breakdown/prompts/";
  
  const promptPath = fromType 
    ? join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`)
    : join(baseDir, demonstrativeType, layerType, "default.md");

  if (!await exists(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  let content = await Deno.readTextFile(promptPath);
  if (!content.trim()) {
    throw new Error(`Prompt file is empty: ${promptPath}`);
  }

  // 変数置換処理
  if (variables) {
    content = replaceVariables(content, variables);
  }

  return content;
}

function replaceVariables(content: string, variables: PromptVariables): string {
  const replacements: Record<string, string | undefined> = {
    "{input_markdown_file}": variables.input_markdown_file,
    "{input_markdown}": variables.input_markdown,
    "{destination_path}": variables.destination_path,
  };

  return Object.entries(replacements).reduce((text, [key, value]) => {
    if (value !== undefined) {
      return text.replace(new RegExp(key, "g"), value);
    }
    return text;
  }, content);
} 