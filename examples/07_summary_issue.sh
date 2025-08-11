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

# Create required template file for this CLI command
echo "Creating required template for: breakdown to issue --input=task"
mkdir -p .agent/climpt/prompts/to/issue

# This command needs: prompts/to/issue/f_task.md (because --input=task)
cat > ".agent/climpt/prompts/to/issue/f_task.md" << 'EOF'
# Issue Summary from Task Input

## Input Tasks
{{input_text}}

## Issue Analysis
Transform the task list into structured issues:

1. **Issue Identification**: Group related tasks into logical issues
2. **Priority Assessment**: Evaluate urgency and importance
3. **Dependencies**: Identify blocking relationships
4. **Resource Requirements**: Estimate effort and skills needed

## Output Format
Create organized issues with clear titles, descriptions, and acceptance criteria.
EOF

echo "✓ Created template: prompts/to/issue/f_task.md"

# Also create f_default.md if it doesn't exist
if [ ! -f ".agent/climpt/prompts/to/issue/f_default.md" ]; then
    cp ".agent/climpt/prompts/to/issue/f_task.md" ".agent/climpt/prompts/to/issue/f_default.md"
    echo "✓ Created template: prompts/to/issue/f_default.md"
fi
echo

# Test both methods: --from and STDIN redirect
echo "=== Method 1: Using --from option ==="
echo "実行コマンド:"
echo "breakdown to issue --config=default --from=\"$OUTPUT_DIR/messy_tasks.md\" -o=\"$OUTPUT_DIR/issues_from.md\""
echo

if echo "" | timeout 30 $BREAKDOWN to issue --config=default --from="$OUTPUT_DIR/messy_tasks.md" -o="$OUTPUT_DIR/issues_from.md" > "$OUTPUT_DIR/prompt_with_from.txt" 2>&1; then
    echo "✅ --from option worked!"
    echo "Generated prompt shows:"
    head -20 "$OUTPUT_DIR/prompt_with_from.txt"
else
    echo "⚠️ --from option had issues"
fi

echo
echo "=== Method 2: Using both --from and STDIN ==="
echo "実行コマンド:"
echo "cat \$OUTPUT_DIR/messy_tasks.md | breakdown to issue --config=default --from=\"\$OUTPUT_DIR/messy_tasks.md\" -o=\"\$OUTPUT_DIR/issues_both.md\""
echo

if cat "$OUTPUT_DIR/messy_tasks.md" | timeout 30 $BREAKDOWN to issue --config=default --from="$OUTPUT_DIR/messy_tasks.md" -o="$OUTPUT_DIR/issues_both.md" > "$OUTPUT_DIR/prompt_with_both.txt" 2>&1; then
    echo "✅ Both --from and STDIN worked!"
    echo "Generated prompt shows both variables:"
    grep -E "Input File:|Input Content:" "$OUTPUT_DIR/prompt_with_both.txt" | head -5
else
    echo "⚠️ Combined method had issues"
fi

echo
echo "=== Method 3: Using STDIN redirect only ==="
echo "実行コマンド:"
echo "breakdown to issue --config=default < $OUTPUT_DIR/messy_tasks.md"
echo

# Capture prompt to stdout and save to file
echo "Attempting to generate prompt..."
if timeout 30 $BREAKDOWN to issue --config=default < "$OUTPUT_DIR/messy_tasks.md" > "$OUTPUT_DIR/summary_issue_prompt.txt" 2>&1; then
    echo "✅ Generated 'summary issue' prompt successfully!"
    echo
    echo "プロンプトファイル:"
    echo "  $OUTPUT_DIR/summary_issue_prompt.txt"
    echo "参照出力パス (プロンプト内):"
    echo "  $OUTPUT_DIR/issue_summary.md"
    echo
    if [ -f "$OUTPUT_DIR/summary_issue_prompt.txt" ] && [ -s "$OUTPUT_DIR/summary_issue_prompt.txt" ]; then
        echo "=== 生成されたプロンプト（先頭20行）==="
        head -20 "$OUTPUT_DIR/summary_issue_prompt.txt"
        echo "..."
        echo
        echo "Note: プロンプト内の{input_text}などの変数はAIが処理時に置換されます"
    else
        echo "⚠️  プロンプトファイルが空または存在しません"
        if [ -f "$OUTPUT_DIR/summary_issue_prompt.txt" ]; then
            echo "Error output:"
            cat "$OUTPUT_DIR/summary_issue_prompt.txt"
        fi
    fi
else
    echo "❌ Failed to generate summary issue prompt (exit code: $?)"
    if [ -f "$OUTPUT_DIR/summary_issue_prompt.txt" ]; then
        echo "Error details:"
        cat "$OUTPUT_DIR/summary_issue_prompt.txt"
    fi
    exit 1
fi

echo
echo "=== Summary Issue Example Completed ==="