# Breakdown CLI Examples

このドキュメントでは、Breakdownツールの主なCLI利用例を紹介します。

## インストール

### システムへのインストール

```bash
deno add @tettuan/breakdown
```

### AI開発リポジトリにのみインストール

```bash
deno add --root ./tools @tettuan/breakdown
```

インストールせずに使用する場合：

```bash
deno run --allow-read --allow-net jsr:@tettuan/breakdown
```

## ユースケース

ユーザーは、`breakdown` 実行に必要な、「プロンプト」と「設定」をセットアップします。
完了後、実行環境をきれいにするため、クリアする必要があります。

1. 事前準備:
  - 設定ファイルを作成する必要があります。`breakdown init`がデフォルトの作成を行います。(そのためのshが必要)
  - プロンプトとSchemaファイルは、実行時にshが作成します。この examples/ 配下に作成してください。(そのためのshが必要)
2. 事後清算: 実行によって生成された出力、インプット用ファイル、プロンプトや設定ファイルをクリーンにする必要があります。（99_cleanup.sh）


## 構成

### 前準備 (00-03)
1. `00_instructions.sh` - 使用方法の説明とガイダンス
2. `01_install.sh` - Breakdownのインストール案内
3. `02_init_deno_run.sh` - プロジェクトの初期化 (deno run で直接実行)
4. `03_create_user_config.sh` - ユーザー設定の作成 (deno run で直接実行)

### 基本使用例 (04-05)
5. `04_stdin_example.sh` - STDIN入力の利用例
6. `05_basic_usage.sh` - 基本的なコマンド使用例 (to, summary, defect)

### 設定例 (06-11)
7. `06_config_basic.sh` - 基本的な設定例
8. `07_config_production.sh` - 本番環境用設定例
9. `08_config_team.sh` - チーム開発用設定例
10. `09_config_environments.sh` - 環境別設定例
11. `10_config_production_example.sh` - 本番環境設定とバグ検出例
12. `11_config_production_custom.sh` - 本番環境カスタム設定とFind Bugs

### 追加例 (12-18)
13. `12_summary_issue.sh` - summary issueコマンドの例
14. `13_defect_patterns.sh` - defect issue/taskコマンドの例
15. `14_custom_variables.sh` - カスタム変数とadaptationオプション
16. `15_pipeline_processing.sh` - パイプライン処理の例
17. `16_batch_processing.sh` - バッチ処理の例
18. `17_error_handling.sh` - エラーハンドリングの例
19. `18_cicd_integration.sh` - CI/CD統合の例

### クリーンアップ
20. `19_clean.sh` - 生成されたファイルのクリーンアップ

## 前準備の詳細

### 1. 使用方法の説明とガイダンス
```bash
./examples/00_instructions.sh
```
このスクリプトは以下を案内します：
- Examples の使用方法とワークフロー
- 各スクリプトの目的と実行順序

### 2. インストール案内
```bash
./examples/01_install.sh
```
このスクリプトは以下を案内します：
- Breakdown CLIの推奨利用方法（deno task, バイナリ, グローバルインストール）

### 3. 初期化 (deno run で直接実行)
```bash
./examples/02_init_deno_run.sh
```
このスクリプトは以下を実行します（`deno run` で `cli/breakdown.ts` を直接使用）：
- プロジェクト構造の初期化
- 必要なディレクトリの作成
- 基本設定の配置

### 4. ユーザー設定 (deno run で直接実行)
```bash
./examples/03_create_user_config.sh
```
このスクリプトは以下を実行します（`deno run` で `cli/breakdown.ts` を直接使用）：
- `./.agent/breakdown/config/user.yml` の作成
- working_dirの設定（`./.agent/breakdown/examples`）
- 基本設定の構成

## 使用例の詳細

### 5. STDIN入力の利用例
```bash
./examples/04_stdin_example.sh
```
このスクリプトは以下を実行します：
- echoやcatでパイプしてBreakdown CLIにSTDIN入力を渡す
- summaryコマンドでプロジェクトサマリーを生成
- 生成ファイルの確認

### 6. 基本的なコマンド使用例
```bash
./examples/05_basic_usage.sh
```
このスクリプトは以下を実行します：
- `breakdown to issue` - プロジェクト仕様からイシューへの分解
- `breakdown summary task` - 散らかったメモをタスクサマリーに整理
- `breakdown defect project` - エラーログから欠陥分析
- `breakdown find bugs` - コード内のバグ検出（※カスタム設定が必要。デフォルトでは利用不可）

## 設定例の詳細

### 7. 基本的な設定例
```bash
./examples/06_config_basic.sh
```
このスクリプトは以下を実行します：
- 基本的な設定ファイルの作成
- デフォルト設定の確認
- 簡単な設定のカスタマイズ

### 8. 本番環境用設定例
```bash
./examples/07_config_production.sh
```
このスクリプトは以下を実行します：
- 本番環境向けの設定ファイル作成
- セキュリティ設定の強化
- パフォーマンス最適化設定

### 9. チーム開発用設定例
```bash
./examples/08_config_team.sh
```
このスクリプトは以下を実行します：
- チーム開発向けの共有設定
- コラボレーション設定
- 権限管理の設定

### 10. 環境別設定例
```bash
./examples/09_config_environments.sh
```
このスクリプトは以下を実行します：
- 開発、ステージング、本番環境の設定切り替え
- 環境変数による設定管理
- 環境別のプロンプト設定

### 11. 本番環境設定とバグ検出例
```bash
./examples/10_config_production_example.sh
```
このスクリプトは以下を実行します：
- production-user.ymlを使用した `breakdown find bugs` コマンドのデモンストレーション
- バグ検出用のサンプルコード作成（PaymentService、UserAuth等）
- TODO、FIXME、HACK、BUG、XXX、DEPRECATED などのバグインジケーターを含むコード例
- `breakdown find bugs` コマンドの実行と結果表示
- 本番環境設定の詳細表示（検出パターン、対象ファイル拡張子、除外ディレクトリ等）

### 12. 本番環境カスタム設定とFind Bugs
```bash
./examples/11_config_production_custom.sh
```
このスクリプトは以下を実行します：
- production-user.ymlを使用したCustomConfig機能のデモンストレーション
- 大規模なテストプロジェクト作成（API Service、React Component、Auth Utils、Test Files）
- セキュリティ問題、パフォーマンス問題、アーキテクチャ問題を含む包括的なバグ例
- CustomConfigとBreakdownParamsの設定構造の確認
- `find bugs` 二パラメータコマンドのサポート確認
- 設定ファイルの検証とロードテスト

### 13. Summary Issueの例
```bash
./examples/12_summary_issue.sh
```
このスクリプトは以下を実行します：
- 散らかったタスクリストからイシューサマリーを生成
- summary issueコマンドの実用例

### 14. Defectパターンの例
```bash
./examples/13_defect_patterns.sh
```
このスクリプトは以下を実行します：
- defect issue: バグレポートからの欠陥分析
- defect task: 改善要求からのタスク分析

### 15. カスタム変数の例
```bash
./examples/14_custom_variables.sh
```
このスクリプトは以下を実行します：
- --uv-*カスタム変数の使用方法
- --adaptationオプションの活用
- 複数の変数を組み合わせたカスタマイズ

### 16. パイプライン処理の例
```bash
./examples/15_pipeline_processing.sh
```
このスクリプトは以下を実行します：
- 複数のbreakdownコマンドの連携
- UNIXツールとの統合
- プロセス置換の活用

### 17. バッチ処理の例
```bash
./examples/16_batch_processing.sh
```
このスクリプトは以下を実行します：
- 複数ファイルの一括処理
- 処理結果のレポート生成
- 定期実行用スクリプトの作成

### 18. エラーハンドリングの例
```bash
./examples/17_error_handling.sh
```
このスクリプトは以下を実行します：
- エラーの捕捉と記録
- リトライ機能の実装
- フォールバック処理

### 19. CI/CD統合の例
```bash
./examples/18_cicd_integration.sh
```
このスクリプトは以下を実行します：
- GitHub Actions、GitLab CI、Jenkins、CircleCIの設定例
- PR分析と自動ドキュメント生成
- 品質メトリクスの追跡

### 20. クリーンアップ
```bash
./examples/19_clean.sh
```
このスクリプトは以下を実行します：
- 生成された全ての出力ファイルの削除
- 例題用の設定ファイルの削除
- コンパイル済みバイナリの削除（オプション）
- 注意：プロジェクト直下の.agent/breakdown構造は保持されます


### 削除するもの
`examples/`配下の、`examples/`実行で作成されたファイルやディレクトリの全て。

- 残すもの:
  - `examples/*.sh`
  - `examples/CLAUDE.md`
  - `examples/README.md`
- 残さないもの:
  - 上記以外の `examples/*`
- 消さないもの:
  - `examples/`配下以外のファイル

## コマンドパターン

### 基本コマンド

| Command \ Layer | Project | Issue | Task |
| --------------- | ------- | ----- | ---- |
| to | breakdown to project <written_project_summary.md> -o <project_dir> | breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir> | breakdown to task <issue.md\|written_task.md> -o <tasks_dir> |
| summary | echo "<messy_something>" \| breakdown summary project -o=<project_summary.md> | breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir> | breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir> |
| defect | tail -100 "<error_log_file>" \| breakdown defect project -o=<project_defect.md> | breakdown defect issue --from=<bug_report.md> -o=<issue_defect_dir> | breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir> |

### 3語コマンド（カスタムコマンド）

| Command | Description | Example |
| ------- | ----------- | ------- |
| find bugs | コード内のバグ検出と分析 | breakdown find bugs --from=<code_file.md> -o=<bugs_report.md> |

### コマンドオプション

主なオプション：
- `--from` または `-f`: 入力ファイルを指定
- `--destination` または `-o`: 出力ファイルまたはディレクトリを指定
- `--input` または `-i`: 入力レイヤータイプを指定
- `--adaptation` または `-a`: プロンプトの適応タイプを指定
- `--uv-*`: カスタム変数を指定（例：`--uv-userName=太郎` `--uv-project=example`）

### 自動ファイル名生成

出力時にファイル名を指定しない場合：
- `<yyyymmdd>_<random_hash>.md` 形式でファイル名が生成されます
- 例：`20250211_e81d0bd.md` 