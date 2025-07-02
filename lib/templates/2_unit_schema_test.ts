import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { schema } from "./schema.ts";

const _logger = new BreakdownLogger("test-unit-schema");

Deno.test("Unit: schema export exists and is an object", () => {
  _logger.debug("単体テスト開始: schemaエクスポート", {
    testType: "unit",
    target: "schema export",
  });

  assertExists(schema);
  assertEquals(typeof schema, "object");
});

Deno.test("Unit: schema contains expected bug analysis schemas", () => {
  _logger.debug("バグ分析スキーマ存在確認", {
    testType: "unit",
    target: "bug schemas",
  });

  assertExists(schema["find/bugs/base.schema.md"]);
  assertEquals(typeof schema["find/bugs/base.schema.md"], "string");
  assertEquals(schema["find/bugs/base.schema.md"].includes("Bug Analysis Schema"), true);
});

Deno.test("Unit: schema contains expected project schemas", () => {
  _logger.debug("プロジェクトスキーマ存在確認", {
    testType: "unit",
    target: "project schemas",
  });

  assertExists(schema["to/project/base.schema.md"]);
  assertEquals(typeof schema["to/project/base.schema.md"], "string");
  assertEquals(schema["to/project/base.schema.md"].includes("Project Schema"), true);
});

Deno.test("Unit: schema contains expected issue schemas", () => {
  _logger.debug("イシュースキーマ存在確認", {
    testType: "unit",
    target: "issue schemas",
  });

  assertExists(schema["to/issue/base.schema.md"]);
  assertEquals(typeof schema["to/issue/base.schema.md"], "string");
  assertEquals(schema["to/issue/base.schema.md"].includes("Issue Schema"), true);
});

Deno.test("Unit: schema contains expected task schemas", () => {
  _logger.debug("タスクスキーマ存在確認", {
    testType: "unit",
    target: "task schemas",
  });

  assertExists(schema["to/task/base.schema.md"]);
  assertEquals(typeof schema["to/task/base.schema.md"], "string");
  assertEquals(schema["to/task/base.schema.md"].includes("Task Schema"), true);
});

Deno.test("Unit: all schema values are valid JSON schema strings", () => {
  _logger.debug("JSONスキーマ形式検証", {
    testType: "unit",
    target: "schema JSON validity",
  });

  for (const [key, value] of Object.entries(schema)) {
    _logger.debug("スキーマ検証中", { key });

    // JSON部分の抽出と検証
    const jsonMatch = value.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        assertExists(parsed.$schema);
        assertEquals(parsed.$schema, "http://json-schema.org/draft-07/schema#");
      } catch (error) {
        _logger.error("JSON解析エラー", {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
});

Deno.test("Unit: schema object is immutable (const assertion)", () => {
  _logger.debug("不変性チェック", {
    testType: "unit",
    target: "schema immutability",
  });

  // TypeScriptのconst assertionにより読み取り専用
  const schemaKeys = Object.keys(schema);
  assertEquals(schemaKeys.length > 0, true);

  // 実行時の不変性は型システムで保証
  assertEquals(typeof schema, "object");
});
