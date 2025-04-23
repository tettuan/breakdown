#!/bin/bash

# このスクリプトは、プロジェクトの概要から詳細な課題を作成します。
#
# 実行方法：
# ./examples/02_detailed_issue_creation.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: 課題作成中にエラーが発生しました\033[0m"
    echo "ユースケース: プロジェクト概要から詳細な課題の作成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== プロジェクト概要から詳細な課題の作成 ==="

# カレントディレクトリを作業ディレクトリとして使用
WORK_DIR="$(pwd)"

# プロジェクトから課題への変換
FAILED_COMMAND="breakdown to issue -f ${WORK_DIR}/project-dir/project_summary.json -o ${WORK_DIR}/issue-dir/issue.json"
$FAILED_COMMAND || handle_error "課題への変換に失敗しました"

# 課題からタスクへの変換
FAILED_COMMAND="breakdown to task -f ${WORK_DIR}/issue-dir/issue.json -o ${WORK_DIR}/tasks-dir/tasks.json"
$FAILED_COMMAND || handle_error "タスクへの変換に失敗しました"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- プロジェクトサマリー: ${WORK_DIR}/project_summary.md"
echo "- プロジェクト: ${WORK_DIR}/project-dir/project_summary.json"
echo "- 課題: ${WORK_DIR}/issue-dir/issue.json"
echo "- タスク: ${WORK_DIR}/tasks-dir/tasks.json"
exit 0 