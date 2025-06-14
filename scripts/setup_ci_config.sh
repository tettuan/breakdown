#!/bin/bash

# CI実行前の設定ファイル準備スクリプト
# .agent/breakdown/config/ディレクトリに必要なファイルを配置

echo "Setting up CI configuration files..."

# .agent/breakdown/config/ ディレクトリ作成
mkdir -p /Users/tettuan/github/breakdown/.agent/breakdown/config

# 設定ファイルをコピー
cp config/*.yml /Users/tettuan/github/breakdown/.agent/breakdown/config/

echo "CI configuration files setup completed."
echo "Files in .agent/breakdown/config/:"
ls -la /Users/tettuan/github/breakdown/.agent/breakdown/config/