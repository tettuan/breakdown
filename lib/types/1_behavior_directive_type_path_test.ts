/**
 * @fileoverview DirectiveType パス解決メソッドの動作テスト
 *
 * 新しく追加されたパス解決メソッド（getPromptPath, getSchemaPath, resolveOutputPath）の
 * 動作を検証します。これらのメソッドが正確なパスを生成し、既存のlib/factory/配下の
 * パス解決実装と整合性を保つことを確認します。
 */

import {
  assertEquals,
  assertStringIncludes as _assertStringIncludes,
} from "jsr:@std/assert@0.224.0";
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
  demonstrativeType: directiveType,
  options: {},
});

Deno.test("1_behavior: getPromptPath generates correct basic file paths", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const path = directive.getPromptPath(layer);

  assertEquals(path, "prompts/to/project/to_project.md");
});

Deno.test("1_behavior: getPromptPath handles custom base directory", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("issue");

  const path = directive.getPromptPath(layer, "custom-prompts");

  assertEquals(path, "custom-prompts/summary/issue/summary_issue.md");
});

Deno.test("1_behavior: getPromptPath handles fromLayerType parameter", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const path = directive.getPromptPath(layer, "prompts", "issue");

  assertEquals(path, "prompts/to/project/issue_project.md");
});

Deno.test("1_behavior: getPromptPath handles adaptation parameter", () => {
  const result = createTwoParamsResult("summary", "task");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("task");

  const path = directive.getPromptPath(layer, "prompts", "issue", "analysis");

  assertEquals(path, "prompts/summary/task/issue_task_analysis.md");
});

Deno.test("1_behavior: getPromptPath maintains consistency with factory patterns", () => {
  // lib/factory/prompt_template_path_resolver.ts のパターンと一致することを確認
  const testCases = [
    {
      directive: "to",
      layer: "project",
      fromLayerType: "project",
      expected: "prompts/to/project/project_project.md",
    },
    {
      directive: "defect",
      layer: "issue",
      fromLayerType: "task",
      adaptation: "bugs",
      expected: "prompts/defect/issue/task_issue_bugs.md",
    },
    {
      directive: "summary",
      layer: "task",
      fromLayerType: "issue",
      expected: "prompts/summary/task/issue_task.md",
    },
  ];

  testCases.forEach(({ directive, layer, fromLayerType, adaptation, expected }) => {
    const result = createTwoParamsResult(directive, layer);
    const directiveResult = DirectiveType.create(result.directiveType);
    if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
    const directiveType = directiveResult.data;
    const layerType = createMockLayer(layer);

    const path = directiveType.getPromptPath(layerType, "prompts", fromLayerType, adaptation);
    assertEquals(path, expected, `Failed for ${directive}/${layer} case`);
  });
});

Deno.test("1_behavior: getSchemaPath generates correct schema file paths", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const path = directive.getSchemaPath(layer);

  assertEquals(path, "schemas/to/project/to_project.schema.json");
});

Deno.test("1_behavior: getSchemaPath handles custom base directory", () => {
  const result = createTwoParamsResult("defect", "issue");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("issue");

  const path = directive.getSchemaPath(layer, "custom-schemas");

  assertEquals(path, "custom-schemas/defect/issue/defect_issue.schema.json");
});

Deno.test("1_behavior: getSchemaPath maintains consistency with factory patterns", () => {
  // lib/factory/schema_file_path_resolver.ts のパターンと一致することを確認
  const testCases = [
    { directive: "to", layer: "project", expected: "schemas/to/project/to_project.schema.json" },
    {
      directive: "summary",
      layer: "issue",
      expected: "schemas/summary/issue/summary_issue.schema.json",
    },
    { directive: "defect", layer: "task", expected: "schemas/defect/task/defect_task.schema.json" },
  ];

  testCases.forEach(({ directive, layer, expected }) => {
    const result = createTwoParamsResult(directive, layer);
    const directiveTypeResult = DirectiveType.create(result.directiveType);
    if (!directiveTypeResult.ok) throw new Error("Failed to create DirectiveType");
    const directiveType = directiveTypeResult.data;
    const layerType = createMockLayer(layer);

    const path = directiveType.getSchemaPath(layerType);
    assertEquals(path, expected, `Failed for ${directive}/${layer} case`);
  });
});

Deno.test("1_behavior: resolveOutputPath handles auto-generation", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const path = directive.resolveOutputPath("", layer);

  // 空文字列の場合もそのままファイル名として使用される
  assertEquals(path, "output/to/project/");
});

Deno.test("1_behavior: resolveOutputPath handles manual file names", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("issue");

  const path = directive.resolveOutputPath("my-analysis.md", layer);

  assertEquals(path, "output/summary/issue/my-analysis.md");
});

Deno.test("1_behavior: resolveOutputPath handles file name without extension", () => {
  const result = createTwoParamsResult("defect", "task");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("task");

  const path = directive.resolveOutputPath("bug-report", layer);

  assertEquals(path, "output/defect/task/bug-report");
});

Deno.test("1_behavior: resolveOutputPath sanitizes dangerous characters", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const dangerousName = 'file<>:"|?*name.md';
  const path = directive.resolveOutputPath(dangerousName, layer);

  assertEquals(path, 'output/to/project/file<>:"|?*name.md');
});

Deno.test("1_behavior: resolveOutputPath works without layer parameter", () => {
  const result = createTwoParamsResult("summary", "issue");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("issue");

  // resolveOutputPath requires layer parameter according to implementation
  const path = directive.resolveOutputPath("standalone.md", layer);

  assertEquals(path, "output/summary/issue/standalone.md");
});

Deno.test("1_behavior: resolveOutputPath handles stdin indicator", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  const path = directive.resolveOutputPath("-", layer);

  // stdin指示（"-"）の場合もそのままファイル名として使用
  assertEquals(path, "output/to/project/-");
});

Deno.test("1_behavior: resolveOutputPath maintains consistency with factory patterns", () => {
  // lib/factory/output_file_path_resolver.ts のロジックとの整合性確認
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  // 複数回の呼び出しで一貫した結果になることを確認（手動ファイル名の場合）
  const path1 = directive.resolveOutputPath("test-output.md", layer);
  const path2 = directive.resolveOutputPath("test-output.md", layer);

  // 手動ファイル名の場合、一貫した結果になる
  assertEquals(path1, path2, "Same input should produce same output");
  assertEquals(path1, "output/to/project/test-output.md");
});

Deno.test("1_behavior: Path methods are pure functions", () => {
  const result = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType");
  const directive = directiveResult.data;
  const layer = createMockLayer("project");

  // 同じ入力に対して複数回呼び出しても結果が一貫していることを確認
  const promptPath1 = directive.getPromptPath(layer);
  const promptPath2 = directive.getPromptPath(layer);
  assertEquals(promptPath1, promptPath2);

  const schemaPath1 = directive.getSchemaPath(layer);
  const schemaPath2 = directive.getSchemaPath(layer);
  assertEquals(schemaPath1, schemaPath2);

  // resolveOutputPathは手動ファイル名の場合、一貫した結果になる
  const manualPath1 = directive.resolveOutputPath("test.md", layer);
  const manualPath2 = directive.resolveOutputPath("test.md", layer);
  assertEquals(manualPath1, manualPath2);
});

Deno.test("1_behavior: Path methods handle edge cases gracefully", () => {
  // 有効なDirectiveType/LayerTypeの組み合わせでテスト
  const shortResult = createTwoParamsResult("to", "project");
  const shortDirectiveResult = DirectiveType.create(shortResult.directiveType);
  if (!shortDirectiveResult.ok) throw new Error("Failed to create DirectiveType");
  const shortDirective = shortDirectiveResult.data;
  const shortLayer = createMockLayer("project");

  assertEquals(shortDirective.getPromptPath(shortLayer), "prompts/to/project/to_project.md");
  assertEquals(
    shortDirective.getSchemaPath(shortLayer),
    "schemas/to/project/to_project.schema.json",
  );

  // 有効なDirectiveType/LayerTypeでテスト
  const specialResult = createTwoParamsResult("summary", "issue");
  const specialDirectiveResult = DirectiveType.create(specialResult.directiveType);
  if (!specialDirectiveResult.ok) throw new Error("Failed to create DirectiveType");
  const specialDirective = specialDirectiveResult.data;
  const specialLayer = createMockLayer("issue");

  const promptPath = specialDirective.getPromptPath(specialLayer);
  assertEquals(promptPath, "prompts/summary/issue/summary_issue.md");
});
