#!/bin/bash
# Example 18: Custom Variables and Adaptation
# カスタム変数(--uv-*)とadaptationオプションの実践例

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Custom Variables Example ==="
echo "プロジェクト固有の変数を使用してカスタマイズされたプロンプトを生成"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
fi

# Create output directory
OUTPUT_DIR="./output/custom_variables"
mkdir -p "$OUTPUT_DIR"

# Example 1: カスタム変数を使用したプロジェクト生成
echo "=== Example 1: カスタム変数でのプロジェクト生成 ==="
cat > "$OUTPUT_DIR/project_brief.md" << 'EOF'
# ECサイトリニューアルプロジェクト

モダンなECサイトを構築し、ユーザー体験を向上させる。
モバイルファーストで、高速なパフォーマンスを実現する。
EOF

echo "実行コマンド:"
echo 'breakdown to project \
  --from=project_brief.md \
  --uv-company_name="テックコーポレーション" \
  --uv-project_name="ECサイトリニューアル" \
  --uv-tech_stack="Next.js, TypeScript, Prisma" \
  --uv-team_size="5名" \
  --uv-deadline="2024年3月末" \
  --uv-budget="500万円" \
  -o=custom_project.md'
echo

$BREAKDOWN to project \
  --from="$OUTPUT_DIR/project_brief.md" \
  --uv-company_name="テックコーポレーション" \
  --uv-project_name="ECサイトリニューアル" \
  --uv-tech_stack="Next.js, TypeScript, Prisma" \
  --uv-team_size="5名" \
  --uv-deadline="2024年3月末" \
  --uv-budget="500万円" \
  -o="$OUTPUT_DIR/custom_project.md"

echo "✅ カスタム変数を使用したプロジェクトドキュメント生成完了"

# Example 2: Adaptationオプションの使用
echo
echo "=== Example 2: Adaptationオプションでのカスタマイズ ==="
cat > "$OUTPUT_DIR/feature_request.md" << 'EOF'
# 新機能要求

## ユーザーダッシュボード
- リアルタイムデータ表示
- カスタマイズ可能なウィジェット
- エクスポート機能

## 通知システム
- プッシュ通知
- メール通知
- アプリ内通知
EOF

echo "実行コマンド:"
echo 'breakdown summary task \
  --from=feature_request.md \
  --adaptation="agile" \
  --uv-sprint_length="2週間" \
  --uv-story_point_scale="フィボナッチ数列" \
  -o=agile_tasks.md'
echo

$BREAKDOWN summary task \
  --from="$OUTPUT_DIR/feature_request.md" \
  --adaptation="agile" \
  --uv-sprint_length="2週間" \
  --uv-story_point_scale="フィボナッチ数列" \
  -o="$OUTPUT_DIR/agile_tasks.md"

echo "✅ Adaptationオプションでアジャイル形式のタスク生成完了"

# Example 3: 複数のカスタム変数とSTDIN
echo
echo "=== Example 3: パイプラインでのカスタム変数使用 ==="
echo "システム要件:
- 高可用性
- スケーラブル
- セキュア" | $BREAKDOWN to issue \
  --from=- \
  --uv-system_type="マイクロサービス" \
  --uv-deployment="Kubernetes" \
  --uv-monitoring="Prometheus + Grafana" \
  --uv-security_level="PCI-DSS準拠" \
  -o="$OUTPUT_DIR/system_issue.md"

echo "✅ STDINとカスタム変数の組み合わせ完了"

# Display results
echo
echo "=== 生成されたファイル ==="
ls -la "$OUTPUT_DIR"/*.md

echo
echo "=== カスタムプロジェクトの内容（抜粋）==="
if [ -f "$OUTPUT_DIR/custom_project.md" ]; then
    head -20 "$OUTPUT_DIR/custom_project.md"
fi

echo
echo "=== Tips ==="
echo "1. --uv-* でプロジェクト固有の変数を定義"
echo "2. プロンプトテンプレート内で {{userName}} のように使用"
echo "3. --adaptation でプロンプトの適応スタイルを指定"
echo "4. 複数の変数を組み合わせて高度なカスタマイズが可能"

echo
echo "=== Custom Variables Example Completed ==="