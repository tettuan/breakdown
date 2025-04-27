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
1. `01_install.sh` - Breakdownのインストール
2. `02_init.sh` - プロジェクトの初期化
3. `03_create_user_config.sh` - ユーザー設定の作成

### 使用例
4. `04_project_to_implementation.sh` - プロジェクト実装への変換
5. `05_detailed_issue_creation.sh` - 詳細な課題の作成
6. `06_test_result_tasks.sh` - テスト結果からのタスク生成
7. `07_adaptation_option.sh` - プロンプト適応オプションの使用
8. `08_prompt_debug.sh` - プロンプトのデバッグ
9. `09_clean.sh` - 生成されたファイルのクリーンアップ

## 前準備の詳細

### 1. インストール
```bash
./examples/01_install.sh
```
このスクリプトは以下を実行します：
- Denoのインストール確認
- Breakdownのインストール
- インストールの検証

### 2. 初期化
```bash
./examples/02_init.sh
```
このスクリプトは以下を実行します：
- プロジェクト構造の初期化
- 必要なディレクトリの作成
- 基本設定の配置

### 3. ユーザー設定
```bash
./examples/03_create_user_config.sh
```
このスクリプトは以下を実行します：
- `./.agent/breakdown/config/user.yml` の作成
- working_dirの設定（`./.agent/breakdown/examples`）
- 基本設定の構成

## 使用例の詳細

### 4. プロジェクト実装への変換
```bash
./examples/04_project_to_implementation.sh
```
このスクリプトは以下を実行します：
- 未整理の情報からプロジェクトサマリーを生成
- プロジェクトへの分解
- 課題への分解
- タスクへの分解

### 5. 詳細な課題の作成
```bash
./examples/05_detailed_issue_creation.sh
```
このスクリプトは以下を実行します：
- タスク群から課題を生成
- 生成された課題の確認と編集（手動）
- 課題からタスクを生成

### 6. テスト結果からのタスク生成
```bash
./examples/06_test_result_tasks.sh
```
このスクリプトは以下を実行します：
- テスト結果からタスクを生成
- タスクの優先順位付け
- タスクの整理と出力

### 7. プロンプト適応オプション
```bash
./examples/07_adaptation_option.sh
```
このスクリプトは以下を実行します：
- `--adaptation` または `-a` オプションを使ってプロンプトの種類パターンを切り替え
- 長い形式（--adaptation strict）と短い形式（-a a）の両方の例を含みます

### 8. プロンプトデバッグ
```bash
./examples/08_prompt_debug.sh
```
このスクリプトは以下を実行します：
- プロンプトの動作確認
- デバッグ情報の出力
- プロンプトの調整例

### 9. クリーンアップ
```bash
./examples/09_clean.sh
```
このスクリプトは以下を実行します：
- 生成された全ての出力ファイルの削除
- 初期化ディレクトリの削除
- テスト出力の削除

## コマンドパターン

### 基本コマンド

| Command \ Layer | Project | Issue | Task |
| --------------- | ------- | ----- | ---- |
| to | breakdown to project <written_project_summary.md> -o <project_dir> | breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir> | breakdown to task <issue.md\|written_task.md> -o <tasks_dir> |
| summary | echo "<messy_something>" \| breakdown summary project -o <project_summary.md> | breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir> | breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir> |
| defect | tail -100 "<error_log_file>" \| breakdown defect project -o <project_defect.md> | breakdown defect issue --from <bug_report.md> -o <issue_defect_dir> | breakdown defect task --from <improvement_request.md> -o <task_defect_dir> |

### コマンドオプション

主なオプション：
- `--from` または `-f`: 入力ファイルを指定
- `--destination` または `-o`: 出力ファイルまたはディレクトリを指定
- `--input` または `-i`: 入力レイヤータイプを指定
- `--adaptation` または `-a`: プロンプトの適応タイプを指定

### 自動ファイル名生成

出力時にファイル名を指定しない場合：
- `<yyyymmdd>_<random_hash>.md` 形式でファイル名が生成されます
- 例：`20250211_e81d0bd.md` 