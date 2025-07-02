import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { prompts } from "./prompts.ts";

/**
 * 単体テスト：prompts.ts
 *
 * 機能の動作検証：
 * - プロンプトの存在確認
 * - プロンプト内容の妥当性検証
 * - 変数プレースホルダーの確認
 * - カテゴリごとの特性検証
 */

Deno.test("Unit: prompts should contain all required prompt templates", () => {
  // 必須のプロンプトテンプレートが存在することを確認
  const _requiredPrompts = [
    "to/project/f_project.md",
    "to/issue/f_issue.md",
    "to/task/f_task.md",
    "summary/project/f_project.md",
    "summary/issue/f_issue.md",
    "summary/task/f_task.md",
    "defect/project/f_project.md",
    "defect/issue/f_issue.md",
    "defect/task/f_task.md",
  ];

  requiredPrompts.forEach((key) => {
    assertExists(
      prompts[key as keyof typeof prompts],
      `Required prompt "${key}" should exist`,
    );
  });
});

Deno.test("Unit: prompts should contain proper template variables", () => {
  // プロンプトテンプレートが適切な変数を含むことを確認
  const variablePatterns = [
    "{input_text_file}",
    "{input_text}",
    "{destination_path}",
    "{schema_file}",
  ];

  // 変数を使用すべきプロンプトをチェック
  const promptsWithVariables = [
    "to/project/f_task.md",
    "to/issue/f_task.md",
    "to/task/f_issue.md",
    "defect/project/f_project.md",
    "defect/task/f_task.md",
  ];

  promptsWithVariables.forEach((key) => {
    const content = prompts[key as keyof typeof prompts];
    if (content && content !== " ") {
      // 少なくとも1つの変数を含むべき
      const hasVariable = variablePatterns.some((pattern) => content.includes(pattern));
      assertEquals(
        hasVariable,
        true,
        `Prompt "${key}" should contain template variables`,
      );
    }
  });
});

Deno.test("Unit: defect prompts should focus on analysis", () => {
  // defectカテゴリのプロンプトは分析に焦点を当てるべき
  const defectPrompts = Object.entries(prompts)
    .filter(([key]) => key.startsWith("defect/"));

  defectPrompts.forEach(([key, content]) => {
    if (content && content !== " ") {
      // 分析関連のキーワードを含むべき
      const analysisKeywords = [
        "analysis",
        "analyze",
        "defect",
        "error",
        "issue",
        "problem",
        "severity",
        "impact",
        "解析",
        "エラー",
      ];

      const hasAnalysisContent = analysisKeywords.some((keyword) =>
        content.toLowerCase().includes(keyword)
      );

      assertEquals(
        hasAnalysisContent,
        true,
        `Defect prompt "${key}" should contain analysis-related content`,
      );
    }
  });
});

Deno.test("Unit: to prompts should focus on conversion", () => {
  // toカテゴリのプロンプトは変換に焦点を当てるべき
  const toPrompts = Object.entries(prompts)
    .filter(([key]) => key.startsWith("to/"));

  toPrompts.forEach(([key, content]) => {
    if (content && content !== " ") {
      // 変換関連のキーワードを含むべき
      const conversionKeywords = [
        "convert",
        "transform",
        "into",
        "structured",
        "変換",
        "Input",
        "Output",
        "Schema",
      ];

      const hasConversionContent = conversionKeywords.some((keyword) => content.includes(keyword));

      assertEquals(
        hasConversionContent,
        true,
        `To prompt "${key}" should contain conversion-related content`,
      );
    }
  });
});

Deno.test("Unit: summary prompts should focus on summarization", () => {
  // summaryカテゴリのプロンプトは要約に焦点を当てるべき
  const summaryPrompts = Object.entries(prompts)
    .filter(([key]) => key.startsWith("summary/"));

  summaryPrompts.forEach(([key, content]) => {
    if (content && content !== " ") {
      // 要約関連のキーワードを含むべき
      const summaryKeywords = [
        "summary",
        "summarize",
        "overview",
        "status",
        "progress",
        "要約",
        "Summary",
        "perspectives",
      ];

      const hasSummaryContent = summaryKeywords.some((keyword) => content.includes(keyword));

      assertEquals(
        hasSummaryContent,
        true,
        `Summary prompt "${key}" should contain summary-related content`,
      );
    }
  });
});

Deno.test("Unit: find prompts should focus on detection", () => {
  // findカテゴリのプロンプトは検出に焦点を当てるべき
  const findPrompts = Object.entries(prompts)
    .filter(([key]) => key.startsWith("find/"));

  findPrompts.forEach(([key, content]) => {
    if (content && content !== " ") {
      // 検出関連のキーワードを含むべき
      const detectionKeywords = [
        "detect",
        "find",
        "identify",
        "search",
        "bug",
        "vulnerability",
        "issue",
        "Analysis",
      ];

      const hasDetectionContent = detectionKeywords.some((keyword) => content.includes(keyword));

      assertEquals(
        hasDetectionContent,
        true,
        `Find prompt "${key}" should contain detection-related content`,
      );
    }
  });
});

Deno.test("Unit: prompts with schema references should mention JSON", () => {
  // スキーマを参照するプロンプトはJSON関連の指示を含むべき
  const schemaRelatedPrompts = [
    "defect/error_schema.md",
    "to/issue/defect_fix_schema.md",
  ];

  schemaRelatedPrompts.forEach((key) => {
    const content = prompts[key as keyof typeof prompts];
    if (content) {
      assertStringIncludes(
        content,
        "JSON",
        `Schema-related prompt "${key}" should mention JSON`,
      );
      assertStringIncludes(
        content,
        "Schema",
        `Schema-related prompt "${key}" should mention Schema`,
      );
    }
  });
});

Deno.test("Unit: prompts should handle empty content gracefully", () => {
  // 空のコンテンツ（" "）を持つプロンプトも正常に扱えることを確認
  const emptyContentPrompt = prompts["defect/issue/f_issue.md"];

  assertEquals(emptyContentPrompt, " ");
  assertEquals(typeof emptyContentPrompt, "string");
  assertEquals(emptyContentPrompt.length, 1);
});
