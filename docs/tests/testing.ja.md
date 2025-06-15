# テスト仕様

> **テスト用のパス解決・パラメータ構築の実装例については [app_factory.ja.md](./app_factory.ja.md) も参照してください。**

## テスト設計原則

テストは以下の原則に従って設計されています：

1. **段階的な複雑性**
   - 基本機能から始まり、徐々に複雑なユースケースへと進む
   - 各段階で必要な前提条件が満たされていることを確認
   - 前段階のテストが成功していることを前提とする

2. **階層的な構造**
   - 単体テスト（実装ファイルと同じ階層に配置）
   - アーキテクチャテスト（実装ファイルと同じ階層に配置）
   - 構造テスト（実装ファイルと同じ階層に配置）
   - 結合テスト（tests/配下に配置）
   - E2Eテスト（tests/配下に配置）

3. **テストファイルの配置**
   - 単体/アーキテクチャ/構造テスト: 実装ファイルと同じ階層
   - 結合/E2Eテスト: tests/ディレクトリ配下

4. **実行順序の保証**
   - 依存関係に基づいた実行順序の制御
   - 前段階のテストが成功していることを確認

## テストディレクトリ構造

```
lib/io/
  └── stdin.ts
      ├── 0_architecture_stdin_test.ts
      ├── 1_structure_stdin_test.ts
      └── 2_unit_stdin_test.ts
lib/factory/
  └── input_file_path_resolver.ts
  └── tests/
      ├── 0_architecture_input_file_path_resolver_test.ts
      ├── 1_structure_input_file_path_resolver_test.ts
      └── 2_unit_input_file_path_resolver_test.ts
tests/
  ├── 3_integration/
  │   └── input_file_path_resolver_test.ts
  └── 4_e2e/
      └── input_file_path_resolver_test.ts
```

## テストファイル命名規則

テストファイルは、その目的に応じて以下の命名規則に従います：

1. **アーキテクチャテスト**
   - 命名規則: `0_architecture_<実装ファイル名>.ts`
   - 例: `0_architecture_model.ts`
   - 用途: アーキテクチャの制約や依存関係の検証
   - 配置: 実装ファイルと同じ階層
   - 検証項目:
     - 依存関係の方向性
     - 循環参照の有無
     - レイヤー間の境界
     - インターフェースの一貫性

2. **構造テスト**
   - 命名規則: `1_structure_<実装ファイル名>.ts`
   - 例: `1_structure_model.ts`
   - 用途: クラス構造や責務分離の検証
   - 配置: 実装ファイルと同じ階層
   - 検証項目:
     - 単一責任の原則の遵守
     - 責務の重複の有無
     - 適切な抽象化レベル
     - クラス間の関係性

3. **単体テスト**
   - 命名規則: `2_unit_<実装ファイル名>.ts`
   - 例: `2_unit_model.ts`
   - 用途: 機能の動作検証
   - 配置: 実装ファイルと同じ階層

4. **結合テスト**
   - 命名規則: `3_integration_<機能名>.ts`
   - 例: `3_integration_params_parser.ts`
   - 用途: 複数のコンポーネント間の連携検証
   - 配置: tests/3_integration/

5. **E2Eテスト**
   - 命名規則: `4_e2e_<機能名>.ts`
   - 例: `4_e2e_params_parser.ts`
   - 用途: エンドツーエンドの動作検証
   - 配置: tests/4_e2e/

## テストの依存関係

テストは以下の順序で実行されます：

1. モデルと型のテスト
   - 基本的なデータ構造と型の検証
   - バリデーションルールの検証

2. 派生コンポーネントのテスト
   - モデルや型を利用した機能の検証
   - Factoryやユーティリティの検証

3. ParamsParserのテスト
   - 個別の機能検証
   - 全体の統合検証

### 依存関係の例

```
tests/
  ├── 3_integration/
  │   └── input_file_path_resolver_core_test.ts
  └── 4_e2e/
      └── input_file_path_resolver_basic_test.ts
  └── 5_edgecase/
```


## テスト実行手順

### 推奨: 一括テスト・CIフローのローカル実行

プロジェクト全体のテスト・フォーマット・Lintチェックを一括で実行するには、以下のスクリプトを利用してください。

```bash
bash scripts/local_ci.sh
```

- CIと同等のフローをローカルで再現します。
- すべての *_test.ts を順に実行し、テスト通過後にフォーマット・Lintチェックを行います。
- エラー時は `LOG_LEVEL=debug deno task ci` で詳細なデバッグ出力が得られます。
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

### テスト実行時のログ制御

BreakdownLoggerは、テスト実行時に特に有用な環境変数による詳細なログ制御機能を提供します：

#### LOG_KEY による特定ログの抽出

特定のキーワードを含むログメッセージのみを出力することで、テスト時のノイズを削減できます：

```bash
# 特定の機能に関連するログのみ表示
LOG_KEY="parser" deno test --allow-env --allow-write --allow-read

# 複数のキーワードでフィルタリング（カンマ区切り）
LOG_KEY="parser,validation" deno test --allow-env --allow-write --allow-read

# エラー関連のログのみ表示
LOG_KEY="error,fail" deno test --allow-env --allow-write --allow-read
```

#### LOG_LENGTH による出力制御

ログメッセージの長さを制限することで、大量データのテスト時でも読みやすい出力を得られます：

```bash
# ログメッセージを100文字に制限
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# 長いメッセージ（200文字）で詳細表示
LOG_LENGTH=L deno test --allow-env --allow-write --allow-read

# 制限なしで完全な詳細表示
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read

# デフォルト（30文字）短縮表示
deno test --allow-env --allow-write --allow-read
```

#### 組み合わせた高度なログ制御

テスト状況に応じて、両方の機能を組み合わせて使用できます：

```bash
# パーサー関連の短いログのみ表示
LOG_KEY="parser" LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# エラー系の詳細ログを表示
LOG_KEY="error" LOG_LENGTH=W LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### テスト段階別のログ設定推奨例

1. **開発初期・デバッグ時**
   ```bash
   LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

2. **特定機能のテスト時**
   ```bash
   LOG_KEY="target_function" LOG_LEVEL=debug deno test
   ```

3. **CI実行時・本番確認**
   ```bash
   LOG_LEVEL=info LOG_LENGTH=S deno test
   ```

4. **エラー調査時**
   ```bash
   LOG_KEY="error,fail,exception" LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

### テストコード内でのログ活用

```typescript
// テスト対象を明確にするためのログ
const logger = new BreakdownLogger("test-parser");
logger.debug("テスト開始: パラメータバリデーション", { 
  testCase: "invalid_input",
  input: inputData 
});

// テスト中の状態確認用ログ
const processLogger = new BreakdownLogger("preprocessing");
processLogger.info("中間処理完了", { 
  step: "preprocessing",
  result: processedData 
});

// エラー再現時の詳細ログ
const errorLogger = new BreakdownLogger("validation-error");
errorLogger.error("期待されるエラーが発生", { 
  expected: true,
  errorType: "ValidationError",
  details: errorDetails 
});
```

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
