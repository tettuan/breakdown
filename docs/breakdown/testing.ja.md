# テスト仕様

## テストディレクトリ構造

```
tests/
├── 0_foundation/           # 基盤機能のテスト
│   ├── 0_env/             # 環境・初期化
│   ├── 1_config/          # 設定管理
│   │   └── config_test.ts
│   ├── 2_commands/        # コマンドパラメータ解析・実行
│   ├── 3_logger/          # ロギング
│   │   ├── logger_test.ts
│   │   └── logger_level_test.ts
│   └── 4_directory_structure/ # ディレクトリ構造管理
├── 1_core/                # コア機能のテスト
│   ├── 0_path/           # パス処理
│   │   ├── path_utils_test.ts
│   │   ├── path_resolver_test.ts
│   │   ├── prompt_path_test.ts
│   │   ├── url_path_test.ts
│   │   └── path_test.ts
│   ├── 1_io/             # I/O処理
│   │   └── stdin_test.ts
│   ├── 2_config/         # 設定管理
│   │   └── working_dir_test.ts
│   ├── 3_prompt/         # プロンプト処理
│   │   ├── prompt_processor_test.ts
│   │   ├── selection_test.ts
│   │   ├── prompt_setup_test.ts
│   │   └── prompt_path_sanitize_test.ts
│   └── cli/              # CLIテスト
│       ├── args_test.ts
│       ├── commands_test.ts
│       └── io_test.ts
├── 2_integration/         # 統合テスト
│   └── 0_flow/           # フロー統合
│       └── flow_test.ts
├── 3_scenarios/           # シナリオテスト
│   └── 0_basic/          # 基本シナリオ
│       └── commands_test.ts
├── fixtures/              # テストデータ
│   ├── prompts/
│   ├── schemas/
│   ├── config/
│   └── projects/
├── helpers/               # テストヘルパー
│   ├── setup.ts
│   ├── test_utils.ts
│   └── assertions.ts
├── tmp/                   # 一時ファイル
├── test_config.yml
├── params_test.ts
└── README.md
```

## テスト実行手順

### 推奨: 一括テスト・CIフローのローカル実行

プロジェクト全体のテスト・フォーマット・Lintチェックを一括で実行するには、以下のスクリプトを利用してください。

```bash
bash scripts/local_ci.sh
```

- CIと同等のフローをローカルで再現します。
- すべての *_test.ts を順に実行し、テスト通過後にフォーマット・Lintチェックを行います。
- エラー時は `DEBUG=true bash scripts/local_ci.sh` で詳細なデバッグ出力が得られます。
- テストは依存順（番号順）で実行されます。
- コミット・プッシュ・マージ前に必ずこのスクリプトで全チェックを通過させてください。

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

## CLI テスト要件

### テストの配置

```
tests/
└── 1_core/
    └── 1_cli/           # CLIテスト専用ディレクトリ
        ├── args_test.ts     # 引数解析テスト
        ├── commands_test.ts # コマンド実行テスト
        └── io_test.ts      # 入出力テスト
```

### テスト項目

1. コマンドライン引数
   - 基本コマンドの認識
   - オプションの解析
   - 引数の組み合わせ
   - 無効な引数のエラー処理

2. コマンド実行
   - 各コマンドの正常系テスト
   - エラー条件でのテスト
   - オプション指定時の動作
   - コマンドの実行結果

3. 入出力処理
   - 標準入力からの読み込み
   - 標準出力への書き込み
   - エラー出力の制御
   - ログレベルの動作確認

### テスト方法

```typescript
// コマンドライン引数のテスト例
Deno.test("CLI argument parsing - init command", async () => {
  const result = await runCommand(["init", "--config", "custom.json"]);
  assertCommandSuccess(result);
  // 期待される出力の検証
});

// エラー処理のテスト例
Deno.test("CLI error handling - invalid command", async () => {
  const result = await runCommand(["invalid"]);
  assertEquals(result.error.includes("Unknown command"), true);
});
```

### テストヘルパー関数

- `runCommand()`: コマンド実行のラッパー
- `assertCommandSuccess()`: コマンド成功の検証
- `assertCommandOutput()`: 出力内容の検証
- `mockStdin()`: 標準入力のモック

### 統合テストでの確認項目

1. エンドツーエンドのワークフロー
2. 実際のファイルシステムとの連携
3. 設定ファイルの読み込み
4. エラー回復とリトライ

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
4. テスト失敗の前処理判定
5. 修正と再テスト

### テスト失敗の前処理判定

- テストの目的ではない前処理で失敗した場合、別の処理前のテストが必要。
- 前処理のテストは local_ci.sh で先に実行済みとなるように、実行順を前段階で配置する。
- 前処理の例：
  - 設定判定のテストだが設定ファイルの読み込みに失敗する
    - 設定ファイルの読み込みテストを作る
- 前処理ではない例:
  - 設定判定のテストで設定値が一致しないため失敗する
- テストの前処理は、該当テストより前に実施された確認済みプロセスを利用すること。後工程のテストが独自実装しないことが重要。

# スケルトンコードの構築順序(テスト駆動)

- 「テストディレクトリ構造」に従い、テストファイルを作成する
- スケルトンの作成：テスト項目を、先にテスト対象として記述する（まだテストの内容は書かない）
- スケルトンには、テストが失敗する記述を入れておく
- コメントを記載する
  - あなたが他人のコードを読んだときに「知りたい」と思うことを記載する
  - テストの意図や目的、テストした方が良いと考えた理由を記述する
  - テストが扱う対象を明記する
