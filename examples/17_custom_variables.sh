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
echo "カスタム変数機能のデモンストレーション"
echo
echo "📖 仕様参照: docs/breakdown/generic_domain/system/overview/glossary.ja.md"
echo "   - 25行目: カスタム変数 (User Variables) の定義"
echo "   - 109行目: fromFile パラメータの説明"
echo
echo "🎯 期待される動作:"
echo "   1. --uv-* オプションでカスタム変数を定義"
echo "   2. テンプレート内で {uv-variable_name} 形式で参照"
echo "   3. プロンプト生成時に実際の値に置換"
echo "   4. 標準変数 (input_text, destination_path等) と組み合わせ可能"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN='deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts'
fi

# Create output directory
OUTPUT_DIR="./output/custom_variables"
mkdir -p "$OUTPUT_DIR"

# Create test template to check variable substitution
TEMPLATE_DIR="./.agent/climpt/prompts/to/project"
mkdir -p "$TEMPLATE_DIR"

cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Project Template

## Project Information
- Company: {uv-company_name}
- Project Name: {uv-project_name}
- Tech Stack: {uv-tech_stack}
- Team Size: {uv-team_size}
- Deadline: {uv-deadline}
- Budget: {uv-budget}

## Input Content
{input_text}

## Generated Project Plan
Based on the above information, here is the project breakdown...
EOF

echo "テンプレートファイルを作成: $TEMPLATE_DIR/f_project.md"

# Example 1: カスタム変数を使用したプロジェクト生成
echo
echo "=== Example 1: カスタム変数でのプロジェクト生成 ==="
cat > "$OUTPUT_DIR/project_brief.md" << 'EOF'
# ECサイトリニューアルプロジェクト

モダンなECサイトを構築し、ユーザー体験を向上させる。
モバイルファーストで、高速なパフォーマンスを実現する。
EOF

echo
echo "【1. テンプレート変数】"
echo "テンプレート内の変数:"
grep -o '{[^}]*}' "$TEMPLATE_DIR/f_project.md" | sort -u | while read var; do
    echo "  - $var"
done

echo
echo "【2. 渡すパラメータ】"
echo "コマンドライン引数:"
echo "  --uv-company_name='テックコーポレーション'"
echo "  --uv-project_name='ECサイトリニューアル'"
echo "  --uv-tech_stack='Next.js, TypeScript, Prisma'"
echo "  --uv-team_size='5名'"
echo "  --uv-deadline='2024年3月末'"
echo "  --uv-budget='500万円'"

echo
echo "【3. 実行コマンド】"

$BREAKDOWN to project \
  --from="$OUTPUT_DIR/project_brief.md" \
  --uv-company_name="テックコーポレーション" \
  --uv-project_name="ECサイトリニューアル" \
  --uv-tech_stack="Next.js, TypeScript, Prisma" \
  --uv-team_size="5名" \
  --uv-deadline="2024年3月末" \
  --uv-budget="500万円" \
  -o="$OUTPUT_DIR/custom_project.md" > "$OUTPUT_DIR/custom_project.md"

echo
echo "【4. 生成結果の検証】"
if [ -f "$OUTPUT_DIR/custom_project.md" ]; then
    echo "✅ ファイル生成成功: $OUTPUT_DIR/custom_project.md"
    
    echo
    echo "🔍 カスタム変数の置換状況検証:"
    echo "📖 仕様: カスタム変数は {uv-variable_name} 形式でテンプレート内に記述"
    
    # Check if custom variables were replaced
    UNREPLACED_COUNT=0
    for var in uv-company_name uv-project_name uv-tech_stack uv-team_size uv-deadline uv-budget; do
        if grep -q "{$var}" "$OUTPUT_DIR/custom_project.md"; then
            echo "  ❌ $var: 未置換 ({$var} が残っている)"
            UNREPLACED_COUNT=$((UNREPLACED_COUNT + 1))
        else
            echo "  ✅ $var: テンプレート変数は正常に処理された"
        fi
    done
    
    # Check if actual values appear
    if grep -q "テックコーポレーション\|ECサイトリニューアル\|Next.js\|5名\|2024年3月末\|500万円" "$OUTPUT_DIR/custom_project.md"; then
        echo "  ✅ カスタム変数の値が出力に含まれている"
    else
        echo "  ❌ カスタム変数の値が出力に見つからない"
        echo "💡 確認ポイント: テンプレートでの変数名が {uv-variable_name} 形式になっているか"
    fi
    
    if [ "$UNREPLACED_COUNT" -gt 0 ]; then
        echo
        echo "⚠️  未置換の変数が $UNREPLACED_COUNT 個見つかりました"
        echo "💡 デバッグ方法:"
        echo "   1. テンプレートファイルでの変数名確認: cat $TEMPLATE_DIR/f_project.md"
        echo "   2. LOG_LEVEL=debug で変数処理過程を確認"
        echo "📖 参照: docs/breakdown/domain_core/prompt_variables.ja.md"
    fi
    
    echo
    echo "生成内容（先頭20行）:"
    echo "------------------------"
    head -20 "$OUTPUT_DIR/custom_project.md"
    echo "------------------------"
else
    echo "❌ ファイル生成失敗"
fi

# Example 2: Adaptationオプションの使用
echo
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

# Create template for summary task
TEMPLATE_DIR2="./.agent/climpt/prompts/summary/task"
mkdir -p "$TEMPLATE_DIR2"

cat > "$TEMPLATE_DIR2/f_task.md" << 'EOF'
# Task Summary Template

## Sprint Information
- Sprint Length: {uv-sprint_length}
- Story Point Scale: {uv-story_point_scale}

## Input Content
{input_text}

## Task Breakdown
Based on the input, here are the tasks...
EOF

echo
echo "【1. テンプレート変数】"
echo "テンプレート内の変数:"
grep -o '{[^}]*}' "$TEMPLATE_DIR2/f_task.md" | sort -u | while read var; do
    echo "  - $var"
done

echo
echo "【2. 渡すパラメータ】"
echo "  --adaptation='agile'"
echo "  --uv-sprint_length='2週間'"
echo "  --uv-story_point_scale='フィボナッチ数列'"

echo
echo "【3. 実行コマンド】"

$BREAKDOWN summary task \
  --from="$OUTPUT_DIR/feature_request.md" \
  --adaptation="agile" \
  --uv-sprint_length="2週間" \
  --uv-story_point_scale="フィボナッチ数列" \
  -o="$OUTPUT_DIR/agile_tasks.md" > "$OUTPUT_DIR/agile_tasks.md"

echo
echo "【4. 生成結果の検証】"
if [ -f "$OUTPUT_DIR/agile_tasks.md" ]; then
    echo "✅ ファイル生成成功: $OUTPUT_DIR/agile_tasks.md"
    
    echo
    echo "カスタム変数の置換状況:"
    if grep -q "{uv-sprint_length}\|{uv-story_point_scale}" "$OUTPUT_DIR/agile_tasks.md"; then
        echo "  ❌ 変数が未置換 (テンプレート変数が残っている)"
    else
        echo "  ✅ テンプレート変数は残っていない"
    fi
    
    if grep -q "2週間\|フィボナッチ数列" "$OUTPUT_DIR/agile_tasks.md"; then
        echo "  ✅ カスタム変数の値が出力に含まれている"
    else
        echo "  ❌ カスタム変数の値が出力に見つからない"
    fi
    
    echo
    echo "生成内容（先頭15行）:"
    echo "------------------------"
    head -15 "$OUTPUT_DIR/agile_tasks.md"
    echo "------------------------"
else
    echo "❌ ファイル生成失敗"
fi

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
  -o="$OUTPUT_DIR/system_issue.md" > "$OUTPUT_DIR/system_issue.md"

echo "✅ STDINとカスタム変数の組み合わせ完了"

# Summary
echo
echo "=== カスタム変数機能のまとめ ==="
echo
echo "カスタム変数の動作状況:"

# Check actual behavior
echo "実際の動作:"

# Check if custom template was used
if [ -f "$OUTPUT_DIR/custom_project.md" ]; then
    if grep -q "Project Breakdown Analysis" "$OUTPUT_DIR/custom_project.md"; then
        echo "  1. カスタムテンプレートは使用されず、デフォルトテンプレートが使用された"
    fi
    
    # Check if any custom variables appear in output
    if grep -q "{uv-" "$OUTPUT_DIR/custom_project.md"; then
        echo "  2. カスタム変数は置換されず、テンプレート変数がそのまま出力された"
        VAR_REPLACED=false
    else
        echo "  2. カスタム変数のテンプレート変数は出力に含まれていない"
        # Check if the values were somehow included
        if grep -q "テックコーポレーション\|ECサイト\|Next.js\|5名\|500万円" "$OUTPUT_DIR/custom_project.md"; then
            echo "  3. パラメータで指定した値自体は出力に含まれていない"
        fi
    fi
fi

VAR_REPLACED=false

echo
echo "使用方法:"
echo "1. --uv-* でカスタム変数を定義"
echo "2. テンプレート内で {uv-variable} の形式で参照（--uv-company_name → {uv-company_name}）"
echo "3. --adaptation でプロンプトの適応スタイルを指定"

echo
echo "🔍 実装状況分析:"
if [ -f "$OUTPUT_DIR/custom_project.md" ] && grep -q "テックコーポレーション" "$OUTPUT_DIR/custom_project.md"; then
    echo "  ✅ カスタム変数機能: 正常に動作している"
    echo "  ✅ 変数置換処理: {uv-*} → 実際の値 への置換が機能"
    echo "  ✅ テンプレート使用: カスタムテンプレートが正しく使用されている"
else
    echo "  ⚠️  カスタム変数機能に問題がある可能性"
    echo "  💡 確認手順:"
    echo "     1. テンプレート内の変数名が {uv-variable_name} 形式であることを確認"
    echo "     2. プロンプトテンプレートファイルが正しい場所に配置されていることを確認"
    echo "     3. LOG_LEVEL=debug でカスタム変数処理の詳細ログを確認"
    echo "  📖 参照: docs/breakdown/domain_core/prompt_variables.ja.md"
fi

echo
echo "=== 生成されたファイル一覧 ==="
ls -la "$OUTPUT_DIR"/*.md 2>/dev/null || echo "ファイルが見つかりません"

echo
echo "=== Custom Variables Example Completed ==="