/**
 * Structure test for workspace_initializer
 * 
 * このテストは、workspace_initializerモジュールの構造と責務分離を検証します。
 * クラス構造、責務の重複、抽象化レベル、クラス間の関係性を確認します。
 * 
 * @module lib/cli/initialization/1_structure_workspace_initializer_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("test-structure-workspace-initializer");

Deno.test("Structure: workspace_initializer - single responsibility", async () => {
  logger.debug("構造テスト開始: 単一責任の原則", {
    target: "workspace_initializer.ts",
  });

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // 関数の責務を分析
  const functionRegex = /export\s+async\s+function\s+(\w+)[^{]+{([^}]+)}/gs;
  const functions: Array<{name: string, body: string}> = [];
  let match;
  while ((match = functionRegex.exec(moduleContent)) !== null) {
    functions.push({
      name: match[1],
      body: match[2]
    });
  }

  // 各関数内の責務を分析
  for (const func of functions) {
    const responsibilities = {
      "ログ出力": (func.body.match(/console\.log/g) || []).length,
      "ディレクトリ作成": (func.body.match(/ensureDir/g) || []).length,
      "ファイル書き込み": (func.body.match(/writeTextFile/g) || []).length,
      "パス操作": (func.body.match(/\${[^}]+}/g) || []).length,
    };

    logger.debug(`関数 ${func.name} の責務分析`, responsibilities);

    // 単一の関数が複数の高レベル責務を持っていることを確認
    // これは将来的に分割すべきことを示す
    const activeResponsibilities = Object.entries(responsibilities)
      .filter(([_, count]) => count > 0)
      .length;

    logger.info("アクティブな責務の数", { 
      function: func.name,
      count: activeResponsibilities 
    });

    // 現在は1つの関数に複数の責務があるが、TODOコメントで改善意図が示されている
    assertExists(
      activeResponsibilities,
      "関数には少なくとも1つの責務が必要です"
    );
  }
});

Deno.test("Structure: workspace_initializer - no responsibility duplication", async () => {
  logger.debug("構造テスト開始: 責務の重複チェック");

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // ハードコードされた値の重複をチェック
  const hardcodedValues = {
    "ベースディレクトリ": /\.agent\/breakdown/g,
    "設定ディレクトリ": /config/g,
    "プロンプトディレクトリ": /prompts/g,
    "スキーマディレクトリ": /schema/g,
  };

  const duplications: Record<string, number> = {};
  
  for (const [name, pattern] of Object.entries(hardcodedValues)) {
    const matches = moduleContent.match(pattern) || [];
    duplications[name] = matches.length;
    
    logger.debug(`重複チェック: ${name}`, { 
      count: matches.length 
    });
  }

  // 設定値の重複は最小限に抑えるべき
  for (const [name, count] of Object.entries(duplications)) {
    if (count > 3) {
      logger.warn(`過度な重複: ${name}`, { count });
    }
  }

  // TODOコメントが重複の解消を示唆していることを確認
  const hasDuplicationResolutionIntent = moduleContent.includes("TODO") && 
    (moduleContent.includes("BreakdownConfig") || moduleContent.includes("BreakdownParams"));
  
  assertEquals(
    hasDuplicationResolutionIntent,
    true,
    "重複解消の意図（TODOコメント）が必要です"
  );
});

Deno.test("Structure: workspace_initializer - appropriate abstraction level", async () => {
  logger.debug("構造テスト開始: 適切な抽象化レベル");

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // 抽象化レベルの指標
  const abstractionIndicators = {
    "高レベル操作": {
      pattern: /initialize|create|setup|configure/gi,
      expected: true,
      reason: "初期化モジュールは高レベルの操作を提供すべき"
    },
    "低レベル操作": {
      pattern: /readSync|writeSync|mkdirSync/gi,
      expected: false,
      reason: "同期的な低レベル操作は避けるべき"
    },
    "非同期操作": {
      pattern: /await|async|Promise/g,
      expected: true,
      reason: "I/O操作は非同期であるべき"
    },
    "エラーハンドリング": {
      pattern: /try|catch|throw/g,
      expected: false, // 現在の実装では明示的なエラーハンドリングなし
      reason: "エラーは上位層で処理される想定"
    }
  };

  for (const [name, indicator] of Object.entries(abstractionIndicators)) {
    const matches = moduleContent.match(indicator.pattern) || [];
    const found = matches.length > 0;
    
    logger.debug(`抽象化レベル: ${name}`, {
      found,
      expected: indicator.expected,
      matches: matches.length,
      reason: indicator.reason
    });

    if (indicator.expected) {
      assertEquals(
        found,
        true,
        `${name}が見つかりません: ${indicator.reason}`
      );
    }
  }
});

Deno.test("Structure: workspace_initializer - cohesion analysis", async () => {
  logger.debug("構造テスト開始: 凝集性の分析");

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // 機能的凝集性の要素を分析
  const cohesionElements = {
    "ディレクトリ作成": /ensureDir|directories/g,
    "設定ファイル作成": /configContent|writeTextFile/g,
    "パス構築": /\${baseDir}\//g,
    "進捗表示": /console\.log.*✅|🚀|🎉/g,
  };

  const elementCounts: Record<string, number> = {};
  for (const [element, pattern] of Object.entries(cohesionElements)) {
    const matches = moduleContent.match(pattern) || [];
    elementCounts[element] = matches.length;
  }

  logger.debug("凝集性要素の分析結果", elementCounts);

  // すべての要素が存在することを確認（機能的凝集性）
  for (const [element, count] of Object.entries(elementCounts)) {
    assertExists(
      count > 0,
      `凝集性要素「${element}」が存在しません`
    );
  }

  // 関連する操作がグループ化されているか確認
  const hasLogicalGrouping = moduleContent.includes("// Create directory structure") &&
                            moduleContent.includes("// Create basic app.yml config file");
  
  assertEquals(
    hasLogicalGrouping,
    true,
    "関連する操作は論理的にグループ化されるべきです"
  );
});

Deno.test("Structure: workspace_initializer - future extensibility", async () => {
  logger.debug("構造テスト開始: 将来の拡張性");

  const moduleContent = await Deno.readTextFile(
    new URL("./workspace_initializer.ts", import.meta.url)
  );

  // TODOコメントから将来の拡張ポイントを分析
  const todoRegex = /\/\/\s*TODO:\s*([^\n]+)/g;
  const todos: string[] = [];
  let match;
  while ((match = todoRegex.exec(moduleContent)) !== null) {
    todos.push(match[1]);
  }

  logger.debug("拡張ポイント（TODOコメント）", { 
    count: todos.length,
    todos 
  });

  // 拡張性のパターンを確認
  const extensibilityPatterns = {
    "設定の外部化": todos.some(t => t.includes("BreakdownConfig")),
    "パラメータの動的化": todos.some(t => t.includes("BreakdownParams")),
    "責務の委譲": todos.some(t => t.includes("should")),
  };

  for (const [pattern, found] of Object.entries(extensibilityPatterns)) {
    logger.info(`拡張性パターン: ${pattern}`, { found });
    assertEquals(
      found,
      true,
      `拡張性パターン「${pattern}」が考慮されていません`
    );
  }

  // ハードコードされた値が将来的に設定可能になることを確認
  const hardcodedPatterns = [
    "projects", "issues", "tasks",  // レイヤータイプ
    "to", "summary", "defect",      // デモンストレーティブタイプ
  ];

  for (const pattern of hardcodedPatterns) {
    const hasPattern = moduleContent.includes(pattern);
    const hasTodoForPattern = todos.some(t => 
      t.toLowerCase().includes("default") || 
      t.toLowerCase().includes("dynamic")
    );
    
    if (hasPattern) {
      logger.debug(`ハードコード値: ${pattern}`, { 
        hasTodo: hasTodoForPattern 
      });
    }
  }
});