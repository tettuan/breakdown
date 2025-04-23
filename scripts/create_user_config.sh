#!/bin/bash

# このスクリプトは、ユーザー設定ファイルを作成します。
# 
# 実行方法：
# ./scripts/create_user_config.sh [working_dir]
#
# 引数：
# - working_dir: 作業ディレクトリのパス（オプション、デフォルト: .agent/breakdown）
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存の設定ファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: 設定ファイル作成中にエラーが発生しました\033[0m"
    echo "ユースケース: ユーザー設定ファイルの作成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== ユーザー設定ファイルの作成 ==="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# プロジェクトルートディレクトリに移動
cd "${PROJECT_ROOT}" || handle_error "プロジェクトルートディレクトリへの移動に失敗しました"

# 作業ディレクトリの設定
WORKING_DIR="${1:-.agent/breakdown}"

# 設定ディレクトリの作成
CONFIG_DIR="${PROJECT_ROOT}/breakdown/config"
mkdir -p "${CONFIG_DIR}" || handle_error "設定ディレクトリの作成に失敗しました"

# app_promptディレクトリの作成
PROMPT_DIR="${WORKING_DIR}/app_prompt"
mkdir -p "${PROMPT_DIR}" || handle_error "プロンプトディレクトリの作成に失敗しました"

# 設定ファイルの作成
CONFIG_FILE="${CONFIG_DIR}/app.yml"
cat > "${CONFIG_FILE}" << EOL
working_dir: ${WORKING_DIR}
app_prompt:
  base_dir: ${PROMPT_DIR}
app_schema:
  base_dir: lib/breakdown/schema
EOL

echo "✓ 設定ファイルを作成しました: ${CONFIG_FILE}"
echo "✓ 作業ディレクトリを作成しました: ${WORKING_DIR}"
echo "✓ プロンプトディレクトリを作成しました: ${PROMPT_DIR}"

echo "✓ スクリプトは正常に完了しました"
exit 0 