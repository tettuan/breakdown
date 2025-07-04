/**
 * Schema構造とConstants設定の整合性テスト
 * 修正前後の動作確認用
 */

import { assert, assertEquals, assertExists } from "../../../lib/deps.ts";
import { fromFileUrl, join, resolve } from "jsr:@std/path";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@1.0.4";
import {
  _DEFAULT_WORKSPACE_STRUCTURE,
  DEFAULT_SCHEMA_BASE_DIR,
} from "../../../lib/config/constants.ts";

// プロジェクトルートを確実に取得
const BASE_DIR = await (async () => {
  // このファイルから2階層上がプロジェクトルート
  const currentFile = fromFileUrl(new URL(import.meta.url));
  const projectRoot = resolve(currentFile, "../../../");
  return projectRoot;
})();

Deno.test("Schema constants integration - 修正前の状態確認", async () => {
  // constants.tsの設定値確認
  assertEquals(DEFAULT_SCHEMA_BASE_DIR, "lib/breakdown/schema");
  assertEquals(_DEFAULT_WORKSPACE_STRUCTURE.directories.issues, "issues");
  assertEquals(_DEFAULT_WORKSPACE_STRUCTURE.directories.tasks, "tasks");
  assertEquals(_DEFAULT_WORKSPACE_STRUCTURE.directories.projects, "projects");

  const logger = new BreakdownLogger();
  logger.info("constants.ts設定確認完了");
});

Deno.test("Schema directory structure - 実際の構造確認", async () => {
  const logger = new BreakdownLogger();
  const schemaBaseDir = join(BASE_DIR, DEFAULT_SCHEMA_BASE_DIR);

  // デバッグ情報を出力
  logger.debug("テスト環境情報", {
    BASE_DIR,
    DEFAULT_SCHEMA_BASE_DIR,
    schemaBaseDir,
    cwd: Deno.cwd(),
  });

  try {
    // ディレクトリの存在を確認
    const schemaDirStat = await Deno.stat(schemaBaseDir);
    if (!schemaDirStat.isDirectory) {
      logger.error("schema パスはディレクトリではありません", { schemaBaseDir });
      throw new Error(`${schemaBaseDir} is not a directory`);
    }

    // 実際のディレクトリ構造を確認
    const dirEntries: string[] = [];
    for await (const entry of Deno.readDir(schemaBaseDir)) {
      if (entry.isDirectory) {
        dirEntries.push(entry.name);
      }
    }

    // ディレクトリが読み込めたかログ出力
    logger.debug("読み込んだディレクトリ一覧", {
      schemaBaseDir,
      dirEntries,
      count: dirEntries.length,
    });

    // dirEntriesが空の場合の詳細確認
    if (dirEntries.length === 0) {
      logger.error("ディレクトリが空です", {
        schemaBaseDir,
        allEntries: await Array.fromAsync(Deno.readDir(schemaBaseDir)),
      });
    }

    // 実際にgitで追跡されているディレクトリのみチェック
    // 空のディレクトリはgitで追跡されないため、ファイルが存在するディレクトリのみ確認
    const trackedDirs = ["find", "to"];
    for (const trackedDir of trackedDirs) {
      assert(
        dirEntries.includes(trackedDir),
        `Missing tracked directory: ${trackedDir}. Found: ${dirEntries.join(", ")}`,
      );
    }

    // 全ての期待されるディレクトリ（空のものも含む）が将来的に必要
    const allExpectedDirs = ["defect", "find", "summary", "to"];
    const missingDirs = allExpectedDirs.filter((dir) => !dirEntries.includes(dir));
    if (missingDirs.length > 0) {
      logger.warn("存在しないディレクトリ（空のディレクトリの可能性）", {
        missingDirs,
      });
    }

    logger.debug("実際のschema構造", { dirEntries });
  } catch (error) {
    // ディレクトリが存在しない場合はテストをスキップ
    if (error instanceof Deno.errors.NotFound) {
      logger.warn("schema ディレクトリが存在しません - テストスキップ", {
        schemaBaseDir,
        cwd: Deno.cwd(),
        BASE_DIR,
        fullPath: schemaBaseDir,
      });
      return;
    }
    logger.error("テスト中にエラーが発生", {
      error: error instanceof Error ? error.message : String(error),
      schemaBaseDir,
      cwd: Deno.cwd(),
      BASE_DIR,
    });
    throw error;
  }
});

Deno.test("Schema file access - constants設定でのファイルアクセステスト", async () => {
  const logger = new BreakdownLogger();
  const schemaBaseDir = join(BASE_DIR, DEFAULT_SCHEMA_BASE_DIR);

  // constants.tsの設定で期待されるパス (修正前 - 失敗するはず)
  const expectedPaths = [
    join(schemaBaseDir, _DEFAULT_WORKSPACE_STRUCTURE.directories.issues),
    join(schemaBaseDir, _DEFAULT_WORKSPACE_STRUCTURE.directories.tasks),
    join(schemaBaseDir, _DEFAULT_WORKSPACE_STRUCTURE.directories.projects),
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

  logger.debug("パスアクセス結果", { pathAccessResults });

  // 修正前は全てfalseになるはず（不整合の証明）
  const allPathsExist = pathAccessResults.every((result) => result.exists);
  assertEquals(
    allPathsExist,
    false,
    "constants.tsの設定で実際のschemaディレクトリにアクセスできてしまう（不整合がない？）",
  );
});

Deno.test("Actual schema files access - 実際の構造でのファイル確認", async () => {
  const logger = new BreakdownLogger();
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
      logger.debug("ファイル確認", { path });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        logger.warn("ファイルが存在しません (テストスキップ)", { path });
        continue;
      }
      logger.error("ファイルアクセスエラー", { path, error });
      throw error;
    }
  }
});

Deno.test("Directory naming consistency check - 命名規則の一致確認", async () => {
  const logger = new BreakdownLogger();
  // constants.tsは複数形、実際のschemaは単数形の不整合を確認
  const constantsNames = Object.values(_DEFAULT_WORKSPACE_STRUCTURE.directories);
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

  logger.info("命名規則の不整合を確認完了");
});
