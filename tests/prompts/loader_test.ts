/// <reference lib="deno.ns" />

import { 
  assertEquals, 
  assertRejects,
  assertStringIncludes 
} from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { loadPrompt, replaceVariables } from "../../breakdown/prompts/loader.ts";
import { setConfig } from "../../breakdown/config/config.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";

// テスト用のプロンプトファイルを作成
async function setupTestPrompts(): Promise<void> {
  // issue用のプロンプトファイル作成
  const issueDir = "./breakdown/prompts/to/issue";
  await ensureDir(issueDir);
  await Deno.writeTextFile(
    `${issueDir}/f_project.md`,
    `プロジェクトからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`
  );

  // task用のプロンプトファイル作成
  const taskDir = "./breakdown/prompts/to/task";
  await ensureDir(taskDir);
  await Deno.writeTextFile(
    `${taskDir}/f_project.md`,
    `プロジェクトからTaskへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`
  );
}

Deno.test("Prompt Loader", async (t) => {
  await setupTestPrompts();
  setConfig({
    working_dir: "./.agent_test/breakdown",
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    }
  });

  await t.step("loads raw prompt template", async () => {
    // プロンプトテンプレートの読み込みのみをテスト
    const promptPath = "./breakdown/prompts/to/issue/f_project.md";
    const content = await Deno.readTextFile(promptPath);
    const expected = `プロジェクトからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`;
    assertEquals(content, expected);
  });

  await t.step("loads from-type specific prompt with schema resolution", async () => {
    const prompt = await loadPrompt("to", "issue", "project");
    const expected = `プロジェクトからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n./rules/schema/to/issue/base.schema.json\n\n# Output\n{destination_path}`;
    assertEquals(prompt, expected);
  });

  await t.step("loads default prompt", async () => {
    const prompt = await loadPrompt("to", "issue");
    assertEquals(typeof prompt, "string");
    assertEquals(prompt.length > 0, true);
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

  await t.step("replaces schema file variable in prompt", async () => {
    const prompt = "Test prompt with {schema_file}";
    const variables = {
      schema_file: "./rules/schema/to/task/base.schema.json",
    };
    
    const result = await replaceVariables(prompt, variables);
    assertEquals(result, "Test prompt with ./rules/schema/to/task/base.schema.json");
  });

  await t.step("resolves correct schema path based on demonstrative and layer type", async () => {
    const demonstrativeType = "to";
    const layerType = "task";
    const variables = {};
    
    const result = await loadPrompt(demonstrativeType, layerType, "project", variables);
    assertStringIncludes(result, "./rules/schema/to/task/base.schema.json");
  });
}); 