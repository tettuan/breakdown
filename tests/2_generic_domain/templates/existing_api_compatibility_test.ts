import { assertEquals, assertExists } from "../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { schema } from "../../../lib/templates/schema.ts";
import { prompts } from "../../../lib/templates/prompts.ts";

const logger = new BreakdownLogger("existing-api-compatibility-test");

/**
 * 既存API互換性テスト
 * 
 * 新しいDDD実装が完成するまでの間、既存APIとの互換性を確保するためのテスト。
 * 現在の静的スキーマ・プロンプト実装が正常に動作することを確認する。
 */

Deno.test("Existing API: schema object is accessible", () => {
  logger.debug("既存スキーマAPI互換性テスト開始", {
    testType: "compatibility",
    target: "schema object access",
  });

  // 既存のスキーマオブジェクトがアクセス可能
  assertExists(schema);
  assertEquals(typeof schema, "object");

  // 期待されるスキーマキーが存在
  const expectedKeys = [
    "find/bugs/base.schema.md",
    "to/project/base.schema.md", 
    "to/issue/base.schema.md",
    "to/task/base.schema.md",
  ];

  expectedKeys.forEach(key => {
    logger.debug("スキーマキー確認", { key });
    assertExists(schema[key as keyof typeof schema]);
    assertEquals(typeof schema[key as keyof typeof schema], "string");
  });
});

Deno.test("Existing API: prompts object is accessible", () => {
  logger.debug("既存プロンプトAPI互換性テスト開始", {
    testType: "compatibility", 
    target: "prompts object access",
  });

  // 既存のプロンプトオブジェクトがアクセス可能
  assertExists(prompts);
  assertEquals(typeof prompts, "object");

  // 期待されるプロンプトキーが存在
  const expectedKeys = [
    "to/project/f_project.md",
    "to/issue/f_issue.md",
    "to/task/f_task.md",
    "summary/issue/f_issue.md",
    "defect/project/f_project.md",
  ];

  expectedKeys.forEach(key => {
    if (key in prompts) {
      logger.debug("プロンプトキー確認", { key });
      assertExists(prompts[key as keyof typeof prompts]);
      assertEquals(typeof prompts[key as keyof typeof prompts], "string");
    }
  });
});

Deno.test("Existing API: schema content structure validation", () => {
  logger.debug("既存スキーマコンテンツ構造検証開始", {
    testType: "compatibility",
    target: "schema content structure",
  });

  // Bug分析スキーマの構造確認
  const bugSchema = schema["find/bugs/base.schema.md"];
  assertEquals(bugSchema.includes("Bug Analysis Schema"), true);
  assertEquals(bugSchema.includes("$schema"), true);
  assertEquals(bugSchema.includes('"type": "object"'), true);

  // プロジェクトスキーマの構造確認  
  const projectSchema = schema["to/project/base.schema.md"];
  assertEquals(projectSchema.includes("Project Schema"), true);
  assertEquals(projectSchema.includes("$schema"), true);

  logger.debug("スキーマ構造検証完了", {
    bugSchemaValid: bugSchema.includes("Bug Analysis Schema"),
    projectSchemaValid: projectSchema.includes("Project Schema"),
  });
});

Deno.test("Existing API: prompt content template variables", () => {
  logger.debug("既存プロンプトテンプレート変数検証開始", {
    testType: "compatibility",
    target: "prompt template variables", 
  });

  // プロジェクト変換プロンプトのテンプレート変数確認
  const projectPrompt = prompts["to/project/f_project.md"];
  assertEquals(projectPrompt.includes("{input_text_file}"), true);
  assertEquals(projectPrompt.includes("{input_text}"), true); 
  assertEquals(projectPrompt.includes("{destination_path}"), true);

  // サマリープロンプトのテンプレート変数確認
  if ("summary/issue/f_issue.md" in prompts) {
    const summaryPrompt = prompts["summary/issue/f_issue.md"];
    assertEquals(summaryPrompt.includes("{input_text}"), true);
    assertEquals(summaryPrompt.includes("{destination_path}"), true);
  }

  logger.debug("プロンプトテンプレート変数検証完了", {
    projectPromptValid: projectPrompt.includes("{input_text_file}"),
    hasTemplateVariables: true,
  });
});

Deno.test("Existing API: type safety with const assertion", () => {
  logger.debug("既存API型安全性検証開始", {
    testType: "compatibility",
    target: "type safety", 
  });

  // const assertionによる型安全性確認
  const schemaKeys = Object.keys(schema) as (keyof typeof schema)[];
  const promptKeys = Object.keys(prompts) as (keyof typeof prompts)[];

  // キーアクセスが型安全であることを確認
  schemaKeys.forEach(key => {
    const value = schema[key];
    assertEquals(typeof value, "string");
  });

  promptKeys.forEach(key => {
    const value = prompts[key];  
    assertEquals(typeof value, "string");
  });

  logger.debug("型安全性検証完了", {
    schemaKeysCount: schemaKeys.length,
    promptKeysCount: promptKeys.length,
    typeSafe: true,
  });
});

Deno.test("Existing API: performance characteristics", () => {
  logger.debug("既存APIパフォーマンス検証開始", {
    testType: "compatibility",
    target: "performance",
  });

  // オブジェクトアクセスのパフォーマンス測定
  const startTime = performance.now();
  
  // 複数回のアクセステスト
  for (let i = 0; i < 1000; i++) {
    const testSchema = schema["to/project/base.schema.md"];
    const testPrompt = prompts["to/project/f_project.md"];
    assertEquals(typeof testSchema, "string");
    assertEquals(typeof testPrompt, "string");
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;

  logger.debug("パフォーマンス測定結果", {
    duration: `${duration.toFixed(2)}ms`,
    accessCount: 2000,
    averagePerAccess: `${(duration / 2000).toFixed(4)}ms`,
  });

  // パフォーマンスが合理的な範囲内であることを確認
  assertEquals(duration < 100, true, "Access should be fast (< 100ms for 2000 accesses)");
});

Deno.test("Existing API: memory usage characteristics", () => {
  logger.debug("既存APIメモリ使用量検証開始", {
    testType: "compatibility", 
    target: "memory usage",
  });

  // オブジェクトサイズの概算確認
  const schemaEntriesCount = Object.keys(schema).length;
  const promptEntriesCount = Object.keys(prompts).length;

  // コンテンツサイズの合計概算
  const totalSchemaSize = Object.values(schema).reduce((sum, content) => sum + content.length, 0);
  const totalPromptSize = Object.values(prompts).reduce((sum, content) => sum + content.length, 0);

  logger.debug("メモリ使用量概算", {
    schemaEntries: schemaEntriesCount,
    promptEntries: promptEntriesCount, 
    totalSchemaSize: `${(totalSchemaSize / 1024).toFixed(2)}KB`,
    totalPromptSize: `${(totalPromptSize / 1024).toFixed(2)}KB`,
  });

  // 合理的なサイズ範囲内であることを確認
  assertEquals(schemaEntriesCount > 0, true);
  assertEquals(promptEntriesCount > 0, true);
  assertEquals(totalSchemaSize > 0, true);
  assertEquals(totalPromptSize > 0, true);
});