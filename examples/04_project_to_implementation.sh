#!/bin/bash

# このスクリプトは、未整理の情報からプロジェクト実装までの流れを示します。
#
# 実行方法：
# ./examples/04_project_to_implementation.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: プロジェクト実装の変換中にエラーが発生しました\033[0m"
    echo "ユースケース: プロジェクト実装への変換"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== プロジェクト実装への変換 ==="

# カレントディレクトリを作業ディレクトリとして使用
WORK_DIR="$(pwd)"

# Create necessary directories
mkdir -p "${WORK_DIR}/tmp/examples/project"
mkdir -p "${WORK_DIR}/tmp/examples/issue"
mkdir -p "${WORK_DIR}/tmp/examples/tasks"

# Create sample project summary
cat > "${WORK_DIR}/tmp/examples/project/project_summary.md" << 'EOL'
# Project Summary: Breakdown CLI Tool

## Overview
A command-line tool for breaking down projects into manageable tasks using AI assistance.

## Key Features
- Project initialization
- Task breakdown
- AI-powered suggestions
- Progress tracking

## Technical Requirements
- Deno runtime
- TypeScript support
- YAML configuration
- Command-line interface
EOL

# プロジェクトサマリーからプロジェクトへの変換
FAILED_COMMAND="breakdown to project -f ${WORK_DIR}/tmp/examples/project/project_summary.md -o ${WORK_DIR}/tmp/examples/project/project.md"
$FAILED_COMMAND || handle_error "プロジェクトへの変換に失敗しました"

# プロジェクトから課題への変換
FAILED_COMMAND="breakdown to issue -f ${WORK_DIR}/tmp/examples/project/project.md -o ${WORK_DIR}/tmp/examples/issue/issue.md"
$FAILED_COMMAND || handle_error "課題への変換に失敗しました"

# 課題からタスクへの変換
FAILED_COMMAND="breakdown to task -f ${WORK_DIR}/tmp/examples/issue/issue.md -o ${WORK_DIR}/tmp/examples/tasks/tasks.md"
$FAILED_COMMAND || handle_error "タスクへの変換に失敗しました"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- プロジェクトサマリー: ${WORK_DIR}/tmp/examples/project/project_summary.md"
echo "- プロジェクト: ${WORK_DIR}/tmp/examples/project/project.md"
echo "- 課題: ${WORK_DIR}/tmp/examples/issue/issue.md"
echo "- タスク: ${WORK_DIR}/tmp/examples/tasks/tasks.md"
exit 0 