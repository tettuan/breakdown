# Breakdown テスト仕様書

## テストの目的

Breakdownは、プロジェクト管理のための階層的なタスク分解をサポートするツールです。
このテスト仕様書は、以下の2つの観点からBreakdownの品質を保証します：

1. **階層的分解の正確性**
   - プロジェクト → イシュー → タスクの変換が正確に行われること
     ```typescript
     // 例：プロジェクトからイシューへの分解
     breakdown to issue --from project.md
     // 結果：プロジェクトの主要機能ごとにイシューが生成される
     ```
   - 各レイヤー間の関係性（依存関係、優先度など）が保持されること
   - GitHub Issuesとの連携を前提とした出力形式であること

2. **設定とリソース管理の確実性**
   - 作業ディレクトリ構造の整合性
     ```yaml
     # app.yml での定義
     working_dir: .agent/breakdown
     app_prompt:
       base_dir: lib/breakdown/prompts
     app_schema:
       base_dir: lib/breakdown/schema
     ```
   - プロンプトとスキーマの適切な配置と選択
   - パス解決の正確性（相対パス、絶対パス、ファイル名のみの場合）

注：テストコードのデバッグには @tettuan/breakdownlogger を使用し、テストの実行状況や問題の特定を支援します。

## 依存ライブラリの検証

アプリケーションは以下のライブラリに依存しています：
- @tettuan/breakdownconfig: 設定管理
- @tettuan/breakdownparams: コマンドライン引数の解析
- @tettuan/breakdownprompt: プロンプト処理
- @tettuan/breakdownlogger: テストコードのデバッグ用

これらのライブラリの検証は、アプリケーションのテストとは別に、以下の形で行います：

1. **ライブラリのインストールと読み込みの確認**
   ```typescript
   // tests/0_foundation/setup_test.ts
   Deno.test("必要なライブラリが利用可能であること", async (t) => {
     // 各ライブラリが正しくインポートできることを確認
     const { BreakdownConfig } = await import("@tettuan/breakdownconfig");
     const { BreakdownParams } = await import("@tettuan/breakdownparams");
     const { BreakdownPrompt } = await import("@tettuan/breakdownprompt");
     
     // バージョンの確認
     assertEquals(BreakdownConfig.version, "0.1.10");
     // ...
   });
   ```

2. **ライブラリのバージョン整合性の確認**
   - アプリケーションの依存関係定義と実際のバージョンの一致
   - 各ライブラリ間のバージョン互換性

## アプリケーションのテスト構成

```
tests/
├── 0_foundation/           # 基盤テスト
│   ├── setup_test.ts      # 依存ライブラリの検証
│   ├── init_test.ts       # 初期化機能の検証
│   ├── config_test.ts     # アプリケーション設定の検証
│   └── logger_test.ts     # テストデバッグ用ログ機能
│
├── 1_core/                # コア機能テスト
│   ├── command/           # コマンドライン処理
│   │   ├── basic_commands_test.ts  # init, to, summary, defect
│   │   └── params_test.ts         # --from, --to, --input
│   ├── prompt/            # プロンプト処理
│   │   ├── selection_test.ts      # demonstrativeType/layerType
│   │   └── schema_test.ts         # スキーマの適用検証
│   └── path/              # パス解決（path.ja.md準拠）
│       ├── input_test.ts         # 入力パスの正規化
│       └── output_test.ts        # 出力パス生成規則
│
├── 2_integration/         # 連携テスト
│   ├── project_breakdown/         # 階層変換
│   │   ├── to_issues_test.ts     # プロジェクト→イシュー
│   │   └── to_tasks_test.ts      # イシュー→タスク
│   └── workflow/                 # 変換フロー
│       ├── init_flow_test.ts     # 初期化フロー
│       └── convert_flow_test.ts  # 変換フロー
│
├── 3_scenarios/           # シナリオテスト
│   ├── convert/          # 変換シナリオ
│   │   ├── basic_flow/  # 基本的な変換フロー
│   │   │   ├── project_to_issue_test.ts  # プロジェクト→イシュー
│   │   │   └── issue_to_task_test.ts     # イシュー→タスク
│   │   │
│   │   └── input_variations/  # 入力バリエーション
│   │       ├── markdown_test.ts    # Markdown形式
│   │       └── plain_text_test.ts  # プレーンテキスト
│   │
│   └── error_handling/  # エラー対応シナリオ
│       └── invalid_input_test.ts   # 不正な入力ファイル
│
└── helpers/              # テストヘルパー
    ├── setup.ts          # テスト環境のセットアップ
    └── assertions.ts     # カスタムアサーション
```

このディレクトリ構造により：
- 各階層のテストを独立して実行可能
- テストの目的と範囲が明確
- テストデータとヘルパー関数を共有可能
- アプリケーションの基本的なユースケースをカバー

### 1. 基盤テスト（0_foundation/）
- アプリケーションの設定機能の検証
  ```
  tests/0_foundation/
  ├── setup_test.ts      # 依存ライブラリの検証
  ├── init_test.ts       # 初期化機能の検証
  │                      # - 新規環境での初期化
  │                      # - 既存環境での再初期化
  ├── config_test.ts     # アプリケーション設定の検証
  │                      # - app.yml, user.yml の読み込み
  │                      # - 作業ディレクトリの構造確認
  │                      # - プロンプト/スキーマの配置確認
  └── logger_test.ts     # テストデバッグ用ログ機能
  ```

### 2. 基本操作テスト（1_core/）: コマンドとパス処理
- コマンドライン引数の解析とパス解決の検証
  ```
  tests/1_core/
  ├── command/                    # コマンドライン処理
  │   ├── basic_commands_test.ts  # init, to, summary, defect
  │   └── params_test.ts         # --from, --to, --input
  ├── prompt/                     # プロンプト処理
  │   ├── selection_test.ts      # demonstrativeType/layerType
  │   └── schema_test.ts         # スキーマの適用検証
  └── path/                      # パス解決（path.ja.md準拠）
      ├── input_test.ts         # 入力パスの正規化
      └── output_test.ts        # 出力パス生成規則
  ```

### 3. 変換操作テスト（2_integration/）: 階層変換処理
- プロジェクト分解機能の検証
  ```
  tests/2_integration/
  ├── project_breakdown/         # 階層変換
  │   ├── to_issues_test.ts     # プロジェクト→イシュー
  │   └── to_tasks_test.ts      # イシュー→タスク
  └── workflow/                 # 変換フロー
      ├── init_flow_test.ts     # 初期化フロー
      └── convert_flow_test.ts  # 変換フロー
  ```

### 4. 実践シナリオ（3_scenarios/）: エンドツーエンドの検証
- 実際のユースケースに基づく統合テスト
  ```
  tests/3_scenarios/
  ├── convert/                  # 変換シナリオ
  │   ├── basic_flow/          # 基本的な変換フロー
  │   │   ├── project_to_issue_test.ts  # プロジェクト→イシュー
  │   │   └── issue_to_task_test.ts     # イシュー→タスク
  │   │
  │   └── input_variations/    # 入力バリエーション
  │       ├── markdown_test.ts    # Markdown形式
  │       └── plain_text_test.ts  # プレーンテキスト
  │
  └── error_handling/          # エラー対応シナリオ
      └── invalid_input_test.ts   # 不正な入力ファイル
  ```

各シナリオは、以下のパターンを検証します：

1. **変換シナリオ**
   ```typescript
   // プロジェクト→イシュー変換（基本フロー）
   Deno.test("基本的な変換フロー", async (t) => {
     // 前提条件：
     // - プロジェクトファイル: project.md
     // - 初期化済みの環境
     
     // 操作：
     // breakdown to issue --from project.md
     
     // 期待結果：
     // - イシューファイルが生成される
     // - GitHub Issues形式に準拠している
   });

   // 異なる入力形式での変換
   Deno.test("プレーンテキストからの変換", async (t) => {
     // 前提条件：
     // - プレーンテキストファイル: project.txt
     
     // 操作：
     // breakdown to issue --from project.txt
     
     // 期待結果：
     // - テキストが適切に解析される
     // - イシューファイルが生成される
   });
   ```

2. **エラー対応シナリオ**
   ```typescript
   // 不正な入力ファイル
   Deno.test("不正な入力ファイルのエラー処理", async (t) => {
     // 前提条件：
     // - 不正な形式のファイル: invalid.md
     
     // 操作：
     // breakdown to issue --from invalid.md
     
     // 期待結果：
     // - 適切なエラーメッセージが表示される
     // - 処理が安全に中断される
   });
   ```

各テストケースは、以下の要素を明確にして設計します：

1. **前提条件の明確化**
   - 必要なファイルや設定の状態
   - 環境の初期状態

2. **操作手順の具体化**
   - 実行するコマンドとパラメータ
   - 入力データの詳細

3. **期待結果の定義**
   - 生成されるファイルの内容と形式
   - エラー時の挙動と出力

## テスト方針

### 基本方針
- アプリケーションが提供する機能を、ユーザーの視点で検証
- 各機能の結合部分での動作を重点的に確認
- エラー発生時のユーザーへのフィードバックを検証
- 設定変更の影響を包括的に確認

### テスト実行の考え方
1. 階層別の独立実行
   - 基盤となる機能から順に検証を積み上げる
   - 各階層の成功が次の階層のテストの前提となる
   - 問題発生時の原因特定を容易にする

2. テスト階層の意図
   - 0番台（基盤テスト）: アプリケーションの基本動作の信頼性を確保
     - 設定ファイルが正しく読み込まれ、アプリケーションの動作を制御できること
     - アプリケーションの初期化が確実に行われ、必要なリソースが準備されること

   - 1番台（コア機能）: 個々の機能が期待通りに動作することを確認
     - ユーザーの入力が正しく解釈され、適切なコマンドとして実行されること
     - プロンプトとスキーマが状況に応じて正しく選択され、適用されること
     - ファイルの入出力が安全に行われ、期待した場所に正しく保存されること

   - 2番台（連携テスト）: 機能の組み合わせが正しく動作することを確認
     - 設定内容がアプリケーション全体で一貫して反映されること
     - 各レイヤー間の変換が、データの整合性を保ちながら行われること
     - エラーが適切に検出され、ユーザーに分かりやすく通知されること

   - 3番台（シナリオ）: 実際の利用シーンで期待通りに動作することを確認
     - プロジェクトの分解からタスクの生成まで、一連の流れが正しく機能すること
     - 複雑なプロジェクトでも確実に処理できること
     - エラー発生時にユーザーが適切に回復できること

3. 段階的な品質確保
   - 下位層から順にテストを実行し、基盤から積み上げて品質を確保
   - 各層でのテスト成功は、その層に依存する上位層のテストが意味を持つことを保証
   - テスト失敗時は、その層の問題を解決してから上位層のテストを実行

### 依存関係に基づくテスト戦略
1. 前提条件の検証
   - 設定ファイルの読み込みは全ての機能の前提となるため最優先で検証
   - パラメータ処理は、全てのコマンド実行の入り口となるため優先的に検証

2. 機能の依存関係チェーン
   - 設定 → パラメータ処理 → プロンプト管理 → パス処理 の順で機能が連鎖
   - 各機能は前段の機能が正常に動作することを前提とする
   - エラーは依存関係に沿って伝播することを確認

3. 統合ポイントの特定
   - 複数の機能が交わる箇所を特定し、それらの連携を重点的に検証
   - 特に、設定とパラメータの組み合わせ、プロンプトとパス処理の連携を注視

## テスト手法
- Deno Test を使用し、依存関係を考慮したテストスイートを構築
- モック/スタブは依存関係の切り離しが必要な箇所のみに限定
- テストデータは依存関係チェーンを通して一貫性のある値を使用
- テストコードのデバッグには @tettuan/breakdownlogger を使用
- 各テストは可能な限り独立して実行可能にしつつ、依存関係も考慮

## テストリソース管理

### テストデータ管理（fixtures/）
1. データの種類と配置
   - 設定ファイル（config/）
     - アプリケーション設定のサンプル: `app.sample.yml`
     - ユーザー設定のサンプル: `user.sample.yml`
     - エラーケース用設定: `error_*.yml`
   - プロンプト（prompts/）
     - 各レイヤー・タイプごとのサンプル
     - 変数置換テスト用のテンプレート
   - プロジェクト（projects/）
     - 変換元データのサンプル
     - 期待される変換結果

2. 命名規則
   - 正常系: `{target}_{case}.{ext}`
     例: `project_basic.md`, `issue_with_subtasks.md`
   - エラー系: `error_{type}_{case}.{ext}`
     例: `error_invalid_config.yml`, `error_missing_required.md`
   - テンプレート: `template_{type}.{ext}`
     例: `template_project.md`, `template_issue.md`

3. バージョン管理方針
   - すべてのテストデータをGitで管理
   - バイナリデータは除外（.gitignoreで管理）
   - テストデータの更新は変更履歴を残す
   - 大きな変更の場合はPRで管理

### テストヘルパー（helpers/）

1. **機能検証ヘルパー（assertions/）**
   ```typescript
   // CLI機能の検証
   export class CliAssertions {
     // コマンドライン引数の解析結果を検証
     static assertValidParsing(args: string[], expected: CommandParams): void;
     // エラー処理の検証
     static assertErrorHandling(args: string[], expectedError: ErrorType): void;
     // ヘルプ表示の検証
     static assertHelpDisplay(args: string[], expectedContent: string): void;
   }

   // ファイル操作の検証
   export class FileAssertions {
     // ファイルの存在確認
     static assertFileExists(path: string): void;
     // ファイル内容の検証
     static assertFileContent(path: string, expected: string): void;
   }

   // その他の基本機能の検証
   export class CoreAssertions {
     // 設定値の検証
     static assertConfigValue(key: string, expected: unknown): void;
     // ログ出力の検証
     static assertLogOutput(level: string, message: string): void;
   }
   ```

2. **シナリオテスト用ヘルパー（scenarios/）**
   ```typescript
   // シナリオの実行をサポート
   export class ScenarioRunner {
     // 一連のコマンドを実行
     async runCommands(commands: string[]): Promise<void>;
     // 実行結果を検証
     async assertScenarioResult(expected: ScenarioResult): void;
   }

   // テスト環境のセットアップ
   export class TestEnvironment {
     // テスト用の作業ディレクトリを準備
     static async prepare(scenario: string): Promise<void>;
     // テスト終了後のクリーンアップ
     static async cleanup(): Promise<void>;
   }
   ```

3. **テストデータ管理（fixtures/）**
   ```typescript
   // テストデータのローダー
   export class TestDataLoader {
     // プロジェクトデータの読み込み
     static loadProject(name: string): Promise<ProjectData>;
     // イシューデータの読み込み
     static loadIssue(name: string): Promise<IssueData>;
     // タスクデータの読み込み
     static loadTask(name: string): Promise<TaskData>;
   }
   ```

### テストケースの記述例

1. **機能の信頼性テスト**
   ```typescript
   // tests/0_foundation/cli_test.ts
   import { CliAssertions } from "../helpers/assertions/cli.ts";

   Deno.test("CLIパラメータの基本機能", async (t) => {
     await t.step("to コマンドの基本パラメータ", () => {
       CliAssertions.assertValidParsing(
         ["to", "issue", "--from", "project.md"],
         {
           command: "to",
           target: "issue",
           source: "project.md"
         }
       );
     });
   });
   ```

2. **シナリオテスト**
   ```typescript
   // tests/3_scenarios/project_breakdown_test.ts
   import { ScenarioRunner } from "../helpers/scenarios/runner.ts";
   import { CliAssertions } from "../helpers/assertions/cli.ts";

   Deno.test("プロジェクトからイシューへの分解", async (t) => {
     const runner = new ScenarioRunner();
     
     // 基本機能の検証は再利用
     await t.step("コマンドパラメータの検証", () => {
       CliAssertions.assertValidParsing(/* ... */);
     });

     // シナリオ固有のテスト
     await t.step("イシューへの分解実行", async () => {
       await runner.runCommands([
         "breakdown to issue --from project.md"
       ]);
       await runner.assertScenarioResult({
         outputFiles: ["issue_1.md", "issue_2.md"],
         status: "success"
       });
     });
   });
   ```

この構造により：
- 基本的な機能検証は再利用可能なヘルパーとして提供
- シナリオテストでは、必要な機能検証を呼び出しつつ、シナリオ固有の検証に集中
- テストの重複を避けながら、必要な検証を確実に実施

## CI/CDでのテスト実行

### GitHub Actions設定
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        
      - name: Foundation Tests
        run: deno test tests/0_foundation/
        
      - name: Core Tests
        if: success()
        run: deno test tests/1_core/
        
      - name: Integration Tests
        if: success()
        run: deno test tests/2_integration/
        
      - name: Scenario Tests
        if: success()
        run: deno test tests/3_scenarios/
```

### テスト実行制御
1. 実行順序
   - 基盤テスト → コア機能テスト → 連携テスト → シナリオテスト
   - 各段階で失敗した場合、以降のテストはスキップ
   - テスト結果は各段階でGitHub Actionsに記録

2. 環境変数
   ```bash
   # テストモード設定
   TEST_MODE=unit|integration|e2e
   
   # テストデバッグ用ログレベル設定
   LOG_LEVEL=debug|info|error
   
   # テストタイムアウト設定
   TEST_TIMEOUT=5000  # ミリ秒
   ```

3. レポーティング
   - テスト結果はGitHub Actionsで確認可能
   - テストカバレッジレポートを生成
   - 失敗したテストの詳細ログを保存

### ローカルでのテスト実行
1. 全テストの実行
   ```bash
   deno test --allow-all
   ```

2. 特定階層のテスト実行
   ```bash
   # 基盤テストのみ実行
   deno test tests/0_foundation/
   
   # コア機能テストのみ実行
   deno test tests/1_core/
   ```

3. 特定のテストファイル実行
   ```bash
   # 設定テストのみ実行
   deno test tests/0_foundation/config_test.ts
   ```

4. デバッグモードでの実行
   ```bash
   # テストコードのデバッグ情報を出力
   LOG_LEVEL=debug deno test --allow-all
   ```