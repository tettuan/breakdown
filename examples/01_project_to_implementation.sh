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
BREAKDOWN_CMD="${PROJECT_ROOT}/.deno/bin/breakdown"

# 作業ディレクトリの作成
WORK_DIR="${PROJECT_ROOT}/tmp/work_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${WORK_DIR}"
trap 'rm -rf "${WORK_DIR}"' EXIT

# 作業ディレクトリの初期化
# 必要なディレクトリ構造を作成
"${BREAKDOWN_CMD}" init

# プロジェクト概要のMarkdownを作成
# ここでは例として標準入力からプロジェクト概要を入力
# 実際の使用時は、エディタで直接project_summary.mdを作成することを推奨
SUMMARY_FILE="${WORK_DIR}/project_summary.md"
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
" > "${SUMMARY_FILE}"

# プロジェクト概要をJSONに変換
"${BREAKDOWN_CMD}" summary project --input project -o "${WORK_DIR}/project_summary.md"

# Markdownをプロジェクト用JSONに変換
# AIが解釈しやすい形式に変換し、プロジェクトの構造化データを生成
mkdir -p "${WORK_DIR}/project-dir"
"${BREAKDOWN_CMD}" to project -f "${WORK_DIR}/project_summary.md" -o "${WORK_DIR}/project-dir/project_summary.json"

# プロジェクトからイシューを生成
# プロジェクトの各機能や要件をイシューレベルに分解
mkdir -p "${WORK_DIR}/issue-dir"
"${BREAKDOWN_CMD}" to issue -f "${WORK_DIR}/project-dir/project_summary.json" -o "${WORK_DIR}/issue-dir/issue.json"

# イシューからタスクを生成
# 各イシューを実装可能な粒度のタスクに分解
mkdir -p "${WORK_DIR}/tasks-dir"
"${BREAKDOWN_CMD}" to task -f "${WORK_DIR}/issue-dir/issue.json" -o "${WORK_DIR}/tasks-dir/tasks.json"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- プロジェクトサマリー: ${WORK_DIR}/project_summary.md"
echo "- プロジェクト: ${WORK_DIR}/project-dir/project_summary.json"
echo "- 課題: ${WORK_DIR}/issue-dir/issue.json"
echo "- タスク: ${WORK_DIR}/tasks-dir/tasks.json"
exit 0 