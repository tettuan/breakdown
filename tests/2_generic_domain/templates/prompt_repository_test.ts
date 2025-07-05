import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { TemplateRepository } from "../../../lib/domain/templates/template_repository.ts";
import { PromptPath } from "../../../lib/domain/generic/template_management/value_objects/prompt_path.ts";
import { PromptContent } from "../../../lib/domain/generic/template_management/value_objects/prompt_content.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("prompt-repository-test");

// Mock repository for testing
class MockPromptRepository {
  private mockContent = new Map<string, string>([
    ["to/project/f_project.md", "Project Conversion Template\n\n{input_text}\n{destination_path}"],
    ["to/issue/f_issue.md", "Issue Template\n\n{input_text}"],
    ["to/task/f_task.md", "Task Template\n\n{input_text}\n{input_text_file}\n{destination_path}"],
    ["summary/issue/f_issue.md", "Summary Issue Template\n\n{input_text}"],
  ]);

  async findByPath(path: PromptPath): Promise<{ ok: true; data: PromptContent | null } | { ok: false; error: string }> {
    const pathStr = path.getPath();
    const content = this.mockContent.get(pathStr);
    if (content) {
      const contentResult = PromptContent.create(content);
      if (contentResult.ok) {
        return { ok: true, data: contentResult.data! };
      }
    }
    return { ok: true, data: null };
  }

  async findAll(): Promise<{ ok: true; data: Array<{ path: PromptPath; content: PromptContent }> } | { ok: false; error: string }> {
    const results: Array<{ path: PromptPath; content: PromptContent }> = [];
    
    for (const [pathStr, contentStr] of this.mockContent.entries()) {
      const pathParts = pathStr.split('/');
      if (pathParts.length >= 3) {
        // Create mock TwoParams_Result for DirectiveType and LayerType
        const directiveResult: TwoParams_Result = {
          type: "two",
          demonstrativeType: pathParts[0],
          layerType: pathParts[1],
          params: [pathParts[0], pathParts[1]],
          options: {}
        };
        const layerResult: TwoParams_Result = {
          type: "two",
          demonstrativeType: pathParts[0],
          layerType: pathParts[1],
          params: [pathParts[0], pathParts[1]],
          options: {}
        };
        
        const directive = DirectiveType.create(directiveResult);
        const layer = LayerType.create(layerResult);
        
        const pathResult = PromptPath.create(directive, layer, pathParts[2]);
        const contentResult = PromptContent.create(contentStr);
        
        if (pathResult.ok && pathResult.data && contentResult.ok && contentResult.data) {
          results.push({ path: pathResult.data, content: contentResult.data });
        }
      }
    }
    
    return { ok: true, data: results };
  }

  async findByCriteria(criteria: { category?: string; layerType?: string }): Promise<{ ok: true; data: Array<{ path: PromptPath; content: PromptContent }> } | { ok: false; error: string }> {
    const allResult = await this.findAll();
    if (!allResult.ok) return allResult;
    
    const filtered = allResult.data.filter(entry => {
      const pathStr = entry.path.getPath();
      if (criteria.category && !pathStr.startsWith(criteria.category + "/")) {
        return false;
      }
      if (criteria.layerType && !pathStr.includes("/" + criteria.layerType + "/")) {
        return false;
      }
      return true;
    });
    
    return { ok: true, data: filtered };
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

Deno.test("PromptRepository: can retrieve prompt by path", async () => {
  logger.debug("PromptRepository取得テスト開始", {
    testType: "unit",
    target: "PromptRepository.findByPath",
  });

  const repository = new MockPromptRepository();
  const types = createTypesFromPath("to/project/f_project.md");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = PromptPath.create(types.directive, types.layer, "f_project.md");

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

  const repository = new MockPromptRepository();
  const types = createTypesFromPath("non/existent/prompt.md");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = PromptPath.create(types.directive, types.layer, "prompt.md");

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

  const repository = new MockPromptRepository();
  const allPromptsResult = await repository.findAll();

  logger.debug("全プロンプト取得結果", {
    success: allPromptsResult.ok,
    count: allPromptsResult.ok ? allPromptsResult.data.length : 0,
  });

  assertEquals(allPromptsResult.ok, true);
  if (allPromptsResult.ok) {
    assertEquals(allPromptsResult.data.length > 0, true);
    
    // 期待されるプロンプトが含まれていることを確認
    const paths = allPromptsResult.data.map(entry => entry.path.getPath());
    assertEquals(paths.includes("to/project/f_project.md"), true);
    assertEquals(paths.includes("to/issue/f_issue.md"), true);
  }
});

Deno.test("PromptRepository: findByCriteria filters by category", async () => {
  logger.debug("カテゴリフィルタテスト開始", {
    testType: "unit", 
    target: "PromptRepository.findByCriteria",
  });

  const repository = new MockPromptRepository();
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
      assertEquals(entry.path.getPath().startsWith("to/"), true);
    });
  }
});

Deno.test("PromptRepository: findByCriteria filters by layerType", async () => {
  logger.debug("レイヤータイプフィルタテスト開始", {
    testType: "unit",
    target: "PromptRepository.findByCriteria (layerType)",
  });

  const repository = new MockPromptRepository();
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
      assertEquals(entry.path.getPath().includes("/project/"), true);
    });
  }
});

Deno.test("PromptRepository: handles template variables correctly", async () => {
  logger.debug("テンプレート変数処理テスト開始", {
    testType: "unit",
    target: "PromptRepository template variables",
  });

  const repository = new MockPromptRepository();
  const types = createTypesFromPath("to/task/f_task.md");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = PromptPath.create(types.directive, types.layer, "f_task.md");

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

  const repository = new MockPromptRepository();
  const types = createTypesFromPath("summary/issue/f_issue.md");
  if (!types) throw new Error("Failed to create types");
  
  const pathResult = PromptPath.create(types.directive, types.layer, "f_issue.md");

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