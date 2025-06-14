#!/bin/bash
# このスクリプトは、breakdownの作業環境を初期化します。
set -euo pipefail
# 他のexamplesを実行する前に、まず最初に実行する必要があります。
#
# 実行方法：
# ./examples/02_init_breakdown.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存の設定がある場合は上書きされます

# 作業ディレクトリをプロジェクトルートに移動
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || { echo "Failed to change to project root"; exit 1; }

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

# プロジェクトルートを作業ディレクトリとして使用
WORK_DIR="$(pwd)"
BREAKDOWN_DIR=".agent/breakdown"
DENO_BIN_DIR=".deno/bin"
BREAKDOWN_BIN="${DENO_BIN_DIR}/breakdown"

# .deno/binディレクトリの作成と確認
echo "バイナリディレクトリの確認..."
mkdir -p "${DENO_BIN_DIR}" || handle_error "バイナリディレクトリの作成に失敗しました"

# バイナリの存在確認
if [ ! -f "${BREAKDOWN_BIN}" ]; then
    echo "❌ breakdownバイナリが見つかりません: ${BREAKDOWN_BIN}"
    echo "先に ./02_compile.sh を実行してください。"
    exit 1
fi

# breakdown initの実行
echo "breakdown initの実行..."
FAILED_COMMAND="./${BREAKDOWN_BIN} init"
$FAILED_COMMAND || handle_error "breakdown initの実行に失敗しました"

# 作成されたディレクトリとファイルの確認
echo "作成されたディレクトリとファイルの確認..."

# 設定ファイルの確認
if [ ! -f "${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml" ]; then
    echo "❌ 設定ファイルが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml"
    exit 1
fi

# プロンプトディレクトリの確認
if [ ! -d "${WORK_DIR}/${BREAKDOWN_DIR}/prompts" ]; then
    echo "❌ プロンプトディレクトリが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/prompts"
    exit 1
fi

# スキーマディレクトリの確認
if [ ! -d "${WORK_DIR}/${BREAKDOWN_DIR}/schema" ]; then
    echo "❌ スキーマディレクトリが作成されていません: ${WORK_DIR}/${BREAKDOWN_DIR}/schema"
    exit 1
fi

echo "✓ 初期化が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}"
echo "設定ファイル: ${WORK_DIR}/${BREAKDOWN_DIR}/config/app.yml"
echo "プロンプトディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}/prompts"
echo "スキーマディレクトリ: ${WORK_DIR}/${BREAKDOWN_DIR}/schema"

# サンプル入力ファイルの自動生成
TMP_EXAMPLES_DIR="$PWD/examples/tmp/examples"
mkdir -p "$TMP_EXAMPLES_DIR/project"
mkdir -p "$TMP_EXAMPLES_DIR/issue"
mkdir -p "$TMP_EXAMPLES_DIR/tasks"
mkdir -p "$TMP_EXAMPLES_DIR/test_results"

cat > "$TMP_EXAMPLES_DIR/project/project_summary.md" <<EOF
# サンプルプロジェクトサマリー
- 概要: これはサンプルプロジェクトサマリーです。
EOF

cat > "$TMP_EXAMPLES_DIR/issue/issue.md" <<EOF
# サンプル課題
- 詳細: これはサンプル課題です。
EOF

cat > "$TMP_EXAMPLES_DIR/test_results/test_results.txt" <<EOF
テスト結果: すべて成功
EOF

echo -e "\n✓ すべての初期化処理が正常に完了しました。" 