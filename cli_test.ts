import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { toJSON, toMarkdown } from "./lib/mod.ts";

// モックデータ
const mockInput = "test_input.md";
const mockOutput = "test_output";

Deno.test("toJSON - project conversion", async () => {
  const result = await toJSON("project", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - issue conversion", async () => {
  const result = await toJSON("issue", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - task conversion", async () => {
  const result = await toJSON("task", mockInput, mockOutput);
  assertEquals(result.success, true);
});


Deno.test("toMarkdown - project conversion", async () => {
  const result = await toMarkdown("project", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toMarkdown - issue conversion", async () => {
  const result = await toMarkdown("issue", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toMarkdown - task conversion", async () => {
  const result = await toMarkdown("task", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - should reject invalid type at compile time", () => {
  // 型エラーが発生することを確認するためのテスト
  const typeCheckError = () => {
    // @ts-expect-error - "invalid" は "project" | "issue" | "task" に代入できないはず
    return toJSON("invalid", "test content", "test_output");
  };
  
  // 型チェックエラーが発生することを期待
  // 実行時にはこのテストは常に成功します
  assert(true, "Type check should fail at compile time");
});

// 有効な型の場合のテストも追加しておくと良いでしょう
Deno.test("toJSON - should accept valid type", async () => {
  const result = await toJSON("project", "test content", "test_output");
  assertEquals(result.success, true);
}); 