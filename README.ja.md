# ブレークダウン

TypeScriptとJSONスキーマを使ったAI自動開発のための開発指示作成ツール。

## 概要

BreakDownは、TypeScriptとDeno with AI
composerを使って、Markdownドキュメントを変換し、AIシステムが解釈しやすいようにするツール＆スキーマのセットです。

実行すると、Markdownで書かれた開発要件が、変換するためのプロンプトとして示されます。示されたプロンプトには事前に定義されたJSONスキーマが示されています。JSONスキーマは変換のために構造化された定義です。
結果、示されたプロンプトによって、要件を構造化された情報へと変換します。
出力形式はプロンプトで指示できるため、Markdonw/JSON/YAMLなど様々な形式にできます。

BreakdownSchema構文を資料として読むことで、AIシステムはJSON構造を解釈し、開発要件や仕様を適切に理解することが期待できます。
結果、指示する内容の簡素化が図られ、簡潔に指示を出すことができるよう期待しています。

このライブラリは、CursorのようなAI開発エージェントで動作するように設計されています。この設計は、特にCursorに最適化されています。作者が主に使用しているツールであるためです。基礎となるAIモデルはClaude-3.7-sonnetを想定しています。構文と構造は、他のAIモデルでも容易に解釈できるように設計されています。

## 主な想定機能

- 最適化されたMarkdownの変換プロンプト
- AIシステムのためのJSONスキーマ構文
- ドメイン固有の用語を網羅した[用語集](./docs/breakdown/glossary.md)

## 目的

開発要件を表現するための標準化された方法を提供することによって、人間が書いた仕様とAIが解釈可能な命令の間のギャップを埋めることです。

## 処理の概要

このツールがルールに基づいてドキュメントを生成するわけではありません。AIが解釈しやすく、作業しやすい構造化されたフォーマットをプロンプトとともに提供することで、AIによるドキュメント生成を支援します。

```mermaid
sequenceDiagram
    participant Developer as アプリ開発者
    participant Cursor as Cursor
    participant AI as AI

    Developer->>Developer: プロジェクト概要や要望をMarkdownで記載し保存

    Developer->>Cursor: `breakdown project <markdown.md>` 実行
    Cursor->>Cursor: コマンド実行

    Cursor->>Cursor: 変換プロンプトを取得
    Cursor->>AI: 変換処理を指示
    AI->>AI: 変換を実行
    AI->>Cursor: 変換後の要求を返答
    Cursor->>Developer: 変換済み要求ファイル

    Developer->>Cursor: 要求を開発指示とともに送信
    Cursor->>AI: 指示に基づき開発
    AI->>Cursor: コード生成
    Cursor->>Developer: 開発成果物
```

## 将来の展望

このツール自体は何も開発成果を生成しません。ただ解釈を最適化するだけです。
今後AI開発が進むにつれて、IDEの進化によって解釈が洗練されたり、プログラミング言語がAI開発に最適化されていくでしょう。

一方で、要件整理の段階がシステム構築やアプリケーション構築の効率を左右することも予想されます。
自然言語で一貫した指示を行うために、引き続き Breakdown するニーズは残るだろうと考え得ています。

# Usage

Breakdownツールには以下の主要コマンドがあります：

| コマンド | 説明                                                                 | Project                              | Issue                      | Task                       |
| -------- | -------------------------------------------------------------------- | ------------------------------------ | -------------------------- | -------------------------- |
| to       | 入力されたMarkdownを次のレイヤー形式に変換するコマンド               | プロジェクトへ分解                   | プロジェクトから課題へ分解 | 課題からタスクへ分解       |
| summary  | 新規のMarkdownを生成、または指定レイヤーのMarkdownを生成するコマンド | プロジェクト概要を生成               | 課題概要を生成             | タスク概要を生成           |
| defect   | エラーログや不具合情報から修正を生成するコマンド                     | 不具合情報からプロジェクト情報を生成 | 不具合情報から課題を生成   | 不具合情報からタスクを生成 |

## プロジェクトへの分解

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

## 課題への分解

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

## タスクへの分解

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

## Markdownサマリーの生成

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

## 不具合情報からの修正生成

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

# ユースケースパターン

## 1. 未整理の情報からプロジェクト実装までの流れ

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

## 2. タスク群から課題の作成

複数の未整理タスクから課題を生成し、再度タスクに分解：

```bash
# タスク群から課題を生成
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>

# 生成された課題を編集（必要に応じて）

# 課題からタスクを生成
breakdown to task <issue.md> -o <tasks_dir>
```

## 3. 不具合情報からの修正タスク生成

エラーログや不具合レポートから修正タスクを生成：

```bash
# エラーログから不具合情報を生成
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>

# 不具合情報から課題を生成
breakdown defect issue --from <project_defect.md> -o <issue_defect_dir>

# 課題から修正タスクを生成
breakdown defect task --from <issue_defect.md> -o <task_defect_dir>
```

## 4. 改善要望からの修正提案作成

改善要望から直接タスクレベルの修正を生成：

```bash
# 改善要望から修正タスクを生成
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

# セットアップ

## インストール

Breakdown を使用するには、Deno がインストールされている必要があります。Deno のインストールについては、[Deno の公式サイト](https://deno.com/manual/getting_started/installation) を参照してください。

### 推奨: CLIとしてグローバルインストール

Breakdown は主にコマンドラインインターフェース（CLI）ツールとして使用します。
以下のコマンドで、JSR から直接グローバルにインストールできます。これが最も簡単で推奨される方法です。

```bash
deno install -A -f --global --name breakdown jsr:@tettuan/breakdown/cli
```

- `-A`: すべての権限を許可します (推奨)。
- `-f`: 既存のコマンドがある場合に上書きします。
- `--global`: システム全体で `breakdown` コマンドを利用できるようにします。
- `--name breakdown`: コマンド名を `breakdown` とします。
- `jsr:@tettuan/breakdown/cli`: Breakdown CLI の JSR パッケージ識別子です。**必ず `/cli` サブパスを指定してください。**

インストール後、ターミナルで `breakdown --version` を実行して、バージョン情報が表示されれば成功です。

### 最新バージョンへのアップデート

Breakdown CLI の新しいバージョンがリリースされた場合、以下のコマンドで最新版にアップデートできます。
これはインストールコマンドと同じです。

```bash
deno install -A -f --global --name breakdown jsr:@tettuan/breakdown/cli
```

最新のバージョン番号は、JSR のパッケージページで確認できます:
[https://jsr.io/@tettuan/breakdown](https://jsr.io/@tettuan/breakdown)

### その他のインストール方法

#### ライブラリとして利用する

Breakdown の機能を TypeScript/JavaScript プロジェクトから直接利用したい場合は、`deno add` コマンドでプロジェクトの依存関係に追加できます。

```bash
deno add @tettuan/breakdown
```
この場合、エントリーポイントは `jsr:@tettuan/breakdown` となります。

#### 特定のプロジェクト配下にローカルインストールする

特定のプロジェクト内でのみ `breakdown` コマンドを使用したい場合は、プロジェクト内の特定のディレクトリ（例: `.deno`）をインストールルートとして指定し、そこにコマンドをインストールすることができます。Deno 2.x 以降では、このようにURLやJSR識別子からスクリプトをインストールする際には `--global` フラグが必須となりました。

```bash
deno install -A -f --global --root .deno --name breakdown jsr:@tettuan/breakdown/cli
```

- `-A`: すべての権限を許可します。`--global` を指定しているため使用可能です。
- `-f`: 既存のコマンドがある場合に上書きします。
- `--global`: スクリプトを実行可能ファイルとしてインストールする際に必須のフラグです (Deno 2.x 以降)。
- `--root .deno`: プロジェクト内の `.deno` ディレクトリをインストールルートにします。コマンドは `.deno/bin/breakdown` にインストールされます。
- `--name breakdown`: コマンド名を `breakdown` とします。
- `jsr:@tettuan/breakdown/cli`: インストールするCLIのJSR識別子です。

この方法でインストールした場合、コマンドは指定した `--root` ディレクトリ配下の `bin` フォルダ（この例では `.deno/bin/breakdown`）に保存されます。
実行する際は、そのパスを直接指定するか、そのディレクトリに `PATH` を通してください。

実行例:
```bash
# .deno/bin にPATHが通っている場合
# breakdown to project input.md (シェルのエイリアスやPATH設定によります)

# .deno/bin にPATHが通っていない、または直接実行ファイルを指定する場合
./.deno/bin/breakdown to project input.md

# Deno を介して実行する場合 (権限はコマンド自体に焼き付けられています)
deno run ./.deno/bin/breakdown to project input.md 
# (注意: 上記の deno run で実行する場合、-A は breakdown スクリプト自体ではなく deno run コマンドの権限になるため、
# インストール時に -A で権限を焼き付けていれば、deno run に -A は不要な場合があります。
# 確実なのは、インストールされたスクリプトを直接実行することです。）
```

## アンインストール

#### グローバルインストールの場合

```bash
deno uninstall breakdown
```

#### プロジェクト配下（ローカルインストール）の場合

```bash
deno uninstall --root .deno breakdown
```
- `--root .deno` で、プロジェクト内の `.deno/bin` からアンインストールされます。

## 注意事項

- `breakdown` コマンドは、`jsr publish` の設定により、`cli/breakdown.ts` をエントリーポイントとして動作します。
- Deno 1.40 以降を推奨します。
- 詳細な使い方は上記「Usage」セクションおよび下記のドキュメントを参照してください。

# ドキュメント

https://jsr.io/@tettuan/breakdown

## 初期化後のディレクトリ構成例

`breakdown init` コマンドを実行すると、プロジェクト配下に以下のようなディレクトリ・ファイルが生成されます（デフォルト設定の場合）:

```
.agent/
└── breakdown/
    ├── config/
    │   └── app.yml         # アプリケーション設定ファイル
    ├── prompts/            # プロンプトファイル格納ディレクトリ
    └── schema/             # JSONスキーマ格納ディレクトリ
```

- 設定ファイルやプロンプト、スキーマの配置ルールは [app_config.ja.md](docs/breakdown/app_config.ja.md) を参照してください。
- パスやファイル名の詳細な仕様は [path.ja.md](docs/breakdown/path.ja.md) を参照してください。

## 仕様・詳細ドキュメントへのリンク

- [Breakdown 仕様書インデックス](docs/breakdown/index.ja.md)
- [CLIインターフェース仕様](docs/breakdown/cli.ja.md)
- [アプリケーション設定・作業ディレクトリ仕様](docs/breakdown/app_config.ja.md)
- [パス・ファイル名仕様](docs/breakdown/path.ja.md)
- [モジュール構成・ディレクトリ構成](docs/breakdown/module.ja.md)
