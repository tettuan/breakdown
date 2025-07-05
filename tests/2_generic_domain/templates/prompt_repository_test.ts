import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TemplateRepository } from "../../../lib/domain/templates/template_repository.ts";
// import { PromptContent } from "../../../lib/domain/templates/value_objects/prompt_content.ts";
// import { PromptPath } from "../../../lib/domain/templates/value_objects/prompt_path.ts";

const logger = new BreakdownLogger("prompt-repository-test");

Deno.test("PromptRepository: can retrieve prompt by path", async () => {
  logger.debug("PromptRepository取得テスト開始", {
    testType: "unit",
    target: "PromptRepository.findByPath",
  });

  const repository = new PromptRepository();
  const pathResult = PromptPath.create("to/project/f_project.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create prompt path: ${pathResult.error}`);
  }

  const promptResult = await repository.findByPath(pathResult.data);

  logger.debug("プロンプト取得結果", {
    success: promptResult.ok,
    hasContent: promptResult.ok ? promptResult.data !== null : false,
  });

  assertEquals(promptResult.ok, true);
  if (promptResult.ok && promptResult.data) {
    assertExists(promptResult.data);
    assertEquals(promptResult.data.getValue().includes("Project Conversion Template"), true);
  }
});

Deno.test("PromptRepository: returns null for non-existent prompt", async () => {
  logger.debug("存在しないプロンプトテスト開始", {
    testType: "unit",
    target: "PromptRepository.findByPath (non-existent)",
  });

  const repository = new PromptRepository();
  const pathResult = PromptPath.create("non/existent/prompt.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create prompt path: ${pathResult.error}`);
  }

  const promptResult = await repository.findByPath(pathResult.data);

  logger.debug("存在しないプロンプト取得結果", {
    success: promptResult.ok,
    data: promptResult.ok ? promptResult.data : promptResult.error,
  });

  assertEquals(promptResult.ok, true);
  assertEquals(promptResult.data, null);
});

Deno.test("PromptRepository: findAll returns all available prompts", async () => {
  logger.debug("全プロンプト取得テスト開始", {
    testType: "unit",
    target: "PromptRepository.findAll",
  });

  const repository = new PromptRepository();
  const allPromptsResult = await repository.findAll();

  logger.debug("全プロンプト取得結果", {
    success: allPromptsResult.ok,
    count: allPromptsResult.ok ? allPromptsResult.data.length : 0,
  });

  assertEquals(allPromptsResult.ok, true);
  if (allPromptsResult.ok) {
    assertEquals(allPromptsResult.data.length > 0, true);
    
    // 期待されるプロンプトが含まれていることを確認
    const paths = allPromptsResult.data.map(entry => entry.path.getValue());
    assertEquals(paths.includes("to/project/f_project.md"), true);
    assertEquals(paths.includes("to/issue/f_issue.md"), true);
  }
});

Deno.test("PromptRepository: findByCriteria filters by category", async () => {
  logger.debug("カテゴリフィルタテスト開始", {
    testType: "unit", 
    target: "PromptRepository.findByCriteria",
  });

  const repository = new PromptRepository();
  const criteria = { category: "to" };
  const filteredResult = await repository.findByCriteria(criteria);

  logger.debug("カテゴリフィルタ結果", {
    success: filteredResult.ok,
    count: filteredResult.ok ? filteredResult.data.length : 0,
  });

  assertEquals(filteredResult.ok, true);
  if (filteredResult.ok) {
    assertEquals(filteredResult.data.length > 0, true);
    
    // すべての結果が"to"カテゴリであることを確認
    filteredResult.data.forEach(entry => {
      assertEquals(entry.path.getValue().startsWith("to/"), true);
    });
  }
});

Deno.test("PromptRepository: findByCriteria filters by layerType", async () => {
  logger.debug("レイヤータイプフィルタテスト開始", {
    testType: "unit",
    target: "PromptRepository.findByCriteria (layerType)",
  });

  const repository = new PromptRepository();
  const criteria = { layerType: "project" };
  const filteredResult = await repository.findByCriteria(criteria);

  logger.debug("レイヤータイプフィルタ結果", {
    success: filteredResult.ok,
    count: filteredResult.ok ? filteredResult.data.length : 0,
  });

  assertEquals(filteredResult.ok, true);
  if (filteredResult.ok) {
    assertEquals(filteredResult.data.length > 0, true);
    
    // すべての結果が"project"レイヤーであることを確認
    filteredResult.data.forEach(entry => {
      assertEquals(entry.path.getValue().includes("/project/"), true);
    });
  }
});

Deno.test("PromptRepository: handles template variables correctly", async () => {
  logger.debug("テンプレート変数処理テスト開始", {
    testType: "unit",
    target: "PromptRepository template variables",
  });

  const repository = new PromptRepository();
  const pathResult = PromptPath.create("to/task/f_task.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create prompt path: ${pathResult.error}`);
  }

  const promptResult = await repository.findByPath(pathResult.data);

  if (promptResult.ok && promptResult.data) {
    const content = promptResult.data.getValue();
    
    logger.debug("テンプレート変数確認", {
      hasInputText: content.includes("{input_text}"),
      hasInputTextFile: content.includes("{input_text_file}"),
      hasDestinationPath: content.includes("{destination_path}"),
      contentLength: content.length,
    });

    // テンプレート変数が適切に含まれていることを確認
    assertEquals(content.includes("{input_text}"), true);
    assertEquals(content.includes("{destination_path}"), true);
  }
});

Deno.test("PromptRepository: prompt content is properly typed", async () => {
  logger.debug("プロンプトコンテンツ型安全性テスト開始", {
    testType: "unit",
    target: "PromptContent type safety",
  });

  const repository = new PromptRepository();
  const pathResult = PromptPath.create("summary/issue/f_issue.md");

  if (!pathResult.ok) {
    throw new Error(`Failed to create prompt path: ${pathResult.error}`);
  }

  const promptResult = await repository.findByPath(pathResult.data);

  if (promptResult.ok && promptResult.data) {
    const content = promptResult.data;
    
    logger.debug("プロンプトコンテンツ検証", {
      hasValue: content.getValue().length > 0,
      isString: typeof content.getValue() === "string",
      containsTemplate: content.getValue().includes("Template"),
    });

    // PromptContentのValueObjectとしての動作確認
    assertEquals(typeof content.getValue(), "string");
    assertEquals(content.getValue().length > 0, true);
  }
});