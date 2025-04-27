#!/bin/bash

# このスクリプトは、breakdownコマンドをインストールします。
# examples/配下の他のスクリプトを実行する前に、まず最初に実行する必要があります。
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

set -e

echo "=== breakdownコマンドのインストール ==="

# Install breakdown globally
deno install -A --unstable --global cli/breakdown.ts

# Get the installation directory
INSTALL_DIR=$(dirname $(which breakdown))

# Add to PATH if not already there
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    export PATH="$INSTALL_DIR:$PATH"
    echo "✓ PATH が設定されました: $INSTALL_DIR"
fi

echo "✓ インストールが完了しました。"
echo "ソースコード: $(pwd)/cli/breakdown.ts"
echo "実行コマンド: $(which breakdown)"

# Create base configuration
echo "=== ユーザー設定ファイルの作成 ==="

# Create all necessary directories
CONFIG_DIR=".agent/breakdown"
mkdir -p "$CONFIG_DIR/config"
mkdir -p "$CONFIG_DIR/app_prompt"
mkdir -p "$CONFIG_DIR/app_schema"

# Create base configuration file
cat > "$CONFIG_DIR/config/app.yml" << 'EOL'
working_dir: "./.agent/breakdown"
app_prompt:
  base_dir: "./.agent/breakdown/app_prompt"
app_schema:
  base_dir: "./.agent/breakdown/app_schema"
EOL

echo "✓ 設定ファイルを作成しました: $(pwd)/$CONFIG_DIR/config/app.yml"
echo "✓ 作業ディレクトリを作成しました: $CONFIG_DIR"
echo "✓ プロンプトディレクトリを作成しました: $CONFIG_DIR/app_prompt"
echo "✓ スキーマディレクトリを作成しました: $CONFIG_DIR/app_schema"
echo "✓ スクリプトは正常に完了しました"

# Create sample prompts if prompts directory exists
echo "=== プロンプトのコピー ==="
if [ -d "prompts" ]; then
    cp -r prompts/* "$CONFIG_DIR/app_prompt/"
    echo "✓ プロンプトをコピーしました: $CONFIG_DIR/app_prompt"
else
    echo "⚠️ プロンプトディレクトリが見つかりません: prompts/"
    # Create minimal prompt structure
    mkdir -p "$CONFIG_DIR/app_prompt/to/project"
    cat > "$CONFIG_DIR/app_prompt/to/project/default.md" << 'EOL'
# Project Conversion Prompt
Convert the given input into a structured project format.
EOL
    echo "✓ 基本プロンプトを作成しました: $CONFIG_DIR/app_prompt/to/project/default.md"
fi

echo "✓ スクリプトは正常に完了しました"

# Export PATH for subsequent scripts
export PATH="$INSTALL_DIR:$PATH"
echo "✓ スクリプトは正常に完了しました" 