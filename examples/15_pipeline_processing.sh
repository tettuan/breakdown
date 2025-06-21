#!/bin/bash
# Example 19: Pipeline Processing
# 複数のbreakdownコマンドを連携させたパイプライン処理

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Pipeline Processing Example ==="
echo "複数のコマンドを組み合わせた実践的な処理フロー"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
fi

# Create output directory
OUTPUT_DIR="./output/pipeline"
mkdir -p "$OUTPUT_DIR"

# Example 1: Git差分から変更サマリーを生成
echo "=== Example 1: Git差分からの変更サマリー ==="
if [ -d ../.git ]; then
    echo "最近のコミットメッセージから変更サマリーを生成:"
    git log --oneline -10 | grep -E "(feat|fix|refactor):" | head -5 > "$OUTPUT_DIR/recent_commits.txt"
    cat "$OUTPUT_DIR/recent_commits.txt" | $BREAKDOWN summary -o="$OUTPUT_DIR/git_summary.md"
    echo "✅ Git変更サマリー生成完了: $OUTPUT_DIR/git_summary.md"
else
    echo "⚠️  Gitリポジトリではないためスキップ"
fi

# Example 2: 複数ファイルの集約処理
echo
echo "=== Example 2: 複数ファイルの集約処理 ==="
# サンプルファイルを作成
for i in 1 2 3; do
    cat > "$OUTPUT_DIR/module_$i.md" << EOF
# Module $i
- Feature $i-A implemented
- Bug $i-B fixed
- Performance improvement $i-C
EOF
done

echo "複数のモジュールドキュメントを集約:"
cat "$OUTPUT_DIR/module_"*.md | $BREAKDOWN summary \
    --uv-project_name="統合モジュール" \
    -o="$OUTPUT_DIR/modules_summary.md"
echo "✅ モジュール統合サマリー生成完了"

# Example 3: エラーログの段階的分析
echo
echo "=== Example 3: エラーログの段階的分析 ==="
cat > "$OUTPUT_DIR/error.log" << 'EOF'
2024-01-20 10:15:23 ERROR [AuthService] Token validation failed: JWT expired
2024-01-20 10:15:24 ERROR [Database] Connection timeout after 30s
2024-01-20 10:15:25 ERROR [API] Rate limit exceeded for user: user123
2024-01-20 10:16:00 ERROR [Cache] Redis connection refused
2024-01-20 10:16:15 ERROR [AuthService] Invalid refresh token
EOF

echo "Step 1: エラーログから欠陥分析"
cat "$OUTPUT_DIR/error.log" | $BREAKDOWN defect -o="$OUTPUT_DIR/defect_analysis.md"

echo "Step 2: 欠陥分析からイシュー生成"
$BREAKDOWN issue --from="$OUTPUT_DIR/defect_analysis.md" -o="$OUTPUT_DIR/error_issues.md"

echo "✅ エラーログ分析パイプライン完了"

# Example 4: findコマンドとの連携
echo
echo "=== Example 4: findコマンドとの連携 ==="
echo "READMEファイルを検索して統合ドキュメント作成:"
find . -name "README*.md" -type f | head -3 | while read file; do
    echo "Processing: $file"
    echo "# $(basename "$file")" >> "$OUTPUT_DIR/all_readmes.md"
    cat "$file" | head -20 >> "$OUTPUT_DIR/all_readmes.md"
    echo -e "\n---\n" >> "$OUTPUT_DIR/all_readmes.md"
done

if [ -f "$OUTPUT_DIR/all_readmes.md" ]; then
    $BREAKDOWN summary --from="$OUTPUT_DIR/all_readmes.md" \
        -o="$OUTPUT_DIR/readme_summary.md"
    echo "✅ README統合サマリー生成完了"
fi

# Example 5: プロセス置換の使用
echo
echo "=== Example 5: プロセス置換でのリアルタイム処理 ==="
echo "2つの異なる入力を同時に処理:"

# 仮想的なシステム状態レポート
echo "システム状態の差分分析:"
$BREAKDOWN summary <(echo "CPU: 80%, Memory: 4GB, Disk: 50%") \
    --uv-report_type="システム状態" \
    -o="$OUTPUT_DIR/system_status.md"

echo "✅ プロセス置換処理完了"

# Display results summary
echo
echo "=== 生成されたファイル一覧 ==="
ls -la "$OUTPUT_DIR"/*.md 2>/dev/null | grep -v "^d"

echo
echo "=== パイプライン処理のメリット ==="
echo "1. 複数の処理を自動化"
echo "2. 中間ファイルの自動生成と連携"
echo "3. UNIXツールとの柔軟な組み合わせ"
echo "4. 大規模データの効率的な処理"

echo
echo "=== Pipeline Processing Example Completed ==="