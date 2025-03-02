# Breakdown 使用ガイド

このドキュメントでは、Breakdownツールの様々なユースケースとコマンドパターンについて説明します。

## インストール

### システム全体へのインストール

```bash
deno install --name=breakdown https://deno.land/x/breakdown.ts
```

### プロジェクト固有のインストール

```bash
deno install --root ./tools --name=breakdown https://deno.land/x/breakdown.ts
```

### 手動実行（インストールなし）

```bash
deno run --allow-read --allow-net https://deno.land/x/breakdown.ts
```

## 基本コマンド

### 作業ディレクトリの初期化

```bash
breakdown init
```
このコマンドは、設定で指定された必要な作業ディレクトリ構造を作成します。

### MarkdownからJSONへの変換

**プロジェクト概要の作成**
```bash
breakdown to project <written_project_summary.md> -o <project-dir>
```

**イシューの作成**
```bash
breakdown to issue <project_summary.json|written_issue.md> -o <issue-dir>
```

**タスクの作成**
```bash
breakdown to task <issue.json|written_task.md> -o <tasks-dir>
```

### Markdownサマリーの生成

**プロジェクトサマリー**
```bash
echo "<summary>" | breakdown summary project -o <project_summary.md>
```

**イシューサマリー**
```bash
echo "<issue summary>" | breakdown summary issue -o <issue_summary.md>
```

**タスクサマリー**
```bash
echo "<task summary>" | breakdown summary task -o <task_summary.md>
```

### 既存ドキュメントからのMarkdown生成

**プロジェクトからイシューを生成**
```bash
breakdown summary issue --from-project <project_summary.md> -o <issue_markdown_dir>
```

**イシューからタスクを生成**
```bash
breakdown summary task --from-issue <issue_summary.md> -o <task_markdown_dir>
```

### 不具合とエラーの処理

**プロジェクト不具合分析**
```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
```

**イシュー不具合分析**
```bash
tail -100 "<error_log_file>" | breakdown defect issue -o <issue_defect.md>
```

**タスク不具合分析**
```bash
tail -100 "<error_log_file>" | breakdown defect task -o <task_defect.md>
```

**プロジェクト不具合からイシュー修正を生成**
```bash
breakdown defect issue --from-project <project_defect.md> -o <issue_defect_dir>
```

**イシュー不具合からタスク修正を生成**
```bash
breakdown defect task --from-issue <issue_defect.md> -o <task_defect_dir>
```

## 一般的なユースケースパターン

### 1. プロジェクト概要から完全実装まで

プロジェクト概要を書き、残りをAIに任せる：

```bash
# プロジェクトサマリーの作成
echo "<summary>" | breakdown summary project -o <project_summary.md>

# JSON形式に変換
breakdown to project <project_summary.md> -o <project-dir>

# プロジェクトからイシューを生成
breakdown to issue <project_summary.json> -o <issue-dir>

# イシューからタスクを生成
breakdown to task <issue.json> -o <tasks-dir>
```

### 2. プロジェクトから詳細イシューの作成

プロジェクト概要から詳細イシューを作成し、タスクを生成：

```bash
# プロジェクトサマリーの作成
echo "<summary>" | breakdown summary project -o <project_summary.md>

# プロジェクトからイシューMarkdownを生成
breakdown summary issue <project_summary.md> -o <issue_markdown_dir>

# 複数のイシューMarkdownを手動で編集

# 各イシューをJSONに変換
breakdown to issue <written_issue_1.md> -o <issue-dir>
breakdown to issue <written_issue_2.md> -o <issue-dir>

# 各イシューからタスクを生成
breakdown to task <issue_1.json> -o <tasks-dir>
breakdown to task <issue_2.json> -o <tasks-dir>
```

### 3. テスト結果から詳細タスクを処理

テスト結果に基づいてイシューからタスクを生成：

```bash
# テスト出力をキャプチャしてイシュー不具合を作成
deno test --allow-read --allow-write --allow-run | breakdown defect issue -o <issue_defect.md>

# 不具合をJSONイシューに変換
breakdown to issue <issue_defect.md> -o <issue-dir>

# イシューからタスクを生成
breakdown to task <issue.json> -o <tasks-dir>
```

### 4. 実行エラーの修正案を作成

ターミナルのエラー情報に基づいて修正すべきイシューを設定：

```bash
# エラーログをキャプチャしてプロジェクト不具合を作成
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>

# プロジェクト不具合からイシュー不具合を生成
breakdown defect issue --from-project <project_defect.md> -o <issue_defect_dir>

# イシュー不具合をJSONに変換
breakdown to issue <issue_defect.md> -o <issue-dir>

# イシューからタスクを生成
breakdown to task <issue.json> -o <tasks-dir>
```

## コマンドオプションリファレンス

### グローバルオプション

- `--from` または `-f`: 入力ファイルを指定
- `--destination` または `-o`: 出力ファイルまたはディレクトリを指定
- `--input` または `-i`: 入力レイヤータイプを指定

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

ツールは `/breakdown/config/config.ts` から設定を読み込みます。これには以下が含まれます：
- 作業ディレクトリ設定
- プロンプトファイルの場所
- スキーマファイルの場所

作業ディレクトリを初期化するには：

```bash
breakdown init
```

これにより、設定に基づいて必要なディレクトリ構造が作成されます。 