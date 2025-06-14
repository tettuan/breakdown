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

## 構成

### 前準備
1. `01_install.sh` - Breakdownのインストール案内
2. `02_compile.sh` - バイナリ生成
3. `03_check_version.sh` - バージョン確認のテスト (インストール/コンパイル済みバイナリ)
4. `04_init.sh` - プロジェクトの初期化 (バイナリ実行)
5. `04a_init_deno_run.sh` - プロジェクトの初期化 (deno run で直接実行)
6. `05_create_user_config.sh` - ユーザー設定の作成 (バイナリ実行)
7. `05a_create_user_config_deno_run.sh` - ユーザー設定の作成 (deno run で直接実行)

### 使用例
9. `06_project_to_implementation.sh` - プロジェクト実装への変換 (バイナリ実行)
10. `06a_project_to_implementation_deno_task.sh` - プロジェクト実装への変換 (Denoタスク実行)
11. `07_detailed_issue_creation.sh` - 詳細な課題の作成
12. `08_test_result_tasks.sh` - テスト結果からのタスク生成
13. `09_adaptation_option.sh` - プロンプト適応オプションの使用
14. `10_stdin_example.sh` - STDIN入力の利用例
15. `11_prompt_debug.sh` - プロンプトのデバッグ
16. `12_clean.sh` - 生成されたファイルのクリーンアップ
17. `13_custom_variables_example.sh` - カスタム変数機能のデモンストレーション
18. `13_custom_variables_team_workflow.sh` - カスタム変数を活用したチーム開発ワークフロー
19. `14_find_bugs_example.sh` - バグ検出機能 'breakdown find bugs' の基本使用例
20. `15_find_bugs_team_workflow.sh` - チームでのバグ検出ワークフロー実例

## 前準備の詳細

### 1. インストール案内
```bash
./examples/01_install.sh
```
このスクリプトは以下を案内します：
- Breakdown CLIの推奨利用方法（deno task, バイナリ, グローバルインストール）

### 2. バイナリ生成
```bash
./examples/02_compile.sh
```
このスクリプトは以下を実行します：
- breakdown CLIのバイナリを ./.deno/bin/breakdown に生成

### 3. バージョン確認のテスト (インストール/コンパイル済みバイナリ)
```bash
./examples/03_check_version.sh
```
このスクリプトは以下を実行します：
- インストール済みまたはコンパイル済みの `breakdown` CLI の `--version` オプションの動作を確認

### 4. 初期化 (バイナリ実行)
```bash
./examples/04_init.sh
```
このスクリプトは以下を実行します（コンパイル済みのバイナリを使用）：
- プロジェクト構造の初期化
- 必要なディレクトリの作成
- 基本設定の配置

### 5. 初期化 (deno run で直接実行)
```bash
./examples/04a_init_deno_run.sh
```
このスクリプトは以下を実行します（`deno run` で `cli/breakdown.ts` を直接使用）：
- プロジェクト構造の初期化
- 必要なディレクトリの作成
- 基本設定の配置

### 6. ユーザー設定 (バイナリ実行)
```bash
./examples/05_create_user_config.sh
```
このスクリプトは以下を実行します（コンパイル済みのバイナリを使用）：
- `./.agent/breakdown/config/user.yml` の作成
- working_dirの設定（`./.agent/breakdown/examples`）
- 基本設定の構成

### 7. ユーザー設定 (deno run で直接実行)
```bash
./examples/05a_create_user_config_deno_run.sh
```
このスクリプトは以下を実行します（`deno run` で `cli/breakdown.ts` を直接使用）：
- `./.agent/breakdown/config/user.yml` の作成
- working_dirの設定（`./.agent/breakdown/examples`）
- 基本設定の構成

## 使用例の詳細

### 9. プロジェクト実装への変換 (バイナリ実行)
```bash
./examples/06_project_to_implementation.sh
```
このスクリプトは以下を実行します（コンパイル済みのバイナリを使用）：
- 未整理の情報からプロジェクトサマリーを生成
- プロジェクトへの分解
- 課題への分解
- タスクへの分解

### 10. プロジェクト実装への変換 (Denoタスク実行)
```bash
./examples/06a_project_to_implementation_deno_task.sh
```
このスクリプトは以下を実行します（`deno task breakdown` を使用）：
- 未整理の情報からプロジェクトサマリーを生成
- プロジェクトへの分解
- 課題への分解
- タスクへの分解

### 11. 詳細な課題の作成
```bash
./examples/07_detailed_issue_creation.sh
```
このスクリプトは以下を実行します：
- タスク群から課題を生成
- 生成された課題の確認と編集（手動）
- 課題からタスクを生成

### 12. テスト結果からのタスク生成
```bash
./examples/08_test_result_tasks.sh
```
このスクリプトは以下を実行します：
- テスト結果からタスクを生成
- タスクの優先順位付け
- タスクの整理と出力

### 13. プロンプト適応オプション
```bash
./examples/09_adaptation_option.sh
```
このスクリプトは以下を実行します：
- `--adaptation` または `-a` オプションを使ってプロンプトの種類パターンを切り替え
- 長い形式（--adaptation strict）と短い形式（-a a）の両方の例を含みます

### 14. STDIN入力の利用例
```bash
./examples/10_stdin_example.sh
```
このスクリプトは以下を実行します：
- echoやcatでパイプしてBreakdown CLIにSTDIN入力を渡す
- summaryコマンドでプロジェクトサマリーを生成
- 生成ファイルの確認

### 15. プロンプトデバッグ
```bash
./examples/11_prompt_debug.sh
```
このスクリプトは以下を実行します：
- プロンプトの動作確認
- デバッグ情報の出力
- プロンプトの調整例

### 16. クリーンアップ
```bash
./examples/12_clean.sh
```
このスクリプトは以下を実行します：
- 生成された全ての出力ファイルの削除
- 初期化ディレクトリの削除
- テスト出力の削除

### 17. カスタム変数機能のデモンストレーション
```bash
./examples/13_custom_variables_example.sh
```
このスクリプトは以下を実行します：
- `--uv-*` オプションを使用したカスタム変数の基本例
- 複数のカスタム変数を同時に使用する方法
- 既存オプション（--extended, --error-format）との組み合わせ
- カスタム変数の動作確認と検証

### 18. カスタム変数を活用したチーム開発ワークフロー
```bash
./examples/13_custom_variables_team_workflow.sh
```
このスクリプトは以下を実行します：
- `--uv-*` オプションを使用したカスタム変数の実用例
- チーム開発での標準化されたドキュメント生成
- 複数のシナリオでの変数活用（課題分析、タスク生成、デプロイメント文書化）
- STDIN ワークフローとカスタム変数の組み合わせ

### 19. バグ検出機能の基本使用例
```bash
./examples/14_find_bugs_example.sh
```
このスクリプトは以下を実行します：
- 新機能 `breakdown find bugs` コマンドの基本的な使用方法
- サンプルコードからのセキュリティ脆弱性の検出
- ロジックエラーの自動分析
- 拡張オプションとSTDIN入力の活用例

### 20. チームでのバグ検出ワークフロー実例
```bash
./examples/15_find_bugs_team_workflow.sh
```
このスクリプトは以下を実行します：
- チーム開発におけるバグ検出の自動化ワークフロー
- Pre-commitフック、コードレビュー、セキュリティ監査での活用
- 複数ファイルの一括バグ分析
- CI/CD パイプライン統合のためのパターン例

### 22. 本番環境カスタム設定とFind Bugs準備
```bash
./examples/22_config_production_custom.sh
```
このスクリプトは以下を実行します：
- production-user.ymlを使用したCustomConfig設定のデモンストレーション
- `breakdown find bugs` コマンド準備（現在開発中）
- BreakdownParamsのCustomConfig機能の活用
- バグ検出パターンと除外ディレクトリの設定
- 本番環境に最適化された設定例
- 将来の `find bugs` コマンド実装に向けた設定構造の確認

## コマンドパターン

### 基本コマンド

| Command \ Layer | Project | Issue | Task |
| --------------- | ------- | ----- | ---- |
| to | breakdown to project <written_project_summary.md> -o <project_dir> | breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir> | breakdown to task <issue.md\|written_task.md> -o <tasks_dir> |
| summary | echo "<messy_something>" \| breakdown summary project -o <project_summary.md> | breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir> | breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir> |
| defect | tail -100 "<error_log_file>" \| breakdown defect project -o <project_defect.md> | breakdown defect issue --from <bug_report.md> -o <issue_defect_dir> | breakdown defect task --from <improvement_request.md> -o <task_defect_dir> |

### 3語コマンド（カスタムコマンド）

| Command | Description | Example |
| ------- | ----------- | ------- |
| find bugs | コード内のバグ検出と分析 | breakdown find bugs --from <code_file.md> -o <bugs_report.md> |

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