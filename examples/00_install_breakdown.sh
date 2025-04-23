#!/bin/bash

# このスクリプトは、breakdownコマンドをインストールします。
# examples/配下の他のスクリプトを実行する前に、まず最初に実行する必要があります。
#
# 実行方法：
# ./examples/00_install_breakdown.sh
#
# インストール先：
# - 実行コマンド: ~/.deno/bin/breakdown
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のインストールがある場合は上書きされます
# - ~/.deno/bin が PATH に含まれている必要があります

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: インストール中にエラーが発生しました\033[0m"
    echo "ユースケース: breakdownコマンドのインストール"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== breakdownコマンドのインストール ==="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# プロジェクトルートディレクトリに移動
cd "${PROJECT_ROOT}" || handle_error "プロジェクトルートディレクトリへの移動に失敗しました"

# JSRからインストール
FAILED_COMMAND="deno install -f --global --allow-env --allow-read --allow-write -n breakdown cli/breakdown.ts"
$FAILED_COMMAND || handle_error "breakdownコマンドのインストールに失敗しました"

echo "✓ インストールが完了しました。"
echo "ソースコード: ${PROJECT_ROOT}/cli/breakdown.ts"
echo "実行コマンド: ${HOME}/.deno/bin/breakdown"

# PATHの確認
if ! echo "${PATH}" | tr ':' '\n' | grep -q "${HOME}/.deno/bin"; then
    echo -e "\033[1;33m警告: ${HOME}/.deno/bin が PATH に含まれていません\033[0m"
    echo "以下のコマンドを ~/.bashrc または ~/.zshrc に追加することを推奨します："
    echo "export PATH=\"${HOME}/.deno/bin:\${PATH}\""
    echo
fi

echo "✓ スクリプトは正常に完了しました"
exit 0 