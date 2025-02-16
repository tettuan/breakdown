import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { loadPrompt } from "../../breakdown/prompts/loader.ts";
import { setConfig } from "../../breakdown/config/config.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";

// テスト用のプロンプトファイルを作成
async function setupTestPrompts(): Promise<void> {
  const baseDir = "./breakdown/prompts/to/issue";
  await ensureDir(baseDir);
  await Deno.writeTextFile(
    `${baseDir}/f_project.md`,
    `プロジェクトからIssueへの変換プロンプト

# Input
{input_markdown}

# Source
{input_markdown_file}

# Output
{destination_path}`
  );
}

Deno.test("Prompt Loader", async (t) => {
  await setupTestPrompts();  // テスト前にプロンプトファイルを準備
  // テスト用の設定を初期化
  setConfig({
    working_dir: "./.agent_test/breakdown",
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    }
  });

  await t.step("loads default prompt", async () => {
    const prompt = await loadPrompt("to", "issue");
    assertEquals(typeof prompt, "string");
    assertEquals(prompt.length > 0, true);
  });

  await t.step("loads from-type specific prompt", async () => {
    const prompt = await loadPrompt("to", "issue", "project");
    assertEquals(prompt, `プロジェクトからIssueへの変換プロンプト

# Input
{input_markdown}

# Source
{input_markdown_file}

# Output
{destination_path}`);
  });

  await t.step("throws error for non-existent prompt", async () => {
    await assertRejects(
      () => loadPrompt("invalid", "type"),
      Error,
      "Prompt file not found"
    );
  });

  await t.step("replaces template variables in prompt", async () => {
    const variables = {
      input_markdown_file: "test.md",
      input_markdown: "# Test Content",
      destination_path: "./output/",
    };
    
    const prompt = await loadPrompt("to", "issue", "project", variables);
    assertEquals(prompt.includes("test.md"), true);
    assertEquals(prompt.includes("# Test Content"), true);
    assertEquals(prompt.includes("./output/"), true);
  });
}); 