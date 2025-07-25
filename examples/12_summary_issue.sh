#!/bin/bash
# Example 16: Summary Issue - 散らかったタスクからイシューサマリーを作成
# summary issue コマンドのデモンストレーション

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Summary Issue Example ==="
echo "散らかったタスクリストからイシューサマリーを生成します"
echo

# Always use deno run for consistent path resolution
BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"

# Create output directory
OUTPUT_DIR="./output/summary_issue"
mkdir -p "$OUTPUT_DIR"

# Create a sample task list
cat > "$OUTPUT_DIR/messy_tasks.md" << 'EOF'
# 開発タスクメモ

- ユーザー認証の実装が必要
- データベース接続エラーの修正
- APIエンドポイントの追加
  - GET /api/users
  - POST /api/users
  - PUT /api/users/:id
- フロントエンドのレスポンシブ対応
- テストカバレッジを80%以上に
- CI/CDパイプラインの構築
- ドキュメントの更新
- パフォーマンスチューニング
- セキュリティ脆弱性の対処

バックログ:
- 多言語対応
- ダークモード実装
- PWA対応

緊急度高:
- 本番環境のメモリリーク
- ログイン時のセッション管理バグ
EOF

echo "入力ファイル: $OUTPUT_DIR/messy_tasks.md"
echo "処理中..."
echo

# Run summary issue command
echo "実行コマンド:"
echo "breakdown summary issue --config=default --from=$OUTPUT_DIR/messy_tasks.md --input=task -o=$OUTPUT_DIR/issue_summary.md > $OUTPUT_DIR/issue_summary.md"
echo

if $BREAKDOWN summary issue --config=default --from="$OUTPUT_DIR/messy_tasks.md" --input=task -o="$OUTPUT_DIR/issue_summary.md" > "$OUTPUT_DIR/issue_summary.md"; then
    echo "✅ Issue summary created successfully!"
    echo
    echo "生成されたファイル:"
    echo "  $OUTPUT_DIR/issue_summary.md"
    echo
    if [ -f "$OUTPUT_DIR/issue_summary.md" ]; then
        echo "=== 生成されたイシューサマリー（先頭20行）==="
        head -20 "$OUTPUT_DIR/issue_summary.md"
        echo "..."
    fi
else
    echo "❌ Failed to create issue summary"
    exit 1
fi

echo
echo "=== Summary Issue Example Completed ==="