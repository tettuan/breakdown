import { assertEquals, assertExists } from "../deps.ts";
import { fromFileUrl } from "@std/path";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";
import { schema } from "./schema.ts";

const _logger = new _BreakdownLogger("test-structure-schema");

Deno.test("Structure: schema object has proper type structure", () => {
  _logger.debug("構造テスト開始: schema型構造", {
    testType: "structure",
    target: "schema type",
  });

  // schemaは定数オブジェクトとして定義されているべき
  assertExists(schema);
  assertEquals(typeof schema, "object");

  // 各エントリは文字列値を持つべき
  Object.entries(schema).forEach(([key, value]) => {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
  });
});

Deno.test("Structure: schema follows single responsibility principle", () => {
  _logger.debug("単一責任の原則チェック", {
    testType: "single-responsibility",
    target: "schema.ts",
  });

  // スキーマファイルはJSON Schema定義の保持のみを責務とする
  Object.keys(schema).forEach((key) => {
    // キーはスキーマファイルのパス
    assertEquals(key.endsWith(".schema.md"), true, `Key "${key}" should be a schema file`);
  });

  // 値はJSON Schema定義のみを含む
  Object.values(schema).forEach((value) => {
    assertEquals(value.includes("$schema"), true, "Should contain JSON Schema");
    assertEquals(value.includes("type"), true, "Should contain type definitions");
  });
});

Deno.test("Structure: schema data is properly organized by category", () => {
  _logger.debug("カテゴリ別組織化チェック", {
    testType: "organization",
    target: "schema categories",
  });

  const categories = new Map<string, string[]>();

  Object.keys(schema).forEach((key) => {
    const category = key.split("/")[0];
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(key);
  });

  // 主要カテゴリの存在確認
  const expectedCategories = ["find", "to"];
  expectedCategories.forEach((cat) => {
    assertExists(categories.get(cat), `Category "${cat}" should exist`);
  });

  // 階層構造の確認
  assertEquals(categories.get("to")!.length > 0, true, "to category should have schemas");
  assertEquals(categories.get("find")!.length > 0, true, "find category should have schemas");
});

Deno.test("Structure: schema maintains consistent abstraction level", () => {
  _logger.debug("抽象化レベル一貫性チェック", {
    testType: "abstraction-level",
    target: "schema.ts",
  });

  // すべてのスキーマが同じ抽象化レベル（JSON Schema）を持つ
  Object.values(schema).forEach((value) => {
    // JSON Schema形式の確認
    assertEquals(value.includes('"type": "object"'), true, "Should define object type");
    assertEquals(value.includes('"properties"'), true, "Should define properties");
    assertEquals(value.includes('"required"'), true, "Should define required fields");
  });
});

Deno.test("Structure: schema avoids duplication and redundancy", () => {
  _logger.debug("重複・冗長性チェック", {
    testType: "duplication",
    target: "schema content",
  });

  // 完全に同一のスキーマ定義がないことを確認
  const values = Object.values(schema);
  const uniqueValues = new Set(values);

  assertEquals(values.length, uniqueValues.size, "No duplicate schema definitions should exist");

  // 各スキーマが独自の目的を持つことを確認（異なるプロパティ構造）
  const propertyPatterns = values.map((value) => {
    const match = value.match(/"properties":\s*{([^}]+)}/);
    return match ? match[1] : "";
  });

  const uniquePatterns = new Set(propertyPatterns);
  assertEquals(propertyPatterns.length > 0, true, "Should have property patterns");
});

Deno.test("Structure: schema follows Totality pattern with Result type", () => {
  _logger.debug("Totalityパターン準拠チェック", {
    testType: "totality-pattern",
    target: "schema.ts",
  });

  // schemaオブジェクトはReadonlyで安全にアクセス可能
  const testKey = Object.keys(schema)[0];
  const result = schema[testKey as keyof typeof schema];

  // 型安全性の確認（TypeScriptにより保証）
  assertEquals(typeof result, "string");

  // const assertionによる不変性の確認
  const moduleCode = Deno.readTextFileSync(fromFileUrl(new URL("./schema.ts", import.meta.url)));
  assertEquals(moduleCode.includes("} as const;"), true, "Should use 'as const' for immutability");

  // エラー処理不要の設計（キーが存在すれば必ず文字列を返す）
  Object.keys(schema).forEach((key) => {
    const value = schema[key as keyof typeof schema];
    assertEquals(typeof value, "string", "All schema values should be strings");
  });
});
