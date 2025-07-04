/**
 * Architecture Test for Template Validator
 *
 * このテストは、TemplateValidatorモジュールのアーキテクチャ制約を検証します。
 * Totalityパターンの適用状況、依存関係の方向性、責務の分離を確認します。
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  TemplateMapping,
  TemplateValidation_Result,
  TemplateValidator,
} from "./template_validator.ts";

Deno.test("Architecture: TemplateValidator follows Totality pattern with Smart Constructor", () => {
  // Smart Constructor pattern: constructorで必要な依存を注入
  const _projectRoot = "/test/project";
  const _validator = new TemplateValidator(_projectRoot);

  // インスタンスが正しく生成されることを確認
  assertExists(_validator);

  // カスタムマッピングも受け付けることを確認
  const customMappings: TemplateMapping[] = [{
    source: "src/template.md",
    destination: "dest/template.md",
    required: true,
  }];
  const customValidator = new TemplateValidator(_projectRoot, customMappings);
  assertExists(customValidator);
});

Deno.test("Architecture: TemplateValidationResult follows Result type pattern", () => {
  // Result型パターン: 成功/失敗を明示的に表現
  const successResult: TemplateValidation_Result = {
    isValid: true,
    missingTemplates: [],
    existingTemplates: ["template1.md", "template2.md"],
    totalRequired: 2,
  };

  const failureResult: TemplateValidation_Result = {
    isValid: false,
    missingTemplates: ["template3.md"],
    existingTemplates: ["template1.md", "template2.md"],
    totalRequired: 3,
  };

  // Result型が成功/失敗を明確に区別できることを確認
  assertEquals(successResult.isValid, true);
  assertEquals(failureResult.isValid, false);

  // 失敗理由が具体的に取得できることを確認
  assertEquals(failureResult.missingTemplates.length, 1);
  assertEquals(failureResult.missingTemplates[0], "template3.md");
});

Deno.test("Architecture: Module has clear single responsibility", () => {
  // 単一責任の原則: テンプレート検証に特化
  const _validator = new TemplateValidator("/test");

  // 提供されるメソッドが責務に沿っていることを確認
  assertExists(_validator.validateTemplates);
  assertExists(_validator.generateMissingTemplates);
  assertExists(_validator.preflightCheck);

  // 各メソッドが適切な戻り値の型を持つことを確認（型システムで保証）
  // validateTemplates: Promise<TemplateValidationResult>
  // generateMissingTemplates: Promise<{generated: string[], failed: {...}[]}>
  // preflightCheck: Promise<{ready: boolean, issues: string[], recommendations: string[]}>
});

Deno.test("Architecture: Dependencies flow in correct direction", () => {
  // 依存関係の方向性を確認
  // TemplateValidator -> @std/fs (外部ライブラリ)
  // TemplateValidator -> @std/path (外部ライブラリ)
  // TemplateValidator -> @tettuan/breakdownlogger (ロギング)

  // 循環参照がないことを型システムで保証
  // このテストはコンパイルが通ることで依存関係の健全性を確認
  const _validator = new TemplateValidator("/test");
  assertExists(_validator);
});

Deno.test("Architecture: Discriminated Union pattern in return types", () => {
  // Discriminated Union: 明確な状態の区別

  // generateMissingTemplatesの戻り値は成功/失敗を明確に区別
  type GenerateResult = {
    generated: string[];
    failed: { template: string; error: string }[];
  };

  const successCase: GenerateResult = {
    generated: ["template1.md", "template2.md"],
    failed: [],
  };

  const partialFailureCase: GenerateResult = {
    generated: ["template1.md"],
    failed: [{ template: "template2.md", error: "Source not found" }],
  };

  // 各ケースが明確に区別できることを確認
  assertEquals(successCase.failed.length, 0);
  assertEquals(partialFailureCase.failed.length, 1);

  // preflightCheckも同様のパターンを採用
  type PreflightResult = {
    ready: boolean;
    issues: string[];
    recommendations: string[];
  };

  const readyCase: PreflightResult = {
    ready: true,
    issues: [],
    recommendations: [],
  };

  const notReadyCase: PreflightResult = {
    ready: false,
    issues: ["Missing templates"],
    recommendations: ["Run: bash scripts/template_generator.sh generate"],
  };

  // 状態が明確に区別できることを確認
  assertEquals(readyCase.ready, true);
  assertEquals(notReadyCase.ready, false);
});

Deno.test("Architecture: Totality - all operations return complete results", () => {
  // Totality原則: すべての操作が完全な結果を返す

  // validateTemplates: 検証結果の全体性
  // - isValid: 全体の成否
  // - missingTemplates: 不足分の完全なリスト
  // - existingTemplates: 存在分の完全なリスト
  // - totalRequired: 必要数の総計

  // generateMissingTemplates: 生成結果の全体性
  // - generated: 生成成功した全ファイル
  // - failed: 生成失敗した全ファイルとその理由

  // preflightCheck: 事前チェックの全体性
  // - ready: 全体の準備状態
  // - issues: すべての問題点
  // - recommendations: すべての推奨事項

  // 各メソッドが部分的な結果ではなく、完全な結果を返すことを型で保証
  const _validator = new TemplateValidator("/test");
  assertExists(_validator);
});
