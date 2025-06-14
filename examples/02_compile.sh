#!/bin/bash
# breakdown CLIをバイナリ化して.deno/bin/breakdownに出力する
set -euo pipefail

# エラー処理用の関数
handle_error() {
    echo "エラー: $1" >&2
    exit 1
}

# クリーンアップ用の関数
cleanup() {
    if [ -f ".deno/bin/breakdown" ]; then
        rm -f .deno/bin/breakdown
    fi
}

# スクリプト終了時のクリーンアップを設定
trap cleanup EXIT

# 作業ディレクトリをプロジェクトルートに移動
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
pushd "$PROJECT_ROOT" > /dev/null || handle_error "プロジェクトルートディレクトリの移動に失敗しました"

# 出力ディレクトリの作成
mkdir -p .deno/bin || handle_error "出力ディレクトリの作成に失敗しました"

# コンパイル前のバージョン確認
echo "コンパイル前のバージョン確認..."
if ! deno run -A cli/breakdown.ts --version; then
    handle_error "ソースコードのバージョン確認に失敗しました"
fi

# コンパイル実行
echo "コンパイルを開始します..."
if ! deno compile -A -o .deno/bin/breakdown cli/breakdown.ts; then
    handle_error "コンパイルに失敗しました"
fi

# コンパイルされたバイナリの存在確認
if [ ! -f ".deno/bin/breakdown" ]; then
    handle_error "コンパイルされたバイナリが見つかりません"
fi

# コンパイルされたバイナリの実行権限確認
if [ ! -x ".deno/bin/breakdown" ]; then
    handle_error "コンパイルされたバイナリに実行権限がありません"
fi

# コンパイルされたバイナリの動作確認
echo "コンパイルされたバイナリの動作確認..."
if ! ./.deno/bin/breakdown --version; then
    handle_error "コンパイルされたバイナリの動作確認に失敗しました"
fi

echo "✓ breakdownバイナリを .deno/bin/breakdown に生成しました。"
echo "実行例: ./.deno/bin/breakdown -h"

# 作業ディレクトリの復帰
popd > /dev/null || handle_error "ディレクトリの復帰に失敗しました" 