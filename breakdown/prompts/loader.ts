import { exists } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { getConfig } from "../config/config.ts";

interface PromptVariables {
  input_markdown_file?: string;
  input_markdown?: string;
  destination_path?: string;
  schema_file?: string;
}

function resolveSchemaPath(demonstrativeType: string, layerType: string): string {
  return `./rules/schema/${demonstrativeType}/${layerType}/base.schema.json`;
}

async function resolvePromptPath(baseDir: string, demonstrativeType: string, layerType: string, fromType?: string): Promise<string> {
  const promptPath = fromType 
    ? join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`)
    : join(baseDir, demonstrativeType, layerType, "default.md");

  if (!await exists(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  return promptPath;
}

export async function loadPrompt(
  demonstrativeType: string,
  layerType: string,
  fromType?: string,
  variables?: PromptVariables
): Promise<string> {
  const config = getConfig();
  const baseDir = config.app_prompt?.base_dir || "./breakdown/prompts/";
  
  const schemaPath = resolveSchemaPath(demonstrativeType, layerType);
  const promptPath = await resolvePromptPath(baseDir, demonstrativeType, layerType, fromType);
  
  const allVariables = {
    ...variables,
    schema_file: schemaPath
  };

  const content = await Deno.readTextFile(promptPath);
  if (!content.trim()) {
    throw new Error(`Prompt file is empty: ${promptPath}`);
  }

  return replaceVariables(content, allVariables);
}

export function replaceVariables(content: string, variables: PromptVariables): string {
  const replacements: Record<string, string | undefined> = {
    "{input_markdown_file}": variables.input_markdown_file,
    "{input_markdown}": variables.input_markdown,
    "{destination_path}": variables.destination_path,
    "{schema_file}": variables.schema_file,
  };

  return Object.entries(replacements).reduce((text, [key, value]) => {
    if (value !== undefined) {
      return text.replace(new RegExp(key, "g"), value);
    }
    return text;
  }, content);
} 