/// <reference lib="deno.ns" />

/**
 * プロンプトローダーのテスト
 * 
 * 目的:
 * - --input オプションによるプロンプト選択の検証
 * - ファイルパスからのレイヤータイプ推論の検証
 * - プロンプト選択の優先順位の検証
 * 
 * 関連する仕様:
 * - docs/breakdown/options.ja.md: --input オプションの仕様
 * - docs/breakdown/app_prompt.ja.md: プロンプト選択の仕様
 * 
 * 実装の考慮点:
 * 1. プロンプト選択の優先順位
 *    - --input オプションが最優先
 *    - ファイルパスからの推論が次点
 *    - デフォルトプロンプトが最後
 * 
 * 2. レイヤータイプのエイリアス
 *    - project: pj, prj
 *    - issue: story
 *    - task: todo, bug, etc
 * 
 * 3. ファイルパスからの推論
 *    - ディレクトリ名とファイル名の両方を考慮
 *    - 複数マッチ時は最初に見つかったものを優先
 * 
 * 関連コミット:
 * - feat: add --input option (24671fe)
 * - test: add prompt file selection tests
 */

import { 
  assertEquals, 
  assertRejects,
  assertStringIncludes 
} from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { loadPrompt, replaceVariables } from "@/breakdown/prompts/loader.ts";
import { setConfig } from "@/breakdown/config/config.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { Args } from "@/cli/types.ts";
import { PromptLoader } from "@/cli/prompts/loader.ts";
import { PromptVariables } from "@/breakdown/prompts/loader.ts";

interface Prompt {
  path: string;
  content: string;
}

// テスト用のプロンプトファイルを作成
async function setupTestPrompts(): Promise<void> {
  await ensureDir("./breakdown/prompts/to/project");
  await ensureDir("./breakdown/prompts/to/issue");
  
  await Deno.writeTextFile(
    "./breakdown/prompts/to/project/f_default.md",
    [
      "Default project prompt template",
      "",
      "# Schema",
      "{schema_file}"
    ].join("\n")
  );
  
  await Deno.writeTextFile(
    "./breakdown/prompts/to/issue/f_default.md",
    "Default issue prompt template"
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

  const EXPECTED_PROMPT = `# Input
{input_markdown}

# Source
{input_markdown_file}

# Schema
./rules/schema/to/project/base.schema.json

# Output
{destination_path}`;

  await t.step("loads from-type specific prompt with schema resolution", async () => {
    const variables: PromptVariables = {
      input_markdown_file: "",
      input_markdown: "",
      destination_path: ""
    };
    
    const prompt = await loadPrompt("to", "project", "default", variables);
    const expected = [
      "Default project prompt template",
      "",
      "# Schema",
      "./rules/schema/to/project/base.schema.json"
    ].join("\n");
    assertEquals(prompt, expected);
  });

  await t.step("loads default prompt", async () => {
    const variables: PromptVariables = {
      input_markdown_file: "",
      input_markdown: "",
      destination_path: ""
    };
    
    const prompt = await loadPrompt("to", "issue", "default", variables);
    assertEquals(typeof prompt, "string");
    assertEquals(prompt.length > 0, true);
  });

  await t.step("throws error for non-existent prompt", async () => {
    await assertRejects(
      () => loadPrompt("invalid", "type", "default", {
        input_markdown_file: "",
        input_markdown: "",
        destination_path: ""
      }),
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
    const variables: PromptVariables = {
      input_markdown_file: "",
      input_markdown: "",
      destination_path: ""
    };
    
    const result = await loadPrompt(demonstrativeType, layerType, "project", variables);
    assertStringIncludes(result, "./rules/schema/to/task/base.schema.json");
  });

  await t.step("resolves prompt with --input option priority", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/tasks/error_report.md",
      inputLayerType: "project",
      _: ["to", "issue", "--from", "./.agent/breakdown/tasks/error_report.md", "-i", "project"]
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
  });

  await t.step("resolves prompt from file path when --input is not specified", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/project/project_summary.md",
      _: ["to", "issue", "--from", "./.agent/breakdown/project/project_summary.md"]
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
  });

  await t.step("resolves prompt with layer type aliases", async () => {
    const testCases = [
      { input: "pj", expected: "project" },
      { input: "story", expected: "issue" },
      { input: "bug", expected: "task" }
    ];

    for (const { input, expected } of testCases) {
      const args: Args = {
        command: "to",
        layerType: "issue",
        inputLayerType: input,
        _: ["to", "issue", "-i", input]
      };
      const loader = new PromptLoader();
      const prompt = await loader.load(args);
      assertEquals(prompt.path, `./breakdown/prompts/to/issue/f_${expected}.md`);
    }
  });

  await t.step("resolves prompt file with --input option", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      inputLayerType: "project",
      _: ["to", "issue", "-i", "project"]
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
  });

  await t.step("resolves prompt file with --input alias", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      inputLayerType: "pj",
      _: ["to", "issue", "-i", "pj"]
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
  });

  await t.step("resolves prompt file with --input overriding file path", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/tasks/error_report.md",
      inputLayerType: "project",
      _: ["to", "issue", "--from", "./.agent/breakdown/tasks/error_report.md", "-i", "project"]
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
  });

  await t.step("should load prompt with input layer type", () => {
    const args: Args = {
      command: "to",
      layerType: "task",
      inputLayerType: "issue",
      _: ["to", "task", "-i", "issue"]
    };
    // ...テストの続き
  });

  await t.step("should load prompt with file path inference", () => {
    const args: Args = {
      command: "to",
      layerType: "task",
      fromFile: "project/issue-123.md",
      _: ["to", "task", "--from", "project/issue-123.md"]
    };
    // ...テストの続き
  });

  await t.step("should handle missing input", () => {
    const args: Args = {
      command: "to",
      layerType: "task",
      _: ["to", "task"]  // 最小限の引数
    };
    // ...テストの続き
  });
});

Deno.test("Prompt File Selection", async (t) => {
  await setupTestPrompts();

  await t.step("selects different prompts based on --input value", async () => {
    const testCases = [
      {
        input: "project",
        expectedPath: "./breakdown/prompts/to/issue/f_project.md",
        expectedContent: "プロジェクトからIssueへの変換プロンプト"
      },
      {
        input: "task",
        expectedPath: "./breakdown/prompts/to/issue/f_task.md",
        expectedContent: "タスクからIssueへの変換プロンプト"
      },
      {
        input: "story",  // issue のエイリアス
        expectedPath: "./breakdown/prompts/to/issue/f_issue.md",
        expectedContent: "ストーリーからIssueへの変換プロンプト"
      }
    ];

    for (const { input, expectedPath, expectedContent } of testCases) {
      const args: Args = {
        command: "to",
        layerType: "issue",
        inputLayerType: input,
        _: ["to", "issue", "-i", input]
      };
      const loader = new PromptLoader();
      const prompt = await loader.load(args);
      assertEquals(prompt.path, expectedPath);
      assertStringIncludes(prompt.content, expectedContent);
    }
  });

  await t.step("selects different prompts based on file path inference", async () => {
    const testCases = [
      {
        filePath: "./.agent/breakdown/project/project_summary.md",
        expectedPath: "./breakdown/prompts/to/issue/f_project.md",
        expectedContent: "プロジェクトからIssueへの変換プロンプト"
      },
      {
        filePath: "./.agent/breakdown/tasks/task_list.md",
        expectedPath: "./breakdown/prompts/to/issue/f_task.md",
        expectedContent: "タスクからIssueへの変換プロンプト"
      },
      {
        filePath: "./.agent/breakdown/stories/story_123.md",
        expectedPath: "./breakdown/prompts/to/issue/f_issue.md",
        expectedContent: "ストーリーからIssueへの変換プロンプト"
      }
    ];

    for (const { filePath, expectedPath, expectedContent } of testCases) {
      const args: Args = {
        command: "to",
        layerType: "issue",
        fromFile: filePath,
        _: ["to", "issue", "--from", filePath]
      };
      const loader = new PromptLoader();
      const prompt = await loader.load(args);
      assertEquals(prompt.path, expectedPath);
      assertStringIncludes(prompt.content, expectedContent);
    }
  });
}); 