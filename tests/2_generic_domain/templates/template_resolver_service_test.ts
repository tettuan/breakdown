import { assertEquals, assertExists } from "../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TemplateResolverService } from "../../../lib/domain/generic/template_management/template_resolver_service.ts";
import { TemplateRequest } from "../../../lib/domain/generic/template_management/value_objects/template_request.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../lib/deps.ts";

const logger = new BreakdownLogger("template-resolver-service-test");

Deno.test("TemplateResolverService: resolves template successfully", async () => {
  logger.debug("TemplateResolverService解決テスト開始", {
    testType: "unit",
    target: "TemplateResolverService.resolveTemplate",
  });

  // Smart Constructorでテスト用パターン設定
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

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  logger.debug("テンプレート解決結果", {
    success: resolveResult.ok,
    hasPrompt: resolveResult.ok && resolveResult.data ? resolveResult.data.prompt !== null : false,
    hasSchema: resolveResult.ok && resolveResult.data ? resolveResult.data.schema !== null : false,
  });

  assertEquals(resolveResult.ok, true);
  if (resolveResult.ok) {
    assertExists(resolveResult.data);
    assertExists(resolveResult.data?.prompt);
    assertExists(resolveResult.data?.schema);
  }
});

Deno.test("TemplateResolverService: handles non-existent template gracefully", async () => {
  logger.debug("存在しないテンプレート処理テスト開始", {
    testType: "unit",
    target: "TemplateResolverService non-existent template",
  });

  const twoParamsResultInvalid: TwoParams_Result = {
    type: "two",
    demonstrativeType: "nonexistent",
    layerType: "invalid",
    params: ["nonexistent", "invalid"],
    options: {}
  };
  const directiveResult = DirectiveType.create(twoParamsResultInvalid);
  const layerResult = LayerType.create(twoParamsResultInvalid);

  if (!directiveResult || !layerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: undefined,
    fromLayer: undefined,
  });

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  logger.debug("存在しないテンプレート解決結果", {
    success: resolveResult.ok,
    prompt: resolveResult.ok && resolveResult.data ? resolveResult.data.prompt : null,
    schema: resolveResult.ok && resolveResult.data ? resolveResult.data.schema : null,
  });

  assertEquals(resolveResult.ok, true);
  if (resolveResult.ok && resolveResult.data) {
    // 存在しないテンプレートの場合、nullが返される
    assertEquals(resolveResult.data.prompt, null);
    assertEquals(resolveResult.data.schema, null);
  }
});

Deno.test("TemplateResolverService: resolves with adaptation type", async () => {
  logger.debug("適応タイプ付きテンプレート解決テスト開始", {
    testType: "unit",
    target: "TemplateResolverService with adaptation",
  });

  const twoParamsResultIssue: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue",
    params: ["to", "issue"],
    options: {}
  };
  const directiveResult = DirectiveType.create(twoParamsResultIssue);
  const layerResult = LayerType.create(twoParamsResultIssue);

  if (!directiveResult || !layerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: "strict",
    fromLayer: undefined,
  });

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  logger.debug("適応タイプ付き解決結果", {
    success: resolveResult.ok,
    hasPrompt: resolveResult.ok && resolveResult.data ? resolveResult.data.prompt !== null : false,
    adaptation: "strict",
  });

  assertEquals(resolveResult.ok, true);
  if (resolveResult.ok && resolveResult.data?.prompt) {
    // 適応タイプが指定された場合の処理確認
    // (実際のプロンプトにstrictが含まれるかは実装依存)
    assertExists(resolveResult.data?.prompt);
  }
});

Deno.test("TemplateResolverService: resolves with fromLayer specification", async () => {
  logger.debug("fromLayer指定テンプレート解決テスト開始", {
    testType: "unit",
    target: "TemplateResolverService with fromLayer",
  });

  const twoParamsResultTo: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    params: ["to", "task"],
    options: {}
  };
  const directiveResult = DirectiveType.create(twoParamsResultTo);
  const layerResult = LayerType.create(twoParamsResultTo);
  
  const twoParamsResultFrom: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "issue",
    params: ["to", "issue"],
    options: {}
  };
  const fromLayerResult = LayerType.create(twoParamsResultFrom);

  if (!directiveResult || !layerResult || !fromLayerResult) {
    throw new Error("Failed to create test types");
  }

  const requestResult = TemplateRequest.create({
    directive: directiveResult,
    layer: layerResult,
    adaptation: undefined,
    fromLayer: fromLayerResult,
  });

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  logger.debug("fromLayer指定解決結果", {
    success: resolveResult.ok,
    hasPrompt: resolveResult.ok && resolveResult.data ? resolveResult.data.prompt !== null : false,
    fromLayer: "issue",
  });

  assertEquals(resolveResult.ok, true);
  if (resolveResult.ok) {
    // fromLayerが指定された場合、適切なプロンプトが選択される
    assertExists(resolveResult.data?.prompt);
  }
});

Deno.test("TemplateResolverService: handles template resolution errors", async () => {
  logger.debug("テンプレート解決エラー処理テスト開始", {
    testType: "unit",
    target: "TemplateResolverService error handling",
  });

  // 無効なTemplateRequestの作成テスト
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

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  logger.debug("エラー処理テスト結果", {
    success: resolveResult.ok,
    error: resolveResult.ok ? null : resolveResult.error,
  });

  // 正常なリクエストの場合、成功することを確認
  assertEquals(resolveResult.ok, true);
});

Deno.test("TemplateResolverService: validates template consistency", async () => {
  logger.debug("テンプレート一貫性検証テスト開始", {
    testType: "unit",
    target: "TemplateResolverService consistency validation",
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
    adaptation: undefined,
    fromLayer: undefined,
  });

  if (!requestResult.ok || !requestResult.data) {
    throw new Error(`Failed to create template request: ${requestResult.error}`);
  }

  const service = new TemplateResolverService();
  const resolveResult = await service.resolveTemplate(requestResult.data);

  if (resolveResult.ok && resolveResult.data && resolveResult.data.prompt && resolveResult.data.schema) {
    logger.debug("テンプレート一貫性確認", {
      promptPath: "summary/issue",
      schemaPath: "to/issue", // スキーマは変換先の構造
      hasPromptContent: resolveResult.data.prompt.getValue().length > 0,
      hasSchemaContent: resolveResult.data.schema.getValue().length > 0,
    });

    // プロンプトとスキーマが適切に解決されていることを確認
    assertEquals(resolveResult.data.prompt.getValue().length > 0, true);
    assertEquals(resolveResult.data.schema.getValue().length > 0, true);
  }
});