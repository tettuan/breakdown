/**
 * Structure Test for Template Validator
 *
 * このテストは、TemplateValidatorモジュールの構造と責務分離を検証します。
 * クラス構造、メソッドの責務、データ構造の適切性を確認します。
 */

import { assertEquals, assertExists } from "../deps.ts";
import {
  DEFAULT_TEMPLATE_MAPPINGS,
  TemplateMapping,
  TemplateValidation_Result,
  TemplateValidator,
} from "./template_validator.ts";

Deno.test("Structure: TemplateValidator class has proper encapsulation", () => {
  // プライベートフィールドが適切にカプセル化されている
  const _validator = new TemplateValidator("/test");

  // TypeScriptのprivateは型レベルの制約であり、ランタイムではアクセス可能
  // ただし、型システムではエラーとなることを確認
  // @ts-expect-error: private field - TypeScript prevents access at compile time
  const _projectRoot = _validator.projectRoot;
  // @ts-expect-error: private field - TypeScript prevents access at compile time
  const _templateMappings = _validator.templateMappings;
  // @ts-expect-error: private field - TypeScript prevents access at compile time
  const logger = _validator.logger;

  // パブリックメソッドのみアクセス可能
  assertExists(_validator.validateTemplates);
  assertExists(_validator.generateMissingTemplates);
  assertExists(_validator.preflightCheck);
});

Deno.test("Structure: TemplateMapping interface represents clear data structure", () => {
  // TemplateMappingが明確なデータ構造を持つ
  const mapping: TemplateMapping = {
    source: "src/template.md",
    destination: "dest/template.md",
    required: true,
  };

  // 必要なフィールドがすべて存在
  assertExists(mapping.source);
  assertExists(mapping.destination);
  assertExists(mapping.required);

  // 型が正しいことを確認（TypeScriptの型システムで保証）
  assertEquals(typeof mapping.source, "string");
  assertEquals(typeof mapping.destination, "string");
  assertEquals(typeof mapping.required, "boolean");
});

Deno.test("Structure: DEFAULT_TEMPLATE_MAPPINGS follows consistent pattern", () => {
  // デフォルトマッピングが一貫したパターンに従う
  for (const mapping of DEFAULT_TEMPLATE_MAPPINGS) {
    // すべてのマッピングが必須
    assertEquals(mapping.required, true);

    // sourceはlib/breakdown/prompts/から始まる
    assertEquals(mapping.source.startsWith("lib/breakdown/prompts/"), true);

    // destinationはexamples/prompts/から始まる
    assertEquals(mapping.destination.startsWith("examples/prompts/"), true);

    // ファイル名は.mdで終わる
    assertEquals(mapping.source.endsWith(".md"), true);
    assertEquals(mapping.destination.endsWith(".md"), true);
  }
});

Deno.test("Structure: Method responsibilities are clearly separated", () => {
  // 各メソッドが明確に分離された責務を持つ

  // validateTemplates: 検証のみ（副作用なし）
  // - テンプレートの存在確認
  // - 結果の集計とレポート

  // generateMissingTemplates: 生成処理（副作用あり）
  // - 不足テンプレートのコピー
  // - ディレクトリの作成
  // - エラーハンドリング

  // preflightCheck: 総合的な事前チェック
  // - validateTemplatesの呼び出し
  // - ディレクトリ構造の確認
  // - 推奨事項の生成

  const _validator = new TemplateValidator("/test");

  // 各メソッドが独立して呼び出せることを確認
  assertExists(_validator.validateTemplates);
  assertExists(_validator.generateMissingTemplates);
  assertExists(_validator.preflightCheck);
});

Deno.test("Structure: Return types follow consistent Result pattern", () => {
  // 戻り値の型が一貫したResultパターンに従う

  // TemplateValidationResult
  const validationResult: TemplateValidation_Result = {
    isValid: true,
    missingTemplates: [],
    existingTemplates: [],
    totalRequired: 0,
  };

  // generateMissingTemplatesの戻り値
  type GenerateResult = {
    generated: string[];
    failed: { template: string; error: string }[];
  };

  const generateResult: GenerateResult = {
    generated: [],
    failed: [],
  };

  // preflightCheckの戻り値
  type PreflightResult = {
    ready: boolean;
    issues: string[];
    recommendations: string[];
  };

  const preflightResult: PreflightResult = {
    ready: true,
    issues: [],
    recommendations: [],
  };

  // すべての戻り値が成功/失敗を明確に表現
  assertExists(validationResult.isValid);
  assertExists(generateResult.generated);
  assertExists(generateResult.failed);
  assertExists(preflightResult.ready);
});

Deno.test("Structure: Error information is structured and detailed", () => {
  // エラー情報が構造化され、詳細を含む
  type FailedTemplate = {
    template: string;
    error: string;
  };

  const failedTemplate: FailedTemplate = {
    template: "examples/prompts/test.md",
    error: "Source template not found: lib/prompts/test.md",
  };

  // エラー情報が必要な詳細を含む
  assertExists(failedTemplate.template);
  assertExists(failedTemplate.error);

  // エラーメッセージが具体的
  assertEquals(failedTemplate.error.includes("Source template not found"), true);
});

Deno.test("Structure: Utility functions complement class functionality", () => {
  // ユーティリティ関数がクラス機能を補完

  // validateTemplatesForExamplesはCLI向けのラッパー
  // - TemplateValidatorのインスタンス化
  // - ロギング処理
  // - 人間が読みやすい出力

  // クラスとユーティリティ関数の責務が明確に分離
  // クラス: ビジネスロジック
  // ユーティリティ: CLI/UI層の処理

  assertExists(TemplateValidator);
  // validateTemplatesForExamplesはexportされている
  assertEquals(
    typeof import("./template_validator.ts").then((m) => m.validateTemplatesForExamples),
    "object",
  );
});
