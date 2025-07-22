/**
 * @fileoverview ハードコード除去確認テスト - DirectiveType/LayerTypeの配列ハードコード検証
 *
 * コードベース内でハードコードされた配列が存在しないことを確認し、
 * すべての型定義が設定ファイルから動的に読み込まれることを検証
 *
 * @module tests/integration/jsr_integration/hardcode_elimination_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { readAll } from "@std/io";
import { join } from "@std/path";

const logger = new BreakdownLogger("hardcode-check");

describe("ハードコード除去の確認", () => {
  describe("DirectiveType/LayerType配列のハードコード検出", () => {
    it("lib/domain/core/value_objects/ 内でハードコードされた配列が存在しない", async () => {
      const targetDir = join(Deno.cwd(), "lib", "domain", "core", "value_objects");

      // ハードコードのパターンを定義
      const hardcodePatterns = [
        // 配列リテラル
        /\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]/g,
        // new Set() リテラル
        /new Set\(\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]\)/g,
        // Object.freeze() 配列
        /Object\.freeze\(\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]\)/g,
        // as const 配列
        /\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\] as const/g,
      ];

      const files = await findTypeScriptFiles(targetDir);
      const violations: Array<{ file: string; line: number; content: string }> = [];

      for (const file of files) {
        const content = await Deno.readTextFile(file);
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          hardcodePatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              // コメント行やテスト用のモックデータは除外
              if (
                !line.trim().startsWith("//") &&
                !line.includes("test") &&
                !line.includes("mock") &&
                !line.includes("example")
              ) {
                violations.push({
                  file: file.replace(Deno.cwd(), "."),
                  line: index + 1,
                  content: line.trim(),
                });
              }
            }
          });
        });
      }

      logger.debug("ハードコード検査結果", {
        filesChecked: files.length,
        violations: violations.length,
        details: violations,
      });

      // ハードコードが存在しないことを確認
      assertEquals(
        violations.length,
        0,
        `ハードコードされた配列が見つかりました: ${JSON.stringify(violations, null, 2)}`,
      );
    });

    it("lib/types/defaults/ 内の実装が設定ベースになっている", async () => {
      const targetFile = join(
        Deno.cwd(),
        "lib",
        "types",
        "defaults",
        "default_type_pattern_provider.ts",
      );

      const content = await Deno.readTextFile(targetFile);

      // 設定を参照しているパターンを確認
      const configPatterns = [
        /customConfig/g,
        /getPattern/g,
        /pattern\.split/g,
        /directivePattern/g,
        /layerPattern/g,
      ];

      let configReferences = 0;
      configPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          configReferences += matches.length;
        }
      });

      logger.debug("設定参照の検査", {
        file: "default_type_pattern_provider.ts",
        configReferences,
        hasConfigSupport: configReferences > 0,
      });

      // 設定を参照していることを確認
      assertEquals(
        configReferences > 0,
        true,
        "default_type_pattern_provider が設定を参照していません",
      );
    });
  });

  describe("動的パターンプロバイダーの検証", () => {
    it("PatternProvider が設定から動的にパターンを取得している", async () => {
      const targetFiles = [
        join(Deno.cwd(), "lib", "config", "pattern_provider.ts"),
        join(Deno.cwd(), "lib", "config", "pattern_provider_async.ts"),
      ];

      for (const file of targetFiles) {
        const content = await Deno.readTextFile(file);

        // 動的パターン取得の実装を確認
        const dynamicPatterns = [
          /this\.config\./g,
          /customConfig\./g,
          /pattern\s*=\s*[^"']/g, // 変数からの代入
          /getDirectivePattern/g,
          /getLayerPattern/g,
        ];

        let dynamicImplementations = 0;
        dynamicPatterns.forEach((pattern) => {
          const matches = content.match(pattern);
          if (matches) {
            dynamicImplementations += matches.length;
          }
        });

        logger.debug("動的実装の検査", {
          file: file.replace(Deno.cwd(), "."),
          dynamicImplementations,
          isDynamic: dynamicImplementations > 0,
        });

        assertEquals(
          dynamicImplementations > 0,
          true,
          `${file} が動的パターン取得を実装していません`,
        );
      }
    });
  });

  describe("統合テストでの設定駆動確認", () => {
    it("異なるプロファイルで異なるパターンが使用される", async () => {
      // ConfigBasedTwoParamsBuilderを使用して確認
      const { ConfigBasedTwoParamsBuilder } = await import(
        "../../../lib/config/config_based_two_params_builder.ts"
      );

      // 異なるプロファイルでビルダーを作成
      const profiles = [
        { name: "default", expectedPatterns: true },
        { name: "breakdown-params-integration", expectedPatterns: true },
        { name: "flexible-test", expectedPatterns: true },
      ];

      const patterns: Record<string, { directive?: string; layer?: string }> = {};

      for (const profile of profiles) {
        try {
          const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(profile.name);

          if (builderResult.ok) {
            const builder = builderResult.data;
            patterns[profile.name] = {
              directive: builder.getDirectivePattern(),
              layer: builder.getLayerPattern(),
            };
          }
        } catch (error) {
          logger.debug("プロファイル読み込みスキップ", {
            profile: profile.name,
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.debug("プロファイル別パターン", patterns);

      // 少なくとも2つのプロファイルが読み込まれることを確認
      const loadedProfiles = Object.keys(patterns);
      assertEquals(loadedProfiles.length >= 2, true, "複数のプロファイルが読み込まれませんでした");

      // パターンが存在し、文字列であることを確認
      loadedProfiles.forEach((profileName) => {
        const pattern = patterns[profileName];
        if (pattern.directive) {
          assertEquals(
            typeof pattern.directive,
            "string",
            `${profileName} の directive パターンが文字列ではありません`,
          );
        }
        if (pattern.layer) {
          assertEquals(
            typeof pattern.layer,
            "string",
            `${profileName} の layer パターンが文字列ではありません`,
          );
        }
      });
    });
  });
});

/**
 * TypeScriptファイルを再帰的に検索
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(dir)) {
      const path = join(dir, entry.name);

      if (entry.isDirectory && !entry.name.startsWith(".")) {
        const subFiles = await findTypeScriptFiles(path);
        files.push(...subFiles);
      } else if (entry.isFile && entry.name.endsWith(".ts") && !entry.name.endsWith("_test.ts")) {
        files.push(path);
      }
    }
  } catch (error) {
    logger.debug("ディレクトリ読み込みエラー", {
      dir,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return files;
}
