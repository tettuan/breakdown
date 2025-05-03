#!/bin/bash

# このスクリプトは、Deno 1.44以降の仕様に合わせて、deno taskやJSR経由でbreakdown CLIを使う方法の案内・ヘルプを出力します。
# examples/配下の他のスクリプトを実行する前に、まず最初に実行してください。
#
# 注意: breakdown CLIのローカルインストール（パーミッション付与）はDeno 1.44以降では不可です。
# - グローバルインストール、deno run、deno task、バイナリ化のいずれかを推奨します
#
# 実行方法：
# ./examples/01_install.sh

set -e

cd "$(dirname "$0")"

echo "=== breakdown CLI 利用案内（Deno 1.44+対応） ==="
echo ""
echo "【推奨】deno task でJSRからbreakdown CLIを使う方法:"
echo "  1. deno.jsonに以下を追加してください:"
echo ""
echo '    "tasks": {'
echo '      "breakdown": "run -A jsr:@tettuan/breakdown/cli"'
echo '    }'
echo ""
echo "  2. コマンド例:"
echo "     deno task breakdown --help"
echo "     deno task breakdown to project <input.md> -o <output_dir>"
echo ""
echo "【グローバルインストールしたい場合】"
echo "  deno install -A -f --global -n breakdown jsr:@tettuan/breakdown"
echo ""
echo "【バイナリ化して使いたい場合】"
echo "  mkdir -p .deno/bin"
echo "  deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown/cli"
echo "  .deno/bin/breakdown --help"
echo ""
echo "【補足】"
echo "- Deno 1.44以降では、ローカルインストール（--root）でパーミッション付与はできません。"
echo "- deno runやdeno taskでの利用、またはバイナリ化を推奨します。"
echo "- 詳細はREADME.mdのインストール手順を参照してください。" 