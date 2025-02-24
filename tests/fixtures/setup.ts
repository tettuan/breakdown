import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";

const TEST_PROMPT_TEMPLATE = `# Input
{input_markdown}

# Source
{input_markdown_file}

# Schema
{schema_file}

# Output
{destination_path}`;

export async function setupPromptFixtures(): Promise<void> {
  const fixtureDir = "./tests/fixtures/prompts";

  // プロンプトディレクトリの作成
  const dirs = [
    "to/project",
    "to/issue",
    "to/task",
    "summary/project",
    "defect/project"
  ];

  for (const dir of dirs) {
    await ensureDir(join(fixtureDir, dir));
    await Deno.writeTextFile(
      join(fixtureDir, dir, "f_project.md"),
      TEST_PROMPT_TEMPLATE
    );
    // デフォルトプロンプトも作成
    await Deno.writeTextFile(
      join(fixtureDir, dir, "default.md"),
      TEST_PROMPT_TEMPLATE
    );
  }
} 