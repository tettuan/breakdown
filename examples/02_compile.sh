#!/bin/bash
# breakdown CLIをバイナリ化して.deno/bin/breakdownに出力する
set -e

pushd "$(dirname "$0")" > /dev/null

mkdir -p .deno/bin

deno compile -A -o .deno/bin/breakdown ../cli/breakdown.ts

echo "✓ breakdownバイナリを .deno/bin/breakdown に生成しました。"
echo "実行例: ./.deno/bin/breakdown -h"

popd > /dev/null 