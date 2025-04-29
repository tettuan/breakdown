#!/bin/bash

# このスクリプトは、breakdownコマンドをインストールします。
# examples/配下の他のスクリプトを実行する前に、まず最初に実行する必要があります。
#
# 注意: このスクリプトはローカル開発用です。
# - リリースされていないローカルのcli/breakdown.tsを使用します
# - 一般ユーザーは代わりに `deno install -A -n breakdown jsr:@tettuan/breakdown/cli` を使用してください
#
# 実行方法：
# ./examples/01_install.sh
#
# インストール先：
# - 実行コマンド: .deno/bin/breakdown (プロジェクトルート配下)
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます
# - 作業環境の初期化は02_init.shで行います

set -e

echo "=== breakdownコマンドのインストール ==="

# Install breakdown globally
deno install -A -f --global --config deno.json cli/breakdown.ts

# Get the installation directory
INSTALL_DIR=$(dirname $(which breakdown))

# Add to PATH if not already there
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    export PATH="$INSTALL_DIR:$PATH"
    echo "✓ PATH が設定されました: $INSTALL_DIR"
fi

echo "✓ インストールが完了しました。"
echo "実行コマンド: $(which breakdown)"
echo ""
echo "次のステップ:"
echo "作業環境の初期化を行うには ./examples/02_init.sh を実行してください。"

# Export PATH for subsequent scripts
export PATH="$INSTALL_DIR:$PATH" 