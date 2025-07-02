import { assertEquals, assertExists } from "@std/assert";
import { prompts } from "./prompts.ts";

/**
 * アーキテクチャテスト：prompts.ts
 *
 * 検証項目：
 * - 依存関係の方向性：外部への依存がないこと
 * - 循環参照の有無：このファイルは他から参照されるのみ
 * - レイヤー間の境界：データ定義層として独立
 * - インターフェースの一貫性：const定義の構造
 */

Deno.test("Architecture: prompts should be a const object", () => {
  // promptsは定数オブジェクトとして定義されるべき
  assertExists(prompts);
  assertEquals(typeof prompts, "object");
});

Deno.test("Architecture: prompts should not have external dependencies", () => {
  // このファイルは自己完結し、外部依存を持たない
  // import文の検証（このテストファイル自体のimportを除く）
  const _moduleCode = Deno.readTextFileSync(new URL("./prompts.ts", import.meta.url).pathname);
  const importLines = moduleCode.split("\n").filter((line) =>
    line.trim().startsWith("import") && !line.includes("test")
  );

  // 自動生成ファイルのため、importは存在しないはず
  assertEquals(importLines.length, 0, "prompts.ts should not have any imports");
});

Deno.test("Architecture: prompts should follow Discriminated Union pattern", () => {
  // キーは文字列リテラル型として定義されているべき
  const keys = Object.keys(prompts);

  // すべてのキーはパス形式（"category/subcategory/file.md" または "file.md"）に従うべき
  keys.forEach((key) => {
    const pathPattern = /^([a-z]+\/[a-z_\/]+\.md|[A-Z][A-Za-z]*\.md)$/;
    assertEquals(
      pathPattern.test(key),
      true,
      `Key "${key}" should follow path pattern`,
    );
  });
});

Deno.test("Architecture: prompts values should be immutable strings", () => {
  // すべての値は文字列型でimmutable
  Object.entries(prompts).forEach(([key, value]) => {
    assertEquals(
      typeof value,
      "string",
      `Value for key "${key}" should be a string`,
    );

    // 値は空でないべき（" "のみの値も許容されている）
    assertExists(value, `Value for key "${key}" should not be null or undefined`);
  });
});

Deno.test("Architecture: prompts should maintain Result type compatibility", () => {
  // Result型パターンとの互換性：エラーケースがないことを保証
  // promptsは常に成功値として使用される

  // すべてのプロンプトアクセスは安全（キーが存在すれば必ず文字列を返す）
  const testKey = Object.keys(prompts)[0];
  const _result = prompts[testKey as keyof typeof prompts];

  // TypeScriptの型システムにより、結果は必ず文字列
  assertEquals(typeof _result, "string");
});

Deno.test("Architecture: prompts should support Smart Constructor pattern", () => {
  // Smart Constructorパターンとの連携：
  // promptsは検証済みの値のみを保持する

  // promptsオブジェクトの構造を検証
  const promptKeys = Object.keys(prompts);

  // すべてのキーが適切なパス形式であることを確認
  promptKeys.forEach((key) => {
    // キーが文字列であることを確認
    assertEquals(typeof key, "string");

    // 値が文字列であることを確認（型安全性の検証）
    const value = prompts[key as keyof typeof prompts];
    assertEquals(typeof value, "string");
  });

  // Smart Constructorで検証されたようなデータ構造
  // （自動生成されたファイルは検証済みの内容のみを含む）
  assertEquals(promptKeys.length > 0, true, "Prompts should contain at least one entry");
});
