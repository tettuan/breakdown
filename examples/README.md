# Breakdown CLI Examples

このドキュメントでは、Breakdownツールの主なCLI利用例を紹介します。

## 重要な注意点

このexamplesディレクトリは、Breakdownライブラリの開発者向けのサンプルコードです。
実際のユーザー向けのインストール方法とは異なりますので、注意してください。

### 開発者向けインストール（このexamplesの実行用）
```bash
# このリポジトリをクローンした後、以下を実行
./examples/00_install_breakdown.sh

# これは内部で以下のコマンドを実行します：
# deno install --force --global --allow-read --allow-write --allow-run --name breakdown cli/breakdown.ts

# インストール先: ~/.deno/bin/breakdown
# PATHが通っていない場合は、以下を ~/.bashrc または ~/.zshrc に追加
export PATH="${HOME}/.deno/bin:${PATH}"
```

### ユーザー向けインストール（実際の利用時）
```bash
# JSRからインストール
deno install --global --allow-read --allow-write --allow-run --name breakdown jsr:@tettuan/breakdown

# インストール先は同じく ~/.deno/bin/breakdown
```

## 基本的な使用例

以下のサンプルは、開発者がBreakdownライブラリの機能を確認・テストするためのものです。
実際のユーザーは、JSRからインストールした後、これらの例を参考に独自のスクリプトを作成してください。

### 1. プロジェクト概要から実装までの一連の流れ

```bash
./examples/01_project_to_implementation.sh
```

このスクリプトは以下を実行します：
- プロジェクト概要のMarkdown作成
- プロジェクト用JSONへの変換
- イシューの生成
- タスクの生成

### 2. プロジェクトからの詳細なイシュー作成

```bash
./examples/02_detailed_issue_creation.sh
```

このスクリプトは以下を実行します：
- プロジェクト概要からイシューのMarkdownを生成
- イシューの手動編集（この部分は実際には手動で行います）
- 編集済みイシューのJSON変換
- タスクの生成

### 3. テスト結果からのタスク生成

```bash
./examples/03_test_result_tasks.sh
```

このスクリプトは以下を実行します：
- テスト実行と結果の取得
- テスト結果からの不具合情報生成
- イシューへの変換
- 修正タスクの生成

### 4. 実行エラーの修正提案作成

```bash
./examples/04_error_fix_proposal.sh
```

このスクリプトは以下を実行します：
- エラーログの分析
- プロジェクトレベルの不具合情報生成
- イシューレベルの不具合情報生成
- 修正タスクの生成

## 全てのサンプルを実行

全てのサンプルスクリプトを順番に実行するには：

```bash
./scripts/run_examples.sh
```

## コマンドオプション

主なオプション：
- `--from` または `-f`: 入力ファイルの指定
- `--destination` または `-o`: 出力ファイルまたはディレクトリの指定
- `--input` または `-i`: 入力レイヤータイプの指定

## 自動ファイル名生成

出力時にファイル名を指定しない場合：
- `<yyyymmdd>_<random_hash>.md` 形式でファイル名が生成されます
- 例：`20250211_e81d0bd.md` 