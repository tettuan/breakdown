# Breakdown 使用ガイド

このドキュメントでは、Breakdownツールの様々なユースケースとコマンドパターンについて説明します。

## インストール

### 推奨: CLIとしてインストール

BreakdownはCLIツールとしての利用が主目的です。  
**Deno公式/JSR標準の方法**で、以下のコマンドでインストールできます。

```bash
deno install --allow-read --allow-write --allow-net --allow-env --allow-run -f --global breakdown jsr:@tettuan/breakdown
```
- `--allow-read` : ファイル読み取り権限
- `--allow-write` : ファイル書き込み権限  
- `--allow-net` : ネットワーク接続権限
- `--allow-env` : 環境変数アクセス権限
- `--allow-run` : サブプロセス実行権限
- `-f` : 既存のコマンドを上書き
- `--global` : グローバルインストール
- `breakdown` : コマンド名

> **Note:**  
> CLIモジュールは`jsr:@tettuan/breakdown`で指定する必要があります。  
> これは`deno.json`の`exports`設定に基づいています。

---

### アップデート

新しいバージョンが公開された場合も、同じコマンドで上書きインストールできます。

```bash
deno install --allow-read --allow-write --allow-net --allow-env --allow-run -f --global breakdown jsr:@tettuan/breakdown
```

---

### ライブラリとして使う場合

TypeScript/JavaScriptから直接importして使う場合は、  
`deno add` で依存に追加できます。

```bash
deno add @tettuan/breakdown
```

---

### 注意事項

- breakdownコマンドは、`deno.json`の`bin`設定により自動的に`cli/breakdown.ts`をエントリーポイントとして動作します。
- Deno 1.40以降を推奨します。
- 詳細な使い方は下記「Usage」セクションを参照してください。

### プロジェクトディレクトリへのローカルインストール

特定のプロジェクト内でのみbreakdownコマンドを使用したい場合は、`--root`オプションを使用して`.deno/bin`にインストールできます：

```bash
deno install --allow-read --allow-write --allow-net --allow-env --allow-run -f --global --root .deno -n breakdown jsr:@tettuan/breakdown
```

インストール後、binディレクトリをPATHに追加します：

```bash
export PATH="$(pwd)/.deno/bin:$PATH"
```

この設定を永続化するには、シェルの設定ファイル（例：`~/.zshrc`や`~/.bashrc`）に追加してください。

### トラブルシューティング

コマンドが応答しない場合は、以下の手順を試してください：

1. インストールの確認:
```bash
which breakdown
```

2. 直接実行でテスト:
```bash
deno run --allow-read --allow-write --allow-net --allow-env --allow-run jsr:@tettuan/breakdown
```

3. パスの確認:
```bash
echo $PATH
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
| to              | 入力されたMarkdownを次のレイヤー形式に変換するコマンド               | プロジェクトへ分解<br>breakdown to project <written_project_summary.md> -o=<project_dir>                                | プロジェクトから課題へ分解<br>breakdown to issue <project_summary.md\|written_issue.md> -o=<issue_dir>                        | 課題からタスクへ分解<br>breakdown to task <issue.md\|written_task.md> -o=<tasks_dir>                          |
| summary         | 新規のMarkdownを生成、または指定レイヤーのMarkdownを生成するコマンド | プロジェクト概要をMarkdown形式で生成<br>echo "<messy_something>" \| breakdown summary project -o=<project_summary.md>   | イシュー概要をMarkdown形式で生成<br>breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir> | タスク概要をMarkdown形式で生成<br>breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir> |
| defect          | エラーログや不具合情報から修正を生成するコマンド                     | 不具合情報からプロジェクト情報を生成<br>tail -100 "<error_log_file>" \| breakdown defect project -o=<project_defect.md> | 不具合情報から課題を生成<br>breakdown defect issue --from=<bug_report.md> -o=<issue_defect_dir>                               | 不具合情報からタスクを生成<br>breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir>      |

### プロジェクトへの分解

```bash
breakdown to project <written_project_summary.md> -o=<project_dir>
```

### 課題への分解

```bash
breakdown to issue <project_summary.md|written_issue.md> -o=<issue_dir>
```

### タスクへの分解

```bash
breakdown to task <issue.md|written_task.md> -o=<tasks_dir>
```

### Markdownサマリーの生成

**プロジェクトサマリー** 未整理の情報からプロジェクト概要を生成：

```bash
echo "<messy_something>" | breakdown summary project -o=<project_summary.md>
```

**イシューサマリー** タスク群から課題を生成：

```bash
breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir>
```

**タスクサマリー** 未整理のタスク情報から整理されたタスクを生成：

```bash
breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir>
```

## テンプレート変数の記述方法

Breakdownでは、プロンプトテンプレート内で `{variable_name}` 形式の変数を使用できます。これらの変数はCLIオプションや入力内容から自動的に値が設定されます。
出力時にはYAMLフロントマターが自動的に除去されます。

### 利用可能なテンプレート変数一覧

| 変数名 | 対応するCLIオプション | 説明 | 使用例 |
|--------|---------------------|------|--------|
| `{input_text}` | 標準入力（パイプ） | パイプで渡された内容 | `echo "内容" \| breakdown ...` |
| `{input_text_file}` | `--from`, `-f` | 入力ファイルの絶対パス | `breakdown to task -f input.md` |
| `{destination_path}` | `--output`, `-o` | 出力ファイルの絶対パス | `breakdown to task -o output.md` |
| `{schema_file}` | `--use-schema` | JSONスキーマファイルのパス | `breakdown to task --use-schema` |
| `{directive}` | 第1引数 | 処理方向（to, summary, defect等） | `breakdown to task` |
| `{layer}` | 第2引数 | 処理階層（project, issue, task等） | `breakdown to task` |

### カスタム変数（ユーザー定義変数）

`--uv-` プレフィックスを使用して、独自の変数を定義できます：

| CLIオプション形式 | テンプレート内での使用 | ユーザー定義の意味（例） |
|------------------|---------------------|----------------------|
| `--uv-priority=高` | `{uv-priority}` | タスクの優先度 |
| `--uv-assignee=田中` | `{uv-assignee}` | 作業担当者名 |
| `--uv-deadline=2024-12-31` | `{uv-deadline}` | 完了予定日 |
| `--uv-version=2.0` | `{uv-version}` | 対象バージョン |

**注意**: 
- テンプレート内でも `uv-` プレフィックスを含めて記述します
- 変数名と値は自由に定義できます（例：`--uv-team=backend`、`--uv-env=production` など）

### 使用例

#### 基本的な変数の使用
```bash
# ファイルからタスクへ変換（input_text_file, destination_pathが設定される）
breakdown to task -f requirements.md -o tasks.md

# カスタム変数を含む変換
breakdown to task -f requirements.md --uv-priority=緊急 --uv-assignee=山田
```

#### テンプレート内での記述例
```markdown
# タスク: {directive}処理

入力ファイル: {input_text_file}
出力先: {destination_path}

## 内容
{input_text}

## メタ情報
- 優先度: {uv-priority}
- 担当者: {uv-assignee}
- 期限: {uv-deadline}
```

### 内部変数（参考）

以下の変数は自動的に設定される内部変数です：

| 変数名 | 説明 |
|--------|------|
| `{prompt_path}` | 使用されるプロンプトテンプレートのパス |
| `{schema_path}` | 解決されたスキーマファイルのパス |
| `{input_source}` | 入力元の種別（'file', 'stdin', 'both'） |