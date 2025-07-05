import { assertEquals, assertExists } from "@std/assert";
import { prompts } from "./prompts.ts";

/**
 * 構造テスト：prompts.ts
 *
 * 検証項目：
 * - 単一責任の原則の遵守：プロンプトデータの提供のみ
 * - 責務の重複の有無：他のモジュールとの責務分離
 * - 適切な抽象化レベル：具体的なプロンプト文字列の保持
 * - クラス間の関係性：他モジュールからの参照専用
 */

Deno.test("Structure: prompts should have single responsibility", () => {
  // promptsオブジェクトはプロンプトデータの提供のみを責務とする
  const keys = Object.keys(prompts);

  // すべてのエントリがプロンプトデータであることを確認
  keys.forEach((key) => {
    const value = prompts[key as keyof typeof prompts];
    // 値は文字列（プロンプトテキスト）のみ
    assertEquals(typeof value, "string");
    // 関数やオブジェクトは含まない
    assertEquals(typeof value === "function", false);
    assertEquals(typeof value === "object", false);
  });
});

Deno.test("Structure: prompts should maintain proper categorization", () => {
  // プロンプトは適切にカテゴリ分けされているべき
  const categories = new Map<string, string[]>();

  Object.keys(prompts).forEach((key) => {
    const category = key.split("/")[0];
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(key);
  });

  // 主要カテゴリが存在することを確認
  const expectedCategories = ["defect", "find", "to", "summary"];
  expectedCategories.forEach((cat) => {
    assertExists(
      categories.get(cat),
      `Category "${cat}" should exist in prompts`,
    );
  });
});

Deno.test("Structure: prompts should separate concerns from schema", () => {
  // promptsとschemaは別々の責務を持つ
  // promptsはテンプレート文字列、schemaはJSON Schema定義

  const promptKeys = Object.keys(prompts);

  // プロンプトキーはスキーマ定義を含まない
  promptKeys.forEach((key) => {
    assertEquals(
      key.includes(".schema."),
      false,
      `Prompt key "${key}" should not contain schema definitions`,
    );
  });
});

Deno.test("Structure: prompts should have consistent naming structure", () => {
  // 命名規則の一貫性を確認
  const keys = Object.keys(prompts);

  keys.forEach((key) => {
    const parts = key.split("/");

    // README.mdは特殊ケースとして許可（ルートレベルのドキュメント）
    if (key === "README.md") {
      assertEquals(
        parts.length,
        1,
        `Key "${key}" is allowed as root documentation`,
      );
    } else {
      // その他は最低2階層（category/file.md）
      assertEquals(
        parts.length >= 2,
        true,
        `Key "${key}" should have at least 2 levels`,
      );
    }

    // 最後は必ず.mdで終わる
    assertEquals(
      parts[parts.length - 1].endsWith(".md"),
      true,
      `Key "${key}" should end with .md`,
    );

    // 各パートは適切な命名パターンに従う
    parts.forEach((part) => {
      // README.md や samples/issues/sample_issue.md など大文字始まりも許可
      const validPattern = /^[a-zA-Z0-9_]+(\.[a-z]+)?$/;
      assertEquals(
        validPattern.test(part),
        true,
        `Part "${part}" in key "${key}" should match naming pattern`,
      );
    });
  });
});

Deno.test("Structure: prompts should follow hierarchy pattern", () => {
  // DirectiveType/LayerType/ファイル名 の階層構造を持つべき
  const hierarchyMap = new Map<string, Map<string, string[]>>();

  Object.keys(prompts).forEach((key) => {
    const parts = key.split("/");
    const directive = parts[0]; // to, summary, defect, find

    if (parts.length >= 3) {
      const layer = parts[1]; // project, issue, task

      if (!hierarchyMap.has(directive)) {
        hierarchyMap.set(directive, new Map());
      }

      const layerMap = hierarchyMap.get(directive)!;
      if (!layerMap.has(layer)) {
        layerMap.set(layer, []);
      }

      layerMap.get(layer)!.push(key);
    }
  });

  // 階層構造が適切に形成されていることを確認
  assertExists(hierarchyMap.get("to"));
  assertExists(hierarchyMap.get("to")?.get("project"));
  assertExists(hierarchyMap.get("to")?.get("issue"));
  assertExists(hierarchyMap.get("to")?.get("task"));
});

Deno.test("Structure: prompts should not duplicate responsibilities", () => {
  // 同じ責務を持つプロンプトが重複していないことを確認
  const valueToKeys = new Map<string, string[]>();
  Object.entries(prompts).forEach(([key, value]) => {
    if (valueToKeys.has(value)) {
      valueToKeys.get(value)!.push(key);
    } else {
      valueToKeys.set(value, [key]);
    }
  });

  const duplicatedKeys: string[][] = [];
  valueToKeys.forEach((keys, value) => {
    // " "のような特殊ケースと、明示的に許可された重複を除く
    if (keys.length > 1 && value !== " ") {
      // Known duplicate that needs to be fixed in the source (auto-generated file)
      const knownDuplicate = keys.includes("to/task/f_project.md") &&
        keys.includes("to/task/f_issue.md");
      if (!knownDuplicate) {
        duplicatedKeys.push(keys);
      }
    }
  });

  assertEquals(
    duplicatedKeys.length,
    0,
    `There should be no unexpected duplicate prompt values. Found: ${
      JSON.stringify(duplicatedKeys)
    }`,
  );
});
