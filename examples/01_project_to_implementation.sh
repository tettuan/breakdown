#!/bin/bash

# このスクリプトは、プロジェクト概要から実装までの一連の流れを示します。
# 
# ユースケース：
# - 新規プロジェクトを開始する際に、プロジェクト概要から実装タスクまでを一気に生成
# - プロジェクトマネージャーが最初のプロジェクト概要を書いた後の自動分解フロー
# - トップダウンアプローチでプロジェクトを分解する際に使用
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - プロジェクトの概要がある程度まとまっていること
#
# 期待される出力：
# - プロジェクト概要のMarkdown
# - プロジェクトのJSON形式の仕様
# - イシューの一覧（JSON）
# - 実装タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${HOME}/.deno/bin/breakdown"

# 作業ディレクトリの初期化
# 必要なディレクトリ構造を作成
"${BREAKDOWN_CMD}" init

# プロジェクト概要のMarkdownを作成
# ここでは例として標準入力からプロジェクト概要を入力
# 実際の使用時は、エディタで直接project_summary.mdを作成することを推奨
echo "
# プロジェクト概要
## 目的
ユーザーのタスク管理を効率化するためのCLIツール

## 主な機能
- タスクの追加、編集、削除
- タスクの優先順位付け
- 締め切り管理
- タグによる分類

## 技術スタック
- Deno
- TypeScript
" | "${BREAKDOWN_CMD}" summary project -o project_summary.md

# Markdownをプロジェクト用JSONに変換
# AIが解釈しやすい形式に変換し、プロジェクトの構造化データを生成
"${BREAKDOWN_CMD}" to project project_summary.md -o project-dir/

# プロジェクトからイシューを生成
# プロジェクトの各機能や要件をイシューレベルに分解
"${BREAKDOWN_CMD}" to issue project-dir/project_summary.json -o issue-dir/

# イシューからタスクを生成
# 各イシューを実装可能な粒度のタスクに分解
"${BREAKDOWN_CMD}" to task issue-dir/issue.json -o tasks-dir/ 