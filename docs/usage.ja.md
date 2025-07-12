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