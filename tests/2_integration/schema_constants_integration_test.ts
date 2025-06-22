/**
 * Schema構造とConstants設定の整合性テスト
 * 修正前後の動作確認用
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { join } from "jsr:@std/path";
import {
  DEFAULT_SCHEMA_BASE_DIR,
  DEFAULT_WORKSPACE_STRUCTURE,
} from "../../lib/config/constants.ts";

const BASE_DIR = "/Users/tettuan/github/breakdown";

Deno.test("Schema constants integration - 修正前の状態確認", () => {
  // constants.tsの設定値確認
  assertEquals(DEFAULT_SCHEMA_BASE_DIR, "lib/breakdown/schema");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.issues, "issues");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.tasks, "tasks");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.projects, "projects");

  console.log("constants.ts設定確認完了");
});

Deno.test("Schema directory structure - 実際の構造確認", async () => {
  const schemaBaseDir = join(BASE_DIR, DEFAULT_SCHEMA_BASE_DIR);

  // 実際のディレクトリ構造を確認
  const dirEntries = [];
  for await (const entry of Deno.readDir(schemaBaseDir)) {
    if (entry.isDirectory) {
      dirEntries.push(entry.name);
    }
  }

  // 期待される階層構造
  const expectedDirs = ["defect", "find", "summary", "to"];
  for (const expectedDir of expectedDirs) {
    assertEquals(dirEntries.includes(expectedDir), true, `Missing directory: ${expectedDir}`);
  }

  console.log("実際のschema構造:", dirEntries);
});

Deno.test("Schema file access - constants設定でのファイルアクセステスト", async () => {
  const schemaBaseDir = join(BASE_DIR, DEFAULT_SCHEMA_BASE_DIR);

  // constants.tsの設定で期待されるパス (修正前 - 失敗するはず)
  const expectedPaths = [
    join(schemaBaseDir, DEFAULT_WORKSPACE_STRUCTURE.directories.issues),
    join(schemaBaseDir, DEFAULT_WORKSPACE_STRUCTURE.directories.tasks),
    join(schemaBaseDir, DEFAULT_WORKSPACE_STRUCTURE.directories.projects),
  ];

  const pathAccessResults = [];

  for (const path of expectedPaths) {
    try {
      await Deno.stat(path);
      pathAccessResults.push({ path, exists: true });
    } catch {
      pathAccessResults.push({ path, exists: false });
    }
  }

  console.log("パスアクセス結果:", pathAccessResults);

  // 修正前は全てfalseになるはず（不整合の証明）
  const allPathsExist = pathAccessResults.every((result) => result.exists);
  assertEquals(
    allPathsExist,
    false,
    "constants.tsの設定で実際のschemaディレクトリにアクセスできてしまう（不整合がない？）",
  );
});

Deno.test("Actual schema files access - 実際の構造でのファイル確認", async () => {
  const schemaBaseDir = join(BASE_DIR, DEFAULT_SCHEMA_BASE_DIR);

  // 実際の構造でファイルが存在することを確認
  const actualPaths = [
    join(schemaBaseDir, "to", "issue", "base.schema.md"),
    join(schemaBaseDir, "to", "project", "base.schema.md"),
    join(schemaBaseDir, "to", "task", "base.schema.md"),
    join(schemaBaseDir, "find", "bugs", "base.schema.md"),
  ];

  for (const path of actualPaths) {
    try {
      const stat = await Deno.stat(path);
      assertExists(stat, `ファイルが存在しません: ${path}`);
      console.log(`✓ ファイル確認: ${path}`);
    } catch (error) {
      console.error(`✗ ファイルアクセスエラー: ${path}`, error);
      throw error;
    }
  }
});

Deno.test("Directory naming consistency check - 命名規則の一致確認", () => {
  // constants.tsは複数形、実際のschemaは単数形の不整合を確認
  const constantsNames = Object.values(DEFAULT_WORKSPACE_STRUCTURE.directories);
  const expectedSingularNames = ["issue", "task", "project"];

  constantsNames.forEach((name, index) => {
    const isPlural = name.endsWith("s");
    assertEquals(isPlural, true, `constants.tsの${name}は複数形でない`);

    const singularForm = name.slice(0, -1); // 's'を除去
    assertEquals(
      singularForm,
      expectedSingularNames[index],
      `単数形の不一致: ${name} -> ${singularForm}`,
    );
  });

  console.log("命名規則の不整合を確認完了");
});
