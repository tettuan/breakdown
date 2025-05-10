# Breakdown

TypeScriptとJSON Schemaを使用したAI支援開発のための開発指示書作成ツール。

## 概要

BreakDownは、TypeScriptとDenoを使用し、AI composerと連携してMarkdownドキュメントを変換し、AIシステムが解釈しやすくするためのツールとスキーマセットです。

実行すると、Markdownで書かれた開発要件が変換用のプロンプトとして提示されます。これらのプロンプトには、変換のための構造化された定義として機能する事前定義されたJSONスキーマが含まれています。その結果、プロンプトは要件を構造化された情報に変換します。出力形式はプロンプトで指定でき、Markdown/JSON/YAMLなど様々な形式に対応しています。

BreakdownSchemaの構文をドキュメントとして読み取ることで、AIシステムはこれらのJSON構造を解釈し、開発要件と仕様を適切に理解することが期待されます。その結果、指示内容を簡素化し、簡潔な方向性を示すことが可能になります。

このライブラリは、CursorなどのAI開発エージェントと連携して動作するように設計されています。この設計は特にCursorに最適化されており、著者が主に使用するツールであるためです。基盤となるAIモデルはClaude-3.7-sonnetを想定しています。構文と構造は、他のAIモデルでも容易に解釈できるように設計されています。

## 主な機能

- 最適化されたMarkdown変換プロンプト
- AIシステム向けJSONスキーマ構文
- ドメイン固有の用語の包括的な[用語集](./docs/breakdown/glossary.md)

## 目的

開発要件を表現するための標準化された方法を提供することで、人間が書いた仕様とAIが解釈可能な指示の間のギャップを埋めることです。

## プロセス概要

このツール自体はルールに基づいてドキュメントを生成するものではありません。AIが解釈しやすく、扱いやすいプロンプトと構造化されたフォーマットを提供することで、AIドキュメント生成をサポートします。

## 使用方法

Breakdownツールには以下の主要なコマンドがあります：

| コマンド | 説明                                                               | プロジェクト                              | 課題                      | タスク                       |
| ------- | ------------------------------------------------------------------------- | ------------------------------------ | -------------------------- | -------------------------- |
| to      | 入力Markdownを次のレイヤー形式に変換するコマンド                    | プロジェクトへの分解                 | プロジェクトから課題への分解 | 課題からタスクへの分解  |
| summary | 新規Markdownの生成または指定レイヤーのMarkdown生成コマンド | プロジェクト概要の生成            | 課題概要の生成    | タスク概要の生成     |
| defect  | エラーログや不具合情報から修正を生成するコマンド          | 不具合情報からのプロジェクト情報生成 | 不具合情報からの課題生成   | 不具合情報からのタスク生成 |

### プロジェクトの分解

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

### 課題の分解

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

### タスクの分解

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

### Markdownサマリーの生成

**プロジェクトサマリー** 未整理の情報からプロジェクト概要を生成：

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
```

**課題サマリー** タスク群から課題を生成：

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

## ユースケースパターン

### 1. 未整理の情報からプロジェクト実装へ

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
breakdown to project <project_summary.md> -o <project_dir>
breakdown to issue <project_summary.md> -o <issue_dir>
breakdown to task <issue.md> -o <tasks_dir>
```

### 2. タスク群からの課題作成

```bash
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>
# 必要に応じて生成された課題を編集
breakdown to task <issue.md> -o <tasks_dir>
```

### 3. 不具合情報からの修正タスク生成

```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
breakdown defect issue --from <project_defect.md> -o <issue_defect_dir>
breakdown defect task --from <issue_defect.md> -o <task_defect_dir>
```

### 4. 改善要求からの修正提案作成

```bash
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

# セットアップ

## インストール

### 推奨: CLIとしてインストール

Breakdownは主にCLIツールとして使用することを目的としています。  
以下の公式Deno/JSRの方法でインストールできます：

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown/cli
```
- `-A`: すべての権限を許可（推奨）
- `-f`: 既存のコマンドを上書き
- `--global`: グローバルインストール
- `breakdown`: コマンド名

> **注意:**  
> CLIモジュールは`jsr:@tettuan/breakdown/cli`で指定する必要があります。  
> これは`deno.json`の`exports`設定に基づいています。

---

### アップデート

最新バージョンにアップデートするには、同じインストールコマンドを再度実行するだけです：

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown/cli
```

---

### アンインストール

#### グローバルインストールの場合

```bash
deno uninstall breakdown
```

#### ローカル（プロジェクト）インストールの場合

```bash
deno uninstall --root .deno breakdown
```
- `--root .deno`を使用して、プロジェクトの`.deno/bin`ディレクトリからアンインストールします。

---

### ライブラリとして

TypeScript/JavaScriptから直接使用する場合は、依存関係として追加できます：

```bash
deno add @tettuan/breakdown
```

---

### 注意事項

- breakdownコマンドは、`deno.json`の`bin`設定により自動的に`cli/breakdown.ts`をエントリーポイントとして使用します。
- Deno 1.40以降を推奨します。
- 詳細な使用方法は下記の「使用方法」セクションを参照してください。

### プロジェクトディレクトリへのローカルインストール

特定のプロジェクト内でのみbreakdownコマンドを使用したい場合は、`--root`オプションを使用して`.deno/bin`にインストールできます：

```bash
deno install -A -f --global --root .deno -n breakdown jsr:@tettuan/breakdown/cli
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
deno run --allow-all jsr:@tettuan/breakdown/cli
```

3. バイナリとしてコンパイル:
```bash
deno compile -A -o ~/.deno/bin/breakdown jsr:@tettuan/breakdown/cli
```

4. パスの確認:
```bash
echo $PATH
```

---

### JSR経由でのCLIのコンパイルとインストール（ローカルバイナリ）

JSRを使用してBreakdown CLIをスタンドアロンバイナリとしてコンパイルし、プロジェクトディレクトリ（例：./.deno/bin/breakdown）に配置することもできます：

```bash
mkdir -p .deno/bin
# JSRからCLIをコンパイルして.deno/bin/breakdownに出力

deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown/cli
```
- 生成されたバイナリは`./.deno/bin/breakdown`で利用可能です。
- 以下のコマンドで実行できます：
  ```bash
  ./.deno/bin/breakdown --help
  ```
- このバイナリは対象環境にDenoがインストールされている必要はありません。

> **注意:**
> ローカルソースから常にバイナリを生成したい場合は、JSR URLの代わりにローカルパス（例：`cli/breakdown.ts`）を使用してください。

---

# ドキュメント

https://tettuan.github.io/breakdown/

JSR: https://jsr.io/@tettuan/breakdown

---

[English](README.md) | [日本語](README.ja.md)
