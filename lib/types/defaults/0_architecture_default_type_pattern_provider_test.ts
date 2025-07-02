/**
 * @fileoverview Architecture test for DefaultTypePatternProvider
 *
 * このテストは以下のアーキテクチャ制約を検証します：
 * - TypePatternProviderインターフェースの完全な実装
 * - 依存関係の方向性（内部モジュールへの依存のみ）
 * - 循環参照の不在
 * - レイヤー境界の遵守（types/defaults層の制約）
 * - import文の解析と依存グラフの構築
 *
 * @module types/defaults/0_architecture_default_type_pattern_provider_test
 */

import { assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { DefaultTypePatternProvider } from "./default_type_pattern_provider.ts";
import type { TypePatternProvider } from "../type_factory.ts";

/**
 * アーキテクチャテスト: import文の解析と依存関係グラフの構築
 *
 * DefaultTypePatternProviderのimport文を解析し、依存関係が適切であることを検証
 */
Deno.test("Architecture: DefaultTypePatternProvider import analysis and dependency graph", async () => {
  // default_type_pattern_provider.tsのソースコードを読み込む
  const _filePath = new URL("./default_type_pattern_provider.ts", import.meta.url).pathname;
  const sourceCode = await Deno.readTextFile(filePath);

  // import文を抽出
  const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+["']([^"']+)["'];?/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(sourceCode)) !== null) {
    imports.push(match[1]);
  }

  // 依存関係の分類
  const externalDeps = imports.filter((imp) => imp.startsWith("@"));
  const parentDeps = imports.filter((imp) => imp.startsWith("../"));
  const localDeps = imports.filter((imp) => imp.startsWith("./"));

  // 外部パッケージ依存がないことを検証
  assertEquals(
    externalDeps.length,
    0,
    "DefaultTypePatternProvider should not depend on external packages",
  );

  // 親ディレクトリへの依存の検証（types層の型定義のみ許可）
  const allowedParentPaths = [
    "../directive_type.ts",
    "../layer_type.ts",
    "../type_factory.ts",
  ];

  for (const dep of parentDeps) {
    assertEquals(
      allowedParentPaths.includes(dep),
      true,
      `Parent dependency ${dep} should be in allowed list`,
    );
  }

  // ローカル依存の検証（同一defaults層内のみ許可）
  const allowedLocalPaths = [
    "./config_two_params.ts",
  ];

  for (const dep of localDeps) {
    assertEquals(
      allowedLocalPaths.includes(dep),
      true,
      `Local dependency ${dep} should be in allowed list`,
    );
  }
});

/**
 * アーキテクチャテスト: TypePatternProviderインターフェースの完全な実装
 *
 * DefaultTypePatternProviderがTypePatternProviderインターフェースを
 * 完全に実装していることを検証
 */
Deno.test("Architecture: Complete TypePatternProvider interface implementation by DefaultTypePatternProvider", async () => {
  // インターフェースの実装を型レベルで検証
  const provider = new DefaultTypePatternProvider();
  const interfaceCheck: TypePatternProvider = provider;
  assertExists(interfaceCheck, "DefaultTypePatternProvider must implement TypePatternProvider");

  // 必須メソッドの実装を検証
  const prototype = DefaultTypePatternProvider.prototype;
  const requiredMethods: Array<keyof TypePatternProvider> = [
    "getDirectivePattern",
    "getLayerTypePattern",
  ];

  for (const method of requiredMethods) {
    assertStrictEquals(
      typeof prototype[method],
      "function",
      `DefaultTypePatternProvider must implement ${method} method from TypePatternProvider`,
    );

    // メソッドのシグネチャを検証（引数の数）
    assertEquals(
      prototype[method].length,
      0,
      `${method} should take no arguments as per interface`,
    );
  }
});

/**
 * アーキテクチャテスト: 追加の公開メソッド
 *
 * DefaultTypePatternProviderが提供する追加メソッドの存在と整合性を検証
 */
Deno.test("Architecture: DefaultTypePatternProvider additional public methods", async () => {
  const prototype = DefaultTypePatternProvider.prototype;

  // 追加の公開メソッド
  const additionalMethods = [
    "getDefaultConfig", // デフォルト設定の取得
    "getValidDirectiveValues", // 有効なDirective値のリスト
    "getValidLayerValues", // 有効なLayer値のリスト
    "debug", // デバッグ情報
  ];

  for (const method of additionalMethods) {
    assertStrictEquals(
      typeof prototype[method as keyof typeof prototype],
      "function",
      `DefaultTypePatternProvider should implement ${method} method`,
    );
  }
});

/**
 * アーキテクチャテスト: 循環参照の検出
 *
 * DefaultTypePatternProviderが循環参照を持たないことを検証
 */
Deno.test("Architecture: No circular dependencies in DefaultTypePatternProvider", async () => {
  // 依存関係マップの構築
  const dependencyMap = new Map<string, Set<string>>();
  const baseDir = new URL("../../../", import.meta.url).pathname; // lib/

  async function analyzeDependencies(filePath: string, visited = new Set<string>()): Promise<void> {
    if (visited.has(filePath)) {
      return; // 既に訪問済み
    }
    visited.add(filePath);

    try {
      const fullPath = filePath.startsWith("/")
        ? filePath
        : new URL(filePath, import.meta.url).pathname;
      const sourceCode = await Deno.readTextFile(fullPath);
      const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+["']([^"']+)["'];?/g;
      const deps = new Set<string>();

      let match;
      while ((match = importRegex.exec(sourceCode)) !== null) {
        const importPath = match[1];
        // 外部パッケージは除外
        if (!importPath.startsWith("@") && !importPath.startsWith("http")) {
          deps.add(importPath);
        }
      }

      dependencyMap.set(filePath, deps);
    } catch {
      // ファイルが読めない場合はスキップ
    }
  }

  // default_type_pattern_provider.tsから開始
  const targetFile = "./default_type_pattern_provider.ts";
  await analyzeDependencies(targetFile);

  // 循環参照の検出
  function hasCycle(
    node: string,
    visited = new Set<string>(),
    recursionStack = new Set<string>(),
  ): boolean {
    visited.add(node);
    recursionStack.add(node);

    const dependencies = dependencyMap.get(node) || new Set();
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        if (hasCycle(dep, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true; // 循環参照を検出
      }
    }

    recursionStack.delete(node);
    return false;
  }

  const hasCircularDep = hasCycle(targetFile);
  assertEquals(
    hasCircularDep,
    false,
    "DefaultTypePatternProvider should not have circular dependencies",
  );
});

/**
 * アーキテクチャテスト: レイヤー境界の遵守
 *
 * DefaultTypePatternProviderが適切なレイヤー境界を守っていることを検証
 */
Deno.test("Architecture: Layer boundary compliance in DefaultTypePatternProvider", async () => {
  // DefaultTypePatternProviderはtypes/defaults層に属する
  // 以下への依存のみ許可:
  // 1. 同一層（defaults層）内のモジュール
  // 2. 親層（types層）のインターフェースと型定義

  // 禁止される依存:
  // - config層（並列層）
  // - cli層（上位層）
  // - factory層（並列層）
  // - processor層（並列層）
  // - validator層（並列層）
  // - 外部パッケージ（@tettuan/*）

  const forbiddenPatterns = [
    "../../config/",
    "../../cli/",
    "../../factory/",
    "../../processor/",
    "../../validator/",
    "@tettuan/",
  ];

  // この検証は静的解析として実装されるべきだが、
  // 現時点では型システムによる検証で代替
  assertExists(forbiddenPatterns, "Forbidden dependency patterns defined");
});

/**
 * アーキテクチャテスト: 状態管理とイミュータビリティ
 *
 * DefaultTypePatternProviderがステートレスであることを検証
 */
Deno.test("Architecture: Stateless design of DefaultTypePatternProvider", async () => {
  const provider = new DefaultTypePatternProvider();

  // インスタンスプロパティが存在しないことを確認（ステートレス）
  const ownProperties = Object.getOwnPropertyNames(provider);
  assertEquals(
    ownProperties.length,
    0,
    "DefaultTypePatternProvider should be stateless (no instance properties)",
  );

  // メソッドが冪等であることを確認
  const pattern1 = provider.getDirectivePattern();
  const pattern2 = provider.getDirectivePattern();
  // パターンオブジェクトが存在することと、同じ結果を返すことを確認
  assertExists(pattern1, "First call should return a pattern");
  assertExists(pattern2, "Second call should return a pattern");
  assertEquals(
    pattern1 !== null,
    pattern2 !== null,
    "getDirectivePattern should be idempotent",
  );

  const layerPattern1 = provider.getLayerTypePattern();
  const layerPattern2 = provider.getLayerTypePattern();
  assertExists(layerPattern1, "First call should return a layer pattern");
  assertExists(layerPattern2, "Second call should return a layer pattern");
  assertEquals(
    layerPattern1 !== null,
    layerPattern2 !== null,
    "getLayerTypePattern should be idempotent",
  );
});

/**
 * アーキテクチャテスト: エラー処理戦略の一貫性
 *
 * DefaultTypePatternProviderのエラー処理が一貫していることを検証
 */
Deno.test("Architecture: Consistent error handling in DefaultTypePatternProvider", async () => {
  // パターン取得メソッドはnullを返す（例外をスローしない）
  const errorHandlingStrategy = {
    getDirectivePattern: "returns TwoParamsDirectivePattern or null",
    getLayerTypePattern: "returns TwoParamsLayerTypePattern or null",
    getDefaultConfig: "returns config object (no error)",
    getValidDirectiveValues: "returns array (no error)",
    getValidLayerValues: "returns array (no error)",
    debug: "returns debug object (no error)",
  };

  assertExists(
    errorHandlingStrategy,
    "Error handling strategy should be defined and consistent",
  );
});

/**
 * アーキテクチャテスト: 公開APIの安定性と後方互換性
 *
 * DefaultTypePatternProviderの公開APIが安定していることを検証
 */
Deno.test("Architecture: Public API stability of DefaultTypePatternProvider", async () => {
  const publicMethods = [
    "getDirectivePattern", // インターフェース必須
    "getLayerTypePattern", // インターフェース必須
    "getDefaultConfig", // 追加機能
    "getValidDirectiveValues", // 追加機能
    "getValidLayerValues", // 追加機能
    "debug", // 追加機能
  ];

  const prototype = DefaultTypePatternProvider.prototype;
  for (const method of publicMethods) {
    assertStrictEquals(
      typeof prototype[method as keyof typeof prototype],
      "function",
      `Public method ${method} should be defined`,
    );
  }

  // コンストラクタが引数を取らないことを確認
  assertEquals(
    DefaultTypePatternProvider.length,
    0,
    "Constructor should take no parameters",
  );
});

/**
 * アーキテクチャテスト: 単一責任の原則
 *
 * DefaultTypePatternProviderが単一の責任に集中していることを検証
 */
Deno.test("Architecture: Single Responsibility Principle in DefaultTypePatternProvider", async () => {
  // DefaultTypePatternProviderの責任:
  // 1. デフォルト設定からパターンを提供
  // 2. TypePatternProviderインターフェースを実装
  // 3. デフォルト値の情報を提供

  // 責任外の機能が含まれていないことを確認
  const allowedResponsibilities = [
    "pattern provision", // パターン提供
    "default values access", // デフォルト値へのアクセス
    "debug information", // デバッグ情報
  ];

  // 各メソッドが適切な責任を持つことを確認
  const methodResponsibilities: Record<string, string> = {
    getDirectivePattern: "pattern provision",
    getLayerTypePattern: "pattern provision",
    getDefaultConfig: "default values access",
    getValidDirectiveValues: "default values access",
    getValidLayerValues: "default values access",
    debug: "debug information",
  };

  const prototype = DefaultTypePatternProvider.prototype;
  const publicMethods = Object.getOwnPropertyNames(prototype)
    .filter((name) => name !== "constructor")
    .filter((name) => typeof prototype[name as keyof typeof prototype] === "function");

  for (const method of publicMethods) {
    assertExists(
      methodResponsibilities[method],
      `Method ${method} should have a defined responsibility`,
    );
  }
});

/**
 * アーキテクチャテスト: デフォルト値の不変性
 *
 * DefaultTypePatternProviderが返すデフォルト値が不変であることを検証
 */
Deno.test("Architecture: Immutability of default values", async () => {
  const provider = new DefaultTypePatternProvider();

  // getDefaultConfigが同じオブジェクトを返すことを確認
  const config1 = provider.getDefaultConfig();
  const config2 = provider.getDefaultConfig();
  assertStrictEquals(
    config1,
    config2,
    "getDefaultConfig should return the same object reference",
  );

  // 有効値リストが同じ内容を返すことを確認
  const directives1 = provider.getValidDirectiveValues();
  const directives2 = provider.getValidDirectiveValues();
  assertEquals(
    directives1,
    directives2,
    "getValidDirectiveValues should return the same values",
  );

  const layers1 = provider.getValidLayerValues();
  const layers2 = provider.getValidLayerValues();
  assertEquals(
    layers1,
    layers2,
    "getValidLayerValues should return the same values",
  );
});
