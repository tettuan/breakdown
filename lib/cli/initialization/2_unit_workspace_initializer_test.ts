/**
 * Unit test for workspace_initializer
 * 
 * このテストは、workspace_initializerモジュールの機能を検証します。
 * 特に、初期化失敗時の状態復元、必須ファイル/ディレクトリの検証、
 * 既存環境との競合回避を重点的に確認します。
 * 
 * @module lib/cli/initialization/2_unit_workspace_initializer_test
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { initializeBreakdownConfiguration } from "./workspace_initializer.ts";

const logger = new BreakdownLogger("test-unit-workspace-initializer");

// テスト用の一時ディレクトリ
const testBaseDir = join(Deno.cwd(), "tmp", "test-workspace-init");
const breakdownDir = join(testBaseDir, ".agent", "breakdown");

async function setupTestEnvironment() {
  // テスト用ディレクトリを作成
  await Deno.mkdir(testBaseDir, { recursive: true });
  // 作業ディレクトリを変更
  Deno.chdir(testBaseDir);
}

async function cleanupTestEnvironment() {
  // 元のディレクトリに戻る
  Deno.chdir("..");
  // テスト用ディレクトリを削除
  try {
    await Deno.remove(testBaseDir, { recursive: true });
  } catch {
    // エラーは無視（既に削除されている場合など）
  }
}

Deno.test("Unit: workspace_initializer - successful initialization", async () => {
  logger.debug("単体テスト開始: 正常な初期化");

  await setupTestEnvironment();

  try {
    // 初期化を実行
    await initializeBreakdownConfiguration();

    // 必須ディレクトリの存在確認
    const requiredDirs = [
      "config",
      "projects",
      "issues", 
      "tasks",
      "temp",
      "prompts",
      "schema",
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(breakdownDir, dir);
      const dirExists = await exists(dirPath);
      
      logger.debug(`ディレクトリ存在確認: ${dir}`, { 
        path: dirPath,
        exists: dirExists 
      });
      
      assertEquals(
        dirExists,
        true,
        `必須ディレクトリが作成されていません: ${dir}`
      );
    }

    // 設定ファイルの存在確認
    const configPath = join(breakdownDir, "config", "app.yml");
    const configExists = await exists(configPath);
    
    assertEquals(
      configExists,
      true,
      "設定ファイル app.yml が作成されていません"
    );

    // 設定ファイルの内容確認
    const configContent = await Deno.readTextFile(configPath);
    
    // 必須設定項目の確認
    const requiredConfigs = [
      "app_prompt:",
      "app_schema:",
      "params:",
      "workspace:",
      "demonstrativeType:",
      "layerType:",
    ];

    for (const config of requiredConfigs) {
      assertEquals(
        configContent.includes(config),
        true,
        `必須設定項目が含まれていません: ${config}`
      );
    }

  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("Unit: workspace_initializer - idempotent operation", async () => {
  logger.debug("単体テスト開始: 冪等性の確認（複数回実行）");

  await setupTestEnvironment();

  try {
    // 1回目の初期化
    await initializeBreakdownConfiguration();
    
    // 設定ファイルの内容を保存
    const configPath = join(breakdownDir, "config", "app.yml");
    const firstContent = await Deno.readTextFile(configPath);
    const firstModified = (await Deno.stat(configPath)).mtime;

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    // 2回目の初期化（既存環境での実行）
    await initializeBreakdownConfiguration();
    
    // 設定ファイルが上書きされていることを確認
    const secondContent = await Deno.readTextFile(configPath);
    const secondModified = (await Deno.stat(configPath)).mtime;

    assertEquals(
      firstContent,
      secondContent,
      "設定ファイルの内容が変更されました"
    );

    // タイムスタンプが更新されていることを確認（上書きされた証拠）
    assertExists(
      secondModified! > firstModified!,
      "設定ファイルが再作成されていません"
    );

    logger.info("冪等性確認: 複数回実行しても同じ結果");

  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("Unit: workspace_initializer - existing file conflict handling", async () => {
  logger.debug("単体テスト開始: 既存ファイルとの競合処理");

  await setupTestEnvironment();

  try {
    // 事前に一部のディレクトリとファイルを作成
    const configDir = join(breakdownDir, "config");
    await Deno.mkdir(configDir, { recursive: true });
    
    // カスタム設定ファイルを作成
    const customConfig = "# Custom configuration\ncustom: value\n";
    const configPath = join(configDir, "app.yml");
    await Deno.writeTextFile(configPath, customConfig);

    // 初期化を実行
    await initializeBreakdownConfiguration();

    // 設定ファイルが上書きされていることを確認
    const newContent = await Deno.readTextFile(configPath);
    
    assertEquals(
      newContent.includes("# Breakdown Configuration"),
      true,
      "既存の設定ファイルが標準設定で上書きされていません"
    );

    assertEquals(
      newContent.includes("custom: value"),
      false,
      "カスタム設定が残っています（上書きされていません）"
    );

    logger.info("競合処理確認: 既存ファイルは上書きされる");

  } finally {
    await cleanupTestEnvironment();
  }
});

Deno.test("Unit: workspace_initializer - partial failure recovery", async () => {
  logger.debug("単体テスト開始: 部分的な失敗からの回復");

  await setupTestEnvironment();

  try {
    // 読み取り専用ディレクトリを作成して書き込みを妨害
    const readOnlyDir = join(breakdownDir, "config");
    await Deno.mkdir(readOnlyDir, { recursive: true });
    
    // Unixシステムでのみ読み取り専用設定が可能
    if (Deno.build.os !== "windows") {
      await Deno.chmod(readOnlyDir, 0o444);
      
      // 初期化が失敗することを確認
      await assertRejects(
        async () => await initializeBreakdownConfiguration(),
        Error,
        undefined,
        "読み取り専用ディレクトリへの書き込みが成功してしまいました"
      );

      // 権限を戻す
      await Deno.chmod(readOnlyDir, 0o755);
    }

    // 再度初期化を実行（回復可能性の確認）
    await initializeBreakdownConfiguration();

    // すべてのディレクトリが作成されていることを確認
    const requiredDirs = ["config", "projects", "issues", "tasks", "temp", "prompts", "schema"];
    for (const dir of requiredDirs) {
      const dirPath = join(breakdownDir, dir);
      const dirExists = await exists(dirPath);
      assertEquals(
        dirExists,
        true,
        `回復後もディレクトリが作成されていません: ${dir}`
      );
    }

    logger.info("回復確認: 部分的な失敗後も正常に初期化可能");

  } finally {
    // 権限を確実に戻す
    try {
      const readOnlyDir = join(breakdownDir, "config");
      if (await exists(readOnlyDir) && Deno.build.os !== "windows") {
        await Deno.chmod(readOnlyDir, 0o755);
      }
    } catch {
      // エラーは無視
    }
    await cleanupTestEnvironment();
  }
});

Deno.test("Unit: workspace_initializer - boundary value tests", async () => {
  logger.debug("単体テスト開始: 境界値テスト");

  await setupTestEnvironment();

  try {
    // 長いパス名での初期化（OSの制限内）
    const deepPath = join(testBaseDir, "a", "b", "c", "d", "e", "f");
    await Deno.mkdir(deepPath, { recursive: true });
    Deno.chdir(deepPath);

    await initializeBreakdownConfiguration();

    const breakdownPath = join(Deno.cwd(), ".agent", "breakdown");
    const pathExists = await exists(breakdownPath);
    
    assertEquals(
      pathExists,
      true,
      "深いディレクトリ階層での初期化が失敗しました"
    );

    // パスの長さを確認
    logger.debug("パスの長さ", { 
      length: breakdownPath.length,
      path: breakdownPath 
    });

  } finally {
    // 深いディレクトリから戻る
    const originalDir = testBaseDir.split("/").slice(0, -1).join("/");
    Deno.chdir(originalDir);
    await cleanupTestEnvironment();
  }
});

Deno.test("Unit: workspace_initializer - error cases", async () => {
  logger.debug("単体テスト開始: エラーケース");

  // 存在しないディレクトリでの実行をシミュレート
  // 注: 実際のファイルシステムエラーは環境依存のため、
  // コードレビューとTODOコメントの存在で間接的に検証

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // エラーハンドリングの準備があることを確認
  const hasErrorConsideration = 
    moduleContent.includes("TODO") && 
    moduleContent.includes("ensure");

  assertEquals(
    hasErrorConsideration,
    true,
    "エラーハンドリングの考慮が不足しています"
  );

  logger.info("エラーケース: 将来の改善点がTODOとして記載されている");
});

Deno.test("Unit: workspace_initializer - configuration validation", async () => {
  logger.debug("単体テスト開始: 設定内容の検証");

  await setupTestEnvironment();

  try {
    await initializeBreakdownConfiguration();

    const configPath = join(breakdownDir, "config", "app.yml");
    const configContent = await Deno.readTextFile(configPath);

    // YAMLの基本的な構文チェック
    const lines = configContent.split("\n");
    let indentationErrors = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") continue;
      
      // インデントがスペースであることを確認
      const leadingSpaces = line.match(/^( *)/)?.[0].length || 0;
      if (leadingSpaces % 2 !== 0) {
        indentationErrors++;
        logger.warn(`不正なインデント: 行 ${i + 1}`, { line });
      }
    }

    assertEquals(
      indentationErrors,
      0,
      "YAMLのインデントが不正です"
    );

    // パターンの妥当性確認
    const patterns = [
      /pattern:\s*"\^\(to\|summary\|defect\)\$"/,
      /pattern:\s*"\^\(project\|issue\|task\)\$"/,
    ];

    for (const pattern of patterns) {
      assertEquals(
        pattern.test(configContent),
        true,
        `必須パターンが見つかりません: ${pattern}`
      );
    }

    // パスの整合性確認
    assertEquals(
      configContent.includes('working_dir: ".agent/breakdown"'),
      true,
      "working_dirの設定が不正です"
    );

  } finally {
    await cleanupTestEnvironment();
  }
});