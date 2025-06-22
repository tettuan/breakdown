/**
 * 開発者修正案の比較テスト
 * constants.ts変更とtemplate_validator.tsハードコーディング修正の効果を検証
 */

import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { join } from "jsr:@std/path";
import { DEFAULT_PROMPT_BASE_DIR } from "../lib/config/constants.ts";
import { DEFAULT_TEMPLATE_MAPPINGS, TemplateValidator } from "../lib/helpers/template_validator.ts";

const BASE_DIR = "/Users/tettuan/github/breakdown";

Deno.test("修正前: ハードコーディング状態の確認", () => {
  // template_validator.tsのハードコード確認
  const firstMapping = DEFAULT_TEMPLATE_MAPPINGS[0];

  // ハードコードされた値を確認
  assertEquals(firstMapping.source, "lib/breakdown/prompts/summary/issue/f_issue.md");

  // constants.tsとの不整合確認
  const expectedPath = `${DEFAULT_PROMPT_BASE_DIR}/summary/issue/f_issue.md`;
  assertEquals(firstMapping.source, expectedPath, "現在はハードコードとconstants.tsが一致している");

  console.log("✓ ハードコーディング状態確認完了");
});

Deno.test("修正前: constants.ts変更による影響テスト", () => {
  // constants.tsの現在値
  assertEquals(DEFAULT_PROMPT_BASE_DIR, "lib/breakdown/prompts");

  // もしconstants.tsが変更された場合のシミュレーション
  const simulatedNewPath = "lib/templates/prompts"; // 仮想的な新しいパス

  // template_validator.tsはハードコードなので影響を受けない（問題）
  const firstMapping = DEFAULT_TEMPLATE_MAPPINGS[0];
  assertNotEquals(firstMapping.source, `${simulatedNewPath}/summary/issue/f_issue.md`);

  console.log("✓ constants.ts変更時の不整合を確認（修正前の問題）");
});

Deno.test("修正後想定: constants.ts参照による整合性テスト", () => {
  // 修正後の想定実装をシミュレーション
  const createDynamicMapping = (basePath: string) => {
    return {
      source: `${basePath}/summary/issue/f_issue.md`,
      destination: "examples/prompts/summary/issue/f_issue.md",
      required: true,
    };
  };

  // constants.tsを参照した場合
  const dynamicMapping = createDynamicMapping(DEFAULT_PROMPT_BASE_DIR);
  assertEquals(dynamicMapping.source, "lib/breakdown/prompts/summary/issue/f_issue.md");

  // constants.tsが変更された場合の想定
  const newBasePath = "lib/templates/prompts";
  const updatedMapping = createDynamicMapping(newBasePath);
  assertEquals(updatedMapping.source, "lib/templates/prompts/summary/issue/f_issue.md");

  console.log("✓ 修正後の動的パス生成をシミュレーション");
});

Deno.test("修正前: template_validator実際のファイルアクセステスト", async () => {
  const projectRoot = BASE_DIR;
  const validator = new TemplateValidator(projectRoot);

  // 現在のハードコードされたパスでのバリデーション
  const validation = await validator.validateTemplates();

  console.log("テンプレート検証結果:");
  console.log(`- Total required: ${validation.totalRequired}`);
  console.log(`- Missing: ${validation.missingTemplates.length}`);
  console.log(`- Existing: ${validation.existingTemplates.length}`);
  console.log(`- Valid: ${validation.isValid}`);

  // 結果の記録（修正後と比較するため）
  assertExists(validation);
  assertEquals(typeof validation.isValid, "boolean");
});

Deno.test("ハードコード箇所の網羅的確認", () => {
  // すべてのマッピングがハードコードされていることを確認
  const hardcodedPaths = DEFAULT_TEMPLATE_MAPPINGS.map((mapping) => mapping.source);

  // ハードコード検出パターン
  const hardcodedPattern = /^lib\/breakdown\/prompts\//;

  let hardcodedCount = 0;
  for (const path of hardcodedPaths) {
    if (hardcodedPattern.test(path)) {
      hardcodedCount++;
    }
  }

  assertEquals(hardcodedCount, hardcodedPaths.length, "全てのパスがハードコードされている");
  console.log(`✓ ${hardcodedCount}件のハードコードされたパスを確認`);
});

Deno.test("修正提案: 動的パス生成の実装例", () => {
  // 修正提案の実装例
  const createTemplateMapping = (
    baseDir: string,
    category: string,
    type: string,
    filename: string,
  ) => {
    return {
      source: `${baseDir}/${category}/${type}/${filename}`,
      destination: `examples/prompts/${category}/${type}/${filename}`,
      required: true,
    };
  };

  // constants.tsを活用した動的生成
  const dynamicMapping = createTemplateMapping(
    DEFAULT_PROMPT_BASE_DIR,
    "summary",
    "issue",
    "f_issue.md",
  );

  assertEquals(dynamicMapping.source, "lib/breakdown/prompts/summary/issue/f_issue.md");

  // constants.ts変更時の自動追従テスト
  const newBaseDir = "lib/templates/prompts";
  const updatedMapping = createTemplateMapping(newBaseDir, "summary", "issue", "f_issue.md");
  assertEquals(updatedMapping.source, "lib/templates/prompts/summary/issue/f_issue.md");

  console.log("✓ 動的パス生成の実装例を検証");
});

Deno.test("lib/templates/ディレクトリ構造確認", async () => {
  const templatesDir = join(BASE_DIR, "lib/templates");

  // ディレクトリ存在確認
  const stat = await Deno.stat(templatesDir);
  assertEquals(stat.isDirectory, true);

  // 内容確認
  const entries = [];
  for await (const entry of Deno.readDir(templatesDir)) {
    entries.push(entry.name);
  }

  assertEquals(entries.includes("prompts.ts"), true);
  assertEquals(entries.includes("schema.ts"), true);

  console.log("lib/templates/内容:", entries);
});
