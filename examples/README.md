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

## 基本的な使用例

以下のサンプルは、Breakdownライブラリの主な機能を示すものです。
各スクリプトは独立して実行可能で、実際の使用シナリオを模擬しています。

### 1. 未整理の情報からプロジェクト実装までの流れ

```bash
./examples/01_project_to_implementation.sh
```

このスクリプトは以下を実行します：
- 未整理の情報からプロジェクトサマリーを生成
- プロジェクトへの分解
- 課題への分解
- タスクへの分解

### 2. タスク群から課題の作成

```bash
./examples/02_detailed_issue_creation.sh
```

このスクリプトは以下を実行します：
- タスク群から課題を生成
- 生成された課題の確認と編集（手動）
- 課題からタスクを生成

### 3. エラーログからの修正タスク生成

```bash
./examples/03_test_result_tasks.sh
```

このスクリプトは以下を実行します：
- エラーログから不具合情報を生成
- 不具合情報から課題を生成
- 課題から修正タスクを生成

### 4. 改善要望からの修正タスク生成

```bash
./examples/04_error_fix_proposal.sh
```

このスクリプトは以下を実行します：
- 改善要望から直接修正タスクを生成

### 5. プロンプト適応オプションの利用例

```bash
./examples/05_adaptation_option.sh
```

このスクリプトは以下を実行します：
- `--adaptation` または `-a` オプションを使ってプロンプトの種類パターンを切り替え
- 長い形式（--adaptation strict）と短い形式（-a a）の両方の例を含みます

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

### 自動ファイル名生成

出力時にファイル名を指定しない場合：
- `<yyyymmdd>_<random_hash>.md` 形式でファイル名が生成されます
- 例：`20250211_e81d0bd.md` 