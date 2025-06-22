# STDIN テスト仕様書

このドキュメントは、Breakdown プロジェクトにおける STDIN テストの仕様と実装ガイドラインを定めています。

## 概要

STDIN テストは、環境変数への依存を排除し、非同期処理の確実なクリーンアップとテストの冪等性を保証する新しいパターンを採用しています。

## テスト設計の原則

### 1. 環境非依存
- 環境変数（CI、GITHUB_ACTIONS など）に依存しない
- モックとDIパターンによる完全な制御
- CI/ローカル環境で同一の動作を保証

### 2. リソース管理
- すべての非同期操作の確実なクリーンアップ
- AbortController によるタイムアウト制御
- リソースリークの完全防止

### 3. テスト分離
- 各テストケースの完全な独立性
- 環境の保存と復元
- 副作用の排除

## テストパターンの使用方法

### 基本的なテストの記述

```typescript
import { withStdinTest, defineStdinTests } from "../../helpers/stdin/test_context.ts";
import { assertEquals, assertRejects } from "@std/assert";

// テストケースの定義
defineStdinTests([
  {
    name: "正常な入力を読み取れる",
    config: {
      data: "test input",
      isTerminal: false,
      isAvailable: true,
    },
    expectedOutput: "test input",
  },
  {
    name: "タイムアウトエラーが発生する",
    config: {
      delay: 2000,
      data: "delayed input",
    },
    timeout: 1000,
    expectedError: "Operation aborted",
  },
]);
```

### 高度なテストケース

```typescript
Deno.test("複雑なSTDINシナリオ", async () => {
  await withStdinTest("complex-scenario", async (context) => {
    // モックSTDINの作成
    const stdin = context.createMockStdin({
      data: "multi\nline\ninput",
      isTerminal: true,
    });
    
    // 複数回の読み取り
    const line1 = await stdin.read();
    const line2 = await stdin.read();
    
    assertEquals(line1, "multi");
    assertEquals(line2, "line");
  });
});
```

### リソース管理の例

```typescript
Deno.test("リソースのクリーンアップ", async () => {
  await withStdinTest("cleanup-test", async (context) => {
    const operations = [];
    
    // 複数の非同期操作を開始
    for (let i = 0; i < 10; i++) {
      const stdin = context.createMockStdin({
        delay: 100,
        data: `data-${i}`,
      });
      operations.push(stdin.read({ timeout: 500 }));
    }
    
    // すべての操作を待機
    const results = await Promise.all(operations);
    
    // 検証
    results.forEach((result, index) => {
      assertEquals(result, `data-${index}`);
    });
  });
  // withStdinTestが自動的にすべてのリソースをクリーンアップ
});
```

## テストヘルパーAPI

### withStdinTest

非同期テストのラッパー関数。リソース管理とクリーンアップを自動化します。

```typescript
async function withStdinTest<T>(
  testName: string,
  testFn: (context: StdinTestContext) => Promise<T>
): Promise<T>
```

### StdinTestContext

テストコンテキストが提供するメソッド：

- `createMockStdin(config)`: モックSTDINリーダーを作成
- `resourceManager`: リソース管理への直接アクセス

### MockStdinConfig

モックの設定オプション：

```typescript
interface MockStdinConfig {
  data?: string;           // 返すデータ
  isTerminal?: boolean;    // ターミナルかどうか
  isAvailable?: boolean;   // 利用可能かどうか
  delay?: number;          // 遅延時間（ミリ秒）
  throwError?: boolean;    // エラーを投げるか
  errorMessage?: string;   // エラーメッセージ
}
```

## テストの実行

### 個別テストの実行

```bash
deno test tests/0_foundation/1_stdin/2_unit_stdin_test.ts --allow-env --allow-write --allow-read
```

### 全STDINテストの実行

```bash
deno test tests/0_foundation/1_stdin/ --allow-env --allow-write --allow-read
```

### デバッグモード

```bash
LOG_LEVEL=debug deno test tests/0_foundation/1_stdin/ --allow-env --allow-write --allow-read
```

## テストファイルの構成

```
tests/0_foundation/1_stdin/
├── README.md                           # この仕様書
├── 1_core_stdin_handling_test.ts       # コア機能のテスト
├── 2_unit_stdin_test.ts               # 単体テスト
├── 2_integration_stdin_flow_test.ts    # 統合フローテスト
└── 3_integration_stdin_timeout_test.ts # タイムアウト統合テスト
```

## 注意事項

### sanitizeOps と sanitizeResources

すべてのテストで以下の設定を有効にしてください：

```typescript
Deno.test({
  name: "テスト名",
  sanitizeOps: true,      // 非同期操作のリーク検出
  sanitizeResources: true, // リソースリーク検出
  async fn() {
    // テスト内容
  }
});
```

### CI環境での考慮事項

- タイムアウト値は環境に応じて調整可能
- デフォルトは控えめな値を設定
- CI_STDIN_TIMEOUT_MS などの環境変数は使用しない

### エラーハンドリング

- すべてのエラーは適切にキャッチし、テスト失敗として報告
- リソースリークを防ぐため、finally ブロックでクリーンアップ
- AbortController によるキャンセレーションをサポート

## トラブルシューティング

### "async op sanitizer" エラー

このエラーが発生した場合、非同期操作が適切にクリーンアップされていません：

1. `withStdinTest` を使用しているか確認
2. すべての Promise が await されているか確認
3. タイマーが適切にクリアされているか確認

### タイムアウトテストの失敗

CI環境では処理が遅い場合があります：

1. タイムアウト値を増やす
2. `delay` と `timeout` の差を大きくする
3. 並列実行されるテストの数を制限する

### モックが期待通りに動作しない

1. `MockStdinConfig` の設定を確認
2. `isAvailable` と `isTerminal` の値を確認
3. エラーメッセージのスタックトレースを確認

## 関連ドキュメント

- [テスト設計案](/tmp/stdin_test_design_proposal.md)
- [テスト仕様全般](/docs/tests/testing.ja.md)
- [STDIN実装ガイド](/lib/io/stdin_implementation_guide.md)