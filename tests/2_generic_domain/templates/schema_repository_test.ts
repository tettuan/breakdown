import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { SchemaRepository } from "../../../lib/domain/templates/schema_repository.ts";
import { SchemaPath } from "../../../lib/domain/generic/template_management/value_objects/schema_path.ts";
import { SchemaContent } from "../../../lib/domain/generic/template_management/value_objects/schema_content.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("schema-repository-test");

// Mock repository for testing
class MockSchemaRepository {
  private mockContent = new Map<string, string>([
    ["find/bugs/base.json", '{"$schema": "https://json-schema.org/draft/2020-12/schema", "title": "Bug Analysis Schema", "type": "object"}'],
    ["to/project/base.json", '{"$schema": "https://json-schema.org/draft/2020-12/schema", "title": "Project Schema", "type": "object"}'],
    ["to/issue/base.json", '{"$schema": "https://json-schema.org/draft/2020-12/schema", "title": "Issue Schema", "type": "object"}'],
  ]);

  async findByPath(path: SchemaPath): Promise<{ ok: true; data: SchemaContent | null } | { ok: false; error: string }> {
    const pathStr = path.getPath();
    const content = this.mockContent.get(pathStr);
    if (content) {
      const contentResult = SchemaContent.create(content);
      if (contentResult.ok) {
        return { ok: true, data: contentResult.data! };
      }
    }
    return { ok: true, data: null };
  }

  async findAll(): Promise<{ ok: true; data: Array<{ path: SchemaPath; content: SchemaContent }> } | { ok: false; error: string }> {
    const results: Array<{ path: SchemaPath; content: SchemaContent }> = [];
    
    for (const [pathStr, contentStr] of this.mockContent.entries()) {
      const pathParts = pathStr.split('/');
      if (pathParts.length >= 3) {
        const types = createTypesFromPath(pathStr);
        if (types) {
          const pathResult = SchemaPath.create(types.directive, types.layer, pathParts[2]);
          const contentResult = SchemaContent.create(contentStr);
          
          if (pathResult.ok && pathResult.data && contentResult.ok && contentResult.data) {
            results.push({ path: pathResult.data, content: contentResult.data });
          }
        }
      }
    }
    
    return { ok: true, data: results };
  }
}

// Helper function to create DirectiveType and LayerType from path
function createTypesFromPath(pathStr: string): { directive: DirectiveType; layer: LayerType } | null {
  const parts = pathStr.split('/');
  if (parts.length < 2) return null;
  
  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: parts[0],
    layerType: parts[1],
    params: [parts[0], parts[1]],
    options: {}
  };
  
  return {
    directive: DirectiveType.create(twoParamsResult),
    layer: LayerType.create(twoParamsResult)
  };
}

Deno.test("SchemaRepository: can retrieve schema by path", async () => {
  logger.debug("SchemaRepository取得テスト開始", {
    testType: "unit",
    target: "SchemaRepository.findByPath",
  });

  const repository = new MockSchemaRepository();
  const types = createTypesFromPath("find/bugs/base.json");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = SchemaPath.create(types.directive, types.layer, "base.json");

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

  const repository = new MockSchemaRepository();
  const types = createTypesFromPath("non/existent/schema.json");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = SchemaPath.create(types.directive, types.layer, "schema.json");

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

  const repository = new MockSchemaRepository();
  const allSchemasResult = await repository.findAll();

  logger.debug("全スキーマ取得結果", {
    success: allSchemasResult.ok,
    count: allSchemasResult.ok ? allSchemasResult.data.length : 0,
  });

  assertEquals(allSchemasResult.ok, true);
  if (allSchemasResult.ok) {
    assertEquals(allSchemasResult.data.length > 0, true);
    
    // 期待されるスキーマが含まれていることを確認
    const paths = allSchemasResult.data.map(entry => entry.path.getPath());
    assertEquals(paths.includes("find/bugs/base.json"), true);
    assertEquals(paths.includes("to/project/base.json"), true);
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