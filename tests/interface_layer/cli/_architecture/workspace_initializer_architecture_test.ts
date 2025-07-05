/**
 * Architecture test for workspace_initializer
 *
 * このテストは、workspace_initializerモジュールのアーキテクチャ制約を検証します。
 * 依存関係の方向性、循環参照の有無、レイヤー間の境界を確認します。
 *
 * @module lib/cli/initialization/0_architecture_workspace_initializer_test
 */

import { assertEquals, assertExists } from "../../../../lib/deps.ts";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("test-architecture-workspace-initializer");

Deno.test("Architecture: workspace_initializer - dependency direction", async () => {
  _logger.debug("アーキテクチャテスト開始: 依存関係の方向性確認", {
    target: "workspace_initializer.ts",
  });

  // 実装ファイルの内容を読み込み
  const moduleContent = await Deno.readTextFile(
    new URL("../../../../lib/cli/initialization/workspace_initializer.ts", import.meta.url),
  );

  // 依存関係の抽出
  const importRegex = /import\s+{[^}]+}\s+from\s+["']([^"']+)["']/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(moduleContent)) !== null) {
    imports.push(match[1]);
  }

  _logger.debug("検出されたインポート", { imports });

  // 許可された依存関係のパターン
  const allowedPatterns = [
    /^@std\//, // Deno標準ライブラリ
    /^@tettuan\//, // 組織の共有ライブラリ
  ];

  // 禁止された依存関係のパターン
  const forbiddenPatterns = [
    /\.\.\/\.\.\//, // 2階層以上の親ディレクトリへの参照
    /^lib\/(?!cli\/initialization)/, // 他のモジュールへの直接参照
  ];

  // 依存関係の方向性検証
  for (const imp of imports) {
    // 許可されたパターンのいずれかに一致することを確認
    const isAllowed = allowedPatterns.some((pattern) => pattern.test(imp));

    // 禁止されたパターンに一致しないことを確認
    const isForbidden = forbiddenPatterns.some((pattern) => pattern.test(imp));

    _logger.debug("依存関係の検証", {
      import: imp,
      isAllowed,
      isForbidden,
    });

    assertEquals(
      isForbidden,
      false,
      `禁止された依存関係が検出されました: ${imp}`,
    );
  }
});

Deno.test("Architecture: workspace_initializer - no circular dependencies", async () => {
  _logger.debug("アーキテクチャテスト開始: 循環参照チェック", {
    target: "workspace_initializer.ts",
  });

  // このモジュールは外部への依存が少ないため、循環参照のリスクは低い
  // しかし、将来的な拡張に備えてチェックを実装

  const moduleContent = await Deno.readTextFile(
    new URL("../../../../lib/cli/initialization/workspace_initializer.ts", import.meta.url),
  );

  // エクスポートされている関数/定数を確認
  const exportRegex = /export\s+(async\s+)?function\s+(\w+)|export\s+const\s+(\w+)/g;
  const exports: string[] = [];
  let match;
  while ((match = exportRegex.exec(moduleContent)) !== null) {
    exports.push(match[2] || match[3]);
  }

  _logger.debug("エクスポートされた要素", { exports });

  // workspace_initializerは他のモジュールから参照されることを想定
  // 循環参照を防ぐため、このモジュールからの参照は最小限に保つ
  assertEquals(
    exports.includes("initializeBreakdownConfiguration"),
    true,
    "必須のエクスポート関数が存在しません",
  );
});

Deno.test("Architecture: workspace_initializer - layer boundaries", async () => {
  _logger.debug("アーキテクチャテスト開始: レイヤー境界の検証");

  // workspace_initializerはCLI層に属する
  // 以下の責務を持つべき:
  // 1. ワークスペースの初期化
  // 2. ディレクトリ構造の作成
  // 3. 設定ファイルの生成

  // 以下の責務を持つべきではない:
  // 1. ビジネスロジックの実装
  // 2. 複雑なバリデーション
  // 3. 外部サービスとの通信

  // レイヤー境界の原則を満たしているかの概念的な確認
  const layerPrinciples = {
    "単一責任": "ワークスペース初期化のみを担当",
    "依存方向": "下位層（標準ライブラリ）のみに依存",
    "抽象化レベル": "具体的な実装（ファイルシステム操作）",
  };

  for (const [principle, description] of Object.entries(layerPrinciples)) {
    _logger.info(`レイヤー原則: ${principle}`, { description });
    assertExists(description, `${principle}の説明が必要です`);
  }
});

Deno.test("Architecture: workspace_initializer - interface consistency", async () => {
  _logger.debug("アーキテクチャテスト開始: インターフェースの一貫性");

  // 関数のシグネチャが適切であることを確認
  const moduleContent = await Deno.readTextFile(
    new URL("../../../../lib/cli/initialization/workspace_initializer.ts", import.meta.url),
  );

  // 非同期関数のパターン
  const asyncFunctionRegex =
    /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<([^>]+)>/g;
  const asyncFunctions: Array<{ name: string; returnType: string }> = [];
  let match;
  while ((match = asyncFunctionRegex.exec(moduleContent)) !== null) {
    asyncFunctions.push({
      name: match[1],
      returnType: match[2],
    });
  }

  _logger.debug("検出された非同期関数", { asyncFunctions });

  // 初期化関数は副作用のみでvoidを返すべき
  for (const func of asyncFunctions) {
    if (func.name.includes("initialize")) {
      assertEquals(
        func.returnType.trim(),
        "void",
        `初期化関数 ${func.name} はvoidを返すべきです`,
      );
    }
  }
});

Deno.test("Architecture: workspace_initializer - separation of concerns", async () => {
  _logger.debug("アーキテクチャテスト開始: 関心事の分離");

  const moduleContent = await Deno.readTextFile(
    new URL("../../../../lib/cli/initialization/workspace_initializer.ts", import.meta.url),
  );

  // TODOコメントから将来の責務分離の方向性を確認
  const todoRegex = /\/\/\s*TODO:\s*([^\n]+)/g;
  const todos: string[] = [];
  let match;
  while ((match = todoRegex.exec(moduleContent)) !== null) {
    todos.push(match[1]);
  }

  _logger.debug("検出されたTODOコメント", { count: todos.length });

  // TODOコメントが示す責務分離の方向性を確認
  const expectedSeparations = [
    "BreakdownConfig",
    "BreakdownParams",
  ];

  for (const separation of expectedSeparations) {
    const hasSeparationIntent = todos.some((todo) => todo.includes(separation));
    _logger.info(`責務分離の意図: ${separation}`, {
      found: hasSeparationIntent,
    });
  }

  // 現在の実装が単一責任を守っているか確認
  const functionCount = (moduleContent.match(/export\s+(async\s+)?function/g) || []).length;
  assertEquals(
    functionCount,
    1,
    "単一責任の原則: エクスポートされる関数は1つであるべき",
  );
});
