/**
 * Unit Test for Template Validator
 *
 * このテストは、TemplateValidatorモジュールの機能を検証します。
 * 各メソッドの動作、エッジケース、エラーハンドリングを確認します。
 */

import { assertEquals, assertExists as _assertExists } from "../deps.ts";
import { join } from "@std/path";
import {
  DEFAULT_TEMPLATE_MAPPINGS,
  TemplateMapping,
  TemplateValidation_Result as _TemplateValidation_Result,
  TemplateValidator,
  validateTemplatesForExamples,
} from "./template_validator.ts";

// テスト用の一時ディレクトリを作成
async function createTestDirectory(): Promise<string> {
  const _tempDir = await Deno.makeTempDir();
  return _tempDir;
}

// テスト用のテンプレートファイルを作成
async function createTestTemplate(dir: string, path: string, content: string): Promise<void> {
  const fullPath = join(dir, path);
  const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await Deno.mkdir(dirPath, { recursive: true });
  await Deno.writeTextFile(fullPath, content);
}

Deno.test("Unit: TemplateValidator validates existing templates correctly", async () => {
  const testDir = await createTestDirectory();

  try {
    // テスト用のマッピング
    const mappings: TemplateMapping[] = [
      {
        source: "src/template1.md",
        destination: "dest/template1.md",
        required: true,
      },
      {
        source: "src/template2.md",
        destination: "dest/template2.md",
        required: true,
      },
      {
        source: "src/optional.md",
        destination: "dest/optional.md",
        required: false,
      },
    ];

    // 必要なテンプレートを作成
    await createTestTemplate(testDir, "dest/template1.md", "Template 1 content");
    await createTestTemplate(testDir, "dest/template2.md", "Template 2 content");

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.validateTemplates();

    // すべての必須テンプレートが存在する場合
    assertEquals(result.isValid, true);
    assertEquals(result.missingTemplates.length, 0);
    assertEquals(result.existingTemplates.length, 2);
    assertEquals(result.totalRequired, 2);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator detects missing templates", async () => {
  const testDir = await createTestDirectory();

  try {
    const mappings: TemplateMapping[] = [
      {
        source: "src/template1.md",
        destination: "dest/template1.md",
        required: true,
      },
      {
        source: "src/template2.md",
        destination: "dest/template2.md",
        required: true,
      },
    ];

    // 1つだけテンプレートを作成
    await createTestTemplate(testDir, "dest/template1.md", "Template 1 content");

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.validateTemplates();

    // 不足テンプレートが検出される
    assertEquals(result.isValid, false);
    assertEquals(result.missingTemplates.length, 1);
    assertEquals(result.missingTemplates[0], "dest/template2.md");
    assertEquals(result.existingTemplates.length, 1);
    assertEquals(result.totalRequired, 2);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator generates missing templates", async () => {
  const testDir = await createTestDirectory();

  try {
    const mappings: TemplateMapping[] = [
      {
        source: "src/template1.md",
        destination: "dest/template1.md",
        required: true,
      },
      {
        source: "src/template2.md",
        destination: "dest/template2.md",
        required: true,
      },
    ];

    // ソーステンプレートを作成
    await createTestTemplate(testDir, "src/template1.md", "Source template 1");
    await createTestTemplate(testDir, "src/template2.md", "Source template 2");

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.generateMissingTemplates();

    // テンプレートが正常に生成される
    assertEquals(result.generated.length, 2);
    assertEquals(result.failed.length, 0);

    // 生成されたファイルの内容を確認
    const content1 = await Deno.readTextFile(join(testDir, "dest/template1.md"));
    assertEquals(content1, "Source template 1");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator handles source template not found", async () => {
  const testDir = await createTestDirectory();

  try {
    const mappings: TemplateMapping[] = [
      {
        source: "src/nonexistent.md",
        destination: "dest/template.md",
        required: true,
      },
    ];

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.generateMissingTemplates();

    // ソースが見つからない場合のエラー処理
    assertEquals(result.generated.length, 0);
    assertEquals(result.failed.length, 1);
    assertEquals(result.failed[0].template, "dest/template.md");
    assertEquals(result.failed[0].error.includes("Source template not found"), true);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator skips already existing destination templates", async () => {
  const testDir = await createTestDirectory();

  try {
    const mappings: TemplateMapping[] = [
      {
        source: "src/template.md",
        destination: "dest/template.md",
        required: true,
      },
    ];

    // ソースと宛先の両方を作成
    await createTestTemplate(testDir, "src/template.md", "Source content");
    await createTestTemplate(testDir, "dest/template.md", "Existing content");

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.generateMissingTemplates();

    // 既存のファイルはスキップされる
    assertEquals(result.generated.length, 0);
    assertEquals(result.failed.length, 0);

    // 既存のファイルは上書きされない
    const content = await Deno.readTextFile(join(testDir, "dest/template.md"));
    assertEquals(content, "Existing content");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator preflight check detects all issues", async () => {
  const testDir = await createTestDirectory();

  try {
    // 最小限の構造のみ作成
    const _validator = new TemplateValidator(testDir, DEFAULT_TEMPLATE_MAPPINGS);
    const result = await _validator.preflightCheck();

    // 問題が検出される
    assertEquals(result.ready, false);
    assertEquals(result.issues.length > 0, true);
    assertEquals(result.recommendations.length > 0, true);

    // 推奨事項が含まれる
    const hasTemplateGenRecommendation = result.recommendations.some((r) =>
      r.includes("bash scripts/template_generator.sh generate")
    );
    assertEquals(hasTemplateGenRecommendation, true);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: TemplateValidator preflight check passes with complete setup", async () => {
  const testDir = await createTestDirectory();

  try {
    // 完全な構造を作成
    await Deno.mkdir(join(testDir, "examples"), { recursive: true });
    await Deno.mkdir(join(testDir, "examples/.agent/breakdown/config"), { recursive: true });

    // 簡単なマッピングでテスト
    const mappings: TemplateMapping[] = [
      {
        source: "src/template.md",
        destination: "dest/template.md",
        required: true,
      },
    ];

    await createTestTemplate(testDir, "dest/template.md", "Template content");

    const _validator = new TemplateValidator(testDir, mappings);
    const result = await _validator.preflightCheck();

    // すべてのチェックをパス
    assertEquals(result.ready, true);
    assertEquals(result.issues.length, 0);
    assertEquals(result.recommendations.length, 0);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Unit: DEFAULT_TEMPLATE_MAPPINGS contains expected templates", () => {
  // デフォルトマッピングに期待されるテンプレートが含まれる
  const expectedPatterns = [
    "summary/issue",
    "summary/project",
    "defect/issue",
    "dev/defect/issue",
    "find/bugs",
    "prod/defect/issue",
    "production/defect/issue",
    "staging/defect/issue",
    "team/to/task",
  ];

  for (const pattern of expectedPatterns) {
    const hasPattern = DEFAULT_TEMPLATE_MAPPINGS.some((m) =>
      m.source.includes(pattern) && m.destination.includes(pattern)
    );
    assertEquals(hasPattern, true, `Pattern ${pattern} should exist in DEFAULT_TEMPLATE_MAPPINGS`);
  }
});

Deno.test("Unit: validateTemplatesForExamples provides CLI-friendly output", async () => {
  // validateTemplatesForExamplesはコンソール出力を生成する
  // このテストではエラーが発生しないことを確認
  const testDir = await createTestDirectory();

  try {
    // examples構造を作成
    await Deno.mkdir(join(testDir, "examples"), { recursive: true });

    // 関数が正常に実行されることを確認
    await validateTemplatesForExamples(testDir);

    // エラーなく完了
    assertEquals(true, true);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});
