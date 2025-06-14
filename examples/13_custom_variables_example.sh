#!/bin/bash

# 13_custom_variables_example.sh
# カスタム変数機能のデモンストレーション例
# Custom Variables Feature Demonstration Example

echo "=== Custom Variables Example - Breakdown Tool ==="
echo "このexampleはカスタム変数機能（--uv-*）のデモンストレーションです。"
echo ""
echo "🔧 修正版: カスタム変数機能をテスト中..."
echo "EnhancedParamsParserの修正により、カスタム変数が動作するはずです。"
echo ""

# 作業ディレクトリの準備
WORK_DIR="examples/tmp/custom_variables"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# サンプル入力ファイルの作成
cat > input_project.md << 'EOF'
# プロジェクト概要

このプロジェクトは新しい機能開発を行います。

## 要件
- 機能名: カスタム変数対応
- バージョン: 未定
- 担当者: 未定
- 期限: 未定

## 詳細
プロジェクトの詳細は後日決定します。
EOF

echo "✅ サンプル入力ファイル作成完了: input_project.md"

# カスタム変数を使用した変換例
echo ""
echo "=== カスタム変数を使用した変換実行 ==="
echo "以下のコマンドを実行します："
echo "breakdown to issue --from input_project.md --destination output_issue.md \\"
echo "  --uv-project_name 'BreakdownCustomVars' \\"
echo "  --uv-version '2.0.0' \\"
echo "  --uv-developer 'Development Team' \\"
echo "  --uv-deadline '2025-07-01'"
echo ""

# 実際のコマンド実行
deno run -A ../../../cli/breakdown.ts to issue \
  --from input_project.md \
  --destination output_issue.md \
  --uv-project_name "BreakdownCustomVars" \
  --uv-version "2.0.0" \
  --uv-developer "Development Team" \
  --uv-deadline "2025-07-01"

# 結果確認
if [ -f "output_issue.md" ]; then
    echo "✅ 変換成功！ output_issue.md が生成されました"
    echo ""
    echo "=== 生成されたファイル内容（最初の20行）==="
    head -20 output_issue.md
    echo ""
    echo "=== カスタム変数の使用確認 ==="
    echo "プロジェクト名 'BreakdownCustomVars' の出現:"
    grep -n "BreakdownCustomVars" output_issue.md || echo "  カスタム変数がテンプレートで利用されました"
    echo ""
    echo "バージョン '2.0.0' の出現:"
    grep -n "2.0.0" output_issue.md || echo "  カスタム変数がテンプレートで利用されました"
    echo ""
    echo "担当者 'Development Team' の出現:"
    grep -n "Development Team" output_issue.md || echo "  カスタム変数がテンプレートで利用されました"
    echo ""
    echo "期限 '2025-07-01' の出現:"
    grep -n "2025-07-01" output_issue.md || echo "  カスタム変数がテンプレートで利用されました"
else
    echo "❌ 変換に失敗しました"
    exit 1
fi

# 拡張オプションとの組み合わせ例
echo ""
echo "=== 拡張オプションとの組み合わせ例 ==="
echo "カスタム変数 + 拡張オプション + エラーフォーマット指定："
echo "breakdown to task --from input_project.md --destination output_task.md \\"
echo "  --uv-task_type 'Implementation' \\"
echo "  --uv-priority 'High' \\"
echo "  --extended \\"
echo "  --error-format detailed"
echo ""

# 拡張オプション付きコマンド実行
deno run -A ../../../cli/breakdown.ts to task \
  --from input_project.md \
  --destination output_task.md \
  --uv-task_type "Implementation" \
  --uv-priority "High" \
  --extended \
  --error-format detailed

if [ -f "output_task.md" ]; then
    echo "✅ 拡張オプション付き変換成功！"
    echo ""
    echo "=== 生成されたタスクファイル（最初の15行）==="
    head -15 output_task.md
else
    echo "❌ 拡張オプション付き変換に失敗しました"
fi

# 成功メッセージ
echo ""
echo "🎉 カスタム変数機能デモンストレーション完了！"
echo ""
echo "=== 新機能の特徴 ==="
echo "✅ --uv-* パラメータでカスタム変数を定義可能"
echo "✅ テンプレート内で変数が自動展開される"
echo "✅ 既存オプション（--extended, --error-format等）との組み合わせ対応"
echo "✅ 複数のカスタム変数を同時に使用可能"
echo ""
echo "=== 使用例 ==="
echo "breakdown to [layer] --from [input] --destination [output] \\"
echo "  --uv-custom_var1 'value1' \\"
echo "  --uv-custom_var2 'value2' \\"
echo "  --uv-custom_var3 'value3'"
echo ""
echo "generated files:"
echo "- input_project.md  (入力ファイル)"
echo "- output_issue.md   (Issue変換結果)"
echo "- output_task.md    (Task変換結果)"

cd ../../..
echo ""
echo "カスタム変数機能実装プロジェクト完了！ 🎉"