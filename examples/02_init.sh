#!/bin/bash

# このスクリプトは、breakdownの作業環境を初期化します。
# 他のexamplesを実行する前に、まず最初に実行する必要があります。
#
# 実行方法：
# ./examples/02_init_breakdown.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存の設定がある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: 初期化中にエラーが発生しました\033[0m"
    echo "ユースケース: breakdown作業環境の初期化"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== breakdown作業環境の初期化 ==="

# カレントディレクトリを作業ディレクトリとして使用
WORK_DIR="$(pwd)"
BREAKDOWN_DIR=".agent/breakdown"

# breakdown initの実行
echo "breakdown initの実行..."
FAILED_COMMAND="breakdown init"
$FAILED_COMMAND || handle_error "breakdown initの実行に失敗しました"

# 作成されたディレクトリとファイルの確認
echo "作成されたディレクトリとファイルの確認..."

# 設定ファイルの確認
if [ ! -f "${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml" ]; then
    echo "❌ 設定ファイルが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml"
    exit 1
fi

# プロンプトディレクトリの確認
if [ ! -d "${WORK_DIR}/${BREAKDOWN_DIR}/app_prompt" ]; then
    echo "❌ プロンプトディレクトリが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/app_prompt"
    exit 1
fi

# スキーマディレクトリの確認
if [ ! -d "${WORK_DIR}/${BREAKDOWN_DIR}/app_schema" ]; then
    echo "❌ スキーマディレクトリが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/app_schema"
    exit 1
fi

echo "✓ 初期化が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}"
echo "設定ファイル: ${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml"
echo "プロンプトディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}/app_prompt"
echo "スキーマディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}/app_schema"
exit 0 