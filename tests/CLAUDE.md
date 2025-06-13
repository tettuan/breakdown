# BreakdownLogger 使用ガイド (tests)

## 概要
BreakdownプロジェクトのテストでBreakdownLoggerを使用する方法を説明します。

## バージョン情報
- **現在**: v1.0.0
- **最新**: v1.0.1

## 基本的な使用方法

### インポート
```typescript
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
```

### インスタンス化
```typescript
// シンプルな初期化（推奨）
const logger = new BreakdownLogger();

// キー付き初期化（フィルタリング用）
const logger = new BreakdownLogger("module-name");
```

## テスト実行時のユースケース

### 1. 基本的なテスト実行

#### すべてのログを表示
```bash
LOG_LEVEL=debug deno test example_test.ts --allow-env --allow-write --allow-read
```

#### エラーのみ表示（CI向け）
```bash
LOG_LEVEL=error deno test --allow-env --allow-write --allow-read
```

### 2. ログ出力量の制御（LOG_LENGTH）

#### 短いログ（概要確認）
```bash
# デフォルト: 30文字
deno test --allow-env --allow-write --allow-read

# SHORT: 100文字
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read
```

#### 長いログ（詳細調査）
```bash
# LONG: 200文字
LOG_LENGTH=L LOG_LEVEL=debug deno test failing_test.ts --allow-env --allow-write --allow-read

# WHOLE: 無制限（完全なデバッグ）
LOG_LENGTH=W LOG_LEVEL=debug deno test complex_test.ts --allow-env --allow-write --allow-read
```

### 3. 特定モジュールのフィルタリング（LOG_KEY）

#### 単一モジュールのデバッグ
```typescript
// コード内でキーを設定
const logger = new BreakdownLogger("cli-validator");
```

```bash
# 実行時に特定キーのみ表示
LOG_KEY=cli-validator LOG_LEVEL=debug deno test cli_test.ts --allow-env --allow-write --allow-read
```

#### 複数モジュールの監視
```bash
# カンマ区切り
LOG_KEY="auth,validation,database" LOG_LENGTH=L deno test --allow-env --allow-write --allow-read

# コロン区切り（階層的）
LOG_KEY="cli:args:parser" LOG_LEVEL=debug deno test cli/ --allow-env --allow-write --allow-read

# スラッシュ区切り（パス風）
LOG_KEY="tests/core/cli" deno test tests/core/ --allow-env --allow-write --allow-read
```

## 実践的なユースケース

### ケース1: CI環境での実行
```bash
# エラーのみ、短いメッセージ
LOG_LEVEL=error scripts/local_ci.sh

# デバッグモード時は詳細表示
DEBUG=true LOG_LENGTH=L scripts/local_ci.sh
```

### ケース2: 特定のテスト失敗の調査
```bash
# Step 1: エラー箇所の特定（短いログ）
LOG_LEVEL=error deno test failing_test.ts --allow-env --allow-write --allow-read

# Step 2: 該当モジュールの詳細調査
LOG_KEY=failing-module LOG_LENGTH=L LOG_LEVEL=debug deno test failing_test.ts --allow-env --allow-write --allow-read

# Step 3: 完全なトレース
LOG_LENGTH=W LOG_LEVEL=debug deno test failing_test.ts --allow-env --allow-write --allow-read
```

### ケース3: パフォーマンステストでの使用
```bash
# 最小限のログでパフォーマンスへの影響を抑制
LOG_LEVEL=error deno test performance_test.ts --allow-env --allow-write --allow-read

# 問題発生時のみ詳細確認
LOG_KEY=performance-bottleneck LOG_LENGTH=W LOG_LEVEL=debug deno test performance_test.ts --allow-env --allow-write --allow-read
```

### ケース4: 統合テストでの段階的デバッグ
```bash
# 全体の流れを確認
LOG_LENGTH=S LOG_LEVEL=info deno test integration/ --allow-env --allow-write --allow-read

# 特定のフローを追跡
LOG_KEY="auth,api-client" LOG_LENGTH=L LOG_LEVEL=debug deno test integration/ --allow-env --allow-write --allow-read

# 問題箇所を詳細調査
LOG_KEY=api-client LOG_LENGTH=W LOG_LEVEL=debug deno test integration/api_test.ts --allow-env --allow-write --allow-read
```

## setupTestEnvironment との組み合わせ

```typescript
import { setupTestEnvironment, cleanupTestEnvironment } from "$test/helpers/setup.ts";

Deno.test("example test", async () => {
  const testEnv = await setupTestEnvironment({
    workingDir: "./tmp/test/example",
    logLevel: LogLevel.DEBUG  // 環境変数を自動設定
  });
  
  // テストロジック
  testEnv.logger.debug("Test started");
  testEnv.logger.info("Processing data");
  testEnv.logger.error("Error occurred", { code: "ERR_001" });
  
  await cleanupTestEnvironment(testEnv);
});
```

## トラブルシューティング

### ログが出力されない
```bash
# 環境変数を明示的に設定
LOG_LEVEL=debug LOG_LENGTH=W deno test your_test.ts --allow-env --allow-write --allow-read
```

### 特定のモジュールのログが見えない
```typescript
// コード内でキーが正しく設定されているか確認
const logger = new BreakdownLogger("my-module");  // このキーを使用

// 実行時
LOG_KEY=my-module LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### ログが途切れる
```bash
# LOG_LENGTH を W (WHOLE) に設定
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read
```

## ベストプラクティス

1. **開発時**: `LOG_LENGTH=L LOG_LEVEL=debug` で詳細情報を取得
2. **CI実行時**: `LOG_LEVEL=error` でノイズを削減
3. **デバッグ時**: `LOG_KEY` で特定モジュールに絞り込み
4. **本番テスト**: 最小限のログ設定でパフォーマンスを維持

## 環境変数サマリー

| 環境変数 | 値 | 説明 |
|---------|-----|------|
| LOG_LEVEL | debug, info, warn, error | ログレベル制御 |
| LOG_LENGTH | S, L, W | S=100文字, L=200文字, W=無制限 |
| LOG_KEY | 文字列（カンマ/コロン/スラッシュ区切り） | モジュールフィルタ |

---
*最終更新: 2025-01-13*
*BreakdownLogger バージョン: v1.0.0 → v1.0.1（アップグレード推奨）*