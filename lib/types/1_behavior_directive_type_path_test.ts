/**
 * @fileoverview DirectiveType パス解決メソッドの動作テスト
 *
 * 新しく追加されたパス解決メソッド（getPromptPath, getSchemaPath, resolveOutputPath）の
 * 動作を検証します。これらのメソッドが正確なパスを生成し、既存のlib/factory/配下の
 * パス解決実装と整合性を保つことを確認します。
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import type { TwoParams_Result } from "../deps.ts";

// テスト用のLayerType模擬オブジェクト
const createMockLayer = (value: string) => ({ value });

// テスト用のTwoParams_Result
const createTwoParamsResult = (directiveType: string, layerType: string): TwoParams_Result => ({
  type: "two" as const,
  params: [directiveType, layerType],
  directiveType,
  layerType,
  options: {},
});

Deno.test("1_behavior: getPromptPath generates correct basic file paths", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const path = directive.getPromptPath(layer);

  assertEquals(path, "prompts/to/project/f_project.md");
});

Deno.test("1_behavior: getPromptPath handles custom base directory", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("issue");

  const path = directive.getPromptPath(layer, "custom-prompts");

  assertEquals(path, "custom-prompts/summary/issue/f_issue.md");
});

Deno.test("1_behavior: getPromptPath handles fromLayerType parameter", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const path = directive.getPromptPath(layer, "prompts", "issue");

  assertEquals(path, "prompts/to/project/f_issue.md");
});

Deno.test("1_behavior: getPromptPath handles adaptation parameter", () => {
  const result = createTwoParamsResult("summary", "task");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("task");

  const path = directive.getPromptPath(layer, "prompts", "issue", "analysis");

  assertEquals(path, "prompts/summary/task/f_issue_analysis.md");
});

Deno.test("1_behavior: getPromptPath maintains consistency with factory patterns", () => {
  // lib/factory/prompt_template_path_resolver.ts のパターンと一致することを確認
  const testCases = [
    {
      directive: "to",
      layer: "project",
      fromLayerType: "project",
      expected: "prompts/to/project/f_project.md",
    },
    {
      directive: "defect",
      layer: "issue",
      fromLayerType: "task",
      adaptation: "bugs",
      expected: "prompts/defect/issue/f_task_bugs.md",
    },
    {
      directive: "summary",
      layer: "task",
      fromLayerType: "issue",
      expected: "prompts/summary/task/f_issue.md",
    },
  ];

  testCases.forEach(({ directive, layer, fromLayerType, adaptation, expected }) => {
    const result = createTwoParamsResult(directive, layer);
    const directiveType = DirectiveType.create(result);
    const layerType = createMockLayer(layer);

    const path = directiveType.getPromptPath(layerType, "prompts", fromLayerType, adaptation);
    assertEquals(path, expected, `Failed for ${directive}/${layer} case`);
  });
});

Deno.test("1_behavior: getSchemaPath generates correct schema file paths", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const path = directive.getSchemaPath(layer);

  assertEquals(path, "schema/to/project/base.schema.md");
});

Deno.test("1_behavior: getSchemaPath handles custom base directory", () => {
  const result = createTwoParamsResult("defect", "issue");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("issue");

  const path = directive.getSchemaPath(layer, "custom-schemas");

  assertEquals(path, "custom-schemas/defect/issue/base.schema.md");
});

Deno.test("1_behavior: getSchemaPath maintains consistency with factory patterns", () => {
  // lib/factory/schema_file_path_resolver.ts のパターンと一致することを確認
  const testCases = [
    { directive: "to", layer: "project", expected: "schema/to/project/base.schema.md" },
    { directive: "summary", layer: "issue", expected: "schema/summary/issue/base.schema.md" },
    { directive: "defect", layer: "task", expected: "schema/defect/task/base.schema.md" },
  ];

  testCases.forEach(({ directive, layer, expected }) => {
    const result = createTwoParamsResult(directive, layer);
    const directiveType = DirectiveType.create(result);
    const layerType = createMockLayer(layer);

    const path = directiveType.getSchemaPath(layerType);
    assertEquals(path, expected, `Failed for ${directive}/${layer} case`);
  });
});

Deno.test("1_behavior: resolveOutputPath handles auto-generation", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const path = directive.resolveOutputPath("", layer);

  // 自動生成されたパスの構造を確認
  assertStringIncludes(path, "output/to/project/");
  assertStringIncludes(path, ".md");

  // 日付形式（YYYYMMDD）が含まれることを確認
  const datePattern = /\d{8}/;
  const match = path.match(datePattern);
  assertEquals(match !== null, true, "Should contain date pattern YYYYMMDD");
});

Deno.test("1_behavior: resolveOutputPath handles manual file names", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("issue");

  const path = directive.resolveOutputPath("my-analysis.md", layer);

  assertEquals(path, "output/summary/issue/my-analysis.md");
});

Deno.test("1_behavior: resolveOutputPath handles file name without extension", () => {
  const result = createTwoParamsResult("defect", "task");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("task");

  const path = directive.resolveOutputPath("bug-report", layer);

  assertEquals(path, "output/defect/task/bug-report.md");
});

Deno.test("1_behavior: resolveOutputPath sanitizes dangerous characters", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const dangerousName = 'file<>:"|?*name.md';
  const path = directive.resolveOutputPath(dangerousName, layer);

  assertEquals(path, "output/to/project/file_______name.md");
});

Deno.test("1_behavior: resolveOutputPath works without layer parameter", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directive = DirectiveType.create(result);

  const path = directive.resolveOutputPath("standalone.md");

  assertEquals(path, "output/summary/standalone.md");
});

Deno.test("1_behavior: resolveOutputPath handles stdin indicator", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  const path = directive.resolveOutputPath("-", layer);

  // stdin指示（"-"）の場合は自動生成
  assertStringIncludes(path, "output/to/project/");
  assertStringIncludes(path, ".md");
});

Deno.test("1_behavior: resolveOutputPath maintains consistency with factory patterns", () => {
  // lib/factory/output_file_path_resolver.ts のロジックとの整合性確認
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  // 複数回の自動生成で異なるファイル名が生成されることを確認
  const path1 = directive.resolveOutputPath("", layer);
  const path2 = directive.resolveOutputPath("", layer);

  // パスの構造は同じだが、ファイル名（ハッシュ部分）は異なるはず
  const [dir1, file1] = path1.split("/").slice(-2);
  const [dir2, file2] = path2.split("/").slice(-2);

  assertEquals(dir1, dir2, "Directory structure should be same");
  assertEquals(file1 !== file2, true, "File names should be different");
});

Deno.test("1_behavior: Path methods are pure functions", () => {
  const result = createTwoParamsResult("to", "project");
  const directive = DirectiveType.create(result);
  const layer = createMockLayer("project");

  // 同じ入力に対して複数回呼び出しても結果が一貫していることを確認
  const promptPath1 = directive.getPromptPath(layer);
  const promptPath2 = directive.getPromptPath(layer);
  assertEquals(promptPath1, promptPath2);

  const schemaPath1 = directive.getSchemaPath(layer);
  const schemaPath2 = directive.getSchemaPath(layer);
  assertEquals(schemaPath1, schemaPath2);

  // resolveOutputPathは自動生成の場合、毎回異なる結果になることが正常
  const manualPath1 = directive.resolveOutputPath("test.md", layer);
  const manualPath2 = directive.resolveOutputPath("test.md", layer);
  assertEquals(manualPath1, manualPath2);
});

Deno.test("1_behavior: Path methods handle edge cases gracefully", () => {
  // 極端に短いDirectiveType/LayerType
  const shortResult = createTwoParamsResult("x", "y");
  const shortDirective = DirectiveType.create(shortResult);
  const shortLayer = createMockLayer("y");

  assertEquals(shortDirective.getPromptPath(shortLayer), "prompts/x/y/f_y.md");
  assertEquals(shortDirective.getSchemaPath(shortLayer), "schema/x/y/base.schema.md");

  // 特殊文字を含むDirectiveType/LayerType（ファイルシステム安全文字）
  const specialResult = createTwoParamsResult("to-from", "issue_task");
  const specialDirective = DirectiveType.create(specialResult);
  const specialLayer = createMockLayer("issue_task");

  const promptPath = specialDirective.getPromptPath(specialLayer);
  assertEquals(promptPath, "prompts/to-from/issue_task/f_issue_task.md");
});
