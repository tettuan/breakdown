# Breakdown 使用ガイド

このドキュメントでは、Breakdownツールの様々なユースケースとコマンドパターンについて説明します。

## インストール

### システムにインストール

```
deno add @tettuan/breakdown
```

### AI開発リポジトリにのみインストール

```
deno add --root ./tools @tettuan/breakdown
```

インストールせずに使用する場合：

```
deno run --allow-read --allow-net jsr:@tettuan/breakdown
```

## 基本コマンド

### 作業ディレクトリの初期化

```bash
breakdown init
```

このコマンドは、設定で指定された必要な作業ディレクトリ構造を作成します。

### Markdownの加工コマンド

以下の組み合わせになります。

| Command \ Layer | コマンドの説明                                                       | Project                                                                                                                 | Issue                                                                                                                         | Task                                                                                                          |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| to              | 入力されたMarkdownを次のレイヤー形式に変換するコマンド               | プロジェクトへ分解<br>breakdown to project <written_project_summary.md> -o <project_dir>                                | プロジェクトから課題へ分解<br>breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir>                        | 課題からタスクへ分解<br>breakdown to task <issue.md\|written_task.md> -o <tasks_dir>                          |
| summary         | 新規のMarkdownを生成、または指定レイヤーのMarkdownを生成するコマンド | プロジェクト概要をMarkdown形式で生成<br>echo "<messy_something>" \| breakdown summary project -o <project_summary.md>   | イシュー概要をMarkdown形式で生成<br>breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir> | タスク概要をMarkdown形式で生成<br>breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir> |
| defect          | エラーログや不具合情報から修正を生成するコマンド                     | 不具合情報からプロジェクト情報を生成<br>tail -100 "<error_log_file>" \| breakdown defect project -o <project_defect.md> | 不具合情報から課題を生成<br>breakdown defect issue --from <bug_report.md> -o <issue_defect_dir>                               | 不具合情報からタスクを生成<br>breakdown defect task --from <improvement_request.md> -o <task_defect_dir>      |

### プロジェクトへの分解

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

### 課題への分解

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

### タスクへの分解

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

### Markdownサマリーの生成

**プロジェクトサマリー** 未整理の情報からプロジェクト概要を生成：

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
```

**イシューサマリー** タスク群から課題を生成：

```bash
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>
```

**タスクサマリー** 未整理のタスク情報から整理されたタスクを生成：

```bash
breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir>
```

### 不具合情報からの修正生成

**プロジェクトレベルの不具合分析**

```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
```

**課題レベルの不具合分析**

```bash
breakdown defect issue --from <bug_report.md> -o <issue_defect_dir>
```

**タスクレベルの不具合分析**

```bash
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

## 一般的なユースケースパターン

### 1. 未整理の情報からプロジェクト実装までの流れ

未整理の情報からプロジェクトを構築し、課題とタスクに分解：

```bash
# 未整理の情報からプロジェクトサマリーを生成
echo "<messy_something>" | breakdown summary project -o <project_summary.md>

# プロジェクトへ分解
breakdown to project <project_summary.md> -o <project_dir>

# 課題へ分解
breakdown to issue <project_summary.md> -o <issue_dir>

# タスクへ分解
breakdown to task <issue.md> -o <tasks_dir>
```

### 2. タスク群から課題の作成

複数の未整理タスクから課題を生成し、再度タスクに分解：

```bash
# タスク群から課題を生成
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>

# 生成された課題を編集（必要に応じて）

# 課題からタスクを生成
breakdown to task <issue.md> -o <tasks_dir>
```

### 3. 不具合情報からの修正タスク生成

エラーログや不具合レポートから修正タスクを生成：

```bash
# エラーログから不具合情報を生成
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>

# 不具合情報から課題を生成
breakdown defect issue --from <project_defect.md> -o <issue_defect_dir>

# 課題から修正タスクを生成
breakdown defect task --from <issue_defect.md> -o <task_defect_dir>
```

### 4. 改善要望からの修正提案作成

改善要望から直接タスクレベルの修正を生成：

```bash
# 改善要望から修正タスクを生成
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

## コマンドオプションリファレンス

### グローバルオプション

- `--from` または `-f`: 入力ファイルを指定
- `--destination` または `-o`: 出力ファイルまたはディレクトリを指定
- `--input` または `-i`: 入力レイヤータイプを指定
- `--adaptation` または `-a`: プロンプトの種類を指定（例: strict, a）

### プロンプトの種類

プロンプトの種類は `--adaptation` オプションで指定できます：

```bash
# 例: strictモードでのタスク生成
breakdown to task issue.md -o tasks_dir -a strict

# 例: aモードでのタスクサマリー生成
breakdown summary task --from unorganized_tasks.md -o task_markdown_dir -a a
```

### パスの自動補完

ツールは設定に基づいてパスを自動的に補完します：

- パスが提供されている場合、そのまま使用
- ファイル名のみが提供されている場合、以下を使用して補完：
  - 設定からの作業ディレクトリ
  - コマンドタイプ（to/summary/defect）
  - レイヤータイプ（project/issue/task）

### 自動ファイル名生成

ファイル名なしで出力が指定された場合：

- `<yyyymmdd>_<ランダムハッシュ>.md` 形式でファイル名が生成
- 例：`20250211_e81d0bd.md`

## 設定

`./agent/breakdown/config/app.yml` から設定を読み込みます。これには以下が含まれます：

- 作業ディレクトリ設定
- プロンプトファイルの場所
- スキーマファイルの場所

作業ディレクトリを初期化するには：

```bash
breakdown init
```

これにより、設定に基づいて必要なディレクトリ構造が作成されます。
