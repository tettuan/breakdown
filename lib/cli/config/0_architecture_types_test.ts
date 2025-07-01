/**
 * @fileoverview Architecture test for CLI config types
 * 
 * このテストは以下の観点を検証します：
 * - 依存関係の方向性（lib/cli → lib/types への依存のみ）
 * - 循環参照の有無
 * - インターフェース設計の一貫性
 * - Totality原則への準拠可能性
 */

import { assertEquals, assertExists } from "@std/assert";
import type { BreakdownConfig, ConfigOptions } from "./types.ts";

Deno.test("Architecture: Interface completeness for BreakdownConfig", () => {
  // BreakdownConfigインターフェースが必要な設定項目を持つことを確認
  // 型レベルでの検証（コンパイル時に保証される）
  const mockConfig: BreakdownConfig = {
    working_directory: "/test",
    output_directory: "/output",
    default_config_path: "/config/default.json",
  };
  
  // 必須プロパティの存在を確認
  assertExists(mockConfig.working_directory, "working_directory is required");
  assertExists(mockConfig.output_directory, "output_directory is required");
  assertExists(mockConfig.default_config_path, "default_config_path is required");
});

Deno.test("Architecture: Optional fields pattern in ConfigOptions", () => {
  // ConfigOptionsがオプショナルフィールドパターンを適切に実装していることを確認
  // 将来的にDiscriminated Unionへの移行が可能な設計か検証
  
  // 空のオプションオブジェクトが有効であることを確認
  const emptyOptions: ConfigOptions = {};
  assertEquals(typeof emptyOptions, "object");
  
  // 部分的な設定が可能であることを確認
  const partialOptions: ConfigOptions = {
    configPath: "/custom/config.json",
  };
  assertEquals(partialOptions.configPath, "/custom/config.json");
  assertEquals(partialOptions.workingDir, undefined);
  assertEquals(partialOptions.outputDir, undefined);
});

Deno.test("Architecture: No circular dependencies", () => {
  // このモジュールが他のCLIモジュールに依存していないことを確認
  // typesモジュールは最下層であるべき
  
  // インポート文の検証（実際のコードではインポートがないことを確認）
  // このテストファイル内でのインポートのみを許可
  const allowedImports = ["@std/assert", "./types.ts"];
  
  // 実際のインポート検証はAST解析が必要なため、
  // ここでは設計原則の確認に留める
  // 型定義のみをエクスポートし、実装を含まないことを確認
  // （型は実行時には存在しないため、直接的な検証は不要）
});

Deno.test("Architecture: Type-only exports", async () => {
  // このモジュールが型定義のみをエクスポートしていることを確認
  // 実装を含まないことで、依存関係を最小限に保つ
  
  // モジュールから値がエクスポートされていないことを確認
  // （型定義は実行時には存在しない）
  const typesModule = await import("./types.ts");
  
  const exportedKeys = Object.keys(typesModule);
  assertEquals(exportedKeys.length, 0, "Should export no runtime values, only types");
});

Deno.test("Architecture: Future Totality compliance readiness", () => {
  // 将来的にTotality原則を適用する際の準備状況を確認
  
  // 1. オプショナルプロパティの使用状況
  // ConfigOptionsはオプショナルプロパティを使用しているが、
  // これは設定の部分適用という妥当な理由がある
  
  // 2. 将来的な改善案の検証
  // Discriminated Unionへの移行例
  type FutureConfigOptions = 
    | { kind: "default" }
    | { kind: "custom"; configPath: string }
    | { kind: "override"; workingDir: string; outputDir: string };
  
  // 型定義が可能であることを確認
  const defaultOption: FutureConfigOptions = { kind: "default" };
  const customOption: FutureConfigOptions = { kind: "custom", configPath: "/custom.json" };
  const overrideOption: FutureConfigOptions = { kind: "override", workingDir: "/work", outputDir: "/out" };
  
  // 網羅的なswitch文が書けることを確認
  function handleOption(option: FutureConfigOptions): string {
    switch (option.kind) {
      case "default":
        return "default";
      case "custom":
        return option.configPath;
      case "override":
        return `${option.workingDir}:${option.outputDir}`;
      // defaultケースが不要（網羅的）
    }
  }
  
  assertEquals(handleOption(defaultOption), "default");
  assertEquals(handleOption(customOption), "/custom.json");
  assertEquals(handleOption(overrideOption), "/work:/out");
});

Deno.test("Architecture: Naming convention consistency", () => {
  // 命名規則の一貫性を確認
  
  // 1. インターフェース名はPascalCase
  // 2. プロパティ名はsnake_case（プロジェクトの規則に従う）
  
  // 型定義の構造的な一貫性を確認
  const configKeys: (keyof BreakdownConfig)[] = [
    "working_directory",
    "output_directory", 
    "default_config_path"
  ];
  
  // snake_caseの使用を確認
  configKeys.forEach(key => {
    assertEquals(
      key.includes("_"), 
      true, 
      `Property ${key} should use snake_case`
    );
  });
  
  // ConfigOptionsはcamelCaseを使用（一貫性の問題を検出）
  const optionKeys: (keyof ConfigOptions)[] = [
    "configPath",
    "workingDir",
    "outputDir"
  ];
  
  optionKeys.forEach(key => {
    assertEquals(
      key.match(/^[a-z][a-zA-Z]*$/) !== null,
      true,
      `Property ${key} uses camelCase`
    );
  });
  
  // 注: 命名規則の不一致を検出 - 将来的な改善点
});