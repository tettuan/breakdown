#!/bin/bash

# このスクリプトは、プロジェクト概要から詳細な課題を作成する例を示します。
#
# ユースケース：
# - プロジェクト概要から課題を作成し、各課題を詳細化する
# - プロジェクトマネージャーが課題の詳細を手動で編集する
# - 課題の詳細から実装タスクを自動生成する
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - プロジェクトの概要がある程度まとまっていること
#
# 期待される出力：
# - プロジェクト概要のMarkdown
# - 課題の詳細なMarkdown
# - 実装タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${HOME}/.deno/bin/breakdown"

# 作業ディレクトリの作成
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: 処理中にエラーが発生しました\033[0m"
    echo "ユースケース: プロジェクト概要から詳細な課題の作成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== プロジェクト概要から詳細な課題の作成 ==="

# プロジェクト概要のMarkdownを作成
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
mkdir -p "${WORK_DIR}/project-dir"
"${BREAKDOWN_CMD}" to project -f "${WORK_DIR}/project_summary.md" -o "${WORK_DIR}/project-dir/project_summary.json"

# プロジェクトからイシューを生成
mkdir -p "${WORK_DIR}/issue-dir"
"${BREAKDOWN_CMD}" to issue -f "${WORK_DIR}/project-dir/project_summary.json" -o "${WORK_DIR}/issue-dir/issue.json"

# イシューからタスクを生成
mkdir -p "${WORK_DIR}/tasks-dir"
"${BREAKDOWN_CMD}" to task -f "${WORK_DIR}/issue-dir/issue.json" -o "${WORK_DIR}/tasks-dir/tasks.json"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- プロジェクトサマリー: ${WORK_DIR}/project_summary.md"
echo "- プロジェクト: ${WORK_DIR}/project-dir/project_summary.json"
echo "- 課題: ${WORK_DIR}/issue-dir/issue.json"
echo "- タスク: ${WORK_DIR}/tasks-dir/tasks.json" 