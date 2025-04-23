#!/bin/bash

# このスクリプトは、breakdownコマンドをインストールします。
# examples/配下の他のスクリプトを実行する前に、まず最初に実行する必要があります。
#
# 実行方法：
# ./examples/00_install_breakdown.sh
#
# インストール先：
# - 実行コマンド: .deno/bin/breakdown (プロジェクトルート配下)
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のインストールがある場合は上書きされます

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

# .deno/bin ディレクトリの作成
mkdir -p "${PROJECT_ROOT}/.deno/bin"

# 一時的なインストールディレクトリを作成
TEMP_DENO_ROOT="${PROJECT_ROOT}/tmp/deno_install"
mkdir -p "${TEMP_DENO_ROOT}"
export DENO_INSTALL_ROOT="${TEMP_DENO_ROOT}"

# JSRからインストール
FAILED_COMMAND="deno install --allow-env --allow-read --allow-write -f -n breakdown --global cli/breakdown.ts"
$FAILED_COMMAND || handle_error "breakdownコマンドのインストールに失敗しました"

# バイナリをプロジェクトディレクトリに移動
mv "${TEMP_DENO_ROOT}/bin/breakdown" "${PROJECT_ROOT}/.deno/bin/" || handle_error "バイナリの移動に失敗しました"

# 一時ディレクトリの削除
rm -rf "${TEMP_DENO_ROOT}"

# PATHの確認と設定
if ! echo "${PATH}" | tr ':' '\n' | grep -q "${PROJECT_ROOT}/.deno/bin"; then
    export PATH="${PROJECT_ROOT}/.deno/bin:${PATH}"
    echo "✓ PATH が設定されました: ${PROJECT_ROOT}/.deno/bin"
fi

echo "✓ インストールが完了しました。"
echo "ソースコード: ${PROJECT_ROOT}/cli/breakdown.ts"
echo "実行コマンド: ${PROJECT_ROOT}/.deno/bin/breakdown"

echo "✓ スクリプトは正常に完了しました"
exit 0 