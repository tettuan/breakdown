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
} from "../../deps.ts";
import { loadPrompt, replaceVariables } from "../../breakdown/prompts/loader.ts";
import { setConfig } from "../../breakdown/config/config.ts";
import { ensureDir } from "../../deps.ts";
import { Args } from "../../cli/args.ts";
import { PromptLoader } from "../../cli/prompts/loader.ts";

interface Prompt {
  path: string;
  content: string;
}

// テスト用のプロンプトファイルを作成
async function setupTestPrompts(): Promise<void> {
  // 既存のプロンプトファイル作成に加えて
  const issueDir = "./breakdown/prompts/to/issue";
  await ensureDir(issueDir);
  
  // project からの変換プロンプト
  await Deno.writeTextFile(
    `${issueDir}/f_project.md`,
    `プロジェクトからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`
  );

  // task からの変換プロンプト
  await Deno.writeTextFile(
    `${issueDir}/f_task.md`,
    `タスクからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`
  );

  // story からの変換プロンプト (issue のエイリアス)
  await Deno.writeTextFile(
    `${issueDir}/f_issue.md`,
    `ストーリーからIssueへの変換プロンプト\n\n# Input\n{input_markdown}\n\n# Source\n{input_markdown_file}\n\n# Schema\n{schema_file}\n\n# Output\n{destination_path}`
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

  await t.step("resolves prompt with --input option priority", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/tasks/error_report.md",  // task と推論される
      inputLayerType: "project"  // --input で指定された値が優先
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
  });

  await t.step("resolves prompt from file path when --input is not specified", async () => {
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/project/project_summary.md"  // project と推論
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
        inputLayerType: input
      };
      const loader = new PromptLoader();
      const prompt = await loader.load(args);
      assertEquals(prompt.path, `./breakdown/prompts/to/issue/f_${expected}.md`);
    }
  });

  await t.step("resolves prompt file with --input option", async () => {
    // プロジェクトからイシューへの変換プロンプト
    const args: Args = {
      command: "to",
      layerType: "issue",
      inputLayerType: "project"
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
  });

  await t.step("resolves prompt file with --input alias", async () => {
    // pj エイリアスを使用
    const args: Args = {
      command: "to",
      layerType: "issue",
      inputLayerType: "pj"
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
  });

  await t.step("resolves prompt file with --input overriding file path", async () => {
    // --input が --from より優先される
    const args: Args = {
      command: "to",
      layerType: "issue",
      fromFile: "./.agent/breakdown/tasks/error_report.md",  // task と推論される
      inputLayerType: "project"  // project が優先される
    };
    const loader = new PromptLoader();
    const prompt = await loader.load(args);
    assertEquals(prompt.path, "./breakdown/prompts/to/issue/f_project.md");
    assertStringIncludes(prompt.content, "プロジェクトからIssueへの変換プロンプト");
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
        inputLayerType: input
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
        fromFile: filePath
      };
      const loader = new PromptLoader();
      const prompt = await loader.load(args);
      assertEquals(prompt.path, expectedPath);
      assertStringIncludes(prompt.content, expectedContent);
    }
  });
}); 