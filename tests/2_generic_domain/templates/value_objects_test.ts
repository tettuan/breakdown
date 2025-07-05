import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { SchemaPath } from "../../../lib/domain/generic/template_management/value_objects/schema_path.ts";
import { SchemaContent } from "../../../lib/domain/generic/template_management/value_objects/schema_content.ts";
import { PromptPath } from "../../../lib/domain/generic/template_management/value_objects/prompt_path.ts";
import { PromptContent } from "../../../lib/domain/generic/template_management/value_objects/prompt_content.ts";
import { TemplateRequest } from "../../../lib/domain/generic/template_management/value_objects/template_request.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";

const logger = new BreakdownLogger("value-objects-test");

// SchemaPath Value Object テスト
Deno.test("SchemaPath: creates valid schema path", () => {
  logger.debug("SchemaPath作成テスト開始", {
    testType: "unit",
    target: "SchemaPath.create",
  });

  const pathResult = SchemaPath.create("find/bugs/base.schema.md");

  logger.debug("SchemaPath作成結果", {
    success: pathResult.ok,
    path: pathResult.ok ? pathResult.data.getValue() : pathResult.error,
  });

  assertEquals(pathResult.ok, true);
  if (pathResult.ok) {
    assertEquals(pathResult.data.getValue(), "find/bugs/base.schema.md");
  }
});

Deno.test("SchemaPath: rejects invalid schema path", () => {
  logger.debug("SchemaPath無効パステスト開始", {
    testType: "unit",
    target: "SchemaPath.create (invalid)",
  });

  const emptyPathResult = SchemaPath.create("");
  const invalidExtensionResult = SchemaPath.create("invalid.txt");

  logger.debug("SchemaPath無効パス結果", {
    emptyPathSuccess: emptyPathResult.ok,
    invalidExtensionSuccess: invalidExtensionResult.ok,
  });

  assertEquals(emptyPathResult.ok, false);
  assertEquals(invalidExtensionResult.ok, false);
});

Deno.test("SchemaPath: ensures value object equality", () => {
  logger.debug("SchemaPath等価性テスト開始", {
    testType: "unit",
    target: "SchemaPath equality",
  });

  const path1Result = SchemaPath.create("to/project/base.schema.md");
  const path2Result = SchemaPath.create("to/project/base.schema.md");

  if (path1Result.ok && path2Result.ok) {
    logger.debug("SchemaPath等価性確認", {
      path1: path1Result.data.getValue(),
      path2: path2Result.data.getValue(),
      areEqual: path1Result.data.getValue() === path2Result.data.getValue(),
    });

    assertEquals(path1Result.data.getValue(), path2Result.data.getValue());
  }
});

// SchemaContent Value Object テスト
Deno.test("SchemaContent: creates valid schema content", () => {
  logger.debug("SchemaContent作成テスト開始", {
    testType: "unit",
    target: "SchemaContent.create",
  });

  const content = `{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "test": { "type": "string" }
    }
  }`;

  const contentResult = SchemaContent.create(content);

  logger.debug("SchemaContent作成結果", {
    success: contentResult.ok,
    hasContent: contentResult.ok ? contentResult.data.getValue().length > 0 : false,
  });

  assertEquals(contentResult.ok, true);
  if (contentResult.ok) {
    assertEquals(contentResult.data.getValue(), content);
  }
});

Deno.test("SchemaContent: rejects empty content", () => {
  logger.debug("SchemaContent空コンテンツテスト開始", {
    testType: "unit",
    target: "SchemaContent.create (empty)",
  });

  const emptyContentResult = SchemaContent.create("");

  logger.debug("SchemaContent空コンテンツ結果", {
    success: emptyContentResult.ok,
    error: emptyContentResult.ok ? null : emptyContentResult.error,
  });

  assertEquals(emptyContentResult.ok, false);
});

// PromptPath Value Object テスト
Deno.test("PromptPath: creates valid prompt path", () => {
  logger.debug("PromptPath作成テスト開始", {
    testType: "unit",
    target: "PromptPath.create",
  });

  const pathResult = PromptPath.create("to/project/f_project.md");

  logger.debug("PromptPath作成結果", {
    success: pathResult.ok,
    path: pathResult.ok ? pathResult.data.getValue() : pathResult.error,
  });

  assertEquals(pathResult.ok, true);
  if (pathResult.ok) {
    assertEquals(pathResult.data.getValue(), "to/project/f_project.md");
  }
});

Deno.test("PromptPath: rejects invalid prompt path", () => {
  logger.debug("PromptPath無効パステスト開始", {
    testType: "unit",
    target: "PromptPath.create (invalid)",
  });

  const emptyPathResult = PromptPath.create("");
  const invalidExtensionResult = PromptPath.create("invalid.txt");

  logger.debug("PromptPath無効パス結果", {
    emptyPathSuccess: emptyPathResult.ok,
    invalidExtensionSuccess: invalidExtensionResult.ok,
  });

  assertEquals(emptyPathResult.ok, false);
  assertEquals(invalidExtensionResult.ok, false);
});

// PromptContent Value Object テスト
Deno.test("PromptContent: creates valid prompt content", () => {
  logger.debug("PromptContent作成テスト開始", {
    testType: "unit",
    target: "PromptContent.create",
  });

  const content = `# Project Conversion Template

Please convert the provided input into a structured project format.

## Input
{input_text_file}
{input_text}

## Output
{destination_path}`;

  const contentResult = PromptContent.create(content);

  logger.debug("PromptContent作成結果", {
    success: contentResult.ok,
    hasContent: contentResult.ok ? contentResult.data.getValue().length > 0 : false,
    hasTemplateVariables: contentResult.ok ? contentResult.data.getValue().includes("{") : false,
  });

  assertEquals(contentResult.ok, true);
  if (contentResult.ok) {
    assertEquals(contentResult.data.getValue(), content);
    assertEquals(contentResult.data.getValue().includes("{input_text_file}"), true);
  }
});

// TemplateRequest Value Object テスト
Deno.test("TemplateRequest: creates valid template request", () => {
  logger.debug("TemplateRequest作成テスト開始", {
    testType: "unit",
    target: "TemplateRequest.create",
  });

  const directiveResult = DirectiveType.createWithPattern("to", "^(to|summary|defect)$");
  const layerResult = LayerType.createWithPattern("project", "^(project|issue|task)$");

  if (!directiveResult.ok || !layerResult.ok) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult.data,
    layer: layerResult.data,
    adaptation: undefined,
    fromLayer: undefined,
  });

  logger.debug("TemplateRequest作成結果", {
    success: requestResult.ok,
    directive: requestResult.ok ? requestResult.data.getDirective().getValue() : null,
    layer: requestResult.ok ? requestResult.data.getLayer().getValue() : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok) {
    assertEquals(requestResult.data.getDirective().getValue(), "to");
    assertEquals(requestResult.data.getLayer().getValue(), "project");
  }
});

Deno.test("TemplateRequest: creates request with adaptation", () => {
  logger.debug("TemplateRequest適応タイプ付き作成テスト開始", {
    testType: "unit",
    target: "TemplateRequest.create (with adaptation)",
  });

  const directiveResult = DirectiveType.createWithPattern("summary", "^(to|summary|defect)$");
  const layerResult = LayerType.createWithPattern("issue", "^(project|issue|task)$");

  if (!directiveResult.ok || !layerResult.ok) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult.data,
    layer: layerResult.data,
    adaptation: "detailed",
    fromLayer: undefined,
  });

  logger.debug("TemplateRequest適応タイプ付き作成結果", {
    success: requestResult.ok,
    adaptation: requestResult.ok ? requestResult.data.getAdaptation() : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok) {
    assertEquals(requestResult.data.getAdaptation(), "detailed");
  }
});

Deno.test("TemplateRequest: creates request with fromLayer", () => {
  logger.debug("TemplateRequest fromLayer付き作成テスト開始", {
    testType: "unit",
    target: "TemplateRequest.create (with fromLayer)",
  });

  const directiveResult = DirectiveType.createWithPattern("to", "^(to|summary|defect)$");
  const layerResult = LayerType.createWithPattern("task", "^(project|issue|task)$");
  const fromLayerResult = LayerType.createWithPattern("issue", "^(project|issue|task)$");

  if (!directiveResult.ok || !layerResult.ok || !fromLayerResult.ok) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult.data,
    layer: layerResult.data,
    adaptation: undefined,
    fromLayer: fromLayerResult.data,
  });

  logger.debug("TemplateRequest fromLayer付き作成結果", {
    success: requestResult.ok,
    fromLayer: requestResult.ok ? requestResult.data.getFromLayer()?.getValue() : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok) {
    assertExists(requestResult.data.getFromLayer());
    assertEquals(requestResult.data.getFromLayer()!.getValue(), "issue");
  }
});

Deno.test("Value Objects: maintain immutability", () => {
  logger.debug("Value Object不変性テスト開始", {
    testType: "unit",
    target: "Value Object immutability",
  });

  const pathResult = SchemaPath.create("to/project/base.schema.md");
  const contentResult = SchemaContent.create('{"test": "content"}');

  if (pathResult.ok && contentResult.ok) {
    const originalPath = pathResult.data.getValue();
    const originalContent = contentResult.data.getValue();

    logger.debug("Value Object不変性確認", {
      pathImmutable: pathResult.data.getValue() === originalPath,
      contentImmutable: contentResult.data.getValue() === originalContent,
    });

    // Value Objectの値は変更されない
    assertEquals(pathResult.data.getValue(), originalPath);
    assertEquals(contentResult.data.getValue(), originalContent);
  }
});