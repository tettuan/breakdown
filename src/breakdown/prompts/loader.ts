import { exists } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { getConfig } from "../config/config.ts";
import { Logger } from "@/utils/logger.ts";

export interface PromptVariables {
  input_markdown_file: string;
  input_markdown: string;
  destination_path: string;
  [key: string]: string;
}

function resolveSchemaPath(demonstrativeType: string, layerType: string): string {
  return `./rules/schema/${demonstrativeType}/${layerType}/base.schema.json`;
}

async function resolvePromptPath(baseDir: string, demonstrativeType: string, layerType: string, fromType?: string): Promise<string> {
  // 優先順位付きのパス候補を生成
  const pathCandidates = [
    // 1. テスト環境のパス
    join("./tests/fixtures/prompts", demonstrativeType, layerType, fromType ? `f_${fromType}.md` : "default.md"),
    // 2. 設定されたベースディレクトリのパス
    join(baseDir, demonstrativeType, layerType, fromType ? `f_${fromType}.md` : "default.md"),
  ];

  console.log("Prompt path candidates:", {
    paths: pathCandidates,
    baseDir,
    demonstrativeType,
    layerType,
    fromType
  });

  // 最初に見つかったパスを使用
  for (const path of pathCandidates) {
    if (await exists(path)) {
      console.log("Using prompt path:", path);
      return path;
    }
  }

  throw new Error(`Prompt file not found in any location: ${pathCandidates.join(", ")}`);
}

export async function loadPrompt(
  demonstrativeType: string,
  layerType: string,
  fromType: string,
  variables: PromptVariables
): Promise<string> {
  const config = getConfig();
  const configBaseDir = config.app_prompt?.base_dir || "./src/breakdown/prompts/";
  
  const pathCandidates = [
    join(configBaseDir, demonstrativeType, layerType, fromType ? `f_${fromType}.md` : "default.md"),
    join(".agent_test/breakdown/prompts", demonstrativeType, layerType, fromType ? `f_${fromType}.md` : "default.md")
  ];

  Logger.debug("Prompt path candidates:", pathCandidates);

  for (const path of pathCandidates) {
    if (await exists(path)) {
      Logger.debug("Using prompt path:", path);
      const template = await Deno.readTextFile(path);
      Logger.debug("Template content:", {
        path,
        content: template
      });
      return replaceVariables(template, {
        ...variables,
        schema_file: resolveSchemaPath(demonstrativeType, layerType)
      });
    }
  }

  throw new Error(`Prompt file not found in any location: ${pathCandidates.join(", ")}`);
}

export function replaceVariables(
  template: string, 
  variables: Record<string, string | undefined>
): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    const placeholder = `{${key}}`;
    return result.replace(placeholder, value || "");  // undefined の場合は空文字列
  }, template);
} 