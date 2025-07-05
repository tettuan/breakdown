import { assertEquals, assertExists } from "../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { SchemaPath } from "../../../lib/domain/generic/template_management/value_objects/schema_path.ts";
import { SchemaContent } from "../../../lib/domain/generic/template_management/value_objects/schema_content.ts";
import { PromptPath } from "../../../lib/domain/generic/template_management/value_objects/prompt_path.ts";
import { PromptContent } from "../../../lib/domain/generic/template_management/value_objects/prompt_content.ts";
import { TemplateRequest } from "../../../lib/domain/generic/template_management/value_objects/template_request.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../lib/deps.ts";

// Helper function to create DirectiveType and LayerType for testing
function createTestTypes(directive: string, layer: string): { directive: DirectiveType; layer: LayerType } {
  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: directive,
    layerType: layer,
    params: [directive, layer],
    options: {}
  };
  
  const directiveResult = DirectiveType.create(twoParamsResult);
  const layerResult = LayerType.create(twoParamsResult);
  
  if (!directiveResult || !layerResult) {
    throw new Error(`Failed to create test types: directive=${directiveResult ? 'ok' : 'null'}, layer=${layerResult ? 'ok' : 'null'}`);
  }
  
  return {
    directive: directiveResult,
    layer: layerResult
  };
}

const logger = new BreakdownLogger("value-objects-test");

// SchemaPath Value Object テスト
Deno.test("SchemaPath: creates valid schema path", () => {
  logger.debug("SchemaPath作成テスト開始", {
    testType: "unit",
    target: "SchemaPath.create",
  });

  const types = createTestTypes("find", "bugs");
  const pathResult = SchemaPath.create(types.directive, types.layer, "base.json");

  logger.debug("SchemaPath作成結果", {
    success: pathResult.ok,
    path: pathResult.ok ? pathResult.data!.getPath() : pathResult.error,
  });

  assertEquals(pathResult.ok, true);
  if (pathResult.ok && pathResult.data) {
    assertEquals(pathResult.data.getPath(), "find/bugs/base.json");
  }
});

Deno.test("SchemaPath: rejects invalid schema path", () => {
  logger.debug("SchemaPath無効パステスト開始", {
    testType: "unit",
    target: "SchemaPath.create (invalid)",
  });

  const types = createTestTypes("test", "layer");
  const emptyPathResult = SchemaPath.create(types.directive, types.layer, "");
  const invalidExtensionResult = SchemaPath.create(types.directive, types.layer, "invalid.txt");

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

  const types = createTestTypes("to", "project");
  const path1Result = SchemaPath.create(types.directive, types.layer, "base.json");
  const path2Result = SchemaPath.create(types.directive, types.layer, "base.json");

  if (path1Result.ok && path2Result.ok && path1Result.data && path2Result.data) {
    logger.debug("SchemaPath等価性確認", {
      path1: path1Result.data.getPath(),
      path2: path2Result.data.getPath(),
      areEqual: path1Result.data.getPath() === path2Result.data.getPath(),
    });

    assertEquals(path1Result.data.getPath(), path2Result.data.getPath());
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
    hasContent: contentResult.ok && contentResult.data ? contentResult.data.getValue().length > 0 : false,
  });

  assertEquals(contentResult.ok, true);
  if (contentResult.ok && contentResult.data) {
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

  const types = createTestTypes("to", "project");
  const pathResult = PromptPath.create(types.directive, types.layer, "f_project.md");

  logger.debug("PromptPath作成結果", {
    success: pathResult.ok,
    path: pathResult.ok ? pathResult.data!.getPath() : pathResult.error,
  });

  assertEquals(pathResult.ok, true);
  if (pathResult.ok && pathResult.data) {
    assertEquals(pathResult.data.getPath(), "to/project/f_project.md");
  }
});

Deno.test("PromptPath: rejects invalid prompt path", () => {
  logger.debug("PromptPath無効パステスト開始", {
    testType: "unit",
    target: "PromptPath.create (invalid)",
  });

  const types = createTestTypes("test", "layer");
  const emptyPathResult = PromptPath.create(types.directive, types.layer, "");
  const invalidExtensionResult = PromptPath.create(types.directive, types.layer, "invalid.txt");

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
    hasContent: contentResult.ok && contentResult.data ? contentResult.data.getValue().length > 0 : false,
    hasTemplateVariables: contentResult.ok && contentResult.data ? contentResult.data.getValue().includes("{") : false,
  });

  assertEquals(contentResult.ok, true);
  if (contentResult.ok && contentResult.data) {
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

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {}
  };
  
  const directiveResult = DirectiveType.create(twoParamsResult);
  const layerResult = LayerType.create(twoParamsResult);

  if (!directiveResult || !layerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: undefined,
    fromLayer: undefined,
  });

  logger.debug("TemplateRequest作成結果", {
    success: requestResult.ok,
    directive: requestResult.ok && requestResult.data ? requestResult.data.directive.getValue() : null,
    layer: requestResult.ok && requestResult.data ? requestResult.data.layer.getValue() : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok && requestResult.data) {
    assertEquals(requestResult.data.directive.getValue(), "to");
    assertEquals(requestResult.data.layer.getValue(), "project");
  }
});

Deno.test("TemplateRequest: creates request with adaptation", () => {
  logger.debug("TemplateRequest適応タイプ付き作成テスト開始", {
    testType: "unit",
    target: "TemplateRequest.create (with adaptation)",
  });

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {}
  };
  
  const directiveResult = DirectiveType.create(twoParamsResult);
  const layerResult = LayerType.create(twoParamsResult);

  if (!directiveResult || !layerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: "detailed",
    fromLayer: undefined,
  });

  logger.debug("TemplateRequest適応タイプ付き作成結果", {
    success: requestResult.ok,
    adaptation: requestResult.ok && requestResult.data ? requestResult.data.adaptation : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok && requestResult.data) {
    assertEquals(requestResult.data.adaptation, "detailed");
  }
});

Deno.test("TemplateRequest: creates request with fromLayer", () => {
  logger.debug("TemplateRequest fromLayer付き作成テスト開始", {
    testType: "unit",
    target: "TemplateRequest.create (with fromLayer)",
  });

  const twoParamsResultDirective: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    params: ["to", "task"],
    options: {}
  };
  
  const twoParamsResultFromLayer: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue",
    params: ["to", "issue"],
    options: {}
  };
  
  const directiveResult = DirectiveType.create(twoParamsResultDirective);
  const layerResult = LayerType.create(twoParamsResultDirective);
  const fromLayerResult = LayerType.create(twoParamsResultFromLayer);

  if (!directiveResult || !layerResult || !fromLayerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: undefined,
    fromLayer: fromLayerResult,
  });

  logger.debug("TemplateRequest fromLayer付き作成結果", {
    success: requestResult.ok,
    fromLayer: requestResult.ok && requestResult.data ? requestResult.data.fromLayer?.getValue() : null,
  });

  assertEquals(requestResult.ok, true);
  if (requestResult.ok && requestResult.data) {
    assertExists(requestResult.data.fromLayer);
    assertEquals(requestResult.data.fromLayer!.getValue(), "issue");
  }
});

Deno.test("Value Objects: maintain immutability", () => {
  logger.debug("Value Object不変性テスト開始", {
    testType: "unit",
    target: "Value Object immutability",
  });

  const types = createTestTypes("to", "project");
  const pathResult = SchemaPath.create(types.directive, types.layer, "base.json");
  const contentResult = SchemaContent.create('{"test": "content"}');

  if (pathResult.ok && contentResult.ok && pathResult.data && contentResult.data) {
    const originalPath = pathResult.data.getPath();
    const originalContent = contentResult.data.getValue();

    logger.debug("Value Object不変性確認", {
      pathImmutable: pathResult.data.getPath() === originalPath,
      contentImmutable: contentResult.data.getValue() === originalContent,
    });

    // Value Objectの値は変更されない
    assertEquals(pathResult.data.getPath(), originalPath);
    assertEquals(contentResult.data.getValue(), originalContent);
  }
});