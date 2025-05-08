#!/bin/bash
set -e

# 03a_init_deno_run.sh: Run breakdown init using deno run directly (not the compiled binary)

# Print current directory before any operation
echo "[DEBUG] Before cd: CWD is $(pwd)"

WORKDIR=$(cd "$(dirname "$0")" && pwd)
cd "$WORKDIR"
echo "[DEBUG] After cd: CWD is $(pwd)"

echo "=== breakdown作業環境の初期化 (deno run版) ==="
echo "deno run -A ../cli/breakdown.ts init の実行..."

deno run -A ../cli/breakdown.ts init

echo "作成されたディレクトリとファイルの確認..."
if [ -d .agent/breakdown ]; then
  echo "✓ 初期化が完了しました"
  echo "作業ディレクトリ: $WORKDIR/.agent/breakdown"
  echo "設定ファイル: $WORKDIR/.agent/breakdown/config/app.yml"
  echo "プロンプトディレクトリ: $WORKDIR/.agent/breakdown/prompts"
  echo "スキーマディレクトリ: $WORKDIR/.agent/breakdown/schemas"
else
  echo "✗ 初期化ディレクトリが見つかりません"
  exit 1
fi 