#!/usr/bin/env -S deno run -A

import { exists, ensureDir, join, parse, crypto } from "../../deps.ts";
import { getConfig, initializeConfig, setConfig } from "$lib/config/config.ts";
import { parseArgs } from "./args.ts";
import { loadPrompt } from "$lib/prompts/loader.ts";
import { Config } from "../config/config.ts";

type DemonstrativeType = "to" | "summary" | "defect" | "init";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

function normalizePath(path: string): string {
  return path.startsWith("./") ? path : "./" + path;
}

function generateDefaultFilename(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const hash = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${dateStr}_${hash}.md`;
}

function autoCompletePath(filePath: string | undefined, demonstrative: string): string {
  if (!filePath) {
    filePath = generateDefaultFilename();
  }
  if (filePath.includes("/")) {
    return normalizePath(filePath);
  }
  const config = getConfig();
  const dirType = demonstrative === "to" ? "issue" : demonstrative;
  return normalizePath(join(config.working_dir, dirType + "s", filePath).replace(/\\/g, "/"));
}

function getPromptPath(
  demonstrativeType: string,
  layerType: string,
  fromFile: string
): string {
  const config = getConfig();
  const baseDir = config.app_prompt?.base_dir || "./breakdown/prompts/";
  const fromType = fromFile.includes("project") ? "project" :
                  fromFile.includes("issue") ? "issue" :
                  fromFile.includes("task") ? "task" : layerType;
  
  return normalizePath(join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`));
}

async function initWorkspace(): Promise<void> {
  const config = getConfig();
  try {
    const dirExists = await exists(config.working_dir);
    if (dirExists) {
      console.log(`Working directory already exists: ${config.working_dir}`);
    } else {
      await ensureDir(config.working_dir);
      console.log(`Created working directory: ${config.working_dir}`);
    }
  } catch (error) {
    console.error(`Failed to initialize workspace: ${error.message}`);
    Deno.exit(1);
  }
}

async function checkWorkingDir(): Promise<boolean> {
  const config = getConfig();
  return await exists(config.working_dir);
}

async function processWithPrompt(
  demonstrativeType: string,
  layerType: string,
  fromFile: string,
  destFile?: string
): Promise<void> {
  try {
    const config = getConfig();

    const fromType = fromFile.includes("project") ? "project" :
                    fromFile.includes("issue") ? "issue" :
                    fromFile.includes("task") ? "task" : layerType;
    
    // 入力ファイルの読み込み
    let inputMarkdown = "";
    try {
      inputMarkdown = await Deno.readTextFile(fromFile);
    } catch (error) {
      throw new Error(`Failed to read input file: ${fromFile} - ${error.message}`);
    }

    const variables = {
      input_markdown_file: fromFile,
      input_markdown: inputMarkdown,
      destination_path: destFile || "",
    };

    const prompt = await loadPrompt(demonstrativeType, layerType, fromType, variables);
    console.log(prompt);
  } catch (error) {
    console.error(`Error processing prompt: ${error.message}`);
    Deno.exit(1);
  }
}

export async function runBreakdown(args: string[]): Promise<void> {
  // This function will be replaced with @tettuan/breakdownparams
  throw new Error("Not implemented: Use @tettuan/breakdownparams instead");
}

// メイン処理
if (import.meta.main) {
  runBreakdown(Deno.args);
}

const process = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "cli/breakdown.ts", "to"],
  stdout: "piped",
}); 