import { exists, ensureDir, join } from "../deps.ts";
import * as path from "$std/path/mod.ts";

// Test directories
export const TEST_ASSETS_DIR = "./tests/fixtures";
export const TEST_DIR = ".agent_test/breakdown";

// Test file paths
export const TEST_INPUT_FILE = path.join(TEST_ASSETS_DIR, "input.md");
export const TEST_OUTPUT_FILE = path.join(TEST_ASSETS_DIR, "output.md");

// Test environment setup
export async function setupTestEnv(): Promise<void> {
  await setupTestDirs();
}

// Test directory setup
export async function setupTestDirs(): Promise<void> {
  await ensureDir(TEST_DIR);
  await ensureDir(path.join(TEST_DIR, "projects"));
  await ensureDir(path.join(TEST_DIR, "issues"));
  await ensureDir(path.join(TEST_DIR, "tasks"));
}

// Test cleanup
export async function cleanupTestFiles(): Promise<void> {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch (_error) {
    // Ignore errors if directory doesn't exist
  }
}

// Remove working directory
export async function removeWorkDir(): Promise<void> {
  try {
    await Deno.remove(".agent/breakdown", { recursive: true });
  } catch (_error) {
    // Ignore errors if directory doesn't exist
  }
}

// Command execution helper
export async function runCommand(cmd: string[]): Promise<{ output: string; error: string }> {
  const command = new Deno.Command(Deno.execPath(), {
    args: cmd,
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, stderr } = await command.output();
  
  return {
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr),
  };
}

// Helper function to ensure test directory structure
export async function setupTestEnvironment(): Promise<void> {
  checkpoint("Setting up test environment", "");
  
  // 環境変数の設定状態を確認
  const env = {
    DENO_DIR: Deno.env.get("DENO_DIR"),
    HOME: Deno.env.get("HOME"),
    PATH: Deno.env.get("PATH"),
    // ... existing code ...
  };
  checkpoint("Environment variables", env);
  
  // テストディレクトリの作成
  await ensureDir(TEST_DIR);
  await ensureDir(path.join(TEST_DIR, "projects"));
  await ensureDir(path.join(TEST_DIR, "issues"));
  await ensureDir(path.join(TEST_DIR, "tasks"));
  
  // ディレクトリ作成の確認
  const dirs = {
    testDir: await exists(TEST_DIR),
    projectsDir: await exists(path.join(TEST_DIR, "projects")),
    issuesDir: await exists(path.join(TEST_DIR, "issues")),
    tasksDir: await exists(path.join(TEST_DIR, "tasks")),
  };
  checkpoint("Test directories created", dirs);
  
  // 作業ディレクトリの作成
  await ensureDir(".agent/breakdown");
  checkpoint("Working directory created", await exists(".agent/breakdown"));
}

/**
 * テスト用のプロンプトファイルとスキーマファイルを作成する
 */
export async function setupTestPromptAndSchemaFiles(): Promise<void> {
  startSection("setupTestPromptAndSchemaFiles");
  
  // プロンプトファイルのディレクトリ構造を作成
  const promptDirs = [
    "breakdown/prompts/to/project",
    "breakdown/prompts/to/issue",
    "breakdown/prompts/to/task",
    "breakdown/prompts/summary/project",
    "breakdown/prompts/summary/issue",
    "breakdown/prompts/defect/project"
  ];
  
  // スキーマファイルのディレクトリ構造を作成
  const schemaDirs = [
    "breakdown/schemas/to/project",
    "breakdown/schemas/to/issue",
    "breakdown/schemas/to/task",
    "breakdown/schemas/summary/project",
    "breakdown/schemas/summary/issue",
    "breakdown/schemas/defect/project"
  ];
  
  // ディレクトリを作成
  for (const dir of [...promptDirs, ...schemaDirs]) {
    await ensureDir(dir);
    checkpoint(`Created directory: ${dir}`, "");
  }
  
  // プロンプトファイルを作成
  const promptFiles = [
    { path: "breakdown/prompts/to/project/default.md", content: "# Project Prompt\n{input_markdown}\n" },
    { path: "breakdown/prompts/to/issue/default.md", content: "# Issue Prompt\n{input_markdown}\n" },
    { path: "breakdown/prompts/to/task/default.md", content: "# Task Prompt\n{input_markdown}\n" },
    { path: "breakdown/prompts/to/project/f_issue.md", content: "# Project from Issue\n{input_markdown}\n" },
    { path: "breakdown/prompts/to/issue/f_project.md", content: "# Issue from Project\n{input_markdown}\n" },
    { path: "breakdown/prompts/to/task/f_issue.md", content: "# Task from Issue\n{input_markdown}\n" }
  ];
  
  // スキーマファイルを作成
  const schemaFiles = [
    { 
      path: "breakdown/schemas/to/project/default.json", 
      content: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      })
    },
    { 
      path: "breakdown/schemas/to/issue/default.json", 
      content: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      })
    },
    { 
      path: "breakdown/schemas/to/task/default.json", 
      content: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      })
    }
  ];
  
  // ファイルを作成
  for (const file of [...promptFiles, ...schemaFiles]) {
    try {
      await Deno.writeTextFile(file.path, file.content);
      checkpoint(`Created file: ${file.path}`, "");
    } catch (error) {
      checkpoint(`Error creating file: ${file.path}`, error);
    }
  }
  
  // 日本語ファイル名のプロンプトとスキーマも作成
  const japanesePromptFile = "breakdown/prompts/to/project/日本語.md";
  const japaneseSchemaFile = "breakdown/schemas/to/project/日本語.json";
  
  try {
    await Deno.writeTextFile(japanesePromptFile, "# 日本語プロンプト\n{input_markdown}\n");
    await Deno.writeTextFile(japaneseSchemaFile, JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" }
      },
      required: ["title", "description"]
    }));
    checkpoint(`Created Japanese files`, "");
  } catch (error) {
    checkpoint(`Error creating Japanese files`, error);
  }
  
  endSection("setupTestPromptAndSchemaFiles");
} 