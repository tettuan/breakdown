# テスト仕様

## テストディレクトリ構造

```
tests/
├── 0_foundation/     # 基盤機能のテスト
│   ├── config_test.ts    # 設定関連
│   └── logger_test.ts    # ロギング関連
├── 1_core/          # コア機能のテスト
│   ├── command/         # コマンド処理
│   ├── prompt/          # プロンプト処理
│   └── params_test.ts   # パラメータ処理
├── 2_integration/   # 統合テスト
│   └── flow_test.ts     # 処理フロー
├── 3_scenarios/     # シナリオテスト
│   └── commands_test.ts # コマンド実行
├── fixtures/        # テストデータ
├── helpers/         # テストヘルパー
└── prompts/         # プロンプトテスト
```

## テスト実行手順

### 基本的なテスト実行
```bash
deno test --allow-env --allow-write --allow-read
```

### デバッグ出力付きテスト
```bash
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### 特定のテストファイルの実行
```bash
deno test <test_file.ts> --allow-env --allow-write --allow-read
```

## テストカバレッジ要件

### 0_foundation/
- 設定ファイルの読み込み
- ログレベルの制御
- 作業ディレクトリの管理

### 1_core/
- コマンドライン引数の解析
- プロンプトの生成と検証
- パラメータのバリデーション

### 2_integration/
- コマンド実行フロー
- ファイル入出力
- エラーハンドリング

### 3_scenarios/
- 実際のユースケース
- エッジケース
- エラー回復

## テストヘルパー

### setup.ts
- テスト環境の初期化
- 一時ディレクトリの作成
- テストデータの準備

### assertions.ts
- プロンプト検証
- ファイル内容の検証
- エラー状態の検証

## デバッグ出力

### テストコードでの使用
```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();
logger.debug("テスト実行開始", { testName: "example" });
```

### ログレベル
- `debug`: 詳細なデバッグ情報
- `info`: 重要な処理の開始/終了
- `warn`: 警告（回復可能なエラー）
- `error`: エラー（処理中断）

## エラー処理とデバッグ

### エラー発生時の調査手順
1. デバッグログの確認
2. テスト環境の状態確認
3. 関連するテストケースの実行
4. エラー再現手順の文書化

### テスト失敗時の対応
1. エラーメッセージの確認
2. デバッグモードでの再実行
3. 関連する実装の確認
4. 修正と再テスト 