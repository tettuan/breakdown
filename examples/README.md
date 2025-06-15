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
8. `08_stdin_example.sh` - STDIN入力の利用例
9. `09_clean.sh` - 生成されたファイルのクリーンアップ

### 設定例
10. `17_config_basic.sh` - 基本的な設定例
11. `18_config_production.sh` - 本番環境用設定例
12. `19_config_team.sh` - チーム開発用設定例
13. `20_config_environments.sh` - 環境別設定例
14. `21_config_production_example.sh` - 本番環境設定の実例
15. `22_config_production_custom.sh` - 本番環境カスタム設定とFind Bugs準備

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

### 8. STDIN入力の利用例
```bash
./examples/08_stdin_example.sh
```
このスクリプトは以下を実行します：
- echoやcatでパイプしてBreakdown CLIにSTDIN入力を渡す
- summaryコマンドでプロジェクトサマリーを生成
- 生成ファイルの確認

### 9. クリーンアップ
```bash
./examples/09_clean.sh
```
このスクリプトは以下を実行します：
- 生成された全ての出力ファイルの削除
- 初期化ディレクトリの削除
- テスト出力の削除

## 設定例の詳細

### 10. 基本的な設定例
```bash
./examples/17_config_basic.sh
```
このスクリプトは以下を実行します：
- 基本的な設定ファイルの作成
- デフォルト設定の確認
- 簡単な設定のカスタマイズ

### 11. 本番環境用設定例
```bash
./examples/18_config_production.sh
```
このスクリプトは以下を実行します：
- 本番環境向けの設定ファイル作成
- セキュリティ設定の強化
- パフォーマンス最適化設定

### 12. チーム開発用設定例
```bash
./examples/19_config_team.sh
```
このスクリプトは以下を実行します：
- チーム開発向けの共有設定
- コラボレーション設定
- 権限管理の設定

### 13. 環境別設定例
```bash
./examples/20_config_environments.sh
```
このスクリプトは以下を実行します：
- 開発、ステージング、本番環境の設定切り替え
- 環境変数による設定管理
- 環境別のプロンプト設定

### 14. 本番環境設定の実例
```bash
./examples/21_config_production_example.sh
```
このスクリプトは以下を実行します：
- 実際の本番環境での設定例
- ベストプラクティスの実装
- トラブルシューティング設定

### 15. 本番環境カスタム設定とFind Bugs準備
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