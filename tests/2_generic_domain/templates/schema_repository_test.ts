import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { SchemaRepository } from "../../../lib/domain/templates/schema_repository.ts";
// import { SchemaContent } from "../../../lib/domain/templates/value_objects/schema_content.ts";
// import { SchemaPath } from "../../../lib/domain/templates/value_objects/schema_path.ts";

const logger = new BreakdownLogger("schema-repository-test");

Deno.test("SchemaRepository: can retrieve schema by path", async () => {
  logger.debug("SchemaRepository取得テスト開始", {
    testType: "unit",
    target: "SchemaRepository.findByPath",
  });

  const repository = new SchemaRepository();
  const pathResult = SchemaPath.create("find/bugs/base.schema.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create schema path: ${pathResult.error}`);
  }

  const schemaResult = await repository.findByPath(pathResult.data);

  logger.debug("スキーマ取得結果", {
    success: schemaResult.ok,
    hasContent: schemaResult.ok ? schemaResult.data !== null : false,
  });

  assertEquals(schemaResult.ok, true);
  if (schemaResult.ok && schemaResult.data) {
    assertExists(schemaResult.data);
    assertEquals(schemaResult.data.getValue().includes("Bug Analysis Schema"), true);
  }
});

Deno.test("SchemaRepository: returns null for non-existent schema", async () => {
  logger.debug("存在しないスキーマテスト開始", {
    testType: "unit",
    target: "SchemaRepository.findByPath (non-existent)",
  });

  const repository = new SchemaRepository();
  const pathResult = SchemaPath.create("non/existent/schema.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create schema path: ${pathResult.error}`);
  }

  const schemaResult = await repository.findByPath(pathResult.data);

  logger.debug("存在しないスキーマ取得結果", {
    success: schemaResult.ok,
    data: schemaResult.ok ? schemaResult.data : schemaResult.error,
  });

  assertEquals(schemaResult.ok, true);
  assertEquals(schemaResult.data, null);
});

Deno.test("SchemaRepository: findAll returns all available schemas", async () => {
  logger.debug("全スキーマ取得テスト開始", {
    testType: "unit",
    target: "SchemaRepository.findAll",
  });

  const repository = new SchemaRepository();
  const allSchemasResult = await repository.findAll();

  logger.debug("全スキーマ取得結果", {
    success: allSchemasResult.ok,
    count: allSchemasResult.ok ? allSchemasResult.data.length : 0,
  });

  assertEquals(allSchemasResult.ok, true);
  if (allSchemasResult.ok) {
    assertEquals(allSchemasResult.data.length > 0, true);
    
    // 期待されるスキーマが含まれていることを確認
    const paths = allSchemasResult.data.map(entry => entry.path.getValue());
    assertEquals(paths.includes("find/bugs/base.schema.md"), true);
    assertEquals(paths.includes("to/project/base.schema.md"), true);
  }
});

Deno.test("SchemaRepository: handles invalid schema paths gracefully", async () => {
  logger.debug("無効なパステスト開始", {
    testType: "unit",
    target: "SchemaRepository with invalid path",
  });

  const repository = new SchemaRepository();
  
  // 無効なパスでSchemaPathを作成しようとする
  const invalidPathResult = SchemaPath.create("");

  logger.debug("無効なパス作成結果", {
    success: invalidPathResult.ok,
    error: invalidPathResult.ok ? null : invalidPathResult.error,
  });

  assertEquals(invalidPathResult.ok, false);
  if (!invalidPathResult.ok) {
    assertExists(invalidPathResult.error);
  }
});

Deno.test("SchemaRepository: schema content is properly typed", async () => {
  logger.debug("スキーマコンテンツ型安全性テスト開始", {
    testType: "unit",
    target: "SchemaContent type safety",
  });

  const repository = new SchemaRepository();
  const pathResult = SchemaPath.create("to/issue/base.schema.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create schema path: ${pathResult.error}`);
  }

  const schemaResult = await repository.findByPath(pathResult.data);

  if (schemaResult.ok && schemaResult.data) {
    const content = schemaResult.data;
    
    logger.debug("スキーマコンテンツ検証", {
      hasValue: content.getValue().length > 0,
      isString: typeof content.getValue() === "string",
      containsSchema: content.getValue().includes("$schema"),
    });

    // SchemaContentのValueObjectとしての動作確認
    assertEquals(typeof content.getValue(), "string");
    assertEquals(content.getValue().length > 0, true);
    assertEquals(content.getValue().includes("Issue Schema"), true);
    assertEquals(content.getValue().includes("$schema"), true);
  }
});