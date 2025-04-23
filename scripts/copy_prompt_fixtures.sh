#!/bin/bash

# このスクリプトは、テストフィクスチャーのプロンプトを
# ユーザー設定ファイルで指定された app_prompt ディレクトリにコピーします。
#
# 実行方法：
# ./scripts/copy_prompt_fixtures.sh [working_dir]
#
# 引数：
# - working_dir: 作業ディレクトリのパス（オプション、デフォルト: .agent/breakdown）
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のプロンプトファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: プロンプトのコピー中にエラーが発生しました\033[0m"
    echo "ユースケース: プロンプトのコピー"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== プロンプトのコピー ==="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# プロジェクトルートディレクトリに移動
cd "${PROJECT_ROOT}" || handle_error "プロジェクトルートディレクトリへの移動に失敗しました"

# 作業ディレクトリの設定
WORKING_DIR="${1:-.agent/breakdown}"
PROMPT_DIR="${WORKING_DIR}/app_prompt"

# プロンプトディレクトリの作成
mkdir -p "${PROMPT_DIR}/summary/task" || handle_error "summaryディレクトリの作成に失敗しました"
mkdir -p "${PROMPT_DIR}/summary/project" || handle_error "summaryディレクトリの作成に失敗しました"
mkdir -p "${PROMPT_DIR}/to/task" || handle_error "toディレクトリの作成に失敗しました"
mkdir -p "${PROMPT_DIR}/to/issue" || handle_error "toディレクトリの作成に失敗しました"
mkdir -p "${PROMPT_DIR}/to/project" || handle_error "toディレクトリの作成に失敗しました"

# フィクスチャーからプロンプトをコピー
FIXTURES_DIR="tests/fixtures/prompts"

# test_prompt.mdのコピー
FAILED_COMMAND="cp ${FIXTURES_DIR}/test_prompt.md ${PROMPT_DIR}/"
$FAILED_COMMAND || handle_error "test_prompt.mdのコピーに失敗しました"

# summaryディレクトリのコピー
FAILED_COMMAND="cp -r ${FIXTURES_DIR}/summary/* ${PROMPT_DIR}/summary/"
$FAILED_COMMAND || handle_error "summaryディレクトリのコピーに失敗しました"

# toディレクトリのコピー
FAILED_COMMAND="cp -r ${FIXTURES_DIR}/to/* ${PROMPT_DIR}/to/"
$FAILED_COMMAND || handle_error "toディレクトリのコピーに失敗しました"

echo "✓ プロンプトをコピーしました: ${PROMPT_DIR}"
echo "✓ スクリプトは正常に完了しました"
exit 0 